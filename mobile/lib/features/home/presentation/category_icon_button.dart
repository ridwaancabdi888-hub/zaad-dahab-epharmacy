import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../catalog/data/category_model.dart';

/// Maps a category slug to a representative icon. Falls back to a generic
/// medical icon for categories the mapping doesn't recognize yet, so new
/// admin-created categories never render blank.
IconData iconForCategory(CategoryModel category) {
  final key = category.slug.toLowerCase();
  if (key.contains('prescription') || key.contains('rx')) return Icons.assignment_outlined;
  if (key.contains('otc') || key.contains('first-aid') || key.contains('first_aid')) {
    return Icons.medical_services_outlined;
  }
  if (key.contains('supplement') || key.contains('vitamin')) return Icons.spa_outlined;
  if (key.contains('personal') || key.contains('beauty') || key.contains('hygiene')) {
    return Icons.face_retouching_natural_outlined;
  }
  if (key.contains('baby') || key.contains('mother')) return Icons.child_friendly_outlined;
  if (key.contains('device') || key.contains('monitor')) return Icons.monitor_heart_outlined;
  return Icons.local_pharmacy_outlined;
}

class CategoryIconButton extends StatelessWidget {
  const CategoryIconButton({super.key, required this.category, required this.onTap});

  final CategoryModel category;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadii.md),
      child: SizedBox(
        width: 72,
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppColors.secondaryContainer.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(AppRadii.md),
              ),
              child: Icon(iconForCategory(category), color: AppColors.primary),
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelMedium,
            ),
          ],
        ),
      ),
    );
  }
}
