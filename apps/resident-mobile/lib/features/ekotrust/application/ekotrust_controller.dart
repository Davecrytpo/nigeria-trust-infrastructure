import 'dart:io';

import 'package:cryptography/cryptography.dart';
import 'package:ekotrust_mobile/features/ekotrust/infrastructure/ekotrust_api_repository.dart';
import 'package:flutter/material.dart';
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
  })  : _repository = repository ?? EkoTrustApiRepository(),
        _imagePicker = imagePicker ?? ImagePicker(),
        _uploadClient = uploadClient ?? http.Client();

  final EkoTrustApiRepository _repository;
  final ImagePicker _imagePicker;
  final http.Client _uploadClient;
  int _onboardingStep = 0;
  bool _offlineReady = true;
  bool _aiReviewQueued = false;
  EkoTrustUploadState _uploadState = EkoTrustUploadState.idle;
  String? _uploadMessage;
  EkoTrustEvidenceFile? _beforeEvidence;
  EkoTrustEvidenceFile? _afterEvidence;

  int get onboardingStep => _onboardingStep;
  bool get offlineReady => _offlineReady;
  bool get aiReviewQueued => _aiReviewQueued;
  EkoTrustUploadState get uploadState => _uploadState;
  String? get uploadMessage => _uploadMessage;
  EkoTrustEvidenceFile? get beforeEvidence => _beforeEvidence;
  EkoTrustEvidenceFile? get afterEvidence => _afterEvidence;
  bool get hasEvidencePair => _beforeEvidence != null && _afterEvidence != null;

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
