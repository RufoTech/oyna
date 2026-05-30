import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter/services.dart';

import '../../../../core/models/venue_model.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/repositories/venue_repository.dart';

import '../widgets/venue_detail/venue_hero_section.dart';
import '../widgets/venue_detail/venue_info_card.dart';
import '../widgets/venue_detail/venue_sections.dart';
import '../widgets/venue_detail/venue_map_section.dart';
import 'reservation_screen.dart';
import 'floor_plan_screen.dart';

/// The detail screen matching the new "Lucid Entertainment - Club Details" HTML design.
/// Refactored to use extracted widget components for maintainability.
class VenueDetailScreen extends StatefulWidget {
  final Venue? venue;
  final VoidCallback? onBackTap;
  
  const VenueDetailScreen({super.key, this.venue, this.onBackTap});

  @override
  State<VenueDetailScreen> createState() => _VenueDetailScreenState();
}

class _VenueDetailScreenState extends State<VenueDetailScreen> {
  late Venue? venue;
  StreamSubscription? _venueUpdateSub;

  @override
  void initState() {
    super.initState();
    venue = widget.venue;
    
    // Ekran açılan kimi arxa planda API-dən TƏZƏ data çəkirik
    // (widget.venue köhnə ola bilər, bu onu dərhal düzəldir)
    _fetchFreshVenueData();
    
    // Listen for real-time venue status updates
    _venueUpdateSub = SocketService().onVenueUpdate.listen((data) {
      if (venue != null && data['_id'] == venue!.id) {
        setState(() {
          venue = venue!.copyWithStatus(
            status: data['status'] as String?,
            temporarilyClosed: data['temporarilyClosed'] as bool?,
          );
        });
        debugPrint('VenueDetailScreen: Real-time update applied for ${venue!.name}');
      }
    });
  }

  /// Backend-dən ən son venue məlumatını çəkir.
  /// Prop data ilə UI anında açılır, arxa planda isə təzə data gəlib UI-ı yeniləyir.
  Future<void> _fetchFreshVenueData() async {
    if (venue == null) return;
    try {
      final freshVenue = await VenueRepository().fetchVenueById(venue!.id);
      if (mounted) {
        setState(() {
          venue = freshVenue;
        });
        debugPrint('VenueDetailScreen: Fresh data loaded for ${venue!.name} (status: ${venue!.status}, closed: ${venue!.temporarilyClosed})');
      }
    } catch (e) {
      debugPrint('VenueDetailScreen: Fresh fetch failed: $e');
    }
  }

  @override
  void dispose() {
    _venueUpdateSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: AppColors.scaffoldBackground,
        body: Stack(
          children: [
            // Scrollable Body
            CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Hero Section
                      VenueHeroSection(venue: venue, onBackTap: widget.onBackTap),

                      // Main Info Content (Overlaps hero by -mt-8)
                      Transform.translate(
                        offset: const Offset(0, -32),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              VenueMainInfoCard(venue: venue),
                              const SizedBox(height: 40),
                              // Description
                              VenueDescriptionSection(venue: venue),
                              const SizedBox(height: 32),
                              // Operating Hours
                              VenueOperatingHoursSection(operatingHours: venue?.operatingHours),
                              const SizedBox(height: 32),
                              // Services Bento
                              if (venue?.amenities.isNotEmpty ?? false) ...[
                                VenueServicesBento(venue: venue),
                                const SizedBox(height: 32),
                              ],
                              // Gallery
                              VenueGallerySection(venue: venue),
                              const SizedBox(height: 32),
                              // Map & Address Section
                              VenueMapSection(venue: venue),
                              const SizedBox(height: 120), // Bottom padding for fixed footer
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Floating Top Navigation (Sticky)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      VenueFloatingNavButton(
                        icon: Icons.arrow_back,
                        onTap: widget.onBackTap ?? () => Navigator.pop(context),
                      ),
                      Row(
                        children: [
                          VenueFloatingNavButton(
                            icon: Icons.share_outlined,
                            onTap: () {},
                          ),
                          const SizedBox(width: 12),
                          VenueFloatingFavoriteButton(venueId: venue?.id ?? ''),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Fixed Action Footer
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _VenueActionFooter(
                venue: venue,
                onBookTap: () {
                  if (venue != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ReservationScreen(venue: venue!),
                      ),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Fixed bottom footer with Book Now / Closed status.
class _VenueActionFooter extends StatelessWidget {
  final Venue? venue;
  final VoidCallback onBookTap;

  const _VenueActionFooter({required this.venue, required this.onBookTap});

  @override
  Widget build(BuildContext context) {
    final bool isOpenByClock = venue?.isOpenByClock ?? true;
    final bool isTempClosed = venue?.temporarilyClosed ?? false;
    final bool isInactive = venue?.status == 'INACTIVE';
    final bool isBlocked = isTempClosed || !isOpenByClock || isInactive;
    
    final l10n = AppLocalizations.of(context)!;
    String blockMsg = l10n.venueCurrentlyClosed;
    if (isTempClosed) {
      blockMsg = l10n.temporarilyClosed;
    } else if (isInactive) {
      blockMsg = l10n.venueFull;
    }

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).padding.bottom + 24,
      ),
      child: isBlocked
        ? Container(
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Center(
              child: Text(
                blockMsg,
                style: AppTypography.headlineMedium.copyWith(
                  color: AppColors.onSurfaceVariant,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          )
        : GestureDetector(
            onTap: onBookTap,
            child: Container(
              height: 64,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primary, AppColors.primaryContainer],
                ),
                borderRadius: BorderRadius.circular(100),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.calendar_today, color: Colors.white, size: 22),
                  const SizedBox(width: 12),
                  Text(
                    l10n.bookNow,
                    style: AppTypography.headlineMedium.copyWith(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }
}
