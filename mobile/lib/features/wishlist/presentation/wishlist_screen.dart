import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../catalog/presentation/medicine_card.dart';
import '../application/wishlist_controller.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlistAsync = ref.watch(wishlistControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Wishlist')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: RefreshIndicator(
            onRefresh: () => ref.read(wishlistControllerProvider.notifier).refresh(),
            child: wishlistAsync.when(
              data: (medicines) => medicines.isEmpty
                  ? const EmptyState(
                      icon: Icons.favorite_border,
                      title: 'Your wishlist is empty',
                      message: 'Tap the heart on any product to save it here.',
                    )
                  : GridView.builder(
                      padding: const EdgeInsets.all(AppSpacing.containerMargin),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: context.gridColumns,
                        mainAxisSpacing: AppSpacing.gutter,
                        crossAxisSpacing: AppSpacing.gutter,
                        childAspectRatio: 0.66,
                      ),
                      itemCount: medicines.length,
                      itemBuilder: (context, index) => MedicineCard(medicine: medicines[index]),
                    ),
              loading: () => const LoadingIndicator(),
              error: (error, _) => ErrorView(
                error: error,
                onRetry: () => ref.read(wishlistControllerProvider.notifier).refresh(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
