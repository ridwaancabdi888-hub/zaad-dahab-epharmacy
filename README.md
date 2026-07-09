# Zaad/e-Dahab E-Pharmacy

A full-stack e-pharmacy platform: Flutter mobile app, Node.js/Express/MongoDB backend, and a React.js admin panel, with Zaad/e-Dahab mobile payments, Firebase notifications, and Google Maps delivery tracking.

Built in phases — each phase is implemented, tested, and committed before moving to the next.

## Repository layout

```
backend/       Node.js + Express + MongoDB REST API (JWT auth, business logic)
mobile/        Flutter mobile app (Clean Architecture, Material 3)
admin-panel/   React.js admin dashboard
DESIGN.md      Visual design system reference used by the mobile app
```

## Tech stack

- **Mobile:** Flutter, Clean Architecture, Riverpod/Provider, Material 3
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Admin Panel:** React.js
- **Cloud:** Firebase (notifications, storage)
- **Payments:** Zaad API, e-Dahab API, Cash on Delivery
- **Delivery:** Google Maps live tracking

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
| 8 | Real Zaad/e-Dahab merchant integration, Firebase push notifications, prescription/product image upload | Not started |

See [backend/README.md](backend/README.md) for the API reference, [mobile/README.md](mobile/README.md) for the Flutter app, and [admin-panel/README.md](admin-panel/README.md) for the admin dashboard.
