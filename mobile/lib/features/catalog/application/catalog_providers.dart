import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/catalog_repository.dart';
import '../data/category_model.dart';
import '../data/medicine_model.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(apiClient: ref.watch(apiClientProvider));
});

final categoriesProvider = FutureProvider.autoDispose<List<CategoryModel>>((ref) {
  return ref.watch(catalogRepositoryProvider).fetchCategories();
});

/// Small "recommended for you" strip on the Home screen — just the most
/// recently added medicines across all pharmacies.
final recommendedMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  final page = await ref.watch(catalogRepositoryProvider).fetchMedicines(limit: 6);
  return page.items;
});

/// Medicines for the Categories tab's search/browse grid, refetched
/// whenever the selected category or search query changes.
final medicinesByFilterProvider = FutureProvider.autoDispose
    .family<MedicinePage, ({String? categoryId, String? search})>((ref, filter) {
  return ref.watch(catalogRepositoryProvider).fetchMedicines(
        categoryId: filter.categoryId,
        search: filter.search,
      );
});
