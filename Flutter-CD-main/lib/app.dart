import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/app_localizations.dart';

import 'core/theme/app_theme.dart';
import 'core/services/auth_service.dart';
import 'core/providers/locale_provider.dart';
import 'core/network/dio_client.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/onboarding/presentation/screens/onboarding_screen.dart';
import 'features/home/presentation/screens/main_screen.dart';

/// Root application widget.
class App extends ConsumerWidget {
  final bool isFirstLaunch;

  const App({
    super.key,
    required this.isFirstLaunch,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);

    return MaterialApp(
      title: 'Lucid Entertainment',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      navigatorKey: navigatorKey,

      // ── Named routes for programmatic navigation (e.g. 401 redirect) ──
      routes: {
        '/login': (context) => const LoginScreen(),
      },

      // ── Localization ──
      locale: locale,
      supportedLocales: supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      home: FutureBuilder<bool>(
        future: _isUserLoggedIn(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          // If logged in via either Firebase or JWT Token
          if (snapshot.data == true) {
            return const MainScreen();
          }

          // Otherwise show Onboarding or Login
          return isFirstLaunch ? const OnboardingScreen() : const LoginScreen();
        },
      ),
    );
  }

  Future<bool> _isUserLoggedIn() async {
    // 1. Check JWT token
    final token = await AuthService().getToken();
    if (token != null && token.isNotEmpty) return true;

    // 2. Check Firebase User
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) return true;

    return false;
  }
}

