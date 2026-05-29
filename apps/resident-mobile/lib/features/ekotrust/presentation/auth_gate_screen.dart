import 'package:ekotrust_mobile/core/presentation/ekotrust_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'ekotrust_app_screen.dart';
import 'login_screen.dart';

/// Checks secure storage to decide whether to go to login or the main app.
class AuthGateScreen extends StatefulWidget {
  const AuthGateScreen({super.key});

  @override
  State<AuthGateScreen> createState() => _AuthGateScreenState();
}

class _AuthGateScreenState extends State<AuthGateScreen> {
  static const _storage = FlutterSecureStorage();
  static const _accountKey = 'ekotrust.account.v1';
  static const _sessionKey = 'ekotrust.session.v1';

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    final account = await _storage.read(key: _accountKey);
    final session = await _storage.read(key: _sessionKey);
    if (!mounted) return;

    if (account != null &&
        account.isNotEmpty &&
        session != null &&
        session.isNotEmpty) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const EkoTrustAppScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: EkoTrustTheme.deepForest,
      body: Center(
        child: SizedBox(
          width: 32,
          height: 32,
          child: CircularProgressIndicator(
            strokeWidth: 2.5,
            color: EkoTrustTheme.royalMint,
          ),
        ),
      ),
    );
  }
}
