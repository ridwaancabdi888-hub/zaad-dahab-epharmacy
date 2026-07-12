import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../data/order_model.dart';

const _stages = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const _stageLabels = {
  'pending': 'Order placed',
  'confirmed': 'Confirmed',
  'preparing': 'Preparing',
  'out_for_delivery': 'Out for delivery',
  'delivered': 'Delivered',
};

String _formatTime(DateTime time) {
  final hour12 = time.hour % 12 == 0 ? 12 : time.hour % 12;
  final period = time.hour < 12 ? 'AM' : 'PM';
  final minute = time.minute.toString().padLeft(2, '0');
  return '$hour12:$minute $period';
}

/// A forward-looking, all-stages stepper for the order's own lifecycle
/// (not the delivery sub-record's history-only timeline — see
/// `DeliveryStatusTimeline` for that) — shows every stage the order will
/// pass through, so a customer can see at a glance both what's already
/// happened and what's still ahead, not just a single status word.
class OrderStatusStepper extends StatelessWidget {
  const OrderStatusStepper({super.key, required this.order});

  final OrderModel order;

  @override
  Widget build(BuildContext context) {
    final timestamps = {for (final event in order.statusHistory) event.status: event.at};

    if (order.status == 'cancelled') {
      // Whatever stages were actually reached before cancellation (from
      // statusHistory) still show as completed; cancellation replaces
      // whatever would have come next rather than continuing the list.
      final reachedBeforeCancel = _stages.where(timestamps.containsKey).toList(growable: false);
      return Column(
        children: [
          for (var i = 0; i < reachedBeforeCancel.length; i++)
            _StepRow(
              label: _stageLabels[reachedBeforeCancel[i]]!,
              at: timestamps[reachedBeforeCancel[i]],
              state: _StepState.completed,
              isLast: false,
            ),
          _StepRow(
            label: 'Cancelled',
            at: timestamps['cancelled'],
            state: _StepState.cancelled,
            isLast: true,
          ),
        ],
      );
    }

    final currentIndex = _stages.indexOf(order.status);
    return Column(
      children: [
        for (var i = 0; i < _stages.length; i++)
          _StepRow(
            label: _stageLabels[_stages[i]]!,
            at: timestamps[_stages[i]],
            state: i < currentIndex
                ? _StepState.completed
                : i == currentIndex
                    ? _StepState.current
                    : _StepState.upcoming,
            isLast: i == _stages.length - 1,
          ),
      ],
    );
  }
}

enum _StepState { completed, current, upcoming, cancelled }

class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, required this.at, required this.state, required this.isLast});

  final String label;
  final DateTime? at;
  final _StepState state;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final isReached = state == _StepState.completed || state == _StepState.current;
    final dotColor = switch (state) {
      _StepState.completed => AppColors.primary,
      _StepState.current => AppColors.primary,
      _StepState.upcoming => AppColors.surfaceContainerLowest,
      _StepState.cancelled => AppColors.error,
    };
    final textStyle = switch (state) {
      _StepState.upcoming => Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.outline),
      _StepState.current => Theme.of(context)
          .textTheme
          .bodyLarge
          ?.copyWith(fontWeight: FontWeight.w700, color: AppColors.onSurface),
      _ => Theme.of(context).textTheme.bodyLarge,
    };

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 20,
                height: 20,
                margin: const EdgeInsets.only(top: 2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dotColor,
                  border: Border.all(
                    color: state == _StepState.upcoming ? AppColors.outline : dotColor,
                    width: 2,
                  ),
                ),
                child: isReached
                    ? const Icon(Icons.check, size: 13, color: Colors.white)
                    : state == _StepState.cancelled
                        ? const Icon(Icons.close, size: 13, color: Colors.white)
                        : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: isReached ? AppColors.primary : AppColors.surfaceContainerHigh,
                  ),
                ),
            ],
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(label, style: textStyle),
                  if (at != null)
                    Text(_formatTime(at!), style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
