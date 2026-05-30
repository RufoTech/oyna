import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/custom_warning_dialog.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/utils/validators.dart';
import 'package:dio/dio.dart';
import '../../../home/presentation/screens/main_screen.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import 'otp_verification_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _performLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      showCustomWarningDialog(
        context: context,
        title: AppLocalizations.of(context)!.attention,
        message: AppLocalizations.of(context)!.loginErrorEmpty,
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

    setState(() { _isLoading = true; _errorText = null; });

    try {
      final response = await DioClient().dio.post('/auth/login/user', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        // Check if requires OTP verification
        if (response.data['requiresVerification'] == true) {
          if (mounted) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => OtpVerificationScreen(email: email),
              ),
            );
          }
          return;
        }

        // Store token and navigate
        if (response.data['access_token'] != null) {
          final token = response.data['access_token'];
          await AuthService().saveToken(token);

          if (mounted) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const MainScreen()),
              (route) => false,
            );
          }
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
          // Sanitize: only show user-friendly messages, not raw stack traces
          if (displayMessage.contains('Exception') ||
              displayMessage.contains('Error:') ||
              displayMessage.length > 200) {
            displayMessage = AppLocalizations.of(context)!.loginErrorInvalid;
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
            message: AppLocalizations.of(context)!.loginErrorInvalid,
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

  void _performGoogleLogin() async {
    setState(() {
      _isLoading = true;
      _errorText = null;
    });

    try {
      final userCred = await AuthService().signInWithGoogle();
      if (userCred != null && mounted) {
        // StreamBuilder handles the UI root switch, but let's safely pop context cache just in case
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const MainScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      debugPrint("Error during Google Login: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _getLoadingText(BuildContext context) {
    try {
      final locale = Localizations.localeOf(context).languageCode;
      switch (locale) {
        case 'az':
          return 'Giriş edilir...';
        case 'ru':
          return 'Вход в систему...';
        case 'en':
        default:
          return 'Signing in...';
      }
    } catch (_) {
      return 'Signing in...';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [

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
                      // Header
                      _buildHeader(),
                      const SizedBox(height: 48),

                      // Auth Form
                      _buildForm(),
                      const SizedBox(height: 16),

                      // Divider "or continue with"
                      _buildDivider(),
                      const SizedBox(height: 16),

                       // Google Button
                      _buildGoogleButton(),
                      const SizedBox(height: 32),

                      // Sign Up Prompt
                      _buildSignUpFooter(),
                      
                    ],
                  ),
                ),
              ),
            ),
          ),

          if (_isLoading)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.35),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const CircularProgressIndicator(
                            color: AppColors.primary,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _getLoadingText(context),
                            style: AppTypography.bodyMedium.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
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
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Image.asset(
            'assets/images/logo.png',
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 24),
        ShaderMask(
          shaderCallback: (bounds) => AppColors.primaryGradient.createShader(bounds),
          child: Text(
            'Lucid Entertainment',
            style: AppTypography.headlineLarge.copyWith(
              color: Colors.white, // Required for ShaderMask to apply gradient correctly
              letterSpacing: -0.5,
              fontSize: 32,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context)!.loginSubtitle,
          style: AppTypography.bodyLarge.copyWith(
            color: AppColors.onSurfaceVariant,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.5,
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
        // Email Field
        Padding(
          padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
          child: Text(
            AppLocalizations.of(context)!.emailAddressLabel,
            style: AppTypography.labelTiny.copyWith(
              color: AppColors.primary,
              letterSpacing: 1.5,
            ),
          ),
        ),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.emailHint,
            hintStyle: TextStyle(color: AppColors.outline),
            filled: true,
            fillColor: AppColors.surfaceContainerLow,
            contentPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Password Field
        Padding(
          padding: const EdgeInsets.only(left: 16.0, right: 8.0, bottom: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppLocalizations.of(context)!.passwordLabel,
                style: AppTypography.labelTiny.copyWith(
                  color: AppColors.primary,
                  letterSpacing: 1.5,
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const ForgotPasswordScreen(),
                    ),
                  );
                },
                child: Text(
                  AppLocalizations.of(context)!.forgotPasswordBtn,
                  style: AppTypography.labelTiny.copyWith(
                    color: AppColors.outline,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
        TextField(
          controller: _passwordController,
          obscureText: true,
          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w500),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: TextStyle(color: AppColors.outline),
            filled: true,
            fillColor: AppColors.surfaceContainerLow,
            contentPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Sign In Button
        ElevatedButton(
          onPressed: _performLogin,
          style: ElevatedButton.styleFrom(
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ).copyWith(
            backgroundColor: WidgetStateProperty.all(Colors.transparent),
            shadowColor: WidgetStateProperty.all(Colors.transparent),
          ),
          child: Ink(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
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
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    AppLocalizations.of(context)!.signInBtn,
                    style: AppTypography.titleMedium.copyWith(
                      color: AppColors.onPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward, color: AppColors.onPrimary),
                ],
              ),
            ),
          ),
        ),
      ],
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
            AppLocalizations.of(context)!.orContinueWith,
            style: AppTypography.labelTiny.copyWith(
              color: AppColors.outline,
              letterSpacing: -0.5,
              fontSize: 10,
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
        backgroundColor: AppColors.surfaceContainerLowest,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.2)),
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
            'Google',
            style: AppTypography.titleSmall.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignUpFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          AppLocalizations.of(context)!.donthaveAccount,
          style: AppTypography.bodySmall.copyWith(
            color: AppColors.onSurfaceVariant,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 4),
        GestureDetector(
          onTap: () {
            Navigator.of(context).push(
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) => const RegisterScreen(),
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  const begin = Offset(1.0, 0.0);
                  const end = Offset.zero;
                  const curve = Curves.easeInOutCubic;
                  var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
                  return SlideTransition(
                    position: animation.drive(tween),
                    child: child,
                  );
                },
                transitionDuration: const Duration(milliseconds: 300),
              ),
            );
          },
          child: Text(
            AppLocalizations.of(context)!.signUpBtn,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}
