import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Standard loading spinner used everywhere a request is in flight, so
/// every screen's loading state looks and feels the same.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({super.key, this.size = 32});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: const CircularProgressIndicator(
          strokeWidth: 3,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

/// A small inline spinner for "load more" rows at the bottom of a
/// paginated list, distinct from the full-screen [LoadingIndicator].
class InlineLoadingIndicator extends StatelessWidget {
  const InlineLoadingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 16),
      child: LoadingIndicator(size: 22),
    );
  }
}
