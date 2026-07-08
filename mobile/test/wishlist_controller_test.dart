import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/medicine_model.dart';
import 'package:zaad_dahab_mobile/features/wishlist/application/wishlist_controller.dart';
import 'package:zaad_dahab_mobile/features/wishlist/data/wishlist_repository.dart';

MedicineModel _medicine(String id) => MedicineModel(
      id: id,
      name: 'Medicine $id',
      unit: '1 unit',
      price: 10,
      stock: 5,
      requiresPrescription: false,
    );

class _FakeWishlistRepository implements WishlistRepository {
  List<MedicineModel> saved = [];

  @override
  Future<List<MedicineModel>> getWishlist() async => saved;

  @override
  Future<List<MedicineModel>> add(String medicineId) async {
    if (!saved.any((m) => m.id == medicineId)) {
      saved = [...saved, _medicine(medicineId)];
    }
    return saved;
  }

  @override
  Future<List<MedicineModel>> remove(String medicineId) async {
    saved = saved.where((m) => m.id != medicineId).toList();
    return saved;
  }
}

void main() {
  group('WishlistController', () {
    test('starts empty and reports items as unsaved', () async {
      final controller = WishlistController(_FakeWishlistRepository());
      await Future<void>.delayed(Duration.zero);

      expect(controller.state.valueOrNull, isEmpty);
      expect(controller.isSaved('med1'), isFalse);
    });

    test('toggle adds then removes a medicine', () async {
      final controller = WishlistController(_FakeWishlistRepository());
      await Future<void>.delayed(Duration.zero);

      await controller.toggle('med1');
      expect(controller.isSaved('med1'), isTrue);
      expect(controller.state.valueOrNull, hasLength(1));

      await controller.toggle('med1');
      expect(controller.isSaved('med1'), isFalse);
      expect(controller.state.valueOrNull, isEmpty);
    });

    test('toggling one medicine does not affect another', () async {
      final controller = WishlistController(_FakeWishlistRepository());
      await Future<void>.delayed(Duration.zero);

      await controller.toggle('med1');
      await controller.toggle('med2');

      expect(controller.isSaved('med1'), isTrue);
      expect(controller.isSaved('med2'), isTrue);
      expect(controller.state.valueOrNull, hasLength(2));
    });
  });
}
