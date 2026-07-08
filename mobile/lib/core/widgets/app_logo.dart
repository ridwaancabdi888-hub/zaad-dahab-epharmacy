import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// The mortar-and-pestle mark used on splash/onboarding/auth screens,
/// rendered from vector shapes so it never depends on a bitmap asset.
class AppLogoMark extends StatelessWidget {
  const AppLogoMark({super.key, this.size = 96});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(size * 0.22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.12),
            blurRadius: size * 0.3,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      padding: EdgeInsets.all(size * 0.16),
      child: CustomPaint(painter: _MortarPestlePainter()),
    );
  }
}

class _MortarPestlePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final bowlPaint = Paint()
      ..shader = AppColors.primaryGradient.createShader(
        Rect.fromLTWH(0, 0, size.width, size.height),
      );

    final bowlPath = Path()
      ..moveTo(0, size.height * 0.42)
      ..lineTo(size.width, size.height * 0.42)
      ..quadraticBezierTo(
        size.width,
        size.height,
        size.width / 2,
        size.height,
      )
      ..quadraticBezierTo(0, size.height, 0, size.height * 0.42)
      ..close();
    canvas.drawPath(bowlPath, bowlPaint);

    final pestlePaint = Paint()
      ..color = AppColors.onBackground
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.16
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.62, 0),
      Offset(size.width * 0.5, size.height * 0.4),
      pestlePaint,
    );

    final crossPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.09
      ..strokeCap = StrokeCap.round;
    final center = Offset(size.width / 2, size.height * 0.68);
    final arm = size.width * 0.11;
    canvas.drawLine(center - Offset(arm, 0), center + Offset(arm, 0), crossPaint);
    canvas.drawLine(center - Offset(0, arm), center + Offset(0, arm), crossPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
