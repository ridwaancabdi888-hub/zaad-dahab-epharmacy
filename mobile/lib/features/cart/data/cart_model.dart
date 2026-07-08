import '../../catalog/data/medicine_model.dart';

class CartItemModel {
  const CartItemModel({
    required this.medicine,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  final MedicineModel medicine;
  final int quantity;
  final double unitPrice;
  final double lineTotal;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      medicine: MedicineModel.fromJson(json['medicine'] as Map<String, dynamic>),
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      lineTotal: (json['lineTotal'] as num).toDouble(),
    );
  }
}

class CartModel {
  const CartModel({required this.items, required this.subtotal, required this.itemCount});

  final List<CartItemModel> items;
  final double subtotal;
  final int itemCount;

  static const empty = CartModel(items: [], subtotal: 0, itemCount: 0);

  factory CartModel.fromJson(Map<String, dynamic> json) {
    return CartModel(
      items: (json['items'] as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(CartItemModel.fromJson)
          .toList(growable: false),
      subtotal: (json['subtotal'] as num).toDouble(),
      itemCount: (json['itemCount'] as num).toInt(),
    );
  }
}
