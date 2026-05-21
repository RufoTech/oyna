import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/glass_panel.dart';

/// Bottom navigation bar with pill shape, glass effect, and animated sliding indicator.
class HomeBottomNavBar extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;

  const HomeBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
  });

  @override
  State<HomeBottomNavBar> createState() => _HomeBottomNavBarState();
}

class _HomeBottomNavBarState extends State<HomeBottomNavBar>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
  }

  @override
  void didUpdateWidget(HomeBottomNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onItemTapped(int index) {
    if (index == widget.selectedIndex) return;
    widget.onTabSelected(index);
  }

  /// Build localized nav items each time we build (so they update when locale changes).
  List<_NavItem> _buildItems(AppLocalizations l10n) {
    return [
      _NavItem(icon: Icons.map_outlined, filledIcon: Icons.map, label: l10n.navMap),
      _NavItem(icon: Icons.search, filledIcon: Icons.search, label: l10n.navSearch),
      _NavItem(icon: Icons.favorite_border, filledIcon: Icons.favorite, label: l10n.navFavorites),
      _NavItem(icon: Icons.person_outline, filledIcon: Icons.person, label: l10n.navProfile),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final items = _buildItems(l10n);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GlassPanel(
        borderRadius: BorderRadius.circular(100),
        backgroundColor: AppColors.surface,
        backgroundOpacity: 0.8,
        blurSigma: 30,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 32,
            spreadRadius: 2,
          ),
        ],
        child: SizedBox(
          height: 64,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final itemWidth = constraints.maxWidth / items.length;

              return Stack(
                alignment: Alignment.center,
                children: [
                  // ── Sliding active indicator ──
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeOutCubic,
                    left: itemWidth * widget.selectedIndex +
                        (itemWidth - 48) / 2,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOutCubic,
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Nav items ──
                  Row(
                    children: List.generate(items.length, (index) {
                      final item = items[index];
                      final isSelected = index == widget.selectedIndex;

                      return Expanded(
                        child: GestureDetector(
                          onTap: () => _onItemTapped(index),
                          behavior: HitTestBehavior.opaque,
                          child: SizedBox(
                            height: 64,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Icon with animated transitions
                                AnimatedSwitcher(
                                  duration:
                                      const Duration(milliseconds: 300),
                                  switchInCurve: Curves.easeOutBack,
                                  switchOutCurve: Curves.easeIn,
                                  transitionBuilder: (child, animation) {
                                    return ScaleTransition(
                                      scale: animation,
                                      child: FadeTransition(
                                        opacity: animation,
                                        child: child,
                                      ),
                                    );
                                  },
                                  child: Icon(
                                    isSelected
                                        ? item.filledIcon
                                        : item.icon,
                                    key: ValueKey<bool>(isSelected),
                                    size: 24,
                                    color: isSelected
                                        ? Colors.white
                                        : AppColors.outlineVariant,
                                  ),
                                ),
                                // Label with animated opacity
                                AnimatedSize(
                                  duration:
                                      const Duration(milliseconds: 250),
                                  curve: Curves.easeOutCubic,
                                  child: AnimatedOpacity(
                                    duration:
                                        const Duration(milliseconds: 200),
                                    opacity: isSelected ? 0.0 : 1.0,
                                    child: isSelected
                                        ? const SizedBox.shrink()
                                        : Padding(
                                            padding:
                                                const EdgeInsets.only(top: 2),
                                            child: Text(
                                              item.label.toUpperCase(),
                                              style: AppTypography.labelTiny
                                                  .copyWith(
                                                color:
                                                    AppColors.outline,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData filledIcon;
  final String label;

  const _NavItem({
    required this.icon,
    required this.filledIcon,
    required this.label,
  });
}
