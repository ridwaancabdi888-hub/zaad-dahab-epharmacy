import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_dimens.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../application/paginated_medicines_controller.dart';
import 'medicine_card.dart';

/// A medicine grid that loads more results as the user scrolls near the
/// bottom, backed by [paginatedMedicinesProvider]. Shared by category
/// browsing and search so both get identical pagination/loading/error
/// behavior.
class PaginatedMedicineGrid extends ConsumerStatefulWidget {
  const PaginatedMedicineGrid({
    super.key,
    required this.filter,
    this.emptyTitle = 'No products found',
    this.emptyMessage,
  });

  final MedicineFilter filter;
  final String emptyTitle;
  final String? emptyMessage;

  @override
  ConsumerState<PaginatedMedicineGrid> createState() => _PaginatedMedicineGridState();
}

class _PaginatedMedicineGridState extends ConsumerState<PaginatedMedicineGrid> {
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
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(paginatedMedicinesProvider(widget.filter).notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(paginatedMedicinesProvider(widget.filter));

    if (state.isLoading) {
      return const LoadingIndicator();
    }

    if (state.error != null) {
      return ErrorView(
        error: state.error!,
        onRetry: () => ref.read(paginatedMedicinesProvider(widget.filter).notifier).refresh(),
      );
    }

    if (state.items.isEmpty) {
      return EmptyState(icon: Icons.search_off, title: widget.emptyTitle, message: widget.emptyMessage);
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(paginatedMedicinesProvider(widget.filter).notifier).refresh(),
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(AppSpacing.containerMargin),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: context.gridColumns,
          mainAxisSpacing: AppSpacing.gutter,
          crossAxisSpacing: AppSpacing.gutter,
          childAspectRatio: 0.66,
        ),
        itemCount: state.items.length + (state.hasMore || state.loadMoreError != null ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.items.length) {
            if (state.loadMoreError != null) {
              return Center(
                child: TextButton(
                  onPressed: () =>
                      ref.read(paginatedMedicinesProvider(widget.filter).notifier).loadMore(),
                  child: const Text('Retry'),
                ),
              );
            }
            return const InlineLoadingIndicator();
          }
          return MedicineCard(medicine: state.items[index]);
        },
      ),
    );
  }
}
