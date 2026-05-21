import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/reservation_model.dart';
import '../models/venue_model.dart';
import '../repositories/reservation_repository.dart';

/// Repository provider (singleton)
final reservationRepositoryProvider = Provider<ReservationRepository>((ref) {
  return ReservationRepository();
});

/// User's reservations — equivalent to RTK Query's useGetReservationsQuery
final myReservationsProvider =
    FutureProvider.family<List<Reservation>, String>((ref, userId) async {
  final repo = ref.read(reservationRepositoryProvider);
  return repo.getMyReservations(userId);
});

/// Discovered venues — unique venues from user's accepted reservations
final discoveredVenuesProvider =
    FutureProvider.family<List<Venue>, String>((ref, userId) async {
  final repo = ref.read(reservationRepositoryProvider);
  return repo.getDiscoveredVenues(userId);
});
