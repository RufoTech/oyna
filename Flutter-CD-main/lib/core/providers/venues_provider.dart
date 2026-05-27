import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../models/venue_model.dart';
import '../repositories/venue_repository.dart';
import 'location_provider.dart';

/// Repository provider (singleton)
final venueRepositoryProvider = Provider<VenueRepository>((ref) {
  return VenueRepository();
});

/// All active venues (Cached for Maps & Favorites — NO pagination)
final venuesProvider = FutureProvider<List<Venue>>((ref) async {
  final repo = ref.read(venueRepositoryProvider);
  return repo.fetchAllVenues();
});

/// Searched active venues for the Search Screen (legacy — kept for compatibility)
final searchedVenuesProvider = FutureProvider.family<List<Venue>, String>((ref, query) async {
  final repo = ref.read(venueRepositoryProvider);
  return repo.fetchAllVenues(searchQuery: query);
});

/// Single venue by ID — equivalent to RTK Query's useGetVenueByIdQuery(id)
final venueByIdProvider =
    FutureProvider.family<Venue, String>((ref, id) async {
  final repo = ref.read(venueRepositoryProvider);
  return repo.fetchVenueById(id);
});

/// Currently selected venue on the map (tapped marker)
final selectedVenueProvider = StateProvider<Venue?>((ref) => null);

// ═══════════════════════════════════════════════
// PAGINATED SEARCH — Infinite Scroll
// ═══════════════════════════════════════════════

/// State class for paginated search
class PaginatedSearchState {
  final List<Venue> venues;
  final int currentPage;
  final int total;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final String searchQuery;
  final String? sortBy;
  final String? filterBy;
  final String? error;

  const PaginatedSearchState({
    this.venues = const [],
    this.currentPage = 0,
    this.total = 0,
    this.hasMore = true,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.searchQuery = '',
    this.sortBy,
    this.filterBy,
    this.error,
  });

  PaginatedSearchState copyWith({
    List<Venue>? venues,
    int? currentPage,
    int? total,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    String? searchQuery,
    String? sortBy,
    String? filterBy,
    String? error,
  }) {
    return PaginatedSearchState(
      venues: venues ?? this.venues,
      currentPage: currentPage ?? this.currentPage,
      total: total ?? this.total,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      searchQuery: searchQuery ?? this.searchQuery,
      sortBy: sortBy ?? this.sortBy,
      filterBy: filterBy ?? this.filterBy,
      error: error,
    );
  }
}

/// Notifier that manages paginated venue fetching
class PaginatedSearchNotifier extends StateNotifier<PaginatedSearchState> {
  final VenueRepository _repo;
  final Ref _ref;
  static const int _pageSize = 10;

  PaginatedSearchNotifier(this._repo, this._ref) : super(const PaginatedSearchState()) {
    // Listen to userLocationProvider to update distances of current venues
    _ref.listen<LatLng?>(userLocationProvider, (previous, next) {
      if (next != null && state.venues.isNotEmpty) {
        final updated = state.venues.map((venue) {
          if (venue.location != null &&
              venue.location!.latitude != 0 &&
              venue.location!.longitude != 0) {
            final distance = Geolocator.distanceBetween(
              next.latitude,
              next.longitude,
              venue.location!.latitude,
              venue.location!.longitude,
            );
            return venue.copyWithDistance(distance);
          }
          return venue;
        }).toList();
        state = state.copyWith(venues: updated);
      }
    });

    // Load first page on creation
    loadFirstPage();
  }

  /// Load first page (initial load or after search/filter change)
  Future<void> loadFirstPage({
    String? query,
    String? sortBy,
    String? filterBy,
  }) async {
    final searchQuery = query ?? state.searchQuery;
    final currentSort = sortBy ?? state.sortBy;
    final currentFilter = filterBy ?? state.filterBy;
    
    state = state.copyWith(
      isLoading: true,
      searchQuery: searchQuery,
      sortBy: currentSort,
      filterBy: currentFilter,
      venues: [], // Clear existing venues on reset
    );

    try {
      // Get user location if sorting by distance
      double? lat;
      double? lng;
      if (currentSort == 'distance') {
        final location = _ref.read(userLocationProvider);
        if (location != null) {
          lat = location.latitude;
          lng = location.longitude;
        }
      }

      final response = await _repo.fetchVenuesPaginated(
        page: 1,
        limit: _pageSize,
        searchQuery: searchQuery.isNotEmpty ? searchQuery : null,
        sortBy: currentSort,
        filterBy: currentFilter,
        lat: lat,
        lng: lng,
      );

      final userLocation = _ref.read(userLocationProvider);
      final venuesWithDistance = response.data.map((venue) {
        if (userLocation != null &&
            venue.location != null &&
            venue.location!.latitude != 0 &&
            venue.location!.longitude != 0) {
          final distance = Geolocator.distanceBetween(
            userLocation.latitude,
            userLocation.longitude,
            venue.location!.latitude,
            venue.location!.longitude,
          );
          return venue.copyWithDistance(distance);
        }
        return venue;
      }).toList();

      state = state.copyWith(
        venues: venuesWithDistance,
        currentPage: 1,
        total: response.total,
        hasMore: response.hasMore,
        isLoading: false,
      );
    } catch (e) {
      debugPrint('PaginatedSearch error: $e');
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Load next page (triggered when user scrolls near bottom)
  Future<void> loadNextPage() async {
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return;

    state = state.copyWith(isLoadingMore: true);

    try {
      final nextPage = state.currentPage + 1;
      
      // Get user location if sorting by distance
      double? lat;
      double? lng;
      if (state.sortBy == 'distance') {
        final location = _ref.read(userLocationProvider);
        if (location != null) {
          lat = location.latitude;
          lng = location.longitude;
        }
      }

      final response = await _repo.fetchVenuesPaginated(
        page: nextPage,
        limit: _pageSize,
        searchQuery: state.searchQuery.isNotEmpty ? state.searchQuery : null,
        sortBy: state.sortBy,
        filterBy: state.filterBy,
        lat: lat,
        lng: lng,
      );

      final userLocation = _ref.read(userLocationProvider);
      final newVenuesWithDistance = response.data.map((venue) {
        if (userLocation != null &&
            venue.location != null &&
            venue.location!.latitude != 0 &&
            venue.location!.longitude != 0) {
          final distance = Geolocator.distanceBetween(
            userLocation.latitude,
            userLocation.longitude,
            venue.location!.latitude,
            venue.location!.longitude,
          );
          return venue.copyWithDistance(distance);
        }
        return venue;
      }).toList();

      state = state.copyWith(
        venues: [...state.venues, ...newVenuesWithDistance],
        currentPage: nextPage,
        total: response.total,
        hasMore: response.hasMore,
        isLoadingMore: false,
      );
    } catch (e) {
      debugPrint('PaginatedSearch loadMore error: $e');
      state = state.copyWith(isLoadingMore: false);
    }
  }

  /// Update search query — resets to page 1
  void search(String query) {
    loadFirstPage(query: query);
  }

  /// Update sort — resets to page 1
  void setSort(String? sortBy) {
    if (state.sortBy == sortBy) return;
    loadFirstPage(sortBy: sortBy);
  }

  /// Update filter — resets to page 1
  void setFilter(String? filterBy) {
    if (state.filterBy == filterBy) return;
    loadFirstPage(filterBy: filterBy);
  }

  /// Update specific venue status locally (for real-time socket updates)
  void updateVenueStatus(Map<String, dynamic> data) {
    final venueId = data['_id'];
    if (venueId == null) return;
    
    final int index = state.venues.indexWhere((v) => v.id == venueId);
    if (index != -1) {
      final venue = state.venues[index];
      final updatedVenue = venue.copyWithStatus(
        status: data['status'] as String?,
        temporarilyClosed: data['temporarilyClosed'] as bool?,
      );
      
      final updatedVenues = List<Venue>.from(state.venues);
      updatedVenues[index] = updatedVenue;
      
      state = state.copyWith(venues: updatedVenues);
    }
  }
}

/// Provider for paginated search
final paginatedSearchProvider =
    StateNotifierProvider.autoDispose<PaginatedSearchNotifier, PaginatedSearchState>((ref) {
  final repo = ref.read(venueRepositoryProvider);
  return PaginatedSearchNotifier(repo, ref);
});
