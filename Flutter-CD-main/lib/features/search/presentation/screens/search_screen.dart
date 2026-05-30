import 'dart:async';
import 'package:flutter/material.dart';

import 'package:latlong2/latlong.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/location_provider.dart';
import '../widgets/search_result_card.dart';
import 'venue_detail_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart' hide Path;
import '../../../../core/providers/venues_provider.dart';
import '../widgets/search_result_skeleton.dart';

/// The search listing view with infinite scroll pagination.
class SearchScreen extends ConsumerStatefulWidget {
  final bool isActive;
  const SearchScreen({super.key, this.isActive = true});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> with AutomaticKeepAliveClientMixin {
  Timer? _debounce;
  Timer? _clockTimer;
  final ScrollController _scrollController = ScrollController();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    // Real-time saata görə (məs. 18:00-da açılır) vəziyyətlərin güncəllənməsi üçün taymer - optimized to 1 minute
    _clockTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted && widget.isActive) {
        setState(() {});
      }
    });
    // Fetch user location if not already available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentLocation = ref.read(userLocationProvider);
      if (currentLocation == null) {
        ref.read(locationServiceProvider).getCurrentLocation();
      }
    });
  }

  @override
  void didUpdateWidget(SearchScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      setState(() {});
    }
  }



  /// Formats a distance in meters to a human-readable string.
  String _formatDistance(double? meters) {
    if (meters == null) return '—';
    if (meters < 1000) {
      return '${meters.round()} m';
    }
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _clockTimer?.cancel();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Load more when user is 200px from the bottom
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(paginatedSearchProvider.notifier).loadNextPage();
    }
  }

  void _showSortBottomSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final searchState = ref.watch(paginatedSearchProvider);
    final notifier = ref.read(paginatedSearchProvider.notifier);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.sortTitle,
                  style: AppTypography.headlineSmall.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Sort Options
            _buildSortOption(
              context,
              title: l10n.sortAll,
              isSelected: searchState.sortBy == null || searchState.sortBy == 'all',
              onTap: () {
                notifier.setSort(null);
                Navigator.pop(context);
              },
            ),
            _buildSortOption(
              context,
              title: l10n.sortAlphabeticalAZ,
              isSelected: searchState.sortBy == 'alphabetical_asc',
              onTap: () {
                notifier.setSort('alphabetical_asc');
                Navigator.pop(context);
              },
            ),
            _buildSortOption(
              context,
              title: l10n.sortAlphabeticalZA,
              isSelected: searchState.sortBy == 'alphabetical_desc',
              onTap: () {
                notifier.setSort('alphabetical_desc');
                Navigator.pop(context);
              },
            ),
            _buildSortOption(
              context,
              title: l10n.sortClosest,
              isSelected: searchState.sortBy == 'distance',
              onTap: () async {
                // Ensure location is available
                final location = ref.read(userLocationProvider);
                if (location == null) {
                  await ref.read(locationServiceProvider).getCurrentLocation();
                }
                notifier.setSort('distance');
                if (context.mounted) Navigator.pop(context);
              },
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(color: AppColors.outlineVariant),
            ),

            // Filter Options
            SwitchListTile.adaptive(
              title: Text(
                l10n.filterOpenNow,
                style: AppTypography.bodyLarge.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.onSurface,
                ),
              ),
              value: searchState.filterBy == 'open_now',
              activeColor: AppColors.primary,
              onChanged: (val) {
                notifier.setFilter(val ? 'open_now' : null);
                Navigator.pop(context);
              },
              contentPadding: EdgeInsets.zero,
            ),
            
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSortOption(
    BuildContext context, {
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: AppTypography.bodyLarge.copyWith(
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.onSurface,
                ),
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final l10n = AppLocalizations.of(context)!;
    final searchState = ref.watch(paginatedSearchProvider);
    final userLocation = ref.watch(userLocationProvider);

    String sortText = l10n.sortAll;
    if (searchState.sortBy == 'alphabetical_asc') sortText = l10n.sortAlphabeticalAZ;
    if (searchState.sortBy == 'alphabetical_desc') sortText = l10n.sortAlphabeticalZA;
    if (searchState.sortBy == 'distance') sortText = l10n.sortClosest;

    return Container(
      color: const Color(0xFFF9F9F9),
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(
            child: SizedBox(height: MediaQuery.of(context).padding.top + 24),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _SearchHeaderSection(
                  resultCount: searchState.total,
                  sortLabel: sortText,
                  onSearchChanged: (val) {
                    if (_debounce?.isActive ?? false) _debounce!.cancel();
                    _debounce = Timer(const Duration(milliseconds: 500), () {
                      ref.read(paginatedSearchProvider.notifier).search(val);
                    });
                  },
                  onSortTap: () => _showSortBottomSheet(context),
                ),
                const SizedBox(height: 24),
              ]),
            ),
          ),
          // Content area
          _buildContent(context, l10n, searchState, userLocation),
          // Bottom padding
          const SliverToBoxAdapter(
            child: SizedBox(height: 120),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    AppLocalizations l10n,
    PaginatedSearchState searchState,
    LatLng? userLocation,
  ) {
    // Initial loading
    if (searchState.isLoading) {
      return SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => const Padding(
              padding: EdgeInsets.only(bottom: 24),
              child: SearchResultSkeleton(),
            ),
            childCount: 3, // Show 3 skeletons during initial load
          ),
        ),
      );
    }

    // Error state
    if (searchState.error != null && searchState.venues.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.only(top: 48),
          child: Center(child: Text('${l10n.errorOccurred}: ${searchState.error}')),
        ),
      );
    }

    // Empty state
    if (searchState.venues.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(top: 48),
            child: Text(l10n.noVenueFound),
          ),
        ),
      );
    }

    // Venue list + loading more indicator
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            // If we've reached the end, show a loading indicator
            if (index == searchState.venues.length) {
              if (searchState.isLoadingMore) {
                return const Padding(
                  padding: EdgeInsets.only(bottom: 24),
                  child: SearchResultSkeleton(),
                );
              }
              return const SizedBox.shrink();
            }

            final venue = searchState.venues[index];
            final heroUrl = venue.media?.heroImage?.url ?? '';
            final basePrice = venue.pricing?.basePrice ?? 0;
            final city = venue.location?.city ?? '';
            final address = venue.location?.address ?? '';
            final fullAddress = city.isNotEmpty && address.isNotEmpty
                ? '$city, $address'
                : city.isNotEmpty
                    ? city
                    : address;

            final isOpen = (venue.status == 'ACTIVE' ||
                    venue.status == 'PUBLISHED' ||
                    venue.status == 'INACTIVE') &&
                !(venue.temporarilyClosed) &&
                venue.isOpenByClock;

            final distanceText = _formatDistance(venue.distanceMeters);

            return Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: SearchResultCard(
                venueId: venue.id,
                imageUrl: heroUrl,
                title: venue.name ?? l10n.venue,
                subtitle: venue.category ?? l10n.gameRoom,
                address: fullAddress,
                price: '${basePrice.toStringAsFixed(0)} AZN',
                distance: distanceText,
                availabilityText: isOpen ? l10n.openNow : l10n.venueClosed,
                isOpenNow: isOpen,
                isTemporarilyClosed: venue.temporarilyClosed,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => VenueDetailScreen(venue: venue),
                    ),
                  );
                },
              ),
            );
          },
          // +1 for potential loading indicator at the bottom
          childCount: searchState.venues.length + (searchState.hasMore ? 1 : 0),
        ),
      ),
    );
  }
}

class _SearchHeaderSection extends StatelessWidget {
  final int resultCount;
  final String sortLabel;
  final ValueChanged<String>? onSearchChanged;
  final VoidCallback? onSortTap;

  const _SearchHeaderSection({
    this.resultCount = 0,
    required this.sortLabel,
    this.onSearchChanged,
    this.onSortTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.searchTitle,
          style: AppTypography.headlineLarge.copyWith(
            fontSize: 56,
            fontWeight: FontWeight.w800,
            height: 1.1,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 24),
        // Search & Sort field
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
          ),
          child: TextField(
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              prefixIcon: const Icon(
                Icons.search,
                color: AppColors.onSurfaceVariant,
              ),
              hintText: l10n.searchVenuesHint,
              hintStyle: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.onSurface,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Text(
                l10n.nearbyResults(resultCount),
                style: AppTypography.labelSmall.copyWith(
                  color: AppColors.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.5,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: GestureDetector(
                onTap: onSortTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.tune,
                        size: 14,
                        color: AppColors.onSurface,
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          sortLabel.toUpperCase(),
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.onSurface,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
