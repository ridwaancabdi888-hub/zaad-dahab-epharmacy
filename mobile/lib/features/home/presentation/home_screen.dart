import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/route_paths.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../catalog/presentation/medicine_card.dart';
import '../../notifications/application/notification_providers.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../search/presentation/search_screen.dart';
import '../../wishlist/presentation/wishlist_screen.dart';
import 'category_icon_button.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = ref.watch(authControllerProvider).user?.name.split(' ').first ?? 'there';
    final categoriesAsync = ref.watch(categoriesProvider);
    final recommendedAsync = ref.watch(recommendedMedicinesProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider).valueOrNull ?? 0;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Zaad/e-Dahab'),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border),
            tooltip: 'Wishlist',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WishlistScreen()),
            ),
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none),
                tooltip: 'Notifications',
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                ),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(AppRadii.full),
                    ),
                    constraints: const BoxConstraints(minWidth: 16),
                    child: Text(
                      '$unreadCount',
                      textAlign: TextAlign.center,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(recommendedMedicinesProvider);
          },
          child: ResponsiveCenter(
            child: ListView(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.containerMargin,
                vertical: AppSpacing.md,
              ),
              children: [
                Text('Hi, $userName 👋', style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                Text(
                  'Browse curated healthcare and wellness essentials',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: AppSpacing.md),
                _SearchBar(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SearchScreen()),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                SectionHeader(
                  title: 'Categories',
                  actionLabel: 'View All',
                  onActionTap: () => context.go(RoutePaths.categories),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  height: 96,
                  child: categoriesAsync.when(
                    data: (categories) => categories.isEmpty
                        ? const EmptyState(
                            icon: Icons.category_outlined,
                            title: 'No categories yet',
                            compact: true,
                          )
                        : ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: categories.length,
                            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
                            itemBuilder: (context, index) => CategoryIconButton(
                              category: categories[index],
                              onTap: () => context.go(RoutePaths.categories),
                            ),
                          ),
                    loading: () => const LoadingIndicator(),
                    error: (error, _) => ErrorView(
                      error: error,
                      onRetry: () => ref.invalidate(categoriesProvider),
                      compact: true,
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const SectionHeader(title: 'Recommended for You'),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  height: 240,
                  child: recommendedAsync.when(
                    data: (medicines) => medicines.isEmpty
                        ? const EmptyState(
                            icon: Icons.medication_outlined,
                            title: 'No products yet',
                            message: 'Check back soon for new arrivals.',
                          )
                        : ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: medicines.length,
                            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.sm),
                            itemBuilder: (context, index) => SizedBox(
                              width: 170,
                              child: MedicineCard(medicine: medicines[index]),
                            ),
                          ),
                    loading: () => const LoadingIndicator(),
                    error: (error, _) => ErrorView(
                      error: error,
                      onRetry: () => ref.invalidate(recommendedMedicinesProvider),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadii.lg),
      child: Container(
        height: AppSizes.searchBarHeight,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppColors.outline),
            const SizedBox(width: AppSpacing.sm),
            Text('Search for categories or products…',
                style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}
