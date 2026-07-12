import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../application/order_providers.dart';
import '../data/order_model.dart';
import 'order_detail_screen.dart';

const _statusFilters = {
  null: 'All',
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'preparing': 'Preparing',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

const _statusLabels = {
  'pending': 'Pending',
  'confirmed': 'Confirmed',
  'preparing': 'Preparing',
  'out_for_delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

/// Every order platform-wide — a pharmacist's order-management home,
/// mirroring the admin panel's Orders page. Tapping an order opens the
/// same [OrderDetailScreen] a customer sees, which shows extra
/// pharmacist-only actions when the signed-in user's role calls for it.
class PharmacistOrdersScreen extends ConsumerStatefulWidget {
  const PharmacistOrdersScreen({super.key});

  @override
  ConsumerState<PharmacistOrdersScreen> createState() => _PharmacistOrdersScreenState();
}

class _PharmacistOrdersScreenState extends ConsumerState<PharmacistOrdersScreen> {
  String? _statusFilter;
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
      ref.read(pharmacistOrdersProvider(_statusFilter).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(pharmacistOrdersProvider(_statusFilter));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Orders')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: Column(
            children: [
              SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                  itemCount: _statusFilters.length,
                  separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    final status = _statusFilters.keys.elementAt(index);
                    final label = _statusFilters.values.elementAt(index);
                    final isSelected = status == _statusFilter;
                    return ChoiceChip(
                      label: Text(label),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _statusFilter = status),
                    );
                  },
                ),
              ),
              Expanded(
                child: state.isLoading
                    ? const LoadingIndicator()
                    : state.error != null
                        ? ErrorView(
                            error: state.error!,
                            onRetry: () =>
                                ref.read(pharmacistOrdersProvider(_statusFilter).notifier).refresh(),
                          )
                        : state.items.isEmpty
                            ? const EmptyState(
                                icon: Icons.receipt_long_outlined,
                                title: 'No orders found',
                              )
                            : RefreshIndicator(
                                onRefresh: () =>
                                    ref.read(pharmacistOrdersProvider(_statusFilter).notifier).refresh(),
                                child: ListView.separated(
                                  controller: _scrollController,
                                  padding: const EdgeInsets.all(AppSpacing.containerMargin),
                                  itemCount: state.items.length + (state.hasMore ? 1 : 0),
                                  separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                                  itemBuilder: (context, index) {
                                    if (index >= state.items.length) {
                                      return const Padding(
                                        padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                                        child: Center(child: CircularProgressIndicator()),
                                      );
                                    }
                                    return _OrderTile(order: state.items[index]);
                                  },
                                ),
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
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
                  '#${order.orderNumber}',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                Chip(label: Text(_statusLabels[order.status] ?? order.status)),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${order.items.length} item(s) • \$${order.total.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
