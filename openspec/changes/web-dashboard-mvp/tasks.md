## 1. Project Scaffolding

- [x] 1.1 Scaffold `frontend/` with Vite + React 18 + TypeScript template (`npm create vite@latest frontend -- --template react-ts`)
- [x] 1.2 Install dependencies: `tailwindcss`, `postcss`, `autoprefixer` — configure Tailwind with `npx tailwindcss init -p`
- [x] 1.3 Install Zustand, TanStack Query (`@tanstack/react-query`), React Router v6, and Axios
- [x] 1.4 Install `leaflet`, `react-leaflet`, `@types/leaflet`, `@stripe/react-stripe-js`, `@stripe/stripe-js`, `socket.io-client`
- [x] 1.5 Create `frontend/src/` folder structure: `components/`, `pages/client/`, `pages/handyman/`, `pages/admin/`, `hooks/`, `store/`, `services/`, `utils/`, `types/`
- [x] 1.6 Configure Axios instance in `services/api.ts` with `baseURL=/v1`, request interceptor to attach `Authorization: Bearer <token>`, and response interceptor for silent token refresh per `specs/web-auth`
- [x] 1.7 Resolve open question: shared types path alias — configure `tsconfig.json` paths alias `@types/*` pointing to `shared/types/` if it exists, otherwise import from `../types/`
- [x] 1.8 Set up React Router with a root `App.tsx` that defines all routes and renders `<ProtectedRoute>` wrappers per `specs/web-auth`

## 2. Zustand State Store

- [x] 2.1 Create `store/authSlice.ts` — state: `{ user, accessToken, refreshToken, isAuthenticated }`, actions: `setTokens`, `clearAuth`
- [x] 2.2 Create `store/activeJobSlice.ts` — state: `{ jobId, status, eta, handymanLocation }`, actions: `setActiveJob`, `updateStatus`, `updateHandymanLocation`
- [x] 2.3 Create `store/chatSlice.ts` — state: `{ messages: ChatMessage[] }`, actions: `appendMessage`, `clearMessages`
- [x] 2.4 Create `store/notificationsSlice.ts` — state: `{ toasts: Toast[] }`, actions: `addToast`, `removeToast`
- [x] 2.5 Wire all slices into a single Zustand store in `store/index.ts`

## 3. Shared UI Components

- [x] 3.1 Build `TopNav` — app logo, right-side user menu (avatar + logout) with hamburger on mobile
- [x] 3.2 Build `BottomNavMobile` — client tabs: Home, My Jobs, Chat, Profile; conditionally rendered only for CLIENT role on mobile
- [x] 3.3 Build `JobStatusBar` — horizontal stepper: Matched → En Route → Arrived → In Progress → Completed; accepts `currentStatus` prop
- [x] 3.4 Build `MapEmbed` — wraps `react-leaflet` `MapContainer` + `TileLayer` (OpenStreetMap tiles) with configurable center, zoom, and array of `{ lat, lng, label }` `Marker` components; import Leaflet CSS in component
- [x] 3.5 Build `ChatWindow` — scrollable message list with bubble layout (right = self, left = other); accepts `messages` prop and `onSend` callback
- [x] 3.6 Build `PriceBreakdown` — itemised card showing labor, materials, transport, total; accepts pricing object prop
- [x] 3.7 Build `Toast` / `SnackbarProvider` — global toast system driven by `notificationsSlice`; auto-dismiss after 4 seconds
- [x] 3.8 Build `LoadingSpinner` — full-screen overlay variant and inline variant
- [x] 3.9 Build `ConfirmModal` — reusable confirm/cancel modal with title, body, and two action buttons
- [x] 3.10 Build `ProtectedRoute` — HOC that checks `isAuthenticated` and role; redirects per `specs/web-auth` rules

## 4. API Service Layer

- [x] 4.1 Create `services/auth.ts` — `register()`, `login()`, `refresh()`, `logout()` mapping to `docs/api-contract.md §2.3`
- [x] 4.2 Create `services/jobs.ts` — `createJob()`, `confirmJob()`, `getJob()`, `updateJobStatus()`, `getClientJobs()`, `getHandymanJobs()` per `docs/api-contract.md §2.4`
- [x] 4.3 Create `services/chat.ts` — `getMessages()`, `sendMessage()` per `docs/api-contract.md §2.5`
- [x] 4.4 Create `services/payments.ts` — `createIntent()`, `confirmPayment()` per `docs/api-contract.md §2.6`
- [x] 4.5 Create `services/warranties.ts` — `getWarranty()`, `fileClaim()` per `docs/api-contract.md §2.7`
- [x] 4.6 Create `services/categories.ts` — `getCategories()` per `docs/api-contract.md §2.8`
- [x] 4.7 Create `services/handymen.ts` — `updateLocation()`, `toggleActive()` per `docs/api-contract.md`
- [x] 4.8 Create `services/admin.ts` — `getAdminJobs()`, `getHandymen()`, `vetHandyman()`, `getDashboard()` per `docs/api-contract.md §4.7`

## 5. WebSocket Hook

- [x] 5.1 Create `hooks/useWebSocket.ts` — initialises Socket.io client on `/jobs` and `/chat` namespaces with `?token=<accessToken>` on handshake per `docs/websocket-contract.md`
- [x] 5.2 Subscribe to `job:matched` → update `activeJobSlice.status` to MATCHED
- [x] 5.3 Subscribe to `job:available` → prepend to handyman job board list (invalidate TanStack Query cache)
- [x] 5.4 Subscribe to `job:status_update` → call `activeJobSlice.updateStatus()`
- [x] 5.5 Subscribe to `handyman:location` → call `activeJobSlice.updateHandymanLocation()` with `{ lat, lng }`
- [x] 5.6 Subscribe to `chat:message` → call `chatSlice.appendMessage()`; show toast if chat screen is not active
- [x] 5.7 Subscribe to `job:completed` → add toast and navigate to payment screen
- [x] 5.8 Handle disconnect: show "Reconnecting…" toast; on reconnect, refetch active job state via TanStack Query

## 6. Authentication Pages (per `specs/web-auth`)

- [x] 6.1 Build `/login` page — email + password form, calls `auth.login()`, stores tokens in Zustand + localStorage, redirects by role
- [x] 6.2 Build `/register` page — name, email, phone, password, role selector; calls `auth.register()`; inline validation errors; redirects on success
- [x] 6.3 Implement Axios response interceptor for silent token refresh: on 401, call `auth.refresh()`, update store, retry request; on refresh 401 clear auth and redirect to `/login` per `specs/web-auth`
- [x] 6.4 Implement `ProtectedRoute` role guard: redirect unauthenticated → `/login`; redirect role-mismatch → role home per `specs/web-auth`

## 7. Client — Booking Flow (per `specs/client-booking`)

- [x] 7.1 Build Step 1 `/client/book/category` — fetch categories with `useQuery(getCategories)`, render as icon tiles, advance on tap
- [x] 7.2 Build Step 2 `/client/book/location` — "Use my location" button (browser Geolocation API) + debounced address search input (300 ms) that queries Nominatim `https://nominatim.openstreetmap.org/search?format=json&q=<term>` with `User-Agent` header set; render suggestions as dropdown; on select, update lat/lng and show pin on `<MapEmbed>`; optional description textarea (max 300 chars)
- [x] 7.3 Build Step 3 `/client/book/estimate` — call `jobs.createJob()` with form data, render `<PriceBreakdown>` with returned pricing, "Confirm & Book" and "Cancel" buttons
- [x] 7.4 Build Step 4 `/client/book/confirmed` — call `jobs.confirmJob()`, display job reference, handyman name/photo, ETA; handle 422 with retry CTA
- [x] 7.5 Verify booking happy-path completes in ≤ 5 taps from category to confirmation screen

## 8. Client — Job Tracking (per `specs/client-tracking`)

- [x] 8.1 Build `/client/jobs/:id/track` — render `<MapEmbed>` with job location pin and handyman location pin; initialise handyman pin from `GET /v1/jobs/:id`
- [x] 8.2 Wire `handyman:location` WebSocket event to update handyman pin via `activeJobSlice.updateHandymanLocation()`
- [x] 8.3 Render `<JobStatusBar>` below the map; wire to `activeJobSlice.status`; update on `job:status_update` events
- [x] 8.4 Render ETA countdown (minutes); display "Arriving soon" when countdown reaches zero
- [x] 8.5 Add "Chat" quick-access FAB button that navigates to `/client/jobs/:id/chat`
- [x] 8.6 On `job:completed` event: show "Job Complete!" banner, navigate to `/client/jobs/:id/payment` after 2-second delay

## 9. Client — In-App Chat (per `specs/client-chat`)

- [x] 9.1 Build `/client/jobs/:id/chat` — on mount fetch `chat.getMessages(jobId)`, render in `<ChatWindow>` (oldest first, scroll to bottom)
- [x] 9.2 Wire `sendMessage` callback: optimistically append message (right bubble), call `chat.sendMessage()`; mark failed with retry button on error
- [x] 9.3 Subscribe to `chat:message` WebSocket event and append incoming messages (left bubble) in real time
- [x] 9.4 Add attachment button for optional photo URL input (no binary upload in MVP)
- [x] 9.5 Show toast notification for new messages when chat is not the active view (driven by `notificationsSlice`)
- [x] 9.6 Confirm no AI message UI is rendered anywhere in the chat component in MVP

## 10. Client — Payment (per `specs/client-payment`)

- [x] 10.1 Build `/client/jobs/:id/payment` — show `<PriceBreakdown>` from job record; if `finalPrice ≠ estimate`, render explanation banner
- [x] 10.2 Render Stripe `<CardElement>` wrapped in `<Elements>` provider (load Stripe.js with publishable key from env)
- [x] 10.3 On "Pay Now": call `payments.createIntent(jobId)` → `stripe.confirmCardPayment(clientSecret)` → `payments.confirmPayment(jobId, paymentIntentId)`
- [x] 10.4 Handle Stripe card decline: display Stripe error message inline below card element
- [x] 10.5 On success navigate to `/client/jobs/:id/receipt`
- [x] 10.6 Build receipt screen — itemised cost, handyman name, date, total paid, "Done" button back to job history; no PDF/email in MVP

## 11. Client — Warranty (per `specs/client-warranty`)

- [x] 11.1 Build `/client/jobs/:id/warranty` — fetch `warranties.getWarranty(jobId)`; display status, expiry date, job details, handyman info
- [x] 11.2 Show "File a Claim" button only when warranty status is ACTIVE and expiry is in the future
- [x] 11.3 Build claim form: description textarea (required) + optional photo URL input; on submit call `warranties.fileClaim()`
- [x] 11.4 Show success toast on claim submission; update warranty status to CLAIMED in UI
- [x] 11.5 Handle 404 from warranty endpoint with "Warranty not yet available" message
- [x] 11.6 Hide claim button and show "Warranty period has ended" when warranty is EXPIRED

## 12. Client — Job History (per `specs/client-job-history`)

- [x] 12.1 Build `/client/jobs` — fetch `jobs.getClientJobs(userId)` with TanStack Query; render paginated list sorted by date descending
- [x] 12.2 Each list item: category name, date, status badge (colour-coded), price, warranty shield icon if active warranty
- [x] 12.3 Implement status filter (segmented control): passes `?status=<value>` to API on change
- [x] 12.4 Implement "Load more" / infinite scroll for pagination
- [x] 12.5 Build job detail view `/client/jobs/:id` — render full job info from `jobs.getJob(jobId)`; show "Track Handyman" link for active statuses, warranty link for COMPLETED
- [x] 12.6 Client home `/client/home` — show active job card (if any) and shortcut to start a new booking

## 13. Handyman Portal (per `specs/handyman-portal`)

- [x] 13.1 Build `/handyman/jobs` — fetch `jobs.getHandymanJobs()` with `?status=MATCHED`; render job cards (type, description snippet, address, payout, ETA)
- [x] 13.2 Wire `job:available` WebSocket event to prepend new job cards to the board
- [x] 13.3 Implement "Accept" button: call `jobs.confirmJob(id)`, navigate to `/handyman/jobs/:id`
- [x] 13.4 Build `/handyman/jobs/:id` (active job view) — render type, client description, full address, materials list from job category
- [x] 13.5 Add "Navigate" link that opens `https://www.openstreetmap.org/directions?to=<lat>,<lng>` in a new tab (free, no API key); falls back to `geo:<lat>,<lng>` URI on mobile for native maps app
- [x] 13.6 Render status action buttons (only valid next-state button shown): "Mark as Arrived", "Start Job", "Complete Job"; each calls `jobs.updateJobStatus(id, status)` per `docs/api-contract.md §2.4`
- [x] 13.7 Add availability toggle in header; calls `handymen.toggleActive(id, isActive)`; shows "You are offline" state on job board when off
- [x] 13.8 Implement `navigator.geolocation.watchPosition` on active job page; call `handymen.updateLocation(id, lat, lng)` at ≤ 10 second intervals per `specs/handyman-portal`
- [x] 13.9 Handyman home `/handyman/home` — redirect to job board

## 14. Admin Portal (per `specs/admin-portal`)

- [x] 14.1 Build `/admin/dashboard` — fetch `admin.getDashboard()`; render three stat cards: Active Jobs, Available Handymen, Revenue Today; auto-refresh every 60 seconds
- [x] 14.2 Build jobs table — fetch `admin.getAdminJobs()` with pagination; columns: client name, job type, handyman assigned, status badge, ETA
- [x] 14.3 Add status filter dropdown for jobs table; passes `?status=<value>` to API
- [x] 14.4 Add client-side search input that filters visible rows by client name or job type substring
- [x] 14.5 Build handymen table — fetch `admin.getHandymen()`; columns: name, status badge, rating, Approve/Reject actions for unvetted entries
- [x] 14.6 "Approve" calls `admin.vetHandyman(id, true)`; "Reject" calls `admin.vetHandyman(id, false)`; show success toast and update row on response
- [ ] 14.7 Add handyman profile side panel / modal: opens on row click, shows full profile detail
- [x] 14.8 Guard all `/admin/*` routes with `ProtectedRoute` — redirect non-ADMIN roles per `specs/admin-portal`

## 15. Accessibility & Polish

- [x] 15.1 Audit all interactive elements for keyboard navigability (Tab order, focus rings) — WCAG 2.1 AA target per proposal
- [x] 15.2 Add `aria-label` and `role` attributes to custom components: `JobStatusBar`, `MapEmbed` container, `ChatWindow` send button
- [x] 15.3 Ensure all form inputs have associated `<label>` elements and error messages use `aria-describedby`
- [x] 15.4 Verify colour contrast ratios for status badges, buttons, and toast text meet WCAG AA (4.5:1 for normal text)
- [x] 15.5 Add `<LoadingSpinner>` on all async screens; ensure no content flash on initial load
- [x] 15.6 Test all key flows on a 375px-wide mobile viewport (iPhone SE breakpoint)

## 16. Environment & Deployment Config

- [x] 16.1 Create `frontend/.env.example` with: `VITE_API_BASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_WS_URL` — no map API key needed (OpenStreetMap is keyless)
- [x] 16.2 Add `frontend/` build script to monorepo root `package.json` (if using workspaces)
- [x] 16.3 Resolve design.md open question on shared types: npm workspace package vs. tsconfig paths alias — document decision in `design.md`
- [x] 16.4 Resolve design.md open question on token storage: confirm localStorage for MVP, document httpOnly cookie plan for hardening sprint
