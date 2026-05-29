import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ekotrust_mobile/core/presentation/ekotrust_theme.dart';
import 'package:ekotrust_mobile/features/ekotrust/application/ekotrust_controller.dart';
import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'ekotrust_app_screen.dart';

enum _AuthMode { login, register }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _controller = EkoTrustController();
  _AuthMode _mode = _AuthMode.login;
  late final AnimationController _fadeController;
  late final Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_refresh);
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    )..forward();
    _fadeIn = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _controller.removeListener(_refresh);
    _controller.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  void _switchMode(_AuthMode mode) {
    HapticFeedback.selectionClick();
    _fadeController.reset();
    _fadeController.forward();
    setState(() => _mode = mode);
  }

  void _onAuthenticated() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const EkoTrustAppScreen(),
        transitionsBuilder: (_, animation, __, child) => FadeTransition(
          opacity: animation,
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 360),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: EkoTrustTheme.deepForest,
      body: Stack(
        children: [
          // Background
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0F6A3A),
                    EkoTrustTheme.deepForest,
                    Color(0xFF00381A),
                  ],
                ),
              ),
              child: CustomPaint(painter: _SplashBgPainter()),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: _fadeIn,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo row
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: EkoTrustTheme.imperialEmerald,
                            border: Border.all(
                                color: EkoTrustTheme.royalMint, width: 2),
                          ),
                          child: const Icon(Icons.verified_user_rounded,
                              color: EkoTrustTheme.royalMint, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'EkoTrust',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: EkoTrustTheme.ivorySilk,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 36),
                    // Mode toggle
                    _ModeToggle(
                      mode: _mode,
                      onSwitch: _switchMode,
                    ),
                    const SizedBox(height: 28),
                    // Form
                    if (_mode == _AuthMode.login)
                      _LoginForm(
                        controller: _controller,
                        onSuccess: _onAuthenticated,
                        onRegister: () => _switchMode(_AuthMode.register),
                      )
                    else
                      _RegisterForm(
                        controller: _controller,
                        onSuccess: _onAuthenticated,
                        onLogin: () => _switchMode(_AuthMode.login),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Mode Toggle ───────────────────────────────────────────────────────────

class _ModeToggle extends StatelessWidget {
  const _ModeToggle({required this.mode, required this.onSwitch});

  final _AuthMode mode;
  final ValueChanged<_AuthMode> onSwitch;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: EkoTrustTheme.imperialEmerald.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: EkoTrustTheme.royalMint.withValues(alpha: 0.22),
        ),
      ),
      child: Row(
        children: [
          _Tab(
            label: 'Sign In',
            active: mode == _AuthMode.login,
            onTap: () => onSwitch(_AuthMode.login),
          ),
          _Tab(
            label: 'Create Account',
            active: mode == _AuthMode.register,
            onTap: () => onSwitch(_AuthMode.register),
          ),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  const _Tab({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: active ? EkoTrustTheme.royalMint : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: active
                  ? EkoTrustTheme.deepForest
                  : EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Login Form ────────────────────────────────────────────────────────────

class _LoginForm extends StatefulWidget {
  const _LoginForm({
    required this.controller,
    required this.onSuccess,
    required this.onRegister,
  });

  final EkoTrustController controller;
  final VoidCallback onSuccess;
  final VoidCallback onRegister;

  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    // In production this should call the API before restoring the session.
    final ok = await widget.controller.loginWithEmail(
      email: _email.text.trim(),
      password: _password.text,
    );
    if (ok && mounted) widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    final busy = widget.controller.registering;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Welcome back.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Sign in to your EkoTrust account.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.65),
                ),
          ),
          const SizedBox(height: 24),
          _AuthPanel(
            child: Column(
              children: [
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(
                    labelText: 'Email address',
                    prefixIcon: Icon(Icons.alternate_email_rounded),
                  ),
                  validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                          .hasMatch((v ?? '').trim())
                      ? null
                      : 'Enter a valid email',
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  autofillHints: const [AutofillHints.password],
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) =>
                      (v ?? '').length < 6 ? 'Enter your password' : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () {
                // TODO: forgot password flow
              },
              child: const Text(
                'Forgot password?',
                style: TextStyle(
                  color: EkoTrustTheme.sunGold,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          if (widget.controller.authMessage != null) ...[
            const SizedBox(height: 8),
            _StatusBanner(message: widget.controller.authMessage!),
          ],
          const SizedBox(height: 18),
          _PrimaryButton(
            icon: Icons.login_rounded,
            label: busy ? 'Signing In...' : 'Sign In',
            onPressed: busy ? null : _submit,
          ),
          const SizedBox(height: 16),
          _DividerOr(),
          const SizedBox(height: 16),
          _GoogleButton(
            onPressed: busy
                ? null
                : () async {
                    // TODO: Google Sign-In
                  },
          ),
          const SizedBox(height: 28),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                "Don't have an account? ",
                style: TextStyle(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.65),
                  fontSize: 14,
                ),
              ),
              GestureDetector(
                onTap: widget.onRegister,
                child: const Text(
                  'Create one',
                  style: TextStyle(
                    color: EkoTrustTheme.royalMint,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Register Form ──────────────────────────────────────────────────────────

class _RegisterForm extends StatefulWidget {
  const _RegisterForm({
    required this.controller,
    required this.onSuccess,
    required this.onLogin,
  });

  final EkoTrustController controller;
  final VoidCallback onSuccess;
  final VoidCallback onLogin;

  @override
  State<_RegisterForm> createState() => _RegisterFormState();
}

class _RegisterFormState extends State<_RegisterForm> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _trade = TextEditingController();
  bool _obscure = true;
  bool _accepted = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _trade.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (!_accepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the privacy terms')),
      );
      return;
    }
    final ok = await widget.controller.registerWithEmail(
      EkoTrustRegistrationDraft(
        fullName: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        phoneNumber: _phone.text.trim(),
        trade: _trade.text.trim(),
        community: 'Lagos',
        acceptedPrivacy: _accepted,
        twoFactorEnabled: true,
        deviceLockEnabled: true,
        recoveryContactEnabled: true,
      ),
    );
    if (ok && mounted) widget.onSuccess();
  }

  @override
  Widget build(BuildContext context) {
    final strength = widget.controller.passwordStrength(_password.text);
    final busy = widget.controller.registering;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Create your account.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Build your trust identity on EkoTrust.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.65),
                ),
          ),
          const SizedBox(height: 24),
          _AuthPanel(
            child: Column(
              children: [
                TextFormField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Full legal name',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  validator: (v) =>
                      (v ?? '').trim().split(RegExp(r'\s+')).length < 2
                          ? 'Enter first and last name'
                          : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(
                    labelText: 'Email address',
                    prefixIcon: Icon(Icons.alternate_email_rounded),
                  ),
                  validator: (v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                          .hasMatch((v ?? '').trim())
                      ? null
                      : 'Enter a valid email',
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  onChanged: (_) => setState(() {}),
                  autofillHints: const [AutofillHints.newPassword],
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) =>
                      widget.controller.passwordStrength(v ?? '') < 5
                          ? 'Use 12+ characters with numbers & symbols'
                          : null,
                ),
                if (_password.text.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  _StrengthBar(score: strength),
                ],
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  decoration: const InputDecoration(
                    labelText: 'Phone number (+234...)',
                    prefixIcon: Icon(Icons.phone_android_rounded),
                  ),
                  validator: (v) => (v ?? '').trim().length < 10
                      ? 'Enter a valid phone number'
                      : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _trade,
                  decoration: const InputDecoration(
                    labelText: 'Trade or role (e.g. Electrician)',
                    prefixIcon: Icon(Icons.handyman_rounded),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Privacy consent
          Material(
            color: Colors.transparent,
            child: CheckboxListTile(
              value: _accepted,
              onChanged: (v) => setState(() => _accepted = v ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
              activeColor: EkoTrustTheme.royalMint,
              checkColor: EkoTrustTheme.deepForest,
              title: Text(
                "I agree to EkoTrust's privacy policy and terms of service.",
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.82),
                    ),
              ),
            ),
          ),
          if (widget.controller.authMessage != null) ...[
            const SizedBox(height: 8),
            _StatusBanner(message: widget.controller.authMessage!),
          ],
          const SizedBox(height: 18),
          _PrimaryButton(
            icon: Icons.verified_user_rounded,
            label: busy ? 'Creating Account...' : 'Create Account',
            onPressed: busy ? null : _submit,
          ),
          const SizedBox(height: 28),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                'Already have an account? ',
                style: TextStyle(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.65),
                  fontSize: 14,
                ),
              ),
              GestureDetector(
                onTap: widget.onLogin,
                child: const Text(
                  'Sign in',
                  style: TextStyle(
                    color: EkoTrustTheme.royalMint,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Shared Widgets ─────────────────────────────────────────────────────────

class _AuthPanel extends StatelessWidget {
  const _AuthPanel({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: EkoTrustTheme.ivorySilk,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22004B23),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton(
      {required this.icon, required this.label, required this.onPressed});
  final IconData icon;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: FilledButton.icon(
        icon: Icon(icon, size: 22),
        label: Text(label,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: EkoTrustTheme.royalMint,
          foregroundColor: EkoTrustTheme.deepForest,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}

class _GoogleButton extends StatelessWidget {
  const _GoogleButton({required this.onPressed});
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton.icon(
        icon: const Icon(Icons.account_circle_rounded, size: 22),
        label: const Text('Continue with Google',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: EkoTrustTheme.ivorySilk,
          side: BorderSide(
              color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.35)),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}

class _DividerOr extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
            child: Divider(
                color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.22))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            'or',
            style: TextStyle(
              color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.55),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Expanded(
            child: Divider(
                color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.22))),
      ],
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: EkoTrustTheme.sunGold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border:
            Border.all(color: EkoTrustTheme.sunGold.withValues(alpha: 0.45)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded,
              color: EkoTrustTheme.sunGold, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.9),
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StrengthBar extends StatelessWidget {
  const _StrengthBar({required this.score});
  final int score;

  @override
  Widget build(BuildContext context) {
    final Color barColor;
    final String label;
    if (score >= 5) {
      barColor = const Color(0xFF22C55E);
      label = 'Strong password';
    } else if (score >= 3) {
      barColor = EkoTrustTheme.sunGold;
      label = 'Medium strength';
    } else {
      barColor = const Color(0xFFEF4444);
      label = 'Weak password';
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(6, (i) {
            return Expanded(
              child: Container(
                height: 5,
                margin: EdgeInsets.only(right: i == 5 ? 0 : 5),
                decoration: BoxDecoration(
                  color: i < score ? barColor : EkoTrustTheme.line,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 5),
        Text(label,
            style: TextStyle(
                fontSize: 12, color: barColor, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// ─── Background painter (reused from main screen) ────────────────────────

class _SplashBgPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader = const RadialGradient(
        colors: [Color(0x280A3E22), Colors.transparent],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.15, size.height * 0.1),
        radius: size.width * 0.8,
      ));
    canvas.drawRect(Offset.zero & size, glow);
  }

  @override
  bool shouldRepaint(covariant CustomPainter _) => false;
}
