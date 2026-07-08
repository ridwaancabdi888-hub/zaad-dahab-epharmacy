import 'package:flutter/material.dart';

/// Color tokens lifted directly from the project's `DESIGN.md` design
/// system ("Premium E-Pharmacy Narrative"). Keep this file as the single
/// source of truth for color values so screens never hardcode hex codes.
abstract final class AppColors {
  static const surface = Color(0xFFF8F9FA);
  static const surfaceDim = Color(0xFFD9DADB);
  static const surfaceBright = Color(0xFFF8F9FA);
  static const surfaceContainerLowest = Color(0xFFFFFFFF);
  static const surfaceContainerLow = Color(0xFFF3F4F5);
  static const surfaceContainer = Color(0xFFEDEEEF);
  static const surfaceContainerHigh = Color(0xFFE7E8E9);
  static const surfaceContainerHighest = Color(0xFFE1E3E4);

  static const onSurface = Color(0xFF191C1D);
  static const onSurfaceVariant = Color(0xFF3C4A42);
  static const inverseSurface = Color(0xFF2E3132);
  static const inverseOnSurface = Color(0xFFF0F1F2);

  static const outline = Color(0xFF6C7A71);
  static const outlineVariant = Color(0xFFBBCABF);
  static const surfaceTint = Color(0xFF006C49);

  static const primary = Color(0xFF006C49);
  static const onPrimary = Color(0xFFFFFFFF);
  static const primaryContainer = Color(0xFF10B981);
  static const onPrimaryContainer = Color(0xFF00422B);
  static const inversePrimary = Color(0xFF4EDEA3);

  static const secondary = Color(0xFF006A61);
  static const onSecondary = Color(0xFFFFFFFF);
  static const secondaryContainer = Color(0xFF86F2E4);
  static const onSecondaryContainer = Color(0xFF006F66);

  static const tertiary = Color(0xFF50616B);
  static const onTertiary = Color(0xFFFFFFFF);
  static const tertiaryContainer = Color(0xFF94A5B0);
  static const onTertiaryContainer = Color(0xFF2B3B44);

  static const error = Color(0xFFBA1A1A);
  static const onError = Color(0xFFFFFFFF);
  static const errorContainer = Color(0xFFFFDAD6);
  static const onErrorContainer = Color(0xFF93000A);

  static const background = Color(0xFFF8F9FA);
  static const onBackground = Color(0xFF191C1D);
  static const surfaceVariant = Color(0xFFE1E3E4);

  /// Emerald -> Teal gradient used for all primary CTAs (buttons, active
  /// nav accents), per the "Buttons" section of DESIGN.md.
  static const primaryGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF10B981), Color(0xFF0D9488)],
  );

  /// Deep, dark-to-light emerald gradient used on the splash/onboarding
  /// hero CTAs, matching the reference screenshots.
  static const heroGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFF00422B), Color(0xFF10B981)],
  );

  static const accentLightBlue = Color(0xFFE0F2FE);

  // Status chip colors (see DESIGN.md "Status Chips").
  static const inStockBackground = Color(0xFFD8F3E6);
  static const inStockForeground = Color(0xFF00422B);
  static const rxBackground = Color(0xFFE0F2FE);
  static const rxForeground = Color(0xFF006A61);
  static const outOfStockBackground = Color(0xFFE7E8E9);
  static const outOfStockForeground = Color(0xFF3C4A42);
}
