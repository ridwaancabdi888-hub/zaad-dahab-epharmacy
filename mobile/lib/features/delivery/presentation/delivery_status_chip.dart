import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/theme/app_text_styles.dart';

const deliveryStatusLabels = {
  'pending': 'Pending',
  'assigned': 'Rider Assigned',
  'picked_up': 'Picked Up',
  'in_transit': 'On the Way',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

const _statusInfo = {
  'pending': (background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground),
  'assigned': (background: AppColors.rxBackground, foreground: AppColors.rxForeground),
  'picked_up': (background: AppColors.rxBackground, foreground: AppColors.rxForeground),
  'in_transit': (background: AppColors.rxBackground, foreground: AppColors.rxForeground),
  'delivered': (background: AppColors.inStockBackground, foreground: AppColors.inStockForeground),
  'cancelled': (background: AppColors.errorContainer, foreground: AppColors.onErrorContainer),
};

/// Pill-shaped delivery status indicator, styled consistently with
/// DESIGN.md's "Status Chips" component.
class DeliveryStatusChip extends StatelessWidget {
  const DeliveryStatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final info = _statusInfo[status] ??
        (background: AppColors.outOfStockBackground, foreground: AppColors.outOfStockForeground);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 4),
      decoration: BoxDecoration(color: info.background, borderRadius: BorderRadius.circular(AppRadii.full)),
      child: Text(
        deliveryStatusLabels[status] ?? status,
        style: AppTextStyles.labelMd.copyWith(color: info.foreground),
      ),
    );
  }
}
