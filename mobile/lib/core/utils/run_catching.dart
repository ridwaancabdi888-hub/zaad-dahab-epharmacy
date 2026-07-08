import 'package:flutter/material.dart';
import '../network/api_exception.dart';

/// Runs [action]; if it throws an [ApiException], shows its message as a
/// snackbar instead of letting the error escape as an unhandled Future
/// rejection. Used for fire-and-forget UI actions (add to cart, quantity
/// steppers, ...) where the surrounding widget doesn't need the result.
Future<void> runCatchingApi(BuildContext context, Future<void> Function() action) async {
  try {
    await action();
  } on ApiException catch (error) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }
}
