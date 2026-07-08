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
| 2 | Flutter mobile app | Not started |
| 3 | React admin panel | Not started |
| 4 | Real Zaad/e-Dahab merchant integration, Firebase notifications, Google Maps live tracking, image upload | Not started |

See [backend/README.md](backend/README.md) for the full API reference and how to run/test the backend.
