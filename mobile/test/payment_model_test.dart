import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/payments/data/payment_model.dart';

void main() {
  group('PaymentModel.fromJson', () {
    test('handles a bare order id string (getById/getByOrderId/verify/retry shape)', () {
      final payment = PaymentModel.fromJson({
        '_id': 'pay1',
        'order': 'order1',
        'method': 'zaad',
        'amount': 22.4,
        'currency': 'USD',
        'status': 'processing',
        'providerReference': 'ZAAD-1234567',
        'attempts': 1,
        'createdAt': '2026-01-01T00:00:00.000Z',
      });

      expect(payment.orderId, 'order1');
      expect(payment.orderNumber, isNull);
      expect(payment.isProcessing, isTrue);
      expect(payment.isFailed, isFalse);
      expect(payment.isCompleted, isFalse);
    });

    test('handles a populated order object (transaction history shape)', () {
      final payment = PaymentModel.fromJson({
        '_id': 'pay2',
        'order': {'_id': 'order2', 'orderNumber': 'ZD-123456'},
        'method': 'cod',
        'amount': 10,
        'currency': 'USD',
        'status': 'completed',
        'providerReference': 'COD-order2',
        'failureReason': '',
        'attempts': 1,
        'paidAt': '2026-01-02T00:00:00.000Z',
        'createdAt': '2026-01-01T00:00:00.000Z',
      });

      expect(payment.orderId, 'order2');
      expect(payment.orderNumber, 'ZD-123456');
      expect(payment.isCompleted, isTrue);
      expect(payment.paidAt, isNotNull);
    });

    test('surfaces a failure reason for a failed payment', () {
      final payment = PaymentModel.fromJson({
        '_id': 'pay3',
        'order': 'order3',
        'method': 'edahab',
        'amount': 15,
        'currency': 'USD',
        'status': 'failed',
        'providerReference': 'EDAHAB-7654321',
        'failureReason': 'insufficient_funds',
        'attempts': 1,
        'createdAt': '2026-01-01T00:00:00.000Z',
      });

      expect(payment.isFailed, isTrue);
      expect(payment.failureReason, 'insufficient_funds');
    });
  });
}
