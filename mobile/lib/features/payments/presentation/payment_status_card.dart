import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../auth/application/auth_controller.dart';
import '../application/payment_providers.dart';
import '../data/payment_model.dart';
import 'payment_status_chip.dart';

const _failureMessages = {
  'insufficient_funds': 'Insufficient funds. Please top up and retry.',
  'timeout': 'The payment timed out before it was confirmed. Please retry.',
};

/// Shown on the order confirmation and order detail screens: the
/// payment's current status plus, depending on that status, a "Verify
/// Payment" or "Retry Payment" action.
class PaymentStatusCard extends ConsumerStatefulWidget {
  const PaymentStatusCard({super.key, required this.payment, required this.onChanged});

  final PaymentModel payment;

  /// Called with the refreshed payment after a successful verify/retry.
  final ValueChanged<PaymentModel> onChanged;

  @override
  ConsumerState<PaymentStatusCard> createState() => _PaymentStatusCardState();
}

class _PaymentStatusCardState extends ConsumerState<PaymentStatusCard> {
  bool _isWorking = false;

  Future<void> _run(Future<PaymentModel> Function() action) async {
    setState(() => _isWorking = true);
    try {
      final updated = await action();
      widget.onChanged(updated);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final payment = widget.payment;
    final repository = ref.read(paymentRepositoryProvider);
    final isPharmacist = ref.watch(authControllerProvider).user?.role == 'pharmacist';

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Payment', style: Theme.of(context).textTheme.headlineMedium),
              PaymentStatusChip(status: payment.status),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${payment.method.toUpperCase()} • \$${payment.amount.toStringAsFixed(2)}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (payment.isFailed) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              _failureMessages[payment.failureReason] ??
                  (payment.failureReason.isNotEmpty
                      ? payment.failureReason
                      : 'The payment failed.'),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.error),
            ),
          ],
          if (payment.isProcessing && payment.method != 'cod') ...[
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _isWorking ? null : () => _run(() => repository.verify(payment.id)),
              icon: _isWorking
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: const Text('Verify Payment'),
            ),
          ],
          if (payment.isFailed) ...[
            const SizedBox(height: AppSpacing.sm),
            OutlinedButton.icon(
              onPressed: _isWorking ? null : () => _run(() => repository.retry(payment.id)),
              icon: _isWorking
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.replay),
              label: const Text('Retry Payment'),
            ),
          ],
          if (isPharmacist && !payment.isCompleted) ...[
            const SizedBox(height: AppSpacing.sm),
            FilledButton.icon(
              onPressed: _isWorking ? null : () => _run(() => repository.confirm(payment.id)),
              icon: _isWorking
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check_circle_outline),
              label: const Text('Confirm Payment'),
            ),
          ],
        ],
      ),
    );
  }
}
