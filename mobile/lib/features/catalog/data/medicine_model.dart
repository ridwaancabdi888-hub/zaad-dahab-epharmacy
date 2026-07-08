/// Mirrors the backend's `Medicine` model. The `pharmacy`/`category`
/// fields may arrive either as a bare id string or a populated object
/// depending on the endpoint, so both shapes are handled here.
class MedicineModel {
  const MedicineModel({
    required this.id,
    required this.name,
    required this.unit,
    required this.price,
    required this.stock,
    required this.requiresPrescription,
    this.description = '',
    this.images = const [],
    this.discountPrice,
    this.pharmacyId,
    this.pharmacyName,
    this.categoryId,
    this.categoryName,
  });

  final String id;
  final String name;
  final String description;
  final String unit;
  final double price;
  final double? discountPrice;
  final int stock;
  final bool requiresPrescription;
  final List<String> images;
  final String? pharmacyId;
  final String? pharmacyName;
  final String? categoryId;
  final String? categoryName;

  double get effectivePrice => discountPrice ?? price;
  bool get inStock => stock > 0;

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    final pharmacy = json['pharmacy'];
    final category = json['category'];

    return MedicineModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      unit: json['unit'] as String,
      price: (json['price'] as num).toDouble(),
      discountPrice: (json['discountPrice'] as num?)?.toDouble(),
      stock: (json['stock'] as num).toInt(),
      requiresPrescription: json['requiresPrescription'] as bool? ?? false,
      images: (json['images'] as List<dynamic>? ?? []).cast<String>(),
      pharmacyId: pharmacy is Map ? pharmacy['_id'] as String? : pharmacy as String?,
      pharmacyName: pharmacy is Map ? pharmacy['name'] as String? : null,
      categoryId: category is Map ? category['_id'] as String? : category as String?,
      categoryName: category is Map ? category['name'] as String? : null,
    );
  }
}
