import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/models/venue_model.dart';
import '../../../../core/repositories/reservation_repository.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/services/socket_service.dart';
import '../widgets/reservation/reservation_form_widgets.dart';
import 'reservation_success_screen.dart';
import 'floor_plan_screen.dart';

class ReservationScreen extends StatefulWidget {
  final Venue venue;
  final Tier? initialTier;
  final String? selectedTableId;
  final String? selectedTableName;
  final String? preSelectedTierId;

  const ReservationScreen({
    super.key,
    required this.venue,
    this.initialTier,
    this.selectedTableId,
    this.selectedTableName,
    this.preSelectedTierId,
  });

  @override
  State<ReservationScreen> createState() => _ReservationScreenState();
}

class _ReservationScreenState extends State<ReservationScreen> {
  final DateTime selectedDate = DateTime.now();
  TimeOfDay? selectedTime;
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  Tier? selectedTier;
  String? _selectedTableId;
  String? _selectedTableName;
  String? _preSelectedTierId;

  bool _isSubmitting = false;
  bool _venueBlocked = false;
  String _blockedReason = '';
  StreamSubscription? _venueUpdateSub;
  StreamSubscription? _layoutUpdateSub;
  Timer? _clockTimer;
  Map<String, int>? _availableCounts;

  @override
  void initState() {
    super.initState();
    
    _selectedTableId = widget.selectedTableId;
    _selectedTableName = widget.selectedTableName;
    _preSelectedTierId = widget.preSelectedTierId;

    // Set initial tier based on preSelectedTierId or initialTier
    if (_preSelectedTierId != null && widget.venue.specs != null) {
      selectedTier = widget.venue.specs!.tiers.firstWhere(
        (t) => t.id == _preSelectedTierId || t.title == _preSelectedTierId, // Fallback if id is not available
        orElse: () => widget.venue.specs!.tiers.first,
      );
    } else {
      selectedTier = widget.initialTier;
    }
    
    // 1. Listen for real-time venue status changes from admin (Socket.io)
    _venueUpdateSub = SocketService().onVenueUpdate.listen((data) {
      if (data['_id'] == widget.venue.id) {
        final status = data['status'] as String?;
        final tempClosed = data['temporarilyClosed'] as bool? ?? false;

        if (tempClosed || status == 'INACTIVE') {
          setState(() {
            _venueBlocked = true;
            _blockedReason = tempClosed
                ? AppLocalizations.of(context)!.venueTemporarilyClosedMsg
                : AppLocalizations.of(context)!.venueFullMsg;
          });
          _showVenueBlockedDialog();
        } else if (_venueBlocked) {
          setState(() {
            _venueBlocked = false;
            _blockedReason = '';
          });
        }
      }
    });

    // 2. Local real-time clock monitor - One-shot Timer instead of 1-second polling
    if (!widget.venue.isOpenByClock) {
      _venueBlocked = true;
      _blockedReason = AppLocalizations.of(context)!.venueClosedByClockMsg;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showVenueBlockedDialog();
      });
    } else {
      final timeToClose = widget.venue.durationUntilClose;
      if (timeToClose != null) {
        _clockTimer = Timer(timeToClose, () {
          if (mounted && !_venueBlocked) {
            setState(() {
              _venueBlocked = true;
              _blockedReason = AppLocalizations.of(context)!.venueClosedByClockMsg;
            });
            _showVenueBlockedDialog();
          }
        });
      }
    }

    // 3. Fetch initial available table counts
    _fetchAvailableCounts();

    // 4. Listen for layout updates (table status changes)
    _layoutUpdateSub = SocketService().onLayoutUpdate.listen((data) {
      if (data['venueId'] == widget.venue.id) {
        // Refetch counts if the venue layout changed
        _fetchAvailableCounts();

        // Real-time selected table availability check
        if (_selectedTableId != null) {
          final layout = data['layout'] as Map<String, dynamic>?;
          final itemsList = layout?['items'] as List<dynamic>? ?? [];
          final selectedItem = itemsList.firstWhere(
            (json) => json['id'] == _selectedTableId,
            orElse: () => null,
          );
          
          if (selectedItem != null) {
            final isAvailable = selectedItem['status'] == 'available';
            if (!isAvailable) {
              if (mounted) {
                setState(() {
                  _selectedTableId = null;
                  _selectedTableName = null;
                });
                _showTableTakenDialog();
              }
            }
          }
        }
      }
    });
  }

  Future<void> _fetchAvailableCounts() async {
    try {
      final counts = await ReservationRepository().getAvailableTableCounts(widget.venue.id);
      if (mounted) {
        setState(() {
          _availableCounts = counts;
        });
      }
    } catch (e) {
      debugPrint('Error fetching available table counts: $e');
    }
  }

  void _showVenueBlockedDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.block, color: Colors.red.shade600, size: 28),
        ),
        title: Text(
          _blockedReason,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        content: Text(
          _blockedReason == AppLocalizations.of(context)!.venueClosedByClockMsg 
              ? AppLocalizations.of(context)!.venueClosedDescription
              : AppLocalizations.of(context)!.venueOwnerStoppedReservations,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF475569), height: 1.5),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx); // close dialog
              Navigator.pop(context); // go back to detail screen
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: Text(AppLocalizations.of(context)!.goBack, style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _showTableTakenDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.amber.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.warning_amber_rounded, color: Colors.amber.shade600, size: 28),
        ),
        title: const Text(
          'Masa artıq tutulub',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        content: const Text(
          'Seçdiyiniz masa digər istifadəçi tərəfindən indicə rezerv edildi. Lütfən başqa masa seçin.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF475569), height: 1.5),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: const Text('Tamam', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  void _showBlockedByVenueDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        icon: Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.block_flipped, color: Colors.red.shade600, size: 28),
        ),
        title: Text(
          AppLocalizations.of(context)!.blockedByVenue,
          textAlign: TextAlign.center,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        content: Text(
          AppLocalizations.of(context)!.blockedByVenueDesc,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF475569), height: 1.5),
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            ),
            child: Text(AppLocalizations.of(context)!.goBack, style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    _venueUpdateSub?.cancel();
    _layoutUpdateSub?.cancel();
    _descriptionController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _selectTime(BuildContext context) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.onSurface,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != selectedTime) {
      setState(() {
        selectedTime = picked;
      });
    }
  }

  Future<void> _onConfirm() async {
    // Check if venue was blocked while user was filling
    if (_venueBlocked) {
      _showVenueBlockedDialog();
      return;
    }

    // Local explicit time check right before submission
    if (!widget.venue.isOpenByClock) {
      setState(() {
        _venueBlocked = true;
        _blockedReason = AppLocalizations.of(context)!.venueClosedByClockMsg;
      });
      _showVenueBlockedDialog();
      return;
    }

    final phone = _phoneController.text.trim();
    if (selectedTime == null || selectedTier == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.pleaseFillAllFields)),
      );
      return;
    }

    const allowedPrefixes = {'50', '51', '10', '55', '99', '70', '77', '60'};
    if (phone.length < 9) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Telefon nömrəsi 9 rəqəmdən ibarət olmalıdır.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    final prefix = phone.substring(0, 2);
    if (!allowedPrefixes.contains(prefix)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Yanlış operator nömrəsi. Yalnız 50, 51, 10, 55, 99, 70, 77, 60 ola bilər.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final now = DateTime.now();
    final reservationDateTime = DateTime(
      now.year,
      now.month,
      now.day,
      selectedTime!.hour,
      selectedTime!.minute,
    );

    if (reservationDateTime.isBefore(now)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.cannotBookPastTime)),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final userData = await AuthService().getUserData();
      final hour = selectedTime!.hour.toString().padLeft(2, '0');
      final minute = selectedTime!.minute.toString().padLeft(2, '0');

      final data = {
        'venueId': widget.venue.id,
        'venueName': widget.venue.name ?? AppLocalizations.of(context)!.venue,
        'userId': userData?['uid'] ?? userData?['sub'] ?? '',
        'userName': userData?['displayName'] ?? AppLocalizations.of(context)!.user,
        'userEmail': userData?['email'] ?? '',
        'userPhone': '+994 $phone',
        'date': '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}',
        'time': '$hour:$minute',
        'tierTitle': selectedTier?.title ?? '',
        'tierId': selectedTier?.id ?? selectedTier?.title,
        'tierPrice': selectedTier?.price ?? 0,
        'description': _descriptionController.text.trim(),
        'tableId': _selectedTableId,
      };

      debugPrint('🔍 Reservation data: tierId=${data['tierId']}, tierTitle=${data['tierTitle']}, tableId=${data['tableId']}');

      await ReservationRepository().createReservation(data);

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const ReservationSuccessScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMessage = AppLocalizations.of(context)!.errorOccurredTryAgain;
        
        // Very robust error extraction
        String errorStr = e.toString();
        try {
          final dynamic dioError = e;
          if (dioError.response != null) {
            errorStr += dioError.response!.data.toString();
            errorStr += dioError.response!.statusCode.toString();
          }
        } catch (_) {}
        
        if (errorStr.contains('SAME_VENUE_PENDING')) {
          errorMessage = AppLocalizations.of(context)!.activeReservationSameVenue;
        } else if (errorStr.contains('OTHER_VENUE_PENDING')) {
          errorMessage = AppLocalizations.of(context)!.activeReservationOtherVenue;
        } else if (errorStr.contains('VENUE_TEMPORARILY_CLOSED')) {
          errorMessage = AppLocalizations.of(context)!.venueTemporarilyClosedMsg;
        } else if (errorStr.contains('VENUE_NOT_ACCEPTING')) {
          errorMessage = AppLocalizations.of(context)!.venueFullMsg;
        } else if (errorStr.contains('VENUE_CLOSED_BY_CLOCK')) {
          errorMessage = AppLocalizations.of(context)!.venueClosedByClockMsg;
        } else if (errorStr.contains('NO_AVAILABLE_TABLE')) {
          errorMessage = 'Bu xidmət üçün boş masa yoxdur. Xəritədən masa seçməyi yoxlayın.';
        } else if (errorStr.contains('TABLE_BEING_RESERVED')) {
          errorMessage = 'Bu masa hal-hazırda başqa bir istifadəçi tərəfindən rezerv olunur. Lütfən başqa masa seçin.';
        } else if (errorStr.contains('TABLE_NOT_AVAILABLE')) {
          errorMessage = 'Seçilmiş masa artıq tutulub. Başqa masa seçin.';
        } else if (errorStr.contains('TABLE_NOT_FOUND')) {
          errorMessage = 'Seçilmiş masa tapılmadı.';
        } else if (errorStr.contains('USER_BLOCKED_BY_VENUE')) {
          // Show special blocked-by-venue dialog and return
          _showBlockedByVenueDialog();
          setState(() => _isSubmitting = false);
          return;
        }
        
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Text(
              AppLocalizations.of(context)!.attention,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            content: Text(
              errorMessage,
              style: const TextStyle(
                color: Color(0xFF475569),
                height: 1.4,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF6366F1),
                ),
                child: Text(
                  AppLocalizations.of(context)!.iUnderstand,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isReady = selectedTime != null && 
                       selectedTier != null && 
                       _phoneController.text.isNotEmpty;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: const Color(0xFFF9F9FE),
        body: Stack(
          children: [
            Column(
              children: [
                const ReservationAppBar(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),
                        ReservationVenueHeader(venue: widget.venue),
                        const SizedBox(height: 32),
                        ReservationDateSection(selectedDate: selectedDate),
                        const SizedBox(height: 32),
                        ReservationPhoneInput(
                          controller: _phoneController,
                          onChanged: () => setState(() {}),
                        ),
                        const SizedBox(height: 32),
                        ReservationTimePicker(
                          selectedTime: selectedTime,
                          onTap: () => _selectTime(context),
                        ),
                        const SizedBox(height: 32),
                        if (_selectedTableName != null) ...[
                          const SizedBox(height: 16),
                          GestureDetector(
                            onTap: () async {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => FloorPlanScreen(venue: widget.venue),
                                ),
                              );
                              if (result != null && result is Map<String, dynamic>) {
                                setState(() {
                                  _selectedTableId = result['selectedTableId'];
                                  _selectedTableName = result['selectedTableName'];
                                  _preSelectedTierId = result['preSelectedTierId'];
                                  
                                  if (_preSelectedTierId != null && widget.venue.specs != null) {
                                    selectedTier = widget.venue.specs!.tiers.firstWhere(
                                      (t) => t.id == _preSelectedTierId || t.title == _preSelectedTierId,
                                      orElse: () => widget.venue.specs!.tiers.first,
                                    );
                                  }
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.primary,
                                    AppColors.primary.withAlpha(200),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 16,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.check_circle_outline,
                                      color: Colors.white,
                                      size: 28,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Seçilmiş Masa',
                                          style: AppTypography.labelMedium.copyWith(
                                            color: Colors.white.withValues(alpha: 0.8),
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _selectedTableName!,
                                          style: AppTypography.titleLarge.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      'Dəyiş',
                                      style: AppTypography.labelSmall.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ] else ...[
                          ReservationTierSelection(
                            tiers: widget.venue.specs?.tiers ?? [],
                            selectedTier: selectedTier,
                            onTierSelected: (tier) => setState(() => selectedTier = tier),
                            availableCounts: _availableCounts,
                          ),
                          const SizedBox(height: 24),
                          GestureDetector(
                            onTap: () async {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => FloorPlanScreen(venue: widget.venue),
                                ),
                              );
                              if (result != null && result is Map<String, dynamic>) {
                                setState(() {
                                  _selectedTableId = result['selectedTableId'];
                                  _selectedTableName = result['selectedTableName'];
                                  _preSelectedTierId = result['preSelectedTierId'];
                                  
                                  if (_preSelectedTierId != null && widget.venue.specs != null) {
                                    selectedTier = widget.venue.specs!.tiers.firstWhere(
                                      (t) => t.id == _preSelectedTierId || t.title == _preSelectedTierId,
                                      orElse: () => widget.venue.specs!.tiers.first,
                                    );
                                  }
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 20,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                                border: Border.all(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.map_outlined,
                                      color: AppColors.primary,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Öz masanızı seçin',
                                          style: AppTypography.titleMedium.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.onSurface,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Məkanın planına baxın və istədiyiniz yeri rezerv edin',
                                          style: AppTypography.labelSmall.copyWith(
                                            color: AppColors.onSurfaceVariant,
                                            height: 1.3,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Icon(
                                    Icons.arrow_forward_ios,
                                    size: 16,
                                    color: AppColors.primary.withValues(alpha: 0.5),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 32),
                        ReservationDescriptionField(controller: _descriptionController),
                        const SizedBox(height: 240),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            
            // Animated Footer
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: AnimatedSlide(
                offset: isReady ? Offset.zero : const Offset(0, 1),
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeOutCubic,
                child: ReservationBottomAction(
                  selectedTime: selectedTime,
                  selectedTier: selectedTier,
                  onConfirm: _onConfirm,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
