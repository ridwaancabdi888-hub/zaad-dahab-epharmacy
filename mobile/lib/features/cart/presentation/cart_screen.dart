import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/utils/run_catching.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../application/cart_controller.dart';
import '../data/cart_model.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartAsync = ref.watch(cartControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text('Your Cart${cartAsync.valueOrNull != null ? ' (${cartAsync.value!.itemCount})' : ''}'),
        actions: [
          if ((cartAsync.valueOrNull?.items.length ?? 0) > 0)
            TextButton.icon(
              onPressed: () =>
                  runCatchingApi(context, ref.read(cartControllerProvider.notifier).clear),
              icon: const Icon(Icons.delete_outline, size: 18),
              label: const Text('Clear All'),
            ),
        ],
      ),
      body: SafeArea(
        child: ResponsiveCenter(
          child: RefreshIndicator(
            onRefresh: () => ref.read(cartControllerProvider.notifier).refresh(),
            child: cartAsync.when(
              data: (cart) => cart.items.isEmpty
                  ? const EmptyState(
                      icon: Icons.shopping_cart_outlined,
                      title: 'Your cart is empty',
                      message: 'Browse categories and add products to see them here.',
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AppSpacing.containerMargin),
                      children: [
                        for (final item in cart.items) ...[
                          _CartItemTile(item: item),
                          const SizedBox(height: AppSpacing.sm),
                        ],
                        const SizedBox(height: AppSpacing.md),
                        _OrderSummaryCard(cart: cart),
                      ],
                    ),
              loading: () => const LoadingIndicator(),
              error: (error, _) => ErrorView(
                error: error,
                onRetry: () => ref.read(cartControllerProvider.notifier).refresh(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CartItemTile extends ConsumerWidget {
  const _CartItemTile({required this.item});

  final CartItemModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(cartControllerProvider.notifier);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.lg),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(AppRadii.md),
            ),
            child: const Icon(Icons.medication_outlined, color: AppColors.outline),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.medicine.categoryName != null)
                  Text(
                    item.medicine.categoryName!.toUpperCase(),
                    style: Theme.of(context)
                        .textTheme
                        .labelMedium
                        ?.copyWith(color: AppColors.primary),
                  ),
                Text(item.medicine.name, style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.onSurface,
                      fontWeight: FontWeight.w600,
                    )),
                Text(item.medicine.unit, style: Theme.of(context).textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: [
                    _QuantityStepper(
                      quantity: item.quantity,
                      onDecrement: () => runCatchingApi(
                        context,
                        () => controller.updateItemQuantity(item.medicine.id, item.quantity - 1),
                      ),
                      onIncrement: () =>
                          runCatchingApi(context, () => controller.addItem(item.medicine.id)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            '\$${item.lineTotal.toStringAsFixed(2)}',
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _QuantityStepper extends StatelessWidget {
  const _QuantityStepper({
    required this.quantity,
    required this.onDecrement,
    required this.onIncrement,
  });

  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(AppRadii.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.remove, size: 16),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
            onPressed: onDecrement,
          ),
          SizedBox(
            width: 20,
            child: Text('$quantity', textAlign: TextAlign.center),
          ),
          IconButton(
            icon: const Icon(Icons.add, size: 16),
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            padding: EdgeInsets.zero,
            onPressed: onIncrement,
          ),
        ],
      ),
    );
  }
}

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.cart});

  final CartModel cart;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.xl),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Order Summary', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Subtotal (${cart.itemCount} items)',
                  style: Theme.of(context).textTheme.bodyMedium),
              Text('\$${cart.subtotal.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.bodyLarge),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Delivery fee and tax are calculated at checkout.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.outline),
          ),
          const SizedBox(height: AppSpacing.md),
          GradientButton(
            label: 'Proceed to Checkout',
            icon: Icons.arrow_forward,
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Checkout is coming in the next update')),
            ),
          ),
        ],
      ),
    );
  }
}
