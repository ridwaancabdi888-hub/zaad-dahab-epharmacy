# Zaad/e-Dahab Backend

REST API for the Zaad/e-Dahab E-Pharmacy platform. Node.js + Express + MongoDB (Mongoose), with JWT access/refresh authentication.

## Phase 1 scope

This phase delivers the backend authentication foundation only:

- Project skeleton (config, models, services, controllers, routes, middleware, utils)
- User model with hashed passwords (bcrypt)
- JWT access tokens (short-lived) + rotating, revocable refresh tokens (stored hashed, TTL-indexed)
- Endpoints: register, login, refresh-token, logout, get current user
- Centralized error handling, request validation, rate limiting on auth routes, security headers (helmet), CORS, body sanitization against NoSQL operator injection
- Structured logging (winston/morgan)
- Full integration + unit test suite (Jest + Supertest + mongodb-memory-server — a real in-memory MongoDB engine, not mocks)

Later phases will add: pharmacy domain models (products, orders, prescriptions), the Flutter mobile app, the React admin panel, payment gateways (Zaad/e-Dahab), Firebase notifications, and Google Maps delivery tracking.

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

## API surface (Phase 1)

Base path: `API_PREFIX` (default `/api/v1`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | none | Liveness/health check |
| POST | `/auth/register` | none | Create an account, returns access + refresh tokens |
| POST | `/auth/login` | none | Authenticate, returns access + refresh tokens |
| POST | `/auth/refresh-token` | none (refresh token in body) | Rotates the refresh token, returns a new pair |
| POST | `/auth/logout` | none (refresh token in body) | Revokes the given refresh token |
| GET | `/users/me` | Bearer access token | Returns the authenticated user's profile |

## Architecture

```
src/
  config/      environment loading, MongoDB connection, logger
  models/      Mongoose schemas (User, RefreshToken)
  services/    business logic (auth, token issuance/rotation)
  controllers/ thin HTTP handlers, delegate to services
  routes/      Express routers
  middleware/  auth guard, validation, rate limiting, error handling
  utils/       ApiError, ApiResponse, catchAsync
  app.js       Express app wiring (no network listener — used directly by tests)
  server.js    boots the DB connection and HTTP listener
tests/
  integration/ full HTTP request/response tests against a real in-memory MongoDB
  unit/        service-level unit tests
```
