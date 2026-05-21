import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/models/venue_model.dart';
import '../../../../core/constants/app_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'reservation_screen.dart';

class PcDetailsScreen extends StatelessWidget {
  final Tier? tier;
  final Venue? venue;
  const PcDetailsScreen({super.key, this.tier, this.venue});

  String _hardwareValue(List<String> keywords) {
    final hardware = tier?.hardware ?? const <HardwareItem>[];
    for (final item in hardware) {
      final haystack = [
        item.category,
        item.name,
        item.description,
      ].whereType<String>().join(' ').toLowerCase();
      if (keywords.any(haystack.contains)) {
        return item.name ?? item.description ?? 'N/A';
      }
    }
    return 'N/A';
  }

  String _accessoryTitle(AccessoryItem accessory) {
    if (accessory.name != null && accessory.name!.trim().isNotEmpty) return accessory.name!;
    if (accessory.category != null && accessory.category!.trim().isNotEmpty) return accessory.category!;
    return 'Aksesuar';
  }

  String _accessorySubtitle(AccessoryItem accessory) {
    if (accessory.description != null && accessory.description!.trim().isNotEmpty) return accessory.description!;
    if (accessory.category != null && accessory.category!.trim().isNotEmpty) return accessory.category!;
    return 'Professional Gaming';
  }

  IconData _getAccessoryIcon(AccessoryItem accessory) {
    final lower = [accessory.category, accessory.name, accessory.description]
        .whereType<String>()
        .join(' ')
        .toLowerCase();
        
    // Əvvəlcə mousepad / pad yoxlanmalıdır (çünki "mousepad" sözündə "mouse" da var, ardıcıllıq önəmlidir)
    if (lower.contains('mousepad') || lower.contains('pad') || lower.contains('mat') || lower.contains('xalça')) return Icons.rectangle_outlined;
    
    if (lower.contains('mouse') || lower.contains('siçan') || lower.contains('mice')) return Icons.mouse;
    if (lower.contains('keyboard') || lower.contains('klaviatura')) return Icons.keyboard;
    if (lower.contains('headphone') || lower.contains('qulaqlıq') || lower.contains('audio') || lower.contains('headset')) return Icons.headphones;
    if (lower.contains('monitor') || lower.contains('display') || lower.contains('ekran')) return Icons.monitor;
    if (lower.contains('chair') || lower.contains('stul') || lower.contains('oturacaq')) return Icons.chair_alt;
    return Icons.devices_other;
  }

  IconData _getFeatureIcon(String? iconString) {
    if (iconString == null) return Icons.star;
    final lower = iconString.toLowerCase();
    if (lower.contains('keyboard') || lower.contains('mouse') || lower.contains('perif')) return Icons.keyboard;
    if (lower.contains('speed') || lower.contains('fps')) return Icons.speed;
    if (lower.contains('chair') || lower.contains('ergonomic') || lower.contains('stul')) return Icons.chair_alt;
    if (lower.contains('headphones') || lower.contains('audio')) return Icons.headphones;
    if (lower.contains('monitor') || lower.contains('screen') || lower.contains('display')) return Icons.monitor;
    if (lower.contains('gamepad') || lower.contains('controller')) return Icons.sports_esports;
    if (lower.contains('vip')) return Icons.star;
    return Icons.check_circle_outline;
  }

  IconData _getHardwareIcon(String category) {
    final lower = category.toLowerCase();
    if (lower.contains('cpu') || lower.contains('prosessor') || lower.contains('processor')) return Icons.memory;
    if (lower.contains('gpu') || lower.contains('qrafik') || lower.contains('video') || lower.contains('graphics')) return Icons.developer_board;
    if (lower.contains('ram') || lower.contains('yaddaş') || lower.contains('memory')) return Icons.sd_storage;
    if (lower.contains('monitor') || lower.contains('display') || lower.contains('ekran')) return Icons.monitor;
    if (lower.contains('mouse') || lower.contains('siçan')) return Icons.mouse;
    if (lower.contains('keyboard') || lower.contains('klaviatura')) return Icons.keyboard;
    if (lower.contains('headphone') || lower.contains('qulaqlıq') || lower.contains('audio')) return Icons.headphones;
    return Icons.settings_input_component;
  }

  @override
  Widget build(BuildContext context) {
    if (tier == null) return const Scaffold(body: Center(child: Text('Tier data missing')));

    final isPC = tier!.type?.toLowerCase() == 'pc';
    final hasHardware = tier!.hardware.isNotEmpty;
    final showSpecsSection = isPC && hasHardware;

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
            child: AppBar(
              backgroundColor: AppColors.background.withValues(alpha: 0.7),
              elevation: 0,
              centerTitle: false,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                onPressed: () => Navigator.of(context).pop(),
              ),
              title: Text(
                '${tier!.title} Detalları',
                style: AppTypography.titleLarge.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.onSurface,
                ),
              ),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).padding.bottom + 100, // For bottom CTA
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Hero Section
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.45,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: AppConfig.formatImageUrl(tier!.heroImage) ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSMLVMFuuRGiFaBIHhh2q6imkBCHKr9izCCTSXsJCm-XyUlPJfmYrGjxTxmnkjLWx537lbl45Xv6uQAPmbXE-p2czIdfiqdyL0PQ7m7fd9n4aC8BYc-CwOrxwAx4FJJ3GwxOoWO9gwJ7LzvtLiD-_NkPmhaMQ1bo7g1xDAXNMVaL0vILUqfELdh9dMxsy4tdEPDs-YRIuH9-u_dMiYBO3rGXYQ8booDQqm1DVQLRJge3Xrfm5RRpmdpYVzAXDRVDfMVdef_FFVApE',
                        fit: BoxFit.cover,
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              AppColors.surface.withValues(alpha: 0.8),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.5],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Overlay Content
                Transform.translate(
                  offset: const Offset(0, -48),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Info Card
                        Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 40,
                                offset: const Offset(0, 15),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          tier!.title ?? 'Tier',
                                          style: AppTypography.headlineLarge.copyWith(
                                            fontSize: 32,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${tier!.price.toStringAsFixed(1)} AZN',
                                        style: AppTypography.headlineLarge.copyWith(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      Text(
                                        '/ saat',
                                        style: AppTypography.titleMedium.copyWith(
                                          color: AppColors.onSurfaceVariant,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              // Quick Tags (Önə Çıxan Xüsusiyyətlər)
                              if (tier!.features.isNotEmpty)
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: tier!.features.map((f) {
                                    return _QuickTag(
                                      icon: _getFeatureIcon(f.icon),
                                      title: f.text ?? 'Xüsusiyyət',
                                    );
                                  }).toList(),
                                )
                              else
                                Wrap(
                                  spacing: 12,
                                  runSpacing: 12,
                                  children: const [
                                    _QuickTag(icon: Icons.keyboard, title: 'Premium Periferiya'),
                                    _QuickTag(icon: Icons.speed, title: 'Yüksək FPS'),
                                    _QuickTag(icon: Icons.chair, title: 'Erqonomik Oturacaq'),
                                  ],
                                ),
                            ],
                          ),
                        ),
                        
                        // Condition checking if it is PC and has hardware
                        if (showSpecsSection) ...[
                          const SizedBox(height: 48),
                          
                          // Specs Grid Header
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Text(
                              'Təchizat Xüsusiyyətləri',
                              style: AppTypography.headlineMedium.copyWith(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          // Dynamic Grid
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            padding: EdgeInsets.zero,
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                              childAspectRatio: 0.82, // Tweak as needed for height of the card
                            ),
                            itemCount: tier!.hardware.length,
                            itemBuilder: (context, index) {
                              final item = tier!.hardware[index];
                              
                              // Cycle through 3 colors
                              final colorChoices = [AppColors.primary, AppColors.secondary, AppColors.tertiary];
                              final cardColor = colorChoices[index % colorChoices.length];
                              
                              return _SpecCard(
                                icon: _getHardwareIcon(item.category ?? ''),
                                iconColor: cardColor,
                                title: item.category ?? 'Təchizat',
                                value: item.name ?? 'N/A',
                                subtitle: item.description ?? '',
                              );
                            },
                          ),
                        ],
                        const SizedBox(height: 48),

                        if (tier!.accessories.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Text(
                              'Aksesuarlar',
                              style: AppTypography.headlineMedium.copyWith(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          ...tier!.accessories.map((acc) => Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.7),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.3)),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppColors.secondary.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Icon(_getAccessoryIcon(acc), color: AppColors.secondary, size: 28),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _accessoryTitle(acc),
                                            style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold, fontSize: 18),
                                          ),
                                          if (_accessorySubtitle(acc).isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              _accessorySubtitle(acc),
                                              style: AppTypography.labelSmall.copyWith(
                                                color: AppColors.onSurfaceVariant.withValues(alpha: 0.8),
                                              ),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ]
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              )),
                        ],

                        
                        const SizedBox(height: 64),
                        
                        // Additional Detail Bento
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLow,
                                ),
                                child: Stack(
                                  clipBehavior: Clip.hardEdge,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Unudulmaz Təcrübə',
                                          style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.bold, fontSize: 20),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'Sizə ən yaxşı oyun təcrübəsini yaşatmaq üçün hər bir xırdalığı düşündük. Peşəkar avadanlıqlar və rahat mühit sizi gözləyir.',
                                          style: AppTypography.bodyMedium.copyWith(
                                            color: AppColors.onSurfaceVariant,
                                            height: 1.625, // leading-relaxed
                                          ),
                                        ),
                                      ],
                                    ),
                                    Positioned(
                                      bottom: -24,
                                      right: -24,
                                      child: Transform.rotate(
                                        angle: 0.2, // ~12 degrees
                                        child: const Icon(
                                          Icons.sports_esports,
                                          size: 140,
                                          color: Color(0x08000000), // ~3% opacity
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            Container(
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.verified, color: AppColors.primary, size: 30),
                                  const SizedBox(height: 24),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Təmiz Texnologiya',
                                        style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.bold, fontSize: 20),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Hər seansdan sonra bütün avadanlıqlar dezinfeksiya olunur.',
                                        style: AppTypography.bodySmall.copyWith(
                                          color: AppColors.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Bottom Sticky CTA Container
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
                child: Container(
                  padding: EdgeInsets.only(
                    left: 24,
                    right: 24,
                    top: 24,
                    bottom: MediaQuery.of(context).padding.bottom + 24,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surface.withValues(alpha: 0.8),
                    border: Border(
                      top: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.2)),
                    ),
                  ),
                  child: GestureDetector(
                    onTap: () {
                      if (venue != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ReservationScreen(
                              venue: venue!,
                              initialTier: tier,
                            ),
                          ),
                        );
                      }
                    },
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.4),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'İndi Rezerv Et',
                        style: AppTypography.titleMedium.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickTag extends StatelessWidget {
  final IconData icon;
  final String title;

  const _QuickTag({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.tertiary, size: 18),
          const SizedBox(width: 8),
          Text(
            title,
            style: AppTypography.labelMedium.copyWith(
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;
  final String subtitle;

  const _SpecCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: AppTypography.labelTiny.copyWith(color: AppColors.onSurfaceVariant.withValues(alpha: 0.8)),
          ),
        ],
      ),
    );
  }
}
