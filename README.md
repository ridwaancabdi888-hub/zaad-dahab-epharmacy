# Zaad/e-Dahab E-Pharmacy

A full-stack e-pharmacy platform for Somalia: a Flutter mobile app (customers + delivery riders), a Node.js/Express/MongoDB backend, and a React admin panel — with Zaad/e-Dahab mobile-money payments, Google Maps delivery tracking, and in-app notifications.

Built in phases — each phase is implemented, tested, and committed before moving to the next. Every external integration without real credentials in this environment (Zaad/e-Dahab merchant accounts, Google Maps API key, Firebase) is built as a real, production-shaped interface with an honest, clearly-labeled sandbox/fallback behavior — never faked success.

## Live Demo

- **Admin panel:** https://zaad-dahab-epharmacy.vercel.app

The frontend is deployed on Vercel. Set `VITE_API_BASE_URL` to the production backend API URL to enable authentication and live pharmacy data.

## Repository layout

```
backend/       Node.js + Express + MongoDB REST API (JWT auth, business logic, OpenAPI docs)
mobile/        Flutter mobile app — customer shopping + a role-based rider app (Clean Architecture, Material 3)
admin-panel/   React admin dashboard (dashboard, CRUD, reports/charts, exports, role management, audit logs)
DESIGN.md      Visual design system reference shared by the mobile app and admin panel
```

## Tech stack

- **Mobile:** Flutter, Clean Architecture (data/application/presentation per feature), Riverpod 2.x, go_router, Material 3
- **Backend:** Node.js, Express 5, MongoDB, Mongoose, JWT (access + rotating refresh tokens), OpenAPI/Swagger
- **Admin Panel:** React 19 + Vite, recharts, jsPDF, SheetJS (xlsx)
- **Payments:** Zaad API, e-Dahab API, Cash on Delivery — pluggable gateway abstraction, sandboxed with deterministic test scenarios
- **Delivery:** rider assignment/status workflow, haversine-based ETA, Google Maps live tracking (with a graceful no-API-key fallback)
- **Notifications:** real, persisted, polled in-app notifications (not push — no Firebase project is configured in this environment)

## Getting started

Each app has its own detailed README. In short:

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev
# → API at http://localhost:5000/api/v1, interactive docs at http://localhost:5000/api-docs

# Admin panel (needs the backend running, and an admin account — see backend/README.md's Roles section)
cd admin-panel && npm install && npm run dev
# → http://localhost:5173

# Mobile
cd mobile && flutter pub get && flutter run -d chrome
```

See [backend/README.md](backend/README.md), [mobile/README.md](mobile/README.md), and [admin-panel/README.md](admin-panel/README.md) for full setup, environment variables, and architecture notes.

## Testing

Every phase ships with real, automated tests — no phase was marked done on faith:

- **Backend:** Jest + Supertest against a real in-memory MongoDB (`mongodb-memory-server`, not mocks) — 140+ integration/unit tests
- **Mobile:** `flutter analyze` + `flutter test` (widget/unit tests) — 37 tests
- **Admin panel:** `npm run lint` + `npm run build`, plus a scripted API-contract smoke test exercising every list/create/update/delete endpoint the UI calls

## Security

See [backend/README.md](backend/README.md#security) for the full list. Highlights: bcrypt password hashing, JWT with pinned algorithm, strict + general-purpose rate limiting, NoSQL-injection and ReDoS-injection sanitization, HMAC webhook signatures verified with a timing-safe comparison, and a production boot-time check that refuses to start with weak secrets, sandbox-default secrets, or a wildcard CORS origin. `npm audit` is clean across both Node projects.

## Progress

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Backend: project skeleton, JWT auth, and the full domain — Users, Pharmacies, Medicines, Categories, Cart, Orders, Payments (sandbox gateway), Deliveries | ✅ Complete |
| 2 | Flutter mobile app: splash, onboarding, auth, themed bottom-nav shell (Home/Categories/Cart/Profile) | ✅ Complete |
| 3 | Mobile: Home module (search, medicine detail, wishlist, pagination) | ✅ Complete |
| 4 | Mobile: shopping cart & checkout (quantity, coupon, delivery fee, address, payment selection, order summary/placement) | ✅ Complete |
| 5 | Backend: Zaad/e-Dahab sandbox payment gateway integration (verification, status, transaction history, retries, webhooks) | ✅ Complete |
| 6 | Mobile: delivery system (rider app, Google Maps tracking with fallback, ETA, notifications) | ✅ Complete |
| 7 | React admin panel: login, dashboard, medicines/categories CRUD, orders, customers, payments, reports & charts, PDF/Excel export, role management, audit logs | ✅ Complete |
| 9 | Final production hardening: security audit + fixes (JWT pinning, rate limiting, ReDoS fix, fail-fast prod config), a real stock-oversell race-condition fix, database indexing, a UI overflow bugfix, full OpenAPI/Swagger documentation, and a security-audit pass across all three apps | ✅ Complete |
| 8 | Real Zaad/e-Dahab merchant integration, Firebase push notifications, prescription/product image upload | Not started |

*(Phase 9 shipped before phase 8 — it was a cross-cutting hardening pass across everything already built, not tied to a specific unbuilt feature.)*
