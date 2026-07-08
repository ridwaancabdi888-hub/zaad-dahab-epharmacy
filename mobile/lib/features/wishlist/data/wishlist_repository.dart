import '../../../core/network/api_client.dart';
import '../../catalog/data/medicine_model.dart';

class WishlistRepository {
  WishlistRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<List<MedicineModel>> _parse(dynamic data) {
    return Future.value(
      (data as List<dynamic>).cast<Map<String, dynamic>>().map(MedicineModel.fromJson).toList(
            growable: false,
          ),
    );
  }

  Future<List<MedicineModel>> getWishlist() async {
    final data = await _apiClient.get('/users/me/wishlist');
    return _parse(data);
  }

  Future<List<MedicineModel>> add(String medicineId) async {
    final data = await _apiClient.post('/users/me/wishlist/$medicineId');
    return _parse(data);
  }

  Future<List<MedicineModel>> remove(String medicineId) async {
    final data = await _apiClient.delete('/users/me/wishlist/$medicineId');
    return _parse(data);
  }
}
