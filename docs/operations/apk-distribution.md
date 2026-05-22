# Android APK Distribution

This document is for controlled pilot distribution only. It does not authorize public release.

## Versioning

- Use semantic app version plus Android build number: `major.minor.patch+build`.
- Increment `version` in `apps/resident-mobile/pubspec.yaml` for every APK handed to a tester.
- Record the APK filename, version, build mode, signing key fingerprint, SHA-256 checksum, tester group, and install date in `reports/mobile`.

## Build Flavors

Use three release channels:

- `dev`: local emulator and engineering devices.
- `pilot`: supervised field pilot devices with production-like API endpoints.
- `prod`: live production endpoint, signed with release key, distributed only after runtime and telecom evidence passes.

When the Android host project is generated, configure Gradle product flavors:

```gradle
flavorDimensions "environment"
productFlavors {
    dev {
        dimension "environment"
        applicationIdSuffix ".dev"
        versionNameSuffix "-dev"
    }
    pilot {
        dimension "environment"
        applicationIdSuffix ".pilot"
        versionNameSuffix "-pilot"
    }
    prod {
        dimension "environment"
    }
}
```

## Signing Scaffold

Keep keystores outside the repository.

Expected local files:

- `%USERPROFILE%\.nti-android\resident-upload-keystore.jks`
- `apps/resident-mobile/android/key.properties`

Example `key.properties`:

```properties
storeFile=C:\\Users\\USER\\.nti-android\\resident-upload-keystore.jks
storePassword=<local-secret>
keyAlias=resident-upload
keyPassword=<local-secret>
```

Never commit `key.properties`, keystores, passwords, API keys, or telecom secrets.

## Release Build

```powershell
cd apps\resident-mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --release --flavor pilot
Get-FileHash -Algorithm SHA256 build\app\outputs\flutter-apk\app-pilot-release.apk
```

If flavors are not yet generated, use:

```powershell
flutter build apk --release
Get-FileHash -Algorithm SHA256 build\app\outputs\flutter-apk\app-release.apk
```

## Controlled Install

```powershell
adb devices -l
adb install -r build\app\outputs\flutter-apk\app-release.apk
adb shell monkey -p com.nigeriatrust.resident 1
```

Before handoff:

- Confirm SMS, location, notification, and background behavior on the actual device.
- Confirm offline SOS creates a queue item before network I/O.
- Confirm force-stop and reboot do not lose queued alerts.
- Capture evidence with `scripts/mobile/run-flutter-production-validation.ps1`.

## Evidence Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\mobile\run-flutter-production-validation.ps1 -DeviceId <adb-id> -PackageName com.nigeriatrust.resident -BuildMode release -ExerciseAirplaneMode -RebootDevice
```

Evidence is written under `reports/mobile`.
