import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/utils/paginated_state.dart';
import '../data/delivery_model.dart';
import '../data/delivery_repository.dart';

final deliveryRepositoryProvider = Provider<DeliveryRepository>((ref) {
  return DeliveryRepository(apiClient: ref.watch(apiClientProvider));
});

/// The delivery tied to a specific order — used by the customer-facing
/// order tracking view. Not every order has a delivery yet (e.g. one just
/// placed), so callers should treat a 404 as "not out for delivery yet".
final deliveryByOrderIdProvider =
    FutureProvider.autoDispose.family<DeliveryModel, String>((ref, orderId) {
  return ref.watch(deliveryRepositoryProvider).getByOrderId(orderId);
});

/// A single delivery by its own id — used by the rider delivery detail
/// screen. Invalidated (not refreshed in place) after any status/location
/// mutation so the screen always reflects exactly what the server saved.
final deliveryByIdProvider = FutureProvider.autoDispose.family<DeliveryModel, String>((ref, id) {
  return ref.watch(deliveryRepositoryProvider).getById(id);
});

/// Riders a pharmacist/admin can dispatch a delivery to — used by
/// [PharmacistOrderActions]'s rider picker.
final availableRidersProvider = FutureProvider.autoDispose<List<DeliveryRider>>((ref) {
  return ref.watch(deliveryRepositoryProvider).listRiders();
});

/// Deliveries currently assigned to this rider and not yet finished
/// (assigned/picked_up/in_transit). A rider realistically juggles a
/// handful of these at once, so this is a single fetch rather than
/// "load more" pagination — unlike [riderCompletedDeliveriesProvider].
final riderActiveDeliveriesProvider = FutureProvider.autoDispose<List<DeliveryModel>>((ref) async {
  final page = await ref.watch(deliveryRepositoryProvider).listMine(limit: 50);
  return page.items.where((delivery) => delivery.isActive).toList(growable: false);
});

const _pageSize = 20;

/// The rider's delivered-order history, with "load more" pagination —
/// mirrors [PaymentHistoryController]'s shape.
final riderCompletedDeliveriesProvider = StateNotifierProvider.autoDispose<
    RiderCompletedDeliveriesController, PaginatedState<DeliveryModel>>((ref) {
  return RiderCompletedDeliveriesController(ref.watch(deliveryRepositoryProvider));
});

class RiderCompletedDeliveriesController extends StateNotifier<PaginatedState<DeliveryModel>> {
  RiderCompletedDeliveriesController(this._repository) : super(const PaginatedState()) {
    _loadFirstPage();
  }

  final DeliveryRepository _repository;

  Future<void> _loadFirstPage() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final result = await _repository.listMine(page: 1, limit: _pageSize, status: 'delivered');
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
      final result = await _repository.listMine(page: nextPage, limit: _pageSize, status: 'delivered');
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

/// The rider action that advances a delivery to its next forward status,
/// or `null` if the delivery is already in a terminal state. Mirrors the
/// backend's `RIDER_TRANSITIONS` map in `delivery.service.js`.
String? nextForwardDeliveryStatus(String status) {
  switch (status) {
    case 'assigned':
      return 'picked_up';
    case 'picked_up':
      return 'in_transit';
    case 'in_transit':
      return 'delivered';
    default:
      return null;
  }
}

const _forwardActionLabels = {
  'picked_up': 'Mark Picked Up',
  'in_transit': 'Mark In Transit',
  'delivered': 'Mark Delivered',
};

String forwardDeliveryActionLabel(String targetStatus) =>
    _forwardActionLabels[targetStatus] ?? targetStatus;
