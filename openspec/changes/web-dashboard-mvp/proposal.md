## Why

The Handrix backend MVP is complete and live. Without a frontend, the platform has no user-facing surface — clients cannot book jobs, handymen cannot accept work, and admins cannot operate the platform. The web dashboard is the MVP delivery vehicle for all three user roles, targeting mobile browsers first via React + Tailwind CSS.

## What Changes

- **New**: React + Vite + TypeScript web application under `frontend/`
- **New**: Multi-step client booking flow (category → location → price → confirmation) — goal: job confirmed in under 60 seconds
- **New**: Real-time job tracking screen with Google Maps embed and live handyman location pin (WebSocket)
- **New**: In-app chat UI with real-time messaging (WebSocket); LLM-assist display layer flagged for future decision
- **New**: Stripe Elements payment screen triggered automatically on job completion
- **New**: Warranty detail view and claim filing form
- **New**: Client job history list with status and warranty badge
- **New**: Handyman job board (incoming requests) and active job controls (status updates, chat, navigation)
- **New**: Admin dashboard with platform stats, job table, and handyman vetting table
- **New**: Shared component library: TopNav, BottomNavMobile, JobStatusBar, MapEmbed, ChatWindow, PriceBreakdown, Toast, LoadingSpinner, ConfirmModal

This is a **frontend-only** change. No backend API endpoints, types, or enums are added or modified — all existing specs remain unchanged.

## Capabilities

### New Capabilities

- `web-auth`: Login, registration, and role-based redirect. httpOnly cookie vs. secure localStorage decision flagged as open question. WCAG 2.1 AA required.
- `client-booking`: Four-step booking flow (service category → location + map preview → price breakdown → confirmation screen). Must complete in ≤ 60 seconds of user interaction.
- `client-tracking`: Full-screen map view with real-time handyman location pin, ETA countdown, job status bar, and quick-access chat button. Driven by `handyman:location` and `job:status_update` WebSocket events.
- `client-chat`: Real-time chat bubble UI (client right, handyman left). Optional photo attachment. AI assist layer is TBD — placeholder space reserved, not implemented in MVP.
- `client-payment`: Stripe Elements card input screen triggered on `job:completed` event. Shows final price breakdown and downloadable receipt.
- `client-warranty`: Warranty detail page (period, handyman info). "File a Claim" form (description + optional photo). Accessible from job history.
- `client-job-history`: Paginated list of past and active jobs with status badge, price, and warranty indicator. Tap to view job detail.
- `handyman-portal`: Job board (incoming requests with payout + ETA), active job view (status controls, chat, Maps navigation link).
- `admin-portal`: Stats header (active jobs, available handymen, revenue today), active jobs table, handyman management table with vetting controls. Filtering and search on all tables.

### Modified Capabilities

_(none — this change is additive frontend only; all existing backend specs remain authoritative and unchanged)_

## Impact

- **New app**: `frontend/` directory (React 18, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query)
- **API consumed**: All endpoints from `docs/api-contract.md` (auth, jobs, chat, payments, warranties, job-categories, handymen, admin)
- **WebSocket events consumed**: `job:matched`, `job:available`, `job:status_update`, `handyman:location`, `chat:message`, `job:completed` per `docs/websocket-contract.md`
- **External integrations**: OpenStreetMap tiles + Nominatim geocoding (`react-leaflet` + `leaflet` — free, no API key), Stripe Elements (`@stripe/react-stripe-js`), Firebase FCM (TBD — push notifications not in MVP scope)
- **Shared types**: `shared/types/` enums and types per `docs/types-enums.md`
- **Docs referenced**: `docs/api-contract.md`, `docs/websocket-contract.md`, `docs/user-flow.md`, `docs/types-enums.md`
