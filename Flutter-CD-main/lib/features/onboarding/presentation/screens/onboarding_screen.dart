import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/constants/app_config.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/utils/rating_color_helper.dart';
import '../../../../shared/widgets/glass_panel.dart';
import '../../../auth/presentation/screens/login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isFirstLaunch', false);
    
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const LoginScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      );
    }
  }

  void _nextPage() {
    if (_currentPage < 2) {
      _pageController.animateToPage(
        _currentPage + 1,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _completeOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background soft Polish (Step 2 & 3 styles)
          Positioned(
            top: 0,
            right: 0,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.onSurface.withValues(alpha: 0.03),
                    Colors.transparent,
                  ],
                ),
              ),
              transform: Matrix4.translationValues(100, -100, 0),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.outlineVariant.withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                ),
              ),
              transform: Matrix4.translationValues(-100, 100, 0),
            ),
          ),

          // Main PageView
          PageView(
            controller: _pageController,
            physics: const ClampingScrollPhysics(),
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
              });
            },
            children: [
              OnboardingStepOne(padding: padding, size: size),
              OnboardingStepTwo(padding: padding, size: size),
              OnboardingStepThree(padding: padding, size: size),
            ],
          ),

          // Top App Bar (Skip)
          Positioned(
            top: padding.top,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _completeOnboarding,
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.primaryContainer,
                      textStyle: AppTypography.titleMedium.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    child: Text(AppLocalizations.of(context)!.skip),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Footer & CTA
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: GlassPanel(
              borderRadius: BorderRadius.zero,
              border: const Border(),
              backgroundOpacity: 0.7,
              blurSigma: 25,
              padding: EdgeInsets.fromLTRB(24, 24, 24, padding.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress Indicator
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (index) {
                      final isActive = index == _currentPage;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 5),
                        height: isActive ? 10 : 6,
                        width: isActive ? 10 : 6,
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.primary : AppColors.outlineVariant.withValues(alpha: 0.5),
                          shape: BoxShape.circle,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 32),
                  
                  // CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 64,
                    child: ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                        elevation: 0,
                      ).copyWith(
                        backgroundColor: WidgetStateProperty.all(Colors.transparent),
                        shadowColor: WidgetStateProperty.all(Colors.transparent),
                      ),
                      child: Ink(
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(100),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 30,
                              offset: const Offset(0, 15),
                              spreadRadius: -5,
                            ),
                          ],
                        ),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 64),
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _currentPage == 2 ? AppLocalizations.of(context)!.getStarted : AppLocalizations.of(context)!.next,
                                style: AppTypography.titleMedium.copyWith(
                                  color: AppColors.onPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (_currentPage < 2) ...[
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.arrow_forward,
                                  color: AppColors.onPrimary,
                                  size: 24,
                                ),
                              ]
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

}

class OnboardingStepOne extends StatelessWidget {
  final EdgeInsets padding;
  final Size size;

  const OnboardingStepOne({
    super.key,
    required this.padding,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: padding.top + 64),
        // Hero Section
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context)!.onboardingStep1Title,
                style: AppTypography.headlineLarge.copyWith(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                  color: AppColors.onSurface,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.onboardingStep1Subtitle,
                style: AppTypography.bodyLarge.copyWith(
                  color: AppColors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        // Map Visualization Area
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 200),
            child: Container(
              width: double.infinity,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.onSurface.withValues(alpha: 0.06),
                    blurRadius: 80,
                    offset: const Offset(0, 40),
                    spreadRadius: -20,
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Map Background Image
                  Positioned.fill(
                    child: CachedNetworkImage(
                      imageUrl: AppConfig.formatImageUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuCeldS9eWU0NoPgKOCXxA6gB5Hht8GHqxESqccv1q6fubSdi5dUQubwvcsPuCbjtijf7JuJmxPq45ZX-OAklSzZ21x8DnAJkFAddV84nxxxsqzYxlCcdkmAWVKYLyh9qFER0VZ3At4KnG_C_MHc7O74BAVlAIIzzkDimWmfgA-epQSd85CWphM2VzJ5D2N1dkiYKdqmzruGMV_xoNV9_Xo6ktds_A-BqGTXBpmjC1lEl_8YEE-caUPnCRkCBFQmTpTI7aNxG6cn2aA') ?? '',
                      fit: BoxFit.cover,
                      color: Colors.black.withValues(alpha: 0.1),
                      colorBlendMode: BlendMode.srcOver,
                    ),
                  ),
                  Positioned.fill(
                    child: Container(
                      color: AppColors.primary.withValues(alpha: 0.05),
                    ),
                  ),
                  // Pin 1: PS Lounge
                  Positioned(
                    top: size.height * 0.15,
                    left: size.width * 0.20,
                    child: const _CustomPin(
                      icon: Icons.sports_esports,
                      label: 'PS LOUNGE',
                      isPrimary: true,
                    ),
                  ),
                  // Pin 2: Net Club
                  Positioned(
                    top: size.height * 0.22,
                    right: size.width * 0.15,
                    child: const _CustomPin(
                      icon: Icons.computer,
                      label: 'NET CLUB',
                      isPrimary: false,
                    ),
                  ),
                  // Pin 3: Karaoke
                  Positioned(
                    bottom: size.height * 0.10,
                    left: size.width * 0.35,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2),
                        ],
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 4),
                      ),
                      child: const Icon(Icons.mic, color: Colors.white),
                    ),
                  ),
                  // Pulse Indicator
                  Positioned(
                    top: size.height * 0.08,
                    right: size.width * 0.25,
                    child: GlassPanel(
                      borderRadius: BorderRadius.circular(100),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      backgroundOpacity: 0.7,
                      blurSigma: 25,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _PulseDot(),
                          const SizedBox(width: 8),
                          Text(
                            AppLocalizations.of(context)!.liveEventNearby,
                            style: AppTypography.labelSmall.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.onSurface,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class OnboardingStepTwo extends StatelessWidget {
  final EdgeInsets padding;
  final Size size;

  const OnboardingStepTwo({
    super.key,
    required this.padding,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(height: padding.top + 64),
        // Editorial Header Section
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context)!.onboardingStep2Title,
                style: AppTypography.headlineLarge.copyWith(
                  fontSize: 56,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                  color: AppColors.onSurface,
                  letterSpacing: -1.5,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.onboardingStep2Subtitle,
                style: AppTypography.bodyLarge.copyWith(
                  color: AppColors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 48),
        // Dynamic Selection Canvas
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: SizedBox(
            height: 320,
            child: Stack(
              children: [
                // Featured Card 1
                Positioned(
                  top: 0,
                  left: 0,
                  right: 48,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 160,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            image: DecorationImage(
                              image: CachedNetworkImageProvider(
                                AppConfig.formatImageUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuAdIVnEX2lBXlveLISzp1GA-nNlR_HN9tl8Zy-MuxjvmWMyRuHEqHbHLko-t5EfKcrHjaNXUNLN9W1EgAdImR6bj-qyAxcrx-fxSvubxPxyQ6Q7kOYzczrK-b5OCLm-eZhACgHlTE9-SZ7LliO87xwQHBYvsC4fo3KnASCIgPMcFCfTh014d2ISOShjcLDATpHZbuz47wBienjycSsPnogdXsq49zUMNjbpEhOgqBE2GaBNKY-JDEivBfWxQJbwmvU85QDQqiT7FaA') ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdIVnEX2lBXlveLISzp1GA-nNlR_HN9tl8Zy-MuxjvmWMyRuHEqHbHLko-t5EfKcrHjaNXUNLN9W1EgAdImR6bj-qyAxcrx-fxSvubxPxyQ6Q7kOYzczrK-b5OCLm-eZhACgHlTE9-SZ7LliO87xwQHBYvsC4fo3KnASCIgPMcFCfTh014d2ISOShjcLDATpHZbuz47wBienjycSsPnogdXsq49zUMNjbpEhOgqBE2GaBNKY-JDEivBfWxQJbwmvU85QDQqiT7FaA',
                              ),
                              fit: BoxFit.cover,
                            ),
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                top: 12,
                                right: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: RatingColorHelper.getBackgroundColor(4.9),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.star, color: RatingColorHelper.getTextColor(4.9), size: 14),
                                      const SizedBox(width: 4),
                                      Text(
                                        '4.9',
                                        style: AppTypography.labelMedium.copyWith(
                                          fontWeight: FontWeight.w700,
                                          color: RatingColorHelper.getTextColor(4.9),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'The Velvet Lounge',
                          style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text('Speakeasy', style: AppTypography.bodySmall.copyWith(color: AppColors.onSurfaceVariant)),
                            const SizedBox(width: 8),
                            Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppColors.outlineVariant, shape: BoxShape.circle)),
                            const SizedBox(width: 8),
                            Text('\$\$\$', style: AppTypography.bodySmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w600)),
                          ],
                        )
                      ],
                    ),
                  ),
                ),
                // Accent Card 2
                Positioned(
                  top: 100,
                  right: 0,
                  left: 80,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 120,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            image: DecorationImage(
                              image: CachedNetworkImageProvider(
                                AppConfig.formatImageUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuDKodqcAFnntBgNPxxr96ktB16Otdw31Db24-omUbgjtUNqV4D0E3UGdr9o-YS9Upz8ag0WbX1xX9_UMYmjBbvSOCJne74Zig4lTFC5RhN4WP5z9bobTa-exe_pJOtanbokcFmrG8NopsQZ48L6gBMND1xbWWQJxF6_xAgZhmRBkjjnOd3IMDzZCSAi2Dlb1M_awJmOpCfjy2IZE5de4O-eN-U-U1DwhhTXFF5Hr3Kz7Z0xBjMJynVLkTBqf_JIlVQMyn30qxO4JVU') ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKodqcAFnntBgNPxxr96ktB16Otdw31Db24-omUbgjtUNqV4D0E3UGdr9o-YS9Upz8ag0WbX1xX9_UMYmjBbvSOCJne74Zig4lTFC5RhN4WP5z9bobTa-exe_pJOtanbokcFmrG8NopsQZ48L6gBMND1xbWWQJxF6_xAgZhmRBkjjnOd3IMDzZCSAi2Dlb1M_awJmOpCfjy2IZE5de4O-eN-U-U1DwhhTXFF5Hr3Kz7Z0xBjMJynVLkTBqf_JIlVQMyn30qxO4JVU',
                              ),
                              fit: BoxFit.cover,
                            ),
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                top: 12,
                                left: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryContainer,
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Text(
                                    AppLocalizations.of(context)!.trending,
                                    style: AppTypography.labelTiny.copyWith(
                                      color: AppColors.onPrimaryContainer,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Skyline Deck', style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                                Text('Live Jazz Tonight', style: AppTypography.bodySmall.copyWith(color: AppColors.onSurfaceVariant)),
                              ],
                            ),
                            Row(
                              children: [
                                const Icon(Icons.person, size: 16, color: AppColors.onSurfaceVariant),
                                const SizedBox(width: 4),
                                Text('124', style: AppTypography.labelMedium.copyWith(color: AppColors.onSurfaceVariant)),
                              ],
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                ),
                // Decorative mini badges
                Positioned(
                  top: 80,
                  left: -12,
                  child: GlassPanel(
                    borderRadius: BorderRadius.circular(100),
                    backgroundOpacity: 0.8,
                    padding: const EdgeInsets.all(12),
                    child: const Icon(Icons.local_bar, color: AppColors.primary, size: 20),
                  ),
                ),
                Positioned(
                  top: 140,
                  left: -12,
                  child: GlassPanel(
                    borderRadius: BorderRadius.circular(100),
                    backgroundOpacity: 0.8,
                    padding: const EdgeInsets.all(12),
                    child: const Icon(Icons.music_note, color: AppColors.primary, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class OnboardingStepThree extends StatelessWidget {
  final EdgeInsets padding;
  final Size size;

  const OnboardingStepThree({
    super.key,
    required this.padding,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Visual Composition Section
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: SizedBox(
            width: double.infinity,
            height: size.width - 48,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background visual map
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: CachedNetworkImage(
                     imageUrl: AppConfig.formatImageUrl('https://lh3.googleusercontent.com/aida-public/AB6AXuAfNtOik3TRY3Ut1lvyQ-VEHoVN4WxBYyQ7v1cyb2L0SBmS1eRjXfwQh1T2B5Gj-o7P-gNfHi15cLC3qPiyhgGz8iqHNpogE3hQ8OB0uwPBso4QcSWg1jJ9VMYwyTVpqaPbLy2n4qWUaPosRzk0VKgIZ-t_h9a10bi3pE_IcXVbEC-aghna8SSJQ9_B07VGhGS_KltI8CCFMPFRd7dDsN0HansNi0tMDFltSQcyjJG6LVvE3t-cAhgdgaqRDJdBJnCTvsD7Zu3Ip30') ?? '',
                     fit: BoxFit.cover,
                     color: Colors.white.withValues(alpha: 0.6),
                     colorBlendMode: BlendMode.lighten,
                  ),
                ),
                // Glassmorphism Confirm Card (Center)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: GlassPanel(
                    borderRadius: BorderRadius.circular(24),
                    backgroundOpacity: 0.7,
                    blurSigma: 25,
                    padding: const EdgeInsets.all(24),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.onSurface.withValues(alpha: 0.04),
                        blurRadius: 40,
                        offset: const Offset(0, 30),
                      ),
                    ],
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.2),
                                  blurRadius: 10,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.check_circle, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppLocalizations.of(context)!.reserved,
                                style: AppTypography.labelTiny.copyWith(
                                  color: AppColors.onSurfaceVariant,
                                  letterSpacing: 1,
                                ),
                              ),
                              Text(
                                'The Lucid Lounge',
                                style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
                              ),
                            ],
                          )
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(AppLocalizations.of(context)!.arrivalTimeLabel, style: AppTypography.bodySmall.copyWith(color: AppColors.onSurfaceVariant)),
                          Text(AppLocalizations.of(context)!.todayAt('14:30'), style: AppTypography.labelMedium.copyWith(fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(AppLocalizations.of(context)!.partySizeLabel, style: AppTypography.bodySmall.copyWith(color: AppColors.onSurfaceVariant)),
                          Text(AppLocalizations.of(context)!.numGuests('2'), style: AppTypography.labelMedium.copyWith(fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: AppColors.onPrimary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                          ),
                          icon: const Icon(Icons.directions),
                          label: Text(AppLocalizations.of(context)!.getDirections),
                        ),
                      )
                    ],
                  ),
                ),
                ), // Close Padding
                // Decorative Floating Pulse
                Positioned(
                  top: 16,
                  right: 16,
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.tertiary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: AppColors.primary.withValues(alpha: 0.5), blurRadius: 10),
                          ],
                        ),
                      ),
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
        const SizedBox(height: 48),
        // Content Section
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 48.0),
          child: Column(
            children: [
              Text(
                AppLocalizations.of(context)!.onboardingStep3Title,
                textAlign: TextAlign.center,
                style: AppTypography.headlineLarge.copyWith(
                  fontSize: 40,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                  color: AppColors.onSurface,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.onboardingStep3Subtitle,
                textAlign: TextAlign.center,
                style: AppTypography.bodyLarge.copyWith(
                  color: AppColors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 100), // padding for the bottom nav
            ],
          ),
        ),
      ],
    );
  }
}

class _CustomPin extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isPrimary;

  const _CustomPin({
    required this.icon,
    required this.label,
    required this.isPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isPrimary ? null : AppColors.surfaceContainerLowest,
            gradient: isPrimary ? AppColors.primaryGradient : null,
            shape: BoxShape.circle,
            boxShadow: const [
               BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2),
            ],
            border: Border.all(
              color: isPrimary ? Colors.white.withValues(alpha: 0.3) : AppColors.primary.withValues(alpha: 0.2),
              width: 4,
            ),
          ),
          child: Icon(icon, color: isPrimary ? Colors.white : AppColors.primary),
        ),
        const SizedBox(height: 8),
        GlassPanel(
          borderRadius: BorderRadius.circular(100),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          backgroundOpacity: 0.7,
          blurSigma: 25,
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 10,
              color: isPrimary ? AppColors.primary : AppColors.onSurface,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }
}

class _PulseDot extends StatefulWidget {
  @override
  State<_PulseDot> createState() => _PulseDotState();
}

extension BlurredWidget on Widget {
  Widget blurred({required double sigma}) {
    return ImageFilterWidget(sigma: sigma, child: this);
  }
}

class ImageFilterWidget extends StatelessWidget {
  final double sigma;
  final Widget child;

  const ImageFilterWidget({super.key, required this.sigma, required this.child});

  @override
  Widget build(BuildContext context) {
    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
      child: child,
    );
  }
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 8,
      height: 8,
      child: Stack(
        alignment: Alignment.center,
        children: [
          FadeTransition(
            opacity: Tween<double>(begin: 0.8, end: 0.0).animate(_controller),
            child: ScaleTransition(
              scale: Tween<double>(begin: 1.0, end: 2.5).animate(_controller),
              child: Container(
                decoration: const BoxDecoration(color: AppColors.tertiary, shape: BoxShape.circle),
              ),
            ),
          ),
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(color: AppColors.outline, shape: BoxShape.circle),
          ),
        ],
      ),
    );
  }
}
