import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../../l10n/app_localizations.dart';
import '../../../../../core/constants/app_config.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_typography.dart';
import '../../../../../core/models/venue_model.dart';

/// Reservation form app bar with back button and title.
class ReservationAppBar extends StatelessWidget {
  const ReservationAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        bottom: 8,
        left: 20,
        right: 20,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              shadowColor: Colors.black.withValues(alpha: 0.05),
              elevation: 8,
            ),
          ),
          Text(
            AppLocalizations.of(context)!.reserveSpot,
            style: AppTypography.headlineMedium.copyWith(
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}

/// Venue name/logo header in the reservation form.
class ReservationVenueHeader extends StatelessWidget {
  final Venue venue;
  const ReservationVenueHeader({super.key, required this.venue});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: AppColors.surfaceContainerHighest,
          ),
          clipBehavior: Clip.antiAlias,
          child: venue.logo != null
              ? CachedNetworkImage(
                  imageUrl: AppConfig.formatImageUrl(venue.logo!) ?? '',
                  fit: BoxFit.cover,
                )
              : const Icon(Icons.storefront),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                venue.name ?? AppLocalizations.of(context)!.venue,
                style: AppTypography.headlineMedium.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: AppColors.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      venue.location?.city ?? 'Bakı',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Today's date display section.
class ReservationDateSection extends StatelessWidget {
  final DateTime selectedDate;
  const ReservationDateSection({super.key, required this.selectedDate});

  @override
  Widget build(BuildContext context) {
    final months = [
      '',
      AppLocalizations.of(context)!.january,
      AppLocalizations.of(context)!.february,
      AppLocalizations.of(context)!.march,
      AppLocalizations.of(context)!.april,
      AppLocalizations.of(context)!.may,
      AppLocalizations.of(context)!.june,
      AppLocalizations.of(context)!.july,
      AppLocalizations.of(context)!.august,
      AppLocalizations.of(context)!.september,
      AppLocalizations.of(context)!.october,
      AppLocalizations.of(context)!.november,
      AppLocalizations.of(context)!.december,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.dateTitle,
          style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.calendar_today, size: 20, color: AppColors.primary),
              const SizedBox(width: 12),
              Text(
                '${AppLocalizations.of(context)!.today}, ${selectedDate.day} ${months[selectedDate.month]} ${selectedDate.year}',
                style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Custom formatter to handle Azerbaijani phone number inputs.
/// Automatically removes leading '0' (e.g. 050 -> 50) and limits input to 9 digits.
class AzerbaijaniPhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final String text = newValue.text;

    if (text.isEmpty) return newValue;

    // Automatically remove leading '0'
    if (text.startsWith('0')) {
      final newText = text.substring(1);
      int newSelectionOffset = newValue.selection.end - 1;
      if (newSelectionOffset < 0) newSelectionOffset = 0;
      if (newSelectionOffset > newText.length) newSelectionOffset = newText.length;

      return TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: newSelectionOffset),
      );
    }

    // Enforce 9-digit max length
    if (text.length > 9) {
      final newText = text.substring(0, 9);
      int newSelectionOffset = newValue.selection.end;
      if (newSelectionOffset > 9) newSelectionOffset = 9;
      return TextEditingValue(
        text: newText,
        selection: TextSelection.collapsed(offset: newSelectionOffset),
      );
    }

    return newValue;
  }
}

/// Phone number input field.
class ReservationPhoneInput extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onChanged;

  const ReservationPhoneInput({
    super.key,
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final text = controller.text.trim();
    const allowedPrefixes = {'50', '51', '10', '55', '99', '70', '77', '60'};

    String? errorText;
    bool isSuccess = false;

    if (text.isEmpty) {
      errorText = AppLocalizations.of(context)!.fieldRequired;
    } else if (text.length >= 2 && !allowedPrefixes.contains(text.substring(0, 2))) {
      errorText = 'Yanlış operator kodu (yalnız 50, 51, 10, 55, 99, 70, 77, 60)';
    } else if (text.length < 9) {
      errorText = 'Nömrə 9 rəqəmdən ibarət olmalıdır';
    } else {
      isSuccess = true;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.mobileNumber,
          style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: controller,
          keyboardType: TextInputType.phone,
          onChanged: (_) => onChanged(),
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            AzerbaijaniPhoneInputFormatter(),
          ],
          decoration: InputDecoration(
            hintText: '50 123 45 67',
            prefixText: '+994 ',
            prefixStyle: AppTypography.bodyLarge.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.onSurface,
            ),
            prefixIcon: const Icon(Icons.phone_android),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: errorText != null && text.isNotEmpty 
                    ? AppColors.error 
                    : isSuccess 
                        ? const Color(0xFF2E7D32) // Beautiful emerald green
                        : AppColors.primary, 
                width: 1.5,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: isSuccess
                ? Row(
                    key: const ValueKey('success'),
                    children: [
                      const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 14),
                      const SizedBox(width: 4),
                      Text(
                        'Düzgün nömrə',
                        style: AppTypography.labelSmall.copyWith(
                          color: const Color(0xFF2E7D32),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  )
                : Row(
                    key: ValueKey(errorText ?? 'empty'),
                    children: [
                      Icon(
                        errorText == AppLocalizations.of(context)!.fieldRequired
                            ? Icons.info_outline
                            : Icons.warning_amber_rounded,
                        color: errorText == AppLocalizations.of(context)!.fieldRequired
                            ? AppColors.onSurfaceVariant.withValues(alpha: 0.5)
                            : AppColors.error,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          errorText ?? '',
                          style: AppTypography.labelSmall.copyWith(
                            color: errorText == AppLocalizations.of(context)!.fieldRequired
                                ? AppColors.onSurfaceVariant.withValues(alpha: 0.6)
                                : AppColors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

/// Time picker trigger button.
class ReservationTimePicker extends StatelessWidget {
  final TimeOfDay? selectedTime;
  final VoidCallback onTap;

  const ReservationTimePicker({
    super.key,
    required this.selectedTime,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    String timeText = '--:--';
    if (selectedTime != null) {
      final hour = selectedTime!.hour.toString().padLeft(2, '0');
      final minute = selectedTime!.minute.toString().padLeft(2, '0');
      timeText = '$hour:$minute';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.timeTitle,
          style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.access_time, size: 20, color: AppColors.primary),
                const SizedBox(width: 12),
                Text(
                  timeText,
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    color: selectedTime == null ? AppColors.onSurfaceVariant : AppColors.onSurface,
                  ),
                ),
                const Spacer(),
                const Icon(Icons.keyboard_arrow_down, size: 20, color: AppColors.onSurfaceVariant),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Tier selection list.
class ReservationTierSelection extends StatelessWidget {
  final List<Tier> tiers;
  final Tier? selectedTier;
  final ValueChanged<Tier> onTierSelected;
  final Map<String, int>? availableCounts;

  const ReservationTierSelection({
    super.key,
    required this.tiers,
    required this.selectedTier,
    required this.onTierSelected,
    this.availableCounts,
  });

  @override
  Widget build(BuildContext context) {
    if (tiers.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.tierSelection,
          style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        Column(
          children: tiers.map((tier) {
            final isSelected = selectedTier == tier;
            final count = availableCounts?[tier.id] ?? availableCounts?[tier.title];
            final hasCount = count != null;
            final isSoldOut = hasCount && count == 0;

            return GestureDetector(
              onTap: isSoldOut ? null : () => onTierSelected(tier),
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSoldOut ? Colors.grey.shade50 : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.desktop_windows,
                        color: isSelected ? AppColors.primary : AppColors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                tier.title ?? AppLocalizations.of(context)!.standardSetup,
                                style: AppTypography.titleMedium.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: isSoldOut ? Colors.grey.shade500 : null,
                                ),
                              ),
                              if (hasCount) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isSoldOut ? Colors.red.shade50 : AppColors.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isSoldOut ? 'Dolu' : '$count boş',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isSoldOut ? Colors.red.shade600 : AppColors.primary,
                                    ),
                                  ),
                                ),
                              ]
                            ],
                          ),
                          Text(
                            tier.shortSpec ?? '',
                            style: AppTypography.labelSmall.copyWith(color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: '${tier.price.toInt()} AZN',
                                style: AppTypography.titleMedium.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: isSelected ? AppColors.primary : AppColors.onSurface,
                                ),
                              ),
                              TextSpan(
                                text: AppLocalizations.of(context)!.perHour,
                                style: AppTypography.labelSmall.copyWith(color: AppColors.onSurfaceVariant),
                              ),
                            ],
                          ),
                        ),
                        Radio<Tier>(
                          value: tier,
                          groupValue: selectedTier,
                          onChanged: (val) {
                            if (val != null) onTierSelected(val);
                          },
                          activeColor: AppColors.primary,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

/// Additional notes text field.
class ReservationDescriptionField extends StatelessWidget {
  final TextEditingController controller;
  const ReservationDescriptionField({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.additionalNote,
          style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: controller,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: AppLocalizations.of(context)!.noteHint,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.all(20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom action area with price summary and confirm button.
class ReservationBottomAction extends StatelessWidget {
  final TimeOfDay? selectedTime;
  final Tier? selectedTier;
  final VoidCallback onConfirm;

  const ReservationBottomAction({
    super.key,
    required this.selectedTime,
    required this.selectedTier,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    String timeText = '--:--';
    if (selectedTime != null) {
      final hour = selectedTime!.hour.toString().padLeft(2, '0');
      final minute = selectedTime!.minute.toString().padLeft(2, '0');
      timeText = '$hour:$minute';
    }

    final double totalPrice = selectedTier?.price ?? 0;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 20,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${AppLocalizations.of(context)!.today} • $timeText',
                    style: AppTypography.bodySmall.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                  Text(
                    '${selectedTier?.title ?? AppLocalizations.of(context)!.tierNotSelected}',
                    style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    AppLocalizations.of(context)!.total,
                    style: AppTypography.labelSmall.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                  Text(
                    '${totalPrice.toInt()} AZN',
                    style: AppTypography.headlineSmall.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: onConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
              elevation: 8,
              shadowColor: AppColors.primary.withValues(alpha: 0.3),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  AppLocalizations.of(context)!.confirmReservation,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
