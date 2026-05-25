# Low-Spec Local Execution

This is the preferred workflow for a 4GB RAM development machine and one physical Android test phone. Avoid Docker, Android Studio, emulators, and full observability stacks unless a specific failure requires them.

## Machine Profile

- Windows laptop or low-RAM Linux laptop with 4GB RAM.
- One physical Android phone with USB debugging enabled.
- Flutter SDK, Android command-line tools, platform tools, Node.js, PostgreSQL, and Redis installed directly.
- No Android Studio dependency required after command-line tools are installed.

## Flutter Without Android Studio

Install only:

- Flutter SDK.
- Android SDK command-line tools.
- Android platform tools.
- One Android platform, preferably API 34 or the latest installed platform.
- Build tools.
- Java JDK 17.

Then verify:

```powershell
npm run mobile:toolchain
flutter doctor -v
adb devices
cd apps\resident-mobile
flutter create --platforms=android .
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

For a repeatable physical-device pass:

```powershell
npm run mobile:usb-apk:fast
```

For real-device startup, memory, and frame checks without a full release signing pass:

```powershell
npm run mobile:usb-apk:profile
```

For a pilot APK candidate:

```powershell
npm run mobile:usb-apk:release
```

For an APK size report before pilot sharing:

```powershell
npm run mobile:usb-apk:size
```

Evidence is written under `reports/mobile/usb-apk-<timestamp>`.

Toolchain evidence is written under `reports/mobile/android-toolchain-<timestamp>`.

## Low-Spec Windows Install Path

Use this path when the machine cannot comfortably run Android Studio:

```powershell
npm run mobile:setup:print
```

1. Download Flutter SDK zip for Windows and extract to `C:\src\flutter`.
2. Add `C:\src\flutter\bin` to the user `PATH`.
3. Install JDK 17 and add its `bin` directory to `PATH`.
4. Download Android command-line tools and extract them under `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`.
5. Set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk`.
6. Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` and `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin` to `PATH`.
7. Install only the required SDK pieces:

```powershell
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
flutter doctor --android-licenses
npm run mobile:toolchain
```

Restart PowerShell after changing `PATH`.

If the generated Android package name changes, pass it explicitly:

```powershell
.\scripts\mobile\build-usb-apk.ps1 -Mode debug -Install -PackageName <android.applicationId>
```

If the laptop is struggling, keep the first pass narrow:

```powershell
npm run mobile:usb-apk:fast
```

Only use `-SkipTests` to cross the first physical-device threshold. Re-run without it before treating the APK as a pilot candidate.

## Physical USB Device Testing

Use a real low-end or midrange Android phone before any emulator pass.

```powershell
adb devices
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell dumpsys battery
adb shell dumpsys connectivity
```

Minimum manual pass:

- Open onboarding and finish setup.
- Hold SOS continuously for three seconds until activation completes.
- Switch to offline mode and confirm queue visibility.
- Toggle low-spec phone mode.
- Toggle accessibility mode.
- Enable airplane mode, trigger SOS, disable airplane mode, and confirm recovery messaging.
- Force stop and reopen the app.
- Capture screenshots of onboarding, SOS, tracking, queue, and settings.
- Confirm `adb-startup-time.txt`, `launch-screenshot.png`, `logcat-tail.txt`, `battery.txt`, `connectivity.txt`, `meminfo.txt`, and `gfxinfo.txt` exist in the latest `reports/mobile/usb-apk-*` directory.

## Runtime Acceptance On The Phone

The first APK pass is accepted only when the evidence directory shows:

- Startup: `adb-startup-time.txt` exists and the app reaches the first screen without a crash in `logcat-tail.txt`.
- Memory pressure: `meminfo.txt` exists after launch and after one SOS flow.
- Battery impact: `battery.txt` exists before and after a 10-minute active incident check.
- Offline replay speed: queue recovery is timed manually and recorded with `npm run mobile:capture-validation -- --delayed-sync-replay-ms=<ms>`.
- Reconnect behavior: airplane mode off/on recovery is captured with `--offline-replay-succeeded --failed-queue-rows=0`.
- Screenshot polish: onboarding, SOS, tracking, queue, and mode screens are readable on the actual phone brightness and resolution.
- Low-end survivability: low-spec phone mode is enabled, motion is reduced, and the app still responds to SOS while offline or under battery saver.

## Direct PostgreSQL and Redis

Use direct services locally:

```powershell
createdb nigeria_trust_local
psql nigeria_trust_local -f infra\db\001_core_operational_schema.sql
psql nigeria_trust_local -f infra\db\002_partitioning_and_replay_indexes.sql
psql nigeria_trust_local -f infra\db\003_operational_state_repositories.sql
redis-server
```

Run the prototype API without Docker:

```powershell
npm install
npm run db:seed
npm run start:poc
```

Keep local validation narrow:

- Resident app flow.
- One operator console.
- Postgres persistence.
- Redis queue behavior.
- SMS fallback simulation until real provider credentials are available.

## No-Docker Local Path

On 4GB RAM Windows hardware, prefer:

- API: `npm run start:poc`
- Mobile: `npm run mobile:toolchain`, then `npm run mobile:usb-apk:fast`
- Evidence: latest APK directory from `reports/mobile/latest-usb-apk-dir.txt`
- Browser: one operator console tab only
- Database: direct PostgreSQL service if needed, not Docker Desktop
- Queue: direct Redis only when replay behavior is being tested

Do not start Grafana, Prometheus, Docker Desktop, emulator, or every worker during the phone APK pass.

## Free-Tier Deployment Path

Use the smallest deployable set:

- Static resident PWA and operator console on a free static host.
- Prototype API on one free or low-cost Node host.
- Managed free Postgres only if the pilot needs persistence outside the laptop.
- Redis only when replay tests require it; otherwise run the in-process prototype path.
- SMS provider credentials injected through environment variables, never stored in the repo.

Keep observability lightweight:

- API console logs.
- JSON evidence in `reports/`.
- Phone-side `logcat-tail.txt`, `battery.txt`, `connectivity.txt`, `meminfo.txt`, and screenshots.
- Browser devtools only when diagnosing console load.

## APK Size And Data Rules

- Use split-per-ABI release APKs for pilot candidates.
- Use profile APKs for startup and memory evidence.
- Use `npm run mobile:usb-apk:size` before sharing any pilot APK outside the build laptop.
- Keep generated Android Gradle memory settings low: `-Xmx1536M`, no Gradle daemon, no Gradle parallel build.
- Avoid bundling large images, maps, fonts, videos, or offline data packs.
- Prefer simple vector/icons and low-bandwidth route drawings.
- Keep sync payloads short and retry only the pending queue rows.
- Default low-spec phone mode on for the first Nigerian field device.

## Real-Device Evidence Order

Run in this order after Flutter and `sdkmanager` are installed:

```powershell
npm run mobile:toolchain
npm run mobile:usb-apk:fast
npm run mobile:usb-apk:profile
npm run mobile:usb-apk:size
```

Accept the phone run only when the latest APK report includes:

- `adb-startup-time.txt`
- `adb-resume-startup-time.txt`
- `launch-screenshot.png`
- `resume-screenshot.png`
- `meminfo.txt`
- `meminfo-after-resume.txt`
- `gfxinfo.txt`
- `battery.txt`
- `connectivity.txt`
- `apk-files.txt`

## Low-RAM Rules

- Prefer one terminal for API, one for Flutter, one for evidence capture.
- Do not run Docker Desktop on a 4GB machine.
- Do not run an Android emulator on a 4GB machine.
- Use debug APK for daily USB testing.
- Use split-per-ABI release APK only for pilot candidate builds.
- Keep browser tabs to the operator console and one documentation page.
- Stop workers that are not part of the current test.

## One-Resident Pilot Flow

Goal: one resident in Yaba can request help under real Nigerian constraints.

1. Install the debug or pilot APK on one physical phone.
2. Add two trusted contacts, with at least one SMS-enabled contact.
3. Confirm language, accessibility, and low-spec phone mode.
4. Trigger one supervised SOS simulation.
5. Confirm operator console receives or simulates the incident.
6. Put the phone in airplane mode and trigger one offline SOS.
7. Restore network and confirm queue recovery is visible.
8. Capture screenshots, logcat, battery state, and queue evidence in `reports/mobile`.

The pilot is not ready until this flow succeeds on a physical phone without emulator-only assumptions.
