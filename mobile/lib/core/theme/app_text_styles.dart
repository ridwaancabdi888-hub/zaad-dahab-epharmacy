import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography scale from `DESIGN.md`. Inter is used exclusively, per the
/// design system's "Typography" section.
abstract final class AppTextStyles {
  static TextStyle _inter({
    required double fontSize,
    required FontWeight fontWeight,
    required double height,
    double letterSpacing = 0,
    Color color = AppColors.onSurface,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height / fontSize,
      letterSpacing: letterSpacing * fontSize,
      color: color,
    );
  }

  static TextStyle get displayLg => _inter(
        fontSize: 32,
        fontWeight: FontWeight.w600,
        height: 40,
        letterSpacing: -0.02,
      );

  static TextStyle get headlineLg => _inter(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        height: 32,
        letterSpacing: -0.01,
      );

  /// `headline-lg-mobile`: the same headline role scaled down for narrow
  /// mobile widths, per DESIGN.md's Typography "Scale" note.
  static TextStyle get headlineLgMobile => _inter(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        height: 28,
      );

  static TextStyle get headlineMd => _inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        height: 28,
      );

  static TextStyle get bodyLg => _inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 26,
        color: AppColors.onSurfaceVariant,
      );

  static TextStyle get bodyMd => _inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 22,
        color: AppColors.onSurfaceVariant,
      );

  static TextStyle get labelMd => _inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 16,
        letterSpacing: 0.01,
      );
}
