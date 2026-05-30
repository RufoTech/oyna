import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/food_model.dart';
import '../network/dio_client.dart';

/// Fetches foods for a specific venue by its adminId
final venueFoodsProvider = FutureProvider.autoDispose.family<List<Food>, String>((ref, adminId) async {
  if (adminId.isEmpty) return [];
  
  final dio = DioClient().dio;
  try {
    final response = await dio.get('/public/foods/$adminId');
    final list = response.data as List<dynamic>;
    return list.map((json) => Food.fromJson(json as Map<String, dynamic>)).toList();
  } catch (e) {
    throw Exception('Menyu yüklənərkən xəta baş verdi: $e');
  }
});
