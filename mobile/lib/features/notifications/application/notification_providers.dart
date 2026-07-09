import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../core/utils/paginated_state.dart';
import '../data/notification_model.dart';
import '../data/notification_repository.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(apiClient: ref.watch(apiClientProvider));
});

/// Polls the unread count every 30s so the bell icon's badge stays roughly
/// live without a real push channel (no Firebase project is configured in
/// this environment — see `backend/README.md`'s "Notifications" section).
/// `autoDispose` means this only runs while something is actually watching
/// it (e.g. the bell icon on screen).
final unreadNotificationCountProvider = StreamProvider.autoDispose<int>((ref) async* {
  final repository = ref.watch(notificationRepositoryProvider);
  while (true) {
    yield await repository.unreadCount();
    await Future.delayed(const Duration(seconds: 30));
  }
});

const _pageSize = 20;

final notificationsProvider =
    StateNotifierProvider.autoDispose<NotificationsController, PaginatedState<NotificationModel>>((ref) {
  return NotificationsController(ref.watch(notificationRepositoryProvider), ref);
});

class NotificationsController extends StateNotifier<PaginatedState<NotificationModel>> {
  NotificationsController(this._repository, this._ref) : super(const PaginatedState()) {
    _loadFirstPage();
  }

  final NotificationRepository _repository;
  final Ref _ref;

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

  Future<void> markRead(String id) async {
    await _repository.markRead(id);
    state = state.copyWith(
      items: [
        for (final item in state.items)
          if (item.id == id) item.copyWith(isRead: true, readAt: DateTime.now()) else item,
      ],
    );
    _ref.invalidate(unreadNotificationCountProvider);
  }

  Future<void> markAllRead() async {
    await _repository.markAllRead();
    state = state.copyWith(
      items: [for (final item in state.items) item.copyWith(isRead: true, readAt: DateTime.now())],
    );
    _ref.invalidate(unreadNotificationCountProvider);
  }
}
