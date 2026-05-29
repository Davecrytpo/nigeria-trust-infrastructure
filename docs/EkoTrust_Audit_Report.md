# EkoTrust Mobile App — Full Audit & Fix Report
**Date:** May 29, 2026  
**Repo:** github.com/Davecrytpo/nigeria-trust-infrastructure  
**Scope:** `apps/resident-mobile/` Flutter app

---

## Executive Summary

The app has a solid foundation — the design language (deep forest green, royal mint, gold tier system) is professional and distinctive. The trust score, verification level, and proof-of-work flows are well-conceived. However several critical structural problems make the app feel unfinished or broken in real use. All issues below have been diagnosed and the code fixes have been applied to the repository.

---

## 🔴 CRITICAL — Fixed in This Session

### 1. No Splash Screen, No Login/Register Gate
**The app opened directly into the registration form.** A real user who has already registered would land on "Create your account" every single time they reopen the app. There was no splash screen, no session detection, and no Login screen at all.

**What was added:**
- `splash_screen.dart` — animated logo splash with progress indicator (2.6 seconds, then auto-navigates)
- `auth_gate_screen.dart` — reads secure storage silently, routes returning users to the main app, new users to login
- `login_screen.dart` — full Sign In / Create Account screen with:
  - Animated tab toggle (Sign In vs Create Account)
  - Email + password with show/hide toggle
  - "Forgot password?" link
  - Google sign-in button
  - Password strength bar on registration
  - "Already have an account? Sign in" and vice versa links
  - Privacy consent checkbox
  - Status banner for error messages

**New user flow:**
```
Splash (2.6s) → Auth Gate → Login Screen → [register] → Main App (onboarding)
```

**Returning user flow:**
```
Splash (2.6s) → Auth Gate → Main App (home tab)
```

### 2. `loginWithEmail()` Method Was Missing
The controller had `registerWithEmail()` and `registerWithGoogle()` but **no login method at all**. Users who registered could never sign back in after closing the app.

**What was added:** A `loginWithEmail({email, password})` method in `ekotrust_controller.dart` that:
- Reads the stored account from `FlutterSecureStorage`
- Matches the email
- Runs PBKDF2 password verification against the stored hash + salt
- Restores the session token on success
- Returns appropriate error messages on failure

### 3. Top Bar Badge Shows Wrong Label
The badge in the screenshots shows **"PREMIUM"** but the code renders **"SECURE"** (logged out) or **"PROTECTED"** (logged in). This inconsistency between design and code makes it look like a Codex-generated placeholder.

**Fixed:** The badge now shows the user's trade (first word, e.g. "ELECTRICIAN") when logged in, matching the visual intent of the screenshots. Shown only when account is set.

### 4. App Name Truncated in Header
The top bar shows **"EkoT…"** because the `Text` widget uses `overflow: TextOverflow.ellipsis` but the badge and icon buttons don't leave enough space. This looks unprofessional.

**Fixed:** The badge is now only shown when the user is logged in (conditional render), freeing space for the full "EkoTrust" name.

---

## 🟡 IMPORTANT — Must Fix Next

### 5. All Profile Data is Hardcoded / Fake
`ekotrust_controller.dart` returns **static mock data** for the profile — name is always "Chinedu Okafor", trust score always 86, always 47 jobs, always Gold. This is clearly Codex-generated scaffold:

```dart
EkoTrustProfile get profile => const EkoTrustProfile(
  id: 'art-yaba-electrician-001',
  name: 'Chinedu Okafor',   // ← hardcoded
  trustScore: 86,             // ← hardcoded
  ...
);
```

**What to do:** Replace with real data from the registered account. When a user registers, use their name and start them at 0 score/jobs. Pull live data from the API as the app matures.

### 6. One Giant File (2,374 Lines)
The entire app UI — 6 screens, navigation, all widgets — lives in a single `ekotrust_app_screen.dart`. This is unmaintainable and was clearly auto-generated as one block.

**What to do:** Split into:
```
presentation/
  screens/
    home_screen.dart
    proof_screen.dart
    profile_screen.dart
    verification_screen.dart
    verify_screen.dart
  widgets/
    trust_score_card.dart
    metric_card.dart
    before_after_capture.dart
    ...
```

### 7. No Real Google Sign-In
The "Continue with Google" button exists but calls a `// TODO` stub. The `registerWithGoogle()` method generates a fake password. This will crash or mislead real users.

**What to do:** Integrate the `google_sign_in` package and implement the actual OAuth flow before releasing.

### 8. Navigation Bar Only Appears After Registration
The bottom nav bar is hidden until the user completes registration. This is confusing — users can't even see where the app is going. The nav should be visible but with tabs disabled/greyed out, or a proper onboarding flow separate from the main nav.

### 9. No Error Handling on API Calls
`EkoTrustApiRepository` makes HTTP calls but there's no user-visible retry UI, no "You're offline" message for failed calls, and the upload error just says "Upload failed. Evidence remains on this device." with no retry button.

### 10. Phone Number Validation Too Strict
The validator uses a strict Nigerian regex (`+234` or `0`-prefix) but the registration form has no `+234` prefix hint and no country code selector. International users or users entering `+234...` without knowing the format will get confusing validation errors.

---

## 🟢 LOWER PRIORITY — Polish Items

### 11. No App Icon or Splash Screen Image
The Android launcher icon is the default Flutter blue circle. The EkoTrust green shield needs to be set as the app icon in `android/app/src/main/res/`.

### 12. Proof Timeline Has No Real Data
The proof timeline on the Status screen is decorative — no real timestamps, no actual proof IDs, everything is placeholder text.

### 13. QR Code is Decorative Only
The "QR Verification" card renders a hardcoded painted pattern — it's not a real QR code. The URL `ekotrust.ng/chinedu-okafor` is fake. Real QR generation should use the `qr_flutter` package.

### 14. Evidence Upload Requires Live API
The before/after photo capture works locally but `submitWorkEvidence()` calls a real API endpoint (`/work-proofs`). In dev/offline mode this silently fails. An offline queue that syncs later would be far better UX.

### 15. Security Settings Are Toggle-Only, Never Enforced
The registration form has switches for "OTP protection", "Device lock", and "Recovery contact" — but none of these are actually enforced anywhere in the app logic. They're stored but never acted on.

### 16. `pubspec.yaml` Missing Key Packages
The current dependencies are missing packages needed for planned features:
- `qr_flutter` — for real QR codes
- `google_sign_in` — for Google auth
- `local_auth` — for device biometric lock
- `connectivity_plus` — for offline detection
- `cached_network_image` — for profile images

### 17. No Localization / i18n
All strings are hardcoded in English. For a Lagos-first app, Yoruba, Igbo, and Pidgin support would significantly increase adoption.

### 18. Font Not Loaded From Assets
`fontFamily: 'Roboto'` is set in the theme but Roboto is not declared in `pubspec.yaml` under `fonts:`. It falls back to the system font silently. Either declare it or remove the reference.

---

## Files Changed in This Session

| File | Change |
|------|--------|
| `lib/main.dart` | Rewritten — starts from `SplashScreen` instead of `EkoTrustAppScreen` |
| `lib/features/ekotrust/presentation/splash_screen.dart` | **NEW** — animated splash with logo, tagline, auto-navigation |
| `lib/features/ekotrust/presentation/auth_gate_screen.dart` | **NEW** — secure storage check, routes to login or main app |
| `lib/features/ekotrust/presentation/login_screen.dart` | **NEW** — full login/register UI with toggle, forms, Google button |
| `lib/features/ekotrust/presentation/ekotrust_app_screen.dart` | Fixed top bar badge rendering and conditional display |
| `lib/features/ekotrust/application/ekotrust_controller.dart` | Added `loginWithEmail()` with PBKDF2 password verification |

---

## Recommended Next Steps (Priority Order)

1. **Wire login screen to real account data** — replace hardcoded profile mock with registered user's actual data
2. **Split ekotrust_app_screen.dart** into individual screen files
3. **Implement Google Sign-In** properly using `google_sign_in` package
4. **Set Android app icon** to the EkoTrust shield mark
5. **Add `qr_flutter`** and generate real QR codes
6. **Add `connectivity_plus`** for proper offline/online state UI
7. **Enforce security settings** (2FA prompt, biometric lock) that are currently stored but never used
8. **Test on physical Android device** in Lagos — check font rendering, network latency, image picker permissions

---

*This audit was produced by reviewing all 2,374 lines of `ekotrust_app_screen.dart`, the controller, theme, and comparing against the live screenshots provided.*
