import 'package:dio/dio.dart';
import '../network/dio_client.dart';

class FavoritesService {
  final Dio _dio = DioClient().dio;

  Future<List<String>> getFavorites() async {
    try {
      final response = await _dio.get('/auth/favorites');
      if (response.statusCode == 200 && response.data != null) {
        return List<String>.from(response.data);
      }
      return [];
    } catch (e) {
      // Return empty list on failure, assuming unauthenticated or server error
      return [];
    }
  }

  Future<void> addFavorite(String venueId) async {
    try {
      await _dio.post('/auth/favorites/$venueId');
    } catch (e) {
      throw Exception('Failed to add favorite');
    }
  }

  Future<void> removeFavorite(String venueId) async {
    try {
      await _dio.delete('/auth/favorites/$venueId');
    } catch (e) {
      throw Exception('Failed to remove favorite');
    }
  }
}
