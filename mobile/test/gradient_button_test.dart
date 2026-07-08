import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/core/widgets/gradient_button.dart';

void main() {
  testWidgets('GradientButton shows its label and responds to taps', (tester) async {
    var tapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GradientButton(
            label: 'Continue',
            onPressed: () => tapped = true,
          ),
        ),
      ),
    );

    expect(find.text('Continue'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pump();

    expect(tapped, isTrue);
  });

  testWidgets('GradientButton shows a spinner and ignores taps while loading', (tester) async {
    var tapCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: GradientButton(
            label: 'Continue',
            isLoading: true,
            onPressed: () => tapCount++,
          ),
        ),
      ),
    );

    expect(find.text('Continue'), findsNothing);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.tap(find.byType(GradientButton));
    await tester.pump();

    expect(tapCount, 0);
  });
}
