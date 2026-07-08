import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A section title with an optional trailing action (e.g. "View All"),
/// used across Home/Categories to introduce a group of content.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onActionTap});

  final String title;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        if (actionLabel != null)
          TextButton(
            onPressed: onActionTap,
            style: TextButton.styleFrom(foregroundColor: AppColors.primary),
            child: Text(actionLabel!),
          ),
      ],
    );
  }
}
