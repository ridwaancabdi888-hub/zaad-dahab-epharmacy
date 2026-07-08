import 'package:dio/dio.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

/// Base URL for the backend REST API. Override at build/run time with
/// `--dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1` (Android
/// emulator) or your machine's LAN IP for a physical device. Defaults to
/// `localhost`, which is correct for web and desktop runs against a
/// locally-running backend.
const String _defaultBaseUrl = 'http://localhost:5000/api/v1';
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: _defaultBaseUrl,
);

/// Thin, auth-aware HTTP client around the backend REST API.
///
/// Owns the access/refresh token lifecycle end to end: it attaches the
/// bearer token to every request, and on a 401 transparently attempts a
/// single silent refresh (via the raw refresh-token endpoint, not through
/// [AuthController], to avoid a circular dependency) before retrying the
/// original request once. If the refresh itself fails, tokens are cleared
/// and [onSessionExpired] is invoked so the UI can drop back to the login
/// screen.
class ApiClient {
  ApiClient({required this._tokenStorage, Dio? dio})
      : _dio = dio ?? Dio(BaseOptions(baseUrl: apiBaseUrl)) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!options.path.startsWith('/auth/')) {
            final token = await _tokenStorage.readAccessToken();
            if (token != null) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final isAuthRoute = error.requestOptions.path.startsWith('/auth/');
          final isUnauthorized = error.response?.statusCode == 401;

          if (!isAuthRoute && isUnauthorized && !_isRetry(error.requestOptions)) {
            final refreshed = await _tryRefresh();
            if (refreshed != null) {
              final retryOptions = error.requestOptions;
              retryOptions.headers['Authorization'] = 'Bearer $refreshed';
              retryOptions.extra['retried'] = true;
              try {
                final response = await _dio.fetch(retryOptions);
                return handler.resolve(response);
              } on DioException catch (retryError) {
                return handler.next(retryError);
              }
            }
            await _tokenStorage.clear();
            onSessionExpired?.call();
          }

          handler.next(error);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage _tokenStorage;

  /// Invoked when a request fails auth and the silent refresh also fails.
  /// Wired up once at app startup to reset [AuthController] to the signed
  /// out state.
  void Function()? onSessionExpired;

  bool _isRetry(RequestOptions options) => options.extra['retried'] == true;

  Future<String?> _tryRefresh() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) return null;

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );
      final data = response.data?['data'] as Map<String, dynamic>?;
      final newAccessToken = data?['accessToken'] as String?;
      final newRefreshToken = data?['refreshToken'] as String?;
      if (newAccessToken == null || newRefreshToken == null) return null;

      await _tokenStorage.saveTokens(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      );
      return newAccessToken;
    } on DioException {
      return null;
    }
  }

  /// Returns the unwrapped `data` field of the `{ success, message, data }`
  /// envelope. Its runtime shape depends on the endpoint: a `Map` for a
  /// single resource, a `List` for a bare collection, or `null` for empty
  /// responses. Callers cast to whatever their endpoint actually returns.
  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send(() => _dio.get<Map<String, dynamic>>(path, queryParameters: query));
  }

  Future<dynamic> post(String path, {Object? data}) {
    return _send(() => _dio.post<Map<String, dynamic>>(path, data: data));
  }

  Future<dynamic> patch(String path, {Object? data}) {
    return _send(() => _dio.patch<Map<String, dynamic>>(path, data: data));
  }

  Future<dynamic> delete(String path, {Object? data}) {
    return _send(() => _dio.delete<Map<String, dynamic>>(path, data: data));
  }

  Future<dynamic> _send(
    Future<Response<Map<String, dynamic>>> Function() request,
  ) async {
    try {
      final response = await request();
      return response.data?['data'];
    } on DioException catch (error) {
      throw _toApiException(error);
    }
  }

  ApiException _toApiException(DioException error) {
    final response = error.response;
    if (response == null) {
      return ApiException(
        statusCode: 0,
        message: 'Could not reach the server. Please check your connection.',
      );
    }

    final body = response.data;
    final message = (body is Map && body['message'] is String)
        ? body['message'] as String
        : 'Something went wrong. Please try again.';
    final rawDetails = (body is Map) ? body['details'] : null;

    return ApiException(
      statusCode: response.statusCode ?? 0,
      message: message,
      details: rawDetails is List ? rawDetails.cast<Map<String, dynamic>>() : null,
    );
  }
}
