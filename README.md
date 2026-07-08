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
| 1 | Backend foundation: project skeleton, JWT auth (register/login/refresh/logout), tests | ✅ Complete |
| 2 | Backend domain: products, categories, orders, prescriptions | Not started |
| 3 | Flutter mobile app | Not started |
| 4 | React admin panel | Not started |
| 5 | Payments (Zaad/e-Dahab), Firebase notifications, Google Maps tracking | Not started |

See [backend/README.md](backend/README.md) for how to run and test the API delivered in Phase 1.
