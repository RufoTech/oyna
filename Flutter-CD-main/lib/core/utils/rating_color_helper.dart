import 'package:flutter/material.dart';

class RatingColorHelper {
  /// Returns the color based on the rating value.
  /// 🔴 1.0 – 2.4
  /// 🟡 2.5 – 3.9
  /// 🟢 4.0 – 5.0
  static Color getColor(double rating) {
    if (rating >= 4.0) {
      return Colors.green; // 🟢
    } else if (rating >= 2.5) {
      return Colors.amber; // 🟡
    } else {
      return Colors.red; // 🔴
    }
  }

  /// Returns a background color suitable for the rating tag.
  static Color getBackgroundColor(double rating) {
    if (rating >= 4.0) {
      return Colors.green.withValues(alpha: 0.15);
    } else if (rating >= 2.5) {
      return Colors.amber.withValues(alpha: 0.15);
    } else {
      return Colors.red.withValues(alpha: 0.15);
    }
  }
  
  /// Returns text color suitable for the rating tag.
  static Color getTextColor(double rating) {
    if (rating >= 4.0) {
      return Colors.green.shade800; // 🟢
    } else if (rating >= 2.5) {
      return Colors.orange.shade800; // 🟡
    } else {
      return Colors.red.shade900; // 🔴
    }
  }
}
