import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/data/user_model.dart';
import '../../cart/application/cart_controller.dart';
import '../../orders/data/order_model.dart';
import '../../orders/data/order_quote_model.dart';
import '../../orders/data/order_repository.dart';

const paymentMethods = ['zaad', 'edahab', 'cod'];

final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository(apiClient: ref.watch(apiClientProvider));
});

class CheckoutState {
  const CheckoutState({
    this.selectedAddress,
    this.paymentMethod = 'zaad',
    this.couponCode = '',
    this.appliedCouponCode,
    this.quote = const AsyncValue.loading(),
    this.isPlacingOrder = false,
  });

  final UserAddress? selectedAddress;
  final String paymentMethod;
  final String couponCode;
  final String? appliedCouponCode;
  final AsyncValue<OrderQuote> quote;
  final bool isPlacingOrder;

  CheckoutState copyWith({
    UserAddress? selectedAddress,
    String? paymentMethod,
    String? couponCode,
    String? appliedCouponCode,
    bool clearAppliedCouponCode = false,
    AsyncValue<OrderQuote>? quote,
    bool? isPlacingOrder,
  }) {
    return CheckoutState(
      selectedAddress: selectedAddress ?? this.selectedAddress,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      couponCode: couponCode ?? this.couponCode,
      appliedCouponCode: clearAppliedCouponCode ? null : (appliedCouponCode ?? this.appliedCouponCode),
      quote: quote ?? this.quote,
      isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
    );
  }
}

final checkoutControllerProvider =
    StateNotifierProvider.autoDispose<CheckoutController, CheckoutState>((ref) {
  final controller = CheckoutController(ref);
  final addresses = ref.read(authControllerProvider).user?.addresses ?? [];
  final defaultAddress = addresses.isEmpty
      ? null
      : addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);
  if (defaultAddress != null) {
    controller.selectAddress(defaultAddress);
  } else {
    controller.refreshQuote();
  }
  return controller;
});

class CheckoutController extends StateNotifier<CheckoutState> {
  CheckoutController(this._ref) : super(const CheckoutState());

  final Ref _ref;

  void selectAddress(UserAddress address) {
    state = state.copyWith(selectedAddress: address);
  }

  void selectPaymentMethod(String method) {
    state = state.copyWith(paymentMethod: method);
  }

  void setCouponCode(String code) {
    state = state.copyWith(couponCode: code);
  }

  Future<void> applyCoupon() async {
    await refreshQuote(couponCode: state.couponCode.trim());
  }

  void removeCoupon() {
    state = state.copyWith(couponCode: '', clearAppliedCouponCode: true);
    refreshQuote();
  }

  Future<void> refreshQuote({String? couponCode}) async {
    state = state.copyWith(quote: const AsyncValue.loading());
    final code = couponCode ?? state.appliedCouponCode;
    final result = await AsyncValue.guard(
      () => _ref.read(orderRepositoryProvider).quote(couponCode: code),
    );
    state = state.copyWith(
      quote: result,
      appliedCouponCode: result.hasError ? null : (code?.isEmpty ?? true ? null : code),
    );
  }

  Future<OrderModel> placeOrder() async {
    final address = state.selectedAddress;
    if (address == null) {
      throw StateError('Select a delivery address first');
    }

    state = state.copyWith(isPlacingOrder: true);
    try {
      final order = await _ref.read(orderRepositoryProvider).checkout(
            label: address.label,
            street: address.street,
            city: address.city,
            paymentMethod: state.paymentMethod,
            couponCode: state.appliedCouponCode,
          );
      await _ref.read(cartControllerProvider.notifier).refresh();
      return order;
    } finally {
      if (mounted) state = state.copyWith(isPlacingOrder: false);
    }
  }
}
