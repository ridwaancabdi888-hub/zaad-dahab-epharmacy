import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/theme/app_shadows.dart';
import '../../../core/widgets/status_chip.dart';
import '../../cart/application/cart_controller.dart';
import '../../wishlist/presentation/wishlist_heart_button.dart';
import '../data/medicine_model.dart';
import 'medicine_detail_screen.dart';
import 'medicine_image.dart';

/// Product card used on the Home "Recommended for You" strip and the
/// Categories/Search browse grids, per DESIGN.md's "Product Cards"
/// component. Tapping it (outside the add/heart buttons) opens the
/// Medicine Detail screen.
class MedicineCard extends ConsumerWidget {
  const MedicineCard({super.key, required this.medicine});

  final MedicineModel medicine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => MedicineDetailScreen(medicineId: medicine.id)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
          boxShadow: AppShadows.clinicalSoft,
        ),
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Expanded (not a fixed AspectRatio) so the image absorbs
            // whatever height is left after the text below it — the grid
            // this card sits in uses a fixed childAspectRatio, so a rigid
            // image height here risks overflowing when the two-line name
            // wraps (see empty_state_test.dart for the project's last
            // overflow incident and why this pattern is now preferred).
            Expanded(
              child: Stack(
                children: [
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadii.md),
                      child: Container(
                        color: AppColors.inStockBackground,
                        child: MedicineImage(
                          imageUrl: medicine.images.isEmpty ? null : medicine.images.first,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 4,
                    left: 4,
                    child: StatusChip(
                      variant: medicine.requiresPrescription
                          ? StatusChipVariant.prescriptionRequired
                          : (medicine.inStock
                              ? StatusChipVariant.inStock
                              : StatusChipVariant.outOfStock),
                      label: medicine.requiresPrescription
                          ? 'RX Required'
                          : (medicine.inStock ? 'In Stock' : 'Out of Stock'),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLowest.withValues(alpha: 0.85),
                        shape: BoxShape.circle,
                      ),
                      child: WishlistHeartButton(medicineId: medicine.id, size: 16),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              medicine.name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.onSurface,
                    fontWeight: FontWeight.w600,
                    height: 1.2,
                  ),
            ),
            Text(
              medicine.unit,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Flexible, not a bare Text: at narrow card widths (the
                // grid this card sits in gives it as little as ~144px of
                // content width) a longer price plus the 32px add button
                // can overflow — this shrinks/ellipsizes instead of
                // throwing a RenderFlex error.
                Flexible(
                  child: Text(
                    '\$${medicine.effectivePrice.toStringAsFixed(2)}',
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                  ),
                ),
                _AddButton(medicine: medicine),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddButton extends ConsumerWidget {
  const _AddButton({required this.medicine});

  final MedicineModel medicine;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
      child: IconButton(
        icon: const Icon(Icons.add, color: Colors.white, size: 18),
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        padding: EdgeInsets.zero,
        onPressed: !medicine.inStock
            ? null
            : () async {
                try {
                  await ref.read(cartControllerProvider.notifier).addItem(medicine.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('${medicine.name} added to cart')),
                    );
                  }
                } on ApiException catch (error) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text(error.message)));
                  }
                }
              },
      ),
    );
  }
}
