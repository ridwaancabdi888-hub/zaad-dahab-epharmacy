import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';

/// A medicine's primary photo, or a graceful placeholder icon when it has
/// none or the URL fails to load.
///
/// Seeded/demo medicines carry inline `data:image/svg+xml;base64,...` icons
/// (see `backend/scripts/seed.js`) rather than links to an external image
/// host — this environment has no outbound network access to a service
/// like placehold.co, so a remote URL there would always fail and fall
/// back to the generic icon. Admin-entered photos (see the admin panel's
/// medicine form) are real http(s) URLs and still load via `Image.network`.
class MedicineImage extends StatelessWidget {
  const MedicineImage({super.key, required this.imageUrl, this.iconSize = 40});

  final String? imageUrl;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl;
    if (url == null || url.isEmpty) {
      return _placeholder();
    }

    if (url.startsWith('data:image/svg+xml')) {
      final svgString = _decodeSvgDataUri(url);
      if (svgString == null) return _placeholder();
      return SvgPicture.string(
        svgString,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        placeholderBuilder: (context) => _placeholder(),
      );
    }

    return Image.network(
      url,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.outline),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) => _placeholder(),
    );
  }

  String? _decodeSvgDataUri(String url) {
    final commaIndex = url.indexOf(',');
    if (commaIndex == -1) return null;
    final header = url.substring(0, commaIndex);
    final data = url.substring(commaIndex + 1);
    try {
      if (header.contains('base64')) {
        return utf8.decode(base64.decode(data));
      }
      return Uri.decodeComponent(data);
    } catch (_) {
      return null;
    }
  }

  Widget _placeholder() {
    return Center(
      child: Icon(Icons.medication_outlined, color: AppColors.outline, size: iconSize),
    );
  }
}
