import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../catalog/data/medicine_model.dart';
import '../data/wishlist_repository.dart';

final wishlistRepositoryProvider = Provider<WishlistRepository>((ref) {
  return WishlistRepository(apiClient: ref.watch(apiClientProvider));
});

final wishlistControllerProvider =
    StateNotifierProvider<WishlistController, AsyncValue<List<MedicineModel>>>((ref) {
  return WishlistController(ref.watch(wishlistRepositoryProvider));
});

class WishlistController extends StateNotifier<AsyncValue<List<MedicineModel>>> {
  WishlistController(this._repository) : super(const AsyncValue.loading()) {
    refresh();
  }

  final WishlistRepository _repository;

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_repository.getWishlist);
  }

  bool isSaved(String medicineId) {
    return state.valueOrNull?.any((m) => m.id == medicineId) ?? false;
  }

  /// Mutations preserve the last good list on failure (same rationale as
  /// `CartController`): a failed toggle shouldn't blank the whole screen.
  Future<void> toggle(String medicineId) async {
    final saved = isSaved(medicineId);
    final updated = saved ? await _repository.remove(medicineId) : await _repository.add(medicineId);
    state = AsyncValue.data(updated);
  }
}
