import 'package:flutter/foundation.dart';
import 'package:resident_mobile/features/emergency/domain/resident_emergency_models.dart';

class ResidentEmergencyController extends ChangeNotifier {
  ResidentLanguage language = ResidentLanguage.english;
  IncidentKind selectedKind = IncidentKind.medical;
  DeviceMode deviceMode = DeviceMode.offline;
  bool accessibilityMode = false;
  bool smsFallbackReady = true;
  bool silentPanicArmed = false;
  bool onboardingComplete = false;
  bool pilotDemoMode = true;
  bool lowResourceMode = true;
  String syncMessage = 'Offline queue protected';
  int batteryPercent = 12;

  final List<TrustedContact> contacts = [
    const TrustedContact(
      id: 'contact-family-1',
      name: 'Aunty Bisi',
      role: 'Family contact',
      phone: '+234 803 000 1482',
      verified: true,
      notifyBySms: true,
    ),
    const TrustedContact(
      id: 'contact-gate-1',
      name: 'Estate gate',
      role: 'Nearby responder',
      phone: '+234 701 230 4419',
      verified: true,
      notifyBySms: true,
    ),
    const TrustedContact(
      id: 'contact-clinic-1',
      name: 'Yaba clinic desk',
      role: 'Medical support',
      phone: '+234 809 224 7011',
      verified: false,
      notifyBySms: false,
    ),
  ];

  final List<EmergencyIncident> incidents = [
    EmergencyIncident(
      id: 'MED-1804',
      kind: IncidentKind.medical,
      stage: IncidentStage.resolved,
      createdAt: DateTime(2026, 5, 18, 21, 14),
      locationNote: 'Home compound, Yaba',
      channel: DeliveryChannel.sms,
      smsFallbackVisible: true,
      silent: false,
      duress: false,
      responderName: 'Yaba clinic desk',
      detail: 'SMS delivered during poor data coverage. Synced after network recovery.',
    ),
    EmergencyIncident(
      id: 'SEC-1732',
      kind: IncidentKind.security,
      stage: IncidentStage.cancelled,
      createdAt: DateTime(2026, 5, 14, 8, 40),
      locationNote: 'Estate gate',
      channel: DeliveryChannel.data,
      smsFallbackVisible: false,
      silent: true,
      duress: false,
      responderName: 'Estate gate',
      detail: 'Silent panic test cancelled with safe code.',
    ),
  ];

  final List<OfflineQueueItem> offlineQueue = [];

  EmergencyIncident? get activeIncident {
    for (final incident in incidents) {
      if (incident.stage != IncidentStage.resolved && incident.stage != IncidentStage.cancelled) {
        return incident;
      }
    }
    return null;
  }

  bool get isOffline => deviceMode == DeviceMode.offline || deviceMode == DeviceMode.restrictedBackground;
  bool get lowBatteryMode => batteryPercent < 15 || deviceMode == DeviceMode.lowBattery;

  void completeOnboarding() {
    onboardingComplete = true;
    notifyListeners();
  }

  void setLanguage(ResidentLanguage value) {
    language = value;
    notifyListeners();
  }

  void setIncidentKind(IncidentKind value) {
    selectedKind = value;
    notifyListeners();
  }

  void setAccessibilityMode(bool value) {
    accessibilityMode = value;
    notifyListeners();
  }

  void setPilotDemoMode(bool value) {
    pilotDemoMode = value;
    notifyListeners();
  }

  void setLowResourceMode(bool value) {
    lowResourceMode = value;
    notifyListeners();
  }

  void setDeviceMode(DeviceMode value) {
    deviceMode = value;
    notifyListeners();
  }

  void setSmsFallbackReady(bool value) {
    smsFallbackReady = value;
    notifyListeners();
  }

  void setBatteryPercent(int value) {
    batteryPercent = value.clamp(1, 100).toInt();
    if (batteryPercent < 15) {
      deviceMode = DeviceMode.lowBattery;
    }
    notifyListeners();
  }

  void armSilentPanic() {
    silentPanicArmed = true;
    notifyListeners();
  }

  EmergencyIncident activateEmergency({required String locationNote}) {
    final now = DateTime.now();
    final id = '${_kindPrefix(selectedKind)}-${now.millisecondsSinceEpoch.toString().substring(7)}';
    final channel = isOffline
        ? DeliveryChannel.offlineQueue
        : smsFallbackReady
            ? DeliveryChannel.sms
            : DeliveryChannel.data;
    final incident = EmergencyIncident(
      id: id,
      kind: selectedKind,
      stage: silentPanicArmed ? IncidentStage.silentActive : IncidentStage.queued,
      createdAt: now,
      locationNote: locationNote.trim().isEmpty ? 'Resident mobile emergency alert' : locationNote.trim(),
      channel: channel,
      smsFallbackVisible: smsFallbackReady,
      silent: silentPanicArmed,
      duress: false,
      responderName: null,
      queuePosition: incidents.where((item) => item.stage == IncidentStage.queued).length + 1,
      detail: silentPanicArmed
          ? 'Silent alert created. Resident screen remains calm while operators see coercion risk.'
          : 'Emergency alert created and prepared for operator dispatch.',
    );

    incidents.insert(0, incident);
    if (channel == DeliveryChannel.offlineQueue || channel == DeliveryChannel.sms) {
      offlineQueue.insert(
        0,
        OfflineQueueItem(
          id: 'queue-${id.toLowerCase()}',
          incidentId: id,
          channel: channel,
          status: channel == DeliveryChannel.sms ? 'sms-ready' : 'pending-sync',
          attemptCount: 0,
          createdAt: now,
        ),
      );
    }
    notifyListeners();
    return incident;
  }

  void cancelEmergency(String incidentId, String code) {
    final index = incidents.indexWhere((incident) => incident.id == incidentId);
    if (index == -1) return;

    final isDuress = code == '9090';
    incidents[index] = incidents[index].copyWith(
      stage: isDuress ? IncidentStage.silentActive : IncidentStage.cancelled,
      silent: isDuress || incidents[index].silent,
      duress: isDuress,
      detail: isDuress
          ? 'Screen shows cancellation. Operators continue response as coercion risk.'
          : 'Emergency cancelled with safe code.',
    );
    silentPanicArmed = isDuress;
    notifyListeners();
  }

  void markDispatching(String incidentId) {
    _updateIncident(
      incidentId,
      (incident) => incident.copyWith(
        stage: IncidentStage.dispatching,
        responderName: 'Yaba response desk',
        detail: 'Operator acknowledged and responder dispatch is in progress.',
      ),
    );
  }

  void markResponderEnRoute(String incidentId) {
    _updateIncident(
      incidentId,
      (incident) => incident.copyWith(
        stage: IncidentStage.responderEnRoute,
        responderName: 'Nearest verified responder',
        detail: 'Responder is en route. Location updates are reduced when battery is low.',
      ),
    );
  }

  void runPilotResponderSimulation() {
    final incident = activeIncident;
    if (incident == null) {
      final created = activateEmergency(locationNote: 'Pilot demo: Yaba, Lagos');
      markDispatching(created.id);
      return;
    }

    if (incident.stage == IncidentStage.queued || incident.stage == IncidentStage.silentActive) {
      markDispatching(incident.id);
      return;
    }

    if (incident.stage == IncidentStage.dispatching) {
      markResponderEnRoute(incident.id);
    }
  }

  void markOfflineQueueSynced(String queueId) {
    final index = offlineQueue.indexWhere((item) => item.id == queueId);
    if (index == -1) return;
    offlineQueue[index] = offlineQueue[index].copyWith(
      status: 'synced',
      attemptCount: offlineQueue[index].attemptCount + 1,
    );
    syncMessage = 'Queued alert restored and synced';
    notifyListeners();
  }

  void simulateOfflineRestoration() {
    if (offlineQueue.isEmpty) {
      final incident = activateEmergency(locationNote: 'Pilot demo: offline restoration');
      syncMessage = 'Offline alert created for replay';
      markDispatching(incident.id);
      return;
    }

    for (var index = 0; index < offlineQueue.length; index += 1) {
      offlineQueue[index] = offlineQueue[index].copyWith(
        status: 'synced',
        attemptCount: offlineQueue[index].attemptCount + 1,
      );
    }
    syncMessage = 'Offline queue restored after network return';
    notifyListeners();
  }

  void addContact({
    required String name,
    required String role,
    required String phone,
  }) {
    contacts.add(
      TrustedContact(
        id: 'contact-${DateTime.now().microsecondsSinceEpoch}',
        name: name.trim(),
        role: role.trim().isEmpty ? 'Trusted contact' : role.trim(),
        phone: phone.trim(),
        verified: false,
        notifyBySms: true,
      ),
    );
    notifyListeners();
  }

  void removeContact(String id) {
    contacts.removeWhere((contact) => contact.id == id);
    notifyListeners();
  }

  void toggleContactSms(String id) {
    final index = contacts.indexWhere((contact) => contact.id == id);
    if (index == -1) return;
    contacts[index] = contacts[index].copyWith(notifyBySms: !contacts[index].notifyBySms);
    notifyListeners();
  }

  void _updateIncident(String incidentId, EmergencyIncident Function(EmergencyIncident) update) {
    final index = incidents.indexWhere((incident) => incident.id == incidentId);
    if (index == -1) return;
    incidents[index] = update(incidents[index]);
    notifyListeners();
  }

  String _kindPrefix(IncidentKind kind) {
    switch (kind) {
      case IncidentKind.medical:
        return 'MED';
      case IncidentKind.fire:
        return 'FIR';
      case IncidentKind.security:
        return 'SEC';
    }
  }
}
