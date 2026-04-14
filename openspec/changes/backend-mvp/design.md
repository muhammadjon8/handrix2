## Context

Handrix is a greenfield on-demand handyman dispatch platform. There is no existing backend. The React frontend and future mobile clients depend entirely on this NestJS API being built to the contract defined in `docs/api-contract.md`, `docs/websocket-contract.md`, and `docs/types-enums.md`. The MVP must handle the full job lifecycle: auth → job creation + pricing → matching → real-time tracking → payment → warranty. All enums and field names are fixed by the shared docs — the backend has no latitude to deviate.

## Goals / Non-Goals

**Goals:**
- Implement every endpoint in `docs/api-contract.md` with exact request/response shapes
- Emit every WebSocket event in `docs/websocket-contract.md` from the correct triggers
- Use all enums from `docs/types-enums.md` verbatim — no redefinition
- Build external integrations (Maps, Stripe, LLM, Materials, Transport, FCM) behind internal service interfaces so vendors can be swapped without business logic changes
- Deliver a runnable, deployable NestJS app backed by PostgreSQL

**Non-Goals:**
- Mobile app or frontend implementation
- Selecting or integrating undecided vendors (Materials API, Transport API, LLM provider, FCM) beyond stubbing the service interface
- Hosting/infrastructure provisioning (unresolved blocker — separate concern)
- Admin UI (API only)
- Multi-currency support (USD only for MVP)
- Automated warranty claim resolution

## Decisions

### ORM: Prisma over TypeORM
Prisma generates a fully-typed client from the schema file, eliminating runtime query errors and providing a clear migration workflow (`prisma migrate dev`). TypeORM requires manual decorator maintenance and has looser type guarantees. **Decision: Prisma**.

### Real-time: Socket.io via NestJS Gateway over raw ws
NestJS has first-class `@nestjs/websockets` + `socket.io` adapter support. Socket.io adds automatic reconnection and namespace/room support needed for job-scoped rooms and chat rooms — both required by `docs/websocket-contract.md`. **Decision: Socket.io**.

### Matching proximity: Haversine formula (in-process) with Maps Distance Matrix as opt-in
Computing great-circle distance in-process (Haversine) is free, zero-latency, and sufficient for MVP where handymen and jobs are in the same metro. Maps Distance Matrix gives road-distance accuracy but costs per request and adds latency. **Decision: Haversine for MVP, Maps Distance Matrix as a configuration flag for post-MVP**.

### Auth: Passport.js `passport-jwt` strategy + NestJS Guards
Standard NestJS auth pattern. `JwtAuthGuard` applied globally; public routes (`/auth/*`) use `@Public()` decorator. RBAC implemented as a separate `RolesGuard` checking `req.user.role` against `@Roles(UserRole.ADMIN)` decorators. **Decision: passport-jwt + RolesGuard**.

### Job confirmation: synchronous matching on request
On `POST /jobs/:id/confirm`, matching runs synchronously within the request and returns the assigned handyman in the response body (per `docs/api-contract.md §2.4`). Background queue (BullMQ/Redis) is introduced post-MVP when matching latency becomes a concern. **Decision: synchronous for MVP**.

### Cache: Redis deferred
Redis is useful for session invalidation and job-matching state, but is not strictly required for the synchronous MVP. Introducing it now adds ops complexity without a hosting decision made. **Decision: defer Redis; revisit when async matching or session revocation is needed**.

### External service pattern: interface + stub + live implementation
Each external vendor (Maps, Stripe, LLM, Materials, Transport, FCM) is modelled as a NestJS provider implementing a TypeScript interface. The live implementation is injected via `ConfigModule` feature flag. Stubs return sensible defaults so the app boots and tests pass without live API keys. **Decision: interface + stub pattern for all external services**.

### Database connection pooling
Prisma uses its own connection pool. For MVP (single instance), default pool settings suffice. PgBouncer added when horizontal scaling begins.

## Risks / Trade-offs

- **Hosting unresolved** → Blocks deployment tasks. Mitigation: implement all app code; deploy tasks are gated behind hosting decision.
- **Synchronous matching adds latency on confirm** → Acceptable for MVP (<100ms for small handyman pools). Mitigation: add BullMQ queue post-MVP when pool grows.
- **Stub external services may mask integration bugs** → Mitigation: integration tests with real credentials run in CI against a staging environment before launch.
- **30-day warranty period hardcoded** → Business may change this. Mitigation: store as `ConfigService` value, not a literal.
- **LLM provider undecided** → Stubbed interface means zero churn when provider is selected. Risk: chat AI features will not be live in MVP.
- **Materials and Transport APIs unselected** → `materialCost` and `transportCost` in pricing will use stub values (e.g., flat estimates). Clients will see an itemized breakdown that is approximate until real vendors are wired.

## Open Questions

1. **ORM confirmed?** — Proposal recommends Prisma. Sign-off needed before schema is written.
2. **Warranty period** — 30 days assumed. What is the contractual warranty window?
3. **Stripe currency** — USD hardcoded per `docs/api-contract.md`. Is multi-currency needed at launch?
4. **Hosting platform** — Required to write infrastructure/deployment tasks.
5. **LLM provider** — OpenAI GPT-4o or Anthropic Claude? Needed to wire `LLMService` beyond the stub.
6. **Materials vendor** — Which parts/supplies API? Needed to implement real `materialCost`.
7. **Transport vendor** — Uber for Business or other? Needed for `TransportService`.
8. **Push notification provider** — FCM assumed. Confirm before `NotificationService` goes live.
9. **Admin dashboard stats** — `GET /admin/dashboard` shape not defined in `docs/api-contract.md`. Define fields before implementing.
