import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/run_catching.dart';
import '../application/wishlist_controller.dart';

/// A heart toggle reused on [MedicineCard] and the Medicine Detail screen.
class WishlistHeartButton extends ConsumerWidget {
  const WishlistHeartButton({super.key, required this.medicineId, this.size = 20});

  final String medicineId;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSaved = ref.watch(
      wishlistControllerProvider.select((state) => state.valueOrNull?.any((m) => m.id == medicineId) ?? false),
    );

    return IconButton(
      icon: Icon(
        isSaved ? Icons.favorite : Icons.favorite_border,
        color: isSaved ? AppColors.error : AppColors.outline,
        size: size,
      ),
      onPressed: () => runCatchingApi(
        context,
        () => ref.read(wishlistControllerProvider.notifier).toggle(medicineId),
      ),
    );
  }
}
