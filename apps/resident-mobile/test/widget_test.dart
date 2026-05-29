import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'package:ekotrust_mobile/main.dart';

void main() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  Future<void> registerResident(WidgetTester tester) async {
    await tester.pumpWidget(const EkoTrustApp());
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
      find.widgetWithText(TextFormField, 'Strong password'),
      'EkoTrust#2026Safe',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Phone number'),
      '08031234567',
    );
    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.pumpAndSettle();
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Create Secure Account'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Create Secure Account'));
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

  testWidgets('EkoTrust starts with secure account registration',
      (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(430, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(const EkoTrustApp());
    await tester.pumpAndSettle();

    expect(find.text('SECURE REGISTRATION'), findsOneWidget);
    expect(find.text('Create Secure Account'), findsOneWidget);
    expect(find.text('Continue with Google'), findsNothing);

    await tester.tap(find.text('Google'));
    await tester.pumpAndSettle();

    expect(find.text('Continue with Google'), findsOneWidget);
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
}
