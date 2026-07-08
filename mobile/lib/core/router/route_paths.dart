/// Central registry of route paths/names so screens never hardcode
/// string literals when navigating.
abstract final class RoutePaths {
  static const splash = '/splash';
  static const onboarding = '/onboarding';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const resetPassword = '/reset-password';

  static const home = '/home';
  static const categories = '/categories';
  static const cart = '/cart';
  static const profile = '/profile';

  static const publicRoutes = {
    login,
    register,
    forgotPassword,
    resetPassword,
    onboarding,
  };
}
