import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/reservation_provider.dart';
import '../../../../core/models/venue_model.dart';
import '../../../search/presentation/screens/venue_detail_screen.dart';
import '../../../search/presentation/widgets/search_result_card.dart';

/// Screen to display venues the user has "discovered" via accepted reservations.
class DiscoveredVenuesScreen extends ConsumerWidget {
  final String userId;

  const DiscoveredVenuesScreen({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final discoveredState = ref.watch(discoveredVenuesProvider(userId));

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.onSurface),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const _HeaderSection(),
                const SizedBox(height: 40),

                // Dynamic Content
                _buildBody(context, discoveredState),

                const SizedBox(height: 60),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, AsyncValue<List<Venue>> state) {
    final l10n = AppLocalizations.of(context)!;

    if (state.isLoading) {
      return const Padding(
        padding: EdgeInsets.only(top: 80),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (state.hasError) {
      return Padding(
        padding: const EdgeInsets.only(top: 80),
        child: Center(child: Text('${l10n.errorOccurred}: ${state.error}')),
      );
    }

    final venues = state.valueOrNull ?? [];

    if (venues.isEmpty) {
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
                Icons.explore_outlined,
                size: 48,
                color: AppColors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              l10n.noDiscoveredYet,
              style: AppTypography.headlineMedium.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 20,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              l10n.noDiscoveredDescription,
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: venues.map((venue) {
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
        
        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: SearchResultCard(
            venueId: venue.id,
            imageUrl: heroUrl,
            title: venue.name ?? l10n.venue,
            subtitle: venue.category ?? l10n.gameRoom,
            address: fullAddress.isNotEmpty ? fullAddress : 'Bakı',
            distance: '',
            price: '${basePrice.toStringAsFixed(0)} AZN',
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

class _HeaderSection extends StatelessWidget {
  const _HeaderSection();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.discoveredTitle,
          style: AppTypography.headlineLarge.copyWith(
            fontSize: 42,
            fontWeight: FontWeight.w800,
            height: 1.1,
            letterSpacing: -1.0,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          l10n.discoveredSubtitle,
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
