import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../../core/constants/app_config.dart';
import '../../../../../core/constants/app_constants.dart';
import '../../../../../core/models/venue_model.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../favorites/providers/favorites_provider.dart';

/// Hero image section with page-view carousel and floating nav buttons.
class VenueHeroSection extends StatefulWidget {
  final Venue? venue;
  final VoidCallback? onBackTap;

  const VenueHeroSection({super.key, this.venue, this.onBackTap});

  @override
  State<VenueHeroSection> createState() => _VenueHeroSectionState();
}

class _VenueHeroSectionState extends State<VenueHeroSection> {
  List<String> get _images {
    if (widget.venue?.media?.heroImage != null) {
      final url = AppConfig.formatImageUrl(widget.venue!.media!.heroImage!.url);
      if (url != null) return [url];
    }
    return [AppConstants.detailHeroImageUrl];
  }

  int _currentIndex = 0;

  void _openImageGallery() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            VenueGalleryScreen(images: _images, initialIndex: _currentIndex),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 397,
      child: Stack(
        fit: StackFit.expand,
        children: [
          GestureDetector(
            onTap: _openImageGallery,
            child: PageView.builder(
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemCount: _images.length,
              itemBuilder: (context, index) {
                return CachedNetworkImage(
                  imageUrl: _images[index],
                  fit: BoxFit.cover,
                );
              },
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [AppColors.scaffoldBackground, Colors.transparent],
                    stops: const [0.0, 0.4],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 56,
            right: 24,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.photo_library,
                    color: Colors.white,
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${_currentIndex + 1} / ${_images.length}',
                    style: AppTypography.labelSmall.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Nav buttons removed – handled by sticky Positioned in VenueDetailScreen
        ],
      ),
    );
  }
}

/// Circular floating nav button used in the hero section.
class VenueFloatingNavButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const VenueFloatingNavButton({
    super.key,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.9),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 20, color: AppColors.primary),
      ),
    );
  }
}

/// Animated favorite toggle button with scale bounce.
class VenueFloatingFavoriteButton extends ConsumerStatefulWidget {
  final String venueId;
  const VenueFloatingFavoriteButton({super.key, required this.venueId});

  @override
  ConsumerState<VenueFloatingFavoriteButton> createState() =>
      _VenueFloatingFavoriteButtonState();
}

class _VenueFloatingFavoriteButtonState
    extends ConsumerState<VenueFloatingFavoriteButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.2), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.2, end: 1.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleFavorite() {
    ref.read(favoritesProvider.notifier).toggleFavorite(widget.venueId);
    _controller.forward(from: 0.0);
  }

  @override
  Widget build(BuildContext context) {
    final favState = ref.watch(favoritesProvider);
    final isFavorite = favState.valueOrNull?.contains(widget.venueId) ?? false;

    return GestureDetector(
      onTap: _toggleFavorite,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return ScaleTransition(scale: animation, child: child);
            },
            child: Icon(
              isFavorite ? Icons.favorite : Icons.favorite_border,
              key: ValueKey<bool>(isFavorite),
              color: isFavorite ? Colors.red : AppColors.primary,
              size: 20,
            ),
          ),
        ),
      ),
    );
  }
}

/// Full-screen image gallery with PageView and zoom.
class VenueGalleryScreen extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const VenueGalleryScreen({
    super.key,
    required this.images,
    required this.initialIndex,
  });

  @override
  State<VenueGalleryScreen> createState() => _VenueGalleryScreenState();
}

class _VenueGalleryScreenState extends State<VenueGalleryScreen> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.black.withValues(alpha: 0.5),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: Text(
          '${_currentIndex + 1} / ${widget.images.length}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemCount: widget.images.length,
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 1.0,
                maxScale: 4.0,
                child: Center(
                  child: CachedNetworkImage(
                    imageUrl: widget.images[index],
                    fit: BoxFit.contain,
                    width: double.infinity,
                    placeholder: (context, url) => const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                    errorWidget: (context, url, error) => const Icon(
                      Icons.error_outline,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),
                ),
              );
            },
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.images.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentIndex == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentIndex == index
                        ? AppColors.primary
                        : Colors.white.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Grid view of all photos with tap-to-fullscreen.
class VenueAllPhotosGridScreen extends StatelessWidget {
  final List<String> images;

  const VenueAllPhotosGridScreen({super.key, required this.images});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Bütün şəkillər',
          style: AppTypography.titleLarge.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.onSurface,
          ),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
      ),
      body: GridView.builder(
        padding: const EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 40,
          top: 16,
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        itemCount: images.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      VenueGalleryScreen(images: images, initialIndex: index),
                ),
              );
            },
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: images[index],
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: AppColors.surfaceContainerHigh,
                  child: const Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: AppColors.surfaceContainerHigh,
                  child: const Icon(Icons.error_outline),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
