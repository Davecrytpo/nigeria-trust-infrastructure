# Android Deployment Preparation

This document prepares physical-device validation. It does not claim Android readiness.

## Lightweight Physical-Device Build Flow

For 4GB RAM machines, prefer a physical USB Android phone and the command-line Android SDK. Do not require Android Studio or an emulator for the first pilot pass.

```powershell
npm run mobile:toolchain
adb devices
npm run mobile:usb-apk:fast
```

If the first phone threshold is blocked only by local test runtime on a low-spec laptop, use:

```powershell
.\scripts\mobile\build-usb-apk.ps1 -Mode debug -Install -SkipTests
```

Then rerun without `-SkipTests` before promoting any APK beyond local USB validation.

Use profile mode for real-device startup and memory evidence:

```powershell
npm run mobile:usb-apk:profile
```

Use release mode only for a pilot candidate:

```powershell
npm run mobile:usb-apk:release
```

Use size mode before sending a pilot APK outside the build machine:

```powershell
npm run mobile:usb-apk:size
```

The script generates the Android host project if missing, runs `flutter pub get`, `flutter analyze` unless skipped, runs `flutter test` unless skipped, builds the APK, hashes the APK, installs it when requested, measures startup through `adb shell am start -W`, captures a screenshot, and stores runtime evidence under `reports/mobile`.

The latest USB APK evidence directory is written to:

```text
reports/mobile/latest-usb-apk-dir.txt
```

Required first-pass evidence:

- `apk-files.txt`
- `apk-sha256.txt`
- `adb-install.txt`
- `adb-startup-time.txt`
- `adb-resume-startup-time.txt`
- `launch-screenshot.png`
- `resume-screenshot.png`
- `logcat-tail.txt`
- `battery.txt`
- `connectivity.txt`
- `meminfo.txt`
- `meminfo-after-resume.txt`
- `gfxinfo.txt`

## Signed APK Build Flow

1. Confirm Flutter SDK and Android SDK are installed on the build machine.
2. Confirm the Flutter app has a generated Android host project. If missing, run `flutter create --platforms=android .` from `apps/resident-mobile` and review generated files before committing.
3. Create a release keystore outside the repository.
4. Configure signing through local Gradle properties or CI secret injection.
5. Build:

```bash
cd apps/resident-mobile
flutter clean
flutter pub get
flutter build apk --release
```

6. Record APK filename, SHA-256, signing key fingerprint, build machine, and timestamp:

```bash
sha256sum build/app/outputs/flutter-apk/app-release.apk
keytool -list -v -keystore <release-keystore-path> -alias <alias>
```

## Emulator Execution

Use emulator validation before physical-device validation, but do not treat it as field readiness.

```bash
cd apps/resident-mobile
flutter devices
flutter emulators
flutter emulators --launch <emulator-id>
flutter run --profile -d <device-id>
```

Minimum emulator profiles:

- Android Go style profile: 1-2 GB RAM, low CPU, API 29+.
- Current Android profile: API 34+ with background restrictions enabled.
- Small-screen profile: 360 x 640 class viewport.
- Low-light manual pass using device dark mode and reduced brightness.

## Physical APK Install

```bash
adb devices
adb install -r apps/resident-mobile/build/app/outputs/flutter-apk/app-release.apk
adb shell am start -W -n com.example.resident_mobile/.MainActivity
```

Replace package name with the final Android application ID after the host Android project is generated.

## Secure Config Injection

- API base URL must be injected per environment.
- Do not compile provider secrets or operator secrets into the APK.
- Device logs must redact phone numbers, tokens, and precise home locations.
- Release config must point to HTTPS only.

## Device Logging Instructions

Capture:

```bash
adb devices
adb logcat -c
adb logcat > reports/mobile/android-logcat-<device>-<timestamp>.txt
```

Capture device state:

```bash
adb shell dumpsys battery > reports/mobile/battery-<device>-<timestamp>.txt
adb shell dumpsys connectivity > reports/mobile/connectivity-<device>-<timestamp>.txt
adb shell dumpsys location > reports/mobile/location-<device>-<timestamp>.txt
```

Screenshots:

```bash
adb exec-out screencap -p > reports/mobile/screenshot-<device>-<timestamp>.png
```

## Android Test Matrix

- Offline encrypted queue durability.
- Airplane-mode incident creation.
- Network restore replay.
- Duplicate replay suppression.
- App-kill recovery.
- Device reboot persistence.
- Low battery and battery saver behavior.
- GPS disabled, weak GPS, and coarse-location fallback.
- Background execution restriction behavior.
- SMS fallback activation.

## App-Kill Recovery Validation

1. Start an SOS in online mode and confirm the local queue row is written before upload.
2. Force-stop during upload:

```bash
adb shell am force-stop <package-name>
adb shell monkey -p <package-name> 1
```

3. Confirm interrupted rows return to `pending` and replay on app restart.
4. Repeat in airplane mode, then restore network and confirm a single server incident is created.
5. Capture queue counts before and after replay in the readiness dossier.

## Background Restrictions Validation

Run each scenario on normal battery, battery saver, and restricted app battery mode.

```bash
adb shell dumpsys deviceidle force-idle
adb shell dumpsys deviceidle unforce
adb shell cmd appops set <package-name> RUN_IN_BACKGROUND ignore
adb shell cmd appops set <package-name> RUN_IN_BACKGROUND allow
```

Expected behavior:

- SOS creation must persist locally even if background network work is blocked.
- UI must keep SMS fallback visible when sync is degraded.
- Location updates must degrade in ultra-low-battery mode instead of draining the device.
- No validation pass is accepted without logcat, battery, connectivity, and queue evidence.

## Battery Optimization Guidance

- Test with normal mode and battery saver mode.
- Record battery drop over a fixed validation window.
- Record whether Android restricts background tasks.
- Do not request broad exemption as a readiness shortcut; document observed OS behavior.
- Validate the resident UI remains usable below 15% battery with reduced animation and low-frequency location updates.
- Record CPU, memory, and network use during a 30-minute standby and a 10-minute active incident.

```bash
adb shell dumpsys batterystats --reset
adb shell dumpsys meminfo <package-name>
adb shell top -b -n 1 | grep <package-name>
adb shell dumpsys batterystats <package-name> > reports/mobile/batterystats-<device>-<timestamp>.txt
```

## Connectivity Scenarios

- Wi-Fi only.
- Mobile data only.
- No network for 5, 15, and 60 minutes.
- Captive portal or DNS failure.
- Weak signal transition.
- Server reachable but telecom webhook delayed.

## Offline-to-Online Sync Validation

1. Enable airplane mode.
2. Trigger medical, fire, security, and silent-panic SOS flows.
3. Confirm every incident is locally queued and visible to the resident as offline/SMS fallback.
4. Disable airplane mode.
5. Trigger sync and confirm queued incidents mark `synced`.
6. Confirm duplicate suppression by replaying the same `clientMutationId`.
7. Capture server incident IDs and queue status counts.

After each scenario, run:

```bash
npm run mobile:capture-validation -- --device-id=<id> --model=<model> --android-version=<version> --network-profile=<profile> --app-kill-recovery --offline-replay-succeeded --duplicate-suppression-verified --failed-queue-rows=0
```
