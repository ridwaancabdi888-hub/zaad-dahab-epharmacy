/// Mirrors the backend's `Notification` model (see
/// `backend/src/models/Notification.js`). These are real, persisted,
/// polled-for in-app notifications — there is no Firebase project
/// configured in this environment, so push delivery (FCM) is out of scope;
/// see `backend/README.md`'s "Notifications" section.
class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.orderId,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String? orderId;
  final DateTime? readAt;
  final DateTime createdAt;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'];
    return NotificationModel(
      id: json['_id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      isRead: json['isRead'] as bool? ?? false,
      orderId: order is Map ? order['_id'] as String? : order as String?,
      readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  NotificationModel copyWith({bool? isRead, DateTime? readAt}) {
    return NotificationModel(
      id: id,
      type: type,
      title: title,
      message: message,
      isRead: isRead ?? this.isRead,
      orderId: orderId,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }
}
