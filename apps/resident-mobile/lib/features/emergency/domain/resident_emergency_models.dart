enum IncidentKind { medical, fire, security }

enum DeliveryChannel { data, sms, offlineQueue }

enum IncidentStage { draft, queued, sent, dispatching, responderEnRoute, resolved, cancelled, silentActive }

enum ResidentLanguage { english, pidgin, yoruba, hausa, igbo }

enum DeviceMode { normal, lowBattery, restrictedBackground, offline }

class TrustedContact {
  const TrustedContact({
    required this.id,
    required this.name,
    required this.role,
    required this.phone,
    required this.verified,
    required this.notifyBySms,
  });

  final String id;
  final String name;
  final String role;
  final String phone;
  final bool verified;
  final bool notifyBySms;

  TrustedContact copyWith({
    String? id,
    String? name,
    String? role,
    String? phone,
    bool? verified,
    bool? notifyBySms,
  }) {
    return TrustedContact(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      verified: verified ?? this.verified,
      notifyBySms: notifyBySms ?? this.notifyBySms,
    );
  }
}

class EmergencyIncident {
  const EmergencyIncident({
    required this.id,
    required this.kind,
    required this.stage,
    required this.createdAt,
    required this.locationNote,
    required this.channel,
    required this.smsFallbackVisible,
    required this.silent,
    required this.duress,
    this.responderName,
    this.queuePosition,
    this.detail,
  });

  final String id;
  final IncidentKind kind;
  final IncidentStage stage;
  final DateTime createdAt;
  final String locationNote;
  final DeliveryChannel channel;
  final bool smsFallbackVisible;
  final bool silent;
  final bool duress;
  final String? responderName;
  final int? queuePosition;
  final String? detail;

  EmergencyIncident copyWith({
    IncidentKind? kind,
    IncidentStage? stage,
    DateTime? createdAt,
    String? locationNote,
    DeliveryChannel? channel,
    bool? smsFallbackVisible,
    bool? silent,
    bool? duress,
    String? responderName,
    int? queuePosition,
    String? detail,
  }) {
    return EmergencyIncident(
      id: id,
      kind: kind ?? this.kind,
      stage: stage ?? this.stage,
      createdAt: createdAt ?? this.createdAt,
      locationNote: locationNote ?? this.locationNote,
      channel: channel ?? this.channel,
      smsFallbackVisible: smsFallbackVisible ?? this.smsFallbackVisible,
      silent: silent ?? this.silent,
      duress: duress ?? this.duress,
      responderName: responderName ?? this.responderName,
      queuePosition: queuePosition ?? this.queuePosition,
      detail: detail ?? this.detail,
    );
  }
}

class OfflineQueueItem {
  const OfflineQueueItem({
    required this.id,
    required this.incidentId,
    required this.channel,
    required this.status,
    required this.attemptCount,
    required this.createdAt,
  });

  final String id;
  final String incidentId;
  final DeliveryChannel channel;
  final String status;
  final int attemptCount;
  final DateTime createdAt;

  OfflineQueueItem copyWith({
    String? status,
    int? attemptCount,
  }) {
    return OfflineQueueItem(
      id: id,
      incidentId: incidentId,
      channel: channel,
      status: status ?? this.status,
      attemptCount: attemptCount ?? this.attemptCount,
      createdAt: createdAt,
    );
  }
}
