import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/core/utils/validators.dart';

void main() {
  group('Validators.email', () {
    test('rejects empty input', () {
      expect(Validators.email(''), isNotNull);
    });

    test('rejects malformed addresses', () {
      expect(Validators.email('not-an-email'), isNotNull);
    });

    test('accepts a valid address', () {
      expect(Validators.email('amina@example.com'), isNull);
    });
  });

  group('Validators.password', () {
    test('rejects passwords shorter than 8 characters', () {
      expect(Validators.password('abc123'), isNotNull);
    });

    test('rejects passwords without a letter', () {
      expect(Validators.password('12345678'), isNotNull);
    });

    test('rejects passwords without a digit', () {
      expect(Validators.password('abcdefgh'), isNotNull);
    });

    test('accepts a valid password', () {
      expect(Validators.password('Str0ngPass'), isNull);
    });
  });

  group('Validators.phone', () {
    test('treats an empty phone as valid (optional field)', () {
      expect(Validators.phone(''), isNull);
    });

    test('rejects a phone with letters', () {
      expect(Validators.phone('12abc34'), isNotNull);
    });

    test('accepts a valid international phone number', () {
      expect(Validators.phone('+252611234567'), isNull);
    });
  });

  group('Validators.confirmPassword', () {
    test('rejects a mismatched confirmation', () {
      final validator = Validators.confirmPassword(() => 'Str0ngPass');
      expect(validator('Different1'), isNotNull);
    });

    test('accepts a matching confirmation', () {
      final validator = Validators.confirmPassword(() => 'Str0ngPass');
      expect(validator('Str0ngPass'), isNull);
    });
  });
}
