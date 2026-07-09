import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/core/widgets/empty_state.dart';
import 'package:zaad_dahab_mobile/core/widgets/error_view.dart';
import 'package:zaad_dahab_mobile/core/network/api_exception.dart';

void main() {
  // Regression test: the Home screen's category row is a fixed 96px-tall
  // horizontal strip. The default EmptyState needs ~164px (56px icon +
  // spacing + a headline text line + 64px of padding), so rendering it
  // there overflowed — reproduced here with the same 96px constraint the
  // real screen uses, and fixed via EmptyState's `compact` mode.
  testWidgets('EmptyState with compact:true fits inside a 96px-tall strip without overflowing',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 96,
            width: 396,
            child: EmptyState(
              icon: Icons.category_outlined,
              title: 'No categories yet',
              compact: true,
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('No categories yet'), findsOneWidget);
  });

  testWidgets('EmptyState without compact overflows a 96px-tall strip (documents why compact exists)',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 96,
            width: 396,
            child: EmptyState(
              icon: Icons.category_outlined,
              title: 'No categories yet',
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNotNull);
  });

  testWidgets('ErrorView with compact:true fits a tight strip and retry still works via tap',
      (tester) async {
    var retried = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 96,
            width: 396,
            child: ErrorView(
              error: const ApiException(statusCode: 500, message: 'boom'),
              onRetry: () => retried = true,
              compact: true,
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);

    await tester.tap(find.byType(ErrorView));
    await tester.pump();

    expect(retried, isTrue);
  });
}
