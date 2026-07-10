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
    this.deliveryId,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final String? orderId;
  final String? deliveryId;
  final DateTime? readAt;
  final DateTime createdAt;

  /// A `rider_assigned` notification points a rider at their own delivery
  /// detail screen rather than the customer-oriented order detail screen
  /// (a rider isn't authorized to fetch an order directly — see
  /// `backend/README.md`'s "Deliveries" section).
  bool get opensDeliveryDetail => type == 'rider_assigned' && deliveryId != null;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'];
    final delivery = json['delivery'];
    return NotificationModel(
      id: json['_id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      isRead: json['isRead'] as bool? ?? false,
      orderId: order is Map ? order['_id'] as String? : order as String?,
      deliveryId: delivery is Map ? delivery['_id'] as String? : delivery as String?,
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
      deliveryId: deliveryId,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }
}
