import '../../../core/network/api_client.dart';
import 'category_model.dart';
import 'medicine_model.dart';

class MedicinePage {
  const MedicinePage({required this.items, required this.total});

  final List<MedicineModel> items;
  final int total;
}

class CatalogRepository {
  CatalogRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<List<CategoryModel>> fetchCategories() async {
    final data = await _apiClient.get('/categories') as List<dynamic>;
    return data
        .cast<Map<String, dynamic>>()
        .map(CategoryModel.fromJson)
        .toList(growable: false);
  }

  Future<MedicinePage> fetchMedicines({
    String? categoryId,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final data = await _apiClient.get('/medicines', query: {
      'page': page,
      'limit': limit,
      'category': ?categoryId,
      if (search != null && search.isNotEmpty) 'search': search,
    }) as Map<String, dynamic>;

    final items = (data['items'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(MedicineModel.fromJson)
        .toList(growable: false);
    final total = (data['meta'] as Map<String, dynamic>)['total'] as int;

    return MedicinePage(items: items, total: total);
  }

  Future<MedicineModel> fetchMedicineById(String id) async {
    final data = await _apiClient.get('/medicines/$id') as Map<String, dynamic>;
    return MedicineModel.fromJson(data);
  }
}
