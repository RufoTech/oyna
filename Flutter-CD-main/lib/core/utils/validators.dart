/// Centralized validation utilities to avoid duplicated logic across screens.
class Validators {
  Validators._(); // Prevent instantiation

  /// Standard email regex: requires at least 2-char TLD, supports modern long TLDs.
  static final RegExp emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$');

  /// Returns true if the given [email] matches a valid email format.
  static bool isValidEmail(String email) => emailRegex.hasMatch(email);
}
