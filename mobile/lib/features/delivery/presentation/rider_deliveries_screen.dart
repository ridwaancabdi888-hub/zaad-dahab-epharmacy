import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../application/delivery_providers.dart';
import '../data/delivery_model.dart';
import 'delivery_status_chip.dart';
import 'rider_delivery_detail_screen.dart';

String _etaLabel(DeliveryModel delivery) {
  if (!delivery.hasEta) return '';
  final start = delivery.estimatedDeliveryStart!;
  final hour12 = start.hour % 12 == 0 ? 12 : start.hour % 12;
  final period = start.hour < 12 ? 'AM' : 'PM';
  final minute = start.minute.toString().padLeft(2, '0');
  return 'ETA ~$hour12:$minute $period';
}

/// The rider's home screen: every delivery currently assigned to them
/// that isn't finished yet (assigned/picked_up/in_transit).
class RiderDeliveriesScreen extends ConsumerWidget {
  const RiderDeliveriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliveriesAsync = ref.watch(riderActiveDeliveriesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Active Deliveries')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(riderActiveDeliveriesProvider),
            child: deliveriesAsync.when(
              data: (deliveries) => deliveries.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          icon: Icons.local_shipping_outlined,
                          title: 'No active deliveries',
                          message: 'New deliveries assigned to you will show up here.',
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(AppSpacing.containerMargin),
                      itemCount: deliveries.length,
                      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, index) => _DeliveryTile(delivery: deliveries[index]),
                    ),
              loading: () => const LoadingIndicator(),
              error: (error, _) =>
                  ErrorView(error: error, onRetry: () => ref.invalidate(riderActiveDeliveriesProvider)),
            ),
          ),
        ),
      ),
    );
  }
}

class _DeliveryTile extends StatelessWidget {
  const _DeliveryTile({required this.delivery});

  final DeliveryModel delivery;

  @override
  Widget build(BuildContext context) {
    final eta = _etaLabel(delivery);

    return InkWell(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => RiderDeliveryDetailScreen(deliveryId: delivery.id)),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  delivery.order != null ? '#${delivery.order!.orderNumber}' : 'Order',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                DeliveryStatusChip(status: delivery.status),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${delivery.address.label} — ${delivery.address.street}, ${delivery.address.city}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (delivery.order?.customerName != null) ...[
              const SizedBox(height: 2),
              Text(
                'Customer: ${delivery.order!.customerName}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            if (eta.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(eta, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary)),
            ],
          ],
        ),
      ),
    );
  }
}
