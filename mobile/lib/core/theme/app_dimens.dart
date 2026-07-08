/// Spacing and radius tokens from `DESIGN.md`'s "Spacing" and "Shapes"
/// sections, expressed in logical pixels (DESIGN.md's `rem`/`px` values
/// map 1:1 to Flutter logical pixels at the reference 16px root size).
abstract final class AppSpacing {
  static const base = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const containerMargin = 20.0;
  static const gutter = 16.0;
}

abstract final class AppRadii {
  static const sm = 4.0;
  static const regular = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const full = 999.0;
}

/// Fixed control sizes called out explicitly in DESIGN.md's "Components"
/// section (button/search-bar heights).
abstract final class AppSizes {
  static const buttonHeight = 52.0;
  static const searchBarHeight = 56.0;
  static const bottomNavHeight = 64.0;
}
