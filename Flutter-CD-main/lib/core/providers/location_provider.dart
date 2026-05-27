import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

/// Provider for user's current location as LatLng
final userLocationProvider = StateProvider<LatLng?>((ref) => null);

/// Provider that exposes the LocationService methods
final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService(ref);
});

class LocationService {
  final ProviderRef _ref;

  LocationService(this._ref);

  /// Requests permission and gets the current location.
  /// Updates the userLocationProvider and returns the LatLng.
  Future<LatLng?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Location services are not enabled, don't continue.
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        // Permissions are denied.
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      // Permissions are denied forever, handle appropriately.
      return null;
    }

    // Try to get last known location first to make it instant
    final lastKnown = await Geolocator.getLastKnownPosition();
    if (lastKnown != null) {
      final latLng = LatLng(lastKnown.latitude, lastKnown.longitude);
      _ref.read(userLocationProvider.notifier).state = latLng;
      
      // Update fresh location in the background asynchronously
      Geolocator.getCurrentPosition().then((freshPosition) {
        final freshLatLng = LatLng(freshPosition.latitude, freshPosition.longitude);
        _ref.read(userLocationProvider.notifier).state = freshLatLng;
      }).catchError((_) {});
      
      return latLng;
    }

    // Fall back to getCurrentPosition if no last known location is cached
    final position = await Geolocator.getCurrentPosition();
    final latLng = LatLng(position.latitude, position.longitude);
    
    _ref.read(userLocationProvider.notifier).state = latLng;
    return latLng;
  }
}
