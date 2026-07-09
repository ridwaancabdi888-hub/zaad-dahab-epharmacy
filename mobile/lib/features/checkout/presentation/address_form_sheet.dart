import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../auth/application/auth_controller.dart';

/// Bottom sheet form for adding a new saved address, used from the
/// Checkout screen's address picker.
Future<void> showAddAddressSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (_) => const _AddAddressSheet(),
  );
}

class _AddAddressSheet extends ConsumerStatefulWidget {
  const _AddAddressSheet();

  @override
  ConsumerState<_AddAddressSheet> createState() => _AddAddressSheetState();
}

class _AddAddressSheetState extends ConsumerState<_AddAddressSheet> {
  final _formKey = GlobalKey<FormState>();
  final _labelController = TextEditingController(text: 'Home');
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _labelController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _isSaving = true);
    try {
      await ref.read(authControllerProvider.notifier).addAddress(
            label: _labelController.text.trim(),
            street: _streetController.text.trim(),
            city: _cityController.text.trim(),
          );
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: AppSpacing.containerMargin,
        right: AppSpacing.containerMargin,
        top: AppSpacing.lg,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.lg,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Add Delivery Address', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _labelController,
              decoration: const InputDecoration(labelText: 'Label (e.g. Home, Work)'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Label is required' : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _streetController,
              decoration: const InputDecoration(labelText: 'Street address'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Street is required' : null,
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _cityController,
              decoration: const InputDecoration(labelText: 'City'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'City is required' : null,
            ),
            const SizedBox(height: AppSpacing.lg),
            GradientButton(label: 'Save Address', isLoading: _isSaving, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
