import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/core/theme/app_colors.dart';
import 'package:zaad_dahab_mobile/core/theme/app_theme.dart';

void main() {
  test('AppTheme.light builds a Material 3 theme using the primary brand color', () {
    final theme = AppTheme.light;

    expect(theme.useMaterial3, isTrue);
    expect(theme.colorScheme.primary, AppColors.primary);
    expect(theme.scaffoldBackgroundColor, AppColors.background);
  });
}
