import 'package:flutter/material.dart';

/// The "Clinical Soft" shadow from DESIGN.md's "Elevation & Depth" section:
/// `0px 10px 30px rgba(31, 41, 55, 0.05)`.
abstract final class AppShadows {
  static const clinicalSoft = [
    BoxShadow(
      color: Color(0x0D1F2937),
      blurRadius: 30,
      offset: Offset(0, 10),
    ),
  ];

  static const clinicalSoftElevated = [
    BoxShadow(
      color: Color(0x141F2937),
      blurRadius: 36,
      offset: Offset(0, 14),
    ),
  ];
}
