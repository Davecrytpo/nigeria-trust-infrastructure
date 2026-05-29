import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ekotrust_mobile/features/ekotrust/application/ekotrust_controller.dart';
import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'package:ekotrust_mobile/main.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  Future<void> registerResident(WidgetTester tester) async {
    await tester.pumpWidget(const EkoTrustApp());
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Create Account').first);
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Full legal name'),
      'Chinedu Okafor',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email address'),
      'chinedu@example.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'EkoTrust#2026Safe',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Phone number (+234...)'),
      '08031234567',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Trade or role (e.g. Electrician)'),
      'Electrician',
    );
    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pumpAndSettle();
    await tester
        .ensureVisible(find.widgetWithText(FilledButton, 'Create Account'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Create Account'));
    await tester.pumpAndSettle();
  }

  testWidgets('EkoTrust renders the verification experience',
      (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await registerResident(tester);

    expect(find.text('Your Proof of Existence'), findsOneWidget);
    expect(find.text('Onboarding Progress'), findsOneWidget);
    expect(find.text('Start Liveness'), findsNothing);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -520));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send OTP'));
    await tester.pump();

    expect(find.text('Start Liveness'), findsOneWidget);
  });

  testWidgets('EkoTrust bottom navigation opens core MVP screens',
      (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await registerResident(tester);

    await tester.tap(find.text('Proof'));
    await tester.pumpAndSettle();
    expect(find.text('VISUAL PROOF OF WORK'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('PUBLIC TRUST PROFILE'), findsOneWidget);

    await tester.tap(find.text('Status'));
    await tester.pumpAndSettle();
    expect(find.text('VERIFICATION STATUS'), findsOneWidget);
  });

  testWidgets('EkoTrust starts with splash and login gate',
      (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const EkoTrustApp());
    expect(find.text('EkoTrust'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    expect(find.text('Welcome back.'), findsOneWidget);
    expect(find.text('Sign In'), findsWidgets);
    expect(find.text('Continue with Google'), findsNothing);

    await tester.tap(find.text('Create Account').first);
    await tester.pumpAndSettle();

    expect(find.text('Create your account.'), findsOneWidget);
  });

  test('EkoTrust profile maps API payload into mobile model', () {
    final profile = EkoTrustProfile.fromJson({
      'fullName': 'Chinedu Okafor',
      'trade': 'ELECTRICIAN',
      'community': 'Yaba Artisan Circle',
      'location': 'Lagos Mainland',
      'trustScore': 86,
      'completionRate': 96,
      'verifiedJobs': 47,
      'peerAttestations': 18,
      'verificationLevel': 'GOLD',
      'publicHandle': 'ekotrust.ng/chinedu-okafor',
    });

    expect(profile.trade, 'Verified Electrician');
    expect(profile.verificationLevel, EkoTrustVerificationLevel.gold);
    expect(profile.initials, 'CO');
  });

  test('EkoTrust profile uses the registered account identity', () async {
    FlutterSecureStorage.setMockInitialValues({});
    final controller = EkoTrustController();
    addTearDown(controller.dispose);
    await testerPumpMicrotasks();

    final ok = await controller.registerWithEmail(
      const EkoTrustRegistrationDraft(
        fullName: 'Aisha Balogun',
        email: 'aisha@example.com',
        password: 'EkoTrust#2026Safe',
        phoneNumber: '08031234567',
        trade: 'Tailor',
        community: 'Yaba Market Circle',
        acceptedPrivacy: true,
        twoFactorEnabled: true,
        deviceLockEnabled: true,
        recoveryContactEnabled: true,
      ),
    );

    expect(ok, isTrue);
    expect(controller.profile.name, 'Aisha Balogun');
    expect(controller.profile.trade, 'Verified Tailor');
    expect(
        controller.profile.publicHandle, 'ekotrust.ng/profile/aisha-balogun');
    expect(controller.profile.verifiedJobs, 0);
  });
}

Future<void> testerPumpMicrotasks() async {
  await Future<void>.delayed(Duration.zero);
}
