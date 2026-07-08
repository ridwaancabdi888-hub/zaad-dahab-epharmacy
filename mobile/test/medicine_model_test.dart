import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/catalog/data/medicine_model.dart';

void main() {
  group('MedicineModel.fromJson', () {
    test('handles bare id strings for pharmacy/category', () {
      final medicine = MedicineModel.fromJson({
        '_id': 'med1',
        'name': 'Vitality Multivitamin',
        'unit': '60 Capsules',
        'price': 24.99,
        'stock': 10,
        'requiresPrescription': false,
        'pharmacy': 'pharm1',
        'category': 'cat1',
      });

      expect(medicine.pharmacyId, 'pharm1');
      expect(medicine.pharmacyName, isNull);
      expect(medicine.categoryId, 'cat1');
      expect(medicine.categoryName, isNull);
      expect(medicine.effectivePrice, 24.99);
      expect(medicine.inStock, isTrue);
    });

    test('handles populated pharmacy/category objects', () {
      final medicine = MedicineModel.fromJson({
        '_id': 'med2',
        'name': 'Dermo-Clear Wash',
        'unit': '250ml',
        'price': 18.50,
        'discountPrice': 15.00,
        'stock': 0,
        'requiresPrescription': true,
        'pharmacy': {'_id': 'pharm2', 'name': 'City Pharmacy', 'isVerified': true},
        'category': {'_id': 'cat2', 'name': 'Skincare'},
      });

      expect(medicine.pharmacyId, 'pharm2');
      expect(medicine.pharmacyName, 'City Pharmacy');
      expect(medicine.categoryId, 'cat2');
      expect(medicine.categoryName, 'Skincare');
      expect(medicine.effectivePrice, 15.00);
      expect(medicine.inStock, isFalse);
    });
  });
}
