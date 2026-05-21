import 'package:flutter/material.dart';

import '../../../../shared/widgets/glass_panel.dart';
import '../../../../core/theme/app_colors.dart';

/// Floating action button for centering the map on the user's location.
class LocationFab extends StatelessWidget {
  final VoidCallback? onTap;
  final bool isLoading;

  const LocationFab({
    super.key,
    this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: GlassPanel(
        borderRadius: BorderRadius.circular(100),
        backgroundOpacity: 0.9,
        blurSigma: 25,
        boxShadow: [
          BoxShadow(
            color: AppColors.onSurface.withValues(alpha: 0.05),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
        child: SizedBox(
          width: 48,
          height: 48,
          child: isLoading
              ? const Padding(
                  padding: EdgeInsets.all(12.0),
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.primary,
                  ),
                )
              : const Icon(
                  Icons.my_location,
                  color: AppColors.primary,
                  size: 24,
                ),
        ),
      ),
    );
  }
}
