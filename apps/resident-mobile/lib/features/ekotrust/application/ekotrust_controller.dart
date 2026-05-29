import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:cryptography/cryptography.dart';
import 'package:ekotrust_mobile/features/ekotrust/infrastructure/ekotrust_api_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

enum EkoTrustUploadState { idle, picking, ready, uploading, complete, failed }

enum EkoTrustEvidenceRole { before, after }

class EkoTrustEvidenceFile {
  const EkoTrustEvidenceFile({
    required this.path,
    required this.name,
    required this.byteSize,
    required this.contentType,
    required this.contentHash,
  });

  final String path;
  final String name;
  final int byteSize;
  final String contentType;
  final String contentHash;
}

class EkoTrustController extends ChangeNotifier {
  EkoTrustController({
    EkoTrustApiRepository? repository,
    ImagePicker? imagePicker,
    http.Client? uploadClient,
    FlutterSecureStorage? secureStorage,
  })  : _repository = repository ?? EkoTrustApiRepository(),
        _imagePicker = imagePicker ?? ImagePicker(),
        _uploadClient = uploadClient ?? http.Client(),
        _secureStorage = secureStorage ?? const FlutterSecureStorage() {
    _restoreSecureAccount();
  }

  final EkoTrustApiRepository _repository;
  final ImagePicker _imagePicker;
  final http.Client _uploadClient;
  final FlutterSecureStorage _secureStorage;
  int _onboardingStep = 0;
  bool _offlineReady = true;
  bool _aiReviewQueued = false;
  EkoTrustUploadState _uploadState = EkoTrustUploadState.idle;
  String? _uploadMessage;
  EkoTrustEvidenceFile? _beforeEvidence;
  EkoTrustEvidenceFile? _afterEvidence;
  bool _accountRestoring = true;
  bool _registering = false;
  String? _authMessage;
  EkoTrustAccount? _account;

  int get onboardingStep => _onboardingStep;
  bool get offlineReady => _offlineReady;
  bool get aiReviewQueued => _aiReviewQueued;
  EkoTrustUploadState get uploadState => _uploadState;
  String? get uploadMessage => _uploadMessage;
  EkoTrustEvidenceFile? get beforeEvidence => _beforeEvidence;
  EkoTrustEvidenceFile? get afterEvidence => _afterEvidence;
  bool get hasEvidencePair => _beforeEvidence != null && _afterEvidence != null;
  bool get accountRestoring => _accountRestoring;
  bool get registering => _registering;
  bool get isRegistered => _account != null;
  String? get authMessage => _authMessage;
  EkoTrustAccount? get account => _account;

  static const _accountStorageKey = 'ekotrust.account.v1';
  static const _sessionStorageKey = 'ekotrust.session.v1';

  List<EkoTrustOnboardingStep> get onboardingSteps => const [
        EkoTrustOnboardingStep(
          shortLabel: 'Identity',
          title: 'Phone Identity',
          body:
              'Confirm your Nigerian phone number with OTP and secure local storage.',
          action: 'Send OTP',
          icon: Icons.phone_android_rounded,
        ),
        EkoTrustOnboardingStep(
          shortLabel: 'Liveness',
          title: 'Selfie and Liveness',
          body:
              'Capture a fresh face check so your proof belongs to a real person.',
          action: 'Start Liveness',
          icon: Icons.face_retouching_natural_rounded,
        ),
        EkoTrustOnboardingStep(
          shortLabel: 'Community',
          title: 'Community Selection',
          body:
              'Join the artisan community where your work reputation is recognized.',
          action: 'Choose Community',
          icon: Icons.groups_2_rounded,
        ),
        EkoTrustOnboardingStep(
          shortLabel: 'Complete',
          title: 'Profile Creation',
          body:
              'Create your public trust profile and begin sealing verified work.',
          action: 'Create Profile',
          icon: Icons.badge_rounded,
        ),
      ];

  EkoTrustOnboardingStep get currentStep =>
      onboardingSteps[_onboardingStep.clamp(0, onboardingSteps.length - 1)];

  EkoTrustProfile get profile => const EkoTrustProfile(
        id: 'art-yaba-electrician-001',
        name: 'Chinedu Okafor',
        trade: 'Verified Electrician',
        community: 'Yaba Artisan Circle',
        location: 'Lagos Mainland',
        trustScore: 86,
        completionRate: 96,
        verifiedJobs: 47,
        peerAttestations: 18,
        verificationLevel: EkoTrustVerificationLevel.gold,
        publicHandle: 'ekotrust.ng/chinedu-okafor',
      );

  List<EkoTrustWorkProof> get workProofs => const [
        EkoTrustWorkProof(
          id: 'proof-001',
          title: 'Lekki apartment rewiring',
          category: 'Electrical repair',
          location: 'Lekki Phase 1',
          status: EkoTrustProofStatus.passed,
          summary: 'Customer confirmed and before/after evidence sealed.',
          icon: Icons.electrical_services_rounded,
        ),
        EkoTrustWorkProof(
          id: 'proof-002',
          title: 'Inverter fault repair',
          category: 'Power systems',
          location: 'Yaba',
          status: EkoTrustProofStatus.passed,
          summary: 'Duplicate-work scan passed with GPS consistency.',
          icon: Icons.bolt_rounded,
        ),
        EkoTrustWorkProof(
          id: 'proof-003',
          title: 'Shop lighting installation',
          category: 'Commercial wiring',
          location: 'Surulere',
          status: EkoTrustProofStatus.pending,
          summary: 'Awaiting second peer attestation from community guild.',
          icon: Icons.home_repair_service_rounded,
        ),
      ];

  int passwordStrength(String password) {
    var score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (RegExp('[A-Z]').hasMatch(password)) score += 1;
    if (RegExp('[a-z]').hasMatch(password)) score += 1;
    if (RegExp(r'\d').hasMatch(password)) score += 1;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(password)) score += 1;
    return score.clamp(0, 6);
  }

  String? validateRegistration(EkoTrustRegistrationDraft draft) {
    if (draft.fullName.trim().split(RegExp(r'\s+')).length < 2) {
      return 'Enter your full legal name.';
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(draft.email.trim())) {
      return 'Enter a valid email address.';
    }
    if (!RegExp(r'^(\+234|0)[789][01]\d{8}$')
        .hasMatch(draft.phoneNumber.replaceAll(RegExp(r'\s+|-'), ''))) {
      return 'Enter a valid Nigerian phone number.';
    }
    if (passwordStrength(draft.password) < 5) {
      return 'Use a stronger password with 12+ characters, numbers, and symbols.';
    }
    if (draft.trade.trim().length < 3) return 'Enter your trade or role.';
    if (draft.community.trim().length < 3) return 'Enter your community.';
    if (!draft.acceptedPrivacy) {
      return 'Accept the privacy and safety terms to protect your account.';
    }
    return null;
  }

  Future<bool> registerWithEmail(EkoTrustRegistrationDraft draft) async {
    final validation = validateRegistration(draft);
    if (validation != null) {
      _authMessage = validation;
      notifyListeners();
      return false;
    }

    _registering = true;
    _authMessage = 'Securing your account';
    notifyListeners();

    final account = EkoTrustAccount(
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      phoneNumber: draft.phoneNumber.trim(),
      trade: draft.trade.trim(),
      community: draft.community.trim(),
      provider: EkoTrustAccountProvider.manual,
      twoFactorEnabled: draft.twoFactorEnabled,
      deviceLockEnabled: draft.deviceLockEnabled,
      recoveryContactEnabled: draft.recoveryContactEnabled,
    );
    await _storeAccount(account, password: draft.password);
    _registering = false;
    _authMessage = 'Account protected. Continue verification.';
    notifyListeners();
    return true;
  }

  Future<bool> registerWithGoogle({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String trade,
    required String community,
    required bool acceptedPrivacy,
    bool twoFactorEnabled = true,
    bool deviceLockEnabled = true,
    bool recoveryContactEnabled = true,
  }) async {
    final draft = EkoTrustRegistrationDraft(
      fullName: fullName,
      email: email,
      password: 'GoogleAuth#${DateTime.now().microsecondsSinceEpoch}',
      phoneNumber: phoneNumber,
      trade: trade,
      community: community,
      acceptedPrivacy: acceptedPrivacy,
      twoFactorEnabled: twoFactorEnabled,
      deviceLockEnabled: deviceLockEnabled,
      recoveryContactEnabled: recoveryContactEnabled,
    );
    final validation = validateRegistration(draft);
    if (validation != null) {
      _authMessage = validation;
      notifyListeners();
      return false;
    }

    _registering = true;
    _authMessage = 'Linking Google identity';
    notifyListeners();

    await _storeAccount(
      EkoTrustAccount(
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        trade: trade.trim(),
        community: community.trim(),
        provider: EkoTrustAccountProvider.google,
        twoFactorEnabled: twoFactorEnabled,
        deviceLockEnabled: deviceLockEnabled,
        recoveryContactEnabled: recoveryContactEnabled,
      ),
      password: draft.password,
    );
    _registering = false;
    _authMessage = 'Google account linked. Continue verification.';
    notifyListeners();
    return true;
  }

  /// Sign in with email and password.
  /// Looks up the stored account, verifies password hash, restores session.
  Future<bool> loginWithEmail({
    required String email,
    required String password,
  }) async {
    _registering = true;
    _authMessage = 'Checking credentials';
    notifyListeners();

    try {
      final payload = await _secureStorage.read(key: _accountStorageKey);
      if (payload == null) {
        _registering = false;
        _authMessage = 'No account found. Please register first.';
        notifyListeners();
        return false;
      }
      final json = jsonDecode(payload) as Map<String, dynamic>;
      final storedEmail = (json['email'] as String?) ?? '';
      if (storedEmail.toLowerCase() != email.toLowerCase().trim()) {
        _registering = false;
        _authMessage = 'Incorrect email or password.';
        notifyListeners();
        return false;
      }
      // Verify password hash
      final saltHex = (json['passwordSalt'] as String?) ?? '';
      final proofHex = (json['passwordProof'] as String?) ?? '';
      final salt = List<int>.generate(saltHex.length ~/ 2,
          (i) => int.parse(saltHex.substring(i * 2, i * 2 + 2), radix: 16));
      final secretKey = await Pbkdf2(
        macAlgorithm: Hmac.sha256(),
        iterations: 120000,
        bits: 256,
      ).deriveKey(
        secretKey: SecretKey(utf8.encode(password)),
        nonce: salt,
      );
      final hash = hexFromBytes(await secretKey.extractBytes());
      if (hash != proofHex) {
        _registering = false;
        _authMessage = 'Incorrect email or password.';
        notifyListeners();
        return false;
      }
      _account = EkoTrustAccount.fromJson(json);
      final sessionToken = hexFromBytes(_randomBytes(32));
      await _secureStorage.write(
        key: _sessionStorageKey,
        value: jsonEncode({
          'token': sessionToken,
          'createdAt': DateTime.now().toUtc().toIso8601String(),
        }),
      );
      _registering = false;
      _authMessage = null;
      notifyListeners();
      return true;
    } catch (_) {
      _registering = false;
      _authMessage = 'Sign in failed. Please try again.';
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await _secureStorage.delete(key: _sessionStorageKey);
    _account = null;
    _onboardingStep = 0;
    _authMessage = 'Signed out from this device.';
    notifyListeners();
  }

  List<EkoTrustAttestation> get attestations => const [
        EkoTrustAttestation(
          name: 'Amina Bello',
          role: 'Customer',
          decision: 'Approved job completion',
        ),
        EkoTrustAttestation(
          name: 'Tunde Salami',
          role: 'Guild peer',
          decision: 'Confirmed craftsmanship',
        ),
        EkoTrustAttestation(
          name: 'Yaba Artisan Circle',
          role: 'Community',
          decision: 'Recognized active member',
        ),
      ];

  List<EkoTrustSignal> get trustSignals => const [
        EkoTrustSignal(
            label: 'Identity confidence', value: 'Verified', weight: 0.92),
        EkoTrustSignal(
            label: 'Work consistency', value: 'Strong', weight: 0.86),
        EkoTrustSignal(label: 'Customer reviews', value: '4.8/5', weight: 0.88),
        EkoTrustSignal(
            label: 'Fraud confidence', value: 'Low risk', weight: 0.94),
      ];

  void advanceOnboarding() {
    if (_onboardingStep < onboardingSteps.length - 1) {
      _onboardingStep += 1;
    }
    notifyListeners();
  }

  void resetOnboarding() {
    _onboardingStep = 0;
    notifyListeners();
  }

  void queueAiReview() {
    _aiReviewQueued = true;
    notifyListeners();
  }

  Future<void> pickEvidence({
    required EkoTrustEvidenceRole role,
    required ImageSource source,
  }) async {
    _uploadState = EkoTrustUploadState.picking;
    _uploadMessage = 'Selecting work evidence';
    notifyListeners();

    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        imageQuality: 78,
        maxWidth: 1600,
      );
      if (picked == null) {
        _uploadState = hasEvidencePair
            ? EkoTrustUploadState.ready
            : EkoTrustUploadState.idle;
        _uploadMessage = null;
        notifyListeners();
        return;
      }

      final evidence = await _evidenceFromXFile(picked);
      if (role == EkoTrustEvidenceRole.before) {
        _beforeEvidence = evidence;
      } else {
        _afterEvidence = evidence;
      }
      _uploadState = hasEvidencePair
          ? EkoTrustUploadState.ready
          : EkoTrustUploadState.idle;
      _uploadMessage = hasEvidencePair
          ? 'Before and after evidence ready'
          : 'Add the matching ${role == EkoTrustEvidenceRole.before ? 'after' : 'before'} evidence';
      notifyListeners();
    } catch (error) {
      _uploadState = EkoTrustUploadState.failed;
      _uploadMessage = 'Could not select evidence: $error';
      notifyListeners();
    }
  }

  Future<void> submitWorkEvidence() async {
    final before = _beforeEvidence;
    final after = _afterEvidence;
    if (before == null || after == null) {
      _uploadState = EkoTrustUploadState.failed;
      _uploadMessage = 'Add before and after evidence first';
      notifyListeners();
      return;
    }

    _uploadState = EkoTrustUploadState.uploading;
    _uploadMessage = 'Creating secure work proof';
    notifyListeners();

    try {
      final proof = await _repository.createWorkProof(
        artisanId: profile.id,
        title: 'New verified work evidence',
        category: 'Electrical repair',
        location: profile.location,
        beforeMediaCount: 1,
        afterMediaCount: 1,
      );
      await _uploadEvidence(proof.id, 'before', before);
      await _uploadEvidence(proof.id, 'after', after);
      _aiReviewQueued = true;
      _uploadState = EkoTrustUploadState.complete;
      _uploadMessage = 'Evidence uploaded and queued for AI review';
      notifyListeners();
    } catch (error) {
      _uploadState = EkoTrustUploadState.failed;
      _uploadMessage = 'Upload failed. Evidence remains on this device.';
      notifyListeners();
    }
  }

  void setOfflineReady(bool value) {
    _offlineReady = value;
    notifyListeners();
  }

  Future<void> _restoreSecureAccount() async {
    try {
      final payload = await _secureStorage.read(key: _accountStorageKey);
      final session = await _secureStorage.read(key: _sessionStorageKey);
      if (payload != null && session != null) {
        _account = EkoTrustAccount.fromJson(
          jsonDecode(payload) as Map<String, dynamic>,
        );
      }
    } catch (_) {
      _authMessage = 'Account storage is locked. Register or sign in again.';
    } finally {
      _accountRestoring = false;
      notifyListeners();
    }
  }

  Future<void> _storeAccount(
    EkoTrustAccount account, {
    required String password,
  }) async {
    final salt = _randomBytes(16);
    final secretKey = await Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: 120000,
      bits: 256,
    ).deriveKey(
      secretKey: SecretKey(utf8.encode(password)),
      nonce: salt,
    );
    final hash = await secretKey.extractBytes();
    final sessionToken = hexFromBytes(_randomBytes(32));
    await _secureStorage.write(
      key: _accountStorageKey,
      value: jsonEncode({
        ...account.toJson(),
        'passwordProof': hexFromBytes(hash),
        'passwordSalt': hexFromBytes(salt),
        'createdAt': DateTime.now().toUtc().toIso8601String(),
      }),
    );
    await _secureStorage.write(
      key: _sessionStorageKey,
      value: jsonEncode({
        'token': sessionToken,
        'createdAt': DateTime.now().toUtc().toIso8601String(),
        'deviceBound': account.deviceLockEnabled,
      }),
    );
    _account = account;
  }

  List<int> _randomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (_) => random.nextInt(256));
  }

  Future<EkoTrustEvidenceFile> _evidenceFromXFile(XFile file) async {
    final bytes = await file.readAsBytes();
    final digest = await Sha256().hash(bytes);
    return EkoTrustEvidenceFile(
      path: file.path,
      name: file.name,
      byteSize: bytes.length,
      contentType: file.mimeType ?? _contentTypeForName(file.name),
      contentHash: hexFromBytes(digest.bytes),
    );
  }

  Future<void> _uploadEvidence(
    String proofId,
    String role,
    EkoTrustEvidenceFile evidence,
  ) async {
    _uploadMessage = 'Uploading $role evidence';
    notifyListeners();
    final intent = await _repository.createMediaUploadIntent(
      proofId: proofId,
      mediaRole: role,
      mediaType: 'image',
      fileName: evidence.name,
      contentType: evidence.contentType,
      byteSize: evidence.byteSize,
      contentHash: evidence.contentHash,
    );
    final uploadUrl = intent['uploadUrl']?.toString();
    if (uploadUrl == null || uploadUrl.isEmpty) {
      throw StateError('Missing upload URL');
    }
    final response = await _uploadClient.put(
      Uri.parse(uploadUrl),
      headers: {
        'content-type': evidence.contentType,
        ...((intent['headers'] as Map?) ?? {}).map(
          (key, value) => MapEntry(key.toString(), value.toString()),
        ),
      },
      body: await File(evidence.path).readAsBytes(),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError('Upload failed with ${response.statusCode}');
    }
    await _repository.registerWorkProofMedia(
      proofId: proofId,
      mediaRole: role,
      mediaType: 'image',
      storageKey: intent['storageKey'].toString(),
      contentHash: evidence.contentHash,
      byteSize: evidence.byteSize,
    );
  }

  String _contentTypeForName(String fileName) {
    final lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  String hexFromBytes(List<int> bytes) {
    const alphabet = '0123456789abcdef';
    final buffer = StringBuffer();
    for (final byte in bytes) {
      buffer
        ..write(alphabet[(byte >> 4) & 0x0f])
        ..write(alphabet[byte & 0x0f]);
    }
    return buffer.toString();
  }
}
