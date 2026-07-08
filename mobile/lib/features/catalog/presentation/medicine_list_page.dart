import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/responsive_center.dart';
import '../application/catalog_providers.dart';
import 'medicine_card.dart';

/// Full medicine grid for a single category, pushed from the Categories
/// tab. Lives inside that tab's own navigator (not a top-level go_router
/// route), so back navigation stays within the Categories branch.
class MedicineListPage extends ConsumerWidget {
  const MedicineListPage({super.key, required this.categoryId, required this.categoryName});

  final String categoryId;
  final String categoryName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medicinesAsync =
        ref.watch(medicinesByFilterProvider((categoryId: categoryId, search: null)));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: Text(categoryName)),
      body: SafeArea(
        child: ResponsiveCenter(
          child: medicinesAsync.when(
            data: (page) => page.items.isEmpty
                ? const EmptyState(
                    icon: Icons.medication_outlined,
                    title: 'No products in this category yet',
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(AppSpacing.containerMargin),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: context.gridColumns,
                      mainAxisSpacing: AppSpacing.gutter,
                      crossAxisSpacing: AppSpacing.gutter,
                      childAspectRatio: 0.66,
                    ),
                    itemCount: page.items.length,
                    itemBuilder: (context, index) => MedicineCard(medicine: page.items[index]),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(child: Text('$error')),
          ),
        ),
      ),
    );
  }
}
