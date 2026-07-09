import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/responsive_center.dart';
import '../application/delivery_providers.dart';
import '../data/delivery_model.dart';
import 'delivery_map_view.dart';
import 'delivery_status_chip.dart';
import 'delivery_status_timeline.dart';

String _formatTime(DateTime time) {
  final hour12 = time.hour % 12 == 0 ? 12 : time.hour % 12;
  final period = time.hour < 12 ? 'AM' : 'PM';
  final minute = time.minute.toString().padLeft(2, '0');
  return '$hour12:$minute $period';
}

/// Thrown by [_currentPosition] on any device-level location failure
/// (service disabled, permission denied) — distinct from [ApiException]
/// since it never reaches the backend at all.
class _LocationException implements Exception {
  const _LocationException(this.message);
  final String message;
}

/// Fetches the device's current position, requesting permission first if
/// needed.
Future<Position> _currentPosition() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    throw const _LocationException('Location services are disabled on this device.');
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) {
      throw const _LocationException('Location permission was denied.');
    }
  }
  if (permission == LocationPermission.deniedForever) {
    throw const _LocationException('Location permission is permanently denied. Enable it in device settings.');
  }
  return Geolocator.getCurrentPosition();
}

class RiderDeliveryDetailScreen extends ConsumerStatefulWidget {
  const RiderDeliveryDetailScreen({super.key, required this.deliveryId});

  final String deliveryId;

  @override
  ConsumerState<RiderDeliveryDetailScreen> createState() => _RiderDeliveryDetailScreenState();
}

class _RiderDeliveryDetailScreenState extends ConsumerState<RiderDeliveryDetailScreen> {
  bool _isWorking = false;
  bool _isSharingLocation = false;
  Timer? _locationTimer;

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  void _refresh() => ref.invalidate(deliveryByIdProvider(widget.deliveryId));

  Future<void> _showError(Object error) async {
    if (!mounted) return;
    final message = switch (error) {
      ApiException() => error.message,
      _LocationException() => error.message,
      _ => 'Something went wrong. Please try again.',
    };
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _advanceStatus(String targetStatus) async {
    setState(() => _isWorking = true);
    try {
      await ref.read(deliveryRepositoryProvider).updateStatus(widget.deliveryId, targetStatus);
      if (targetStatus == 'delivered' || targetStatus == 'cancelled') {
        _stopSharingLocation();
      }
      _refresh();
    } catch (error) {
      await _showError(error);
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  Future<void> _confirmCancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Delivery'),
        content: const Text('Are you sure you want to cancel this delivery?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('No')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await _advanceStatus('cancelled');
    }
  }

  Future<void> _shareLocationOnce() async {
    setState(() => _isWorking = true);
    try {
      final position = await _currentPosition();
      await ref
          .read(deliveryRepositoryProvider)
          .updateLocation(widget.deliveryId, lat: position.latitude, lng: position.longitude);
      _refresh();
    } catch (error) {
      await _showError(error);
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  void _toggleSharingLocation(bool enabled) {
    setState(() => _isSharingLocation = enabled);
    if (enabled) {
      _shareLocationOnce();
      _locationTimer = Timer.periodic(const Duration(seconds: 30), (_) => _shareLocationOnce());
    } else {
      _stopSharingLocation();
    }
  }

  void _stopSharingLocation() {
    _locationTimer?.cancel();
    _locationTimer = null;
    if (_isSharingLocation && mounted) {
      setState(() => _isSharingLocation = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final deliveryAsync = ref.watch(deliveryByIdProvider(widget.deliveryId));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Delivery Details')),
      body: SafeArea(
        child: ResponsiveCenter(
          child: deliveryAsync.when(
            data: (delivery) => _buildBody(context, delivery),
            loading: () => const LoadingIndicator(),
            error: (error, _) => ErrorView(error: error, onRetry: _refresh),
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, DeliveryModel delivery) {
    final forwardTarget = nextForwardDeliveryStatus(delivery.status);
    final isActive = delivery.isActive;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.containerMargin),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              delivery.order != null ? '#${delivery.order!.orderNumber}' : 'Delivery',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            DeliveryStatusChip(status: delivery.status),
          ],
        ),
        if (delivery.order != null) ...[
          const SizedBox(height: AppSpacing.sm),
          _InfoCard(
            children: [
              _infoRow(context, 'Total', '\$${delivery.order!.total.toStringAsFixed(2)}'),
              _infoRow(context, 'Payment Method', delivery.order!.paymentMethod.toUpperCase()),
              _infoRow(context, 'Items', '${delivery.order!.itemCount}'),
              if (delivery.order!.customerName != null)
                _infoRow(context, 'Customer', delivery.order!.customerName!),
              if (delivery.order!.customerPhone != null)
                _infoRow(context, 'Phone', delivery.order!.customerPhone!),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        Text('Delivery Address', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: AppSpacing.sm),
        Text(
          '${delivery.address.label} — ${delivery.address.street}, ${delivery.address.city}',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        if (delivery.address.hasCoordinates) ...[
          const SizedBox(height: AppSpacing.sm),
          DeliveryMapView(
            destinationLat: delivery.address.lat!,
            destinationLng: delivery.address.lng!,
            riderLat: delivery.currentLocation.lat,
            riderLng: delivery.currentLocation.lng,
          ),
        ],
        if (delivery.hasEta) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Estimated arrival: ${_formatTime(delivery.estimatedDeliveryStart!)} – '
            '${_formatTime(delivery.estimatedDeliveryEnd!)}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary),
          ),
        ],
        if (isActive) ...[
          const SizedBox(height: AppSpacing.lg),
          _InfoCard(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text('Share my live location', style: Theme.of(context).textTheme.bodyLarge),
                  ),
                  Switch(
                    value: _isSharingLocation,
                    onChanged: _isWorking ? null : _toggleSharingLocation,
                  ),
                ],
              ),
              Text(
                'Updates your position every 30 seconds so the customer sees an accurate ETA.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        Text('Status History', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: AppSpacing.sm),
        DeliveryStatusTimeline(events: delivery.statusHistory),
        if (isActive) ...[
          const SizedBox(height: AppSpacing.lg),
          if (forwardTarget != null)
            ElevatedButton(
              onPressed: _isWorking ? null : () => _advanceStatus(forwardTarget),
              child: _isWorking
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(forwardDeliveryActionLabel(forwardTarget)),
            ),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton(
            onPressed: _isWorking ? null : _confirmCancel,
            style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Cancel Delivery'),
          ),
        ],
      ],
    );
  }

  Widget _infoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(AppRadii.lg),
        border: Border.all(color: AppColors.surfaceContainerHigh),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}
