import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/data/user_model.dart';
import '../../orders/presentation/order_confirmation_screen.dart';
import '../application/checkout_controller.dart';
import 'address_form_sheet.dart';

const _paymentMethodInfo = {
  'zaad': (label: 'Zaad Service', subtitle: 'Instant mobile payment', icon: Icons.phone_iphone),
  'edahab': (label: 'e-Dahab', subtitle: 'Secure Dahabshiil wallet', icon: Icons.account_balance_wallet_outlined),
  'cod': (label: 'Cash on Delivery', subtitle: 'Pay when you receive', icon: Icons.payments_outlined),
};

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _payerPhoneController = TextEditingController();

  @override
  void dispose() {
    _payerPhoneController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final controller = ref.read(checkoutControllerProvider.notifier);
    try {
      final result = await controller.placeOrder();
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => OrderConfirmationScreen(order: result.order, payment: result.payment),
          ),
        );
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } on StateError catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final checkoutState = ref.watch(checkoutControllerProvider);
    final controller = ref.read(checkoutControllerProvider.notifier);
    final quote = checkoutState.quote.valueOrNull;
    final prescriptionBlocked = quote?.prescriptionRequired ?? false;
    final phoneMissing = checkoutState.requiresPayerPhone && checkoutState.payerPhone.trim().isEmpty;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Checkout')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.containerMargin),
            children: [
              Text('Delivery Address', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              if (user == null || user.addresses.isEmpty)
                Text(
                  'You have no saved addresses yet.',
                  style: Theme.of(context).textTheme.bodyMedium,
                )
              else
                RadioGroup<String>(
                  groupValue: checkoutState.selectedAddress?.id,
                  onChanged: (id) => controller.selectAddress(
                    user.addresses.firstWhere((a) => a.id == id),
                  ),
                  child: Column(
                    children: [
                      for (final address in user.addresses) _AddressTile(address: address),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                onPressed: () => showAddAddressSheet(context),
                icon: const Icon(Icons.add_location_alt_outlined),
                label: const Text('Add New Address'),
              ),
              const SizedBox(height: AppSpacing.lg),
              Text('Payment Method', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              RadioGroup<String>(
                groupValue: checkoutState.paymentMethod,
                onChanged: (method) {
                  if (method != null) controller.selectPaymentMethod(method);
                },
                child: Column(
                  children: [
                    for (final method in paymentMethods) _PaymentMethodTile(method: method),
                  ],
                ),
              ),
              if (checkoutState.requiresPayerPhone) ...[
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: _payerPhoneController,
                  keyboardType: TextInputType.phone,
                  onChanged: controller.setPayerPhone,
                  decoration: const InputDecoration(
                    labelText: 'Phone number to charge',
                    hintText: '+2526XXXXXXX',
                    prefixIcon: Icon(Icons.phone_iphone),
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              Text('Order Summary', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              checkoutState.quote.when(
                data: (q) => Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(AppRadii.lg),
                    border: Border.all(color: AppColors.surfaceContainerHigh),
                  ),
                  child: Column(
                    children: [
                      _row(context, 'Subtotal', q.subtotal),
                      _row(context, 'Delivery Fee', q.deliveryFee),
                      _row(context, 'Tax', q.tax),
                      if (q.discount > 0) _row(context, 'Discount', -q.discount),
                      const Divider(),
                      _row(context, 'Total', q.total, emphasize: true),
                    ],
                  ),
                ),
                loading: () => const LoadingIndicator(),
                error: (error, _) => ErrorView(error: error, onRetry: controller.refreshQuote),
              ),
              if (prescriptionBlocked) ...[
                const SizedBox(height: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: AppColors.errorContainer,
                    borderRadius: BorderRadius.circular(AppRadii.md),
                  ),
                  child: Text(
                    'Your cart contains a prescription item. Prescription upload isn\'t '
                    'available in the app yet — please remove it to continue.',
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.onErrorContainer),
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              GradientButton(
                label: 'Confirm Order',
                isLoading: checkoutState.isPlacingOrder,
                onPressed: checkoutState.selectedAddress == null ||
                        checkoutState.quote.valueOrNull == null ||
                        prescriptionBlocked ||
                        phoneMissing
                    ? null
                    : _placeOrder,
              ),
            ],
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

class _AddressTile extends StatelessWidget {
  const _AddressTile({required this.address});

  final UserAddress address;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      color: AppColors.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.lg)),
      child: RadioListTile<String>(
        value: address.id,
        title: Text(address.label, style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text('${address.street}, ${address.city}'),
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  const _PaymentMethodTile({required this.method});

  final String method;

  @override
  Widget build(BuildContext context) {
    final info = _paymentMethodInfo[method]!;
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      color: AppColors.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.lg)),
      child: RadioListTile<String>(
        value: method,
        secondary: Icon(info.icon, color: AppColors.primary),
        title: Text(info.label, style: Theme.of(context).textTheme.bodyLarge),
        subtitle: Text(info.subtitle),
      ),
    );
  }
}
