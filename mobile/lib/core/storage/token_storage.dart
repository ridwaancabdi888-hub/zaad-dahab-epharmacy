import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Thin wrapper around secure, encrypted-at-rest storage for the JWT
/// access/refresh token pair. Kept separate from [AuthController] so the
/// storage mechanism can be swapped without touching auth business logic.
///
/// All operations are serialized through [_synchronized]: on web,
/// `flutter_secure_storage`'s first access lazily generates and persists
/// an AES key via the browser's Web Crypto API, and two of these racing
/// (e.g. the Home screen's categories/medicines/notifications requests
/// all reading the access token in parallel on first load) can throw or
/// silently fail, which surfaced as requests that never even reached the
/// network — every caller past the first appeared to hang/fail before
/// dispatch. Serializing avoids that race regardless of platform.
class TokenStorage {
  TokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;
  Future<void> _lock = Future.value();

  static const _accessTokenKey = 'zd_access_token';
  static const _refreshTokenKey = 'zd_refresh_token';

  Future<T> _synchronized<T>(Future<T> Function() action) {
    final previous = _lock;
    final done = Completer<void>();
    _lock = done.future;
    return previous.then((_) => action()).whenComplete(done.complete);
  }

  Future<void> saveTokens({required String accessToken, required String refreshToken}) {
    return _synchronized(() async {
      await _storage.write(key: _accessTokenKey, value: accessToken);
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    });
  }

  Future<String?> readAccessToken() => _synchronized(() => _storage.read(key: _accessTokenKey));
  Future<String?> readRefreshToken() => _synchronized(() => _storage.read(key: _refreshTokenKey));

  Future<void> clear() {
    return _synchronized(() async {
      await _storage.delete(key: _accessTokenKey);
      await _storage.delete(key: _refreshTokenKey);
    });
  }
}
