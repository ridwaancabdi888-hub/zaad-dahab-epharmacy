import 'package:flutter/material.dart';

/// Breakpoints matching DESIGN.md's "Layout & Spacing" grid guidance:
/// a 4-column mobile grid, reflowing to more columns on tablet/desktop.
abstract final class Breakpoints {
  static const compact = 600.0; // phones
  static const medium = 1024.0; // tablets
  // Anything wider is treated as desktop/expanded.
}

enum ScreenSize { compact, medium, expanded }

extension ResponsiveContext on BuildContext {
  double get screenWidth => MediaQuery.sizeOf(this).width;

  ScreenSize get screenSize {
    final width = screenWidth;
    if (width < Breakpoints.compact) return ScreenSize.compact;
    if (width < Breakpoints.medium) return ScreenSize.medium;
    return ScreenSize.expanded;
  }

  bool get isCompact => screenSize == ScreenSize.compact;
  bool get isMedium => screenSize == ScreenSize.medium;
  bool get isExpanded => screenSize == ScreenSize.expanded;

  /// Product/category grid column count: 2 on phones, 3 on tablets and
  /// desktop. Medium and expanded intentionally share a count — both are
  /// rendered inside [maxContentWidth]'s 640px cap, so giving expanded
  /// more columns than medium (as a naive "more columns on bigger
  /// screens" rule would) doesn't add any actual width per card, it just
  /// squeezes every card's image/name/price into a narrower column until
  /// text truncates unreadably.
  int get gridColumns {
    switch (screenSize) {
      case ScreenSize.compact:
        return 2;
      case ScreenSize.medium:
      case ScreenSize.expanded:
        return 3;
    }
  }

  /// Caps content width on large screens so text/cards don't stretch
  /// edge-to-edge on tablet/desktop, while remaining full-width on phones.
  double get maxContentWidth => isCompact ? double.infinity : 640.0;
}
