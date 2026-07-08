import 'package:flutter/material.dart';
import '../network/api_exception.dart';
import 'empty_state.dart';

/// Standard error state for any screen driven by an `AsyncValue`/`FutureProvider`.
/// Renders [ApiException] messages as-is (they're already user-facing) and
/// falls back to a generic message for anything unexpected, with a Retry
/// action so the user is never stuck looking at a dead end.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final message = error is ApiException
        ? (error as ApiException).message
        : 'Something went wrong. Please try again.';

    return EmptyState(
      icon: Icons.error_outline,
      title: 'Unable to load this',
      message: message,
      actionLabel: onRetry != null ? 'Retry' : null,
      onAction: onRetry,
    );
  }
}
