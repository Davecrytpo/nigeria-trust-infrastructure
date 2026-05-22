import 'package:flutter/material.dart';
import 'package:resident_mobile/core/presentation/resident_emergency_theme.dart';

enum EmergencyTone { calm, warning, critical, offline, recovery }

Color emergencyToneColor(EmergencyTone tone) {
  switch (tone) {
    case EmergencyTone.calm:
      return ResidentEmergencyTheme.deepGreen;
    case EmergencyTone.warning:
      return ResidentEmergencyTheme.warning;
    case EmergencyTone.critical:
      return ResidentEmergencyTheme.danger;
    case EmergencyTone.offline:
      return ResidentEmergencyTheme.offline;
    case EmergencyTone.recovery:
      return ResidentEmergencyTheme.recovery;
  }
}

class EmergencySurface extends StatelessWidget {
  const EmergencySurface({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(ResidentEmergencyTheme.space4),
    this.elevated = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final bool elevated;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: elevated ? ResidentEmergencyTheme.surfaceRaised : ResidentEmergencyTheme.surface,
        borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius),
        border: Border.all(color: ResidentEmergencyTheme.line),
        boxShadow: elevated ? ResidentEmergencyTheme.softShadow : null,
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}

class EmergencyHeaderCard extends StatelessWidget {
  const EmergencyHeaderCard({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.tone = EmergencyTone.calm,
  });

  final IconData icon;
  final String title;
  final String body;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    final color = emergencyToneColor(tone);
    return EmergencySurface(
      child: Row(
        children: [
          EmergencyIconBlock(icon: icon, tone: tone),
          const SizedBox(width: ResidentEmergencyTheme.space4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: ResidentEmergencyTheme.space1),
                Text(body, maxLines: 3, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: ResidentEmergencyTheme.space2),
          Container(width: 4, height: 46, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius))),
        ],
      ),
    );
  }
}

class EmergencyIconBlock extends StatelessWidget {
  const EmergencyIconBlock({super.key, required this.icon, this.tone = EmergencyTone.calm});

  final IconData icon;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    final color = emergencyToneColor(tone);
    return Container(
      width: 54,
      height: 54,
      decoration: BoxDecoration(color: color.withOpacity(0.16), borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius)),
      child: Icon(icon, color: color, size: 28),
    );
  }
}

class EmergencyStatusPill extends StatelessWidget {
  const EmergencyStatusPill({
    super.key,
    required this.icon,
    required this.label,
    this.tone = EmergencyTone.calm,
    this.active = true,
  });

  final IconData icon;
  final String label;
  final EmergencyTone tone;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? emergencyToneColor(tone) : ResidentEmergencyTheme.offline;
    return Container(
      constraints: const BoxConstraints(minHeight: 40),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(active ? 0.18 : 0.12),
        borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius),
        border: Border.all(color: color.withOpacity(0.72)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: ResidentEmergencyTheme.text),
          const SizedBox(width: ResidentEmergencyTheme.space2),
          Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(color: ResidentEmergencyTheme.text)),
        ],
      ),
    );
  }
}

class EmergencySectionTitle extends StatelessWidget {
  const EmergencySectionTitle({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: ResidentEmergencyTheme.space1),
        Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

class EmergencyTimelineStep extends StatelessWidget {
  const EmergencyTimelineStep({super.key, required this.done, required this.label, this.tone = EmergencyTone.calm});

  final bool done;
  final String label;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: ResidentEmergencyTheme.space2),
      child: Row(
        children: [
          Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, color: done ? emergencyToneColor(tone) : ResidentEmergencyTheme.mutedText),
          const SizedBox(width: ResidentEmergencyTheme.space3),
          Expanded(child: Text(label, maxLines: 2, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}

class CalmSosButton extends StatelessWidget {
  const CalmSosButton({
    super.key,
    required this.progress,
    required this.silent,
    required this.onPressed,
  });

  final int progress;
  final bool silent;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final tone = silent ? EmergencyTone.warning : EmergencyTone.critical;
    final color = emergencyToneColor(tone);
    return SizedBox(
      height: 232,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.28), blurRadius: 24, offset: const Offset(0, 14)),
          ],
        ),
        child: FilledButton(
          onPressed: onPressed,
          style: FilledButton.styleFrom(
            backgroundColor: color,
            foregroundColor: silent ? ResidentEmergencyTheme.charcoal : ResidentEmergencyTheme.text,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ResidentEmergencyTheme.radius)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.emergency_share, size: 56),
              const SizedBox(height: ResidentEmergencyTheme.space3),
              Text('SOS', style: Theme.of(context).textTheme.displayLarge),
              const SizedBox(height: ResidentEmergencyTheme.space1),
              Text(progress == 0 ? 'Hold for help' : 'Hold ${3 - progress}s', style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ),
    );
  }
}

class CalmBanner extends StatelessWidget {
  const CalmBanner({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.tone = EmergencyTone.calm,
  });

  final IconData icon;
  final String title;
  final String message;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    final color = emergencyToneColor(tone);
    return EmergencySurface(
      elevated: true,
      child: Row(
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(width: ResidentEmergencyTheme.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: ResidentEmergencyTheme.space1),
                Text(message, maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class TrustIndicator extends StatelessWidget {
  const TrustIndicator({
    super.key,
    required this.label,
    required this.value,
    this.tone = EmergencyTone.calm,
  });

  final String label;
  final String value;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    final color = emergencyToneColor(tone);
    return EmergencySurface(
      padding: const EdgeInsets.all(ResidentEmergencyTheme.space3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: ResidentEmergencyTheme.space2),
          Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: ResidentEmergencyTheme.space2),
              Expanded(child: Text(value, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
            ],
          ),
        ],
      ),
    );
  }
}

class MotionFadeSlide extends StatelessWidget {
  const MotionFadeSlide({super.key, required this.child, this.motionEnabled = true});

  final Widget child;
  final bool motionEnabled;

  @override
  Widget build(BuildContext context) {
    if (!motionEnabled) return child;

    return TweenAnimationBuilder<double>(
      duration: ResidentEmergencyTheme.motionNormal,
      curve: Curves.easeOutCubic,
      tween: Tween(begin: 0, end: 1),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(offset: Offset(0, (1 - value) * 8), child: child),
        );
      },
      child: child,
    );
  }
}

class EmergencyAnimatedPage extends StatelessWidget {
  const EmergencyAnimatedPage({super.key, required this.child, this.motionEnabled = true});

  final Widget child;
  final bool motionEnabled;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: motionEnabled ? ResidentEmergencyTheme.motionNormal : Duration.zero,
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeOutCubic,
      transitionBuilder: (child, animation) {
        final offset = Tween<Offset>(begin: const Offset(0, 0.015), end: Offset.zero).animate(animation);
        return FadeTransition(opacity: animation, child: SlideTransition(position: offset, child: child));
      },
      child: KeyedSubtree(key: ValueKey(child.runtimeType), child: child),
    );
  }
}

class EmergencyPrimaryAction extends StatelessWidget {
  const EmergencyPrimaryAction({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.tone = EmergencyTone.calm,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final EmergencyTone tone;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: onPressed,
      style: FilledButton.styleFrom(backgroundColor: emergencyToneColor(tone)),
      icon: Icon(icon),
      label: Text(label),
    );
  }
}

class EmergencyEmptyState extends StatelessWidget {
  const EmergencyEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return EmergencySurface(
      elevated: true,
      padding: const EdgeInsets.all(ResidentEmergencyTheme.space5),
      child: Column(
        children: [
          EmergencyIconBlock(icon: icon, tone: EmergencyTone.warning),
          const SizedBox(height: ResidentEmergencyTheme.space3),
          Text(title, style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
          const SizedBox(height: ResidentEmergencyTheme.space2),
          Text(body, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
