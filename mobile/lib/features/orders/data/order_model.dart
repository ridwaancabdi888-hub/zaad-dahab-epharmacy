class OrderItemModel {
  const OrderItemModel({
    required this.name,
    required this.unit,
    required this.price,
    required this.quantity,
    required this.lineTotal,
  });

  final String name;
  final String unit;
  final double price;
  final int quantity;
  final double lineTotal;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      name: json['name'] as String,
      unit: json['unit'] as String,
      price: (json['price'] as num).toDouble(),
      quantity: (json['quantity'] as num).toInt(),
      lineTotal: (json['lineTotal'] as num).toDouble(),
    );
  }
}

class OrderStatusEvent {
  const OrderStatusEvent({required this.status, required this.at});

  final String status;
  final DateTime at;

  factory OrderStatusEvent.fromJson(Map<String, dynamic> json) {
    return OrderStatusEvent(
      status: json['status'] as String,
      at: DateTime.parse(json['at'] as String),
    );
  }
}

class OrderAddressModel {
  const OrderAddressModel({required this.label, required this.street, required this.city});

  final String label;
  final String street;
  final String city;

  factory OrderAddressModel.fromJson(Map<String, dynamic> json) {
    return OrderAddressModel(
      label: json['label'] as String? ?? 'Home',
      street: json['street'] as String,
      city: json['city'] as String,
    );
  }
}

/// Mirrors the backend's `Order` model, trimmed to what the mobile app
/// displays (confirmation screen, order detail, order history).
class OrderModel {
  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.tax,
    required this.discount,
    required this.total,
    required this.deliveryAddress,
    required this.paymentMethod,
    required this.createdAt,
    this.couponCode,
    this.statusHistory = const [],
  });

  final String id;
  final String orderNumber;
  final String status;
  final List<OrderItemModel> items;
  final double subtotal;
  final double deliveryFee;
  final double tax;
  final double discount;
  final double total;
  final OrderAddressModel deliveryAddress;
  final String paymentMethod;
  final DateTime createdAt;
  final String? couponCode;
  final List<OrderStatusEvent> statusHistory;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['_id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      items: (json['items'] as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(OrderItemModel.fromJson)
          .toList(growable: false),
      subtotal: (json['subtotal'] as num).toDouble(),
      deliveryFee: (json['deliveryFee'] as num).toDouble(),
      tax: (json['tax'] as num).toDouble(),
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num).toDouble(),
      deliveryAddress:
          OrderAddressModel.fromJson(json['deliveryAddress'] as Map<String, dynamic>),
      paymentMethod: json['paymentMethod'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      couponCode: json['couponCode'] as String?,
      statusHistory: (json['statusHistory'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>()
          .map(OrderStatusEvent.fromJson)
          .toList(growable: false),
    );
  }
}
