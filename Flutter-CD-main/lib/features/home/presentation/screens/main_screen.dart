import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'home_screen.dart';
import '../../../search/presentation/screens/search_screen.dart';
import '../../../favorites/presentation/screens/favorites_screen.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../widgets/bottom_nav_bar.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/services/socket_service.dart';
import '../../../../core/providers/venues_provider.dart';

/// The main shell screen that holds the persistent bottom navigation bar.
class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _currentIndex = 0;
  bool _hideNavBar = false;
  StreamSubscription? _venueUpdateSub;

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  /// Automatically connect the Socket.io service so we receive
  /// reservation status notifications from the moment the app opens.
  Future<void> _connectSocket() async {
    try {
      final userData = await AuthService().getUserData();
      final userId = userData?['uid'] ?? userData?['sub'] ?? '';
      final token = await AuthService().getToken();
      if (userId.isNotEmpty && token != null) {
        SocketService().connect(userId: userId, token: token);

        // Listen for real-time venue status changes and refresh data
        _venueUpdateSub = SocketService().onVenueUpdate.listen((data) {
          debugPrint('MainScreen: Venue update received, updating locally...');
          // Update the search screen list silently
          ref.read(paginatedSearchProvider.notifier).updateVenueStatus(data);
          
          // Invalidate just the specific venue detail provider so it's fresh if visited later
          final venueId = data['_id'];
          if (venueId != null) {
            ref.invalidate(venueByIdProvider(venueId));
          }
        });
      }
    } catch (e) {
      debugPrint('MainScreen: Socket connect error: $e');
    }
  }

  @override
  void dispose() {
    _venueUpdateSub?.cancel();
    SocketService().disconnect();
    super.dispose();
  }

  void _onTabSelected(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _onDetailOverlayChanged(bool isShowing) {
    setState(() {
      _hideNavBar = isShowing;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          children: [
            IndexedStack(
              index: _currentIndex,
              children: [
                HomeScreen(
                  onSearchTap: () => _onTabSelected(1),
                  isActive: _currentIndex == 0,
                  onDetailOverlayChanged: _onDetailOverlayChanged,
                ),
                const SearchScreen(),
                const FavoritesScreen(),
                ProfileScreen(onNavigateToFavorites: () => _onTabSelected(2)),
              ],
            ),
            // Animated Nav Bar — slides down when detail overlay is active
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              bottom: _hideNavBar ? -(bottomPadding + 100) : bottomPadding + 20,
              left: 0,
              right: 0,
              child: HomeBottomNavBar(
                selectedIndex: _currentIndex,
                onTabSelected: _onTabSelected,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
