param(
  [string]$FlutterRoot = "C:\src\flutter",
  [string]$AndroidSdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Low-spec Windows Android setup"
Write-Host "=============================="
Write-Host ""
Write-Host "Install locations:"
Write-Host "  Flutter SDK: $FlutterRoot"
Write-Host "  Android SDK: $AndroidSdkRoot"
Write-Host ""
Write-Host "1. Download and extract Flutter SDK for Windows:"
Write-Host "  $FlutterRoot"
Write-Host ""
Write-Host "2. Download Android command-line tools only and extract so sdkmanager exists at:"
Write-Host "  $AndroidSdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"
Write-Host ""
Write-Host "3. Add these user environment variables:"
Write-Host "  ANDROID_HOME=$AndroidSdkRoot"
Write-Host "  ANDROID_SDK_ROOT=$AndroidSdkRoot"
Write-Host ""
Write-Host "4. Add these paths to the user PATH:"
Write-Host "  $FlutterRoot\bin"
Write-Host "  $AndroidSdkRoot\cmdline-tools\latest\bin"
Write-Host "  $AndroidSdkRoot\platform-tools"
Write-Host ""
Write-Host "5. Restart PowerShell, then run:"
Write-Host '  sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"'
Write-Host "  flutter doctor --android-licenses"
Write-Host "  npm run mobile:toolchain"
Write-Host "  npm run mobile:usb-apk:fast"
Write-Host ""
Write-Host "Current local checks:"

$checks = @(
  @{ Name = "flutter"; Path = "$FlutterRoot\bin\flutter.bat" },
  @{ Name = "sdkmanager"; Path = "$AndroidSdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" },
  @{ Name = "adb"; Path = "$AndroidSdkRoot\platform-tools\adb.exe" }
)

foreach ($check in $checks) {
  if (Test-Path $check.Path) {
    Write-Host "  OK $($check.Name): $($check.Path)"
  } else {
    Write-Host "  MISSING $($check.Name): $($check.Path)"
  }
}

Write-Host ""
Write-Host "Do not install Android Studio or an emulator for the first physical APK pass."
