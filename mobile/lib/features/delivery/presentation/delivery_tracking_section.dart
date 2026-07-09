import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../application/delivery_providers.dart';
import 'delivery_map_view.dart';
import 'delivery_status_chip.dart';
import 'delivery_status_timeline.dart';

String _formatTime(DateTime time) {
  final hour12 = time.hour % 12 == 0 ? 12 : time.hour % 12;
  final period = time.hour < 12 ? 'AM' : 'PM';
  final minute = time.minute.toString().padLeft(2, '0');
  return '$hour12:$minute $period';
}

/// Customer-facing order tracking: rider info, live map, ETA, and status
/// timeline. Shown on the order detail screen for any order that has a
/// delivery record — an order still `pending`/`preparing` won't have one
/// yet, which surfaces as a 404 that this widget quietly treats as "not
/// out for delivery yet" rather than an error.
class DeliveryTrackingSection extends ConsumerWidget {
  const DeliveryTrackingSection({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliveryAsync = ref.watch(deliveryByOrderIdProvider(orderId));

    return deliveryAsync.when(
      data: (delivery) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Delivery Tracking', style: Theme.of(context).textTheme.headlineMedium),
                DeliveryStatusChip(status: delivery.status),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            if (delivery.rider != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Text(
                  'Rider: ${delivery.rider!.name}${delivery.rider!.phone != null ? ' • ${delivery.rider!.phone}' : ''}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            if (delivery.address.hasCoordinates) ...[
              DeliveryMapView(
                destinationLat: delivery.address.lat!,
                destinationLng: delivery.address.lng!,
                riderLat: delivery.currentLocation.lat,
                riderLng: delivery.currentLocation.lng,
              ),
              const SizedBox(height: AppSpacing.sm),
            ],
            if (delivery.hasEta)
              Text(
                'Estimated arrival: ${_formatTime(delivery.estimatedDeliveryStart!)} – '
                '${_formatTime(delivery.estimatedDeliveryEnd!)}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary),
              ),
            const SizedBox(height: AppSpacing.sm),
            DeliveryStatusTimeline(events: delivery.statusHistory),
          ],
        );
      },
      loading: () => const LoadingIndicator(),
      error: (error, _) {
        if (error is ApiException && error.statusCode == 404) {
          return const SizedBox.shrink();
        }
        return ErrorView(error: error, onRetry: () => ref.invalidate(deliveryByOrderIdProvider(orderId)));
      },
    );
  }
}
