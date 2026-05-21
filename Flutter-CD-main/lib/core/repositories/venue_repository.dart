import '../models/venue_model.dart';
import '../network/dio_client.dart';

/// Paginated response wrapper
class PaginatedVenuesResponse {
  final List<Venue> data;
  final int total;
  final int page;
  final int limit;
  final bool hasMore;

  PaginatedVenuesResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.hasMore,
  });

  factory PaginatedVenuesResponse.fromJson(Map<String, dynamic> json) {
    return PaginatedVenuesResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => Venue.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      hasMore: json['hasMore'] as bool,
    );
  }
}

/// Repository that talks to the public NestJS endpoints.
/// Equivalent to RTK Query's venuesApi in the React admin panel.
class VenueRepository {
  final _dio = DioClient().dio;

  /// GET /public/venues — Fetch all ACTIVE venues (no pagination, for map/favorites)
  Future<List<Venue>> fetchAllVenues({String? searchQuery}) async {
    final Map<String, dynamic> queryParams = {};
    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      queryParams['search'] = searchQuery.trim();
    }

    final response = await _dio.get(
      '/public/venues',
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );
    
    final list = response.data as List<dynamic>;
    return list
        .map((json) => Venue.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  /// GET /public/venues?page=X&limit=Y — Paginated fetch for Search screen
  Future<PaginatedVenuesResponse> fetchVenuesPaginated({
    int page = 1,
    int limit = 10,
    String? searchQuery,
    String? sortBy,
    String? filterBy,
    double? lat,
    double? lng,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
    };
    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      queryParams['search'] = searchQuery.trim();
    }
    if (sortBy != null) queryParams['sortBy'] = sortBy;
    if (filterBy != null) queryParams['filterBy'] = filterBy;
    if (lat != null) queryParams['lat'] = lat;
    if (lng != null) queryParams['lng'] = lng;

    final response = await _dio.get(
      '/public/venues',
      queryParameters: queryParams,
    );

    return PaginatedVenuesResponse.fromJson(response.data as Map<String, dynamic>);
  }

  /// GET /public/venues/:id — Fetch a single venue by ID
  Future<Venue> fetchVenueById(String id) async {
    final response = await _dio.get('/public/venues/$id');
    return Venue.fromJson(response.data as Map<String, dynamic>);
  }
}
