param(
  [string]$DeviceId = "",
  [string]$PackageName = "com.nigeriatrust.resident",
  [string]$BuildMode = "debug",
  [switch]$RebootDevice,
  [switch]$ExerciseAirplaneMode
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$MobileRoot = Join-Path $Root "apps\resident-mobile"
$ReportRoot = Join-Path $Root "reports\mobile"
$Stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ssZ")
$EvidenceDir = Join-Path $ReportRoot "flutter-validation-$Stamp"

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

function Write-Evidence {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  $Out = Join-Path $EvidenceDir "$Name.out.txt"
  $Err = Join-Path $EvidenceDir "$Name.err.txt"
  try {
    & $Command *> $Out
    Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
      name = $Name
      status = "passed"
      at = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json -Compress)
  } catch {
    $_ | Out-File -FilePath $Err
    Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
      name = $Name
      status = "failed"
      error = $_.Exception.Message
      at = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json -Compress)
    throw
  }
}

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
    name = "flutter-toolchain"
    status = "blocked"
    error = "Flutter is not installed or not on PATH."
    at = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Compress)
  Set-Content -Path (Join-Path $ReportRoot "latest-flutter-validation-dir.txt") -Value $EvidenceDir
  throw "Flutter is not installed or not on PATH. Install Flutter before Android host generation."
}

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
  Add-Content -Path (Join-Path $EvidenceDir "commands.ndjson") -Value (@{
    name = "adb-toolchain"
    status = "blocked"
    error = "ADB is not installed or not on PATH."
    at = (Get-Date).ToUniversalTime().ToString("o")
  } | ConvertTo-Json -Compress)
  Set-Content -Path (Join-Path $ReportRoot "latest-flutter-validation-dir.txt") -Value $EvidenceDir
  throw "ADB is not installed or not on PATH. Install Android platform-tools before device validation."
}

Push-Location $MobileRoot
try {
  if (-not (Test-Path (Join-Path $MobileRoot "android"))) {
    Write-Evidence "flutter-create-android-host" { flutter create --platforms=android . }
  }

  Write-Evidence "flutter-version" { flutter --version }
  Write-Evidence "flutter-doctor" { flutter doctor -v }
  Write-Evidence "flutter-pub-get" { flutter pub get }
  Write-Evidence "flutter-analyze" { flutter analyze }
  Write-Evidence "flutter-test" { flutter test }

  if ($BuildMode -eq "release") {
    Write-Evidence "flutter-build-release-apk" { flutter build apk --release }
    $ApkPath = Join-Path $MobileRoot "build\app\outputs\flutter-apk\app-release.apk"
  } else {
    Write-Evidence "flutter-build-debug-apk" { flutter build apk --debug }
    $ApkPath = Join-Path $MobileRoot "build\app\outputs\flutter-apk\app-debug.apk"
  }

  Write-Evidence "apk-sha256" { Get-FileHash -Algorithm SHA256 $ApkPath }
  Write-Evidence "adb-devices" { adb devices -l }

  if ($DeviceId -ne "") {
    $Adb = @("-s", $DeviceId)
    Write-Evidence "adb-install" { adb @Adb install -r $ApkPath }
    Write-Evidence "adb-package-permissions" { adb @Adb shell dumpsys package $PackageName }
    Write-Evidence "adb-notification-policy" { adb @Adb shell cmd notification get_approved_assistant }
    Write-Evidence "adb-battery-before" { adb @Adb shell dumpsys battery }
    Write-Evidence "adb-connectivity-before" { adb @Adb shell dumpsys connectivity }
    Write-Evidence "adb-launch-initial" { adb @Adb shell monkey -p $PackageName 1 }
    Write-Evidence "adb-force-stop" { adb @Adb shell am force-stop $PackageName }
    Write-Evidence "adb-launch-after-kill" { adb @Adb shell monkey -p $PackageName 1 }
    Write-Evidence "adb-background-restrict" { adb @Adb shell cmd appops set $PackageName RUN_IN_BACKGROUND ignore }
    Write-Evidence "adb-background-allow" { adb @Adb shell cmd appops set $PackageName RUN_IN_BACKGROUND allow }
    Write-Evidence "adb-sms-appops" { adb @Adb shell cmd appops get $PackageName SEND_SMS READ_SMS RECEIVE_SMS }
    Write-Evidence "adb-location-appops" { adb @Adb shell cmd appops get $PackageName ACCESS_FINE_LOCATION ACCESS_COARSE_LOCATION }
    Write-Evidence "adb-low-battery-simulated" { adb @Adb shell dumpsys battery set level 12 }
    Write-Evidence "adb-low-battery-state" { adb @Adb shell dumpsys battery }
    Write-Evidence "adb-battery-reset" { adb @Adb shell dumpsys battery reset }

    if ($ExerciseAirplaneMode) {
      Write-Evidence "adb-airplane-mode-enable" { adb @Adb shell cmd connectivity airplane-mode enable }
      Write-Evidence "adb-connectivity-airplane" { adb @Adb shell dumpsys connectivity }
      Write-Evidence "adb-airplane-mode-disable" { adb @Adb shell cmd connectivity airplane-mode disable }
      Write-Evidence "adb-connectivity-restored" { adb @Adb shell dumpsys connectivity }
    }

    if ($RebootDevice) {
      Write-Evidence "adb-reboot" { adb @Adb reboot }
      Start-Sleep -Seconds 35
      Write-Evidence "adb-wait-after-reboot" { adb @Adb wait-for-device }
      Write-Evidence "adb-launch-after-reboot" { adb @Adb shell monkey -p $PackageName 1 }
    }

    Write-Evidence "adb-meminfo" { adb @Adb shell dumpsys meminfo $PackageName }
    Write-Evidence "adb-batterystats" { adb @Adb shell dumpsys batterystats $PackageName }
    Write-Evidence "adb-logcat-tail" { adb @Adb logcat -d -t 500 }
  }
} finally {
  Pop-Location
}

Set-Content -Path (Join-Path $ReportRoot "latest-flutter-validation-dir.txt") -Value $EvidenceDir
Write-Output "Flutter production validation evidence: $EvidenceDir"
