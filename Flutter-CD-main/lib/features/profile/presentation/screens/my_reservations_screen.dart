import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/models/reservation_model.dart';
import '../../../../core/repositories/reservation_repository.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/services/socket_service.dart';

/// Screen that shows the user's reservations with live status updates via Socket.io.
class MyReservationsScreen extends StatefulWidget {
  const MyReservationsScreen({super.key});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  List<Reservation> _reservations = [];
  bool _isLoading = true;
  String? _error;
  StreamSubscription? _socketSub;

  int _page = 1;
  bool _hasMore = true;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _loadReservations();
    _listenToStatusUpdates();
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }

  Future<void> _loadReservations() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _page = 1;
      _hasMore = true;
    });

    try {
      final userData = await AuthService().getUserData();
      final userId = userData?['uid'] ?? userData?['sub'] ?? '';
      if (userId.isEmpty) {
        setState(() {
          _error = AppLocalizations.of(context)!.userNotFound;
          _isLoading = false;
        });
        return;
      }

      // Connect socket for real-time updates
      final token = await AuthService().getToken();
      if (token != null) {
        SocketService().connect(userId: userId, token: token);
      }

      final reservations =
          await ReservationRepository().getMyReservations(userId, page: _page, limit: 10);
      if (mounted) {
        setState(() {
          _reservations = reservations;
          _isLoading = false;
          if (reservations.length < 10) {
            _hasMore = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Xəta: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadMoreReservations() async {
    if (_isLoadingMore || !_hasMore) return;
    
    setState(() {
      _isLoadingMore = true;
    });

    try {
      final userData = await AuthService().getUserData();
      final userId = userData?['uid'] ?? userData?['sub'] ?? '';
      if (userId.isEmpty) return;

      final nextPage = _page + 1;
      final newReservations =
          await ReservationRepository().getMyReservations(userId, page: nextPage, limit: 10);
      
      if (mounted) {
        setState(() {
          _page = nextPage;
          _reservations.addAll(newReservations);
          _isLoadingMore = false;
          if (newReservations.length < 10) {
            _hasMore = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Xəta: $e')),
          );
        });
      }
    }
  }

  void _listenToStatusUpdates() {
    _socketSub = SocketService().onStatusUpdate.listen((data) {
      // Refresh the list when a status update comes in
      _loadReservations();
    });
  }

  String _statusText(String status) {
    final l10n = AppLocalizations.of(context)!;
    switch (status) {
      case 'accepted':
        return l10n.accepted;
      case 'awaiting_arrival':
        return 'Gəliş Gözlənilir';
      case 'arrived':
        return 'Gəldi';
      case 'no_show':
        return 'Gəlmədi';
      case 'rejected':
        return l10n.rejected;
      case 'canceled':
        return l10n.canceled;
      case 'pending':
      default:
        return l10n.pending;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'accepted':
      case 'arrived':
        return const Color(0xFF00C853);
      case 'awaiting_arrival':
        return const Color(0xFF2196F3);
      case 'rejected':
        return const Color(0xFFFF1744);
      case 'no_show':
        return const Color(0xFFFF8F00);
      case 'canceled':
        return const Color(0xFF757575);
      case 'pending':
      default:
        return const Color(0xFFF9A825);
    }
  }

  Color _statusBgColor(String status) {
    switch (status) {
      case 'accepted':
      case 'arrived':
        return const Color(0xFFE8F5E9);
      case 'awaiting_arrival':
        return const Color(0xFFE3F2FD);
      case 'rejected':
        return const Color(0xFFFFEBEE);
      case 'no_show':
        return const Color(0xFFFFF8E1);
      case 'canceled':
        return const Color(0xFFEEEEEE);
      case 'pending':
      default:
        return const Color(0xFFFFF8E1);
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'accepted':
      case 'arrived':
        return Icons.check_circle;
      case 'awaiting_arrival':
        return Icons.directions_walk;
      case 'rejected':
        return Icons.cancel;
      case 'no_show':
        return Icons.timer_off;
      case 'canceled':
        return Icons.do_not_disturb_alt;
      case 'pending':
      default:
        return Icons.schedule;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FE),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9F9FE),
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
          style: IconButton.styleFrom(
            backgroundColor: Colors.white,
          ),
        ),
        title: Text(
          AppLocalizations.of(context)!.myReservations,
          style: AppTypography.headlineMedium.copyWith(
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: AppColors.error),
                      const SizedBox(height: 16),
                      Text(_error!,
                          style: AppTypography.bodyMedium
                              .copyWith(color: AppColors.onSurfaceVariant)),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadReservations,
                        child: Text(AppLocalizations.of(context)!.retry),
                      ),
                    ],
                  ),
                )
              : _reservations.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.calendar_today,
                              size: 64,
                              color:
                                  AppColors.onSurfaceVariant.withValues(alpha: 0.3)),
                          const SizedBox(height: 16),
                          Text(
                            AppLocalizations.of(context)!.noReservationsYet,
                            style: AppTypography.bodyLarge.copyWith(
                              color: AppColors.onSurfaceVariant,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            AppLocalizations.of(context)!.canBookFromVenuePage,
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadReservations,
                      color: AppColors.primary,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(24),
                        itemCount: _reservations.length + (_hasMore && _reservations.isNotEmpty ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _reservations.length) {
                             return Padding(
                               padding: const EdgeInsets.symmetric(vertical: 16),
                               child: Center(
                                 child: _isLoadingMore
                                     ? const CircularProgressIndicator(color: AppColors.primary)
                                     : ElevatedButton(
                                         onPressed: _loadMoreReservations,
                                         style: ElevatedButton.styleFrom(
                                           backgroundColor: AppColors.primary,
                                           foregroundColor: Colors.white,
                                           padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                                           shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                         ),
                                         child: Text(AppLocalizations.of(context)!.continueBtn),
                                       ),
                               ),
                             );
                          }
                          final r = _reservations[index];
                          
                          // Handle localization of the hardcoded cancellation reason from backend
                          String displayRejectReason = r.rejectReason ?? '';
                          if (displayRejectReason == 'İstifadəçi rezervasiyanı ləğv etdi.') {
                            displayRejectReason = AppLocalizations.of(context)!.userCanceledReason;
                          }

                          return _ReservationCard(
                            reservation: r,
                            rejectReasonOverride: displayRejectReason,
                            statusText: _statusText(r.status),
                            statusColor: _statusColor(r.status),
                            statusBgColor: _statusBgColor(r.status),
                            statusIcon: _statusIcon(r.status),
                            onCancel: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: Text(AppLocalizations.of(context)!.cancelReservationConfirmTitle),
                                  content: Text(AppLocalizations.of(context)!.cancelReservationConfirmMessage),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx, false),
                                      child: Text(AppLocalizations.of(context)!.no),
                                    ),
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx, true),
                                      child: Text(AppLocalizations.of(context)!.yesCancel, style: const TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                ),
                              );
                              if (confirm == true) {
                                try {
                                  await ReservationRepository().cancelReservation(r.id);
                                  _loadReservations();
                                } catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Xəta: $e')),
                                    );
                                  }
                                }
                              }
                            },
                          );
                        },
                      ),
                    ),
    );
  }
}

class _ReservationCard extends StatelessWidget {
  final Reservation reservation;
  final String? rejectReasonOverride;
  final String statusText;
  final Color statusColor;
  final Color statusBgColor;
  final IconData statusIcon;
  final VoidCallback onCancel;

  const _ReservationCard({
    required this.reservation,
    this.rejectReasonOverride,
    required this.statusText,
    required this.statusColor,
    required this.statusBgColor,
    required this.statusIcon,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Venue name + Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reservation.venueName,
                      style: AppTypography.titleMedium.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (reservation.reservationNumber != null &&
                        reservation.reservationNumber!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        AppLocalizations.of(context)!.reservationCode(reservation.reservationNumber!),
                        style: AppTypography.labelMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusBgColor,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: AppTypography.labelSmall.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          const Divider(color: AppColors.surfaceVariant, height: 1),
          const SizedBox(height: 16),

          // Details grid
          Row(
            children: [
              _DetailChip(
                icon: Icons.calendar_today,
                label: reservation.date,
              ),
              const SizedBox(width: 12),
              _DetailChip(
                icon: Icons.access_time,
                label: reservation.time,
              ),
              const SizedBox(width: 12),
              _DetailChip(
                icon: Icons.people,
                label: AppLocalizations.of(context)!.peopleCount(reservation.peopleCount.toString()),
              ),
            ],
          ),

          if (reservation.tierTitle != null &&
              reservation.tierTitle!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                _DetailChip(
                  icon: Icons.desktop_windows,
                  label: reservation.tierTitle!,
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F5FA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        '₼',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${reservation.tierPrice.toInt()} AZN',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],

          if (reservation.description != null &&
              reservation.description!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.notes, size: 16, color: AppColors.onSurfaceVariant),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      reservation.description!,
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          if (reservation.status == 'awaiting_arrival' && reservation.graceDeadline != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE3F2FD),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF2196F3).withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.timer, size: 16, color: Color(0xFF1976D2)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Vaxtında gəlin! Son müddət: ${reservation.graceDeadline!.hour.toString().padLeft(2, '0')}:${reservation.graceDeadline!.minute.toString().padLeft(2, '0')}',
                      style: AppTypography.bodySmall.copyWith(
                        color: const Color(0xFF1976D2),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          if ((rejectReasonOverride != null && rejectReasonOverride!.isNotEmpty) || 
              (reservation.rejectReason != null && reservation.rejectReason!.isNotEmpty)) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: statusBgColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: statusColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      rejectReasonOverride ?? reservation.rejectReason!,
                      style: AppTypography.bodySmall.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (reservation.status == 'pending' || reservation.status == 'awaiting_arrival' || reservation.status == 'accepted') ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: onCancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(AppLocalizations.of(context)!.cancelReservationBtn),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _DetailChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5FA),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: AppColors.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
