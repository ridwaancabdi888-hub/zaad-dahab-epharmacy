import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router/route_paths.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/app_logo.dart';
import '../auth/application/auth_controller.dart';
import '../auth/application/auth_state.dart';

/// First screen shown on launch. Waits for [AuthController] to resolve
/// whether a stored session is still valid, then either lets the router's
/// redirect take the user to `/home` (authenticated) or decides between
/// `/onboarding` and `/login` (unauthenticated) based on whether
/// onboarding has already been seen on this device.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _navigated = false;

  Future<void> _proceedIfReady(AuthStatus status) async {
    if (_navigated || status == AuthStatus.unknown) return;
    _navigated = true;

    if (status == AuthStatus.unauthenticated) {
      final hasSeenOnboarding = await ref.read(onboardingStorageProvider).hasSeenOnboarding();
      if (!mounted) return;
      context.go(hasSeenOnboarding ? RoutePaths.login : RoutePaths.onboarding);
    }
    // Authenticated: the router's redirect callback takes over from here.
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      _proceedIfReady(next.status);
    });

    final current = ref.read(authControllerProvider).status;
    SchedulerBinding.instance.addPostFrameCallback((_) => _proceedIfReady(current));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Stack(
        children: [
          Positioned(
            top: 64,
            left: 24,
            child: Icon(Icons.grain, size: 28, color: AppColors.primary.withValues(alpha: 0.15)),
          ),
          Positioned(
            top: 64,
            right: 24,
            child: Icon(
              Icons.eco_outlined,
              size: 28,
              color: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppLogoMark(size: 96),
                const SizedBox(height: AppSpacing.lg),
                Text('Zaad/e-Dahab',
                    style: AppTextStyles.headlineLg.copyWith(color: AppColors.primary)),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'YOUR HEALTH, ELEVATED',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.onSurfaceVariant,
                    letterSpacing: 0.08 * 12,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Container(width: 120, height: 1, color: AppColors.outlineVariant),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'WELCOME TO WELLNESS',
                  style: AppTextStyles.labelMd.copyWith(
                    color: AppColors.primary,
                    letterSpacing: 0.08 * 12,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 48,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.verified_user_outlined, size: 16, color: AppColors.outline),
                    const SizedBox(width: 6),
                    Text('Clinical Precision', style: AppTextStyles.bodyMd),
                    const SizedBox(width: AppSpacing.sm),
                    const Text('•'),
                    const SizedBox(width: AppSpacing.sm),
                    Icon(Icons.shield_outlined, size: 16, color: AppColors.outline),
                    const SizedBox(width: 6),
                    Text('Secure Care', style: AppTextStyles.bodyMd),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  '© ${DateTime.now().year} Zaad/e-Dahab Pharmaceutical Ecosystem',
                  style: AppTextStyles.labelMd.copyWith(color: AppColors.outline),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
