# Zaad/e-Dahab Backend

REST API for the Zaad/e-Dahab E-Pharmacy platform. Node.js + Express + MongoDB (Mongoose), with JWT access/refresh authentication.

## Scope delivered so far

- Project skeleton (config, models, services, controllers, routes, middleware, utils)
- **Auth**: register, login, JWT access tokens + rotating/revocable refresh tokens, logout
- **Users**: profile self-service (update name/phone, manage saved addresses), admin listing/role/activation management
- **Pharmacies**: onboarding by pharmacists (one pharmacy per pharmacist), admin verification, public directory of verified+active pharmacies
- **Categories**: admin-managed catalog taxonomy with auto-generated unique slugs
- **Medicines**: per-pharmacy inventory (price, discount price, stock, prescription flag), public search/filter/pagination, owner/admin-only mutation
- **Cart**: one cart per user, live-priced against current medicine data, stock-aware
- **Orders**: cart checkout with server-computed subtotal/delivery fee/tax/total, stock decrement, role-scoped listing (customer/pharmacist/admin), a bounded manual status state machine (`pending → confirmed → preparing`), and cancellation with automatic restock + payment/delivery cascade
- **Payments**: a pluggable gateway abstraction (`zaad`, `edahab`, `cod`) backed by clearly-labeled sandbox mocks until real merchant credentials are supplied — same `{ initiate, confirm }` interface a real integration would implement
- **Deliveries**: rider assignment, a rider-driven status state machine (`pending → assigned → picked_up → in_transit → delivered`), live location updates, and cascading effects into the linked order/payment (e.g. a delivered COD delivery auto-completes its payment)
- Centralized error handling, request validation, rate limiting on auth routes, security headers (helmet), CORS, body sanitization against NoSQL operator injection
- Structured logging (winston/morgan)
- Full integration + unit test suite (Jest + Supertest + mongodb-memory-server — a real in-memory MongoDB engine, not mocks)

Not yet built: the Flutter mobile app, the React admin panel, real Zaad/e-Dahab merchant integration, Firebase notifications, Google Maps live tracking, and file/image upload (prescription images and product photos are plain URL strings for now).

## Getting started

```bash
cp .env.example .env   # then fill in real secrets
npm install
npm run dev             # starts the API with nodemon, requires a running MongoDB at MONGO_URI
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the API with nodemon (auto-reload) |
| `npm start` | Start the API in production mode |
| `npm test` | Run the full Jest suite (spins up an in-memory MongoDB) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Lint the codebase with ESLint |

## Roles

`customer` (default) · `pharmacist` (manages exactly one `Pharmacy` and its `Medicine` listings) · `rider` (fulfills `Delivery` assignments) · `admin` (full access, verifies pharmacies, manages users, confirms payments)

There is no public endpoint to self-assign `pharmacist`/`rider`/`admin` — the first admin must be promoted directly in the database (e.g. `db.users.updateOne(...)`), the same way any real deployment bootstraps its first privileged account.

## API surface

Base path: `API_PREFIX` (default `/api/v1`)

### Auth
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | none | Liveness/health check |
| POST | `/auth/register` | none | Create an account, returns access + refresh tokens |
| POST | `/auth/login` | none | Authenticate, returns access + refresh tokens |
| POST | `/auth/refresh-token` | none (refresh token in body) | Rotates the refresh token, returns a new pair |
| POST | `/auth/logout` | none (refresh token in body) | Revokes the given refresh token |
| POST | `/auth/forgot-password` | none | Always returns a generic success message; in non-production the response also includes `resetToken` (no email provider is wired up yet — sandboxed the same way payments are) |
| POST | `/auth/reset-password` | none (reset token in body) | Sets a new password, revokes all of that user's refresh tokens |

### Users
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users/me` | Bearer | Current user's profile |
| PATCH | `/users/me` | Bearer | Update name/phone |
| POST | `/users/me/addresses` | Bearer | Add a saved delivery address |
| PATCH | `/users/me/addresses/:addressId` | Bearer | Update a saved address |
| DELETE | `/users/me/addresses/:addressId` | Bearer | Remove a saved address |
| GET | `/users` | admin | List users (filter by `role`, paginated) |
| GET | `/users/:id` | admin | Get a user by id |
| PATCH | `/users/:id` | admin | Change a user's `role`/`isActive` |

### Pharmacies
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/pharmacies` | none (admin gets `?all=true`) | Public directory (verified + active only, unless admin) |
| GET | `/pharmacies/:id` | none | Get a pharmacy |
| POST | `/pharmacies` | pharmacist/admin | Register a pharmacy (owner = self, unless admin sets `owner`) |
| PATCH | `/pharmacies/:id` | owner/admin | Update pharmacy details (only admin can set `isVerified`/`isActive`) |
| PATCH | `/pharmacies/:id/verify` | admin | Approve/reject a pharmacy |
| DELETE | `/pharmacies/:id` | admin | Delete a pharmacy |

### Categories
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/categories` | none | List active categories (admin gets `?all=true`, filter by `?parent=`) |
| GET | `/categories/:id` | none | Get a category |
| POST | `/categories` | admin | Create a category (slug auto-generated & deduplicated) |
| PATCH | `/categories/:id` | admin | Update a category |
| DELETE | `/categories/:id` | admin | Delete (blocked if medicines or subcategories still reference it) |

### Medicines
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/medicines` | none | Search/list (filters: `category`, `pharmacy`, `minPrice`, `maxPrice`, `requiresPrescription`, `search`; paginated) |
| GET | `/medicines/:id` | none | Get a medicine |
| POST | `/medicines` | pharmacist/admin | Create under the pharmacist's own pharmacy (admin must pass `pharmacy`) |
| PATCH | `/medicines/:id` | owner pharmacist/admin | Update price/stock/details |
| DELETE | `/medicines/:id` | owner pharmacist/admin | Delete |

### Cart
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/cart` | Bearer | Get the current user's cart (live-priced, with computed subtotal) |
| POST | `/cart/items` | Bearer | Add/increment an item (`medicineId`, `quantity`) |
| PATCH | `/cart/items/:medicineId` | Bearer | Set an item's quantity (`0` removes it) |
| DELETE | `/cart/items/:medicineId` | Bearer | Remove an item |
| DELETE | `/cart` | Bearer | Clear the cart |

### Orders
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders` | Bearer | Checkout the current cart (`deliveryAddress`, `paymentMethod`, optional `prescriptionImage`) — creates the Order, Payment, and Delivery together |
| GET | `/orders` | Bearer | List orders, scoped by role (customer: own; pharmacist: theirs; admin: all) |
| GET | `/orders/:id` | owner/relevant pharmacist/admin | Get an order |
| PATCH | `/orders/:id/status` | pharmacist/admin | Manual transitions only: `pending→confirmed→preparing`, or `cancelled`. `out_for_delivery`/`delivered` are cascaded automatically from the linked Delivery, never set directly here |
| PATCH | `/orders/:id/cancel` | owner/admin | Cancel (only while `pending`/`confirmed`/`preparing`) — restocks medicines and cascades to payment/delivery |

### Payments
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/payments` | admin | List all payments (filter by `status`/`method`) |
| GET | `/payments/order/:orderId` | owner/relevant pharmacist/admin | Get the payment for an order |
| GET | `/payments/:id` | owner/admin | Get a payment |
| POST | `/payments/:id/confirm` | admin | Simulate a gateway confirmation (stand-in for a real provider webhook) |

### Deliveries
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/deliveries` | admin/rider | List deliveries (rider sees only their own assignments) |
| GET | `/deliveries/order/:orderId` | owner/relevant pharmacist/admin | Get the delivery for an order |
| GET | `/deliveries/:id` | owner/assigned rider/admin | Get a delivery |
| PATCH | `/deliveries/:id/assign` | admin | Assign a rider |
| PATCH | `/deliveries/:id/status` | assigned rider/admin | Progress `assigned→picked_up→in_transit→delivered` (or `cancelled`) |
| PATCH | `/deliveries/:id/location` | assigned rider/admin | Update live `lat`/`lng` (placeholder ahead of real Google Maps tracking) |

## Business rules worth knowing

- **Checkout** computes `subtotal` from live medicine prices, a flat delivery fee waived above a free-delivery threshold, and a flat tax rate — all server-side, never trusted from the client.
- **Prescription gating**: if any cart item has `requiresPrescription: true`, checkout requires a non-empty `prescriptionImage` (a URL string for now; actual file upload lands with Cloud Storage in a later phase).
- **Stock** is decremented on checkout and restored on cancellation. There's no multi-document transaction around this yet (mongodb doesn't get a replica set in this phase), so concurrent checkouts of the last unit of stock is a known race left for a later hardening pass.
- **Order vs. Delivery status are two separate state machines** by design: pharmacy staff own `pending/confirmed/preparing/cancelled` via the Order API, while logistics/riders own `assigned/picked_up/in_transit/delivered` via the Delivery API. The two are bridged automatically (Delivery reaching `delivered` marks the Order `delivered` and, for COD, marks the Payment `completed`).

## Architecture

```
src/
  config/      environment loading, MongoDB connection, logger
  models/      Mongoose schemas (User, RefreshToken, Pharmacy, Category, Medicine, Cart, Order, Payment, Delivery)
  services/    business logic per resource, plus the pluggable payment gateway
  controllers/ thin HTTP handlers, delegate to services
  routes/      Express routers
  middleware/  auth guard (+ optional-auth for public/admin-aware routes), validation, rate limiting, error handling
  utils/       ApiError, ApiResponse, catchAsync, pagination, slugify, order number generator
  app.js       Express app wiring (no network listener — used directly by tests)
  server.js    boots the DB connection and HTTP listener
tests/
  integration/ full HTTP request/response tests against a real in-memory MongoDB, one file per resource
  unit/        service-level unit tests
  helpers/     shared test fixtures (register users by role, build a verified pharmacy+category+medicine)
```
