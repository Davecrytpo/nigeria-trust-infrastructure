import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:ekotrust_mobile/core/presentation/ekotrust_theme.dart';
import 'package:ekotrust_mobile/features/ekotrust/application/ekotrust_controller.dart';
import 'package:ekotrust_mobile/features/ekotrust/domain/ekotrust_models.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';

enum EkoTrustTab { register, verify, home, proof, profile, status }

class EkoTrustAppScreen extends StatefulWidget {
  const EkoTrustAppScreen({super.key});

  @override
  State<EkoTrustAppScreen> createState() => _EkoTrustAppScreenState();
}

class _EkoTrustAppScreenState extends State<EkoTrustAppScreen> {
  final EkoTrustController _controller = EkoTrustController();
  EkoTrustTab _tab = EkoTrustTab.verify;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_refresh);
  }

  @override
  void dispose() {
    _controller.removeListener(_refresh);
    _controller.dispose();
    super.dispose();
  }

  void _refresh() => setState(() {});

  void _setTab(EkoTrustTab tab) {
    HapticFeedback.selectionClick();
    if (!_controller.isRegistered && tab != EkoTrustTab.register) {
      setState(() => _tab = EkoTrustTab.register);
      return;
    }
    setState(() => _tab = tab);
  }

  void _advanceVerification() {
    HapticFeedback.lightImpact();
    if (_controller.onboardingStep < _controller.onboardingSteps.length - 1) {
      _controller.advanceOnboarding();
      return;
    }
    setState(() => _tab = EkoTrustTab.home);
  }

  @override
  Widget build(BuildContext context) {
    final registered = _controller.isRegistered;
    return Scaffold(
      backgroundColor: EkoTrustTheme.deepForest,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            const _EkoBackground(),
            Column(
              children: [
                Expanded(
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: _EkoTopBar(
                          account: _controller.account,
                          onProfile: () => _setTab(
                            registered
                                ? EkoTrustTab.profile
                                : EkoTrustTab.register,
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(child: _buildBody()),
                      const SliverToBoxAdapter(child: SizedBox(height: 94)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: registered
          ? _EkoNavigation(
              selected:
                  _tab == EkoTrustTab.register ? EkoTrustTab.verify : _tab,
              onSelected: _setTab,
            )
          : null,
    );
  }

  Widget _buildBody() {
    if (_controller.accountRestoring) {
      return const _AccountLoadingView();
    }
    if (!_controller.isRegistered) {
      return _RegistrationView(
        controller: _controller,
        onRegistered: () => setState(() => _tab = EkoTrustTab.verify),
      );
    }
    switch (_tab) {
      case EkoTrustTab.register:
        return _RegistrationView(
          controller: _controller,
          onRegistered: () => setState(() => _tab = EkoTrustTab.verify),
        );
      case EkoTrustTab.verify:
        return _ProofOfExistenceView(
          controller: _controller,
          onStart: _advanceVerification,
          onOpenDashboard: () => _setTab(EkoTrustTab.home),
        );
      case EkoTrustTab.home:
        return _TrustDashboardView(controller: _controller);
      case EkoTrustTab.proof:
        return _VisualProofView(controller: _controller);
      case EkoTrustTab.profile:
        return _PublicProfileView(controller: _controller);
      case EkoTrustTab.status:
        return _VerificationStatusView(controller: _controller);
    }
  }
}

class _EkoTopBar extends StatelessWidget {
  const _EkoTopBar({required this.onProfile, required this.account});

  final VoidCallback onProfile;
  final EkoTrustAccount? account;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
      child: Row(
        children: [
          const _EkoShieldMark(size: 54),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'EkoTrust',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk,
                    fontWeight: FontWeight.w900,
                  ),
            ),
          ),
          if (account != null)
            Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                color: EkoTrustTheme.sunGold.withValues(alpha: 0.12),
                border: Border.all(
                  color: EkoTrustTheme.sunGold.withValues(alpha: 0.55),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.workspace_premium_rounded,
                      color: EkoTrustTheme.sunGold, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    account!.trade.isNotEmpty
                        ? account!.trade.split(' ').first.toUpperCase()
                        : 'PREMIUM',
                    style: const TextStyle(
                      color: EkoTrustTheme.sunGold,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      letterSpacing: 0,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(width: 10),
          IconButton.filledTonal(
            tooltip: 'Public profile',
            onPressed: onProfile,
            style: IconButton.styleFrom(
              backgroundColor: EkoTrustTheme.royalMint.withValues(alpha: 0.12),
              foregroundColor: EkoTrustTheme.ivorySilk,
              side: BorderSide(
                color: EkoTrustTheme.royalMint.withValues(alpha: 0.35),
              ),
            ),
            icon: const Icon(Icons.person_outline_rounded),
          ),
        ],
      ),
    );
  }
}

class _AccountLoadingView extends StatelessWidget {
  const _AccountLoadingView();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(20, 90, 20, 0),
      child: _GlassPanel(
        child: Row(
          children: [
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
            SizedBox(width: 14),
            Expanded(child: Text('Checking protected account storage')),
          ],
        ),
      ),
    );
  }
}

class _RegistrationView extends StatefulWidget {
  const _RegistrationView({
    required this.controller,
    required this.onRegistered,
  });

  final EkoTrustController controller;
  final VoidCallback onRegistered;

  @override
  State<_RegistrationView> createState() => _RegistrationViewState();
}

class _RegistrationViewState extends State<_RegistrationView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  final _trade = TextEditingController(text: 'Electrician');
  final _community = TextEditingController(text: 'Yaba Artisan Circle');
  bool _acceptedPrivacy = false;
  bool _twoFactor = true;
  bool _deviceLock = true;
  bool _recoveryContact = true;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _phone.dispose();
    _trade.dispose();
    _community.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final ok = await widget.controller.registerWithEmail(
      EkoTrustRegistrationDraft(
        fullName: _name.text,
        email: _email.text,
        password: _password.text,
        phoneNumber: _phone.text,
        trade: _trade.text,
        community: _community.text,
        acceptedPrivacy: _acceptedPrivacy,
        twoFactorEnabled: _twoFactor,
        deviceLockEnabled: _deviceLock,
        recoveryContactEnabled: _recoveryContact,
      ),
    );
    if (ok && mounted) widget.onRegistered();
  }

  @override
  Widget build(BuildContext context) {
    final strength = widget.controller.passwordStrength(_password.text);
    final registering = widget.controller.registering;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _SectionEyebrow('Secure Registration'),
            const SizedBox(height: 8),
            Text(
              'Create your protected EkoTrust account.',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk,
                  ),
            ),
            const SizedBox(height: 14),
            _IvoryPanel(
              child: Column(
                children: [
                  TextFormField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Full legal name',
                      prefixIcon: Icon(Icons.badge_outlined),
                    ),
                    validator: (value) =>
                        (value ?? '').trim().split(RegExp(r'\s+')).length < 2
                            ? 'Enter first and last name'
                            : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      labelText: 'Email address',
                      prefixIcon: Icon(Icons.alternate_email_rounded),
                    ),
                    validator: (value) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                            .hasMatch((value ?? '').trim())
                        ? null
                        : 'Enter a valid email',
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    obscureText: true,
                    onChanged: (_) => setState(() {}),
                    autofillHints: const [AutofillHints.newPassword],
                    decoration: const InputDecoration(
                      labelText: 'Strong password',
                      prefixIcon: Icon(Icons.lock_outline_rounded),
                    ),
                    validator: (value) =>
                        widget.controller.passwordStrength(value ?? '') < 5
                            ? 'Use 12+ chars with numbers and symbols'
                            : null,
                  ),
                  const SizedBox(height: 10),
                  _PasswordStrengthBar(score: strength),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    decoration: const InputDecoration(
                      labelText: 'Phone number',
                      prefixIcon: Icon(Icons.phone_android_rounded),
                    ),
                    validator: (value) => (value ?? '').trim().length < 10
                        ? 'Enter your phone number'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _trade,
                          decoration: const InputDecoration(
                            labelText: 'Trade or role',
                            prefixIcon: Icon(Icons.handyman_rounded),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: _community,
                          decoration: const InputDecoration(
                            labelText: 'Community',
                            prefixIcon: Icon(Icons.groups_2_rounded),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _SecuritySetupPanel(
              twoFactor: _twoFactor,
              deviceLock: _deviceLock,
              recoveryContact: _recoveryContact,
              onTwoFactor: (value) => setState(() => _twoFactor = value),
              onDeviceLock: (value) => setState(() => _deviceLock = value),
              onRecoveryContact: (value) =>
                  setState(() => _recoveryContact = value),
            ),
            const SizedBox(height: 12),
            _ConsentCheck(
              value: _acceptedPrivacy,
              onChanged: (value) =>
                  setState(() => _acceptedPrivacy = value ?? false),
            ),
            if (widget.controller.authMessage != null) ...[
              const SizedBox(height: 12),
              _AuthMessage(message: widget.controller.authMessage!),
            ],
            const SizedBox(height: 16),
            _MintActionButton(
              icon: Icons.verified_user_rounded,
              label: registering ? 'Securing Account' : 'Create Secure Account',
              onPressed: registering ? () {} : _submit,
            ),
            const SizedBox(height: 18),
            const _SecurityFooter(),
          ],
        ),
      ),
    );
  }
}

class _ProofOfExistenceView extends StatelessWidget {
  const _ProofOfExistenceView({
    required this.controller,
    required this.onStart,
    required this.onOpenDashboard,
  });

  final EkoTrustController controller;
  final VoidCallback onStart;
  final VoidCallback onOpenDashboard;

  @override
  Widget build(BuildContext context) {
    final step = controller.onboardingStep;
    final current = controller.currentStep;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Your Proof of Existence',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                  fontWeight: FontWeight.w900,
                  height: 1.05,
                ),
          ),
          const SizedBox(height: 18),
          const _GoldDivider(),
          const SizedBox(height: 18),
          Text(
            'Secure your existence today.\nA timeless proof that you are you, recognized across generations.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: const Color(0xFFD8EAD7),
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 26),
          _OnboardingProgress(controller: controller),
          const SizedBox(height: 50),
          const _TrustPromiseCard(),
          const SizedBox(height: 22),
          _VerificationStepCard(step: current),
          const SizedBox(height: 18),
          _MintActionButton(
            icon: step == 0
                ? Icons.fingerprint_rounded
                : step == 1
                    ? Icons.face_retouching_natural_rounded
                    : step == 2
                        ? Icons.groups_2_rounded
                        : Icons.verified_rounded,
            label: step < controller.onboardingSteps.length - 1
                ? current.action
                : 'Open Dashboard',
            onPressed: step < controller.onboardingSteps.length - 1
                ? onStart
                : onOpenDashboard,
          ),
          const SizedBox(height: 18),
          const _SecurityFooter(),
        ],
      ),
    );
  }
}

class _TrustDashboardView extends StatelessWidget {
  const _TrustDashboardView({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    final profile = controller.profile;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionEyebrow('Home Dashboard'),
          const SizedBox(height: 8),
          Text(
            'Economic identity for verified work.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 16),
          _TrustScoreCard(profile: profile),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  icon: Icons.task_alt_rounded,
                  label: 'Completion',
                  value: '${profile.completionRate}%',
                  body: '${profile.verifiedJobs} verified jobs',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  icon: Icons.diversity_3_rounded,
                  label: 'Peer Trust',
                  value: profile.levelLabel,
                  body: '${profile.peerAttestations} attestations',
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _RecentWorkPanel(proofs: controller.workProofs),
          const SizedBox(height: 14),
          _CommunityStandingPanel(profile: profile),
        ],
      ),
    );
  }
}

class _VisualProofView extends StatelessWidget {
  const _VisualProofView({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionEyebrow('Visual Proof of Work'),
          const SizedBox(height: 8),
          Text(
            'Capture the job. Build the record.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 16),
          _BeforeAfterCapture(controller: controller),
          const SizedBox(height: 14),
          _UploadStatusPanel(controller: controller),
          const SizedBox(height: 14),
          _AiReviewPanel(queued: controller.aiReviewQueued),
          const SizedBox(height: 14),
          _MintActionButton(
            icon: controller.uploadState == EkoTrustUploadState.uploading
                ? Icons.sync_rounded
                : Icons.cloud_upload_rounded,
            label: controller.uploadState == EkoTrustUploadState.uploading
                ? 'Uploading Evidence'
                : 'Upload Work Evidence',
            onPressed: controller.uploadState == EkoTrustUploadState.uploading
                ? () {}
                : controller.submitWorkEvidence,
          ),
        ],
      ),
    );
  }
}

class _PublicProfileView extends StatelessWidget {
  const _PublicProfileView({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionEyebrow('Public Trust Profile'),
          const SizedBox(height: 12),
          _ProfileHeaderCard(profile: controller.profile),
          const SizedBox(height: 14),
          if (controller.account != null) ...[
            _AccountProtectionCard(
              account: controller.account!,
              onSignOut: controller.signOut,
            ),
            const SizedBox(height: 14),
          ],
          _QrVerificationCard(handle: controller.profile.publicHandle),
          const SizedBox(height: 14),
          _WorkGalleryPanel(proofs: controller.workProofs),
        ],
      ),
    );
  }
}

class _VerificationStatusView extends StatelessWidget {
  const _VerificationStatusView({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionEyebrow('Verification Status'),
          const SizedBox(height: 8),
          Text(
            'Prestige grows with verified consistency.',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 16),
          _StatusTierCard(profile: controller.profile),
          const SizedBox(height: 14),
          _LevelTimeline(level: controller.profile.verificationLevel),
        ],
      ),
    );
  }
}

class _OnboardingProgress extends StatelessWidget {
  const _OnboardingProgress({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    final step = controller.onboardingStep;
    final steps = controller.onboardingSteps;
    return _GlassPanel(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Onboarding Progress',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: EkoTrustTheme.ivorySilk,
                      ),
                ),
              ),
              _SmallPill('Step ${step + 1} of ${steps.length}'),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: List.generate(steps.length, (index) {
              final active = index <= step;
              return Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 5,
                        decoration: BoxDecoration(
                          color: active
                              ? EkoTrustTheme.royalMint
                              : EkoTrustTheme.ivorySilk.withValues(alpha: 0.28),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: active
                            ? EkoTrustTheme.royalMint
                            : Colors.transparent,
                        border: Border.all(
                          color: active
                              ? EkoTrustTheme.royalMint
                              : EkoTrustTheme.ivorySilk.withValues(alpha: 0.6),
                          width: 2,
                        ),
                      ),
                      child: active
                          ? const Icon(Icons.check_rounded,
                              size: 16, color: EkoTrustTheme.deepForest)
                          : null,
                    ),
                    if (index != steps.length - 1) const SizedBox(width: 4),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 10),
          Row(
            children: steps
                .map(
                  (item) => Expanded(
                    child: Text(
                      item.shortLabel,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: item == steps[step]
                                ? EkoTrustTheme.ivorySilk
                                : EkoTrustTheme.ivorySilk
                                    .withValues(alpha: 0.62),
                          ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _PasswordStrengthBar extends StatelessWidget {
  const _PasswordStrengthBar({required this.score});

  final int score;

  @override
  Widget build(BuildContext context) {
    final label = score >= 5 ? 'Strong password' : 'Needs stronger password';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(6, (index) {
            final active = index < score;
            return Expanded(
              child: Container(
                height: 6,
                margin: EdgeInsets.only(right: index == 5 ? 0 : 5),
                decoration: BoxDecoration(
                  color: active
                      ? EkoTrustTheme.imperialEmerald
                      : EkoTrustTheme.line,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Text(label, style: Theme.of(context).textTheme.labelMedium),
      ],
    );
  }
}

class _SecuritySetupPanel extends StatelessWidget {
  const _SecuritySetupPanel({
    required this.twoFactor,
    required this.deviceLock,
    required this.recoveryContact,
    required this.onTwoFactor,
    required this.onDeviceLock,
    required this.onRecoveryContact,
  });

  final bool twoFactor;
  final bool deviceLock;
  final bool recoveryContact;
  final ValueChanged<bool> onTwoFactor;
  final ValueChanged<bool> onDeviceLock;
  final ValueChanged<bool> onRecoveryContact;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Account Security',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk,
                ),
          ),
          const SizedBox(height: 8),
          _SecuritySwitch(
            icon: Icons.password_rounded,
            title: 'OTP protection',
            body: 'Require phone verification for risky actions.',
            value: twoFactor,
            onChanged: onTwoFactor,
          ),
          _SecuritySwitch(
            icon: Icons.phonelink_lock_rounded,
            title: 'Device lock',
            body: 'Bind this session to protected device storage.',
            value: deviceLock,
            onChanged: onDeviceLock,
          ),
          _SecuritySwitch(
            icon: Icons.contact_emergency_rounded,
            title: 'Recovery contact',
            body: 'Allow account recovery with trusted contact review.',
            value: recoveryContact,
            onChanged: onRecoveryContact,
          ),
        ],
      ),
    );
  }
}

class _SecuritySwitch extends StatelessWidget {
  const _SecuritySwitch({
    required this.icon,
    required this.title,
    required this.body,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String body;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: SwitchListTile(
        value: value,
        onChanged: onChanged,
        contentPadding: EdgeInsets.zero,
        secondary: Icon(icon, color: EkoTrustTheme.royalMint),
        title: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: EkoTrustTheme.ivorySilk,
              ),
        ),
        subtitle: Text(
          body,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
              ),
        ),
      ),
    );
  }
}

class _ConsentCheck extends StatelessWidget {
  const _ConsentCheck({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: CheckboxListTile(
        value: value,
        onChanged: onChanged,
        controlAffinity: ListTileControlAffinity.leading,
        contentPadding: EdgeInsets.zero,
        activeColor: EkoTrustTheme.royalMint,
        title: Text(
          'I agree to protect my account, verify my phone, and let EkoTrust store only the information needed for identity and work-proof safety.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.82),
              ),
        ),
      ),
    );
  }
}

class _AuthMessage extends StatelessWidget {
  const _AuthMessage({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded,
              color: EkoTrustTheme.sunGold, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustPromiseCard extends StatelessWidget {
  const _TrustPromiseCard();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        _IvoryPanel(
          padding: const EdgeInsets.fromLTRB(18, 50, 18, 18),
          child: Column(
            children: [
              const Row(
                children: [
                  Expanded(
                    child: _PromiseTile(
                      icon: Icons.gpp_good_rounded,
                      title: 'Tamper-Proof',
                      body: 'Cryptographically sealed and immutable.',
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: _PromiseTile(
                      icon: Icons.account_balance_rounded,
                      title: 'Globally Verifiable',
                      body: 'Readable by institutions anytime.',
                    ),
                  ),
                ],
              ),
              const Divider(height: 24, color: EkoTrustTheme.line),
              const Row(
                children: [
                  Expanded(
                    child: _PromiseTile(
                      icon: Icons.all_inclusive_rounded,
                      title: 'Lifetime Validity',
                      body: 'Your proof remains valid for life.',
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: _PromiseTile(
                      icon: Icons.lock_outline_rounded,
                      title: 'Privacy First',
                      body: 'You control what you share.',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'BUILT FOR GENERATIONS. DESIGNED FOR TRUST.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: EkoTrustTheme.sunGold,
                      fontWeight: FontWeight.w900,
                    ),
              ),
            ],
          ),
        ),
        Positioned(
          top: -34,
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: EkoTrustTheme.ivorySilk,
              border: Border.all(color: EkoTrustTheme.sunGold, width: 2),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x33004B23),
                  blurRadius: 24,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: const Icon(Icons.verified_user_rounded,
                color: EkoTrustTheme.sunGold, size: 36),
          ),
        ),
      ],
    );
  }
}

class _VerificationStepCard extends StatelessWidget {
  const _VerificationStepCard({required this.step});

  final EkoTrustOnboardingStep step;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Row(
        children: [
          _EmeraldIcon(step.icon),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: EkoTrustTheme.ivorySilk,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  step.body,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustScoreCard extends StatelessWidget {
  const _TrustScoreCard({required this.profile});

  final EkoTrustProfile profile;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Row(
        children: [
          SizedBox(
            width: 118,
            height: 118,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: profile.trustScore / 100,
                  strokeWidth: 10,
                  backgroundColor:
                      EkoTrustTheme.imperialEmerald.withValues(alpha: 0.12),
                  color: EkoTrustTheme.royalMint,
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${profile.trustScore}',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      Text(
                        'Trust Score',
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SmallDarkPill(profile.trade.toUpperCase()),
                const SizedBox(height: 10),
                Text(
                  profile.name,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 6),
                Text(
                  '${profile.community} - active, reliable, and institution-ready.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.body,
  });

  final IconData icon;
  final String label;
  final String value;
  final String body;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: EkoTrustTheme.royalMint),
          const SizedBox(height: 12),
          Text(value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: EkoTrustTheme.ivorySilk,
                  )),
          const SizedBox(height: 2),
          Text(label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                  )),
          const SizedBox(height: 6),
          Text(body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.64),
                  )),
        ],
      ),
    );
  }
}

class _RecentWorkPanel extends StatelessWidget {
  const _RecentWorkPanel({required this.proofs});

  final List<EkoTrustWorkProof> proofs;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent Work', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          for (final proof in proofs.take(3))
            _WorkRow(
              icon: proof.icon,
              title: proof.title,
              meta: '${proof.statusLabel} - ${proof.location}',
            ),
        ],
      ),
    );
  }
}

class _CommunityStandingPanel extends StatelessWidget {
  const _CommunityStandingPanel({required this.profile});

  final EkoTrustProfile profile;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Row(
        children: [
          const _EmeraldIcon(Icons.location_city_rounded),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Community Status',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: EkoTrustTheme.ivorySilk,
                        )),
                const SizedBox(height: 4),
                Text(
                  'Recognized by ${profile.community} with consistent GPS and job activity.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.7),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BeforeAfterCapture extends StatelessWidget {
  const _BeforeAfterCapture({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Evidence Capture',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              const SizedBox(width: 10),
              const _SmallDarkPill('OFFLINE READY'),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _CaptureSlot(
                  label: 'Before',
                  icon: Icons.photo_camera_back_rounded,
                  tone: EkoTrustTheme.mossSlate,
                  evidence: controller.beforeEvidence,
                  onCamera: () => controller.pickEvidence(
                    role: EkoTrustEvidenceRole.before,
                    source: ImageSource.camera,
                  ),
                  onGallery: () => controller.pickEvidence(
                    role: EkoTrustEvidenceRole.before,
                    source: ImageSource.gallery,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _CaptureSlot(
                  label: 'After',
                  icon: Icons.add_photo_alternate_rounded,
                  tone: EkoTrustTheme.imperialEmerald,
                  evidence: controller.afterEvidence,
                  onCamera: () => controller.pickEvidence(
                    role: EkoTrustEvidenceRole.after,
                    source: ImageSource.camera,
                  ),
                  onGallery: () => controller.pickEvidence(
                    role: EkoTrustEvidenceRole.after,
                    source: ImageSource.gallery,
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

class _UploadStatusPanel extends StatelessWidget {
  const _UploadStatusPanel({required this.controller});

  final EkoTrustController controller;

  @override
  Widget build(BuildContext context) {
    final state = controller.uploadState;
    final tone = state == EkoTrustUploadState.failed
        ? EkoTrustTheme.sunGold
        : state == EkoTrustUploadState.complete
            ? EkoTrustTheme.royalMint
            : EkoTrustTheme.ivorySilk;
    return _GlassPanel(
      child: Row(
        children: [
          Icon(
            state == EkoTrustUploadState.complete
                ? Icons.check_circle_rounded
                : state == EkoTrustUploadState.failed
                    ? Icons.info_rounded
                    : state == EkoTrustUploadState.uploading
                        ? Icons.sync_rounded
                        : Icons.cloud_queue_rounded,
            color: tone,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              controller.uploadMessage ??
                  'Capture before and after evidence to create a secure work proof.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.78),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AiReviewPanel extends StatelessWidget {
  const _AiReviewPanel({required this.queued});

  final bool queued;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Practical AI Review',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: EkoTrustTheme.ivorySilk,
                  )),
          const SizedBox(height: 12),
          const _CheckLine('Image quality analysis ready'),
          const _CheckLine('Duplicate work detection enabled'),
          _CheckLine(
            queued
                ? 'Fraud pattern review queued'
                : 'Fraud pattern review queued after upload',
          ),
        ],
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({required this.profile});

  final EkoTrustProfile profile;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Column(
        children: [
          CircleAvatar(
            radius: 38,
            backgroundColor: EkoTrustTheme.imperialEmerald,
            child: Text(
              profile.initials,
              style: const TextStyle(
                color: EkoTrustTheme.ivorySilk,
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(profile.name, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text('${profile.trade} - ${profile.location}',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 8,
            children: [
              _SmallDarkPill('TRUST SCORE ${profile.trustScore}'),
              _SmallDarkPill('${profile.levelLabel.toUpperCase()} LEVEL'),
              _SmallDarkPill('${profile.verifiedJobs} JOBS'),
            ],
          ),
        ],
      ),
    );
  }
}

class _AccountProtectionCard extends StatelessWidget {
  const _AccountProtectionCard({
    required this.account,
    required this.onSignOut,
  });

  final EkoTrustAccount account;
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const _EmeraldIcon(Icons.security_rounded),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${account.firstName} account protected',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: EkoTrustTheme.ivorySilk,
                          ),
                    ),
                    Text(
                      '${account.providerLabel} sign-in - ${account.phoneNumber}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                          ),
                    ),
                  ],
                ),
              ),
              _SmallPill('${account.securityScore}%'),
            ],
          ),
          const SizedBox(height: 14),
          _CheckLine(account.twoFactorEnabled
              ? 'OTP protection enabled'
              : 'OTP protection needs review'),
          _CheckLine(account.deviceLockEnabled
              ? 'Secure device storage enabled'
              : 'Device binding needs review'),
          _CheckLine(account.recoveryContactEnabled
              ? 'Recovery contact review enabled'
              : 'Add recovery contact before launch'),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () async => onSignOut(),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign out'),
            ),
          ),
        ],
      ),
    );
  }
}

class _QrVerificationCard extends StatelessWidget {
  const _QrVerificationCard({required this.handle});

  final String handle;

  @override
  Widget build(BuildContext context) {
    final verificationUrl =
        handle.startsWith('http') ? handle : 'https://$handle';
    return _GlassPanel(
      child: Row(
        children: [
          Container(
            width: 104,
            height: 104,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: EkoTrustTheme.ivorySilk,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: EkoTrustTheme.sunGold, width: 1.3),
            ),
            child: QrImageView(
              data: verificationUrl,
              version: QrVersions.auto,
              backgroundColor: EkoTrustTheme.ivorySilk,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: EkoTrustTheme.deepForest,
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: EkoTrustTheme.deepForest,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('QR Verification',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: EkoTrustTheme.ivorySilk,
                        )),
                const SizedBox(height: 4),
                Text(
                  verificationUrl,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                      ),
                ),
                const SizedBox(height: 8),
                const _SmallPill('Scan to verify'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WorkGalleryPanel extends StatelessWidget {
  const _WorkGalleryPanel({required this.proofs});

  final List<EkoTrustWorkProof> proofs;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Verified Work Gallery',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Row(
            children: [
              for (final proof in proofs.take(3)) ...[
                Expanded(child: _GalleryTile(icon: proof.icon)),
                if (proof != proofs.take(3).last) const SizedBox(width: 10),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusTierCard extends StatelessWidget {
  const _StatusTierCard({required this.profile});

  final EkoTrustProfile profile;

  @override
  Widget build(BuildContext context) {
    return _IvoryPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SmallDarkPill('CURRENT LEVEL'),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.workspace_premium_rounded,
                  color: EkoTrustTheme.sunGold, size: 46),
              const SizedBox(width: 12),
              Expanded(
                child: Text('${profile.levelLabel} Verification',
                    style: Theme.of(context).textTheme.headlineMedium),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: 0.68,
            minHeight: 9,
            borderRadius: BorderRadius.circular(12),
            backgroundColor:
                EkoTrustTheme.imperialEmerald.withValues(alpha: 0.12),
            color: EkoTrustTheme.royalMint,
          ),
          const SizedBox(height: 8),
          Text('12 more verified jobs and 3 peer attestations to Platinum.',
              style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _LevelTimeline extends StatelessWidget {
  const _LevelTimeline({required this.level});

  final EkoTrustVerificationLevel level;

  @override
  Widget build(BuildContext context) {
    return _GlassPanel(
      child: Column(
        children: [
          _LevelRow(
            label: 'Bronze',
            done: level.index >= EkoTrustVerificationLevel.bronze.index,
            active: level == EkoTrustVerificationLevel.bronze,
          ),
          _LevelRow(
            label: 'Silver',
            done: level.index >= EkoTrustVerificationLevel.silver.index,
            active: level == EkoTrustVerificationLevel.silver,
          ),
          _LevelRow(
            label: 'Gold',
            done: level.index >= EkoTrustVerificationLevel.gold.index,
            active: level == EkoTrustVerificationLevel.gold,
          ),
          _LevelRow(
            label: 'Platinum',
            done: level.index >= EkoTrustVerificationLevel.platinum.index,
            active: level == EkoTrustVerificationLevel.platinum,
          ),
        ],
      ),
    );
  }
}

class _EkoNavigation extends StatelessWidget {
  const _EkoNavigation({required this.selected, required this.onSelected});

  final EkoTrustTab selected;
  final ValueChanged<EkoTrustTab> onSelected;

  @override
  Widget build(BuildContext context) {
    const tabs = [
      EkoTrustTab.verify,
      EkoTrustTab.home,
      EkoTrustTab.proof,
      EkoTrustTab.profile,
      EkoTrustTab.status,
    ];
    return NavigationBar(
      selectedIndex: tabs.indexOf(selected).clamp(0, tabs.length - 1),
      onDestinationSelected: (index) => onSelected(tabs[index]),
      destinations: const [
        NavigationDestination(
            icon: Icon(Icons.fingerprint_rounded), label: 'Verify'),
        NavigationDestination(
            icon: Icon(Icons.dashboard_rounded), label: 'Home'),
        NavigationDestination(
            icon: Icon(Icons.add_a_photo_rounded), label: 'Proof'),
        NavigationDestination(
            icon: Icon(Icons.badge_rounded), label: 'Profile'),
        NavigationDestination(
            icon: Icon(Icons.workspace_premium_rounded), label: 'Status'),
      ],
    );
  }
}

class _GlassPanel extends StatelessWidget {
  const _GlassPanel(
      {required this.child, this.padding = const EdgeInsets.all(16)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.22),
        ),
      ),
      child: child,
    );
  }
}

class _IvoryPanel extends StatelessWidget {
  const _IvoryPanel(
      {required this.child, this.padding = const EdgeInsets.all(16)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: EkoTrustTheme.ivorySilk,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE8DEC3)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x26002D15),
            blurRadius: 24,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _MintActionButton extends StatelessWidget {
  const _MintActionButton({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 24),
        label: Text(
          label,
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: EkoTrustTheme.deepForest,
                fontWeight: FontWeight.w900,
              ),
        ),
      ),
    );
  }
}

class _PromiseTile extends StatelessWidget {
  const _PromiseTile(
      {required this.icon, required this.title, required this.body});

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: EkoTrustTheme.imperialEmerald.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: EkoTrustTheme.imperialEmerald),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 3),
              Text(body, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }
}

class _WorkRow extends StatelessWidget {
  const _WorkRow({required this.icon, required this.title, required this.meta});

  final IconData icon;
  final String title;
  final String meta;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          _EmeraldIcon(icon, light: true),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                Text(meta, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CaptureSlot extends StatelessWidget {
  const _CaptureSlot({
    required this.label,
    required this.icon,
    required this.tone,
    required this.onCamera,
    required this.onGallery,
    this.evidence,
  });

  final String label;
  final IconData icon;
  final Color tone;
  final EkoTrustEvidenceFile? evidence;
  final VoidCallback onCamera;
  final VoidCallback onGallery;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 0.82,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: tone.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: tone.withValues(alpha: 0.28)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: tone, size: 34),
            const SizedBox(height: 8),
            Text(label, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 5),
            Text(
              evidence == null
                  ? 'No file'
                  : '${(evidence!.byteSize / 1024).ceil()} KB ready',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium,
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(
                  tooltip: 'Camera',
                  onPressed: onCamera,
                  icon: const Icon(Icons.photo_camera_rounded, size: 18),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: 'Gallery',
                  onPressed: onGallery,
                  icon: const Icon(Icons.photo_library_rounded, size: 18),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckLine extends StatelessWidget {
  const _CheckLine(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded,
              color: EkoTrustTheme.royalMint, size: 19),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.78),
                    )),
          ),
        ],
      ),
    );
  }
}

class _LevelRow extends StatelessWidget {
  const _LevelRow(
      {required this.label, required this.done, this.active = false});

  final String label;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Icon(
            done
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            color: done
                ? EkoTrustTheme.royalMint
                : EkoTrustTheme.ivorySilk.withValues(alpha: 0.45),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: EkoTrustTheme.ivorySilk,
                    )),
          ),
          if (active) const _SmallPill('Current'),
        ],
      ),
    );
  }
}

class _GalleryTile extends StatelessWidget {
  const _GalleryTile({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 0.9,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE8F5E9),
              Color(0xFFF9F2D8),
            ],
          ),
        ),
        child: Icon(icon, color: EkoTrustTheme.imperialEmerald, size: 34),
      ),
    );
  }
}

class _EkoShieldMark extends StatelessWidget {
  const _EkoShieldMark({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [EkoTrustTheme.sunGold, Color(0xFFFFE9A6)],
        ),
        boxShadow: [
          BoxShadow(
              color: Color(0x33002D15), blurRadius: 18, offset: Offset(0, 8)),
        ],
      ),
      child: Center(
        child: Container(
          width: size - 10,
          height: size - 10,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: EkoTrustTheme.imperialEmerald,
          ),
          child: Center(
            child: Text(
              'E',
              style: TextStyle(
                color: EkoTrustTheme.ivorySilk,
                fontSize: size * 0.48,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmeraldIcon extends StatelessWidget {
  const _EmeraldIcon(this.icon, {this.light = false});

  final IconData icon;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: light
            ? EkoTrustTheme.imperialEmerald.withValues(alpha: 0.08)
            : EkoTrustTheme.royalMint.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(
        icon,
        color: light ? EkoTrustTheme.imperialEmerald : EkoTrustTheme.royalMint,
      ),
    );
  }
}

class _SmallPill extends StatelessWidget {
  const _SmallPill(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: EkoTrustTheme.royalMint.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: EkoTrustTheme.royalMint.withValues(alpha: 0.3),
        ),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: EkoTrustTheme.ivorySilk,
            ),
      ),
    );
  }
}

class _SmallDarkPill extends StatelessWidget {
  const _SmallDarkPill(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: EkoTrustTheme.imperialEmerald.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: EkoTrustTheme.imperialEmerald,
              fontWeight: FontWeight.w900,
            ),
      ),
    );
  }
}

class _SectionEyebrow extends StatelessWidget {
  const _SectionEyebrow(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: Theme.of(context).textTheme.labelMedium?.copyWith(
            color: EkoTrustTheme.sunGold,
            fontWeight: FontWeight.w900,
          ),
    );
  }
}

class _GoldDivider extends StatelessWidget {
  const _GoldDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 58, height: 3, color: EkoTrustTheme.sunGold),
        const SizedBox(width: 10),
        const Icon(Icons.diamond_rounded,
            color: EkoTrustTheme.sunGold, size: 18),
        const SizedBox(width: 10),
        Container(width: 58, height: 3, color: EkoTrustTheme.sunGold),
      ],
    );
  }
}

class _SecurityFooter extends StatelessWidget {
  const _SecurityFooter();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 10,
      runSpacing: 8,
      children: [
        const Icon(Icons.verified_user_rounded,
            color: EkoTrustTheme.royalMint, size: 20),
        Text('Bank-level security',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                )),
        Text('-',
            style: TextStyle(
              color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.5),
            )),
        Text('End-to-end encryption',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                )),
        Text('-',
            style: TextStyle(
              color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.5),
            )),
        Text('100% Private',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: EkoTrustTheme.ivorySilk.withValues(alpha: 0.72),
                )),
      ],
    );
  }
}

class _EkoBackground extends StatelessWidget {
  const _EkoBackground();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
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
        child: CustomPaint(painter: _InstitutionPainter()),
      ),
    );
  }
}

class _InstitutionPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          EkoTrustTheme.royalMint.withValues(alpha: 0.16),
          Colors.transparent,
        ],
      ).createShader(Rect.fromCircle(
        center: Offset(size.width * 0.15, size.height * 0.12),
        radius: size.width * 0.72,
      ));
    canvas.drawRect(Offset.zero & size, glow);

    final line = Paint()
      ..color = EkoTrustTheme.ivorySilk.withValues(alpha: 0.07)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final baseY = size.height * 0.38;
    for (var i = 0; i < 5; i += 1) {
      final x = size.width * (0.58 + i * 0.09);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x, baseY, size.width * 0.045, size.height * 0.33),
          const Radius.circular(8),
        ),
        line,
      );
    }
    final roof = Path()
      ..moveTo(size.width * 0.53, baseY)
      ..lineTo(size.width * 0.78, baseY - 72)
      ..lineTo(size.width * 1.04, baseY)
      ..close();
    canvas.drawPath(roof, line);

    final shieldPaint = Paint()
      ..color = EkoTrustTheme.royalMint.withValues(alpha: 0.10)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5;
    final shield = Path()
      ..moveTo(size.width * 0.72, size.height * 0.26)
      ..quadraticBezierTo(size.width * 0.86, size.height * 0.30,
          size.width * 0.88, size.height * 0.44)
      ..quadraticBezierTo(size.width * 0.82, size.height * 0.55,
          size.width * 0.72, size.height * 0.60)
      ..quadraticBezierTo(size.width * 0.62, size.height * 0.55,
          size.width * 0.56, size.height * 0.44)
      ..quadraticBezierTo(size.width * 0.58, size.height * 0.30,
          size.width * 0.72, size.height * 0.26);
    canvas.drawPath(shield, shieldPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
