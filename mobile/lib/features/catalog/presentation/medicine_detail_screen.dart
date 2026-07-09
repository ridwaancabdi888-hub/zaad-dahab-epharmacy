import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../../core/widgets/status_chip.dart';
import '../../cart/application/cart_controller.dart';
import '../../wishlist/presentation/wishlist_heart_button.dart';
import '../application/catalog_providers.dart';
import '../data/medicine_model.dart';
import 'medicine_image.dart';

class MedicineDetailScreen extends ConsumerWidget {
  const MedicineDetailScreen({super.key, required this.medicineId});

  final String medicineId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final medicineAsync = ref.watch(medicineByIdProvider(medicineId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Product Details'),
        actions: [WishlistHeartButton(medicineId: medicineId, size: 24)],
      ),
      body: SafeArea(
        child: ResponsiveCenter(
          child: medicineAsync.when(
            data: (medicine) => _MedicineDetailBody(medicine: medicine),
            loading: () => const LoadingIndicator(),
            error: (error, _) => ErrorView(
              error: error,
              onRetry: () => ref.invalidate(medicineByIdProvider(medicineId)),
            ),
          ),
        ),
      ),
    );
  }
}

class _MedicineDetailBody extends ConsumerStatefulWidget {
  const _MedicineDetailBody({required this.medicine});

  final MedicineModel medicine;

  @override
  ConsumerState<_MedicineDetailBody> createState() => _MedicineDetailBodyState();
}

class _MedicineDetailBodyState extends ConsumerState<_MedicineDetailBody> {
  int _quantity = 1;
  bool _isAdding = false;

  Future<void> _addToCart() async {
    setState(() => _isAdding = true);
    try {
      await ref
          .read(cartControllerProvider.notifier)
          .addItem(widget.medicine.id, quantity: _quantity);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.medicine.name} added to cart')),
        );
      }
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
    if (mounted) setState(() => _isAdding = false);
  }

  @override
  Widget build(BuildContext context) {
    final medicine = widget.medicine;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.containerMargin),
            children: [
              AspectRatio(
                aspectRatio: 1.3,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadii.lg),
                  child: Container(
                    color: AppColors.surfaceContainer,
                    child: MedicineImage(
                      imageUrl: medicine.images.isEmpty ? null : medicine.images.first,
                      iconSize: 72,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  if (medicine.requiresPrescription)
                    const Padding(
                      padding: EdgeInsets.only(right: AppSpacing.xs),
                      child: StatusChip(variant: StatusChipVariant.prescriptionRequired),
                    ),
                  StatusChip(
                    variant:
                        medicine.inStock ? StatusChipVariant.inStock : StatusChipVariant.outOfStock,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(medicine.name, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(medicine.unit, style: Theme.of(context).textTheme.bodyMedium),
              if (medicine.pharmacyName != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.local_pharmacy_outlined, size: 16, color: AppColors.outline),
                    const SizedBox(width: 4),
                    Text(medicine.pharmacyName!, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ],
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Text(
                    '\$${medicine.effectivePrice.toStringAsFixed(2)}',
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(color: AppColors.primary),
                  ),
                  if (medicine.discountPrice != null) ...[
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      '\$${medicine.price.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: AppColors.outline,
                            decoration: TextDecoration.lineThrough,
                          ),
                    ),
                  ],
                ],
              ),
              if (medicine.description.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.lg),
                Text('Description', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: AppSpacing.xs),
                Text(medicine.description, style: Theme.of(context).textTheme.bodyLarge),
              ],
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(AppSpacing.containerMargin),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLowest,
            border: Border(top: BorderSide(color: AppColors.surfaceContainerHigh)),
          ),
          child: Row(
            children: [
              _QuantitySelector(
                quantity: _quantity,
                onChanged: (value) => setState(() => _quantity = value),
                maxQuantity: medicine.stock,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: GradientButton(
                  label: medicine.inStock ? 'Add to Cart' : 'Out of Stock',
                  isLoading: _isAdding,
                  onPressed: medicine.inStock ? _addToCart : null,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuantitySelector extends StatelessWidget {
  const _QuantitySelector({
    required this.quantity,
    required this.onChanged,
    required this.maxQuantity,
  });

  final int quantity;
  final int maxQuantity;
  final void Function(int) onChanged;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(AppRadii.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            icon: const Icon(Icons.remove, size: 18),
            onPressed: quantity > 1 ? () => onChanged(quantity - 1) : null,
          ),
          SizedBox(width: 24, child: Text('$quantity', textAlign: TextAlign.center)),
          IconButton(
            icon: const Icon(Icons.add, size: 18),
            onPressed: quantity < maxQuantity ? () => onChanged(quantity + 1) : null,
          ),
        ],
      ),
    );
  }
}
