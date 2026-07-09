/// Result of `POST /orders/quote`: a live pricing preview of the current
/// cart (optionally with a coupon applied), computed server-side so the
/// UI never re-derives fee/tax/discount math itself.
class OrderQuote {
  const OrderQuote({
    required this.subtotal,
    required this.deliveryFee,
    required this.tax,
    required this.discount,
    required this.total,
    required this.prescriptionRequired,
    this.couponCode,
  });

  final double subtotal;
  final double deliveryFee;
  final double tax;
  final double discount;
  final double total;
  final bool prescriptionRequired;
  final String? couponCode;

  factory OrderQuote.fromJson(Map<String, dynamic> json) {
    return OrderQuote(
      subtotal: (json['subtotal'] as num).toDouble(),
      deliveryFee: (json['deliveryFee'] as num).toDouble(),
      tax: (json['tax'] as num).toDouble(),
      discount: (json['discount'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      prescriptionRequired: json['prescriptionRequired'] as bool? ?? false,
      couponCode: json['couponCode'] as String?,
    );
  }
}
