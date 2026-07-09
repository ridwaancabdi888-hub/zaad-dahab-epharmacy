import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/theme/app_text_styles.dart';

const _statusInfo = {
  'pending': (label: 'Pending', background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground),
  'processing': (label: 'Processing', background: AppColors.rxBackground, foreground: AppColors.rxForeground),
  'completed': (label: 'Completed', background: AppColors.inStockBackground, foreground: AppColors.inStockForeground),
  'failed': (label: 'Failed', background: AppColors.errorContainer, foreground: AppColors.onErrorContainer),
  'refunded': (label: 'Refunded', background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground),
  'cancelled': (label: 'Cancelled', background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground),
};

/// Pill-shaped payment status indicator, styled consistently with
/// DESIGN.md's "Status Chips" component.
class PaymentStatusChip extends StatelessWidget {
  const PaymentStatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final info = _statusInfo[status] ??
        (label: status, background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(color: info.background, borderRadius: BorderRadius.circular(AppRadii.full)),
      child: Text(info.label, style: AppTextStyles.labelMd.copyWith(color: info.foreground)),
    );
  }
}
