import 'package:flutter/material.dart';

/// Custom Material Design 3 color palette for Lucid Entertainment.
class AppColors {
  AppColors._();

  // Primary (Monochrome)
  static const Color primary = Color(0xFF000000);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF1A1C1F);
  static const Color onPrimaryContainer = Color(0xFFFEFCFF);
  static const Color primaryFixed = Color(0xFFE2E2E7);
  static const Color primaryFixedDim = Color(0xFF717786);
  static const Color onPrimaryFixed = Color(0xFF000000);
  static const Color onPrimaryFixedVariant = Color(0xFF1A1C1F);

  // Secondary (Muted Grey)
  static const Color secondary = Color(0xFF414755);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFE2E2E7);
  static const Color onSecondaryContainer = Color(0xFF1A1C1F);
  static const Color secondaryFixed = Color(0xFFF3F3F8);
  static const Color secondaryFixedDim = Color(0xFFD9DADE);
  static const Color onSecondaryFixed = Color(0xFF000000);
  static const Color onSecondaryFixedVariant = Color(0xFF414755);

  // Tertiary (Deep Charcoal)
  static const Color tertiary = Color(0xFF1A1C1F);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFF2E3034);
  static const Color onTertiaryContainer = Color(0xFFFFFBFF);
  static const Color tertiaryFixed = Color(0xFFEDEDF2);
  static const Color tertiaryFixedDim = Color(0xFFD9DADE);
  static const Color onTertiaryFixed = Color(0xFF000000);
  static const Color onTertiaryFixedVariant = Color(0xFF1A1C1F);

  // Error (Keep red for semantics but muted)
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Surface
  static const Color surface = Color(0xFFFFFFFF);
  static const Color onSurface = Color(0xFF000000);
  static const Color surfaceVariant = Color(0xFFF3F3F8);
  static const Color onSurfaceVariant = Color(0xFF414755);
  static const Color surfaceBright = Color(0xFFFFFFFF);
  static const Color surfaceDim = Color(0xFFF3F3F8);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFFAFAFA);
  static const Color surfaceContainer = Color(0xFFF3F3F8);
  static const Color surfaceContainerHigh = Color(0xFFEDEDF2);
  static const Color surfaceContainerHighest = Color(0xFFE2E2E7);
  static const Color surfaceTint = Color(0xFF000000);

  // Outline
  static const Color outline = Color(0xFF717786);
  static const Color outlineVariant = Color(0xFFE2E2E7);

  // Inverse
  static const Color inverseSurface = Color(0xFF000000);
  static const Color inverseOnSurface = Color(0xFFFFFFFF);
  static const Color inversePrimary = Color(0xFFE2E2E7);

  // Background
  static const Color background = Color(0xFFFFFFFF);
  static const Color onBackground = Color(0xFF000000);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, Color(0xFF414755)], // Black to Dark Grey
  );

  static const LinearGradient mapOverlayGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xCCFFFFFF), // 80% white
      Color(0x00FFFFFF), // 0%
      Color(0x00FFFFFF), // 0%
      Color(0xCCFFFFFF), // 80%
    ],
    stops: [0.0, 0.2, 0.8, 1.0],
  );
}
