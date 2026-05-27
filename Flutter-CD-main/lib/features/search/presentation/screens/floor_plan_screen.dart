import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/models/layout_item_model.dart';
import '../../../../core/repositories/reservation_repository.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_typography.dart';
import '../widgets/reservation/floor_plan_viewer.dart';

class FloorPlanScreen extends StatefulWidget {
  final Venue venue;

  const FloorPlanScreen({super.key, required this.venue});

  @override
  State<FloorPlanScreen> createState() => _FloorPlanScreenState();
}

class _FloorPlanScreenState extends State<FloorPlanScreen> {
  List<LayoutItem> _items = [];
  bool _isLoading = true;
  String? _error;
  String? _selectedTableId;
  LayoutItem? _selectedTable;

  final TransformationController _transformationController = TransformationController();
  StreamSubscription? _layoutSub;

  @override
  void initState() {
    super.initState();
    _fetchLayout();
    
    // Join venue socket room for live table updates
    SocketService().joinVenue(widget.venue.id);

    _layoutSub = SocketService().onLayoutUpdate.listen((data) {
      if (data['venueId'] == widget.venue.id) {
        if (mounted) {
          setState(() {
            final layout = data['layout'] as Map<String, dynamic>?;
            final itemsList = layout?['items'] as List<dynamic>? ?? [];
            _items = itemsList
                .map((json) => LayoutItem.fromJson(json as Map<String, dynamic>))
                .toList();

            // Deselect if selected table is no longer available
            if (_selectedTableId != null) {
              final updatedTable = _items.where((i) => i.id == _selectedTableId).firstOrNull;
              if (updatedTable == null || !updatedTable.isAvailable) {
                _selectedTableId = null;
                _selectedTable = null;
              } else {
                _selectedTable = updatedTable;
              }
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _layoutSub?.cancel();
    // Leave venue socket room
    SocketService().leaveVenue(widget.venue.id);
    _transformationController.dispose();
    super.dispose();
  }

  Future<void> _fetchLayout() async {
    try {
      final items = await ReservationRepository().getVenueLayout(widget.venue.id);
      if (mounted) {
        setState(() {
          _items = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Xəritə məlumatları yüklənmədi: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _zoomIn() {
    final matrix = _transformationController.value.clone();
    final double currentScale = matrix.getMaxScaleOnAxis();
    if (currentScale < 3.0) {
      setState(() {
        _transformationController.value = matrix * Matrix4.diagonal3Values(1.25, 1.25, 1.0);
      });
    }
  }

  void _zoomOut() {
    final matrix = _transformationController.value.clone();
    final double currentScale = matrix.getMaxScaleOnAxis();
    if (currentScale > 0.15) {
      setState(() {
        _transformationController.value = matrix * Matrix4.diagonal3Values(0.8, 0.8, 1.0);
      });
    }
  }

  void _resetZoom(double viewportWidth, double viewportHeight) {
    if (_items.isEmpty) return;

    double minX = double.infinity, minY = double.infinity;
    double maxX = -double.infinity, maxY = -double.infinity;

    for (var item in _items) {
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

    if (initialScale > 1.2) {
      initialScale = 1.2;
    }
    if (initialScale < 0.25) {
      initialScale = 0.25;
    }

    final dx = (viewportWidth - containerWidth * initialScale) / 2;
    final dy = (viewportHeight - containerHeight * initialScale) / 2;

    setState(() {
      _transformationController.value = Matrix4.translationValues(dx, dy, 0.0)
        * Matrix4.diagonal3Values(initialScale, initialScale, 1.0);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 1),
            ),
            child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Masa Seçimi',
          style: AppTypography.headlineSmall.copyWith(
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF090D16), Color(0xFF0F172A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF22D3EE),
                ),
              )
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.white70, fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final double viewportWidth = constraints.maxWidth;
                      final double viewportHeight = constraints.maxHeight;

                      return Stack(
                        children: [
                          // Interactive Map Viewer
                          Positioned.fill(
                            child: SafeArea(
                              bottom: false,
                              child: FloorPlanViewer(
                                items: _items,
                                selectedTableId: _selectedTableId,
                                transformationController: _transformationController,
                                onTableSelected: (item) {
                                  setState(() {
                                    if (_selectedTableId == item.id) {
                                      _selectedTableId = null;
                                      _selectedTable = null;
                                    } else {
                                      _selectedTableId = item.id;
                                      _selectedTable = item;
                                    }
                                  });
                                },
                              ),
                            ),
                          ),
                          
                          // Custom Glass Legend Overlay (Top)
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 60,
                            left: 16,
                            right: 16,
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A).withValues(alpha: 0.75),
                                  borderRadius: BorderRadius.circular(30),
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 1.2),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 20,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _buildLegendItem(const Color(0xFF10B981), 'Boş'),
                                      const SizedBox(width: 20),
                                      _buildLegendItem(const Color(0xFFF59E0B), 'Rezerv'),
                                      const SizedBox(width: 20),
                                      _buildLegendItem(const Color(0xFFEF4444), 'Dolu'),
                                      const SizedBox(width: 20),
                                      _buildLegendItem(const Color(0xFF64748B), 'Xarab'),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // Zoom floating controls (Right-aligned)
                          Positioned(
                            right: 20,
                            bottom: _selectedTable != null ? 144 : 40,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildZoomButton(Icons.add_rounded, _zoomIn),
                                const SizedBox(height: 10),
                                _buildZoomButton(Icons.remove_rounded, _zoomOut),
                                const SizedBox(height: 10),
                                _buildZoomButton(
                                  Icons.center_focus_strong_rounded,
                                  () => _resetZoom(viewportWidth, viewportHeight),
                                ),
                              ],
                            ),
                          ),

                          // Selected Table Float Panel (Bottom)
                          if (_selectedTable != null)
                            Positioned(
                              bottom: 32,
                              left: 20,
                              right: 20,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F172A).withValues(alpha: 0.92),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: const Color(0xFF22D3EE).withValues(alpha: 0.3),
                                    width: 1.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF06B6D4).withValues(alpha: 0.15),
                                      blurRadius: 24,
                                      spreadRadius: 2,
                                      offset: const Offset(0, -4),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                  child: Row(
                                    children: [
                                      // Status icon container
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF06B6D4).withValues(alpha: 0.12),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(0xFF06B6D4).withValues(alpha: 0.3),
                                            width: 1,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.check_circle_rounded,
                                          color: Color(0xFF22D3EE),
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      // Selected details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Text(
                                              'SEÇİLMİŞ MASA',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w700,
                                                color: Color(0xFF94A3B8),
                                                letterSpacing: 1.2,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              _selectedTable!.name,
                                              style: const TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.w900,
                                                color: Colors.white,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      // Continue CTA
                                      Container(
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(16),
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF06B6D4).withValues(alpha: 0.3),
                                              blurRadius: 10,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                            shadowColor: Colors.transparent,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 26,
                                              vertical: 14,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(16),
                                            ),
                                          ),
                                          onPressed: () {
                                            Navigator.pop(context, {
                                              'selectedTableId': _selectedTableId,
                                              'selectedTableName': _selectedTable?.name,
                                              'preSelectedTierId': _selectedTable?.tierId,
                                            });
                                          },
                                          child: const Text(
                                            'İrəli',
                                            style: TextStyle(
                                              fontSize: 16,
                                              color: Colors.white,
                                              fontWeight: FontWeight.w800,
                                              letterSpacing: 0.5,
                                            ),
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
                    },
                  ),
      ),
    );
  }

  Widget _buildZoomButton(IconData icon, VoidCallback onPressed) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A).withValues(alpha: 0.8),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withValues(alpha: 0.12), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: IconButton(
          icon: Icon(icon, color: Colors.white, size: 20),
          onPressed: onPressed,
          splashRadius: 20,
        ),
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.55),
                blurRadius: 6,
                spreadRadius: 1,
              )
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }
}
