import 'package:flutter/material.dart';
import '../../../../../core/models/layout_item_model.dart';
import '../../../../../core/theme/app_colors.dart';

class FloorPlanViewer extends StatelessWidget {
  final List<LayoutItem> items;
  final String? selectedTableId;
  final ValueChanged<LayoutItem>? onTableSelected;

  const FloorPlanViewer({
    super.key,
    required this.items,
    this.selectedTableId,
    this.onTableSelected,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(
        child: Text('Mərtəbə planı tapılmadı.',
            style: TextStyle(color: Colors.grey)),
      );
    }

    // Determine the bounding box of the layout to size the canvas
    double minX = double.infinity, minY = double.infinity;
    double maxX = 0, maxY = 0;

    for (var item in items) {
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      if (item.x + item.w > maxX) maxX = item.x + item.w;
      if (item.y + item.h > maxY) maxY = item.y + item.h;
    }

    // Add padding
    final width = maxX + 40;
    final height = maxY + 40;

    return Center(
      child: InteractiveViewer(
        minScale: 0.1,
        maxScale: 4.0,
        constrained: false,
        boundaryMargin: const EdgeInsets.all(double.infinity),
        child: Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC), // slate-50
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 24,
                spreadRadius: 4,
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: items.map((item) {
              return Positioned(
                left: item.x + 20,
                top: item.y + 20,
                width: item.w,
                height: item.h,
                child: _buildLayoutItem(context, item),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildLayoutItem(BuildContext context, LayoutItem item) {
    final isSelected = item.id == selectedTableId;
    
    List<Color> gradientColors;
    Color shadowColor;

    switch (item.status) {
      case 'available':
        gradientColors = [const Color(0xFF10B981), const Color(0xFF059669)];
        shadowColor = const Color(0xFF10B981);
        break;
      case 'reserved':
        gradientColors = [const Color(0xFFF59E0B), const Color(0xFFD97706)];
        shadowColor = const Color(0xFFF59E0B);
        break;
      case 'occupied':
        gradientColors = [const Color(0xFFEF4444), const Color(0xFFDC2626)];
        shadowColor = const Color(0xFFEF4444);
        break;
      case 'disabled':
        gradientColors = [const Color(0xFF94A3B8), const Color(0xFF64748B)];
        shadowColor = const Color(0xFF94A3B8);
        break;
      default:
        gradientColors = [Colors.grey.shade400, Colors.grey.shade600];
        shadowColor = Colors.grey;
    }

    if (isSelected) {
      gradientColors = [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)];
      shadowColor = AppColors.primary;
    }

    return GestureDetector(
      onTap: () {
        if (item.status == 'available' && onTableSelected != null) {
          onTableSelected!(item);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: shadowColor.withValues(alpha: isSelected ? 0.6 : 0.3),
              blurRadius: isSelected ? 16 : 8,
              spreadRadius: isSelected ? 2 : 0,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                item.type == 'playstation' ? Icons.gamepad_rounded : item.type == 'room' ? Icons.meeting_room_rounded : Icons.computer_rounded,
                color: Colors.white,
                size: item.w > 60 ? 24 : 16,
              ),
            ),
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                item.name,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: item.w > 60 ? 13 : 9,
                  letterSpacing: 0.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
