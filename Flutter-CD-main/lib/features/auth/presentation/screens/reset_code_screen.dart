import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/network/dio_client.dart';

class ResetCodeScreen extends StatefulWidget {
  final String email;
  const ResetCodeScreen({super.key, required this.email});

  @override
  State<ResetCodeScreen> createState() => _ResetCodeScreenState();
}

class _ResetCodeScreenState extends State<ResetCodeScreen> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _isCodeVerified = false;
  bool _obscurePassword = true;
  String? _errorText;
  String? _successText;

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyCode() async {
    final code = _codeController.text.trim();

    if (code.length != 6) {
      setState(() => _errorText = AppLocalizations.of(context)!.resetPasswordErrorLength);
      return;
    }

    setState(() {
      _isLoading = true;
      _errorText = null;
      _successText = null;
    });

    try {
      final response = await DioClient().dio.post('/auth/verify-reset-code', data: {
        'email': widget.email,
        'resetCode': code,
      });

      if (response.statusCode == 200) {
        setState(() {
          _isCodeVerified = true;
          _successText = response.data['message'];
        });
      }
    } catch (e) {
      setState(() {
        _errorText = _extractError(e);
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    final code = _codeController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (code.length != 6) {
      setState(() => _errorText = AppLocalizations.of(context)!.resetPasswordErrorLength);
      return;
    }

    if (password.length < 6) {
      setState(() => _errorText = AppLocalizations.of(context)!.registerErrorPasswordShort);
      return;
    }

    if (password != confirmPassword) {
      setState(() => _errorText = AppLocalizations.of(context)!.registerErrorPasswordsDontMatch);
      return;
    }

    setState(() {
      _isLoading = true;
      _errorText = null;
      _successText = null;
    });

    try {
      final response = await DioClient().dio.post('/auth/reset-password', data: {
        'email': widget.email,
        'resetCode': code,
        'newPassword': password,
      });

      if (response.statusCode == 200) {
        setState(() {
          _successText = response.data['message'] ?? AppLocalizations.of(context)!.passwordSuccess;
        });

        // Navigate back to login after 2 seconds
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      }
    } catch (e) {
      setState(() {
        _errorText = _extractError(e);
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _extractError(dynamic e) {
    if (e is DioException && e.response?.data != null) {
      final data = e.response!.data;
      if (data is Map && data['message'] != null) return data['message'];
    }
    return AppLocalizations.of(context)!.errorOccurred;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(64),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: AppBar(
              backgroundColor: AppColors.surface.withValues(alpha: 0.8),
              elevation: 0,
              leading: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back, color: AppColors.primary),
              ),
              centerTitle: true,
              title: Text(
                AppLocalizations.of(context)!.resetPasswordTitleAppbar,
                style: AppTypography.headlineMedium.copyWith(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 48),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeroSection(),
                  const SizedBox(height: 40),
                  _buildForm(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.onSurface.withValues(alpha: 0.04),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: const Icon(Icons.key, color: AppColors.primary, size: 32),
        ),
        const SizedBox(height: 32),
        Text(
          AppLocalizations.of(context)!.setNewPasswordHeader,
          style: AppTypography.headlineLarge.copyWith(
            color: AppColors.onSurface,
            fontSize: 34,
            fontWeight: FontWeight.w700,
            letterSpacing: -1.0,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 12),
        RichText(
          text: TextSpan(
            style: AppTypography.bodyLarge.copyWith(
              color: AppColors.onSurfaceVariant,
              height: 1.6,
            ),
            children: () {
              final text = AppLocalizations.of(context)!.resetCodeSentText(widget.email);
              final parts = text.split(widget.email);
              return [
                if (parts.isNotEmpty) TextSpan(text: parts.first),
                TextSpan(
                  text: widget.email,
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.onSurface),
                ),
                if (parts.length > 1) TextSpan(text: parts.last),
              ];
            }(),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!_isCodeVerified) ...[
          // Reset Code
          _buildLabel(AppLocalizations.of(context)!.resetCodeLabel),
          TextField(
            controller: _codeController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: AppTypography.headlineMedium.copyWith(
              fontWeight: FontWeight.w800,
              letterSpacing: 8,
              fontSize: 24,
            ),
            textAlign: TextAlign.center,
            decoration: _inputDecoration('000000', counterText: ''),
          ),
          const SizedBox(height: 24),
        ],

        if (_isCodeVerified) ...[
          // New Password
          _buildLabel(AppLocalizations.of(context)!.newPasswordLabel),
          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: AppTypography.bodyLarge.copyWith(color: AppColors.onSurface),
            decoration: _inputDecoration(AppLocalizations.of(context)!.passwordHintMinLength).copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: AppColors.outline,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Confirm Password
          _buildLabel(AppLocalizations.of(context)!.confirmPasswordLabelCaps),
          TextField(
            controller: _confirmPasswordController,
            obscureText: _obscurePassword,
            style: AppTypography.bodyLarge.copyWith(color: AppColors.onSurface),
            decoration: _inputDecoration(AppLocalizations.of(context)!.repeatPasswordHint),
          ),
        ],

        if (_errorText != null) ...[
          const SizedBox(height: 16),
          Text(
            _errorText!,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.error,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],

        if (_successText != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF00C853).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Color(0xFF00C853), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _successText!,
                    style: AppTypography.bodySmall.copyWith(
                      color: const Color(0xFF00C853),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 32),

        // Submit Button
        ElevatedButton(
          onPressed: _isLoading ? null : (_isCodeVerified ? _resetPassword : _verifyCode),
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
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.onPrimary,
                      ),
                    )
                  : Text(
                      _isCodeVerified 
                          ? AppLocalizations.of(context)!.updatePasswordBtn 
                          : AppLocalizations.of(context)!.verifyBtn,
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

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: AppTypography.labelTiny.copyWith(
          color: AppColors.primary,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, {String? counterText}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: AppColors.outline),
      counterText: counterText,
      filled: true,
      fillColor: AppColors.surfaceContainerLow,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
      ),
    );
  }
}
