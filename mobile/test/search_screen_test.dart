import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/features/catalog/presentation/paginated_medicine_grid.dart';
import 'package:zaad_dahab_mobile/features/search/presentation/search_screen.dart';

void main() {
  Widget buildSubject() {
    return const ProviderScope(
      child: MaterialApp(home: SearchScreen()),
    );
  }

  testWidgets('shows the clear action as soon as text is entered', (tester) async {
    await tester.pumpWidget(buildSubject());

    await tester.enterText(find.byType(TextField), 'aspirin');
    await tester.pump();

    expect(find.byTooltip('Clear search'), findsOneWidget);
    expect(find.byType(PaginatedMedicineGrid), findsNothing);
  });

  testWidgets('clearing cancels a pending debounced search', (tester) async {
    await tester.pumpWidget(buildSubject());

    await tester.enterText(find.byType(TextField), 'aspirin');
    await tester.pump();
    await tester.tap(find.byTooltip('Clear search'));
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(PaginatedMedicineGrid), findsNothing);
    expect(find.text('Search for medicines'), findsOneWidget);
    expect(find.byTooltip('Clear search'), findsNothing);
    expect(find.byType(TextField), findsOneWidget);
    expect(tester.widget<TextField>(find.byType(TextField)).controller?.text, isEmpty);
  });
}
