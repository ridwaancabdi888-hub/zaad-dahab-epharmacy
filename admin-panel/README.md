# Zaad/e-Dahab Admin Panel

React 19 + Vite admin dashboard for the Zaad/e-Dahab E-Pharmacy platform, wired end to end to the real backend REST API — no mock data anywhere.

## Scope delivered

- **Login** — admin-only session against the real `/auth/login`; a valid pharmacist/rider/customer login is accepted by the backend but deliberately refused client-side with an explicit "This account does not have admin access" message rather than a silent failure
- **Dashboard** — live stat cards (revenue, orders, customers, catalog size) and charts (14-day revenue trend, orders by status, top medicines, payments by method), all sourced from one aggregation endpoint: `GET /reports/dashboard`
- **Medicines CRUD** — full create/edit/delete against `/medicines`, including the pharmacy/category selects a create requires
- **Categories CRUD** — full create/edit/delete against `/categories`, including the "can't delete a category still in use" conflict surfaced as a real error, not swallowed
- **Orders** — paginated list with status filter, a detail view (items, address, totals), and the real forward-status/cancel actions the backend's state machine allows (`pending → confirmed → preparing`, cancel from any of those)
- **Customers** — paginated customer list with suspend/reactivate (`isActive` toggle)
- **Payments** — paginated, filterable (status/method) list of every payment attempt, with the admin "Confirm Paid" manual-override action
- **Reports** — the same aggregated data as the Dashboard, presented as exportable tables plus two more charts
- **Charts** — [recharts](https://recharts.org): area/line/bar/pie, all fed by real aggregation data, never sample data
- **Export PDF** — [jspdf](https://github.com/parallax/jsPDF) + jspdf-autotable, generates a multi-section PDF from the live report data
- **Export Excel** — [SheetJS (xlsx)](https://sheetjs.com/), generates a multi-sheet `.xlsx` workbook from the live report data
- **Role Management** — create a new user with any role directly (`POST /users`, name/email/phone/password/role — the only way to provision a pharmacist/rider/admin account without the "register then promote" two-step), and change any existing user's role via `PATCH /users/:id`, with a confirmation step and a guard against changing your own account's role from the table
- **Audit Logs** — every mutating admin action (medicine/category/coupon create-update-delete, user role changes, order status/cancel, payment confirm) is recorded server-side and browsable here, filterable by resource type, action, and date range

## Backend additions this phase

Building this dashboard required extending the backend (see `backend/README.md`):
- `GET /reports/dashboard` — a new aggregation endpoint (MongoDB aggregation pipelines over Order/Payment/User/Medicine)
- `AuditLog` model + `GET /audit-logs` + `auditLog()` middleware wired into every admin mutation route
- `GET /payments` (admin) changed from a bare unpaginated array to the standard `{ items, meta }` envelope, now filterable by `method` as well as `status`

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 by default
```

The API base URL defaults to `http://localhost:5000/api/v1`. Override it with:

```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1 npm run dev
```

## Architecture

```
src/
  api/
    client.js       fetch wrapper: bearer auth, silent-refresh-on-401 retry, ApiError
    resources.js     one thin object per backend resource (medicinesApi, ordersApi, ...)
  auth/
    AuthContext.jsx  session state (login/logout/bootstrap), admin-only gate
    RequireAdmin.jsx route guard
  components/
    layout/AppShell.jsx   sidebar + topbar + <Outlet/>
    ui/                    Modal, ConfirmDialog, Pagination, StatCard, Badge, Spinner, ErrorBanner, EmptyState
    icons.jsx               small set of inline thin-line SVG icons (no icon library dependency)
  hooks/
    usePaginatedList.js    shared page/filter/loading/error state for every list screen
  pages/                   one file per nav item
  utils/
    format.js               currency/date formatting
    exportPdf.js / exportExcel.js   dynamically import jspdf/xlsx so they're not in the main bundle
```

Design tokens (`src/index.css`) are lifted from the same `../DESIGN.md` the mobile app uses, adapted for a desktop admin layout — same emerald/teal brand, same radii/spacing scale.

## Known environment constraints (dev machine, not the app)

- No httpOnly-cookie session: the access/refresh tokens live in `localStorage`. For an internal admin tool with the browser as the trust boundary this is an accepted tradeoff; a hardened production deployment would likely move this to cookie-based sessions instead.
- Verified in this environment: `npm run lint` (0 issues), `npm run build` (clean, largest lazy-loaded chunk ~425kB gzipped to ~140kB for `xlsx`, main bundle ~245kB), and a full scripted smoke test that logs in as the seeded admin and exercises every list/create/update/delete endpoint the UI calls, asserting response shapes match what each page expects.
- No automated component/E2E test suite is included yet (no CI runner or headless browser was set up for this phase) — correctness here was verified via the build + the scripted API-contract smoke test described above, not interactive click-through testing.
- `xlsx` (SheetJS): the npm registry's last-published version (0.18.5) has two known high-severity CVEs (prototype pollution, ReDoS) with no fix on npm — SheetJS stopped publishing patched releases there. This project installs the patched build directly from SheetJS's own CDN instead (`"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` in `package.json`); `npm audit` is clean as a result.
