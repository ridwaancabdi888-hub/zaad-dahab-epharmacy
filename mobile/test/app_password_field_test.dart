import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zaad_dahab_mobile/core/widgets/app_password_field.dart';

void main() {
  testWidgets('password visibility control describes its current action', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AppPasswordField(label: 'Password'),
        ),
      ),
    );

    expect(find.byTooltip('Show password'), findsOneWidget);
    expect(tester.widget<EditableText>(find.byType(EditableText)).obscureText, isTrue);

    await tester.tap(find.byTooltip('Show password'));
    await tester.pump();

    expect(find.byTooltip('Hide password'), findsOneWidget);
    expect(tester.widget<EditableText>(find.byType(EditableText)).obscureText, isFalse);
  });
}
