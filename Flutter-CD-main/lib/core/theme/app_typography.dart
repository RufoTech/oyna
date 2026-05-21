import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Typography definitions using Manrope for headlines and Inter for body/labels.
class AppTypography {
  AppTypography._();

  static TextStyle get _baseHeadline => GoogleFonts.manrope(
        color: AppColors.onSurface,
      );

  static TextStyle get _baseBody => GoogleFonts.inter(
        color: AppColors.onSurface,
      );

  // Headlines
  static TextStyle get headlineLarge => _baseHeadline.copyWith(
        fontSize: 32,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.0,
      );

  static TextStyle get headlineMedium => _baseHeadline.copyWith(
        fontSize: 28,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get headlineSmall => _baseHeadline.copyWith(
        fontSize: 24,
        fontWeight: FontWeight.w700,
      );

  // Title
  static TextStyle get titleLarge => _baseHeadline.copyWith(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.3,
      );

  static TextStyle get titleMedium => _baseHeadline.copyWith(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
      );

  static TextStyle get titleSmall => _baseHeadline.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  // Body
  static TextStyle get bodyLarge => _baseBody.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodyMedium => _baseBody.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodySmall => _baseBody.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );

  // Labels
  static TextStyle get labelLarge => _baseBody.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelMedium => _baseBody.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get labelSmall => _baseBody.copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
      );

  static TextStyle get labelTiny => _baseBody.copyWith(
        fontSize: 8,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
      );
}
