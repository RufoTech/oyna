import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/providers/location_provider.dart';
import '../widgets/map_background.dart';
import '../widgets/search_bar_section.dart';

import '../widgets/venue_card.dart';
import '../widgets/location_fab.dart';
import '../../../search/presentation/screens/venue_detail_screen.dart';

/// Main discovery view with map background, search, and venue card.
/// Manages the drag-to-reveal VenueDetailScreen overlay.
class HomeScreen extends ConsumerStatefulWidget {
  final VoidCallback onSearchTap;
  final bool isActive;
  final ValueChanged<bool>? onDetailOverlayChanged;

  const HomeScreen({
    super.key,
    required this.onSearchTap,
    this.isActive = true,
    this.onDetailOverlayChanged,
  });

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  bool _isVenueCardVisible = false;
  Venue? _selectedVenue;

  // Drag-to-reveal state
  double _dragOffset = 0.0; // Accumulated upward drag in pixels
  bool _isDragging = false;
  bool _isDetailFullyOpen = false;

  late AnimationController _snapController;
  late Animation<double> _snapAnimation;

  late final MapController _mapController;
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _snapController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _snapAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _snapController, curve: Curves.easeOutCubic),
    );
    _snapController.addListener(() {
      setState(() {
        _dragOffset = _snapAnimation.value;
      });
    });
    _snapController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        if (_dragOffset >= _screenHeight) {
          setState(() {
            _isDetailFullyOpen = true;
          });
          widget.onDetailOverlayChanged?.call(true);
        } else if (_dragOffset <= 0) {
          widget.onDetailOverlayChanged?.call(false);
        }
      }
    });

    // Auto-center on user location when map opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _centerOnUser();
    });
  }

  @override
  void dispose() {
    _mapController.dispose();
    _snapController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isActive && !widget.isActive) {
      _hideVenueCard();
    }
  }

  double get _screenHeight =>
      MediaQuery.sizeOf(context).height;

  /// Progress from 0.0 (closed) to 1.0 (fully open)
  double get _revealProgress =>
      (_dragOffset / _screenHeight).clamp(0.0, 1.0);

  void _showVenueCard([Venue? venue]) {
    setState(() {
      _isVenueCardVisible = true;
      if (venue != null) _selectedVenue = venue;
    });
  }

  void _hideVenueCard() {
    if (_isVenueCardVisible || _isDetailFullyOpen) {
      setState(() {
        _isVenueCardVisible = false;
        _dragOffset = 0;
        _isDragging = false;
        _isDetailFullyOpen = false;
      });
    }
  }

  Future<void> _centerOnUser() async {
    setState(() {
      _isLocating = true;
    });

    final locationService = ref.read(locationServiceProvider);
    final location = await locationService.getCurrentLocation();

    if (mounted) {
      if (location != null) {
        _mapController.move(location, 16.0);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Məkanı tapmaq mümkün olmadı və ya icazə verilmədi')),
        );
      }
      setState(() {
        _isLocating = false;
      });
    }
  }

  void _onCardDragUpdate(DragUpdateDetails details) {
    if (_isDetailFullyOpen) return;
    if (!_isDragging) {
      widget.onDetailOverlayChanged?.call(true);
    }
    setState(() {
      _isDragging = true;
      // Subtract because dragging up = negative delta
      _dragOffset = (_dragOffset - (details.primaryDelta ?? 0))
          .clamp(0.0, _screenHeight);
    });
  }

  void _onCardDragEnd(DragEndDetails details) {
    if (_isDetailFullyOpen) return;
    _isDragging = false;

    final threshold = _screenHeight * 0.3; // 30% of screen = commit
    final velocity = details.primaryVelocity ?? 0;

    if (_dragOffset >= threshold || velocity < -500) {
      // Snap to fully open
      _snapAnimation = Tween<double>(
        begin: _dragOffset,
        end: _screenHeight,
      ).animate(
        CurvedAnimation(parent: _snapController, curve: Curves.easeOutCubic),
      );
      _snapController.forward(from: 0);
    } else {
      // Snap back to closed
      _snapAnimation = Tween<double>(
        begin: _dragOffset,
        end: 0,
      ).animate(
        CurvedAnimation(parent: _snapController, curve: Curves.easeOutCubic),
      );
      _snapController.forward(from: 0);
    }
  }

  void _openDetailDirectly() {
    widget.onDetailOverlayChanged?.call(true);
    _snapAnimation = Tween<double>(
      begin: _dragOffset,
      end: _screenHeight,
    ).animate(
      CurvedAnimation(parent: _snapController, curve: Curves.easeOutCubic),
    );
    _snapController.forward(from: 0);
  }

  void _closeDetailOverlay() {
    _snapAnimation = Tween<double>(
      begin: _screenHeight,
      end: 0,
    ).animate(
      CurvedAnimation(parent: _snapController, curve: Curves.easeOutCubic),
    );
    _snapController.forward(from: 0).then((_) {
      if (mounted) {
        setState(() {
          _isDetailFullyOpen = false;
          _dragOffset = 0;
        });
        widget.onDetailOverlayChanged?.call(false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    final bottomPadding = MediaQuery.paddingOf(context).bottom;
    final showOverlay = _dragOffset > 0 || _isDetailFullyOpen;

    return GestureDetector(
      onTap: _hideVenueCard,
      behavior: HitTestBehavior.translucent,
      child: Stack(
        children: [
          // ── Layer 0: Interactive Map with Markers ──
          Positioned.fill(
            child: RepaintBoundary(
              child: MapBackground(
                mapController: _mapController,
                onMarkerTap: (venue) => _showVenueCard(venue),
                onMapTap: _hideVenueCard,
              ),
            ),
          ),

          // ── Layer 1: Top Search Bar and Filters ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.only(
                    top: topPadding + 16,
                    left: 24,
                    right: 24,
                  ),
                  child: SearchBarSection(onTap: widget.onSearchTap),
                ),
              ],
            ),
          ),

          // ── Layer 2: Location FAB (moves with card) ──
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutCubic,
            bottom: showOverlay 
                ? -100 // Hide when detail is open
                : (_isVenueCardVisible 
                    ? (bottomPadding + 320).toDouble() 
                    : (bottomPadding + 100).toDouble()),
            right: 24,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 300),
              opacity: showOverlay ? 0.0 : 1.0,
              child: LocationFab(
                isLoading: _isLocating,
                onTap: _centerOnUser,
              ),
            ),
          ),

          // ── Layer 3: Venue Card (animated entrance) ──
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeOutCubic,
            bottom: _isVenueCardVisible && !_isDetailFullyOpen
                ? (bottomPadding + 100).toDouble()
                : -200.0,
            left: 24,
            right: 24,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 300),
              opacity: _isVenueCardVisible && !_isDetailFullyOpen ? 1.0 : 0.0,
              child: VenueCard(
                venue: _selectedVenue,
                onDragUpdate: _onCardDragUpdate,
                onDragEnd: _onCardDragEnd,
                onBookTap: _openDetailDirectly,
              ),
            ),
          ),

          // ── Layer 4: VenueDetail Overlay (slides up pixel-by-pixel) ──
          if (showOverlay)
            Positioned(
              left: 0,
              right: 0,
              top: _screenHeight - _dragOffset, // Slides up as drag increases
              height: _screenHeight,
              child: _isDetailFullyOpen
                  ? VenueDetailScreen(venue: _selectedVenue, onBackTap: _closeDetailOverlay)
                  : IgnorePointer(child: VenueDetailScreen(venue: _selectedVenue, onBackTap: _closeDetailOverlay)),
            ),

          // ── Scrim (darkens map as detail reveals) ──
          if (showOverlay && !_isDetailFullyOpen)
            Positioned.fill(
              child: IgnorePointer(
                child: Container(
                  color: Colors.black.withValues(alpha: _revealProgress * 0.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}


