import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/providers/venues_provider.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/providers/location_provider.dart';
import '../../../../core/constants/app_config.dart';
import '../../../../shared/widgets/glass_panel.dart';

/// Full-screen interactive OpenStreetMap with dynamic venue markers from backend.
class MapBackground extends ConsumerStatefulWidget {
  final MapController mapController;
  final void Function(Venue venue)? onMarkerTap;
  final VoidCallback? onMapTap;

  const MapBackground({
    super.key,
    required this.mapController,
    this.onMarkerTap,
    this.onMapTap,
  });

  @override
  ConsumerState<MapBackground> createState() => _MapBackgroundState();

  /// Baku, Azerbaijan – default center
  static const defaultCenter = LatLng(40.4093, 49.8671);
  static const defaultZoom = 14.0;
}

class _MapBackgroundState extends ConsumerState<MapBackground> {
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final venuesAsync = ref.watch(venuesProvider);
    final userLocation = ref.watch(userLocationProvider);

    return Stack(
      children: [
        // Interactive Map
        Positioned.fill(
          child: FlutterMap(
            mapController: widget.mapController,
            options: MapOptions(
              initialCenter: MapBackground.defaultCenter,
              initialZoom: MapBackground.defaultZoom,
              minZoom: 4,
              maxZoom: 18,
              onTap: (_, __) => widget.onMapTap?.call(),
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
              backgroundColor: AppColors.surfaceContainerLow,
            ),
            children: [
              // Mapbox Tile Layer
              TileLayer(
                urlTemplate: 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${AppConfig.mapboxAccessToken}',
                userAgentPackageName: 'com.example.flutter_cd',
                maxZoom: 18,
              ),

              // Dynamic Venue Markers with Clustering
              MarkerClusterLayerWidget(
                options: MarkerClusterLayerOptions(
                  maxClusterRadius: 150,
                  size: const Size(48, 48),
                  alignment: Alignment.center,
                  padding: const EdgeInsets.all(50),
                  maxZoom: 18,
                  markers: venuesAsync.when(
                    data: (venues) => _buildMarkersFromVenues(venues),
                    loading: () => <Marker>[],
                    error: (error, stackTrace) {
                      debugPrint('Error loading venues: $error');
                      return <Marker>[];
                    },
                  ),
                  builder: (context, markers) {
                    return _ClusterMarker(count: markers.length);
                  },
                ),
              ),

              // User Location Pin (separate, never clustered)
              if (userLocation != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: userLocation,
                      width: 50,
                      height: 50,
                      child: const _UserLocationPin(),
                    ),
                  ],
                ),
            ],
          ),
        ),

        // Gradient overlay (bottom fade for card readability)
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.mapOverlayGradient,
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Builds map markers dynamically from backend venue data.
  List<Marker> _buildMarkersFromVenues(List<Venue> venues) {
    return venues.where((v) => v.location != null).map((venue) {
      final loc = venue.location!;
      return Marker(
        point: LatLng(loc.latitude, loc.longitude),
        width: 140,
        height: 100,
        child: GestureDetector(
          onTap: () {
            ref.read(selectedVenueProvider.notifier).state = venue;
            widget.onMarkerTap?.call(venue);
          },
          child: _VenuePin(venue: venue),
        ),
      );
    }).toList();
  }
}

/// Defines the custom drop-shape for the map pin.
class MapPinPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final r = w / 2;

    final path = Path();
    path.moveTo(r, h);
    path.quadraticBezierTo(w, h * 0.65, w, r);
    path.arcToPoint(Offset(0, r), radius: Radius.circular(r), clockwise: false);
    path.quadraticBezierTo(0, h * 0.65, r, h);
    path.close();

    // Slight shadow for 3D effect
    canvas.drawShadow(path, Colors.black.withValues(alpha: 0.3), 5, false);

    // Fill with Amber gradient
    final fillPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFFD54F), Color(0xFFFFB300)], // Light Amber to Amber
      ).createShader(Rect.fromLTWH(0, 0, w, h))
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, fillPaint);

    // Thick white border
    final borderPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 3.0
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A map pin showing the venue logo inside a custom drop shape with a glass label.
class _VenuePin extends StatelessWidget {
  final Venue venue;
  const _VenuePin({required this.venue});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Venue Pin Drop Logo
        Stack(
          alignment: Alignment.topCenter,
          children: [
            CustomPaint(
              size: const Size(46, 58),
              painter: MapPinPainter(),
            ),
            Positioned(
              top: 5,
              child: Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: AppColors.surfaceContainerHigh,
                  shape: BoxShape.circle,
                ),
                clipBehavior: Clip.antiAlias,
                child: venue.logo != null && venue.logo!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: AppConfig.formatImageUrl(venue.logo!) ?? '',
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 1.5, 
                              color: Color(0xFFFFB300)
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.storefront, 
                          color: Colors.grey, 
                          size: 18
                        ),
                      )
                    : const Icon(Icons.storefront, color: AppColors.onSurfaceVariant, size: 18),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        // Label
        GlassPanel(
          borderRadius: BorderRadius.circular(100),
          backgroundOpacity: 0.9,
          blurSigma: 25,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
          border: Border.all(
            color: AppColors.outlineVariant.withValues(alpha: 0.1),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.onSurface.withValues(alpha: 0.05),
              blurRadius: 15,
              spreadRadius: 1,
            ),
          ],
          child: Text(
            venue.name ?? 'Məkan',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurface,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _ActivePin extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Pulsing dot
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 15,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Container(
            width: 12,
            height: 12,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
        ),
        const SizedBox(height: 8),
        // Label
        GlassPanel(
          borderRadius: BorderRadius.circular(100),
          backgroundOpacity: 0.9,
          blurSigma: 25,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          border: Border.all(
            color: AppColors.outlineVariant.withValues(alpha: 0.1),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.onSurface.withValues(alpha: 0.05),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
          child: Text(
            'LevelUp Lounj',
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ],
    );
  }
}

class _ProminentPin extends StatefulWidget {
  final IconData icon;

  const _ProminentPin({required this.icon});

  @override
  State<_ProminentPin> createState() => _ProminentPinState();
}

class _ProminentPinState extends State<_ProminentPin> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    _animation = Tween<double>(begin: 0.0, end: 15.0).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Center(
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Pulsing Outer Glow
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3 * (1 - _controller.value)),
                      blurRadius: _animation.value * 2,
                      spreadRadius: _animation.value,
                    ),
                  ],
                ),
              ),
              // Inner Core
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  widget.icon,
                  size: 18,
                  color: Colors.white,
                ),
              ),
              // "NEW" Tag on top
              Positioned(
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF1744), // Vibrant Red for attention
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'YENİ',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ActionableMarker extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _ActionableMarker({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: _InactivePin(icon: icon),
    );
  }
}

class _InactivePin extends StatelessWidget {
  final IconData icon;

  const _InactivePin({required this.icon});

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: 0.7,
      child: Transform.scale(
        scale: 0.9,
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerHighest,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(
            icon,
            size: 16,
            color: AppColors.secondary,
          ),
        ),
      ),
    );
  }
}

class _UserLocationPin extends StatefulWidget {
  const _UserLocationPin();

  @override
  State<_UserLocationPin> createState() => _UserLocationPinState();
}

class _UserLocationPinState extends State<_UserLocationPin> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _animation = Tween<double>(begin: 0.0, end: 15.0).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Center(
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Pulsing Outer Glow
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withValues(alpha: 0.4 * (1 - _controller.value)),
                      blurRadius: _animation.value * 2,
                      spreadRadius: _animation.value,
                    ),
                  ],
                ),
              ),
              // White Border
              Container(
                width: 20,
                height: 20,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
              ),
              // Inner Core
              Container(
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Cluster marker badge shown when multiple venues are grouped together.
class _ClusterMarker extends StatelessWidget {
  final int count;
  const _ClusterMarker({required this.count});

  @override
  Widget build(BuildContext context) {
    // Scale badge size based on count
    final double size = count > 50 ? 56 : (count > 20 ? 52 : (count > 10 ? 48 : 44));

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFD54F), Color(0xFFFFB300)],
        ),
        border: Border.all(color: Colors.white, width: 2.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFB300).withValues(alpha: 0.4),
            blurRadius: 10,
            spreadRadius: 2,
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Center(
        child: Text(
          count > 99 ? '99+' : count.toString(),
          style: AppTypography.labelSmall.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: count > 99 ? 11 : 14,
            letterSpacing: 0.5,
            shadows: [
              Shadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 2,
                offset: const Offset(0, 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
