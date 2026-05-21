import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../../l10n/app_localizations.dart';
import '../../../../../core/constants/app_config.dart';
import '../../../../../core/models/venue_model.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import 'venue_hero_section.dart';

/// Description / About section.
class VenueDescriptionSection extends StatelessWidget {
  final Venue? venue;
  const VenueDescriptionSection({super.key, this.venue});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.about,
          style: AppTypography.headlineMedium.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          venue?.description ?? AppLocalizations.of(context)!.noDescription,
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.onSurfaceVariant,
            height: 1.6,
          ),
        ),
      ],
    );
  }
}

/// Operating hours schedule section.
class VenueOperatingHoursSection extends StatelessWidget {
  final VenueOperatingHours? operatingHours;
  const VenueOperatingHoursSection({super.key, this.operatingHours});

  String _translateDay(String day, BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (day.toLowerCase()) {
      case 'monday': return l10n.monday;
      case 'tuesday': return l10n.tuesday;
      case 'wednesday': return l10n.wednesday;
      case 'thursday': return l10n.thursday;
      case 'friday': return l10n.friday;
      case 'saturday': return l10n.saturday;
      case 'sunday': return l10n.sunday;
      default: return day;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (operatingHours == null) return const SizedBox.shrink();

    final is24_7 = operatingHours!.is24_7;
    final schedule = operatingHours!.schedule;

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.access_time_filled, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text(
              AppLocalizations.of(context)!.workingHours,
              style: AppTypography.headlineMedium.copyWith(
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.surfaceVariant.withValues(alpha: 0.5)),
            boxShadow: [
              BoxShadow(
                color: AppColors.onSurface.withValues(alpha: 0.03),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: is24_7
              ? Center(
                  child: Text(
                    AppLocalizations.of(context)!.alwaysOpen24_7,
                    style: AppTypography.bodyLarge.copyWith(
                      color: const Color(0xFF00C853),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              : Column(
                  children: daysOrder.map((dayKey) {
                    final daySchedule = schedule[dayKey];
                    final isClosed = daySchedule?.closed ?? true;
                    final isLast = dayKey == daysOrder.last;

                    return Padding(
                      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _translateDay(dayKey, context),
                            style: AppTypography.bodyMedium.copyWith(
                              color: AppColors.onSurface,
                              fontWeight: isClosed ? FontWeight.w500 : FontWeight.w600,
                            ),
                          ),
                          Text(
                            isClosed 
                                ? AppLocalizations.of(context)!.closedSchedule 
                                : '${daySchedule?.open ?? '--:--'} - ${daySchedule?.close ?? '--:--'}',
                            style: AppTypography.bodyMedium.copyWith(
                              color: isClosed ? Colors.red : AppColors.onSurfaceVariant,
                              fontWeight: isClosed ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

/// Services / Amenities bento grid.
class VenueServicesBento extends StatelessWidget {
  final Venue? venue;
  const VenueServicesBento({super.key, this.venue});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: venue?.amenities.length ?? 0,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemBuilder: (context, index) {
            final amenity = venue!.amenities[index];
            return _ServiceCard(
              icon: Icons.check_circle_outline, 
              title: amenity, 
              desc: AppLocalizations.of(context)!.availableAmenity,
            );
          },
        ),
      ],
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;

  const _ServiceCard({
    required this.icon,
    required this.title,
    required this.desc,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F3F8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: AppTypography.labelLarge.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

/// Gallery section with asymmetric layout.
class VenueGallerySection extends StatelessWidget {
  final Venue? venue;
  const VenueGallerySection({super.key, this.venue});

  List<String> get _galleryImages {
    return venue?.media?.gallery
            .map((e) => AppConfig.formatImageUrl(e.url))
            .whereType<String>()
            .toList() ??
        [];
  }

  void _openGallery(BuildContext context, int index) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VenueGalleryScreen(
          images: _galleryImages,
          initialIndex: index,
        ),
      ),
    );
  }

  void _openAllPhotos(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VenueAllPhotosGridScreen(images: _galleryImages),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              AppLocalizations.of(context)!.venueGallery,
              style: AppTypography.headlineMedium.copyWith(
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            GestureDetector(
              onTap: () => _openAllPhotos(context),
              child: Text(
                AppLocalizations.of(context)!.viewAll,
                style: AppTypography.labelMedium.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        SizedBox(
          height: 256,
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: GestureDetector(
                  onTap: () => _openGallery(context, 0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: _galleryImages.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: _galleryImages[0],
                          fit: BoxFit.cover,
                          height: double.infinity,
                        )
                      : Container(color: AppColors.surfaceContainerHigh),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 1,
                child: Column(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _openGallery(context, 1),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: _galleryImages.length > 1
                            ? CachedNetworkImage(
                                imageUrl: _galleryImages[1],
                                fit: BoxFit.cover,
                                width: double.infinity,
                              )
                            : Container(color: AppColors.surfaceContainerHigh),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _openGallery(context, 2),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: _galleryImages.length > 2
                                ? CachedNetworkImage(
                                    imageUrl: _galleryImages[2],
                                    fit: BoxFit.cover,
                                  )
                                : Container(color: AppColors.surfaceContainerHigh),
                            ),
                            if (_galleryImages.length > 3)
                              Container(
                                decoration: BoxDecoration(
                                  color: AppColors.onSurface.withValues(alpha: 0.4),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: Text(
                                    '+${_galleryImages.length - 3}',
                                    style: AppTypography.titleMedium.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
