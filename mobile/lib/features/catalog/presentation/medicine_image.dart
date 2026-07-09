import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// A medicine's primary photo, or a graceful placeholder icon when it has
/// none (no image upload capability exists yet, so most seeded/demo
/// medicines have an empty `images` list) or the URL fails to load.
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

  Widget _placeholder() {
    return Center(
      child: Icon(Icons.medication_outlined, color: AppColors.outline, size: iconSize),
    );
  }
}
