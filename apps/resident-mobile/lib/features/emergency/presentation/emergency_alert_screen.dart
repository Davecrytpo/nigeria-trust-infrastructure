import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:resident_mobile/core/presentation/emergency_components.dart';
import 'package:resident_mobile/core/presentation/resident_emergency_theme.dart';
import 'package:resident_mobile/features/emergency/application/resident_emergency_controller.dart';
import 'package:resident_mobile/features/emergency/domain/resident_emergency_models.dart';
import 'package:resident_mobile/features/emergency/presentation/resident_copy.dart';

enum ResidentTab { sos, contacts, queue, history, tracking, settings }

class EmergencyAlertScreen extends StatefulWidget {
  const EmergencyAlertScreen({super.key});

  @override
  State<EmergencyAlertScreen> createState() => _EmergencyAlertScreenState();
}

class _EmergencyAlertScreenState extends State<EmergencyAlertScreen> {
  final ResidentEmergencyController _controller = ResidentEmergencyController();
  ResidentTab _tab = ResidentTab.sos;
  int _holdProgress = 0;
  Timer? _holdTimer;

  ResidentCopy get _copy => ResidentCopy(_controller.language);

  @override
  void initState() {
    super.initState();
    _controller.addListener(_refresh);
  }

  @override
  void dispose() {
    _holdTimer?.cancel();
    _controller.removeListener(_refresh);
    _controller.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final scale = _controller.accessibilityMode ? 1.16 : 1.0;
    final motionEnabled = !_controller.accessibilityMode && !_controller.lowResourceMode;

    return MediaQuery(
      data: MediaQuery.of(context).copyWith(textScaleFactor: scale),
      child: SafeArea(
        child: Scaffold(
          appBar: AppBar(
            title: Text(_copy.appTitle),
            actions: [
              IconButton(
                tooltip: _copy.accessibility,
                onPressed: () => _controller.setAccessibilityMode(!_controller.accessibilityMode),
                icon: Icon(_controller.accessibilityMode ? Icons.record_voice_over : Icons.accessibility_new),
              ),
              IconButton(
                tooltip: 'Silent panic',
                onPressed: _controller.armSilentPanic,
                icon: Icon(_controller.silentPanicArmed ? Icons.visibility_off : Icons.visibility),
              ),
            ],
          ),
          body: Column(
            children: [
              _StatusStrip(controller: _controller),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.paddingOf(context).bottom + 16),
                  child: EmergencyAnimatedPage(
                    motionEnabled: motionEnabled,
                    child: _controller.onboardingComplete ? _buildTab() : _OnboardingPanel(controller: _controller),
                  ),
                ),
              ),
            ],
          ),
          bottomNavigationBar: NavigationBar(
            selectedIndex: ResidentTab.values.indexOf(_tab),
            onDestinationSelected: (index) => setState(() => _tab = ResidentTab.values[index]),
            height: _controller.accessibilityMode ? 76 : 68,
            destinations: const [
              NavigationDestination(icon: Icon(Icons.emergency_share), label: 'SOS'),
              NavigationDestination(icon: Icon(Icons.group), label: 'Contacts'),
              NavigationDestination(icon: Icon(Icons.cloud_sync), label: 'Queue'),
              NavigationDestination(icon: Icon(Icons.receipt_long), label: 'History'),
              NavigationDestination(icon: Icon(Icons.route), label: 'Map'),
              NavigationDestination(icon: Icon(Icons.tune), label: 'Mode'),
            ],
          ),
          floatingActionButton: _controller.onboardingComplete && _tab != ResidentTab.sos
              ? FloatingActionButton.extended(
                  heroTag: 'quick-sos',
                  backgroundColor: ResidentEmergencyTheme.danger,
                  foregroundColor: ResidentEmergencyTheme.text,
                  onPressed: () {
                    HapticFeedback.selectionClick();
                    setState(() => _tab = ResidentTab.sos);
                  },
                  icon: const Icon(Icons.emergency_share),
                  label: const Text('SOS'),
                )
              : null,
          floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        ),
      ),
    );
  }

  Widget _buildTab() {
    switch (_tab) {
      case ResidentTab.sos:
        return _SosView(
          controller: _controller,
          holdProgress: _holdProgress,
          onHoldStart: _startSosHold,
          onHoldEnd: _cancelSosHold,
          onCancel: _showCancelSheet,
        );
      case ResidentTab.contacts:
        return _ContactsView(controller: _controller, onAdd: _showContactSheet);
      case ResidentTab.queue:
        return _QueueView(controller: _controller);
      case ResidentTab.history:
        return _HistoryView(controller: _controller, onOpen: _openIncidentDetail);
      case ResidentTab.tracking:
        return _TrackingView(controller: _controller, onOpen: _openIncidentDetail);
      case ResidentTab.settings:
        return _SettingsView(controller: _controller);
    }
  }

  void _startSosHold() {
    _holdTimer?.cancel();
    HapticFeedback.selectionClick();
    setState(() => _holdProgress = 0);
    _holdTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() => _holdProgress = (_holdProgress + 1).clamp(0, 3).toInt());
      HapticFeedback.selectionClick();
      if (_holdProgress >= 3) {
        timer.cancel();
        _activateSos();
      }
    });
  }

  void _cancelSosHold() {
    if (_holdProgress >= 3) return;
    _holdTimer?.cancel();
    if (_holdProgress > 0) {
      HapticFeedback.lightImpact();
    }
    setState(() => _holdProgress = 0);
  }

  void _activateSos() {
    _holdTimer?.cancel();
    HapticFeedback.heavyImpact();
    if (_controller.activeIncident == null || _controller.activeIncident?.stage == IncidentStage.cancelled) {
      final incident = _controller.activateEmergency(locationNote: 'Last known location: Yaba, Lagos');
      _controller.markDispatching(incident.id);
    }
    setState(() {
      _holdProgress = 0;
      _tab = ResidentTab.tracking;
    });
  }

  Future<void> _showCancelSheet(EmergencyIncident? incident) async {
    if (incident == null) return;
    final codeController = TextEditingController();
    final code = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: ResidentEmergencyTheme.surface,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.viewInsetsOf(context).bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Cancel emergency', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text('Use the safe code to cancel. Use the duress code if someone is forcing you; the screen will look calm while operators continue.'),
              const SizedBox(height: 14),
              TextField(
                controller: codeController,
                obscureText: true,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Safe or duress code'),
              ),
              const SizedBox(height: 14),
              FilledButton(onPressed: () => Navigator.pop(context, codeController.text.trim()), child: const Text('Continue')),
            ],
          ),
        );
      },
    );
    if (code != null) _controller.cancelEmergency(incident.id, code);
  }

  Future<void> _showContactSheet() async {
    final name = TextEditingController();
    final role = TextEditingController();
    final phone = TextEditingController();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ResidentEmergencyTheme.surface,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.viewInsetsOf(context).bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Add trusted contact', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextField(controller: name, decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Name')),
              const SizedBox(height: 10),
              TextField(controller: role, decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Role')),
              const SizedBox(height: 10),
              TextField(controller: phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Phone')),
              const SizedBox(height: 14),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save contact')),
            ],
          ),
        );
      },
    );
    if (saved == true && name.text.trim().isNotEmpty && phone.text.trim().isNotEmpty) {
      _controller.addContact(name: name.text, role: role.text, phone: phone.text);
    }
  }

  void _openIncidentDetail(EmergencyIncident incident) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: ResidentEmergencyTheme.surface,
      showDragHandle: true,
      builder: (context) => _IncidentDetailSheet(controller: _controller, incident: incident),
    );
  }
}

class _StatusStrip extends StatelessWidget {
  const _StatusStrip({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    final tone = controller.lowBatteryMode
        ? EmergencyTone.warning
        : controller.isOffline
            ? EmergencyTone.offline
            : EmergencyTone.recovery;
    final title = controller.lowBatteryMode
        ? 'Low power protection'
        : controller.isOffline
            ? 'Offline protection active'
            : 'Protected and online';
    final message = [
      controller.smsFallbackReady ? 'SMS ready' : 'SMS off',
      '${controller.batteryPercent}% battery',
      controller.silentPanicArmed ? 'silent armed' : 'visible mode',
    ].join(' - ');

    return Material(
      color: ResidentEmergencyTheme.graphite,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
          child: Row(
            children: [
              EmergencyIconBlock(
                icon: controller.isOffline ? Icons.cloud_off : Icons.verified_user,
                tone: tone,
              ),
              const SizedBox(width: ResidentEmergencyTheme.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: ResidentEmergencyTheme.space1),
                    Text(message, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const SizedBox(width: ResidentEmergencyTheme.space2),
              EmergencyStatusPill(
                icon: Icons.sms,
                label: controller.smsFallbackReady ? 'SMS' : 'No SMS',
                tone: controller.smsFallbackReady ? EmergencyTone.warning : EmergencyTone.offline,
                active: controller.smsFallbackReady,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPanel extends StatelessWidget {
  const _OnboardingPanel({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmergencyHeaderCard(
          icon: Icons.health_and_safety,
          title: 'One-minute emergency setup',
          body: 'Choose language, confirm SMS contact, then start protected mode.',
          tone: EmergencyTone.calm,
        ),
        const SizedBox(height: 12),
        _LanguagePicker(controller: controller),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: TrustIndicator(label: 'Contacts', value: '${controller.contacts.length} ready', tone: EmergencyTone.calm)),
            const SizedBox(width: ResidentEmergencyTheme.space3),
            Expanded(child: TrustIndicator(label: 'Fallback', value: controller.smsFallbackReady ? 'SMS ready' : 'Check SMS', tone: controller.smsFallbackReady ? EmergencyTone.warning : EmergencyTone.offline)),
          ],
        ),
        const SizedBox(height: 12),
        _ReadinessChecklist(controller: controller),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: controller.contacts.where((contact) => contact.notifyBySms).isEmpty ? null : controller.completeOnboarding,
          icon: const Icon(Icons.verified_user),
          label: const Text('Start protected mode'),
        ),
      ],
    );
  }
}

class _SosView extends StatelessWidget {
  const _SosView({required this.controller, required this.holdProgress, required this.onHoldStart, required this.onHoldEnd, required this.onCancel});

  final ResidentEmergencyController controller;
  final int holdProgress;
  final VoidCallback onHoldStart;
  final VoidCallback onHoldEnd;
  final ValueChanged<EmergencyIncident?> onCancel;

  @override
  Widget build(BuildContext context) {
    final copy = ResidentCopy(controller.language);
    final active = controller.activeIncident;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EmergencyHeaderCard(
          icon: controller.silentPanicArmed ? Icons.visibility_off : Icons.health_and_safety,
          title: controller.silentPanicArmed ? copy.silentTitle : copy.readyTitle,
          body: controller.silentPanicArmed ? 'Normal screen remains visible. Operators receive coercion risk.' : copy.readyBody,
          tone: controller.silentPanicArmed ? EmergencyTone.warning : EmergencyTone.calm,
        ),
        const SizedBox(height: 12),
        _IncidentSelector(controller: controller),
        const SizedBox(height: 14),
        if (active != null) ...[
          _ActiveEmergencyPanel(controller: controller, incident: active),
          const SizedBox(height: 14),
        ],
        Semantics(
          button: true,
          label: controller.silentPanicArmed ? 'Silent emergency help button. Hold for help.' : 'Emergency SOS button. Hold for help.',
          hint: 'Activates emergency alert after a continuous three-second hold.',
          child: CalmSosButton(
            progress: holdProgress,
            silent: controller.silentPanicArmed,
            lowResourceMode: controller.lowResourceMode,
            onHoldStart: onHoldStart,
            onHoldEnd: onHoldEnd,
          ),
        ),
        const SizedBox(height: 12),
        CalmBanner(
          icon: controller.silentPanicArmed ? Icons.visibility_off : Icons.verified_user,
          title: controller.silentPanicArmed ? 'Quiet mode is protecting you' : 'You stay in control',
          message: controller.silentPanicArmed ? 'The screen stays calm. Operators see the coercion risk.' : 'The phone saves the alert first, then sends by data or SMS.',
          tone: controller.silentPanicArmed ? EmergencyTone.warning : EmergencyTone.calm,
        ),
        const SizedBox(height: 12),
        if (controller.pilotDemoMode) ...[
          EmergencyCompactAction(icon: Icons.play_circle, label: 'Run pilot simulation', onTap: controller.runPilotResponderSimulation),
          const SizedBox(height: 12),
        ],
        LinearProgressIndicator(
          minHeight: 8,
          borderRadius: BorderRadius.circular(8),
          value: holdProgress / 3,
          color: ResidentEmergencyTheme.amber,
          backgroundColor: ResidentEmergencyTheme.surfaceRaised,
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: active == null ? null : () => onCancel(active),
          icon: const Icon(Icons.lock_reset),
          label: const Text('Cancel or enter duress code'),
        ),
        const SizedBox(height: 12),
        _DeliveryCard(controller: controller),
      ],
    );
  }
}

class _ActiveEmergencyPanel extends StatelessWidget {
  const _ActiveEmergencyPanel({required this.controller, required this.incident});

  final ResidentEmergencyController controller;
  final EmergencyIncident incident;

  @override
  Widget build(BuildContext context) {
    final isSilent = incident.silent || controller.silentPanicArmed;
    return EmergencySurface(
      elevated: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              EmergencyIconBlock(
                icon: isSilent ? Icons.visibility_off : Icons.verified_user,
                tone: isSilent ? EmergencyTone.warning : EmergencyTone.recovery,
              ),
              const SizedBox(width: ResidentEmergencyTheme.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isSilent ? 'Silent help is active' : 'Help request saved', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: ResidentEmergencyTheme.space1),
                    Text(_stageLabel(incident.stage), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: ResidentEmergencyTheme.space3),
          EmergencyTimelineStep(done: true, label: 'Saved on this phone', tone: EmergencyTone.recovery),
          EmergencyTimelineStep(done: incident.channel != DeliveryChannel.data || !controller.isOffline, label: _channelLabel(incident.channel), tone: controller.isOffline ? EmergencyTone.warning : EmergencyTone.recovery),
          EmergencyTimelineStep(done: incident.stage == IncidentStage.dispatching || incident.stage == IncidentStage.responderEnRoute, label: 'Operator desk visible', tone: EmergencyTone.calm),
        ],
      ),
    );
  }
}

class _ContactsView extends StatelessWidget {
  const _ContactsView({required this.controller, required this.onAdd});

  final ResidentEmergencyController controller;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final copy = ResidentCopy(controller.language);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EmergencySectionTitle(title: copy.contacts, subtitle: 'Contacts used for SMS fallback and family notification.'),
        const SizedBox(height: 12),
        for (final contact in controller.contacts)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              child: ListTile(
                leading: Icon(contact.verified ? Icons.verified : Icons.pending, color: contact.verified ? ResidentEmergencyTheme.deepGreen : ResidentEmergencyTheme.amber),
                title: Text(contact.name),
                subtitle: Text('${contact.role}\n${contact.phone}'),
                isThreeLine: true,
                trailing: Wrap(
                  children: [
                    IconButton(
                      tooltip: contact.notifyBySms ? 'SMS enabled' : 'Enable SMS',
                      onPressed: () => controller.toggleContactSms(contact.id),
                      icon: Icon(contact.notifyBySms ? Icons.sms : Icons.sms_failed),
                    ),
                    IconButton(
                      tooltip: 'Remove contact',
                      onPressed: () => controller.removeContact(contact.id),
                      icon: const Icon(Icons.delete_outline),
                    ),
                  ],
                ),
              ),
            ),
          ),
        FilledButton.icon(onPressed: onAdd, icon: const Icon(Icons.person_add), label: const Text('Add trusted contact')),
      ],
    );
  }
}

class _QueueView extends StatelessWidget {
  const _QueueView({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EmergencySectionTitle(title: ResidentCopy(controller.language).offlineQueue, subtitle: 'Local evidence of alerts waiting for data sync or SMS delivery.'),
        const SizedBox(height: 12),
        CalmBanner(
          icon: controller.isOffline ? Icons.cloud_off : Icons.cloud_done,
          title: controller.isOffline ? 'Offline mode is expected' : 'Network route available',
          message: controller.syncMessage,
          tone: controller.isOffline ? EmergencyTone.offline : EmergencyTone.recovery,
        ),
        const SizedBox(height: 12),
        if (controller.pilotDemoMode) ...[
          EmergencyPrimaryAction(
            icon: Icons.restore,
            label: 'Simulate offline restoration',
            onPressed: controller.simulateOfflineRestoration,
            tone: EmergencyTone.recovery,
          ),
          const SizedBox(height: 12),
        ],
        if (controller.offlineQueue.isEmpty)
          const EmergencyEmptyState(icon: Icons.cloud_done, title: 'Queue clear', body: 'No unsynced emergency alerts on this device.'),
        for (final item in controller.offlineQueue)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              child: ListTile(
                leading: const Icon(Icons.cloud_sync, color: ResidentEmergencyTheme.amber),
                title: Text(item.incidentId),
                subtitle: Text('${_channelLabel(item.channel)} - ${item.status} - attempts ${item.attemptCount}'),
                trailing: OutlinedButton(
                  onPressed: item.status == 'synced' ? null : () => controller.markOfflineQueueSynced(item.id),
                  child: const Text('Mark synced'),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _HistoryView extends StatelessWidget {
  const _HistoryView({required this.controller, required this.onOpen});

  final ResidentEmergencyController controller;
  final ValueChanged<EmergencyIncident> onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmergencySectionTitle(title: 'Incident history', subtitle: 'Readable records for resident, family, and operator review.'),
        const SizedBox(height: 12),
        for (final incident in controller.incidents)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _IncidentTile(incident: incident, onTap: () => onOpen(incident)),
          ),
      ],
    );
  }
}

class _TrackingView extends StatelessWidget {
  const _TrackingView({required this.controller, required this.onOpen});

  final ResidentEmergencyController controller;
  final ValueChanged<EmergencyIncident> onOpen;

  @override
  Widget build(BuildContext context) {
    final active = controller.activeIncident ?? (controller.incidents.isEmpty ? null : controller.incidents.first);

    if (active == null) {
      return const EmergencyEmptyState(icon: Icons.route, title: 'No active response', body: 'Responder tracking appears after SOS activation.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmergencySectionTitle(title: 'Responder map', subtitle: 'Low-data route view for weak networks and battery preservation.'),
        const SizedBox(height: 12),
        _LowBandwidthMap(incident: active, lowResourceMode: controller.lowResourceMode),
        const SizedBox(height: 12),
        CalmBanner(
          icon: active.stage == IncidentStage.responderEnRoute ? Icons.directions_run : Icons.support_agent,
          title: active.stage == IncidentStage.responderEnRoute ? 'Responder is moving' : 'Operator is coordinating',
          message: active.stage == IncidentStage.responderEnRoute
              ? 'Keep the phone reachable. Location updates are adjusted for battery and network conditions.'
              : 'Your alert is visible to the response desk. SMS fallback remains available.',
          tone: active.stage == IncidentStage.responderEnRoute ? EmergencyTone.recovery : EmergencyTone.calm,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: TrustIndicator(label: 'Responder', value: active.responderName ?? 'Assigning', tone: active.responderName == null ? EmergencyTone.warning : EmergencyTone.calm)),
            const SizedBox(width: ResidentEmergencyTheme.space3),
            Expanded(child: TrustIndicator(label: 'Location', value: controller.lowBatteryMode ? 'Low power' : 'Live route', tone: controller.lowBatteryMode ? EmergencyTone.warning : EmergencyTone.recovery)),
          ],
        ),
        const SizedBox(height: 12),
        _IncidentTile(incident: active, onTap: () => onOpen(active)),
        const SizedBox(height: 12),
        const EmergencyTimelineStep(done: true, label: 'Resident alert created'),
        EmergencyTimelineStep(done: active.stage != IncidentStage.queued, label: 'Operator desk acknowledged'),
        EmergencyTimelineStep(done: active.stage == IncidentStage.responderEnRoute || active.stage == IncidentStage.resolved, label: controller.lowBatteryMode ? 'Responder tracking with low-power GPS' : 'Live responder tracking'),
        EmergencyTimelineStep(done: active.stage == IncidentStage.resolved, label: 'Arrival confirmed'),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: active.stage == IncidentStage.dispatching ? () => controller.markResponderEnRoute(active.id) : null,
          icon: const Icon(Icons.directions_run),
          label: const Text('Confirm responder en route'),
        ),
      ],
    );
  }
}

class _SettingsView extends StatelessWidget {
  const _SettingsView({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmergencySectionTitle(title: 'Emergency mode', subtitle: 'Production controls for field behavior, battery, network, and language.'),
        const SizedBox(height: 12),
        _LanguagePicker(controller: controller),
        const SizedBox(height: 12),
        _SwitchRow(
          icon: Icons.record_voice_over,
          title: 'Accessibility mode',
          subtitle: 'Larger type, lower cognitive load, stronger icons.',
          value: controller.accessibilityMode,
          onChanged: controller.setAccessibilityMode,
        ),
        _SwitchRow(
          icon: Icons.sms,
          title: 'SMS fallback visible',
          subtitle: 'Shows backup communication route during crisis.',
          value: controller.smsFallbackReady,
          onChanged: controller.setSmsFallbackReady,
        ),
        _SwitchRow(
          icon: Icons.slideshow,
          title: 'Pilot demo mode',
          subtitle: 'Shows guided responder, fallback, and degraded-state examples for presentations.',
          value: controller.pilotDemoMode,
          onChanged: controller.setPilotDemoMode,
        ),
        _ModePicker(controller: controller),
        const SizedBox(height: 12),
        _SwitchRow(
          icon: Icons.memory,
          title: 'Low-spec phone mode',
          subtitle: 'Reduces motion and map detail for 4GB RAM and Android Go devices.',
          value: controller.lowResourceMode,
          onChanged: controller.setLowResourceMode,
        ),
        Text('Battery reserve', style: Theme.of(context).textTheme.titleMedium),
        Slider(
          value: controller.batteryPercent.toDouble(),
          min: 1,
          max: 100,
          divisions: 99,
          label: '${controller.batteryPercent}%',
          onChanged: (value) => controller.setBatteryPercent(value.round()),
        ),
      ],
    );
  }
}

class _LanguagePicker extends StatelessWidget {
  const _LanguagePicker({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<ResidentLanguage>(
      value: controller.language,
      dropdownColor: ResidentEmergencyTheme.surface,
      decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Language readiness'),
      items: const [
        DropdownMenuItem(value: ResidentLanguage.english, child: Text('English')),
        DropdownMenuItem(value: ResidentLanguage.pidgin, child: Text('Nigerian Pidgin')),
        DropdownMenuItem(value: ResidentLanguage.yoruba, child: Text('Yoruba')),
        DropdownMenuItem(value: ResidentLanguage.hausa, child: Text('Hausa')),
        DropdownMenuItem(value: ResidentLanguage.igbo, child: Text('Igbo')),
      ],
      onChanged: (value) {
        if (value != null) controller.setLanguage(value);
      },
    );
  }
}

class _ModePicker extends StatelessWidget {
  const _ModePicker({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<DeviceMode>(
      value: controller.deviceMode,
      dropdownColor: ResidentEmergencyTheme.surface,
      decoration: const InputDecoration(border: OutlineInputBorder(), labelText: 'Device/network mode'),
      items: const [
        DropdownMenuItem(value: DeviceMode.normal, child: Text('Normal network')),
        DropdownMenuItem(value: DeviceMode.offline, child: Text('Offline first')),
        DropdownMenuItem(value: DeviceMode.lowBattery, child: Text('Ultra-low battery')),
        DropdownMenuItem(value: DeviceMode.restrictedBackground, child: Text('Android restricted background')),
      ],
      onChanged: (value) {
        if (value != null) controller.setDeviceMode(value);
      },
    );
  }
}

class _IncidentSelector extends StatelessWidget {
  const _IncidentSelector({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        EmergencySegmentButton(
          icon: Icons.medical_services,
          label: 'Medical',
          selected: controller.selectedKind == IncidentKind.medical,
          onTap: () => controller.setIncidentKind(IncidentKind.medical),
        ),
        const SizedBox(width: ResidentEmergencyTheme.space2),
        EmergencySegmentButton(
          icon: Icons.local_fire_department,
          label: 'Fire',
          selected: controller.selectedKind == IncidentKind.fire,
          onTap: () => controller.setIncidentKind(IncidentKind.fire),
        ),
        const SizedBox(width: ResidentEmergencyTheme.space2),
        EmergencySegmentButton(
          icon: Icons.shield,
          label: 'Security',
          selected: controller.selectedKind == IncidentKind.security,
          onTap: () => controller.setIncidentKind(IncidentKind.security),
        ),
      ],
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Delivery route', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            _ModeLine(icon: Icons.cloud_off, label: controller.isOffline ? 'Offline queue armed' : 'Data route active', active: controller.isOffline),
            _ModeLine(icon: Icons.sms, label: controller.smsFallbackReady ? 'SMS fallback ready' : 'SMS fallback hidden', active: controller.smsFallbackReady),
            _ModeLine(icon: Icons.battery_saver, label: controller.lowBatteryMode ? 'Low-power GPS enabled' : 'Normal GPS cadence', active: controller.lowBatteryMode),
          ],
        ),
      ),
    );
  }
}

class _ReadinessChecklist extends StatelessWidget {
  const _ReadinessChecklist({required this.controller});

  final ResidentEmergencyController controller;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            EmergencyTimelineStep(done: controller.contacts.isNotEmpty, label: '${controller.contacts.length} trusted contacts ready'),
            EmergencyTimelineStep(done: controller.contacts.any((contact) => contact.notifyBySms), label: 'SMS backup contact enabled'),
            EmergencyTimelineStep(done: controller.smsFallbackReady, label: 'SMS fallback visible'),
            EmergencyTimelineStep(done: controller.lowBatteryMode, label: 'Low-battery mode visible'),
          ],
        ),
      ),
    );
  }
}

class _IncidentDetailSheet extends StatelessWidget {
  const _IncidentDetailSheet({required this.controller, required this.incident});

  final ResidentEmergencyController controller;
  final EmergencyIncident incident;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 22),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(incident.id, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('${_kindLabel(incident.kind)} - ${_stageLabel(incident.stage)}'),
          const SizedBox(height: 8),
          Text(incident.locationNote),
          const SizedBox(height: 8),
          Text(incident.detail ?? 'No detail recorded.'),
          const SizedBox(height: 12),
          _ModeLine(icon: Icons.sms, label: incident.smsFallbackVisible ? 'SMS fallback visible' : 'Data only', active: incident.smsFallbackVisible),
          _ModeLine(icon: Icons.visibility_off, label: incident.silent ? 'Silent/coercion-aware flow' : 'Visible resident flow', active: incident.silent),
          _ModeLine(icon: Icons.cloud_sync, label: _channelLabel(incident.channel), active: incident.channel != DeliveryChannel.data),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: incident.stage == IncidentStage.dispatching ? () => controller.markResponderEnRoute(incident.id) : null,
            icon: const Icon(Icons.route),
            label: const Text('Advance responder tracking'),
          ),
        ],
      ),
    );
  }
}

class _IncidentTile extends StatelessWidget {
  const _IncidentTile({required this.incident, required this.onTap});

  final EmergencyIncident incident;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: Icon(_kindIcon(incident.kind), color: incident.duress ? ResidentEmergencyTheme.amber : ResidentEmergencyTheme.deepGreen),
        title: Text('${incident.id} - ${_kindLabel(incident.kind)}'),
        subtitle: Text('${_stageLabel(incident.stage)}\n${incident.locationNote}'),
        isThreeLine: true,
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _LowBandwidthMap extends StatelessWidget {
  const _LowBandwidthMap({required this.incident, required this.lowResourceMode});

  final EmergencyIncident incident;
  final bool lowResourceMode;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
        height: lowResourceMode ? 188 : 210,
        decoration: BoxDecoration(
          color: ResidentEmergencyTheme.graphite,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF34413A)),
        ),
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _LowBandwidthMapPainter(lowResourceMode: lowResourceMode))),
            const Positioned(left: 28, bottom: 34, child: _MapMarker(icon: Icons.home, label: 'You')),
            Positioned(
              right: 36,
              top: 32,
              child: _MapMarker(icon: incident.kind == IncidentKind.medical ? Icons.local_hospital : Icons.shield, label: 'Responder'),
            ),
          ],
        ),
      ),
    );
  }
}

class _LowBandwidthMapPainter extends CustomPainter {
  const _LowBandwidthMapPainter({required this.lowResourceMode});

  final bool lowResourceMode;

  @override
  void paint(Canvas canvas, Size size) {
    final road = Paint()
      ..color = const Color(0xFF3B4740)
      ..strokeWidth = lowResourceMode ? 3 : 4
      ..style = PaintingStyle.stroke;
    final route = Paint()
      ..color = ResidentEmergencyTheme.amber
      ..strokeWidth = lowResourceMode ? 4 : 5
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(0, size.height * 0.35), Offset(size.width, size.height * 0.2), road);
    if (!lowResourceMode) {
      canvas.drawLine(Offset(size.width * 0.14, size.height), Offset(size.width * 0.88, 0), road);
    }
    canvas.drawLine(Offset(size.width * 0.18, size.height * 0.76), Offset(size.width * 0.78, size.height * 0.28), route);
  }

  @override
  bool shouldRepaint(covariant _LowBandwidthMapPainter oldDelegate) => oldDelegate.lowResourceMode != lowResourceMode;
}

class _MapMarker extends StatelessWidget {
  const _MapMarker({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(color: ResidentEmergencyTheme.deepGreen, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 20),
        ),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({required this.icon, required this.title, required this.subtitle, required this.value, required this.onChanged});

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: SwitchListTile(
          secondary: Icon(icon, color: ResidentEmergencyTheme.amber),
          title: Text(title),
          subtitle: Text(subtitle),
          value: value,
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _ModeLine extends StatelessWidget {
  const _ModeLine({required this.icon, required this.label, required this.active});

  final IconData icon;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, color: active ? ResidentEmergencyTheme.amber : ResidentEmergencyTheme.mutedText),
          const SizedBox(width: 10),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }
}

String _kindLabel(IncidentKind kind) {
  switch (kind) {
    case IncidentKind.medical:
      return 'Medical';
    case IncidentKind.fire:
      return 'Fire';
    case IncidentKind.security:
      return 'Security';
  }
}

IconData _kindIcon(IncidentKind kind) {
  switch (kind) {
    case IncidentKind.medical:
      return Icons.medical_services;
    case IncidentKind.fire:
      return Icons.local_fire_department;
    case IncidentKind.security:
      return Icons.shield;
  }
}

String _stageLabel(IncidentStage stage) {
  switch (stage) {
    case IncidentStage.draft:
      return 'Draft';
    case IncidentStage.queued:
      return 'Queued';
    case IncidentStage.sent:
      return 'Sent';
    case IncidentStage.dispatching:
      return 'Dispatching';
    case IncidentStage.responderEnRoute:
      return 'Responder en route';
    case IncidentStage.resolved:
      return 'Resolved';
    case IncidentStage.cancelled:
      return 'Cancelled';
    case IncidentStage.silentActive:
      return 'Silent active';
  }
}

String _channelLabel(DeliveryChannel channel) {
  switch (channel) {
    case DeliveryChannel.data:
      return 'Data channel';
    case DeliveryChannel.sms:
      return 'SMS fallback';
    case DeliveryChannel.offlineQueue:
      return 'Offline encrypted queue';
  }
}
