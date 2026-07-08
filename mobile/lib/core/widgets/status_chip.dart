import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_dimens.dart';
import '../theme/app_text_styles.dart';

enum StatusChipVariant { inStock, prescriptionRequired, outOfStock }

/// Pill-shaped status indicator, per DESIGN.md's "Status Chips" spec.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.variant, this.label});

  final StatusChipVariant variant;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final (background, foreground, defaultLabel) = switch (variant) {
      StatusChipVariant.inStock => (
          AppColors.inStockBackground,
          AppColors.inStockForeground,
          'In Stock',
        ),
      StatusChipVariant.prescriptionRequired => (
          AppColors.rxBackground,
          AppColors.rxForeground,
          'RX',
        ),
      StatusChipVariant.outOfStock => (
          AppColors.outOfStockBackground,
          AppColors.outOfStockForeground,
          'Out of Stock',
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadii.full),
      ),
      child: Text(
        label ?? defaultLabel,
        style: AppTextStyles.labelMd.copyWith(color: foreground),
      ),
    );
  }
}
