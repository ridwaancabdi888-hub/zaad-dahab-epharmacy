import '../../../core/network/api_client.dart';
import 'delivery_model.dart';

class DeliveryPage {
  const DeliveryPage({required this.items, required this.total});

  final List<DeliveryModel> items;
  final int total;
}

class DeliveryRepository {
  DeliveryRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<DeliveryModel> getById(String id) async {
    final json = await _apiClient.get('/deliveries/$id') as Map<String, dynamic>;
    return DeliveryModel.fromJson(json);
  }

  Future<DeliveryModel> getByOrderId(String orderId) async {
    final json = await _apiClient.get('/deliveries/order/$orderId') as Map<String, dynamic>;
    return DeliveryModel.fromJson(json);
  }

  /// Deliveries assigned to the current rider. Server-scoped by role, so a
  /// rider only ever sees their own assignments.
  Future<DeliveryPage> listMine({int page = 1, int limit = 20, String? status}) async {
    final json = await _apiClient.get('/deliveries', query: {
      'page': page,
      'limit': limit,
      'status': ?status,
    }) as Map<String, dynamic>;

    final items = (json['items'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(DeliveryModel.fromJson)
        .toList(growable: false);
    final total = (json['meta'] as Map<String, dynamic>)['total'] as int;

    return DeliveryPage(items: items, total: total);
  }

  Future<DeliveryModel> updateStatus(String id, String status) async {
    final json = await _apiClient.patch('/deliveries/$id/status', data: {
      'status': status,
    }) as Map<String, dynamic>;
    return DeliveryModel.fromJson(json);
  }

  Future<DeliveryModel> updateLocation(String id, {required double lat, required double lng}) async {
    final json = await _apiClient.patch('/deliveries/$id/location', data: {
      'lat': lat,
      'lng': lng,
    }) as Map<String, dynamic>;
    return DeliveryModel.fromJson(json);
  }
}
