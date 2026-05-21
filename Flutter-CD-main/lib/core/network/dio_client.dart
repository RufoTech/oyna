import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../constants/app_config.dart';
import '../services/auth_service.dart';

/// Global navigator key used for programmatic navigation (e.g. 401 redirect).
/// Must be attached to MaterialApp's navigatorKey.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Centralised Dio HTTP client for the NestJS backend.
class DioClient {
  static final DioClient _instance = DioClient._internal();
  factory DioClient() => _instance;

  late final Dio dio;

  DioClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Logging interceptor (only in debug mode)
    if (kDebugMode) {
      dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => debugPrint(obj.toString()),
      ));
    }

    // Authorization header interceptor
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await AuthService().getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized — token expired or invalid
        if (error.response?.statusCode == 401) {
          debugPrint('DioClient: 401 Unauthorized — clearing token and redirecting to login.');
          await AuthService().signOut();

          // Navigate to login screen using global navigator key
          final ctx = navigatorKey.currentContext;
          if (ctx != null) {
            // Lazy import to avoid circular dependency
            Navigator.of(ctx).pushNamedAndRemoveUntil('/login', (route) => false);
          }
        }
        return handler.next(error);
      },
    ));
  }
}
