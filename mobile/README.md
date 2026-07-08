# Zaad/e-Dahab Mobile App

Flutter client for the Zaad/e-Dahab E-Pharmacy platform. Material 3, Clean Architecture (`data` / `application` / `presentation` per feature), Riverpod for state, go_router for navigation.

## Scope delivered so far

- **Splash screen** — resolves whether a stored session is still valid, then hands off to onboarding/login/home
- **Onboarding** — 3-slide carousel, skippable, marks itself seen via `SharedPreferences` so it only shows once per install
- **Login / Register / Forgot Password / Reset Password** — wired to the real backend `/auth` endpoints; Google/OTP sign-in buttons are present per the design but intentionally show "coming soon" (no backend support exists for them yet, so they don't fake success)
- **Bottom navigation shell** — Home, Categories, Cart, Profile, each with its own navigation stack (`StatefulShellRoute.indexedStack`)
- **Home** — categories strip + "Recommended for You" products, both backed by real `/categories` and `/medicines` calls
- **Categories** — full category grid (matching the reference design), drills into a real per-category medicine grid
- **Cart** — live add/update/remove/clear against the real `/cart` endpoints, with stock-aware error feedback
- **Profile** — account info, role, saved-address count, logout
- **Theme** — colors/typography/spacing/radii/shadows all sourced from `../DESIGN.md`'s design tokens, wired into a single Material 3 `ThemeData`
- **Routing** — `go_router` with an auth-aware redirect guard (unauthenticated users can't reach the app shell; authenticated users can't land back on splash/onboarding/auth screens)
- **Reusable widgets** — `GradientButton`, `AppTextField`, `AppPasswordField`, `StatusChip`, `SectionHeader`, `EmptyState`, `ResponsiveCenter`, `MedicineCard`
- **Responsive UI** — a `context.gridColumns`/`isCompact` helper reflows grids from 2→4→6 columns and caps content width on tablet/desktop, per the design system's grid guidance

Checkout, order tracking, product detail pages, and payment are **not** built yet — the Cart screen's "Proceed to Checkout" honestly reports that it's coming in a later phase rather than faking a checkout flow.

## Getting started

```bash
flutter pub get
flutter run -d chrome   # or -d windows / an attached device, once available
```

The API base URL defaults to `http://localhost:5000/api/v1` (correct for web/desktop against a locally running backend). Override it for an Android emulator or physical device:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1
```

Only the `web` platform is currently scaffolded in this repo (see "Known environment constraints" below). To add others:

```bash
flutter create --platforms=windows,android,ios .
```

## Known environment constraints (dev machine, not the app)

- **Riverpod is pinned to 2.6.1**, not the newer 3.x line: Riverpod 3.0 moved `StateNotifierProvider`/`StateNotifier` to a `legacy.dart` import and removed `AsyncValue.valueOrNull`, both used throughout this app's controllers. 2.6.1 is still a fully supported, widely-used stable release.
- **Windows and Android platform folders aren't checked in.** Building either requires local tooling this dev environment didn't have: Windows desktop needs the Visual Studio "Desktop development with C++" workload (missing here), and enabling native-plugin symlinks requires Windows Developer Mode (`start ms-settings:developers`), which needs an interactive session and admin/registry access this environment didn't have either. Regenerate them with `flutter create --platforms=windows,android .` on a machine that has what it needs, then `flutter pub get` again.
- Verified in this environment: `flutter analyze` (0 issues), `flutter test` (20/20 passing), `flutter build web --release`, and `flutter run -d chrome --release` (boots cleanly, no runtime errors).

## Architecture

```
lib/
  core/
    theme/       AppColors, AppTextStyles, AppDimens, AppShadows, AppTheme — all from DESIGN.md
    network/     ApiClient (Dio, auth header + silent-refresh interceptor), ApiException
    storage/     TokenStorage (flutter_secure_storage), OnboardingStorage (SharedPreferences)
    router/      go_router config + auth-aware redirect guard
    utils/       Validators, responsive breakpoints, runCatchingApi
    widgets/     reusable UI components
  features/
    splash/, onboarding/, auth/, shell/, home/, categories/, cart/, catalog/, profile/
    each auth/cart feature follows data/ -> application/ -> presentation/
test/
  flutter_test_config.dart   disables google_fonts runtime fetching + initializes the test binding
  *_test.dart                validators, models, theme, widgets, and a full app-boot smoke test
```
