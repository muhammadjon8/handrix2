## Why

The Handrix platform needs a backend that coordinates on-demand handyman dispatch — from job creation and real-time matching through payment and warranty. No backend exists yet; this change establishes the entire NestJS API layer (v0.1 MVP) so the React frontend and mobile clients can integrate against a stable contract.

## What Changes

- **New**: NestJS project at `backend/` with PostgreSQL (Prisma ORM — see Impact) and Socket.io
- **New**: JWT authentication system (register, login, refresh, logout) per `docs/api-contract.md §2.3`
- **New**: Job lifecycle management — creation, pricing estimate, client confirmation, status progression (`PENDING → MATCHED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED`) per `docs/api-contract.md §2.4`
- **New**: Internal matching engine — finds nearest vetted, available handyman on job confirmation
- **New**: Internal pricing engine — computes `laborCost + materialCost + transportCost` on job creation
- **New**: WebSocket gateway (`/jobs` and `/chat` namespaces) emitting all events defined in `docs/websocket-contract.md`
- **New**: Chat module — message history REST endpoints + real-time relay via WebSocket; LLM assist interface stubbed for future provider
- **New**: Stripe payment flow — payment intents and confirmation per `docs/api-contract.md §2.6`
- **New**: Warranty module — auto-generated on `COMPLETED`, claim filing per `docs/api-contract.md §2.7`
- **New**: Handyman profile management — vetting status, live location updates, job board availability
- **New**: Admin endpoints — jobs overview, handyman vetting, dashboard stats per `docs/api-contract.md §4.7`
- **New**: External service wrappers (Google Maps, Stripe, LLM stub, FCM stub, Materials stub, Transport stub) — all encapsulated behind internal service interfaces so providers can be swapped without touching business logic

## Capabilities

### New Capabilities

- `user-auth`: JWT-based authentication and authorization. Covers register, login, token refresh, logout, JWT guard, and RBAC guards for CLIENT / HANDYMAN / ADMIN roles. Implements `docs/api-contract.md §2.3`. Enums: `UserRole` from `docs/types-enums.md`.
- `job-lifecycle`: Full job resource management — creation with price estimate response, client confirmation triggering matching, handyman status updates, job detail retrieval, and paginated job history for both clients and handymen. Implements `docs/api-contract.md §2.4`. Enums: `JobStatus` from `docs/types-enums.md`.
- `job-matching`: Internal matching engine invoked synchronously on `POST /jobs/:id/confirm`. Queries vetted, active handymen, scores by proximity (Haversine / Maps Distance Matrix), assigns the nearest, updates `Job.handymanId`, emits `job:matched` and `job:available` WebSocket events per `docs/websocket-contract.md`.
- `pricing`: Internal pricing engine invoked on `POST /jobs`. Computes `laborCost` from `JobCategory.basePrice`, `materialCost` from Materials stub, `transportCost` from Maps distance to nearest handyman. Returns itemized estimate per `docs/api-contract.md §2.4` response shape.
- `real-time-events`: Socket.io gateway with `/jobs` and `/chat` namespaces. JWT handshake auth (`?token=<JWT>`). Emits all server-to-client events defined in `docs/websocket-contract.md`: `job:matched`, `job:available`, `job:status_update`, `job:completed`, `handyman:location`, `chat:message`. Receives `chat:send` from clients.
- `chat`: Message persistence (REST) and real-time relay (WebSocket). Covers `GET /chat/:jobId/messages` and `POST /chat/:jobId/messages` per `docs/api-contract.md §2.5`. LLM service interface stubbed — provider (OpenAI / Claude) wired in a follow-up change.
- `payments`: Stripe integration — payment intent creation, confirmation, and webhook handling (`payment_intent.succeeded`, `payment_intent.payment_failed`). Implements `docs/api-contract.md §2.6`. Enums: `PaymentStatus` from `docs/types-enums.md`. On success: updates `Job.finalPrice`, triggers warranty creation.
- `warranty`: Warranty auto-generation on `Job.status → COMPLETED` (30-day default period). Claim filing and status retrieval. Implements `docs/api-contract.md §2.7`. Enums: `WarrantyStatus`, `ClaimStatus` from `docs/types-enums.md`.
- `handyman-profile`: HandymanProfile CRUD, live location polling endpoint (`PATCH /handymen/:id/location`), and admin vetting workflow (`PATCH /admin/handymen/:id/vet`). Location updates forwarded to WebSocket gateway for `handyman:location` broadcast.
- `admin`: Admin-only endpoints: `GET /admin/jobs`, `GET /admin/handymen`, `PATCH /admin/handymen/:id/vet`, `GET /admin/dashboard`. Protected by ADMIN RBAC guard.

### Modified Capabilities

_(none — this is a greenfield backend)_

## Impact

- **ORM Decision**: Prisma is recommended over TypeORM for its type-safe client and migration tooling — confirm before `design.md` is written.
- **Hosting**: Unresolved — blocks infrastructure tasks. Does not block API implementation tasks.
- **External vendors pending**: Materials API vendor, Transportation API vendor, LLM provider, and FCM push provider are TBD. All four will be stubbed behind service interfaces so the MVP ships without them.
- **Shared types**: All enums (`UserRole`, `JobStatus`, `PaymentStatus`, `WarrantyStatus`, `ClaimStatus`) must be sourced from `docs/types-enums.md` — no divergence permitted.
- **Frontend dependency**: Frontend integration is blocked on this backend being deployed. The WebSocket contract (`docs/websocket-contract.md`) and REST contract (`docs/api-contract.md`) are the interface between the two.
- **New dependencies**: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `prisma`, `@prisma/client`, `socket.io`, `stripe`, `@nestjs/throttler`, `class-validator`, `class-transformer`, `@nestjs/config`.
