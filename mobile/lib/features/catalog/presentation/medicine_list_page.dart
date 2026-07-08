import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/responsive_center.dart';
import 'paginated_medicine_grid.dart';

/// Full medicine grid for a single category, pushed from the Categories
/// tab. Lives inside that tab's own navigator (not a top-level go_router
/// route), so back navigation stays within the Categories branch.
class MedicineListPage extends StatelessWidget {
  const MedicineListPage({super.key, required this.categoryId, required this.categoryName});

  final String categoryId;
  final String categoryName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(categoryName)),
      body: SafeArea(
        child: ResponsiveCenter(
          child: PaginatedMedicineGrid(
            filter: (categoryId: categoryId, search: null),
            emptyTitle: 'No products in this category yet',
          ),
        ),
      ),
    );
  }
}
