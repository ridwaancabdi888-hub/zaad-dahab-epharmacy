import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/responsive_center.dart';
import '../data/order_model.dart';
import 'order_detail_screen.dart';

/// Shown immediately after a successful checkout, matching the reference
/// design's "Order Placed Successfully!" screen.
class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key, required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: ResponsiveCenter(
          padding: const EdgeInsets.all(AppSpacing.containerMargin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: const BoxDecoration(
                  color: AppColors.inStockBackground,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.primary, size: 64),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Order Placed Successfully!',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .headlineLarge
                    ?.copyWith(color: AppColors.primary),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Your health is our priority. We\'ve started preparing your items.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                  border: Border.all(color: AppColors.surfaceContainerHigh),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Order ID', style: Theme.of(context).textTheme.bodyMedium),
                    Text(
                      '#${order.orderNumber}',
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              GradientButton(
                label: 'Track Order',
                icon: Icons.local_shipping_outlined,
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: () => context.go(RoutePaths.home),
                icon: const Icon(Icons.home_outlined),
                label: const Text('Go to Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
