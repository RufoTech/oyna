import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../core/models/venue_model.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/constants/app_config.dart';

/// Map preview section with address and bouncing marker.
class VenueMapSection extends StatelessWidget {
  final Venue? venue;
  const VenueMapSection({super.key, this.venue});

  void _onMapTap(BuildContext context) {
    final lat = venue?.location?.latitude;
    final lng = venue?.location?.longitude;
    if (lat == null || lng == null) return;

    final venueName = venue?.name ?? '';

    if (Platform.isIOS) {
      _showMapOptionsSheet(context, lat, lng, venueName);
    } else {
      _launchUrl('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    }
  }

  void _showMapOptionsSheet(
    BuildContext context,
    double lat,
    double lng,
    String venueName,
  ) {
    final encodedName = Uri.encodeComponent(venueName);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Xəritə tətbiqi seçin',
                style: AppTypography.headlineMedium.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              // Apple Maps
              _MapOptionTile(
                icon: Icons.map,
                iconColor: Colors.green,
                title: 'Apple Maps',
                onTap: () {
                  Navigator.pop(ctx);
                  _launchUrl(
                    'https://maps.apple.com/?q=$encodedName&ll=$lat,$lng',
                  );
                },
              ),
              // Google Maps
              _MapOptionTile(
                icon: Icons.location_on,
                iconColor: Colors.red,
                title: 'Google Maps',
                onTap: () {
                  Navigator.pop(ctx);
                  _launchUrl(
                    'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
                  );
                },
              ),
              // Waze
              _MapOptionTile(
                icon: Icons.directions_car,
                iconColor: Colors.blue,
                title: 'Waze',
                onTap: () {
                  Navigator.pop(ctx);
                  _launchUrl('https://waze.com/ul?ll=$lat,$lng&navigate=yes');
                },
              ),
              const SizedBox(height: 8),
              // Cancel
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Ləğv et',
                      style: AppTypography.bodyLarge.copyWith(
                        color: AppColors.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lat = venue?.location?.latitude;
    final lng = venue?.location?.longitude;
    final address = venue?.location?.address;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ünvan',
          style: AppTypography.headlineMedium.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        if (address != null && address.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            address,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 24),
        GestureDetector(
          onTap: () => _onMapTap(context),
          child: Container(
            height: 192,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.surfaceVariant.withValues(alpha: 0.5),
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: (lat != null && lng != null)
                ? IgnorePointer(
                    child: FlutterMap(
                      options: MapOptions(
                        initialCenter: LatLng(lat, lng),
                        initialZoom: 15,
                        interactionOptions: const InteractionOptions(
                          flags: InteractiveFlag.none,
                        ),
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}@2x?access_token=${AppConfig.mapboxAccessToken}',
                          userAgentPackageName: 'com.example.flutter_cd',
                        ),
                        MarkerLayer(
                          markers: [
                            Marker(
                              point: LatLng(lat, lng),
                              width: 80,
                              height: 80,
                              child: const _BouncingMarker(),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                : Center(
                    child: Icon(
                      Icons.map_outlined,
                      color: AppColors.onSurfaceVariant.withValues(alpha: 0.5),
                      size: 40,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}

/// A single row in the map-options bottom sheet.
class _MapOptionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final VoidCallback onTap;

  const _MapOptionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(
        title,
        style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
      ),
      trailing: const Icon(
        Icons.chevron_right,
        color: AppColors.onSurfaceVariant,
        size: 20,
      ),
      onTap: onTap,
    );
  }
}

class _BouncingMarker extends StatefulWidget {
  const _BouncingMarker();

  @override
  State<_BouncingMarker> createState() => _BouncingMarkerState();
}

class _BouncingMarkerState extends State<_BouncingMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    _animation = Tween<double>(
      begin: -5,
      end: 5,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
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
        return Transform.translate(
          offset: Offset(0, _animation.value),
          child: Center(
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(Icons.location_on, color: Colors.white, size: 22),
              ),
            ),
          ),
        );
      },
    );
  }
}

Future<void> _launchUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null && await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
