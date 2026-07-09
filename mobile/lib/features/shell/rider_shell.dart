import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/theme/app_text_styles.dart';
import '../notifications/application/notification_providers.dart';

/// Persistent bottom-navigation scaffold for riders, mirroring
/// [MainShell]'s structure but with the delivery-driver tabs instead of
/// the customer shopping tabs.
class RiderShell extends ConsumerWidget {
  const RiderShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _destinations = [
    (icon: Icons.local_shipping_outlined, activeIcon: Icons.local_shipping, label: 'Active'),
    (icon: Icons.task_alt_outlined, activeIcon: Icons.task_alt, label: 'Completed'),
    (icon: Icons.notifications_none, activeIcon: Icons.notifications, label: 'Alerts'),
    (icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = ref.watch(unreadNotificationCountProvider).valueOrNull ?? 0;

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
                for (var index = 0; index < _destinations.length; index++)
                  Expanded(
                    child: _NavItem(
                      icon: _destinations[index].icon,
                      activeIcon: _destinations[index].activeIcon,
                      label: _destinations[index].label,
                      isActive: index == navigationShell.currentIndex,
                      badgeCount: index == 2 ? unreadCount : 0,
                      onTap: () => navigationShell.goBranch(
                        index,
                        initialLocation: index == navigationShell.currentIndex,
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
