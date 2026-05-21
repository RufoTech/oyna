import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Key used to persist the selected locale in SharedPreferences.
const _kLocaleKey = 'app_locale';

/// Default locale for the app (Azerbaijani).
const _kDefaultLocale = Locale('az');

/// Supported locales in the app.
const supportedLocales = [
  Locale('az'),
  Locale('en'),
  Locale('ru'),
];

/// A mapping of locale codes to their display names (shown in the language picker).
const localeDisplayNames = {
  'az': 'Azərbaycan dili',
  'en': 'English',
  'ru': 'Русский',
};

/// Notifier that manages the current app locale and persists it.
class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(_kDefaultLocale) {
    _load();
  }

  /// Load the saved locale from SharedPreferences on startup.
  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_kLocaleKey);
    if (code != null && code.isNotEmpty) {
      state = Locale(code);
    }
  }

  /// Change the current locale and persist the choice.
  Future<void> setLocale(Locale locale) async {
    state = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLocaleKey, locale.languageCode);
  }
}

/// Global Riverpod provider for the selected locale.
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>(
  (ref) => LocaleNotifier(),
);
