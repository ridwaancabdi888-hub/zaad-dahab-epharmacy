import '../../../core/network/api_client.dart';
import 'notification_model.dart';

class NotificationPage {
  const NotificationPage({required this.items, required this.total, required this.unreadCount});

  final List<NotificationModel> items;
  final int total;
  final int unreadCount;
}

class NotificationRepository {
  NotificationRepository({required this._apiClient});

  final ApiClient _apiClient;

  Future<NotificationPage> listMine({int page = 1, int limit = 20}) async {
    final json = await _apiClient.get('/notifications/me', query: {
      'page': page,
      'limit': limit,
    }) as Map<String, dynamic>;

    final items = (json['items'] as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(NotificationModel.fromJson)
        .toList(growable: false);
    final total = (json['meta'] as Map<String, dynamic>)['total'] as int;

    return NotificationPage(items: items, total: total, unreadCount: json['unreadCount'] as int);
  }

  Future<int> unreadCount() async {
    final json = await _apiClient.get('/notifications/me/unread-count') as Map<String, dynamic>;
    return json['count'] as int;
  }

  Future<void> markRead(String id) {
    return _apiClient.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() {
    return _apiClient.patch('/notifications/read-all');
  }
}
