/// Client-side mirrors of the backend's express-validator rules
/// (see `backend/src/validators/auth.validator.js`), so users get instant
/// feedback instead of waiting on a round trip for basic mistakes. The
/// backend remains the source of truth and re-validates everything.
abstract final class Validators {
  static final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
  static final _phonePattern = RegExp(r'^\+?[0-9]{7,15}$');
  static final _hasLetter = RegExp(r'[A-Za-z]');
  static final _hasDigit = RegExp(r'[0-9]');

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    if (!_emailPattern.hasMatch(value.trim())) return 'Enter a valid email address';
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) return null; // optional field
    if (!_phonePattern.hasMatch(value.trim())) {
      return 'Enter 7-15 digits, optionally starting with +';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.length < 8) return 'Password must be at least 8 characters';
    if (!_hasLetter.hasMatch(value)) return 'Password must contain at least one letter';
    if (!_hasDigit.hasMatch(value)) return 'Password must contain at least one number';
    return null;
  }

  static String? Function(String?) confirmPassword(String Function() originalPassword) {
    return (value) {
      if (value != originalPassword()) return 'Passwords do not match';
      return null;
    };
  }

  static String? required(String? value, {String message = 'This field is required'}) {
    if (value == null || value.trim().isEmpty) return message;
    return null;
  }
}
