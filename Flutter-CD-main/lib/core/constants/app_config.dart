import 'dart:io';

/// Central environment / configuration for the app.
/// All API URLs are derived from a single [baseUrl] so you only
/// need to change ONE place when switching between dev ↔ production.
class AppConfig {
  AppConfig._();

  /// ── Production Server ──────────────────────────────────────────
  /// Change this value to point the entire app at a different backend.
  static final String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: Platform.isAndroid ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
  );

  /// Mapbox Secret Access Token
  static const String mapboxAccessToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
    defaultValue: '',
  );

  /// Google Sign-In server client ID (Web client from Firebase Console)
  static const String googleServerClientId =
      '618589870198-cei2u30rjjq1jlb6ast7aa875gqo70dq.apps.googleusercontent.com';

  /// Helper to format image URLs
  static String? formatImageUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    
    // Support legacy Cloudinary URLs
    if (url.startsWith('http')) {
      return url;
    }
    
    // Prepend base URL for local VPS uploads
    if (url.startsWith('/uploads')) {
      return '$baseUrl$url';
    }
    
    // Generic fallback for other relative paths
    if (url.startsWith('/')) {
      return '$baseUrl$url';
    }
    
    return url;
  }
}
