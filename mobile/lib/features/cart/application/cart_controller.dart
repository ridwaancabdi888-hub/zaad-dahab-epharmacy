import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/cart_model.dart';
import '../data/cart_repository.dart';

final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository(apiClient: ref.watch(apiClientProvider));
});

final cartControllerProvider = StateNotifierProvider<CartController, AsyncValue<CartModel>>((ref) {
  return CartController(ref.watch(cartRepositoryProvider));
});

class CartController extends StateNotifier<AsyncValue<CartModel>> {
  CartController(this._repository) : super(const AsyncValue.loading()) {
    refresh();
  }

  final CartRepository _repository;

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_repository.getCart);
  }

  /// Unlike [refresh], these mutations deliberately don't route failures
  /// through [state] — doing so would blank out an otherwise-healthy cart
  /// behind a full error view just because, say, one add-to-cart hit a
  /// stock limit. Instead the previous good state is preserved and the
  /// exception is rethrown for the caller to show as a snackbar.
  Future<void> addItem(String medicineId, {int quantity = 1}) {
    return _mutate(() => _repository.addItem(medicineId, quantity: quantity));
  }

  Future<void> updateItemQuantity(String medicineId, int quantity) {
    return _mutate(() => _repository.updateItemQuantity(medicineId, quantity));
  }

  Future<void> removeItem(String medicineId) {
    return _mutate(() => _repository.removeItem(medicineId));
  }

  Future<void> clear() {
    return _mutate(_repository.clear);
  }

  Future<void> _mutate(Future<CartModel> Function() action) async {
    final updated = await action();
    state = AsyncValue.data(updated);
  }
}
