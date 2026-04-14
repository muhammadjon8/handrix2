## Context

The Handrix backend MVP (NestJS REST + WebSocket) is complete. It exposes all endpoints defined in `docs/api-contract.md` and emits all events in `docs/websocket-contract.md`. The frontend is a greenfield React application that acts purely as a consumer — no backend changes are required. Target users are on mobile browsers, so the UX is optimised for small screens and touch, with desktop as a secondary target.

## Goals / Non-Goals

**Goals:**
- Ship a working, mobile-first web UI for all three roles: Client, Handyman, Admin
- Deliver the full client booking loop end-to-end: category → location → price → confirm → track → pay → warranty
- Real-time updates via WebSocket for tracking, chat, and job status
- WCAG 2.1 AA accessibility baseline on all pages
- Job confirmed by a client in ≤ 60 seconds of interaction

**Non-Goals:**
- Native mobile apps (iOS / Android)
- Push notifications via Firebase FCM (flagged TBD — deferred post-MVP)
- LLM chat assist UI (placeholder reserved; not wired in MVP)
- Admin CRUD beyond vetting handymen and viewing jobs
- Offline support / PWA service worker

## Decisions

### 1. React + Vite (not Next.js)
**Decision**: Use Vite + React 18 SPA, not Next.js.
**Rationale**: No SEO requirement (the app is behind auth); the backend owns all data; SSR adds complexity with no payoff for a handyman dispatch tool. Vite gives fast dev HMR, small bundles, and zero server to manage.
**Alternative considered**: Next.js App Router — rejected because SSR/RSC are not needed and add operational cost (Node server).

### 2. Tailwind CSS (not component library)
**Decision**: Tailwind CSS utility classes; no UI library (e.g., MUI, Chakra).
**Rationale**: The UI is custom and mobile-first. A component library would fight against the design (map-heavy, job-status-stepper, bottom-tab-nav) and bloat the bundle. Tailwind gives full control with minimal overhead.
**Alternative considered**: shadcn/ui — viable, keep in mind for admin tables if needed.

### 3. Zustand for global state (not Redux)
**Decision**: Zustand with slices for `auth`, `activeJob`, `chat`, `notifications`.
**Rationale**: Redux is heavyweight for a focused domain app. Zustand is lightweight, TypeScript-friendly, and avoids boilerplate. TanStack Query handles all server state (caching, loading, invalidation) — Zustand is only for client-side state that must persist across route changes.
**Alternative considered**: React Context + useReducer — viable for small slices, but Zustand is better as slice count grows.

### 4. TanStack Query for server state
**Decision**: All REST API calls go through TanStack Query hooks (`useQuery`, `useMutation`).
**Rationale**: Provides caching, background refetch, loading/error states, and invalidation for free. Avoids hand-rolled fetch state machines in every component.

### 5. Token storage: secure localStorage (for now, decision flagged)
**Decision**: Store JWT in `localStorage` with in-memory access token fallback for tab isolation. Open question — see below.
**Rationale**: httpOnly cookies require CORS + backend cookie config changes. Since the backend uses Bearer token auth, localStorage is the simpler path for MVP. This is flagged as a security open question to resolve before production hardening.

### 6. WebSocket connection lifecycle
**Decision**: Open a single Socket.io connection per session on login; close on logout. Reconnect automatically via Socket.io built-in reconnection.
**Rationale**: All real-time features (tracking, chat, job status) share one connection. Namespaces (`/jobs`, `/chat`) map to backend gateways per `docs/websocket-contract.md`.

### 7. OpenStreetMap + Leaflet (not Google Maps)
**Decision**: Use `leaflet` + `react-leaflet` for all map views. Use the Nominatim OSM geocoding API for address search. Use OpenStreetMap tile layers (free, no API key).
**Rationale**: Google Maps JS API requires a billing-enabled account and charges per map load and autocomplete request — unacceptable for an MVP with no revenue. OpenStreetMap/Nominatim is completely free, open-source, and requires no API key. `react-leaflet` is the standard React wrapper for Leaflet and is production-grade. Backend transport cost is calculated server-side with the Haversine formula (no external routing API needed).
**Alternative considered**: Google Maps — rejected due to cost. Mapbox — has a free tier but still requires an account and has usage limits.

### 8. Stripe Elements: `@stripe/react-stripe-js`
**Decision**: Use `@stripe/react-stripe-js` with `CardElement` for payment capture.
**Rationale**: PCI-compliant card tokenisation without handling raw card data. Integrates with the `clientSecret` returned by `POST /v1/payments/intent`.

### 9. Folder structure
```
frontend/src/
  components/    # Shared reusable UI (TopNav, BottomNav, ChatWindow, etc.)
  pages/
    client/      # Booking, tracking, chat, payment, warranty, history
    handyman/    # Job board, active job
    admin/       # Dashboard, job table, handyman table
  hooks/         # useWebSocket, useActiveJob, useAuth, etc.
  store/         # Zustand slices
  services/      # Axios instance + per-resource API functions
  utils/         # Formatters, date helpers, Haversine (if needed)
  types/         # Re-export from shared/types/ + local page types
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Token stored in localStorage is accessible to JS (XSS risk) | Enforce strict CSP; move to httpOnly cookie before production hardening |
| Nominatim rate limit (1 req/s) hit under load | Add debounce (300 ms) on address search input; cache results in-memory; evaluate self-hosted Photon before scaling |
| WebSocket disconnect during active job | Socket.io auto-reconnect; show "reconnecting…" toast; re-fetch job state on reconnect |
| Stripe `clientSecret` leaks expose payment intent | Secret is per-payment, single-use; scope leakage risk is low; enforce HTTPS |
| LLM chat placeholder creates confusion if not shipped | UI shows no AI section in MVP; feature-flag the section for future toggle |

## Open Questions

1. **Token storage**: httpOnly cookie vs. secure localStorage — requires backend to add `/auth/session` cookie endpoint. Decision needed before production. Recommend resolving in hardening sprint.
2. **LLM chat UI**: The user detail says "TBD". For MVP, the AI message area will be hidden (no placeholder shown). Open question: when/whether to wire `GeminiLLMService` responses into the chat bubble UI.
3. **Receipt delivery**: Downloadable PDF vs. email receipt. The backend `POST /v1/payments/confirm` returns a receipt object — MVP will render it on-screen only; PDF/email deferred.
4. **Push notifications**: Firebase FCM listed as TBD. Out of scope for MVP; browser Notification API is a possible lightweight alternative if needed before FCM.
5. **Shared types**: Should `shared/types/` be an npm workspace package or just a `tsconfig paths` alias? Decide before scaffolding to avoid refactor.
