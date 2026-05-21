import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/models/layout_item_model.dart';
import '../../../../core/repositories/reservation_repository.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import 'reservation_screen.dart';
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

  StreamSubscription? _layoutSub;

  @override
  void initState() {
    super.initState();
    _fetchLayout();

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // slate-100
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: const Icon(Icons.arrow_back, color: Colors.black87, size: 20),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Masa Seçimi',
          style: AppTypography.headlineSmall.copyWith(
            fontWeight: FontWeight.w800,
            color: Colors.black87,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white.withValues(alpha: 0.8),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : Stack(
                  children: [
                    // The Map
                    Positioned.fill(
                      child: SafeArea(
                        bottom: false,
                        child: FloorPlanViewer(
                          items: _items,
                          selectedTableId: _selectedTableId,
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
                    
                    // Legend overlay (top)
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 60,
                      left: 16,
                      right: 16,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _buildLegendItem(const Color(0xFF10B981), 'Boş'),
                                const SizedBox(width: 16),
                                _buildLegendItem(const Color(0xFFF59E0B), 'Rezerv'),
                                const SizedBox(width: 16),
                                _buildLegendItem(const Color(0xFFEF4444), 'Dolu'),
                                const SizedBox(width: 16),
                                _buildLegendItem(const Color(0xFF94A3B8), 'Xarab'),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Floating Bottom Action Card
                    if (_selectedTable != null)
                      Positioned(
                        bottom: 32,
                        left: 24,
                        right: 24,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.15),
                                blurRadius: 24,
                                spreadRadius: 4,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.check_circle, color: AppColors.primary, size: 28),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Seçildi:',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey.shade500,
                                        ),
                                      ),
                                      Text(
                                        _selectedTable!.name,
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.black87,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                                    elevation: 0,
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
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.4),
                blurRadius: 4,
                spreadRadius: 1,
              )
            ],
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 13, 
            fontWeight: FontWeight.w700,
            color: Colors.grey.shade700,
          ),
        ),
      ],
    );
  }
}
