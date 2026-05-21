import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/models/venue_model.dart';
import '../../../../core/constants/app_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/glass_panel.dart';

/// Floating venue detail card shown at the bottom of the map.
/// Now accepts dynamic [Venue] data from backend.
class VenueCard extends StatelessWidget {
  final Venue? venue;
  final GestureDragUpdateCallback? onDragUpdate;
  final GestureDragEndCallback? onDragEnd;
  final VoidCallback? onBookTap;

  const VenueCard({
    super.key,
    this.venue,
    this.onDragUpdate,
    this.onDragEnd,
    this.onBookTap,
  });

  @override
  Widget build(BuildContext context) {
    final venueName = venue?.name ?? AppLocalizations.of(context)!.venue;
    final heroUrl = AppConfig.formatImageUrl(venue?.media?.heroImage?.url);
    final basePrice = venue?.pricing?.basePrice ?? 0;
    final city = venue?.location?.city ?? '';
    final isOpen = (venue?.status == 'ACTIVE' || venue?.status == 'PUBLISHED') && !(venue?.temporarilyClosed ?? false);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 448),
        child: GlassPanel(
          borderRadius: BorderRadius.circular(32),
          backgroundOpacity: 0.92,
          blurSigma: 25,
          border: Border.all(
            color: AppColors.outlineVariant.withValues(alpha: 0.1),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.onSurface.withValues(alpha: 0.1),
              blurRadius: 32,
              spreadRadius: 2,
            ),
          ],
          padding: const EdgeInsets.all(16),
          child: GestureDetector(
            onVerticalDragUpdate: onDragUpdate,
            onVerticalDragEnd: onDragEnd,
            onTap: onBookTap,
            behavior: HitTestBehavior.opaque,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag Handle
                Container(
                  width: 48,
                  height: 6,
                  decoration: BoxDecoration(
                    color: AppColors.outlineVariant.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                const SizedBox(height: 16),
                // Content row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Venue image (dynamic)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: heroUrl != null && heroUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: heroUrl,
                              width: 96,
                              height: 96,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                width: 96,
                                height: 96,
                                color: AppColors.surfaceContainerHigh,
                              ),
                              errorWidget: (context, url, error) => _imagePlaceholder(),
                            )
                          : _imagePlaceholder(),
                    ),
                    const SizedBox(width: 16),
                    // Info column
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _StatusBadge(isOpen: isOpen),
                                    const SizedBox(height: 4),
                                    Text(
                                      venueName,
                                      style: AppTypography.titleMedium.copyWith(
                                        letterSpacing: -0.3,
                                        height: 1.2,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    if (city.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on, size: 14, color: AppColors.onSurfaceVariant),
                                          const SizedBox(width: 2),
                                          Text(
                                            city,
                                            style: AppTypography.bodySmall.copyWith(
                                              color: AppColors.onSurfaceVariant,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                child: Column(
                                  children: [
                                    if (venue?.temporarilyClosed ?? false)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        margin: const EdgeInsets.only(bottom: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.red.shade600,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          AppLocalizations.of(context)!.temporarilyClosed,
                                          style: AppTypography.labelSmall.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    Container(
                                      width: 32,
                                      height: 32,
                                      decoration: BoxDecoration(
                                        color: AppColors.surfaceContainerLow,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.favorite_border,
                                        size: 20,
                                        color: AppColors.onSurfaceVariant,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(
                  height: 1,
                  color: AppColors.outlineVariant.withValues(alpha: 0.05),
                ),
                const SizedBox(height: 16),
                // Price + book row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppLocalizations.of(context)!.startingPrice,
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.outline,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: '${basePrice.toStringAsFixed(0)} AZN',
                                style: AppTypography.titleMedium.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 20,
                                ),
                              ),
                              TextSpan(
                                text: AppLocalizations.of(context)!.perHour,
                                style: AppTypography.bodySmall.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: onBookTap,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 12),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(100),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Text(
                          AppLocalizations.of(context)!.details,
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.onPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 96,
      height: 96,
      color: AppColors.surfaceContainerHigh,
      child: const Icon(Icons.image, color: AppColors.outline),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isOpen;
  const _StatusBadge({required this.isOpen});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isOpen ? const Color(0xFF00C853) : AppColors.error,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isOpen ? AppLocalizations.of(context)!.nowOpen : AppLocalizations.of(context)!.closedCaps,
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}

