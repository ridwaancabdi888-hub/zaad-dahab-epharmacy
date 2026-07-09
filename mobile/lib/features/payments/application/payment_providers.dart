import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/utils/paginated_state.dart';
import '../data/payment_model.dart';
import '../data/payment_repository.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(apiClient: ref.watch(apiClientProvider));
});

/// The payment tied to a specific order — used by the order confirmation
/// and order detail screens.
final paymentByOrderIdProvider =
    FutureProvider.autoDispose.family<PaymentModel, String>((ref, orderId) {
  return ref.watch(paymentRepositoryProvider).getByOrderId(orderId);
});

const _pageSize = 20;

/// The current user's transaction history, with "load more" pagination.
final paymentHistoryProvider =
    StateNotifierProvider.autoDispose<PaymentHistoryController, PaginatedState<PaymentModel>>((ref) {
  return PaymentHistoryController(ref.watch(paymentRepositoryProvider));
});

class PaymentHistoryController extends StateNotifier<PaginatedState<PaymentModel>> {
  PaymentHistoryController(this._repository) : super(const PaginatedState()) {
    _loadFirstPage();
  }

  final PaymentRepository _repository;

  Future<void> _loadFirstPage() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.listMine(page: 1, limit: _pageSize);
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
      final result = await _repository.listMine(page: nextPage, limit: _pageSize);
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
