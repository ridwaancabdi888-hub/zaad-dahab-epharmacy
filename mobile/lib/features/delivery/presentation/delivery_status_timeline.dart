import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../data/delivery_model.dart';
import 'delivery_status_chip.dart';

String _formatTime(DateTime time) {
  final hour12 = time.hour % 12 == 0 ? 12 : time.hour % 12;
  final period = time.hour < 12 ? 'AM' : 'PM';
  final minute = time.minute.toString().padLeft(2, '0');
  return '$hour12:$minute $period';
}

/// Vertical timeline of a delivery's status history, newest first —
/// used on the customer-facing order tracking view.
class DeliveryStatusTimeline extends StatelessWidget {
  const DeliveryStatusTimeline({super.key, required this.events});

  final List<DeliveryStatusEvent> events;

  @override
  Widget build(BuildContext context) {
    final ordered = events.reversed.toList(growable: false);

    return Column(
      children: [
        for (var i = 0; i < ordered.length; i++)
          _TimelineRow(
            event: ordered[i],
            isFirst: i == 0,
            isLast: i == ordered.length - 1,
          ),
      ],
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.event, required this.isFirst, required this.isLast});

  final DeliveryStatusEvent event;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                margin: const EdgeInsets.only(top: 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isFirst ? AppColors.primary : AppColors.outlineVariant,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(width: 2, color: AppColors.surfaceContainerHigh),
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
                  DeliveryStatusChip(status: event.status),
                  Text(_formatTime(event.at), style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
