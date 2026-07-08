import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Standard text input matching DESIGN.md's "Search Bars"/form-field
/// styling: soft fill, leading icon, 16px radius (applied via the app's
/// `InputDecorationTheme`, so this widget just supplies content).
class AppTextField extends StatelessWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.controller,
    this.hintText,
    this.prefixIcon,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onChanged,
    this.autofillHints,
    this.enabled = true,
  });

  final String label;
  final TextEditingController? controller;
  final String? hintText;
  final IconData? prefixIcon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final Iterable<String>? autofillHints;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          validator: validator,
          onChanged: onChanged,
          autofillHints: autofillHints,
          enabled: enabled,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.onSurface),
          decoration: InputDecoration(
            hintText: hintText,
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon, color: AppColors.outline, size: 20)
                : null,
          ),
        ),
      ],
    );
  }
}
