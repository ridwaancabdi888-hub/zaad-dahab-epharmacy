import '../../../core/network/api_client.dart';
import 'cart_model.dart';

class CartRepository {
  CartRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<CartModel> getCart() async {
    final data = await _apiClient.get('/cart') as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> addItem(String medicineId, {int quantity = 1}) async {
    final data = await _apiClient.post('/cart/items', data: {
      'medicineId': medicineId,
      'quantity': quantity,
    }) as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> updateItemQuantity(String medicineId, int quantity) async {
    final data = await _apiClient.patch('/cart/items/$medicineId', data: {
      'quantity': quantity,
    }) as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> removeItem(String medicineId) async {
    final data = await _apiClient.delete('/cart/items/$medicineId') as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }

  Future<CartModel> clear() async {
    final data = await _apiClient.delete('/cart') as Map<String, dynamic>;
    return CartModel.fromJson(data);
  }
}
