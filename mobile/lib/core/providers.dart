import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'network/api_client.dart';
import 'storage/onboarding_storage.dart';
import 'storage/token_storage.dart';

/// App-wide, feature-agnostic providers. Feature-specific providers
/// (repositories, controllers) live alongside their feature instead.
final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(tokenStorage: ref.watch(tokenStorageProvider));
});

final onboardingStorageProvider = Provider<OnboardingStorage>((ref) => OnboardingStorage());
