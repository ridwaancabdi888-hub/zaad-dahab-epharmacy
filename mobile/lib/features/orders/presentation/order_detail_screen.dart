import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../checkout/application/checkout_controller.dart';
import '../../delivery/presentation/delivery_tracking_section.dart';
import '../../payments/application/payment_providers.dart';
import '../../payments/presentation/payment_status_card.dart';
import '../data/order_model.dart';

final orderByIdProvider = FutureProvider.autoDispose.family<OrderModel, String>((ref, id) {
  return ref.watch(orderRepositoryProvider).getById(id);
});

const _statusLabels = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'preparing': 'Preparing',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderByIdProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Order Details')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: orderAsync.when(
            data: (order) => ListView(
              padding: const EdgeInsets.all(AppSpacing.containerMargin),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${order.orderNumber}', style: Theme.of(context).textTheme.headlineMedium),
                    Chip(label: Text(_statusLabels[order.status] ?? order.status)),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Text('Items', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: AppSpacing.sm),
                for (final item in order.items) _ItemRow(item: item),
                const SizedBox(height: AppSpacing.lg),
                Text('Delivery Address', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${order.deliveryAddress.label} — ${order.deliveryAddress.street}, '
                  '${order.deliveryAddress.city}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.lg),
                DeliveryTrackingSection(orderId: orderId),
                const SizedBox(height: AppSpacing.lg),
                ref.watch(paymentByOrderIdProvider(orderId)).when(
                      data: (payment) => PaymentStatusCard(
                        payment: payment,
                        onChanged: (_) => ref.invalidate(paymentByOrderIdProvider(orderId)),
                      ),
                      loading: () => const LoadingIndicator(),
                      error: (error, _) => ErrorView(
                        error: error,
                        onRetry: () => ref.invalidate(paymentByOrderIdProvider(orderId)),
                      ),
                    ),
                const SizedBox(height: AppSpacing.lg),
                Text('Order Summary', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(AppRadii.lg),
                    border: Border.all(color: AppColors.surfaceContainerHigh),
                  ),
                  child: Column(
                    children: [
                      _row(context, 'Subtotal', order.subtotal),
                      _row(context, 'Delivery Fee', order.deliveryFee),
                      _row(context, 'Tax', order.tax),
                      if (order.discount > 0) _row(context, 'Discount', -order.discount),
                      const Divider(),
                      _row(context, 'Total', order.total, emphasize: true),
                    ],
                  ),
                ),
              ],
            ),
            loading: () => const LoadingIndicator(),
            error: (error, _) =>
                ErrorView(error: error, onRetry: () => ref.invalidate(orderByIdProvider(orderId))),
          ),
        ),
      ),
    );
  }

  Widget _row(BuildContext context, String label, double value, {bool emphasize = false}) {
    final style = emphasize
        ? Theme.of(context).textTheme.headlineMedium
        : Theme.of(context).textTheme.bodyLarge;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: emphasize ? style : Theme.of(context).textTheme.bodyMedium),
          Text(
            '${value < 0 ? '-' : ''}\$${value.abs().toStringAsFixed(2)}',
            style: style?.copyWith(color: emphasize ? AppColors.primary : null),
          ),
        ],
      ),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final OrderItemModel item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: Theme.of(context).textTheme.bodyLarge),
                Text('${item.unit} × ${item.quantity}', style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          Text('\$${item.lineTotal.toStringAsFixed(2)}', style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}
