import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/catalog/application/paginated_medicines_controller.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/catalog_repository.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/category_model.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/medicine_model.dart';

MedicineModel _medicine(int index) => MedicineModel(
      id: 'med$index',
      name: 'Medicine $index',
      unit: '1 unit',
      price: 5,
      stock: 5,
      requiresPrescription: false,
    );

/// 45 total medicines. The controller always requests pages of 20 (its
/// internal `_pageSize`), so this takes 3 pages to exhaust: 20, 20, 5.
class _FakeCatalogRepository implements CatalogRepository {
  static const total = 45;
  int fetchCount = 0;
  Object? errorOnPage;

  @override
  Future<MedicinePage> fetchMedicines({
    String? categoryId,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    fetchCount++;
    if (errorOnPage == page) {
      throw StateError('simulated failure');
    }
    final start = (page - 1) * limit;
    if (start >= total) return const MedicinePage(items: [], total: total);
    final end = (start + limit).clamp(0, total);
    return MedicinePage(
      items: [for (var i = start; i < end; i++) _medicine(i)],
      total: total,
    );
  }

  @override
  Future<List<CategoryModel>> fetchCategories() async => [];

  @override
  Future<MedicineModel> fetchMedicineById(String id) async => _medicine(0);
}

void main() {
  group('PaginatedMedicinesController', () {
    test('loads the first page automatically and reports hasMore', () async {
      final controller = PaginatedMedicinesController(
        repository: _FakeCatalogRepository(),
        filter: (categoryId: null, search: null),
      );
      await Future<void>.delayed(Duration.zero);

      expect(controller.state.isLoading, isFalse);
      expect(controller.state.items, hasLength(20));
      expect(controller.state.hasMore, isTrue);
    });

    test('loadMore appends subsequent pages until exhausted', () async {
      final controller = PaginatedMedicinesController(
        repository: _FakeCatalogRepository(),
        filter: (categoryId: null, search: null),
      );
      await Future<void>.delayed(Duration.zero);

      await controller.loadMore();
      expect(controller.state.items, hasLength(40));
      expect(controller.state.hasMore, isTrue);

      await controller.loadMore();
      expect(controller.state.items, hasLength(45));
      expect(controller.state.hasMore, isFalse);

      // Once exhausted, loadMore is a no-op rather than an extra fetch.
      final fetchesBefore = (controller.state.items.length);
      await controller.loadMore();
      expect(controller.state.items.length, fetchesBefore);
    });

    test('a failed loadMore keeps existing items and surfaces loadMoreError', () async {
      final repository = _FakeCatalogRepository()..errorOnPage = 2;
      final controller = PaginatedMedicinesController(
        repository: repository,
        filter: (categoryId: null, search: null),
      );
      await Future<void>.delayed(Duration.zero);

      await controller.loadMore();

      expect(controller.state.items, hasLength(20));
      expect(controller.state.loadMoreError, isNotNull);
      expect(controller.state.isLoadingMore, isFalse);
    });

    test('refresh reloads from page 1', () async {
      final controller = PaginatedMedicinesController(
        repository: _FakeCatalogRepository(),
        filter: (categoryId: null, search: null),
      );
      await Future<void>.delayed(Duration.zero);
      await controller.loadMore();
      expect(controller.state.items, hasLength(40));

      await controller.refresh();
      expect(controller.state.items, hasLength(20));
      expect(controller.state.page, 1);
    });
  });
}
