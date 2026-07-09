import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../../core/config/maps_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';

/// Renders the delivery destination (and, if known, the rider's current
/// position) on a map. Uses a real [GoogleMap] when a
/// `GOOGLE_MAPS_API_KEY` was configured at build time (see
/// `core/config/maps_config.dart`); otherwise falls back to a simple,
/// clearly-labeled proportional plot so the UI never shows a broken or
/// blank Google-branded map when no key is available.
class DeliveryMapView extends StatelessWidget {
  const DeliveryMapView({
    super.key,
    required this.destinationLat,
    required this.destinationLng,
    this.riderLat,
    this.riderLng,
    this.height = 220,
  });

  final double destinationLat;
  final double destinationLng;
  final double? riderLat;
  final double? riderLng;
  final double height;

  bool get _hasRider => riderLat != null && riderLng != null;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: hasGoogleMapsApiKey
            ? _buildGoogleMap()
            : _FallbackMapPreview(
                destinationLat: destinationLat,
                destinationLng: destinationLng,
                riderLat: riderLat,
                riderLng: riderLng,
              ),
      ),
    );
  }

  Widget _buildGoogleMap() {
    final destination = LatLng(destinationLat, destinationLng);
    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('destination'),
        position: destination,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: const InfoWindow(title: 'Delivery address'),
      ),
      if (_hasRider)
        Marker(
          markerId: const MarkerId('rider'),
          position: LatLng(riderLat!, riderLng!),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: 'Rider'),
        ),
    };

    return GoogleMap(
      initialCameraPosition: CameraPosition(target: destination, zoom: 14),
      markers: markers,
      zoomControlsEnabled: false,
      myLocationButtonEnabled: false,
    );
  }
}

class _FallbackMapPreview extends StatelessWidget {
  const _FallbackMapPreview({
    required this.destinationLat,
    required this.destinationLng,
    this.riderLat,
    this.riderLng,
  });

  final double destinationLat;
  final double destinationLng;
  final double? riderLat;
  final double? riderLng;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceContainerLow,
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(
              painter: _MapPreviewPainter(
                destinationLat: destinationLat,
                destinationLng: destinationLng,
                riderLat: riderLat,
                riderLng: riderLng,
              ),
            ),
          ),
          Positioned(
            left: AppSpacing.sm,
            right: AppSpacing.sm,
            bottom: AppSpacing.sm,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLowest.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(AppRadii.regular),
              ),
              child: Text(
                'Map preview — configure GOOGLE_MAPS_API_KEY for live maps',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapPreviewPainter extends CustomPainter {
  _MapPreviewPainter({
    required this.destinationLat,
    required this.destinationLng,
    this.riderLat,
    this.riderLng,
  });

  final double destinationLat;
  final double destinationLng;
  final double? riderLat;
  final double? riderLng;

  @override
  void paint(Canvas canvas, Size size) {
    final hasRider = riderLat != null && riderLng != null;

    final destination =
        hasRider ? _project(destinationLat, destinationLng, size) : Offset(size.width / 2, size.height / 2);
    final rider = hasRider ? _project(riderLat!, riderLng!, size) : null;

    final gridPaint = Paint()
      ..color = AppColors.outlineVariant.withValues(alpha: 0.4)
      ..strokeWidth = 1;
    const gridLines = 4;
    for (var i = 1; i < gridLines; i++) {
      final dx = size.width * i / gridLines;
      final dy = size.height * i / gridLines;
      canvas.drawLine(Offset(dx, 0), Offset(dx, size.height), gridPaint);
      canvas.drawLine(Offset(0, dy), Offset(size.width, dy), gridPaint);
    }

    if (rider != null) {
      final linePaint = Paint()
        ..color = AppColors.primary.withValues(alpha: 0.6)
        ..strokeWidth = 2;
      canvas.drawLine(rider, destination, linePaint);
      _drawPin(canvas, rider, AppColors.secondary);
    }
    _drawPin(canvas, destination, AppColors.error);
  }

  /// Projects a lat/lng pair into canvas space, scaled so both the
  /// destination and rider points fit inside a padded box — this is a
  /// flat, non-geographic projection, fine for a small illustrative
  /// preview but not for real navigation.
  Offset _project(double lat, double lng, Size size) {
    const padding = 32.0;
    final otherLat = riderLat ?? destinationLat;
    final otherLng = riderLng ?? destinationLng;
    final minLat = destinationLat < otherLat ? destinationLat : otherLat;
    final maxLat = destinationLat > otherLat ? destinationLat : otherLat;
    final minLng = destinationLng < otherLng ? destinationLng : otherLng;
    final maxLng = destinationLng > otherLng ? destinationLng : otherLng;

    final latSpan = (maxLat - minLat).abs() < 0.0001 ? 0.0001 : (maxLat - minLat);
    final lngSpan = (maxLng - minLng).abs() < 0.0001 ? 0.0001 : (maxLng - minLng);

    final normalizedX = (lng - minLng) / lngSpan;
    final normalizedY = 1 - (lat - minLat) / latSpan;

    return Offset(
      padding + normalizedX * (size.width - padding * 2),
      padding + normalizedY * (size.height - padding * 2),
    );
  }

  void _drawPin(Canvas canvas, Offset center, Color color) {
    canvas.drawCircle(center, 8, Paint()..color = color);
    canvas.drawCircle(
      center,
      8,
      Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(covariant _MapPreviewPainter oldDelegate) {
    return oldDelegate.destinationLat != destinationLat ||
        oldDelegate.destinationLng != destinationLng ||
        oldDelegate.riderLat != riderLat ||
        oldDelegate.riderLng != riderLng;
  }
}
