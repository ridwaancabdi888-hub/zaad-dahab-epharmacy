import '../../../core/network/api_client.dart';
import '../../payments/data/payment_model.dart';
import 'order_model.dart';
import 'order_quote_model.dart';

class CheckoutResult {
  const CheckoutResult({required this.order, required this.payment});

  final OrderModel order;
  final PaymentModel payment;
}

class OrderRepository {
  OrderRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<OrderQuote> quote({String? couponCode}) async {
    final json = await _apiClient.post('/orders/quote', data: {
      if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
    }) as Map<String, dynamic>;
    return OrderQuote.fromJson(json);
  }

  Future<CheckoutResult> checkout({
    required String label,
    required String street,
    required String city,
    required String paymentMethod,
    String? couponCode,
    String? prescriptionImage,
    String? payerPhone,
  }) async {
    final json = await _apiClient.post('/orders', data: {
      'deliveryAddress': {'label': label, 'street': street, 'city': city},
      'paymentMethod': paymentMethod,
      if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
      if (prescriptionImage != null && prescriptionImage.isNotEmpty)
        'prescriptionImage': prescriptionImage,
      if (payerPhone != null && payerPhone.isNotEmpty) 'payerPhone': payerPhone,
    }) as Map<String, dynamic>;
    return CheckoutResult(
      order: OrderModel.fromJson(json['order'] as Map<String, dynamic>),
      payment: PaymentModel.fromJson(json['payment'] as Map<String, dynamic>),
    );
  }

  Future<OrderModel> getById(String orderId) async {
    final json = await _apiClient.get('/orders/$orderId') as Map<String, dynamic>;
    return OrderModel.fromJson(json);
  }
}
