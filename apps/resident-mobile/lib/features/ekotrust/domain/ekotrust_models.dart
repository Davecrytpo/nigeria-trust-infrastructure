import 'package:flutter/material.dart';

enum EkoTrustVerificationLevel { bronze, silver, gold, platinum }

enum EkoTrustProofStatus { passed, pending, flagged }

enum EkoTrustAccountProvider { manual, google }

class EkoTrustAccount {
  const EkoTrustAccount({
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.trade,
    required this.community,
    required this.provider,
    required this.twoFactorEnabled,
    required this.deviceLockEnabled,
    required this.recoveryContactEnabled,
  });

  final String fullName;
  final String email;
  final String phoneNumber;
  final String trade;
  final String community;
  final EkoTrustAccountProvider provider;
  final bool twoFactorEnabled;
  final bool deviceLockEnabled;
  final bool recoveryContactEnabled;

  String get providerLabel =>
      provider == EkoTrustAccountProvider.google ? 'Google' : 'Email';

  String get firstName {
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) return 'Resident';
    return trimmed.split(RegExp(r'\s+')).first;
  }

  int get securityScore {
    var score = 62;
    if (twoFactorEnabled) score += 16;
    if (deviceLockEnabled) score += 12;
    if (recoveryContactEnabled) score += 10;
    return score.clamp(0, 100);
  }

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'email': email,
        'phoneNumber': phoneNumber,
        'trade': trade,
        'community': community,
        'provider': provider.name,
        'twoFactorEnabled': twoFactorEnabled,
        'deviceLockEnabled': deviceLockEnabled,
        'recoveryContactEnabled': recoveryContactEnabled,
      };

  factory EkoTrustAccount.fromJson(Map<String, dynamic> json) {
    return EkoTrustAccount(
      fullName: (json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phoneNumber: (json['phoneNumber'] ?? '').toString(),
      trade: (json['trade'] ?? '').toString(),
      community: (json['community'] ?? '').toString(),
      provider: (json['provider'] ?? '') == EkoTrustAccountProvider.google.name
          ? EkoTrustAccountProvider.google
          : EkoTrustAccountProvider.manual,
      twoFactorEnabled: json['twoFactorEnabled'] == true,
      deviceLockEnabled: json['deviceLockEnabled'] != false,
      recoveryContactEnabled: json['recoveryContactEnabled'] == true,
    );
  }
}

class EkoTrustRegistrationDraft {
  const EkoTrustRegistrationDraft({
    required this.fullName,
    required this.email,
    required this.password,
    required this.phoneNumber,
    required this.trade,
    required this.community,
    required this.acceptedPrivacy,
    required this.twoFactorEnabled,
    required this.deviceLockEnabled,
    required this.recoveryContactEnabled,
  });

  final String fullName;
  final String email;
  final String password;
  final String phoneNumber;
  final String trade;
  final String community;
  final bool acceptedPrivacy;
  final bool twoFactorEnabled;
  final bool deviceLockEnabled;
  final bool recoveryContactEnabled;
}

class EkoTrustOnboardingStep {
  const EkoTrustOnboardingStep({
    required this.shortLabel,
    required this.title,
    required this.body,
    required this.action,
    required this.icon,
  });

  final String shortLabel;
  final String title;
  final String body;
  final String action;
  final IconData icon;
}

class EkoTrustProfile {
  const EkoTrustProfile({
    required this.id,
    required this.name,
    required this.trade,
    required this.community,
    required this.location,
    required this.trustScore,
    required this.completionRate,
    required this.verifiedJobs,
    required this.peerAttestations,
    required this.verificationLevel,
    required this.publicHandle,
  });

  final String id;
  final String name;
  final String trade;
  final String community;
  final String location;
  final int trustScore;
  final int completionRate;
  final int verifiedJobs;
  final int peerAttestations;
  final EkoTrustVerificationLevel verificationLevel;
  final String publicHandle;

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part[0])
        .join()
        .toUpperCase();
  }

  String get levelLabel {
    switch (verificationLevel) {
      case EkoTrustVerificationLevel.bronze:
        return 'Bronze';
      case EkoTrustVerificationLevel.silver:
        return 'Silver';
      case EkoTrustVerificationLevel.gold:
        return 'Gold';
      case EkoTrustVerificationLevel.platinum:
        return 'Platinum';
    }
  }

  factory EkoTrustProfile.fromJson(Map<String, dynamic> json) {
    return EkoTrustProfile(
      name: (json['fullName'] ?? json['name'] ?? '').toString(),
      id: (json['id'] ?? '').toString(),
      trade: _tradeLabel((json['trade'] ?? '').toString()),
      community: (json['community'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      trustScore: (json['trustScore'] as num?)?.round() ?? 0,
      completionRate: (json['completionRate'] as num?)?.round() ?? 0,
      verifiedJobs: (json['verifiedJobs'] as num?)?.round() ?? 0,
      peerAttestations: (json['peerAttestations'] as num?)?.round() ?? 0,
      verificationLevel:
          _levelFromApi((json['verificationLevel'] ?? '').toString()),
      publicHandle: (json['publicHandle'] ?? '').toString(),
    );
  }
}

class EkoTrustWorkProof {
  const EkoTrustWorkProof({
    required this.id,
    required this.title,
    required this.category,
    required this.location,
    required this.status,
    required this.summary,
    required this.icon,
  });

  final String id;
  final String title;
  final String category;
  final String location;
  final EkoTrustProofStatus status;
  final String summary;
  final IconData icon;

  String get statusLabel {
    switch (status) {
      case EkoTrustProofStatus.passed:
        return 'AI quality passed';
      case EkoTrustProofStatus.pending:
        return 'Peer attestation pending';
      case EkoTrustProofStatus.flagged:
        return 'Needs review';
    }
  }

  factory EkoTrustWorkProof.fromJson(Map<String, dynamic> json) {
    return EkoTrustWorkProof(
      title: (json['title'] ?? '').toString(),
      id: (json['id'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      status: _proofStatusFromApi((json['status'] ?? '').toString()),
      summary:
          '${(json['category'] ?? 'Work proof').toString()} evidence captured',
      icon: _iconForCategory((json['category'] ?? '').toString()),
    );
  }
}

class EkoTrustAttestation {
  const EkoTrustAttestation({
    required this.name,
    required this.role,
    required this.decision,
  });

  final String name;
  final String role;
  final String decision;
}

class EkoTrustSignal {
  const EkoTrustSignal({
    required this.label,
    required this.value,
    required this.weight,
  });

  final String label;
  final String value;
  final double weight;
}

EkoTrustVerificationLevel _levelFromApi(String value) {
  switch (value.toUpperCase()) {
    case 'PLATINUM':
      return EkoTrustVerificationLevel.platinum;
    case 'GOLD':
      return EkoTrustVerificationLevel.gold;
    case 'SILVER':
      return EkoTrustVerificationLevel.silver;
    default:
      return EkoTrustVerificationLevel.bronze;
  }
}

EkoTrustProofStatus _proofStatusFromApi(String value) {
  switch (value.toUpperCase()) {
    case 'AI_PASSED':
    case 'PEER_CONFIRMED':
      return EkoTrustProofStatus.passed;
    case 'FLAGGED':
      return EkoTrustProofStatus.flagged;
    default:
      return EkoTrustProofStatus.pending;
  }
}

String _tradeLabel(String value) {
  final normalized = value.toUpperCase().replaceAll('_', ' ');
  if (normalized.isEmpty) return 'Verified Artisan';
  return 'Verified ${normalized[0]}${normalized.substring(1).toLowerCase()}';
}

IconData _iconForCategory(String value) {
  final normalized = value.toLowerCase();
  if (normalized.contains('power') || normalized.contains('electrical')) {
    return Icons.electrical_services_rounded;
  }
  if (normalized.contains('wiring')) return Icons.cable_rounded;
  return Icons.home_repair_service_rounded;
}
