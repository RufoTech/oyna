import '../models/reservation_model.dart';
import '../models/venue_model.dart';
import '../models/layout_item_model.dart';
import '../network/dio_client.dart';

/// Repository for reservation API calls to the NestJS backend.
class ReservationRepository {
  final _dio = DioClient().dio;

  /// POST /public/reservations — Create a new reservation
  Future<Reservation> createReservation(Map<String, dynamic> data) async {
    final response = await _dio.post('/public/reservations', data: data);
    return Reservation.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /public/reservations?userId=xxx&page=1&limit=10 — Get user's own reservations
  Future<List<Reservation>> getMyReservations(String userId, {int page = 1, int limit = 10}) async {
    final response =
        await _dio.get('/public/reservations', queryParameters: {'userId': userId, 'page': page, 'limit': limit});
    final list = response.data as List<dynamic>;
    return list
        .map((json) => Reservation.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// GET /public/reservations/discovered?userId=xxx — Get user's discovered venues
  Future<List<Venue>> getDiscoveredVenues(String userId) async {
    final response =
        await _dio.get('/public/reservations/discovered', queryParameters: {'userId': userId});
    final list = response.data as List<dynamic>;
    return list
        .map((json) => Venue.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// PATCH /public/reservations/:id/cancel — Cancel a reservation
  Future<Reservation> cancelReservation(String reservationId) async {
    final response = await _dio.patch('/public/reservations/$reservationId/cancel');
    return Reservation.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /public/venues/:id/layout — Get venue floor plan
  Future<List<LayoutItem>> getVenueLayout(String venueId) async {
    final response = await _dio.get('/public/venues/$venueId/layout');
    final data = response.data;
    final items = (data is Map ? data['items'] : null) as List<dynamic>? ?? [];
    return items
        .map((json) => LayoutItem.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// GET /public/venues/:id/available-tables — Available table counts by tier
  Future<Map<String, int>> getAvailableTableCounts(String venueId) async {
    final response = await _dio.get('/public/venues/$venueId/available-tables');
    final data = response.data as Map<String, dynamic>? ?? {};
    return data.map((key, value) => MapEntry(key, (value as num).toInt()));
  }
}
