import 'package:flutter/material.dart';
import 'package:resident_mobile/core/presentation/resident_emergency_theme.dart';
import 'package:resident_mobile/features/emergency/presentation/emergency_alert_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ResidentEmergencyApp());
}

class ResidentEmergencyApp extends StatelessWidget {
  const ResidentEmergencyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nigeria Emergency Trust',
      debugShowCheckedModeBanner: false,
      theme: ResidentEmergencyTheme.dark(),
      home: const EmergencyAlertScreen(),
    );
  }
}
