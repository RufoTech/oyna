import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/favorites_service.dart';

final favoritesServiceProvider = Provider((ref) => FavoritesService());

// We store a Set of favorite venue IDs
class FavoritesNotifier extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() async {
    final service = ref.read(favoritesServiceProvider);
    final favList = await service.getFavorites();
    return favList.toSet();
  }

  Future<void> toggleFavorite(String venueId) async {
    // If not loaded yet, ignore
    if (!state.hasValue) return;
    
    final currentSet = state.value!;
    final isFavorite = currentSet.contains(venueId);
    
    // Optimistic UI Update
    final newSet = Set<String>.from(currentSet);
    if (isFavorite) {
      newSet.remove(venueId);
    } else {
      newSet.add(venueId);
    }
    state = AsyncData(newSet);

    try {
      final service = ref.read(favoritesServiceProvider);
      if (isFavorite) {
        await service.removeFavorite(venueId);
      } else {
        await service.addFavorite(venueId);
      }
    } catch (e) {
      // Revert if API fails
      state = AsyncData(currentSet);
      // Optional: Log or throw error if UI needs to show a snackbar
    }
  }
}

final favoritesProvider = AsyncNotifierProvider<FavoritesNotifier, Set<String>>(() {
  return FavoritesNotifier();
});
