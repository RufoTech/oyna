import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'notification_service.dart';
import '../network/dio_client.dart';
import 'auth_service.dart';

/// Top-level function required for background message handling.
/// Must be a top-level function (not a class method).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('FCM Background message: ${message.notification?.title}');
  // When app is terminated/background, Android system tray handles the notification
  // automatically for "notification" type messages.
}

/// Service that manages Firebase Cloud Messaging for push notifications.
class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// Initialize FCM: request permissions, get token, register listeners.
  Future<void> init() async {
    // Set background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request notification permissions (Android 13+ / iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('FCM permission status: ${settings.authorizationStatus}');

    // Get device FCM token and register it with the backend
    String? token;
    try {
      token = await _messaging.getToken();
      debugPrint('FCM Token: $token');
      if (token != null) {
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      debugPrint('Emulyatorda token almaq mümkün deyil: $e');
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) {
      debugPrint('FCM Token refreshed: $newToken');
      _registerTokenWithBackend(newToken);
    });

    // Handle foreground messages (app is open)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('FCM Foreground message: ${message.notification?.title}');
      // Show local notification when app is in foreground
      if (message.notification != null) {
        NotificationService().showNotification(
          id: message.hashCode,
          title: message.notification!.title ?? 'Bildiriş',
          body: message.notification!.body ?? '',
        );
      }
    });

    // Handle when user taps notification (app was in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('FCM Notification tapped: ${message.data}');
      // Could navigate to reservations screen here
    });
  }

  /// Send FCM token to backend so it can send push notifications to this device.
  Future<void> _registerTokenWithBackend(String fcmToken) async {
    try {
      final userData = await AuthService().getUserData();
      final userId = userData?['uid'] ?? userData?['sub'] ?? '';
      if (userId.isEmpty) return;

      await DioClient().dio.post('/public/reservations/register-token', data: {
        'userId': userId,
        'fcmToken': fcmToken,
      });
      debugPrint('FCM Token registered with backend');
    } catch (e) {
      debugPrint('FCM Token registration failed: $e');
    }
  }
}
