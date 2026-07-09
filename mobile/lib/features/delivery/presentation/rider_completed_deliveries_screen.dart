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
import 'rider_delivery_detail_screen.dart';

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _formatDate(DateTime date) {
  return '${_months[date.month - 1]} ${date.day}, ${date.year}';
}

/// The rider's history of deliveries they've completed.
class RiderCompletedDeliveriesScreen extends ConsumerStatefulWidget {
  const RiderCompletedDeliveriesScreen({super.key});

  @override
  ConsumerState<RiderCompletedDeliveriesScreen> createState() =>
      _RiderCompletedDeliveriesScreenState();
}

class _RiderCompletedDeliveriesScreenState extends ConsumerState<RiderCompletedDeliveriesScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(riderCompletedDeliveriesProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(riderCompletedDeliveriesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Completed Deliveries')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: Builder(
            builder: (context) {
              if (state.isLoading) return const LoadingIndicator();
              if (state.error != null) {
                return ErrorView(
                  error: state.error!,
                  onRetry: () => ref.read(riderCompletedDeliveriesProvider.notifier).refresh(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: Icons.task_alt_outlined,
                  title: 'No completed deliveries yet',
                  message: 'Deliveries you finish will show up here.',
                );
              }
              return RefreshIndicator(
                onRefresh: () => ref.read(riderCompletedDeliveriesProvider.notifier).refresh(),
                child: ListView.separated(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(AppSpacing.containerMargin),
                  itemCount: state.items.length + (state.hasMore ? 1 : 0),
                  separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    if (index >= state.items.length) {
                      return const InlineLoadingIndicator();
                    }
                    return _CompletedTile(delivery: state.items[index]);
                  },
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _CompletedTile extends StatelessWidget {
  const _CompletedTile({required this.delivery});

  final DeliveryModel delivery;

  @override
  Widget build(BuildContext context) {
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
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: AppColors.primary),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    delivery.order != null ? '#${delivery.order!.orderNumber}' : 'Order',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '${delivery.address.street}, ${delivery.address.city}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            if (delivery.deliveredAt != null)
              Text(_formatDate(delivery.deliveredAt!), style: Theme.of(context).textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
