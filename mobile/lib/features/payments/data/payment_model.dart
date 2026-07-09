/// Mirrors the backend's `Payment` model. The `order` field arrives as a
/// bare id string on most endpoints, but populated with `orderNumber` on
/// `/payments/me` (transaction history) — both shapes are handled here.
class PaymentModel {
  const PaymentModel({
    required this.id,
    required this.orderId,
    required this.method,
    required this.amount,
    required this.currency,
    required this.status,
    required this.providerReference,
    required this.attempts,
    required this.createdAt,
    this.orderNumber,
    this.failureReason = '',
    this.payerPhone = '',
    this.paidAt,
  });

  final String id;
  final String orderId;
  final String? orderNumber;
  final String method;
  final double amount;
  final String currency;
  final String status;
  final String providerReference;
  final String failureReason;
  final String payerPhone;
  final int attempts;
  final DateTime? paidAt;
  final DateTime createdAt;

  bool get isProcessing => status == 'pending' || status == 'processing';
  bool get isFailed => status == 'failed';
  bool get isCompleted => status == 'completed';

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    final order = json['order'];
    return PaymentModel(
      id: json['_id'] as String,
      orderId: order is Map ? order['_id'] as String : order as String,
      orderNumber: order is Map ? order['orderNumber'] as String? : null,
      method: json['method'] as String,
      amount: (json['amount'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      status: json['status'] as String,
      providerReference: json['providerReference'] as String? ?? '',
      failureReason: json['failureReason'] as String? ?? '',
      payerPhone: json['payerPhone'] as String? ?? '',
      attempts: (json['attempts'] as num?)?.toInt() ?? 1,
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt'] as String) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
