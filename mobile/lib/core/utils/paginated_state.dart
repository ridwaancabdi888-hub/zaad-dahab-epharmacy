/// Generic "load more" pagination state: an initial page load (tracked by
/// [isLoading]/[error]) followed by any number of appended pages (tracked
/// by [isLoadingMore]/[loadMoreError]), without ever discarding items
/// already fetched on a later page's failure.
class PaginatedState<T> {
  const PaginatedState({
    this.items = const [],
    this.page = 0,
    this.hasMore = true,
    this.isLoading = true,
    this.isLoadingMore = false,
    this.error,
    this.loadMoreError,
  });

  final List<T> items;
  final int page;
  final bool hasMore;
  final bool isLoading;
  final bool isLoadingMore;
  final Object? error;
  final Object? loadMoreError;

  PaginatedState<T> copyWith({
    List<T>? items,
    int? page,
    bool? hasMore,
    bool? isLoading,
    bool? isLoadingMore,
    Object? error,
    bool clearError = false,
    Object? loadMoreError,
    bool clearLoadMoreError = false,
  }) {
    return PaginatedState<T>(
      items: items ?? this.items,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: clearError ? null : (error ?? this.error),
      loadMoreError: clearLoadMoreError ? null : (loadMoreError ?? this.loadMoreError),
    );
  }
}
