import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:zaad_dahab_mobile/core/storage/onboarding_storage.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('defaults to not having seen onboarding', () async {
    final storage = OnboardingStorage();
    expect(await storage.hasSeenOnboarding(), isFalse);
  });

  test('persists that onboarding has been seen', () async {
    final storage = OnboardingStorage();
    await storage.markOnboardingSeen();
    expect(await storage.hasSeenOnboarding(), isTrue);
  });
}
