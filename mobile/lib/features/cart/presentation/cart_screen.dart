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
import '../../checkout/application/checkout_controller.dart';
import '../../checkout/presentation/checkout_screen.dart';
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

class _OrderSummaryCard extends ConsumerStatefulWidget {
  const _OrderSummaryCard({required this.cart});

  final CartModel cart;

  @override
  ConsumerState<_OrderSummaryCard> createState() => _OrderSummaryCardState();
}

class _OrderSummaryCardState extends ConsumerState<_OrderSummaryCard> {
  late final _couponController = TextEditingController(
    text: ref.read(checkoutControllerProvider).couponCode,
  );
  double? _lastSubtotal;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // The quote is priced off the live cart, so re-fetch it whenever the
    // cart's subtotal changes (quantity edits, item removal, ...).
    if (_lastSubtotal != widget.cart.subtotal) {
      _lastSubtotal = widget.cart.subtotal;
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => ref.read(checkoutControllerProvider.notifier).refreshQuote(),
      );
    }

    final checkoutState = ref.watch(checkoutControllerProvider);
    final checkoutController = ref.read(checkoutControllerProvider.notifier);

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
            children: [
              Expanded(
                child: TextField(
                  controller: _couponController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(hintText: 'Promo Code'),
                  onChanged: checkoutController.setCouponCode,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              TextButton(
                onPressed: checkoutState.quote.isLoading
                    ? null
                    : () => runCatchingApi(context, checkoutController.applyCoupon),
                child: const Text('Apply'),
              ),
            ],
          ),
          if (checkoutState.appliedCouponCode != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                children: [
                  Icon(Icons.local_offer_outlined, size: 16, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    '"${checkoutState.appliedCouponCode}" applied',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.primary),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      _couponController.clear();
                      checkoutController.removeCoupon();
                    },
                    child: const Text('Remove'),
                  ),
                ],
              ),
            ),
          const SizedBox(height: AppSpacing.md),
          checkoutState.quote.when(
            data: (quote) => Column(
              children: [
                _SummaryRow(label: 'Subtotal (${widget.cart.itemCount} items)', value: quote.subtotal),
                _SummaryRow(
                  label: 'Delivery Fee',
                  value: quote.deliveryFee,
                  valueLabel: quote.deliveryFee == 0 ? 'FREE' : null,
                ),
                _SummaryRow(label: 'Tax', value: quote.tax),
                if (quote.discount > 0) _SummaryRow(label: 'Discount', value: -quote.discount),
                const Divider(height: AppSpacing.lg),
                _SummaryRow(label: 'Total', value: quote.total, emphasize: true),
              ],
            ),
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: LoadingIndicator(size: 20),
            ),
            error: (error, _) =>
                ErrorView(error: error, onRetry: () => checkoutController.refreshQuote()),
          ),
          const SizedBox(height: AppSpacing.md),
          GradientButton(
            label: 'Proceed to Checkout',
            icon: Icons.arrow_forward,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CheckoutScreen()),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueLabel,
    this.emphasize = false,
  });

  final String label;
  final double value;
  final String? valueLabel;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
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
            valueLabel ?? '${value < 0 ? '-' : ''}\$${value.abs().toStringAsFixed(2)}',
            style: style?.copyWith(color: emphasize || valueLabel != null ? AppColors.primary : null),
          ),
        ],
      ),
    );
  }
}
