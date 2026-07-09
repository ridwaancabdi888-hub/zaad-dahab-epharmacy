import '../../../core/network/api_client.dart';
import 'payment_model.dart';

class PaymentPage {
  const PaymentPage({required this.items, required this.total});

  final List<PaymentModel> items;
  final int total;
}

class PaymentRepository {
  PaymentRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<PaymentModel> getById(String id) async {
    final json = await _apiClient.get('/payments/$id') as Map<String, dynamic>;
    return PaymentModel.fromJson(json);
  }

  Future<PaymentModel> getByOrderId(String orderId) async {
    final json = await _apiClient.get('/payments/order/$orderId') as Map<String, dynamic>;
    return PaymentModel.fromJson(json);
  }

  Future<PaymentModel> verify(String id) async {
    final json = await _apiClient.post('/payments/$id/verify') as Map<String, dynamic>;
    return PaymentModel.fromJson(json);
  }

  Future<PaymentModel> retry(String id) async {
    final json = await _apiClient.post('/payments/$id/retry') as Map<String, dynamic>;
    return PaymentModel.fromJson(json);
  }

  Future<PaymentPage> listMine({int page = 1, int limit = 20, String? status}) async {
    final json = await _apiClient.get('/payments/me', query: {
      'page': page,
      'limit': limit,
      'status': ?status,
    }) as Map<String, dynamic>;

    final items = (json['items'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(PaymentModel.fromJson)
        .toList(growable: false);
    final total = (json['meta'] as Map<String, dynamic>)['total'] as int;

    return PaymentPage(items: items, total: total);
  }
}
