import 'package:flutter/material.dart';
import 'package:ekotrust_mobile/core/presentation/ekotrust_theme.dart';
import 'auth_gate_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _taglineOpacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );

    _logoScale = Tween<double>(begin: 0.72, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOut),
      ),
    );
    _taglineOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.52, 0.85, curve: Curves.easeOut),
      ),
    );

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 2600), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const AuthGateScreen(),
          transitionsBuilder: (_, animation, __, child) => FadeTransition(
            opacity: animation,
            child: child,
          ),
          transitionDuration: const Duration(milliseconds: 380),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EkoTrustTheme.deepForest,
      body: Stack(
        children: [
          // Background gradient
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.1,
                  colors: [
                    Color(0xFF0F5C35),
                    EkoTrustTheme.deepForest,
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Shield logo
                    FadeTransition(
                      opacity: _logoOpacity,
                      child: ScaleTransition(
                        scale: _logoScale,
                        child: Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: EkoTrustTheme.imperialEmerald,
                            border: Border.all(
                              color: EkoTrustTheme.royalMint,
                              width: 2.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: EkoTrustTheme.royalMint
                                    .withValues(alpha: 0.28),
                                blurRadius: 48,
                                spreadRadius: 8,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.verified_user_rounded,
                            size: 54,
                            color: EkoTrustTheme.royalMint,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),
                    // App name
                    FadeTransition(
                      opacity: _logoOpacity,
                      child: const Text(
                        'EkoTrust',
                        style: TextStyle(
                          fontSize: 38,
                          fontWeight: FontWeight.w900,
                          color: EkoTrustTheme.ivorySilk,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Tagline
                    FadeTransition(
                      opacity: _taglineOpacity,
                      child: const Text(
                        'Trust infrastructure for\nAfrica\'s informal economy.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFFB0D4BF),
                          height: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 52),
                    // Loading indicator
                    FadeTransition(
                      opacity: _taglineOpacity,
                      child: SizedBox(
                        width: 36,
                        height: 36,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: EkoTrustTheme.royalMint.withValues(alpha: 0.7),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          // Bottom: version + build info
          Positioned(
            bottom: 38,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: _taglineOpacity,
              builder: (context, _) => FadeTransition(
                opacity: _taglineOpacity,
                child: const Text(
                  'v1.0.0 · Lagos, Nigeria',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF5A8A6A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
