import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/paginated_state.dart';
import '../data/catalog_repository.dart';
import '../data/medicine_model.dart';
import 'catalog_providers.dart';

typedef MedicineFilter = ({String? categoryId, String? search});

const _pageSize = 20;

/// Drives a "load more" medicine grid for a given category/search filter.
/// One instance per distinct filter (Riverpod `family` + `autoDispose`
/// disposes it once no widget is watching that filter anymore).
final paginatedMedicinesProvider = StateNotifierProvider.autoDispose
    .family<PaginatedMedicinesController, PaginatedState<MedicineModel>, MedicineFilter>(
  (ref, filter) {
    return PaginatedMedicinesController(
      repository: ref.watch(catalogRepositoryProvider),
      filter: filter,
    );
  },
);

class PaginatedMedicinesController extends StateNotifier<PaginatedState<MedicineModel>> {
  PaginatedMedicinesController({required this._repository, required this._filter})
      : super(const PaginatedState()) {
    _loadFirstPage();
  }

  final CatalogRepository _repository;
  final MedicineFilter _filter;

  Future<void> _loadFirstPage() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.fetchMedicines(
        categoryId: _filter.categoryId,
        search: _filter.search,
        page: 1,
        limit: _pageSize,
      );
      state = PaginatedState(
        items: result.items,
        page: 1,
        hasMore: result.items.length < result.total,
        isLoading: false,
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: error);
    }
  }

  Future<void> refresh() => _loadFirstPage();

  Future<void> loadMore() async {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true, clearLoadMoreError: true);
    final nextPage = state.page + 1;
    try {
      final result = await _repository.fetchMedicines(
        categoryId: _filter.categoryId,
        search: _filter.search,
        page: nextPage,
        limit: _pageSize,
      );
      final combined = [...state.items, ...result.items];
      state = state.copyWith(
        items: combined,
        page: nextPage,
        hasMore: combined.length < result.total,
        isLoadingMore: false,
      );
    } catch (error) {
      state = state.copyWith(isLoadingMore: false, loadMoreError: error);
    }
  }
}
