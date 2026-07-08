/// Thrown by [ApiClient] whenever the backend responds with a non-2xx
/// status. Mirrors the `{ success, message, details }` error envelope
/// produced by the backend's `error.middleware.js`.
class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.message,
    this.details,
  });

  final int statusCode;
  final String message;
  final List<Map<String, dynamic>>? details;

  bool get isUnauthorized => statusCode == 401;
  bool get isValidationError => statusCode == 400 && details != null;

  @override
  String toString() => message;
}
