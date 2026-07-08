import 'package:shared_preferences/shared_preferences.dart';

/// Tracks whether the user has already swiped through the onboarding
/// carousel, so it's only ever shown once per install.
class OnboardingStorage {
  static const _seenKey = 'zd_has_seen_onboarding';

  Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_seenKey) ?? false;
  }

  Future<void> markOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_seenKey, true);
  }
}
