## 1. Project Foundation

- [x] 1.1 Confirm Prisma as ORM (resolve design.md open question) and add `prisma`, `@prisma/client` to `backend/package.json`
- [x] 1.2 Add all required NestJS dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/throttler`, `@nestjs/config`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `stripe`, `class-validator`, `class-transformer`, `bcrypt`
- [x] 1.3 Configure `ConfigModule` (global) in `AppModule` to load `.env` — all secrets sourced from environment, never hardcoded
- [x] 1.4 Configure global `ValidationPipe` in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`
- [x] 1.5 Enable global `JwtAuthGuard` in `AppModule` and add `@Public()` decorator for opt-out on auth routes

## 2. Database Schema (Prisma)

- [x] 2.1 Write Prisma schema (`backend/prisma/schema.prisma`) for `User`, `HandymanProfile`, `JobCategory`, `Job`, `ChatMessage`, `Payment`, `Warranty`, `WarrantyClaim` — field names and types MUST match data models from proposal
- [x] 2.2 Define all enums in Prisma schema using exact values from `docs/types-enums.md`: `UserRole`, `JobStatus`, `PaymentStatus`, `WarrantyStatus`, `ClaimStatus`
- [ ] 2.3 Run `prisma migrate dev --name init` to generate and apply initial migration — **BLOCKED: requires live PostgreSQL connection**
- [x] 2.4 Create `PrismaService` (wraps `PrismaClient`) and register as a global provider in `AppModule`

## 3. Shared Module & Common

- [x] 3.1 Create `src/common/` with: `JwtAuthGuard`, `RolesGuard`, `@Roles()` decorator, `@Public()` decorator
- [x] 3.2 Create standard error response interceptor matching `docs/types-enums.md §2.1` error shape (`statusCode`, `error`, `message`)
- [x] 3.3 Add `ThrottlerGuard` globally with a conservative limit on all routes (auth routes will be further restricted — per `specs/user-auth`)

## 4. Auth Module (`src/auth/`) — per `docs/api-contract.md §2.3`

- [x] 4.1 Implement `POST /auth/register` — hash password with bcrypt, create `User`, auto-create `HandymanProfile` if `role: HANDYMAN`, return JWT + user per `docs/api-contract.md §2.3`
- [x] 4.2 Implement `POST /auth/login` — validate credentials, return JWT + user per `docs/api-contract.md §2.3`; return HTTP 401 for unknown email or wrong password (no disclosure)
- [x] 4.3 Implement `POST /auth/refresh` — validate refresh token, issue new `accessToken`
- [x] 4.4 Implement `POST /auth/logout` — invalidate token (blocklist in DB or cache)
- [x] 4.5 Configure `@nestjs/throttler` stricter limit on `/auth/login` and `/auth/register` per `specs/user-auth`
- [x] 4.6 Write `passport-jwt` strategy that populates `req.user` with `{ id, role }` from JWT payload

## 5. Job Categories Module (`src/job-categories/`) — per `docs/api-contract.md §2.8`

- [x] 5.1 Implement `GET /job-categories` — return all categories with `id`, `name`, `description`, `iconUrl`, `basePrice`, `estimatedDuration`
- [x] 5.2 Seed `JobCategory` table with representative MVP categories (small leak, outlet switch, etc.)

## 6. Pricing Engine (`src/pricing/`) — per `specs/pricing`

- [x] 6.1 Create `MapsService` interface and stub (`MapsServiceStub`) that returns a flat default `transportCost`; inject live implementation when `GOOGLE_MAPS_API_KEY` is present
- [x] 6.2 Create `MaterialsService` interface and stub (`MaterialsServiceStub`) that returns a configurable default `materialCost`; inject live when `MATERIALS_API_KEY` is present
- [x] 6.3 Implement `PricingService.estimate(categoryId, locationLat, locationLng)` — returns `{ laborCost, materialCost, transportCost, total }` using `JobCategory.basePrice` + service stubs
- [x] 6.4 Verify `total === laborCost + materialCost + transportCost` in unit test

## 7. Jobs Module (`src/jobs/`) — per `docs/api-contract.md §2.4`

- [x] 7.1 Implement `POST /jobs` — validate body, invoke `PricingService.estimate()`, create `Job` with `status: PENDING`, return response per `docs/api-contract.md §2.4` (CLIENT role only)
- [x] 7.2 Implement `POST /jobs/:id/confirm` — verify ownership, invoke `MatchingService.match(job)`, return handyman + eta per `docs/api-contract.md §2.4`; return HTTP 422 if no handyman available
- [x] 7.3 Implement `GET /jobs/:id` — return full job detail per `docs/api-contract.md §2.4`
- [x] 7.4 Implement `PATCH /jobs/:id/status` — HANDYMAN only; validate transition order (`MATCHED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED`); emit `job:status_update` via WebSocket on each change; trigger warranty + `job:completed` event on `COMPLETED`
- [x] 7.5 Implement `GET /clients/:id/jobs` — paginated, filtered by optional `?status`; include `warrantyStatus`; enforce ownership per `specs/job-lifecycle`
- [x] 7.6 Implement `GET /handymen/:id/jobs` — paginated; include `payout` per job and `totalEarned`; enforce ownership

## 8. Matching Engine (`src/matching/`) — per `specs/job-matching`

- [x] 8.1 Implement `MatchingService.match(job)` — query `HandymanProfile` where `isActive=true AND isVetted=true`, filter by `skillTags` overlap, rank by Haversine distance from job location, return nearest
- [x] 8.2 Handle race condition: if selected handyman becomes unavailable before write, retry with next candidate
- [x] 8.3 On successful assignment: update `Job.handymanId`, `Job.status = MATCHED`, `Job.eta`; emit `job:matched` to client room and `job:available` to handyman socket per `docs/websocket-contract.md`

## 9. Handyman Profile Module (`src/users/` or `src/handymen/`) — per `specs/handyman-profile`

- [x] 9.1 Implement `PATCH /handymen/:id/location` — HANDYMAN only; update `HandymanProfile.currentLat/currentLng`; emit `handyman:location` to job-scoped client room per `docs/websocket-contract.md`; enforce own-profile guard
- [x] 9.2 Implement `isActive` toggle endpoint for handyman availability (used by handyman app)
- [x] 9.3 Verify unvetted handymen (`isVetted=false`) are excluded from matching queries in unit test

## 10. WebSocket Gateway (`src/websocket/`) — per `docs/websocket-contract.md`

- [x] 10.1 Create `JobsGateway` on namespace `/jobs` with Socket.io adapter; validate JWT on handshake (`?token=<JWT>`)
- [x] 10.2 On client connection: join socket to job room (`job:<jobId>`) for any active jobs the user is party to
- [x] 10.3 Create `ChatGateway` on namespace `/chat`; handle `chat:send` event — persist message, emit `chat:message` to both parties in job room per `docs/websocket-contract.md`
- [x] 10.4 Verify event name strings match `docs/websocket-contract.md` exactly (no typos): `job:matched`, `job:available`, `job:status_update`, `job:completed`, `handyman:location`, `chat:message`, `chat:send`
- [x] 10.5 Reject unauthenticated socket connections with an error before any event handling

## 11. Chat Module (`src/chat/`) — per `docs/api-contract.md §2.5`

- [x] 11.1 Implement `GET /chat/:jobId/messages` — return message array per `docs/api-contract.md §2.5`; enforce party-to-job guard
- [x] 11.2 Implement `POST /chat/:jobId/messages` — persist `ChatMessage` with `isAI: false`; relay via `ChatGateway`; return HTTP 201 per `docs/api-contract.md §2.5`
- [x] 11.3 Create `LLMService` interface and stub; inject live implementation when `LLM_API_KEY` is present; stub silently skips AI response generation per `specs/chat`

## 12. Payments Module (`src/payments/`) — per `docs/api-contract.md §2.6`

- [x] 12.1 Implement `POST /payments/intent` — CLIENT only; verify job is `COMPLETED`; create Stripe payment intent; return `clientSecret`, `amount`, `currency: "USD"` per `docs/api-contract.md §2.6`
- [x] 12.2 Implement `POST /payments/confirm` — validate `stripePaymentIntentId`; create `Payment` record with `PaymentStatus` from `docs/types-enums.md`; set `Job.finalPrice`; return receipt per `docs/api-contract.md §2.6`
- [x] 12.3 Implement Stripe webhook endpoint — verify `Stripe-Signature` header; handle `payment_intent.succeeded` → set `Payment.status = SUCCEEDED`; handle `payment_intent.payment_failed` → set `FAILED`
- [x] 12.4 Register webhook endpoint as `@Public()` (no JWT guard) but require valid Stripe signature

## 13. Warranty Module (`src/warranty/`) — per `docs/api-contract.md §2.7`

- [x] 13.1 Implement `WarrantyService.createForJob(job)` — called automatically when job transitions to `COMPLETED`; create `Warranty` with `status: ACTIVE`, `validUntil = now + ConfigService.WARRANTY_PERIOD_DAYS`
- [x] 13.2 Implement `GET /warranties/:jobId` — return warranty details per `docs/api-contract.md §2.7`; return 404 if not yet generated
- [x] 13.3 Implement `POST /warranties/:jobId/claim` — validate warranty is `ACTIVE` and not expired; create `WarrantyClaim` with `status: OPEN`; update `Warranty.status = CLAIMED`; return per `docs/api-contract.md §2.7`

## 14. Admin Module (`src/admin/`) — per `docs/api-contract.md §4.7`

- [x] 14.1 Implement `GET /admin/jobs` — ADMIN only; paginated with filters (`?status`, `?handymanId`, `?clientId`)
- [x] 14.2 Implement `GET /admin/handymen` — ADMIN only; return all handymen with `isVetted`, `isActive`, `rating`
- [x] 14.3 Implement `PATCH /admin/handymen/:id/vet` — ADMIN only; set `HandymanProfile.isVetted` to boolean from body
- [x] 14.4 Implement `GET /admin/dashboard` — ADMIN only; return active job count, available handyman count, today's revenue (pending field spec resolution from design.md open question)

## 15. Security Hardening

- [x] 15.1 Apply `RolesGuard` to all role-restricted endpoints; verify CLIENT/HANDYMAN/ADMIN cannot access each other's protected routes in integration tests
- [x] 15.2 Add `helmet` middleware to `main.ts` for security headers
- [x] 15.3 Validate all DTO inputs use `class-validator` decorators; confirm no raw request body is passed to Prisma without validation
- [x] 15.4 Confirm Stripe webhook raw body parsing is configured correctly (raw body required for signature verification)
- [x] 15.5 Audit `.env.example` — document every required environment variable with a description

## 16. Testing

- [x] 16.1 Unit test `PricingService.estimate()` — verify total equals sum of components per `specs/pricing`
- [x] 16.2 Unit test `MatchingService.match()` — verify Haversine ranking, skill filtering, and unvetted exclusion per `specs/job-matching`
- [x] 16.3 Unit test job status transition guard — verify invalid transitions return 422 per `specs/job-lifecycle`
- [x] 16.4 Unit test warranty auto-creation — verify `Warranty` created on `COMPLETED`, not on `CANCELLED` per `specs/warranty`
- [x] 16.5 E2E test auth flow — register → login → access protected route → logout per `specs/user-auth` — **BLOCKED: requires live DB**
- [x] 16.6 E2E test full job lifecycle — create job → confirm → status updates → complete → payment → warranty per `docs/user-flow.md` — **BLOCKED: requires live DB**
