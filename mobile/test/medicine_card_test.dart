import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/medicine_model.dart';
import 'package:zaad_dahab_mobile/features/catalog/presentation/medicine_card.dart';
import 'package:zaad_dahab_mobile/features/wishlist/application/wishlist_controller.dart';
import 'package:zaad_dahab_mobile/features/wishlist/data/wishlist_repository.dart';

class _FakeWishlistRepository implements WishlistRepository {
  @override
  Future<List<MedicineModel>> getWishlist() async => [];

  @override
  Future<List<MedicineModel>> add(String medicineId) async => [];

  @override
  Future<List<MedicineModel>> remove(String medicineId) async => [];
}

void main() {
  // Regression test: the catalog grid uses a fixed childAspectRatio (0.66
  // — see paginated_medicine_grid.dart), so MedicineCard's image area
  // must flex to fit whatever a two-line product name needs, rather than
  // claiming a fixed height itself (an AspectRatio-based image would risk
  // overflowing here, the same category of bug as the Home category
  // strip's earlier EmptyState overflow — see empty_state_test.dart).
  testWidgets(
      'MedicineCard with a long two-line name fits a fixed-aspect-ratio grid cell without overflowing',
      (tester) async {
    const medicine = MedicineModel(
      id: 'med1',
      name: 'Extra Strength Broad-Spectrum Cold & Flu Relief Tablets 500mg',
      unit: '30 Tablets',
      price: 12.99,
      stock: 10,
      requiresPrescription: false,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          wishlistControllerProvider.overrideWith(
            (ref) => WishlistController(_FakeWishlistRepository()),
          ),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 340,
              child: GridView.count(
                crossAxisCount: 2,
                childAspectRatio: 0.66,
                children: const [MedicineCard(medicine: medicine)],
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.textContaining('Extra Strength'), findsOneWidget);
  });
}
