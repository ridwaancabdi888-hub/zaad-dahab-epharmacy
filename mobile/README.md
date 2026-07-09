# Zaad/e-Dahab Mobile App

Flutter client for the Zaad/e-Dahab E-Pharmacy platform. Material 3, Clean Architecture (`data` / `application` / `presentation` per feature), Riverpod for state, go_router for navigation.

## Scope delivered so far

- **Splash screen** — resolves whether a stored session is still valid, then hands off to onboarding/login/home
- **Onboarding** — 3-slide carousel, skippable, marks itself seen via `SharedPreferences` so it only shows once per install
- **Login / Register / Forgot Password / Reset Password** — wired to the real backend `/auth` endpoints; Google/OTP sign-in buttons are present per the design but intentionally show "coming soon" (no backend support exists for them yet, so they don't fake success)
- **Bottom navigation shell** — Home, Categories, Cart, Profile, each with its own navigation stack (`StatefulShellRoute.indexedStack`)
- **Home** — categories strip + "Recommended for You" products, both backed by real `/categories` and `/medicines` calls, plus entry points into Search and Wishlist
- **Search** — debounced search-as-you-type against `/medicines?search=`, sharing the same paginated grid as category browsing
- **Categories** — full category grid (matching the reference design), drills into a real, paginated per-category medicine grid
- **Medicine Detail** — full product view (description, price/discount, stock/prescription status, pharmacy) with a quantity selector, add-to-cart, and a wishlist toggle
- **Wishlist** — save/unsave any medicine from its card or detail page (heart toggle); a dedicated screen lists everything saved, backed by real `/users/me/wishlist` endpoints
- **Cart** — live add/update/remove/clear against the real `/cart` endpoints, with stock-aware error feedback, a promo-code field with live discount preview, and a real Order Summary (subtotal/delivery fee/tax/discount/total) sourced from `/orders/quote`
- **Checkout** — saved-address picker (with an "Add New Address" sheet) or add one inline, Zaad/e-Dahab/Cash-on-Delivery payment selection (with a payer-phone field for mobile money), a live order summary, and order placement against `/orders`; a cart containing a prescription-required item is blocked at checkout with an honest message rather than pretending prescription upload works (no image upload capability exists yet)
- **Payments** — a status card (shown on both the order confirmation and order detail screens) that verifies a processing mobile-money payment against the sandbox gateway, or retries a failed one with a fresh attempt; a dedicated Transaction History screen (reachable from Profile) lists every past payment with live-loading pagination
- **Order confirmation & detail** — a success screen with the order number and payment status, and a "Track Order" link into a real order-detail view (items, address, payment, totals, status) sourced from `/orders/:id`
- **Profile** — account info, role, saved-address count, transaction history, logout
- **Theme** — colors/typography/spacing/radii/shadows all sourced from `../DESIGN.md`'s design tokens, wired into a single Material 3 `ThemeData`
- **Routing** — `go_router` with an auth-aware redirect guard (unauthenticated users can't reach the app shell; authenticated users can't land back on splash/onboarding/auth screens)
- **Reusable widgets** — `GradientButton`, `AppTextField`, `AppPasswordField`, `StatusChip`, `SectionHeader`, `EmptyState`, `ErrorView`, `LoadingIndicator`, `ResponsiveCenter`, `MedicineCard`, `WishlistHeartButton`
- **Responsive UI** — a `context.gridColumns`/`isCompact` helper reflows grids from 2→4→6 columns and caps content width on tablet/desktop, per the design system's grid guidance
- **Pagination** — a generic `PaginatedMedicinesController` (load-more/infinite-scroll, one instance per category/search filter) backs both category browsing and search, appending pages as the user scrolls and preserving already-loaded items if a later page fails
- **Loading / error handling** — every async screen uses the same `LoadingIndicator`/`ErrorView` pair, with `ErrorView` surfacing a Retry action instead of leaving a dead end

A real Zaad/e-Dahab merchant sandbox isn't available in this environment, so payments run against the backend's own sandbox gateway — see `backend/README.md`'s "Sandbox test scenarios" for the magic payer-phone numbers that deterministically trigger success/insufficient-funds/timeout/still-processing, all of which this app's Verify/Retry buttons handle. Live GPS delivery tracking and prescription image upload are still not built.

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
- Verified in this environment: `flutter analyze` (0 issues), `flutter test` (34/34 passing), `flutter build web --release`, and `flutter run -d chrome --release` (boots cleanly, no runtime errors).

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
    splash/, onboarding/, auth/, shell/, home/, categories/, search/, cart/,
    catalog/, wishlist/, checkout/, orders/, payments/, profile/
    each feature follows data/ -> application/ -> presentation/
test/
  flutter_test_config.dart   disables google_fonts runtime fetching + initializes the test binding
  *_test.dart                validators, models, theme, widgets, and a full app-boot smoke test
```
