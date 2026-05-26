import 'package:flutter/material.dart';
import '../../../../../core/models/layout_item_model.dart';

class FloorPlanViewer extends StatefulWidget {
  final List<LayoutItem> items;
  final String? selectedTableId;
  final ValueChanged<LayoutItem>? onTableSelected;
  final TransformationController transformationController;

  const FloorPlanViewer({
    super.key,
    required this.items,
    required this.transformationController,
    this.selectedTableId,
    this.onTableSelected,
  });

  @override
  State<FloorPlanViewer> createState() => _FloorPlanViewerState();
}

class _FloorPlanViewerState extends State<FloorPlanViewer> {
  bool _isInitialized = false;
  Size? _lastViewportSize;
  List<LayoutItem>? _lastItems;

  void _initializeZoomAndPosition(double viewportWidth, double viewportHeight) {
    if (widget.items.isEmpty) return;

    double minX = double.infinity, minY = double.infinity;
    double maxX = -double.infinity, maxY = -double.infinity;

    for (var item in widget.items) {
      if (item.x < minX) minX = item.x;
      if (item.y < minY) minY = item.y;
      if (item.x + item.w > maxX) maxX = item.x + item.w;
      if (item.y + item.h > maxY) maxY = item.y + item.h;
    }

    final layoutWidth = maxX - minX;
    final layoutHeight = maxY - minY;

    const double padding = 32.0;
    final containerWidth = layoutWidth + padding * 2;
    final containerHeight = layoutHeight + padding * 2;

    double scaleX = viewportWidth / containerWidth;
    double scaleY = viewportHeight / containerHeight;
    double initialScale = scaleX < scaleY ? scaleX : scaleY;

    // Constrain scale to avoid excessive scaling for small maps
    if (initialScale > 1.2) {
      initialScale = 1.2;
    }
    if (initialScale < 0.25) {
      initialScale = 0.25;
    }

    final dx = (viewportWidth - containerWidth * initialScale) / 2;
    final dy = (viewportHeight - containerHeight * initialScale) / 2;

    widget.transformationController.value = Matrix4.translationValues(dx, dy, 0.0)
      * Matrix4.diagonal3Values(initialScale, initialScale, 1.0);
    
    _isInitialized = true;
    _lastViewportSize = Size(viewportWidth, viewportHeight);
    _lastItems = widget.items;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return const Center(
        child: Text(
          'Mərtəbə planı tapılmadı.',
          style: TextStyle(color: Colors.grey, fontSize: 16),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final viewportSize = Size(constraints.maxWidth, constraints.maxHeight);
        
        // Auto-initialize zoom/position if size, items, or state changes
        if (!_isInitialized || 
            _lastViewportSize != viewportSize || 
            _lastItems != widget.items) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              setState(() {
                _initializeZoomAndPosition(constraints.maxWidth, constraints.maxHeight);
              });
            }
          });
        }

        // Bounding box calculations
        double minX = double.infinity, minY = double.infinity;
        double maxX = -double.infinity, maxY = -double.infinity;

        for (var item in widget.items) {
          if (item.x < minX) minX = item.x;
          if (item.y < minY) minY = item.y;
          if (item.x + item.w > maxX) maxX = item.x + item.w;
          if (item.y + item.h > maxY) maxY = item.y + item.h;
        }

        final layoutWidth = maxX - minX;
        final layoutHeight = maxY - minY;
        
        // Shift map content by padding so it sits beautifully within boundaries
        const double padding = 32.0;
        final containerWidth = layoutWidth + padding * 2;
        final containerHeight = layoutHeight + padding * 2;

        return InteractiveViewer(
          transformationController: widget.transformationController,
          minScale: 0.1,
          maxScale: 3.0,
          constrained: false,
          boundaryMargin: const EdgeInsets.all(400.0),
          child: Container(
            width: containerWidth,
            height: containerHeight,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A).withValues(alpha: 0.4), // dark-slate backdrop
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white.withValues(alpha: 0.05), width: 1.5),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: widget.items.map((item) {
                // Offset mapping relative to origin (minX, minY)
                final double leftPos = item.x - minX + padding;
                final double topPos = item.y - minY + padding;

                return Positioned(
                  left: leftPos,
                  top: topPos,
                  width: item.w,
                  height: item.h,
                  child: Align(
                    alignment: Alignment.center,
                    child: _buildLayoutItem(context, item),
                  ),
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }

  Widget _buildLayoutItem(BuildContext context, LayoutItem item) {
    final isSelected = item.id == widget.selectedTableId;
    
    Color statusColor;
    Color glowColor;
    IconData itemIcon;

    switch (item.status) {
      case 'available':
        statusColor = const Color(0xFF10B981); // Emerald
        glowColor = const Color(0xFF10B981).withValues(alpha: 0.35);
        break;
      case 'reserved':
        statusColor = const Color(0xFFF59E0B); // Amber
        glowColor = const Color(0xFFF59E0B).withValues(alpha: 0.25);
        break;
      case 'occupied':
        statusColor = const Color(0xFFEF4444); // Red
        glowColor = const Color(0xFFEF4444).withValues(alpha: 0.25);
        break;
      case 'disabled':
        statusColor = const Color(0xFF64748B); // Muted slate
        glowColor = Colors.transparent;
        break;
      default:
        statusColor = Colors.grey;
        glowColor = Colors.transparent;
    }

    if (isSelected) {
      statusColor = const Color(0xFF06B6D4); // Bright Cyan
      glowColor = const Color(0xFF06B6D4).withValues(alpha: 0.55);
    }

    switch (item.type) {
      case 'playstation':
        itemIcon = Icons.gamepad_rounded;
        break;
      case 'room':
        itemIcon = Icons.meeting_room_rounded;
        break;
      default:
        itemIcon = Icons.computer_rounded;
    }

    // Dynamic sizing to make tables look "smaller and normal"
    final double maxW = item.type == 'room' ? 90.0 : 54.0;
    final double maxH = item.type == 'room' ? 76.0 : 54.0;
    
    final double w = item.w < maxW ? item.w : maxW;
    final double h = item.h < maxH ? item.h : maxH;

    return GestureDetector(
      onTap: () {
        if (item.status == 'available' && widget.onTableSelected != null) {
          widget.onTableSelected!(item);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: w,
        height: h,
        curve: Curves.easeOutCubic,
        transform: Matrix4.diagonal3Values(isSelected ? 1.08 : 1.0, isSelected ? 1.08 : 1.0, 1.0),
        transformAlignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF0F172A).withValues(alpha: 0.95)
              : const Color(0xFF1E293B).withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(item.type == 'room' ? 14 : 10),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF22D3EE) // Bright Cyan Border
                : statusColor.withValues(alpha: 0.9),
            width: isSelected ? 2.5 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected ? const Color(0xFF06B6D4).withValues(alpha: 0.4) : glowColor,
              blurRadius: isSelected ? 12 : 6,
              spreadRadius: isSelected ? 1 : 0,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Status Icon
            Positioned(
              top: item.type == 'room' ? 10 : 8,
              child: Icon(
                itemIcon,
                color: isSelected ? const Color(0xFF22D3EE) : statusColor,
                size: item.type == 'room' ? 22 : 16,
              ),
            ),
            
            // Station Name Label
            Positioned(
              bottom: item.type == 'room' ? 10 : 6,
              left: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.name,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: item.type == 'room' ? 11 : 9,
                    letterSpacing: 0.2,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

