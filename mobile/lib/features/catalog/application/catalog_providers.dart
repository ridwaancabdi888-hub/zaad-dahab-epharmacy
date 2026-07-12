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

/// "Recommended for You" grid on the Home screen — the catalog across all
/// pharmacies, newest first. A generous limit (comfortably above today's
/// catalog size) rather than a small teaser count, since this now renders
/// as a full multi-row grid the user scrolls down through, not a short
/// horizontal strip.
final recommendedMedicinesProvider = FutureProvider.autoDispose<List<MedicineModel>>((ref) async {
  final page = await ref.watch(catalogRepositoryProvider).fetchMedicines(limit: 100);
  return page.items;
});

/// A single medicine by id, for the Medicine Detail screen.
final medicineByIdProvider = FutureProvider.autoDispose.family<MedicineModel, String>((
  ref,
  id,
) async {
  return ref.watch(catalogRepositoryProvider).fetchMedicineById(id);
});
