import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../l10n/app_localizations.dart';
import '../../../../../core/models/venue_model.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../screens/venue_rates_screen.dart';
import '../../screens/venue_menu_screen.dart';

/// Main info card with venue name, address, status, and quick action buttons.
class VenueMainInfoCard extends StatelessWidget {
  final Venue? venue;
  const VenueMainInfoCard({super.key, this.venue});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.onSurface.withValues(alpha: 0.05),
            blurRadius: 32,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      venue?.name ?? AppLocalizations.of(context)!.venueNamePlaceholder,
                      style: AppTypography.headlineLarge.copyWith(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1.0,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(
                            Icons.location_on,
                            size: 18,
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            venue?.location?.address ?? AppLocalizations.of(context)!.bakuAzerbaijan,
                            style: AppTypography.labelMedium.copyWith(
                              color: AppColors.onSurfaceVariant,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppColors.surfaceVariant),
          const SizedBox(height: 16),
          // Status & Hours
          VenueStatusRow(venue: venue),
          const SizedBox(height: 24),
          // Quick Actions
          _buildQuickActions(context),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _ActionBtn(
                icon: Icons.call,
                label: AppLocalizations.of(context)!.call,
                iconColor: Colors.black,
                onTap: () {
                  final phone = venue?.contact?.phone;
                  if (phone != null && phone.isNotEmpty) {
                    final cleanPhone = phone.replaceAll(RegExp(r'\s+'), '');
                    _launchUrl('tel:$cleanPhone');
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ActionBtn(
                icon: Icons.location_on,
                label: AppLocalizations.of(context)!.address,
                onTap: () {
                  final lat = venue?.location?.latitude;
                  final lng = venue?.location?.longitude;
                  if (lat != null && lng != null) {
                    _launchUrl('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionBtn(
                iconWidget: const FaIcon(FontAwesomeIcons.whatsapp, color: Color(0xFF25D366), size: 22),
                label: 'WhatsApp',
                onTap: () {
                  final p = venue?.contact?.whatsapp;
                  if (p != null && p.isNotEmpty) {
                    if (p.startsWith('http')) {
                      _launchUrl(p);
                    } else {
                      final cleanPhone = p.replaceAll(RegExp(r'\s+'), '');
                      _launchUrl('https://wa.me/$cleanPhone');
                    }
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _ActionBtn(
                iconWidget: const FaIcon(FontAwesomeIcons.instagram, color: Color(0xFFE1306C), size: 22),
                label: 'Instagram',
                onTap: () {
                  final ig = venue?.contact?.instagram;
                  if (ig != null && ig.isNotEmpty) {
                    if (ig.startsWith('http')) {
                      _launchUrl(ig);
                    } else {
                      final handle = ig.replaceAll('@', '').trim();
                      _launchUrl('https://instagram.com/$handle');
                    }
                  }
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionBtn(
                icon: Icons.request_quote_outlined,
                label: AppLocalizations.of(context)!.priceTitle,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => VenueRatesScreen(venue: venue)),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionBtn(
                icon: Icons.restaurant_menu,
                label: AppLocalizations.of(context)!.menu,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => VenueMenuScreen(venue: venue)),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Venue open/closed status with pulsing dot indicator.
class VenueStatusRow extends StatelessWidget {
  final Venue? venue;
  const VenueStatusRow({super.key, this.venue});

  @override
  Widget build(BuildContext context) {
    final bool isStatusValid = (venue?.status == 'ACTIVE' || venue?.status == 'PUBLISHED' || venue?.status == 'INACTIVE');
    final bool isOpenByClock = venue?.isOpenByClock ?? true;
    final bool isTempClosed = venue?.temporarilyClosed ?? false;
    
    final bool isOpen = isStatusValid && !isTempClosed && isOpenByClock;
    final statusColor = isOpen ? const Color(0xFF00C853) : const Color(0xFFFF1744);
    final statusText = isOpen 
        ? AppLocalizations.of(context)!.nowOpen 
        : (isTempClosed ? AppLocalizations.of(context)!.venueCurrentlyClosed.toUpperCase() : AppLocalizations.of(context)!.closedCaps);
    
    return Row(
      children: [
        Flexible(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              VenuePulseDot(color: statusColor),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  statusText,
                  style: AppTypography.labelSmall.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Container(width: 1, height: 16, color: AppColors.outlineVariant),
        const SizedBox(width: 16),
        Flexible(
          flex: 2,
          child: Text(
            venue?.operatingHours?.is24_7 ?? false ? AppLocalizations.of(context)!.alwaysOpen : AppLocalizations.of(context)!.viewWorkingHours,
            style: AppTypography.labelMedium.copyWith(
              color: AppColors.onSurfaceVariant,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// Animated pulsing dot used for open/closed status.
class VenuePulseDot extends StatefulWidget {
  final Color color;
  const VenuePulseDot({super.key, required this.color});

  @override
  State<VenuePulseDot> createState() => _VenuePulseDotState();
}

class _VenuePulseDotState extends State<VenuePulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        FadeTransition(
          opacity: _controller,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        ),
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: widget.color,
            shape: BoxShape.circle,
          ),
        ),
      ],
    );
  }
}

/// Action button used in the quick-actions grid.
class _ActionBtn extends StatelessWidget {
  final IconData? icon;
  final Widget? iconWidget;
  final String label;
  final VoidCallback? onTap;
  final Color? iconColor;

  const _ActionBtn({this.icon, this.iconWidget, required this.label, this.iconColor, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F3F8),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            iconWidget ?? Icon(icon!, color: iconColor ?? AppColors.primary, size: 22),
            const SizedBox(height: 8),
            Text(
              label.toUpperCase(),
              style: AppTypography.labelTiny.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: AppColors.onSurfaceVariant,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _launchUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null && await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
