import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../network/dio_client.dart';
import '../constants/app_config.dart';

class AuthService {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  static const String _tokenKey = 'auth_token';

  /// Secure storage for sensitive data (iOS Keychain / Android EncryptedSharedPreferences)
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  String? _cachedToken;
  bool _hasCheckedStorage = false;

  /// Exposes the real-time stream of the user authentication state.
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Currently logged in user.
  User? get currentUser => _auth.currentUser;

  /// Get stored JWT token (cached in memory to avoid disk I/O overhead)
  Future<String?> getToken() async {
    if (_hasCheckedStorage) return _cachedToken;
    final token = await _secureStorage.read(key: _tokenKey);
    _cachedToken = token;
    _hasCheckedStorage = true;
    return _cachedToken;
  }

  /// Sets and caches token
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
    _cachedToken = token;
    _hasCheckedStorage = true;
  }

  /// Decodes the JWT payload from a token string.
  /// Returns null if the token is malformed or decoding fails.
  Map<String, dynamic>? _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      return json.decode(decoded) as Map<String, dynamic>;
    } catch (e) {
      debugPrint("Error decoding JWT payload: $e");
      return null;
    }
  }

  /// Get decoded user payload from JWT token.
  /// Checks for token expiration and returns null if expired.
  Future<Map<String, dynamic>?> getUserData() async {
    final token = await getToken();
    if (token == null) return null;

    final data = _decodeJwtPayload(token);
    if (data == null) return null;

    // Check JWT expiration (G6 fix)
    if (data.containsKey('exp')) {
      final exp = data['exp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      if (now >= exp) {
        debugPrint("JWT token has expired.");
        await _clearToken();
        return null;
      }
    }

    return data;
  }

  /// Check if the current token is expired without clearing it
  Future<bool> isTokenExpired() async {
    final token = await getToken();
    if (token == null) return true;

    final data = _decodeJwtPayload(token);
    if (data == null) return true;

    if (data.containsKey('exp')) {
      final exp = data['exp'] as int;
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      return now >= exp;
    }
    return false; // No exp claim, assume not expired
  }

  /// Initialize Google Sign-In (call once at app startup).
  Future<void> initializeGoogleSignIn() async {
    try {
      await GoogleSignIn.instance.initialize(
        serverClientId: AppConfig.googleServerClientId,
      );
    } catch (e) {
      debugPrint("Google Sign-In initialization error: $e");
    }
  }

  /// Signs the user in using Google Authentication (v7.x API).
  Future<UserCredential?> signInWithGoogle() async {
    try {
      // 1. Trigger the Google Authentication Flow (v7.x uses authenticate())
      final GoogleSignInAccount? googleUser =
          await GoogleSignIn.instance.authenticate();

      // If the user aborts the sign in process, exit gracefully.
      if (googleUser == null) {
        return null; // Cancelled by user
      }

      // 2. Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      // 3. Create a new credential (v7.x: use idToken only for Firebase)
      final AuthCredential credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
      );

      // 4. Sign in to Firebase with the credential
      final userCred = await _auth.signInWithCredential(credential);
      
      if (userCred.user != null) {
        await syncUserWithBackend(userCred.user!);
      }

      return userCred;
    } catch (e) {
      debugPrint("Error during Google Sign In: $e");
      return null;
    }
  }

  /// Syncs the Firebase user with our NestJS/MongoDB backend.
  Future<void> syncUserWithBackend(User user) async {
    try {
      final idToken = await user.getIdToken();
      final response = await DioClient().dio.post('/auth/google', data: {
        'idToken': idToken,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = response.data['access_token'];
        if (token != null) {
          await saveToken(token);
          debugPrint("Backend sync successful, token stored securely.");
        }
      }
    } catch (e) {
      debugPrint("Error syncing user with backend: $e");
    }
  }

  /// Updates the user's profile on the backend and Firebase
  Future<bool> updateProfile({String? displayName}) async {
    try {
      // 1. Update Firebase Auth if available
      final user = FirebaseAuth.instance.currentUser;
      if (user != null && displayName != null) {
        await user.updateDisplayName(displayName);
      }

      // 2. Update Backend
      final token = await getToken();
      if (token == null) return false;
      
      final response = await DioClient().dio.patch('/auth/profile', 
        data: {
          if (displayName != null) 'displayName': displayName,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final newToken = response.data['access_token'];
        if (newToken != null) {
          await saveToken(newToken);
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint("Error updating profile in AuthService: $e");
      return false;
    }
  }

  /// Clears the token from secure storage and cache
  Future<void> _clearToken() async {
    await _secureStorage.delete(key: _tokenKey);
    _cachedToken = null;
    _hasCheckedStorage = true;
  }

  /// Signs the user out of both Firebase and Google.
  Future<void> signOut() async {
    try {
      await _clearToken();
    } catch (e) {
      debugPrint("Error removing token: $e");
    }

    try {
      await GoogleSignIn.instance.disconnect();
    } catch (e) {
      debugPrint("Error during Google Sign Out: $e");
    }

    try {
      await _auth.signOut();
    } catch (e) {
      debugPrint("Error during Firebase Sign Out: $e");
    }
  }
}
