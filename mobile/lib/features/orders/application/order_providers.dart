import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/paginated_state.dart';
import '../../checkout/application/checkout_controller.dart';
import '../data/order_model.dart';
import '../data/order_repository.dart';

/// A single order by id — used by the order detail screen (shared by
/// customers viewing their own order and pharmacists/admins managing any
/// order).
final orderByIdProvider = FutureProvider.autoDispose.family<OrderModel, String>((ref, id) {
  return ref.watch(orderRepositoryProvider).getById(id);
});

const _pageSize = 20;

/// Every order platform-wide, with "load more" pagination and an optional
/// status filter — the pharmacist/admin order-management list. Mirrors
/// [RiderCompletedDeliveriesController]'s shape.
final pharmacistOrdersProvider = StateNotifierProvider.autoDispose
    .family<PharmacistOrdersController, PaginatedState<OrderModel>, String?>((ref, status) {
  return PharmacistOrdersController(ref.watch(orderRepositoryProvider), status);
});

class PharmacistOrdersController extends StateNotifier<PaginatedState<OrderModel>> {
  PharmacistOrdersController(this._repository, this._status) : super(const PaginatedState()) {
    _loadFirstPage();
  }

  final OrderRepository _repository;
  final String? _status;

  Future<void> _loadFirstPage() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.listAll(page: 1, limit: _pageSize, status: _status);
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
      final result = await _repository.listAll(page: nextPage, limit: _pageSize, status: _status);
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

/// The pharmacist/admin action that advances an order to its next manual
/// status, or `null` if there's no forward action (mirrors the backend's
/// `MANUAL_TRANSITIONS` map in `order.service.js`).
String? nextManualOrderStatus(String status) {
  switch (status) {
    case 'pending':
      return 'confirmed';
    case 'confirmed':
      return 'preparing';
    default:
      return null;
  }
}
