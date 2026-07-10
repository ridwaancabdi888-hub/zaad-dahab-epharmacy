import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../delivery/presentation/rider_delivery_detail_screen.dart';
import '../../orders/presentation/order_detail_screen.dart';
import '../application/notification_providers.dart';
import '../data/notification_model.dart';

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _formatDate(DateTime date) {
  final hour12 = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final period = date.hour < 12 ? 'AM' : 'PM';
  final minute = date.minute.toString().padLeft(2, '0');
  return '${_months[date.month - 1]} ${date.day}, ${date.year} • $hour12:$minute $period';
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(notificationsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsProvider);
    final hasUnread = state.items.any((n) => !n.isRead);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllRead(),
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: SafeArea(
        child: ResponsiveCenter(
          child: Builder(
            builder: (context) {
              if (state.isLoading) return const LoadingIndicator();
              if (state.error != null) {
                return ErrorView(
                  error: state.error!,
                  onRetry: () => ref.read(notificationsProvider.notifier).refresh(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: Icons.notifications_none,
                  title: 'No notifications yet',
                  message: 'Updates about your orders and deliveries will show up here.',
                );
              }
              return RefreshIndicator(
                onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
                child: ListView.separated(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(AppSpacing.containerMargin),
                  itemCount: state.items.length + (state.hasMore ? 1 : 0),
                  separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    if (index >= state.items.length) {
                      return const InlineLoadingIndicator();
                    }
                    return _NotificationTile(notification: state.items[index]);
                  },
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.notification});

  final NotificationModel notification;

  IconData get _icon => switch (notification.type) {
        'order_cancelled' => Icons.cancel_outlined,
        'rider_assigned' => Icons.local_shipping,
        _ => Icons.local_shipping_outlined,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      onTap: () async {
        if (!notification.isRead) {
          await ref.read(notificationsProvider.notifier).markRead(notification.id);
        }
        if (!context.mounted) return;
        if (notification.opensDeliveryDetail) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => RiderDeliveryDetailScreen(deliveryId: notification.deliveryId!),
            ),
          );
        } else if (notification.orderId != null) {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: notification.orderId!)),
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: notification.isRead ? AppColors.surfaceContainerLowest : AppColors.rxBackground,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(_icon, color: AppColors.primary),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: notification.isRead ? FontWeight.w400 : FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(notification.message, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(notification.createdAt),
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: AppColors.outline, fontSize: 12),
                  ),
                ],
              ),
            ),
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}
