import 'package:flutter/material.dart';
import 'package:ekotrust_mobile/core/presentation/ekotrust_theme.dart';
import 'package:ekotrust_mobile/features/ekotrust/presentation/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  PaintingBinding.instance.imageCache.maximumSize = 32;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 8 << 20;
  runApp(const EkoTrustApp());
}

class EkoTrustApp extends StatelessWidget {
  const EkoTrustApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EkoTrust',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.light,
      theme: EkoTrustTheme.light(),
      home: const SplashScreen(),
    );
  }
}
