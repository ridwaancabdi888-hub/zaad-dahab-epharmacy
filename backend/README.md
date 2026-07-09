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
- **Payments**: a pluggable gateway abstraction (`zaad`, `edahab`, `cod`) backed by clearly-labeled sandbox mocks until real merchant credentials are supplied — same `{ initiate, checkStatus }` interface a real integration would implement. Includes deterministic sandbox test scenarios (magic payer-phone suffixes), self-service payment status verification, retry for failed payments, an HMAC-signed webhook endpoint for async provider callbacks, and per-user transaction history
- **Deliveries**: rider assignment, a rider-driven status state machine (`pending → assigned → picked_up → in_transit → delivered`), live location updates, cascading effects into the linked order/payment (e.g. a delivered COD delivery auto-completes its payment), and a server-computed estimated delivery window that refreshes every time the rider's location or status changes
- **Notifications**: real, persisted in-app notifications (not push — no Firebase project is configured) created automatically on every delivery status change and order cancellation, with per-user history and read/unread state
- Centralized error handling, request validation, rate limiting on auth routes, security headers (helmet), CORS, body sanitization against NoSQL operator injection
- Structured logging (winston/morgan)
- Full integration + unit test suite (Jest + Supertest + mongodb-memory-server — a real in-memory MongoDB engine, not mocks)

Not yet built: the React admin panel, real Zaad/e-Dahab merchant integration, real push notifications (FCM), and file/image upload (prescription images and product photos are plain URL strings for now). Google Maps live tracking is implemented on the mobile side with a graceful fallback when no API key is configured — see `mobile/README.md`.

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
| GET | `/users/me/wishlist` | Bearer | List saved medicines (populated with category/pharmacy) |
| POST | `/users/me/wishlist/:medicineId` | Bearer | Add a medicine to the wishlist (idempotent) |
| DELETE | `/users/me/wishlist/:medicineId` | Bearer | Remove a medicine from the wishlist |
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
| POST | `/orders/quote` | Bearer | Price the current cart (optional `couponCode`) without creating anything — subtotal/delivery fee/tax/discount/total, for a live checkout preview |
| POST | `/orders` | Bearer | Checkout the current cart (`deliveryAddress`, `paymentMethod`, optional `prescriptionImage`, optional `couponCode`) — creates the Order, Payment, and Delivery together |
| GET | `/orders` | Bearer | List orders, scoped by role (customer: own; pharmacist: theirs; admin: all) |
| GET | `/orders/:id` | owner/relevant pharmacist/admin | Get an order |
| PATCH | `/orders/:id/status` | pharmacist/admin | Manual transitions only: `pending→confirmed→preparing`, or `cancelled`. `out_for_delivery`/`delivered` are cascaded automatically from the linked Delivery, never set directly here |
| PATCH | `/orders/:id/cancel` | owner/admin | Cancel (only while `pending`/`confirmed`/`preparing`) — restocks medicines and cascades to payment/delivery |

### Payments
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/payments` | admin | List all payments (filter by `status`/`method`) |
| GET | `/payments/me` | Bearer | The current user's own transaction history (paginated, filter by `status`) |
| GET | `/payments/order/:orderId` | owner/relevant pharmacist/admin | Get the payment for an order |
| GET | `/payments/:id` | owner/admin | Get a payment |
| POST | `/payments/:id/confirm` | admin | Manual override: mark a payment paid regardless of what the gateway reports |
| POST | `/payments/:id/verify` | owner/admin | Ask the gateway what it currently thinks the payment's status is (the realistic "check my payment" flow after a customer confirms/declines a USSD prompt) |
| POST | `/payments/:id/retry` | owner/admin | Re-initiate a fresh gateway attempt for a `failed` payment on the same order (new provider reference) |
| POST | `/payments/webhook/:provider` | none — HMAC-signed | Public callback endpoint a real Zaad/e-Dahab webhook would call; verified via `X-Webhook-Signature` (HMAC-SHA256 over the raw body, `ZAAD_WEBHOOK_SECRET`/`EDAHAB_WEBHOOK_SECRET`) |

#### Sandbox test scenarios

No real Zaad/e-Dahab merchant sandbox is available in this environment, so `checkStatus` deterministically classifies outcomes by the **last 4 digits of `payerPhone`** — the same idea as a real gateway's magic test card numbers:

| Phone ending in | Outcome |
| --- | --- |
| `0000`, or anything unrecognized | `completed` |
| `1111` | `failed` — `insufficient_funds` |
| `2222` | `failed` — `timeout` |
| `3333` | stays `processing` forever (customer never confirms the USSD prompt) |

`initiate` always returns `processing` immediately (a real mobile-money request is sent to the payer's phone and awaits their confirmation); call `/payments/:id/verify` to resolve it. Cash on Delivery is unaffected — it stays `pending` until the linked delivery is marked delivered.

### Coupons
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/coupons` | admin | Create a coupon (`code`, `type`: `percentage`\|`fixed`, `value`, optional `minSubtotal`/`maxDiscount`/`expiresAt`/`usageLimit`) |
| GET | `/coupons` | admin | List coupons (filter by `isActive`, paginated) |
| GET | `/coupons/:id` | admin | Get a coupon |
| PATCH | `/coupons/:id` | admin | Update a coupon |
| DELETE | `/coupons/:id` | admin | Delete a coupon |

There's no public "apply coupon" endpoint — a coupon is validated as a side effect of `/orders/quote` or `/orders` (via `couponCode`), which is the only place discounts ever apply. Usage (`usedCount`) is only incremented on an actual checkout, never on a quote/preview.

### Deliveries
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/deliveries` | admin/rider | List deliveries (rider sees only their own assignments) |
| GET | `/deliveries/order/:orderId` | owner/assigned rider/relevant pharmacist/admin | Get the delivery for an order |
| GET | `/deliveries/:id` | owner/assigned rider/admin | Get a delivery |
| PATCH | `/deliveries/:id/assign` | admin | Assign a rider |
| PATCH | `/deliveries/:id/status` | assigned rider/admin | Progress `assigned→picked_up→in_transit→delivered` (or `cancelled`); recomputes the ETA on every in-flight transition |
| PATCH | `/deliveries/:id/location` | assigned rider/admin | Update live `lat`/`lng`; recomputes the ETA while `picked_up`/`in_transit` |

`estimatedDeliveryStart`/`estimatedDeliveryEnd` on a delivery are only set once **both** the rider's `currentLocation` and the order's `deliveryAddress` have coordinates — computed from straight-line (haversine) distance at an assumed average urban delivery speed (`src/utils/geo.js`), not real traffic data. They're cleared once the delivery is `delivered`.

Every delivery response also populates its `order` field with `orderNumber`, `total`, `paymentMethod`, `status`, `items` and the customer's `user.name`/`user.phone` — enough for the rider app to show order context without a separate, and separately-authorized, call to `GET /orders/:id` (a rider isn't otherwise allowed to fetch an order directly, since order-level access control only considers the order's owner/pharmacist/admin, not the assigned rider).

### Notifications
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notifications/me` | Bearer | The current user's notifications (paginated), plus an `unreadCount` |
| GET | `/notifications/me/unread-count` | Bearer | Just the unread count (for a badge) |
| PATCH | `/notifications/:id/read` | owner | Mark one notification as read |
| PATCH | `/notifications/read-all` | Bearer | Mark all of the current user's notifications as read |

A notification is created automatically for the order's customer on every delivery status change (`assigned`, `picked_up`, `in_transit`, `delivered`, `cancelled`) and on order cancellation. This is real, persisted, polled-for data — not a stand-in for push notifications, which would need a Firebase project this environment doesn't have.

## Business rules worth knowing

- **Checkout** computes `subtotal` from live medicine prices, a flat delivery fee waived above a free-delivery threshold, and a flat tax rate — all server-side, never trusted from the client.
- **Prescription gating**: if any cart item has `requiresPrescription: true`, checkout requires a non-empty `prescriptionImage` (a URL string for now; actual file upload lands with Cloud Storage in a later phase).
- **`payerPhone` is required at checkout for `zaad`/`edahab`** (validated as 7-15 digits, optional leading `+`) — mobile money payments are pushed to that phone as a USSD prompt in real life, and it also drives the sandbox test scenarios above. Not required for `cod`.
- **Stock** is decremented on checkout and restored on cancellation. There's no multi-document transaction around this yet (mongodb doesn't get a replica set in this phase), so concurrent checkouts of the last unit of stock is a known race left for a later hardening pass.
- **Order vs. Delivery status are two separate state machines** by design: pharmacy staff own `pending/confirmed/preparing/cancelled` via the Order API, while logistics/riders own `assigned/picked_up/in_transit/delivered` via the Delivery API. The two are bridged automatically (Delivery reaching `delivered` marks the Order `delivered` and, for COD, marks the Payment `completed`).

## Architecture

```
src/
  config/      environment loading, MongoDB connection, logger
  models/      Mongoose schemas (User, RefreshToken, Pharmacy, Category, Medicine, Cart, Order, Payment, Delivery, Coupon, Notification)
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
