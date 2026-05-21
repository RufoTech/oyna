import 'dart:ui';
import 'package:flutter/material.dart';

/// A reusable frosted glass panel with configurable blur, opacity, and border.
class GlassPanel extends StatelessWidget {
  final Widget child;
  final double blurSigma;
  final Color? backgroundColor;
  final double backgroundOpacity;
  final BorderRadius? borderRadius;
  final BoxBorder? border;
  final List<BoxShadow>? boxShadow;
  final EdgeInsets? padding;

  const GlassPanel({
    super.key,
    required this.child,
    this.blurSigma = 25.0,
    this.backgroundColor,
    this.backgroundOpacity = 0.7,
    this.borderRadius,
    this.border,
    this.boxShadow,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? Colors.white;
    final radius = borderRadius ?? BorderRadius.circular(16);

    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: bg.withValues(alpha: backgroundOpacity),
            borderRadius: radius,
            border: border,
            boxShadow: boxShadow,
          ),
          child: child,
        ),
      ),
    );
  }
}
