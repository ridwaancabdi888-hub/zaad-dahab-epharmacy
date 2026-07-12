import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/theme/app_text_styles.dart';
import '../auth/application/auth_controller.dart';
import '../cart/application/cart_controller.dart';

/// Persistent bottom-navigation scaffold wrapping the Home/Categories/
/// [Orders]/Cart/Profile tabs. Each tab keeps its own navigation stack
/// via go_router's [StatefulShellRoute.indexedStack] — the "Orders" tab
/// is one of that stack's branches too (see app_router.dart), just
/// hidden from non-pharmacists here rather than living in a whole
/// separate shell, so a pharmacist otherwise gets the exact same app a
/// customer does.
///
/// Branch indices are fixed by their registration order in the router:
/// 0 Home, 1 Categories, 2 Orders, 3 Cart, 4 Profile.
class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _home = (icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home');
  static const _categories =
      (icon: Icons.category_outlined, activeIcon: Icons.category, label: 'Categories');
  static const _orders =
      (icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Orders');
  static const _cart =
      (icon: Icons.shopping_cart_outlined, activeIcon: Icons.shopping_cart, label: 'Cart');
  static const _profile = (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartControllerProvider).valueOrNull?.itemCount ?? 0;
    final isPharmacist = ref.watch(authControllerProvider).user?.role == 'pharmacist';

    final destinations = isPharmacist
        ? [_home, _categories, _orders, _cart, _profile]
        : [_home, _categories, _cart, _profile];
    // Maps each visible tab's position to its actual router branch index
    // (see the class doc) — customers skip branch 2 (Orders) entirely.
    final branchIndices = isPharmacist ? [0, 1, 2, 3, 4] : [0, 1, 3, 4];

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          border: Border(top: BorderSide(color: AppColors.surfaceContainerHigh)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: AppSizes.bottomNavHeight,
            child: Row(
              children: [
                for (var i = 0; i < destinations.length; i++)
                  Expanded(
                    child: _NavItem(
                      icon: destinations[i].icon,
                      activeIcon: destinations[i].activeIcon,
                      label: destinations[i].label,
                      isActive: branchIndices[i] == navigationShell.currentIndex,
                      badgeCount: branchIndices[i] == 3 ? cartCount : 0,
                      onTap: () => navigationShell.goBranch(
                        branchIndices[i],
                        initialLocation: branchIndices[i] == navigationShell.currentIndex,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.badgeCount = 0,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final int badgeCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.primary : AppColors.outline;

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(isActive ? activeIcon : icon, color: color, size: 24),
              if (badgeCount > 0)
                Positioned(
                  right: -8,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppColors.error,
                      borderRadius: BorderRadius.circular(AppRadii.full),
                    ),
                    constraints: const BoxConstraints(minWidth: 16),
                    child: Text(
                      '$badgeCount',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.labelMd.copyWith(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(label, style: AppTextStyles.labelMd.copyWith(color: color)),
          const SizedBox(height: 4),
          AnimatedOpacity(
            opacity: isActive ? 1 : 0,
            duration: const Duration(milliseconds: 150),
            child: Container(
              width: 4,
              height: 4,
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
    );
  }
}
