import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/venues_provider.dart';
import '../../../../core/models/venue_model.dart';
import '../../providers/favorites_provider.dart';
import '../../../search/presentation/screens/venue_detail_screen.dart';
import '../../../search/presentation/widgets/search_result_card.dart';
import '../../../search/presentation/widgets/search_result_skeleton.dart';
import '../../../../core/providers/location_provider.dart';

final _favoriteSearchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

/// The user's favorites collection screen – now using unified SearchResultCard design.
class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favState = ref.watch(favoritesProvider);
    final venuesState = ref.watch(venuesProvider);

    return Container(
      color: const Color(0xFFF9F9FE),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: SizedBox(
              height: MediaQuery.of(context).padding.top + 24,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Editorial Header
                const _HeaderSection(),
                const SizedBox(height: 48),

                // Dynamic Content
                _buildBody(context, ref, favState, venuesState),

                const SizedBox(height: 120), // Bottom padding for Nav Bar
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<Set<String>> favState,
    AsyncValue<List<Venue>> venuesState,
  ) {
    final l10n = AppLocalizations.of(context)!;

    // Loading state
    if (favState.isLoading || venuesState.isLoading) {
      return Column(
        children: List.generate(
          3,
          (index) => const Padding(
            padding: EdgeInsets.only(bottom: 24),
            child: SearchResultSkeleton(),
          ),
        ),
      );
    }

    // Error state
    if (favState.hasError) {
      return Padding(
        padding: const EdgeInsets.only(top: 80),
        child: Center(child: Text('${l10n.errorOccurred}: ${favState.error}')),
      );
    }

    final favoriteIds = favState.valueOrNull ?? {};
    final allVenues = venuesState.valueOrNull ?? [];
    final searchQuery = ref.watch(_favoriteSearchQueryProvider).toLowerCase();

    // Filter venues that are in favorites and match the search query
    final favoriteVenues = allVenues.where((venue) {
      if (!favoriteIds.contains(venue.id)) return false;
      if (searchQuery.isNotEmpty) {
        return (venue.name?.toLowerCase().contains(searchQuery) ?? false) ||
               (venue.category?.toLowerCase().contains(searchQuery) ?? false) ||
               (venue.location?.address?.toLowerCase().contains(searchQuery) ?? false);
      }
      return true;
    }).toList();

    // Empty state
    if (favoriteVenues.isEmpty) {
      return Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.favorite_border,
                size: 48,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              l10n.noFavoritesYet,
              style: AppTypography.headlineMedium.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.noFavoritesDescription,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    // Favorites list using SearchResultCard
    return Column(
      children: favoriteVenues.map((venue) {
        final heroUrl = venue.media?.heroImage?.url ?? '';
        final city = venue.location?.city ?? '';
        final address = venue.location?.address ?? '';
        final fullAddress = city.isNotEmpty && address.isNotEmpty
            ? '$city, $address'
            : city.isNotEmpty
                ? city
                : address;
        final basePrice = venue.pricing?.basePrice ?? 0;

        final isOpen = (venue.status == 'ACTIVE' || venue.status == 'PUBLISHED' || venue.status == 'INACTIVE') && 
                       !(venue.temporarilyClosed) && 
                       venue.isOpenByClock;
        
        const String distanceText = '';

        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: SearchResultCard(
            venueId: venue.id,
            imageUrl: heroUrl,
            title: venue.name ?? l10n.venue,
            subtitle: venue.category ?? l10n.gameRoom,
            address: fullAddress.isNotEmpty ? fullAddress : 'Bakı',
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
      }).toList(),
    );
  }
}

class _HeaderSection extends ConsumerStatefulWidget {
  const _HeaderSection();

  @override
  ConsumerState<_HeaderSection> createState() => _HeaderSectionState();
}

class _HeaderSectionState extends ConsumerState<_HeaderSection> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final query = ref.watch(_favoriteSearchQueryProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.favoritesTitle,
          style: AppTypography.headlineLarge.copyWith(
            fontSize: 56,
            fontWeight: FontWeight.w800,
            height: 1.1,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          l10n.favoritesSubtitle,
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (val) {
              ref.read(_favoriteSearchQueryProvider.notifier).state = val;
            },
            decoration: InputDecoration(
              prefixIcon: const Icon(
                Icons.search,
                color: AppColors.onSurfaceVariant,
              ),
              suffixIcon: query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: AppColors.onSurfaceVariant),
                      onPressed: () {
                        _searchController.clear();
                        ref.read(_favoriteSearchQueryProvider.notifier).state = '';
                      },
                    )
                  : null,
              hintText: l10n.searchInFavoritesHint,
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
      ],
    );
  }
}
