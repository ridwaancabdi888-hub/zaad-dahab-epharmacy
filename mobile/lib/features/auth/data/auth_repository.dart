import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import 'user_model.dart';

/// Result of a successful register/login/refresh call.
class AuthResult {
  const AuthResult({required this.user, required this.accessToken, required this.refreshToken});

  final UserModel user;
  final String accessToken;
  final String refreshToken;

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }
}

/// Talks to the `/auth` and `/users/me` endpoints; owns persisting the
/// resulting tokens via [TokenStorage]. All business/UI state lives in
/// `AuthController`, not here.
class AuthRepository {
  AuthRepository({required this._apiClient, required this._tokenStorage});

  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final json = await _apiClient.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    }) as Map<String, dynamic>;

    final result = AuthResult.fromJson(json);
    await _persist(result);
    return result;
  }

  Future<AuthResult> login({required String email, required String password}) async {
    final json = await _apiClient.post('/auth/login', data: {
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;

    final result = AuthResult.fromJson(json);
    await _persist(result);
    return result;
  }

  Future<UserModel> fetchCurrentUser() async {
    final json = await _apiClient.get('/users/me') as Map<String, dynamic>;
    return UserModel.fromJson(json);
  }

  Future<void> logout() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    try {
      await _apiClient.post('/auth/logout', data: {'refreshToken': refreshToken});
    } finally {
      await _tokenStorage.clear();
    }
  }

  /// Returns the dev-only reset token when the backend includes one
  /// (non-production sandbox behavior; see `auth.service.js#forgotPassword`).
  Future<String?> forgotPassword(String email) async {
    final json = await _apiClient.post('/auth/forgot-password', data: {
      'email': email,
    }) as Map<String, dynamic>;
    return json['resetToken'] as String?;
  }

  Future<void> resetPassword({required String token, required String password}) async {
    await _apiClient.post('/auth/reset-password', data: {
      'token': token,
      'password': password,
    });
  }

  Future<UserModel> addAddress({
    required String label,
    required String street,
    required String city,
    bool isDefault = false,
  }) async {
    final json = await _apiClient.post('/users/me/addresses', data: {
      'label': label,
      'street': street,
      'city': city,
      'isDefault': isDefault,
    }) as Map<String, dynamic>;
    return UserModel.fromJson(json);
  }

  Future<void> _persist(AuthResult result) {
    return _tokenStorage.saveTokens(
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    );
  }
}
