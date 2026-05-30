import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/models/food_model.dart';
import '../../../../core/providers/foods_provider.dart';
import '../../../../core/constants/app_config.dart';
import 'package:cached_network_image/cached_network_image.dart';

final selectedFoodCategoryProvider = StateProvider<String>((ref) => 'Hamısı');

class VenueMenuScreen extends ConsumerWidget {
  final Venue? venue;
  const VenueMenuScreen({super.key, this.venue});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (venue == null || venue!.adminId.isEmpty) {
      return Scaffold(
        body: Center(child: Text(AppLocalizations.of(context)!.menuNotAvailable)),
      );
    }

    final foodsAsync = ref.watch(venueFoodsProvider(venue!.adminId));
    final selectedCategory = ref.watch(selectedFoodCategoryProvider);
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight + 16),
        child: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
            child: AppBar(
              backgroundColor: AppColors.background.withValues(alpha: 0.7),
              elevation: 0,
              centerTitle: false,
              leadingWidth: 64,
              leading: Center(
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.primary),
                  onPressed: () => Navigator.of(context).pop(),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.surfaceContainerLowest,
                    shape: const CircleBorder(),
                  ),
                ),
              ),
              title: Text(
                'Menyu',
                style: AppTypography.headlineMedium.copyWith(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              actions: const [],
            ),
          ),
        ),
      ),
      body: foodsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text(error.toString())),
        data: (foods) {
          final l10n = AppLocalizations.of(context)!;
          if (foods.isEmpty) {
            return Center(child: Text(l10n.emptyMenu));
          }

          // Extract unique categories
          final categories = [l10n.all, ...foods.map((e) => e.category).toSet().toList()];
          
          // Filter foods
          final filteredFoods = (selectedCategory == 'Hamısı' || selectedCategory == l10n.all) 
              ? foods 
              : foods.where((e) => e.category == selectedCategory).toList();

          return SingleChildScrollView(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + kToolbarHeight + 40,
              bottom: 40,
              left: 24,
              right: 24,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.menu,
                      style: AppTypography.headlineLarge.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 28,
                      ),
                    ),
                    Text(
                      l10n.itemsAvailable(filteredFoods.length),
                      style: AppTypography.labelSmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Categories
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final category = categories[index];
                      final isActive = category == selectedCategory;
                      return _CategoryChip(
                        label: category, 
                        isActive: isActive,
                        onTap: () {
                          ref.read(selectedFoodCategoryProvider.notifier).state = category;
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 32),
                
                // Foods List
                if (filteredFoods.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 40),
                    child: Center(
                      child: Text(
                        l10n.noProductsInCategory,
                        style: AppTypography.bodyMedium.copyWith(color: AppColors.onSurfaceVariant),
                      ),
                    ),
                  )
                else
                  ...filteredFoods.map((food) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _MenuItemCard(
                          imageUrl: food.image.isNotEmpty ? food.image : 'https://placehold.co/150x150/png?text=Food',
                          title: food.name,
                          description: food.description,
                          price: '${food.price.toStringAsFixed(2)} AZN',
                        ),
                      )),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MenuItemCard extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String description;
  final String price;

  const _MenuItemCard({
    required this.imageUrl,
    required this.title,
    required this.description,
    required this.price,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 30,
            offset: const Offset(0, 12),
          ),
        ],
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.2),
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(32),
        child: InkWell(
          onTap: () {},
          borderRadius: BorderRadius.circular(32),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 80,
                    height: 80,
                    color: AppColors.surfaceContainer,
                    child: CachedNetworkImage(
                      imageUrl: imageUrl.startsWith('http') ? imageUrl : (AppConfig.formatImageUrl(imageUrl) ?? ''),
                      fit: BoxFit.cover,
                      memCacheWidth: 240,
                      memCacheHeight: 240,
                      placeholder: (context, url) => Container(
                        color: AppColors.surfaceContainer,
                        child: const Center(
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => const Icon(Icons.coffee),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTypography.titleMedium.copyWith(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        price,
                        style: AppTypography.titleLarge.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback? onTap;

  const _CategoryChip({required this.label, required this.isActive, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      child: Material(
        color: isActive ? AppColors.primary : AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(100),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(100),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(100),
              border: Border.all(
                color: isActive ? Colors.transparent : AppColors.outlineVariant.withValues(alpha: 0.2),
              ),
            ),
            child: Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: isActive ? AppColors.onPrimary : AppColors.onSurfaceVariant,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
