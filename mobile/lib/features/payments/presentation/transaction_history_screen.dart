import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../orders/presentation/order_detail_screen.dart';
import '../application/payment_providers.dart';
import '../data/payment_model.dart';
import 'payment_status_chip.dart';

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

class TransactionHistoryScreen extends ConsumerStatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  ConsumerState<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends ConsumerState<TransactionHistoryScreen> {
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
      ref.read(paymentHistoryProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(paymentHistoryProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Transaction History')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: Builder(
            builder: (context) {
              if (state.isLoading) return const LoadingIndicator();
              if (state.error != null) {
                return ErrorView(
                  error: state.error!,
                  onRetry: () => ref.read(paymentHistoryProvider.notifier).refresh(),
                );
              }
              if (state.items.isEmpty) {
                return const EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: 'No transactions yet',
                  message: 'Your orders and payments will show up here.',
                );
              }
              return RefreshIndicator(
                onRefresh: () => ref.read(paymentHistoryProvider.notifier).refresh(),
                child: ListView.separated(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(AppSpacing.containerMargin),
                  itemCount: state.items.length + (state.hasMore ? 1 : 0),
                  separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    if (index >= state.items.length) {
                      return const InlineLoadingIndicator();
                    }
                    return _TransactionTile(payment: state.items[index]);
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

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.payment});

  final PaymentModel payment;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: payment.orderId)),
      ),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          border: Border.all(color: AppColors.surfaceContainerHigh),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payment.orderNumber != null ? '#${payment.orderNumber}' : payment.method.toUpperCase(),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '${payment.method.toUpperCase()} • ${_formatDate(payment.createdAt)}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '\$${payment.amount.toStringAsFixed(2)}',
                  style: Theme.of(context)
                      .textTheme
                      .bodyLarge
                      ?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                PaymentStatusChip(status: payment.status),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
