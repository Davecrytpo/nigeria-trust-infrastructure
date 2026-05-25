param(
  [string]$DeviceId = ""
)

$ErrorActionPreference = "Continue"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"
$reportDir = Join-Path $repoRoot "reports\mobile\android-toolchain-$timestamp"
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
Set-Content -Path (Join-Path $repoRoot "reports\mobile\latest-android-toolchain-dir.txt") -Value $reportDir

function Write-Report {
  param([string]$Message)
  $line = "[$(Get-Date -Format o)] $Message"
  Write-Host $line
  Add-Content -Path (Join-Path $reportDir "toolchain-check.txt") -Value $line
}

function Capture-Command {
  param([string]$Name, [string]$Command)
  $output = Join-Path $reportDir "$Name.txt"
  powershell -NoProfile -Command $Command *> $output
  if ($LASTEXITCODE -eq 0) {
    Write-Report "${Name}: ok"
  } else {
    Write-Report "${Name}: failed"
  }
}

function Check-Command {
  param([string]$Name)
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) {
    Write-Report "$Name found at $($cmd.Source)"
    return $true
  }

  Write-Report "$Name missing from PATH"
  return $false
}

$hasFlutter = Check-Command "flutter"
$hasAdb = Check-Command "adb"
$hasJava = Check-Command "java"
$hasSdkManager = Check-Command "sdkmanager"

$androidHome = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "" }
if ($androidHome.Trim().Length -gt 0) {
  Write-Report "Android SDK root: $androidHome"
} else {
  Write-Report "ANDROID_HOME or ANDROID_SDK_ROOT missing; set it to the command-line SDK path"
}

if ($hasFlutter) {
  Capture-Command "flutter-version" "flutter --version"
  Capture-Command "flutter-doctor" "flutter doctor -v"
  Capture-Command "flutter-config" "flutter config"
}

if ($hasJava) {
  Capture-Command "java-version" "java -version"
}

if ($hasSdkManager) {
  Capture-Command "android-sdk-list" "sdkmanager --list_installed"
}

if ($hasAdb) {
  Capture-Command "adb-version" "adb version"
  Capture-Command "adb-devices" "adb devices -l"

  $adbArgs = @()
  if ($DeviceId.Trim().Length -gt 0) {
    $adbArgs = @("-s", $DeviceId)
  }

  & adb @adbArgs shell getprop ro.product.model *> (Join-Path $reportDir "device-model.txt")
  & adb @adbArgs shell getprop ro.build.version.release *> (Join-Path $reportDir "device-android-version.txt")
  & adb @adbArgs shell dumpsys battery *> (Join-Path $reportDir "device-battery.txt")
  & adb @adbArgs shell dumpsys connectivity *> (Join-Path $reportDir "device-connectivity.txt")
  & adb @adbArgs shell settings get global airplane_mode_on *> (Join-Path $reportDir "device-airplane-mode.txt")
}

if ($hasFlutter -and $hasAdb -and $hasJava -and $hasSdkManager -and $androidHome.Trim().Length -gt 0) {
  Write-Report "ready for USB APK attempt"
  exit 0
}

Write-Report "not ready for APK generation with command-line Android SDK"
exit 1
