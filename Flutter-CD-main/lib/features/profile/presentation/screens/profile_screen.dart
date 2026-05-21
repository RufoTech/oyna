import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../core/constants/app_config.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../auth/presentation/screens/login_screen.dart';
import 'edit_profile_screen.dart';
import 'my_reservations_screen.dart';
import 'discovered_venues_screen.dart';
import 'support_screen.dart';
import 'privacy_policy_screen.dart';
import '../../../favorites/providers/favorites_provider.dart';
import '../../../favorites/presentation/screens/favorites_screen.dart';
import '../../../../core/providers/reservation_provider.dart';

/// The user's profile screen based on the provided HTML design.
class ProfileScreen extends ConsumerStatefulWidget {
  final VoidCallback? onNavigateToFavorites;
  
  const ProfileScreen({super.key, this.onNavigateToFavorites});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _userData;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final data = await AuthService().getUserData();
    if (mounted) {
      setState(() => _userData = data);
    }
  }

  void _showLanguagePicker(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.read(localeProvider);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFFF9F9FE),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.fromLTRB(
            24, 16, 24, MediaQuery.of(ctx).padding.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle bar
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.outlineVariant,
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                l10n.selectLanguage,
                style: AppTypography.headlineLarge.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 24),
              ...supportedLocales.map((locale) {
                final isSelected = locale.languageCode == currentLocale.languageCode;
                final displayName = localeDisplayNames[locale.languageCode] ?? locale.languageCode;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        ref.read(localeProvider.notifier).setLocale(locale);
                        Navigator.of(ctx).pop();
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.06)
                              : AppColors.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(16),
                          border: isSelected
                              ? Border.all(color: AppColors.primary, width: 1.5)
                              : null,
                        ),
                        child: Row(
                          children: [
                            Text(
                              _flagForLocale(locale.languageCode),
                              style: const TextStyle(fontSize: 28),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                displayName,
                                style: AppTypography.bodyLarge.copyWith(
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? AppColors.primary : AppColors.onSurface,
                                ),
                              ),
                            ),
                            if (isSelected)
                              const Icon(
                                Icons.check_circle,
                                color: AppColors.primary,
                                size: 24,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  String _flagForLocale(String code) {
    switch (code) {
      case 'az':
        return '🇦🇿';
      case 'en':
        return '🇬🇧';
      case 'ru':
        return '🇷🇺';
      default:
        return '🌐';
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(localeProvider);
    final currentLanguageName = localeDisplayNames[currentLocale.languageCode] ?? currentLocale.languageCode;

    return Container(
      color: const Color(0xFFF9F9FE),
      child: Stack(
        children: [
          // Scrollable Content
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: SizedBox(
                  height: MediaQuery.of(context).padding.top + 24,
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Profile Hero Section
                    _ProfileHeroSection(
                      userData: _userData,
                      onProfileUpdated: _loadUser,
                    ),
                    const SizedBox(height: 40),
                    // Bento Stats Grid (Visual Interest)
                    if (_userData != null) 
                      _StatsGrid(
                        l10n: l10n, 
                        userId: _userData!['uid'] ?? _userData!['sub'] ?? '',
                        onNavigateToFavorites: widget.onNavigateToFavorites,
                      ),
                    const SizedBox(height: 40),

                    // Reservations Group
                    _SettingsGroup(
                      title: l10n.reservations,
                      children: [
                        _SettingsRow(
                          icon: Icons.calendar_month,
                          title: l10n.myReservations,
                          iconColor: AppColors.primary,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const MyReservationsScreen(),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Settings Group 1
                    _SettingsGroup(
                      title: l10n.preferences,
                      children: [
                        _SettingsRow(
                          icon: Icons.translate,
                          title: l10n.appLanguage,
                          iconColor: AppColors.primary,
                          trailingText: currentLanguageName,
                          onTap: () => _showLanguagePicker(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Settings Group 3
                    _SettingsGroup(
                      title: l10n.support,
                      children: [
                        _SettingsRow(
                          icon: Icons.help,
                          title: l10n.support,
                          iconColor: AppColors.primary,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const SupportScreen()),
                            );
                          },
                        ),
                        _SettingsRow(
                          icon: Icons.security,
                          title: l10n.privacyPolicyTitle,
                          iconColor: AppColors.primary,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const PrivacyPolicyScreen()),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Sign Out Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await AuthService().signOut();
                          if (context.mounted) {
                            Navigator.of(context).pushAndRemoveUntil(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                              (route) => false,
                            );
                          }
                        },
                        icon: const Icon(Icons.logout, size: 20),
                        label: Text(
                          l10n.logout,
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.onSurface,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.surfaceContainerLowest,
                          foregroundColor: AppColors.onSurface,
                          elevation: 0,
                          padding: const EdgeInsets.all(16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: AppColors.outlineVariant.withValues(alpha: 0.3),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Delete Account Button
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        onPressed: () {
                          _showDeleteAccountDialog(context);
                        },
                        icon: const Icon(Icons.delete_forever, size: 20, color: AppColors.error),
                        label: Text(
                          l10n.deleteAccount,
                          style: AppTypography.labelLarge.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: FutureBuilder<PackageInfo>(
                        future: PackageInfo.fromPlatform(),
                        builder: (context, snapshot) {
                          final version = snapshot.data?.version ?? '...';
                          final buildNumber = snapshot.data?.buildNumber ?? '...';
                          return Text(
                            'VERSION $version (BUILD $buildNumber)',
                            style: AppTypography.labelTiny.copyWith(
                              color: AppColors.outlineVariant,
                              letterSpacing: 2.0,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 120), // Bottom padding for Nav Bar
                  ]),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _DeleteAccountSheet(),
    );
  }
}

class _ProfileHeroSection extends StatelessWidget {
  final Map<String, dynamic>? userData;
  final VoidCallback? onProfileUpdated;
  const _ProfileHeroSection({this.userData, this.onProfileUpdated});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final String displayName = userData?['displayName'] ?? 'İstifadəçi';
    final String? photoUrl = userData?['photoURL'];
    final String email = userData?['email'] ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar with Badge
        SizedBox(
          width: 128,
          height: 128,
          child: Stack(
            children: [
              Container(
                width: 128,
                height: 128,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF0097D7), // Mavi
                      Color(0xFFE4181C), // Qırmızı
                      Color(0xFF00AE65), // Yaşıl
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.surfaceContainerLowest,
                      width: 4,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: photoUrl != null && photoUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: AppConfig.formatImageUrl(photoUrl) ?? '',
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            color: AppColors.surfaceContainerLow,
                            child: const Icon(Icons.person, size: 48, color: AppColors.outline),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: AppColors.surfaceContainerLow,
                            child: const Icon(Icons.person, size: 48, color: AppColors.outline),
                          ),
                        )
                      : Container(
                          color: AppColors.surfaceContainerLow,
                          child: const Icon(Icons.person, size: 48, color: AppColors.outline),
                        ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Name & Status
        Text(
          displayName,
          style: AppTypography.headlineLarge.copyWith(
            fontSize: 30,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          email,
          style: AppTypography.bodyMedium.copyWith(
            color: AppColors.onSurfaceVariant,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 24),
        // Edit Profile Button
        GestureDetector(
          onTap: () async {
            await Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const EditProfileScreen()),
            );
            if (onProfileUpdated != null) {
              onProfileUpdated!();
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, AppColors.primaryContainer],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(100),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Text(
              l10n.editProfile,
              style: AppTypography.labelMedium.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Delete Account Bottom Sheet with 10s countdown ───
class _DeleteAccountSheet extends StatefulWidget {
  const _DeleteAccountSheet();

  @override
  State<_DeleteAccountSheet> createState() => _DeleteAccountSheetState();
}

class _DeleteAccountSheetState extends State<_DeleteAccountSheet> {
  int _countdown = 10;
  Timer? _timer;
  bool _isDeleting = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() {
          _countdown--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _deleteAccount() async {
    setState(() {
      _isDeleting = true;
    });
    try {
      await FirebaseAuth.instance.currentUser?.delete();
      await AuthService().signOut();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${l10n.errorOccurred}: $e'),
            backgroundColor: AppColors.error,
          ),
        );
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final bool canDelete = _countdown == 0;

    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF9F9FE),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).padding.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.outlineVariant,
              borderRadius: BorderRadius.circular(100),
            ),
          ),
          const SizedBox(height: 24),

          // Warning Icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.warning_amber_rounded,
              color: AppColors.error,
              size: 32,
            ),
          ),
          const SizedBox(height: 20),

          // Title
          Text(
            l10n.deleteAccountConfirm,
            style: AppTypography.headlineLarge.copyWith(
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),

          // Description
          Text(
            l10n.deleteAccountWarning,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // Delete Button with Countdown
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: canDelete && !_isDeleting ? _deleteAccount : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: canDelete ? AppColors.error : AppColors.surfaceContainerHigh,
                foregroundColor: canDelete ? Colors.white : AppColors.outline,
                disabledBackgroundColor: AppColors.surfaceContainerHigh,
                disabledForegroundColor: AppColors.outline,
                elevation: 0,
                padding: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isDeleting
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      canDelete ? l10n.deleteAccount : '${l10n.deleteAccount} ($_countdown)',
                      style: AppTypography.labelLarge.copyWith(
                        color: canDelete ? Colors.white : AppColors.outline,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 12),

          // Cancel Button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.all(16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                l10n.cancel,
                style: AppTypography.labelLarge.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends ConsumerWidget {
  final AppLocalizations l10n;
  final String userId;
  final VoidCallback? onNavigateToFavorites;
  
  const _StatsGrid({required this.l10n, required this.userId, this.onNavigateToFavorites});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch favorites count
    final favoritesState = ref.watch(favoritesProvider);
    final int favoritesCount = favoritesState.valueOrNull?.length ?? 0;
    
    // Watch discovered venues count
    final discoveredState = ref.watch(discoveredVenuesProvider(userId));
    final int discoveredCount = discoveredState.valueOrNull?.length ?? 0;

    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () {
               if (onNavigateToFavorites != null) {
                 onNavigateToFavorites!();
               } else {
                 Navigator.push(
                   context, 
                   MaterialPageRoute(builder: (context) => const FavoritesScreen())
                 );
               }
            },
            child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.onSurface.withValues(alpha: 0.02),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.favorite, color: AppColors.tertiary, size: 24),
                const SizedBox(height: 8),
                Text(
                  '$favoritesCount',
                  style: AppTypography.headlineLarge.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  l10n.savedVenues,
                  style: AppTypography.labelTiny.copyWith(
                    color: AppColors.onSurfaceVariant,
                    letterSpacing: 2.0,
                  ),
                ),
              ],
            ),
          ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: GestureDetector(
            onTap: () {
               Navigator.push(
                 context, 
                 MaterialPageRoute(builder: (context) => DiscoveredVenuesScreen(userId: userId))
               );
            },
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.onSurface.withValues(alpha: 0.02),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.explore, color: AppColors.primary, size: 24),
                  const SizedBox(height: 8),
                  discoveredState.when(
                    data: (venues) => Text(
                      '${venues.length}',
                      style: AppTypography.headlineLarge.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    loading: () => const SizedBox(
                      height: 38,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    error: (_, __) => Text(
                      '0',
                      style: AppTypography.headlineLarge.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    l10n.discovered,
                    style: AppTypography.labelTiny.copyWith(
                      color: AppColors.onSurfaceVariant,
                      letterSpacing: 2.0,
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

class _SettingsGroup extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SettingsGroup({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            title.toUpperCase(),
            style: AppTypography.labelTiny.copyWith(
              color: AppColors.onSurfaceVariant.withValues(alpha: 0.6),
              fontWeight: FontWeight.w800,
              letterSpacing: 2.0,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(16),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (int i = 0; i < children.length; i++) ...[
                if (i > 0)
                  const Divider(height: 1, color: AppColors.surfaceContainerLow),
                children[i],
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color iconColor;
  final String? trailingText;
  final VoidCallback? onTap;

  const _SettingsRow({
    required this.icon,
    required this.title,
    required this.iconColor,
    this.trailingText,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap ?? () {},
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.05),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              if (trailingText != null) ...[
                Text(
                  trailingText!,
                  style: AppTypography.labelMedium.copyWith(
                    color: AppColors.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 4),
              ],
              const Icon(
                Icons.chevron_right,
                color: AppColors.outlineVariant,
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
