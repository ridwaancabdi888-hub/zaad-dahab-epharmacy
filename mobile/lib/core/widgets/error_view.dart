import 'package:flutter/material.dart';
import '../network/api_exception.dart';
import 'empty_state.dart';

/// Standard error state for any screen driven by an `AsyncValue`/`FutureProvider`.
/// Renders [ApiException] messages as-is (they're already user-facing) and
/// falls back to a generic message for anything unexpected, with a Retry
/// action so the user is never stuck looking at a dead end.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, this.onRetry, this.compact = false});

  final Object error;
  final VoidCallback? onRetry;

  /// For tight, fixed-height strips (e.g. the Home screen's 96px category
  /// row) where the default layout would overflow — see [EmptyState]'s
  /// `compact` doc. Drops the visible message/button but keeps retry
  /// reachable by making the whole placeholder tappable.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final message = error is ApiException
        ? (error as ApiException).message
        : 'Something went wrong. Please try again.';

    final content = EmptyState(
      icon: Icons.error_outline,
      title: compact ? 'Tap to retry' : 'Unable to load this',
      message: message,
      actionLabel: !compact && onRetry != null ? 'Retry' : null,
      onAction: onRetry,
      compact: compact,
    );

    if (compact && onRetry != null) {
      return GestureDetector(onTap: onRetry, child: content);
    }
    return content;
  }
}
