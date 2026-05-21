import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_options.dart';

import 'app.dart';
import 'core/services/auth_service.dart';

import 'core/services/notification_service.dart';
import 'core/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Initialize local notification system (must be after Firebase)
  await NotificationService().init();
  
  // Initialize Firebase Cloud Messaging for push notifications
  await FcmService().init();
  
  // Initialize Google Sign-In (required for v7.x)
  await AuthService().initializeGoogleSignIn();
  
  final prefs = await SharedPreferences.getInstance();
  final isFirstLaunch = prefs.getBool('isFirstLaunch') ?? true;

  runApp(
    ProviderScope(
      child: App(isFirstLaunch: isFirstLaunch),
    ),
  );
}
