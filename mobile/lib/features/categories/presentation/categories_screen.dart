import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../../core/widgets/status_chip.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/data/category_model.dart';
import '../../catalog/presentation/medicine_list_page.dart';
import '../../home/presentation/category_icon_button.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Categories')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(categoriesProvider),
            child: categoriesAsync.when(
              data: (categories) => categories.isEmpty
                  ? const EmptyState(
                      icon: Icons.category_outlined,
                      title: 'No categories yet',
                      message: 'Check back soon — new categories are added regularly.',
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AppSpacing.containerMargin),
                      children: [
                        Text(
                          'Browse curated healthcare and wellness essentials',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: context.gridColumns,
                            mainAxisSpacing: AppSpacing.gutter,
                            crossAxisSpacing: AppSpacing.gutter,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: categories.length,
                          itemBuilder: (context, index) {
                            final category = categories[index];
                            return _CategoryCard(
                              category: category,
                              tint: index.isEven
                                  ? AppColors.primaryContainer
                                  : AppColors.secondaryContainer,
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => MedicineListPage(
                                    categoryId: category.id,
                                    categoryName: category.name,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
              loading: () => const LoadingIndicator(),
              error: (error, _) =>
                  ErrorView(error: error, onRetry: () => ref.invalidate(categoriesProvider)),
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category, required this.tint, required this.onTap});

  final CategoryModel category;
  final Color tint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isPrescription = category.slug.contains('prescription') || category.slug.contains('rx');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadii.lg),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: tint.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(AppRadii.md),
                  ),
                  child: Icon(iconForCategory(category), color: AppColors.primary),
                ),
                if (isPrescription) const StatusChip(variant: StatusChipVariant.prescriptionRequired),
              ],
            ),
            const Spacer(),
            Text(
              category.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            if (category.description.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                category.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
