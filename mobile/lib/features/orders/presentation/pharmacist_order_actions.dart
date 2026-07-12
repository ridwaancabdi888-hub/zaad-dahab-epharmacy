import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../checkout/application/checkout_controller.dart';
import '../../delivery/application/delivery_providers.dart';
import '../application/order_providers.dart';

const _actionLabels = {
  'confirmed': 'Mark Confirmed',
  'preparing': 'Mark Preparing',
};

/// Order-fulfillment actions only a pharmacist/admin can take: advance
/// the order's own status, cancel it (flagging it as out of stock), and
/// dispatch a rider once a delivery record exists with none assigned yet.
/// Shown on [OrderDetailScreen] only when the signed-in user's role
/// warrants it.
class PharmacistOrderActions extends ConsumerStatefulWidget {
  const PharmacistOrderActions({
    super.key,
    required this.orderId,
    required this.orderStatus,
    required this.onChanged,
  });

  final String orderId;
  final String orderStatus;

  /// Called after any action mutates the order/delivery — the parent
  /// re-fetches rather than this widget tracking its own copy of the
  /// order, so the stepper above always reflects the latest state too.
  final VoidCallback onChanged;

  @override
  ConsumerState<PharmacistOrderActions> createState() => _PharmacistOrderActionsState();
}

class _PharmacistOrderActionsState extends ConsumerState<PharmacistOrderActions> {
  bool _isWorking = false;
  String? _riderChoice;

  bool get _canCancel => ['pending', 'confirmed', 'preparing'].contains(widget.orderStatus);

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _isWorking = true);
    try {
      await action();
      widget.onChanged();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  Future<void> _advance(String targetStatus) =>
      _run(() => ref.read(orderRepositoryProvider).updateStatus(widget.orderId, targetStatus));

  Future<void> _cancel() => _run(() => ref.read(orderRepositoryProvider).cancel(widget.orderId));

  Future<void> _assignRider(String deliveryId) => _run(() async {
        if (_riderChoice == null) return;
        await ref.read(deliveryRepositoryProvider).assignRider(deliveryId, _riderChoice!);
        ref.invalidate(deliveryByOrderIdProvider(widget.orderId));
      });

  @override
  Widget build(BuildContext context) {
    final nextStatus = nextManualOrderStatus(widget.orderStatus);
    final ridersAsync = ref.watch(availableRidersProvider);
    final deliveryAsync = ref.watch(deliveryByOrderIdProvider(widget.orderId));

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.lg),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Pharmacist Actions', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: AppSpacing.sm),
          if (nextStatus != null || _canCancel)
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: [
                if (nextStatus != null)
                  FilledButton(
                    onPressed: _isWorking ? null : () => _advance(nextStatus),
                    child: Text(_actionLabels[nextStatus] ?? nextStatus),
                  ),
                if (_canCancel)
                  OutlinedButton(
                    onPressed: _isWorking ? null : _cancel,
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                    child: const Text('Mark Out of Stock'),
                  ),
              ],
            ),
          deliveryAsync.when(
            data: (delivery) {
              if (delivery.rider != null || ['delivered', 'cancelled'].contains(delivery.status)) {
                return const SizedBox.shrink();
              }
              return Padding(
                padding: const EdgeInsets.only(top: AppSpacing.sm),
                child: ridersAsync.when(
                  data: (riders) => riders.isEmpty
                      ? Text('No riders exist yet.', style: Theme.of(context).textTheme.bodyMedium)
                      : Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _riderChoice,
                                decoration: const InputDecoration(labelText: 'Assign a rider'),
                                items: [
                                  for (final rider in riders)
                                    DropdownMenuItem(value: rider.id, child: Text(rider.name)),
                                ],
                                onChanged: (value) => setState(() => _riderChoice = value),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            FilledButton(
                              onPressed: _isWorking || _riderChoice == null
                                  ? null
                                  : () => _assignRider(delivery.id),
                              child: const Text('Assign'),
                            ),
                          ],
                        ),
                  loading: () => const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  error: (_, _) => const SizedBox.shrink(),
                ),
              );
            },
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}
