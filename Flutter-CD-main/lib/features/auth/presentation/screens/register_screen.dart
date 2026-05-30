import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/custom_warning_dialog.dart';
import 'package:dio/dio.dart';
import '../../../home/presentation/screens/main_screen.dart';
import 'otp_verification_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _performRegistration() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      showCustomWarningDialog(
        context: context,
        title: AppLocalizations.of(context)!.attention,
        message: AppLocalizations.of(context)!.registerErrorEmpty,
      );
      return;
    }

    if (!Validators.isValidEmail(email)) {
      showCustomWarningDialog(
        context: context,
        title: AppLocalizations.of(context)!.attention,
        message: AppLocalizations.of(context)!.invalidEmailAddress,
      );
      return;
    }

    if (password.length < 6) {
      showCustomWarningDialog(
        context: context,
        title: AppLocalizations.of(context)!.attention,
        message: AppLocalizations.of(context)!.registerErrorPasswordShort,
      );
      return;
    }
    if (password != confirmPassword) {
      showCustomWarningDialog(
        context: context,
        title: AppLocalizations.of(context)!.attention,
        message: AppLocalizations.of(context)!.registerErrorPasswordsDontMatch,
      );
      return;
    }

    setState(() { _isLoading = true; _errorText = null; });

    try {
      final response = await DioClient().dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'displayName': name,
      });

      if (response.statusCode == 200 && response.data['requiresVerification'] == true) {
        if (mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => OtpVerificationScreen(email: email),
            ),
          );
        }
      }
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data['message'] != null) {
          final rawMessage = data['message'];
          String displayMessage;
          if (rawMessage is List) {
            displayMessage = rawMessage.map((m) => '• $m').join('\n');
          } else {
            displayMessage = rawMessage.toString();
          }

          final msg = displayMessage.toLowerCase();
          if (e.response?.statusCode == 409 || msg.contains('already') || msg.contains('mövcud') || msg.contains('exists') || msg.contains('istifadə')) {
            if (mounted) {
              setState(() => _isLoading = false);
              _showUserExistsDialog();
            }
            return;
          }
          // Sanitize: only show user-friendly messages, not raw stack traces (G13 fix)
          if (displayMessage.contains('Exception') ||
              displayMessage.contains('Error:') ||
              displayMessage.length > 200) {
            displayMessage = AppLocalizations.of(context)!.registerErrorGeneral;
          }
          showCustomWarningDialog(
            context: context,
            title: AppLocalizations.of(context)!.attention,
            message: displayMessage,
          );
        } else {
          showCustomWarningDialog(
            context: context,
            title: AppLocalizations.of(context)!.attention,
            message: AppLocalizations.of(context)!.registerErrorGeneral,
          );
        }
      } else {
        showCustomWarningDialog(
          context: context,
          title: AppLocalizations.of(context)!.attention,
          message: AppLocalizations.of(context)!.loginErrorNetwork,
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showUserExistsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceContainerLowest,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.error),
            const SizedBox(width: 8),
            Text(
              "Diqqət!",
              style: AppTypography.titleLarge.copyWith(color: AppColors.onSurface),
            ),
          ],
        ),
        content: Text(
          "Bu hesab artıq qeydiyyatdan keçib. Zəhmət olmasa giriş səhifəsindən hesabınıza daxil olun və ya başqa e-poçt ünvanı yoxlayın.",
          style: AppTypography.bodyLarge.copyWith(color: AppColors.onSurfaceVariant),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: Text(
              "Bağla",
              style: AppTypography.labelLarge.copyWith(color: AppColors.outline),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _goToLogin();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text("Giriş səhifəsi"),
          ),
        ],
      ),
    );
  }

  void _performGoogleLogin() async {
    final userCred = await AuthService().signInWithGoogle();
    if (userCred != null && mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainScreen()),
        (route) => false,
      );
    }
  }

  void _goToLogin() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          // Background abstract blur (Top Left)
          Positioned(
            top: -size.height * 0.1,
            left: -size.width * 0.1,
            child: Container(
              width: size.width * 0.5,
              height: size.height * 0.5,
              decoration: BoxDecoration(
                color: AppColors.onSurface.withValues(alpha: 0.03),
                shape: BoxShape.circle,
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 120, sigmaY: 120),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),
          
          // Background abstract blur (Right Center)
          Positioned(
            top: size.height * 0.4,
            right: -size.width * 0.05,
            child: Container(
              width: size.width * 0.4,
              height: size.height * 0.4,
              decoration: BoxDecoration(
                color: AppColors.outlineVariant.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
                child: Container(color: Colors.transparent),
              ),
            ),
          ),

          // Background Image Asset (Abstract Light Physics)
          Positioned(
            bottom: 0,
            right: 0,
            child: Opacity(
              opacity: 0.4,
              child: Image.network(
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAuS06UUBNiO4wRZ9VE2jDkuAg7MQqfiAC5syxqkt8gad7i9w6VIZEGVw25DDZt-tytS6tXs21uu5_qDgzEADQmslXwjNC_sKwEHSCWALizyRClSQyyKzF4hHxiiX0JYBTsnXbpQVTYV0t9YLIIgSrdvOVW-KT3xjJXoXnXHf33435BB3iVAkxAGVhJAm81W3UStF3xQ4mn2Ug09jL1Bx0UV-gbAd9eETbPt1ZExxP0HE4YVWV-wp7Wxz-Am97qU5spz-LLl3ebjiU',
                width: 600,
                height: 600,
                fit: BoxFit.cover,
                colorBlendMode: BlendMode.multiply, // mix-blend-multiply equivalent
              ),
            ),
          ),

          // Main Scrollable Content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Brand Header Section
                      _buildHeader(),
                      const SizedBox(height: 40),

                      // Registration Form Container
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            _buildForm(),
                            const SizedBox(height: 32),
                            
                            // Divider
                            _buildDivider(),
                            const SizedBox(height: 32),

                            // Google Button
                            _buildGoogleButton(),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Footer Links
                      _buildFooter(),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // App Identity Bottom Accent
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                width: 128,
                height: 6,
                decoration: BoxDecoration(
                  color: AppColors.onSurface.withValues(alpha: 0.1),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(100)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
              ),
            ],
          ),
          child: const Icon(
            Icons.color_lens,
            color: AppColors.primary,
            size: 36,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Lucid Entertainment',
          style: AppTypography.headlineLarge.copyWith(
            color: AppColors.onSurface,
            letterSpacing: -0.5,
            fontSize: 36,
            fontWeight: FontWeight.w800,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          AppLocalizations.of(context)!.registerSubtitle,
          style: AppTypography.bodyLarge.copyWith(
            color: AppColors.onSurfaceVariant,
            fontWeight: FontWeight.w500,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Full Name Field
        Padding(
          padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
          child: Text(
            AppLocalizations.of(context)!.fullNameLabelCaps,
            style: AppTypography.titleSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        _buildTextField(
          controller: _nameController,
          hint: AppLocalizations.of(context)!.enterNameHint,
          icon: Icons.person_outline,
        ),
        const SizedBox(height: 20),

        // Email Field
        Padding(
          padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
          child: Text(
            AppLocalizations.of(context)!.emailLabel,
            style: AppTypography.titleSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        _buildTextField(
          controller: _emailController,
          hint: AppLocalizations.of(context)!.emailHint,
          icon: Icons.mail_outline,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 20),

        // Password Field
        Padding(
          padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
          child: Text(
            AppLocalizations.of(context)!.passwordLabel,
            style: AppTypography.titleSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        _buildTextField(
          controller: _passwordController,
          hint: AppLocalizations.of(context)!.passwordHintLength,
          icon: Icons.lock_outline,
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: AppColors.outline,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
        ),
        const SizedBox(height: 20),

        // Confirm Password Field
        Padding(
          padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
          child: Text(
            AppLocalizations.of(context)!.confirmPasswordLabel,
            style: AppTypography.titleSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        _buildTextField(
          controller: _confirmPasswordController,
          hint: AppLocalizations.of(context)!.repeatPasswordHint,
          icon: Icons.lock_reset_outlined,
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: AppColors.outline,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
              });
            },
          ),
        ),
        const SizedBox(height: 32),

        // Submit Button
        ElevatedButton(
          onPressed: _isLoading ? null : _performRegistration,
          style: ElevatedButton.styleFrom(
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            elevation: 0,
          ).copyWith(
            backgroundColor: WidgetStateProperty.all(Colors.transparent),
            shadowColor: WidgetStateProperty.all(Colors.transparent),
          ),
          child: Ink(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(100),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Container(
              height: 56,
              alignment: Alignment.center,
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: AppColors.onPrimary,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Text(
                      AppLocalizations.of(context)!.createAccountBtn,
                      style: AppTypography.titleMedium.copyWith(
                        color: AppColors.onPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: AppTypography.bodyLarge.copyWith(color: AppColors.onSurface),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppColors.outline),
        filled: true,
        fillColor: AppColors.surfaceContainerLow,
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 12.0),
          child: Icon(icon, color: AppColors.outline),
        ),
        prefixIconConstraints: const BoxConstraints(minWidth: 48),
        suffixIcon: suffixIcon,
        contentPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 18.0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(100),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(100),
          borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.2), width: 2),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: AppColors.outlineVariant.withValues(alpha: 0.3),
            thickness: 1,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text(
            AppLocalizations.of(context)!.or,
            style: AppTypography.titleSmall.copyWith(
              color: AppColors.outline,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Divider(
            color: AppColors.outlineVariant.withValues(alpha: 0.3),
            thickness: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildGoogleButton() {
    return ElevatedButton(
      onPressed: _performGoogleLogin,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.surfaceContainerHigh,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(100),
        ),
        minimumSize: const Size(double.infinity, 56),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset(
            'assets/images/google_logo.png',
            width: 20,
            height: 20,
          ),
          const SizedBox(width: 12),
          Text(
            AppLocalizations.of(context)!.continueWithGoogle,
            style: AppTypography.titleMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppLocalizations.of(context)!.alreadyHaveAccount,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            GestureDetector(
              onTap: _goToLogin,
              child: Text(
                AppLocalizations.of(context)!.logInBtn,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: () {},
              child: Text(
                AppLocalizations.of(context)!.privacyPolicy,
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.outline,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                width: 4,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.outlineVariant,
                  shape: BoxShape.circle,
                ),
              ),
            ),
            GestureDetector(
              onTap: () {},
              child: Text(
                AppLocalizations.of(context)!.termsOfService,
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.outline,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        )
      ],
    );
  }
}
