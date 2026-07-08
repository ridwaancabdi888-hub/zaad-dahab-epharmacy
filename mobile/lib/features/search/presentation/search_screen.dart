import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/responsive_center.dart';
import '../../catalog/presentation/paginated_medicine_grid.dart';

/// Dedicated search experience: debounced search-as-you-type against
/// `/medicines?search=`, reusing the same paginated grid as category
/// browsing.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      setState(() => _query = value.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          onChanged: _onChanged,
          decoration: const InputDecoration(
            hintText: 'Search medicines, wellness…',
            border: InputBorder.none,
          ),
        ),
        actions: [
          if (_controller.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                _controller.clear();
                setState(() => _query = '');
              },
            ),
        ],
      ),
      body: SafeArea(
        child: ResponsiveCenter(
          child: _query.isEmpty
              ? const EmptyState(
                  icon: Icons.search,
                  title: 'Search for medicines',
                  message: 'Find products by name across every partner pharmacy.',
                )
              : PaginatedMedicineGrid(
                  key: ValueKey(_query),
                  filter: (categoryId: null, search: _query),
                  emptyTitle: 'No results for "$_query"',
                  emptyMessage: 'Try a different search term.',
                ),
        ),
      ),
    );
  }
}
