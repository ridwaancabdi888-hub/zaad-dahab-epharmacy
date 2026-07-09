import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';
import 'auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final controller = AuthController(
    repository: ref.watch(authRepositoryProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
  // Wire the API client's forced-logout hook to this controller so an
  // unrecoverable 401 anywhere in the app (not just during bootstrap)
  // drops the user back to the login screen.
  ref.watch(apiClientProvider).onSessionExpired = controller.handleSessionExpired;
  return controller;
});

class AuthController extends StateNotifier<AuthState> {
  AuthController({required this._repository, required this._tokenStorage})
      : super(const AuthState.unknown()) {
    _bootstrap();
  }

  final AuthRepository _repository;
  final TokenStorage _tokenStorage;

  Future<void> _bootstrap() async {
    final accessToken = await _tokenStorage.readAccessToken();
    if (accessToken == null) {
      state = const AuthState.unauthenticated();
      return;
    }

    try {
      final user = await _repository.fetchCurrentUser();
      state = AuthState.authenticated(user);
    } on ApiException {
      await _tokenStorage.clear();
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final result = await _repository.register(
      name: name,
      email: email,
      password: password,
      phone: phone,
    );
    state = AuthState.authenticated(result.user);
  }

  Future<void> login({required String email, required String password}) async {
    final result = await _repository.login(email: email, password: password);
    state = AuthState.authenticated(result.user);
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }

  Future<String?> forgotPassword(String email) => _repository.forgotPassword(email);

  Future<void> resetPassword({required String token, required String password}) {
    return _repository.resetPassword(token: token, password: password);
  }

  Future<void> addAddress({
    required String label,
    required String street,
    required String city,
    bool isDefault = false,
  }) async {
    final user = await _repository.addAddress(
      label: label,
      street: street,
      city: city,
      isDefault: isDefault,
    );
    state = AuthState.authenticated(user);
  }

  /// Called by [ApiClient] when a background request's silent token
  /// refresh fails. Tokens are already cleared by that point.
  void handleSessionExpired() {
    if (state.status != AuthStatus.unauthenticated) {
      state = const AuthState.unauthenticated(
        errorMessage: 'Your session has expired. Please log in again.',
      );
    }
  }
}
