param(
  [ValidateSet("debug", "profile", "release")]
  [string]$Mode = "debug",
  [string]$DeviceId = "",
  [string]$PackageName = "com.example.resident_mobile",
  [string]$LaunchActivity = ".MainActivity",
  [switch]$Install,
  [switch]$SkipAnalyze,
  [switch]$SkipTests,
  [switch]$AnalyzeSize
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$appRoot = Join-Path $repoRoot "apps\resident-mobile"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
$reportDir = Join-Path $repoRoot "reports\mobile\usb-apk-$timestamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
Set-Content -Path (Join-Path $repoRoot "reports\mobile\latest-usb-apk-dir.txt") -Value $reportDir

function Write-Step {
  param([string]$Name)
  $line = "[$(Get-Date -Format o)] $Name"
  Write-Host $line
  Add-Content -Path (Join-Path $reportDir "commands.log") -Value $line
}

function Run-Capture {
  param([string]$Name, [string]$Command)
  Write-Step $Name
  Push-Location $appRoot
  try {
    $outputFile = Join-Path $reportDir "$Name.txt"
    powershell -NoProfile -Command $Command *> $outputFile
    if ($LASTEXITCODE -ne 0) {
      throw "$Name failed. See $outputFile"
    }
  } finally {
    Pop-Location
  }
}

function Assert-Command {
  param([string]$Name)
  if (!(Get-Command $Name -ErrorAction SilentlyContinue)) {
    $message = "$Name is not available on PATH. Install it before APK generation."
    Write-Step $message
    Add-Content -Path (Join-Path $reportDir "missing-tools.txt") -Value $message
    throw $message
  }
}

function Ensure-LowRamGradleProperties {
  $androidRoot = Join-Path $appRoot "android"
  if (!(Test-Path $androidRoot)) {
    return
  }

  $gradleProperties = Join-Path $androidRoot "gradle.properties"
  if (!(Test-Path $gradleProperties)) {
    New-Item -ItemType File -Force -Path $gradleProperties | Out-Null
  }

  $existing = Get-Content $gradleProperties -ErrorAction SilentlyContinue
  $properties = @(
    "org.gradle.jvmargs=-Xmx1536M -XX:MaxMetaspaceSize=384M -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
    "org.gradle.daemon=false",
    "org.gradle.parallel=false",
    "org.gradle.configureondemand=true",
    "android.useAndroidX=true",
    "android.enableJetifier=false",
    "android.enableR8.fullMode=true"
  )

  foreach ($property in $properties) {
    $key = $property.Split("=")[0]
    if (!($existing | Where-Object { $_.StartsWith("$key=") })) {
      Add-Content -Path $gradleProperties -Value $property
    }
  }

  Copy-Item $gradleProperties (Join-Path $reportDir "gradle-properties.txt") -Force
}

Assert-Command "flutter"
Assert-Command "adb"
Assert-Command "java"

$env:GRADLE_OPTS = "-Xmx1536M -Dorg.gradle.daemon=false"
$env:JAVA_TOOL_OPTIONS = "-Xmx1536M"

Write-Step "Checking Flutter SDK"
flutter --version *> (Join-Path $reportDir "flutter-version.txt")
flutter doctor -v *> (Join-Path $reportDir "flutter-doctor.txt")
flutter config --no-analytics *> (Join-Path $reportDir "flutter-config.txt")

Write-Step "Checking Android device bridge"
adb version *> (Join-Path $reportDir "adb-version.txt")
adb devices *> (Join-Path $reportDir "adb-devices.txt")
Run-Capture "flutter-devices" "flutter devices"

if (!(Test-Path (Join-Path $appRoot "android"))) {
  Run-Capture "flutter-create-android" "flutter create --platforms=android ."
}

Ensure-LowRamGradleProperties

Run-Capture "flutter-pub-get" "flutter pub get"

if (!$SkipAnalyze) {
  Run-Capture "flutter-analyze" "flutter analyze"
}

if (!$SkipTests) {
  Run-Capture "flutter-test" "flutter test"
}

if ($Mode -eq "release") {
  $sizeFlag = if ($AnalyzeSize) { " --analyze-size" } else { "" }
  Run-Capture "flutter-build-release-apk" "flutter build apk --release --target-platform android-arm,android-arm64 --split-per-abi --tree-shake-icons --split-debug-info=build\symbols$sizeFlag"
  $apkRoot = Join-Path $appRoot "build\app\outputs\flutter-apk"
  Get-ChildItem $apkRoot -Filter "*.apk" | ForEach-Object {
    Get-FileHash $_.FullName -Algorithm SHA256 | Format-List | Out-File -Append (Join-Path $reportDir "apk-sha256.txt")
  }
} elseif ($Mode -eq "profile") {
  $sizeFlag = if ($AnalyzeSize) { " --analyze-size" } else { "" }
  Run-Capture "flutter-build-profile-apk" "flutter build apk --profile --target-platform android-arm64 --tree-shake-icons$sizeFlag"
  $profileApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-profile.apk"
  Get-FileHash $profileApk -Algorithm SHA256 | Format-List | Out-File (Join-Path $reportDir "apk-sha256.txt")
} else {
  Run-Capture "flutter-build-debug-apk" "flutter build apk --debug"
  $debugApk = Join-Path $appRoot "build\app\outputs\flutter-apk\app-debug.apk"
  Get-FileHash $debugApk -Algorithm SHA256 | Format-List | Out-File (Join-Path $reportDir "apk-sha256.txt")
}

$apkRoot = Join-Path $appRoot "build\app\outputs\flutter-apk"
Get-ChildItem $apkRoot -Filter "*.apk" | Select-Object Name, Length, FullName | Format-Table -AutoSize | Out-File (Join-Path $reportDir "apk-files.txt")

if ($Install) {
  $adbArgs = @()
  if ($DeviceId.Trim().Length -gt 0) {
    $adbArgs = @("-s", $DeviceId)
  }

  $apk = if ($Mode -eq "release") {
    Get-ChildItem (Join-Path $appRoot "build\app\outputs\flutter-apk") -Filter "*arm64*.apk" | Select-Object -First 1
  } elseif ($Mode -eq "profile") {
    Get-Item (Join-Path $appRoot "build\app\outputs\flutter-apk\app-profile.apk")
  } else {
    Get-Item (Join-Path $appRoot "build\app\outputs\flutter-apk\app-debug.apk")
  }

  Write-Step "Installing APK to physical USB device"
  & adb @adbArgs get-state *> (Join-Path $reportDir "adb-state.txt")
  if ($LASTEXITCODE -ne 0) {
    throw "No authorized USB Android device is available. See adb-state.txt and adb-devices.txt."
  }

  & adb @adbArgs logcat -c *> (Join-Path $reportDir "logcat-clear.txt")
  & adb @adbArgs install -r $apk.FullName *> (Join-Path $reportDir "adb-install.txt")
  if ($LASTEXITCODE -ne 0) {
    throw "APK install failed. See adb-install.txt."
  }

  $activity = "$PackageName/$LaunchActivity"
  & adb @adbArgs shell am force-stop $PackageName *> (Join-Path $reportDir "adb-force-stop-before-launch.txt")
  & adb @adbArgs shell am start -W -n $activity *> (Join-Path $reportDir "adb-startup-time.txt")
  if ($LASTEXITCODE -ne 0) {
    Write-Step "Direct activity launch failed; falling back to package monkey launch"
    & adb @adbArgs shell monkey -p $PackageName 1 *> (Join-Path $reportDir "adb-launch-monkey.txt")
  }

  Start-Sleep -Seconds 5
  & adb @adbArgs exec-out screencap -p *> (Join-Path $reportDir "launch-screenshot.png")
  & adb @adbArgs logcat -d -t 1200 *> (Join-Path $reportDir "logcat-tail.txt")
  & adb @adbArgs shell dumpsys battery *> (Join-Path $reportDir "battery.txt")
  & adb @adbArgs shell dumpsys connectivity *> (Join-Path $reportDir "connectivity.txt")
  & adb @adbArgs shell dumpsys meminfo $PackageName *> (Join-Path $reportDir "meminfo.txt")
  & adb @adbArgs shell dumpsys gfxinfo $PackageName *> (Join-Path $reportDir "gfxinfo.txt")
  & adb @adbArgs shell dumpsys package $PackageName *> (Join-Path $reportDir "package.txt")
  & adb @adbArgs shell pidof $PackageName *> (Join-Path $reportDir "pid.txt")

  Write-Step "Capturing app-kill resume evidence"
  & adb @adbArgs shell am force-stop $PackageName *> (Join-Path $reportDir "adb-force-stop-resume.txt")
  Start-Sleep -Seconds 2
  & adb @adbArgs shell am start -W -n $activity *> (Join-Path $reportDir "adb-resume-startup-time.txt")
  Start-Sleep -Seconds 5
  & adb @adbArgs exec-out screencap -p *> (Join-Path $reportDir "resume-screenshot.png")
  & adb @adbArgs shell dumpsys meminfo $PackageName *> (Join-Path $reportDir "meminfo-after-resume.txt")
  & adb @adbArgs logcat -d -t 1600 *> (Join-Path $reportDir "logcat-after-resume.txt")
}

Write-Step "Mobile APK evidence written to $reportDir"
