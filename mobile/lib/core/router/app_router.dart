import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/application/auth_state.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/reset_password_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/categories/presentation/categories_screen.dart';
import '../../features/delivery/presentation/rider_completed_deliveries_screen.dart';
import '../../features/delivery/presentation/rider_deliveries_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/orders/presentation/pharmacist_orders_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/shell/main_shell.dart';
import '../../features/shell/rider_shell.dart';
import '../../features/splash/splash_screen.dart';
import 'route_paths.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  final notifier = _RouterRefreshNotifier(ref);
  ref.onDispose(notifier.dispose);

  return GoRouter(
    initialLocation: RoutePaths.splash,
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(path: RoutePaths.splash, builder: (context, state) => const SplashScreen()),
      GoRoute(
        path: RoutePaths.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(path: RoutePaths.login, builder: (context, state) => const LoginScreen()),
      GoRoute(path: RoutePaths.register, builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: RoutePaths.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: RoutePaths.resetPassword,
        builder: (context, state) => ResetPasswordScreen(
          prefillToken: state.uri.queryParameters['token'],
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: RoutePaths.home, builder: (context, state) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.categories,
                builder: (context, state) => const CategoriesScreen(),
              ),
            ],
          ),
          // Only surfaced as a nav tab for pharmacists (see MainShell) —
          // still registered here so the route exists for everyone;
          // the router's redirect guards a customer straight back out.
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.orders,
                builder: (context, state) => const PharmacistOrdersScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: RoutePaths.cart, builder: (context, state) => const CartScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.profile,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => RiderShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.riderDeliveries,
                builder: (context, state) => const RiderDeliveriesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.riderCompleted,
                builder: (context, state) => const RiderCompletedDeliveriesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.riderNotifications,
                builder: (context, state) => const NotificationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: RoutePaths.riderProfile,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

/// Bridges Riverpod's [authControllerProvider] to go_router's
/// `refreshListenable`/`redirect` API, which expects a plain
/// [Listenable]+synchronous-redirect pair rather than a provider.
class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(this._ref) {
    _subscription = _ref.listen<AuthState>(
      authControllerProvider,
      (previous, next) {
        if (previous?.status != next.status) notifyListeners();
      },
    );
  }

  final Ref _ref;
  late final ProviderSubscription<AuthState> _subscription;

  String? redirect(BuildContext context, GoRouterState state) {
    final authState = _ref.read(authControllerProvider);
    final location = state.matchedLocation;

    if (authState.status == AuthStatus.unknown) {
      return location == RoutePaths.splash ? null : RoutePaths.splash;
    }

    if (authState.status == AuthStatus.unauthenticated) {
      if (location == RoutePaths.splash) return null; // splash decides where to go next
      return RoutePaths.publicRoutes.contains(location) ? null : RoutePaths.login;
    }

    // Authenticated: send riders to their own shell (Active/Completed/
    // Alerts/Profile) instead of the customer shopping shell, and never
    // let the user land back on splash/onboarding/auth. Pharmacists stay
    // in the same shell as customers — they just get an extra "Orders"
    // tab (see MainShell) — so the only pharmacist-specific rule here is
    // keeping a non-pharmacist out of that tab's route directly.
    final isRider = authState.user?.role == 'rider';
    final isPharmacist = authState.user?.role == 'pharmacist';
    final riderHome = RoutePaths.riderDeliveries;
    final isSplashOrPublic =
        location == RoutePaths.splash || RoutePaths.publicRoutes.contains(location);

    if (isSplashOrPublic) {
      return isRider ? riderHome : RoutePaths.home;
    }
    if (isRider && !location.startsWith('/rider')) {
      return riderHome;
    }
    if (!isRider && location.startsWith('/rider')) {
      return RoutePaths.home;
    }
    if (!isPharmacist && location == RoutePaths.orders) {
      return RoutePaths.home;
    }
    return null;
  }

  @override
  void dispose() {
    _subscription.close();
    super.dispose();
  }
}
