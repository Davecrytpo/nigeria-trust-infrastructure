import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:resident_mobile/core/presentation/resident_emergency_theme.dart';
import 'package:resident_mobile/features/emergency/presentation/emergency_alert_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  PaintingBinding.instance.imageCache.maximumSize = 32;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 8 << 20;
  runApp(const ResidentEmergencyApp());
}

class ResidentEmergencyApp extends StatelessWidget {
  const ResidentEmergencyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nigeria Emergency Trust',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: ResidentEmergencyTheme.dark(),
      home: const EmergencyAlertScreen(),
    );
  }
}
