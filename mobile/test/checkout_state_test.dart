import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/auth/data/user_model.dart';
import 'package:zaad_dahab_mobile/features/checkout/application/checkout_controller.dart';
import 'package:zaad_dahab_mobile/features/orders/data/order_quote_model.dart';

const _address = UserAddress(id: 'addr1', label: 'Home', street: '1 Main St', city: 'Hargeisa');

const _quote = OrderQuote(
  subtotal: 20,
  deliveryFee: 2,
  tax: 0.4,
  discount: 0,
  total: 22.4,
  prescriptionRequired: false,
);

void main() {
  group('CheckoutState.copyWith', () {
    test('defaults to zaad with no address and a loading quote', () {
      const state = CheckoutState();
      expect(state.selectedAddress, isNull);
      expect(state.paymentMethod, 'zaad');
      expect(state.appliedCouponCode, isNull);
      expect(state.quote, isA<AsyncLoading<OrderQuote>>());
    });

    test('updates only the fields passed to it', () {
      const state = CheckoutState(paymentMethod: 'cod', couponCode: 'SAVE10');
      final next = state.copyWith(selectedAddress: _address);

      expect(next.selectedAddress, _address);
      expect(next.paymentMethod, 'cod');
      expect(next.couponCode, 'SAVE10');
    });

    test('clearAppliedCouponCode removes the applied coupon without touching couponCode text', () {
      const state = CheckoutState(couponCode: 'SAVE10', appliedCouponCode: 'SAVE10');
      final next = state.copyWith(clearAppliedCouponCode: true);

      expect(next.couponCode, 'SAVE10');
      expect(next.appliedCouponCode, isNull);
    });

    test('carries a resolved quote and applied coupon code', () {
      const state = CheckoutState();
      final next = state.copyWith(
        quote: const AsyncValue.data(_quote),
        appliedCouponCode: 'SAVE10',
      );

      expect(next.quote.value, _quote);
      expect(next.appliedCouponCode, 'SAVE10');
    });
  });
}
