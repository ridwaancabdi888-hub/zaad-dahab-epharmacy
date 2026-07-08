import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:zaad_dahab_mobile/app.dart';
import 'package:zaad_dahab_mobile/core/providers.dart';
import 'package:zaad_dahab_mobile/core/storage/token_storage.dart';

/// Always reports "logged out" without touching the secure-storage
/// platform channel, which isn't available in the widget-test harness.
class _FakeLoggedOutTokenStorage implements TokenStorage {
  @override
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {}

  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<String?> readRefreshToken() async => null;

  @override
  Future<void> clear() async {}
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('app boots to the onboarding flow for a signed-out user', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tokenStorageProvider.overrideWithValue(_FakeLoggedOutTokenStorage()),
        ],
        child: const ZaadDahabApp(),
      ),
    );

    // First frame: splash screen while auth bootstrap resolves.
    await tester.pump();
    expect(find.text('Zaad/e-Dahab'), findsOneWidget);

    // Let the (mocked, network-free) bootstrap and navigation settle.
    await tester.pumpAndSettle();

    // A fresh install with no stored session lands on onboarding, showing
    // its first slide (the "Get Started" button only appears on the last).
    expect(find.text('Fast Healthcare Delivery'), findsOneWidget);
    expect(find.text('Next'), findsOneWidget);
  });
}
