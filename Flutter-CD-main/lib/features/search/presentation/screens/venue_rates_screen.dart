import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/models/venue_model.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'pc_details_screen.dart';

class VenueRatesScreen extends StatelessWidget {
  final Venue? venue;
  const VenueRatesScreen({super.key, this.venue});

  IconData _getTierIcon(String? iconName, bool isPs) {
    if (iconName == null || iconName.trim().isEmpty) {
      return isPs ? Icons.sports_esports : Icons.desktop_windows;
    }
    
    final lower = iconName.toLowerCase().trim();
    
    // Direct matches for Admin Panel Material Icons
    if (lower == 'rocket_launch') return Icons.rocket_launch;
    if (lower == 'workspace_premium') return Icons.workspace_premium;
    if (lower == 'groups') return Icons.groups;
    if (lower == 'military_tech') return Icons.military_tech;
    
    if (lower.contains('vip') || lower.contains('star') || lower.contains('ulduz')) return Icons.star;
    if (lower.contains('pro') || lower.contains('bolt') || lower.contains('flash')) return Icons.bolt;
    if (lower.contains('premium') || lower.contains('diamond')) return Icons.diamond;
    if (lower.contains('pc') || lower.contains('desktop') || lower.contains('komputer') || lower.contains('monitor')) return Icons.desktop_windows;
    if (lower.contains('playstation') || lower.contains('ps') || lower.contains('gamepad') || lower.contains('joystick') || lower.contains('console')) return Icons.sports_esports;
    if (lower.contains('sofa') || lower.contains('kreslo')) return Icons.chair;
    if (lower.contains('vr') || lower.contains('virtual') || lower.contains('headset')) return Icons.view_in_ar;
    
    // Default fallback
    return isPs ? Icons.sports_esports : Icons.desktop_windows;
  }

  @override
  Widget build(BuildContext context) {
    final specs = venue?.specs;
    final tiers = specs?.tiers ?? [];
    final packages = specs?.packages ?? [];

    return Scaffold(
      backgroundColor: AppColors.surface,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
            child: AppBar(
              backgroundColor: AppColors.surface.withValues(alpha: 0.8),
              elevation: 0,
              centerTitle: false,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(
                AppLocalizations.of(context)!.ratesAndPackages,
                style: AppTypography.headlineMedium.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 24,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + kToolbarHeight + 32,
          bottom: MediaQuery.of(context).padding.bottom + 120, // Leave space
          left: 24,
          right: 24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero Section
            // Hero Section
            Text(
              (venue?.name ?? AppLocalizations.of(context)!.venue).toUpperCase(),
              style: AppTypography.labelTiny.copyWith(
                fontSize: 14,
                color: AppColors.primary,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              specs?.pageTitle ?? AppLocalizations.of(context)!.standardRates,
              style: AppTypography.headlineLarge.copyWith(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              specs?.pageSubtitle ?? AppLocalizations.of(context)!.pricingInfo,
              style: AppTypography.bodyLarge.copyWith(
                color: AppColors.onSurfaceVariant,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 48),

            // Bento Layout: Gaming Rates
            if (tiers.isNotEmpty) ...[
              // Bento Layout: Gaming Rates
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppLocalizations.of(context)!.gamingRates,
                    style: AppTypography.headlineMedium.copyWith(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerHigh,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      AppLocalizations.of(context)!.hourlyCaps,
                      style: AppTypography.labelTiny.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              GridView.builder(
                padding: EdgeInsets.zero,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.85,
                ),
                itemCount: tiers.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  final tier = tiers[index];
                  final isPs = tier.type?.toLowerCase() == 'ps' || tier.type?.toLowerCase() == 'playstation';
                  return _RateCard(
                    icon: _getTierIcon(tier.icon, isPs),
                    title: tier.title ?? AppLocalizations.of(context)!.unnamedTier,
                    subtitle: tier.shortSpec ?? '',
                    price: '${tier.price.toStringAsFixed(1)} AZN',
                    iconColor: isPs ? AppColors.onSurface : AppColors.primary,
                    onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => PcDetailsScreen(
                              tier: tier,
                              venue: venue,
                            ),
                          ),
                        );
                    },
                  );
                },
              ),
              const SizedBox(height: 48),
            ],
            const SizedBox(height: 48),



            if (packages.isNotEmpty) ...[
              // Special Packages
              Text(
                AppLocalizations.of(context)!.specialPackages,
                style: AppTypography.headlineMedium.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 24),
              ...packages.map((pkg) => _PackageCard(package: pkg)),
            ],
          ],
        ),
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  final SpecPackage package;
  const _PackageCard({required this.package});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: package.hasDiscount 
              ? [AppColors.primary, AppColors.primaryContainer]
              : [AppColors.onSurface, AppColors.onSurfaceVariant],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (package.hasDiscount) ...[
            Builder(
              builder: (context) {
                int? discountPercent;
                if (package.discountPrice != null && package.price > 0) {
                  discountPercent = (((package.price - package.discountPrice!) / package.price) * 100).round();
                }
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(100),
                  ),
                    child: Text(
                      discountPercent != null && discountPercent > 0 
                        ? AppLocalizations.of(context)!.discountedWithPercent(discountPercent.toString()) 
                        : AppLocalizations.of(context)!.discounted,
                    style: AppTypography.labelTiny.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                    ),
                  ),
                );
              },
            ),
          ],
          Text(
            package.title,
            style: AppTypography.headlineLarge.copyWith(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (package.description != null) ...[
            const SizedBox(height: 8),
            Text(
              package.description!,
              style: AppTypography.bodyMedium.copyWith(
                color: Colors.white.withValues(alpha: 0.8),
              ),
            ),
          ],
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (package.hasDiscount && package.discountPrice != null) ...[
                Text(
                  '${package.price.toStringAsFixed(1)} AZN',
                  style: AppTypography.bodyLarge.copyWith(
                    color: Colors.white.withValues(alpha: 0.6),
                    decoration: TextDecoration.lineThrough,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${package.discountPrice!.toStringAsFixed(1)} AZN',
                  style: AppTypography.headlineLarge.copyWith(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1.0,
                  ),
                ),
              ] else
                Text(
                  '${package.price.toStringAsFixed(1)} AZN',
                  style: AppTypography.headlineLarge.copyWith(
                    fontSize: 48,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1.0,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RateCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String price;
  final Color iconColor;
  final VoidCallback? onTap;

  const _RateCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.price,
    required this.iconColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          splashColor: Colors.black.withValues(alpha: 0.08),
          highlightColor: Colors.black.withValues(alpha: 0.04),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(24),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(icon, color: AppColors.onSurface, size: 36),
                    Icon(Icons.arrow_outward, color: AppColors.onSurfaceVariant.withValues(alpha: 0.4), size: 22),
                  ],
                ),
                const Spacer(),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.labelTiny.copyWith(
                    color: AppColors.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  price,
                  style: AppTypography.headlineMedium.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.onSurface,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
