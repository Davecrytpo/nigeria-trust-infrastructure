import 'package:flutter/material.dart';

class ResidentEmergencyTheme {
  static const deepGreen = Color(0xFF047A46);
  static const amber = Color(0xFFC6A15B);
  static const charcoal = Color(0xFF121212);
  static const graphite = Color(0xFF151B18);
  static const surface = Color(0xFF1B2420);
  static const surfaceRaised = Color(0xFF24312B);
  static const text = Color(0xFFE8F0EA);
  static const mutedText = Color(0xFFAAB7AE);
  static const danger = Color(0xFFB84A4A);
  static const warning = Color(0xFFC58B22);
  static const offline = Color(0xFF58636B);
  static const recovery = Color(0xFF2A9D64);
  static const line = Color(0xFF34413A);

  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space7 = 32;
  static const double radius = 8;
  static const double minTapTarget = 56;
  static const Duration motionFast = Duration(milliseconds: 120);
  static const Duration motionNormal = Duration(milliseconds: 180);
  static const Duration motionSlow = Duration(milliseconds: 240);

  static const List<BoxShadow> softShadow = [
    BoxShadow(color: Color(0x33000000), blurRadius: 18, offset: Offset(0, 10)),
  ];

  static ThemeData dark() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: deepGreen,
      brightness: Brightness.dark,
      primary: deepGreen,
      secondary: amber,
      surface: surface,
      error: danger,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: charcoal,
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 36, height: 1.02, fontWeight: FontWeight.w800, color: text, letterSpacing: 0),
        headlineMedium: TextStyle(fontSize: 24, height: 1.12, fontWeight: FontWeight.w800, color: text, letterSpacing: 0),
        titleLarge: TextStyle(fontSize: 20, height: 1.2, fontWeight: FontWeight.w800, color: text, letterSpacing: 0),
        titleMedium: TextStyle(fontSize: 16, height: 1.25, fontWeight: FontWeight.w700, color: text, letterSpacing: 0),
        bodyLarge: TextStyle(fontSize: 16, height: 1.45, fontWeight: FontWeight.w500, color: text, letterSpacing: 0),
        bodyMedium: TextStyle(fontSize: 14, height: 1.45, fontWeight: FontWeight.w500, color: mutedText, letterSpacing: 0),
        labelLarge: TextStyle(fontSize: 15, height: 1.15, fontWeight: FontWeight.w800, color: text, letterSpacing: 0),
        labelMedium: TextStyle(fontSize: 13, height: 1.18, fontWeight: FontWeight.w800, color: mutedText, letterSpacing: 0),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: graphite,
        foregroundColor: text,
        centerTitle: false,
        elevation: 0,
        titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: text),
      ),
      cardTheme: CardTheme(
        color: surface,
        elevation: 1,
        shadowColor: const Color(0x55000000),
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: const BorderSide(color: line),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: deepGreen,
          foregroundColor: text,
          minimumSize: const Size(minTapTarget, minTapTarget),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: text,
          minimumSize: const Size(minTapTarget, minTapTarget),
          side: const BorderSide(color: line),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          return states.contains(MaterialState.selected) ? amber : mutedText;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          return states.contains(MaterialState.selected) ? deepGreen.withOpacity(0.52) : surfaceRaised;
        }),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceRaised,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(radius), borderSide: const BorderSide(color: line)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(radius), borderSide: const BorderSide(color: line)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(radius), borderSide: const BorderSide(color: amber, width: 1.4)),
        labelStyle: const TextStyle(color: mutedText, fontWeight: FontWeight.w700),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: graphite,
        indicatorColor: deepGreen.withOpacity(0.42),
        labelTextStyle: MaterialStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0)),
      ),
    );
  }
}
