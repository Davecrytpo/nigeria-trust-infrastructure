import 'package:flutter/material.dart';

class EkoTrustTheme {
  static const imperialEmerald = Color(0xFF004B23);
  static const royalMint = Color(0xFF00FF85);
  static const sunGold = Color(0xFFD4AF37);
  static const ivorySilk = Color(0xFFFDFBF7);
  static const deepForest = Color(0xFF002D15);
  static const mossSlate = Color(0xFF4F772D);

  static const iconBlue = imperialEmerald;
  static const iconMidBlue = imperialEmerald;
  static const iconCyan = royalMint;
  static const royalBlue = imperialEmerald;
  static const cyan = royalMint;
  static const emerald = imperialEmerald;
  static const deepGreen = deepForest;
  static const danger = Color(0xFFD92D20);
  static const warning = sunGold;
  static const offline = Color(0xFF6F7F68);

  static const charcoal = deepForest;
  static const graphite = Color(0xFFE9F6EE);
  static const surface = ivorySilk;
  static const surfaceRaised = Color(0xFFF4F0E6);
  static const deepNavy = Color(0xFFEAF4ED);
  static const text = deepForest;
  static const mutedText = mossSlate;
  static const recovery = emerald;
  static const line = Color(0xFFE3DDC9);
  static const amber = warning;

  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space7 = 32;
  static const double radius = 18;
  static const double minTapTarget = 56;
  static const Duration motionFast = Duration(milliseconds: 120);
  static const Duration motionNormal = Duration(milliseconds: 180);
  static const Duration motionSlow = Duration(milliseconds: 240);

  static const List<BoxShadow> softShadow = [
    BoxShadow(
      color: Color(0x1F004B23),
      blurRadius: 28,
      offset: Offset(0, 14),
    ),
  ];

  static ThemeData dark() => light();

  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: imperialEmerald,
      brightness: Brightness.light,
      primary: imperialEmerald,
      secondary: royalMint,
      surface: surface,
      error: danger,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: ivorySilk,
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 40,
          height: 1.02,
          fontWeight: FontWeight.w900,
          color: text,
          letterSpacing: 0,
        ),
        headlineMedium: TextStyle(
          fontSize: 27,
          height: 1.08,
          fontWeight: FontWeight.w900,
          color: text,
          letterSpacing: 0,
        ),
        titleLarge: TextStyle(
          fontSize: 21,
          height: 1.16,
          fontWeight: FontWeight.w900,
          color: text,
          letterSpacing: 0,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          height: 1.25,
          fontWeight: FontWeight.w800,
          color: text,
          letterSpacing: 0,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          height: 1.42,
          fontWeight: FontWeight.w500,
          color: text,
          letterSpacing: 0,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          height: 1.42,
          fontWeight: FontWeight.w500,
          color: mutedText,
          letterSpacing: 0,
        ),
        labelLarge: TextStyle(
          fontSize: 15,
          height: 1.12,
          fontWeight: FontWeight.w900,
          color: text,
          letterSpacing: 0,
        ),
        labelMedium: TextStyle(
          fontSize: 13,
          height: 1.18,
          fontWeight: FontWeight.w800,
          color: mutedText,
          letterSpacing: 0,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: ivorySilk,
        foregroundColor: text,
        centerTitle: false,
        elevation: 0,
        titleTextStyle: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w900,
          color: text,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: const BorderSide(color: line),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: royalMint,
          foregroundColor: deepForest,
          minimumSize: const Size(minTapTarget, minTapTarget),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: imperialEmerald,
          minimumSize: const Size(minTapTarget, minTapTarget),
          side: const BorderSide(color: Color(0xFFD0E7F8), width: 1.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: iconBlue,
          textStyle: const TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected) ? iconBlue : mutedText;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? iconCyan.withValues(alpha: 0.38)
              : const Color(0xFFE4E7EC);
        }),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: iconCyan, width: 1.6),
        ),
        labelStyle:
            const TextStyle(color: mutedText, fontWeight: FontWeight.w700),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: royalMint.withValues(alpha: 0.18),
        labelTextStyle: WidgetStateProperty.all(
          const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            letterSpacing: 0,
          ),
        ),
      ),
    );
  }
}
