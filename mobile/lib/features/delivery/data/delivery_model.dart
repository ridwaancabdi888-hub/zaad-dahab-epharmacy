const deliveryActiveStatuses = {'assigned', 'picked_up', 'in_transit'};

/// Trimmed view of the order behind a delivery — populated server-side
/// (see `backend/src/services/delivery.service.js`'s `ORDER_POPULATE`) so
/// the rider app never needs its own, separately-authorized call to
/// `GET /orders/:id`.
class DeliveryOrderSummary {
  const DeliveryOrderSummary({
    required this.id,
    required this.orderNumber,
    required this.total,
    required this.paymentMethod,
    required this.status,
    required this.itemCount,
    this.customerName,
    this.customerPhone,
  });

  final String id;
  final String orderNumber;
  final double total;
  final String paymentMethod;
  final String status;
  final int itemCount;
  final String? customerName;
  final String? customerPhone;

  factory DeliveryOrderSummary.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    return DeliveryOrderSummary(
      id: json['_id'] as String,
      orderNumber: json['orderNumber'] as String,
      total: (json['total'] as num).toDouble(),
      paymentMethod: json['paymentMethod'] as String,
      status: json['status'] as String,
      itemCount: (json['items'] as List<dynamic>? ?? []).length,
      customerName: user is Map ? user['name'] as String? : null,
      customerPhone: user is Map ? user['phone'] as String? : null,
    );
  }
}

class DeliveryRider {
  const DeliveryRider({required this.id, required this.name, this.phone});

  final String id;
  final String name;
  final String? phone;

  factory DeliveryRider.fromJson(Map<String, dynamic> json) {
    return DeliveryRider(
      id: json['_id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String?,
    );
  }
}

class DeliveryAddress {
  const DeliveryAddress({
    required this.label,
    required this.street,
    required this.city,
    this.lat,
    this.lng,
  });

  final String label;
  final String street;
  final String city;
  final double? lat;
  final double? lng;

  bool get hasCoordinates => lat != null && lng != null;

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      label: json['label'] as String? ?? 'Home',
      street: json['street'] as String,
      city: json['city'] as String,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
    );
  }
}

class DeliveryLocation {
  const DeliveryLocation({this.lat, this.lng, this.updatedAt});

  final double? lat;
  final double? lng;
  final DateTime? updatedAt;

  bool get hasCoordinates => lat != null && lng != null;

  factory DeliveryLocation.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const DeliveryLocation();
    return DeliveryLocation(
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt'] as String) : null,
    );
  }
}

class DeliveryStatusEvent {
  const DeliveryStatusEvent({required this.status, required this.at});

  final String status;
  final DateTime at;

  factory DeliveryStatusEvent.fromJson(Map<String, dynamic> json) {
    return DeliveryStatusEvent(
      status: json['status'] as String,
      at: DateTime.parse(json['at'] as String),
    );
  }
}

/// Mirrors the backend's `Delivery` model (see
/// `backend/src/models/Delivery.js`), including the populated `order`/
/// `rider` context the mobile app displays.
class DeliveryModel {
  const DeliveryModel({
    required this.id,
    required this.orderId,
    required this.status,
    required this.address,
    required this.currentLocation,
    required this.statusHistory,
    required this.createdAt,
    this.order,
    this.rider,
    this.estimatedDeliveryStart,
    this.estimatedDeliveryEnd,
    this.deliveredAt,
  });

  final String id;
  final String orderId;
  final DeliveryOrderSummary? order;
  final DeliveryRider? rider;
  final String status;
  final DeliveryAddress address;
  final DeliveryLocation currentLocation;
  final DateTime? estimatedDeliveryStart;
  final DateTime? estimatedDeliveryEnd;
  final DateTime? deliveredAt;
  final List<DeliveryStatusEvent> statusHistory;
  final DateTime createdAt;

  bool get isActive => deliveryActiveStatuses.contains(status);
  bool get hasEta => estimatedDeliveryStart != null && estimatedDeliveryEnd != null;

  factory DeliveryModel.fromJson(Map<String, dynamic> json) {
    final orderField = json['order'];
    return DeliveryModel(
      id: json['_id'] as String,
      orderId: orderField is Map ? orderField['_id'] as String : orderField as String,
      order: orderField is Map
          ? DeliveryOrderSummary.fromJson(orderField as Map<String, dynamic>)
          : null,
      rider: json['rider'] is Map ? DeliveryRider.fromJson(json['rider'] as Map<String, dynamic>) : null,
      status: json['status'] as String,
      address: DeliveryAddress.fromJson(json['address'] as Map<String, dynamic>),
      currentLocation: DeliveryLocation.fromJson(json['currentLocation'] as Map<String, dynamic>?),
      estimatedDeliveryStart: json['estimatedDeliveryStart'] != null
          ? DateTime.parse(json['estimatedDeliveryStart'] as String)
          : null,
      estimatedDeliveryEnd: json['estimatedDeliveryEnd'] != null
          ? DateTime.parse(json['estimatedDeliveryEnd'] as String)
          : null,
      deliveredAt: json['deliveredAt'] != null ? DateTime.parse(json['deliveredAt'] as String) : null,
      statusHistory: (json['statusHistory'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>()
          .map(DeliveryStatusEvent.fromJson)
          .toList(growable: false),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
