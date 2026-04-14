Handrix – API Contract + User Flow Spec
Version: 0.1 (MVP)
Purpose: Single source of truth for FE↔BE communication. Both the Frontend and Backend specs reference this document.

PART 1 — USER FLOWS
Flow 1: Client Journey
1. CLIENT OPENS APP
   └─► If not logged in → Login Screen
       If logged in    → Home Screen (Dashboard)

2. HOME SCREEN
   └─► Shows:
       - List of latest job requests (status pills: Pending / Matched / En Route / In Progress / Completed)
       - "Add Request" button (prominent, top or floating)

3. ADD REQUEST FLOW
   Step 1 – Pick job category (icon tiles)
   Step 2 – Optional: add description (text field, 300 chars)
   Step 3 – Confirm location (auto-detect or search)
            └─► POST /jobs → returns price estimate
   Step 4 – Review upfront price breakdown
            └─► "Confirm & Book" → POST /jobs/:id/confirm
   Step 5 – Booking confirmed screen
            └─► Shows: handyman name, ETA, "Track" button

4. LIVE TRACKING SCREEN
   └─► Map with handyman pin (WebSocket: handyman:location)
       Status bar updates in real time (WebSocket: job:status_update)
       Chat button → opens Chat Screen

5. JOB COMPLETED
   └─► WebSocket: job:completed fires
       └─► Auto-navigate to Payment Screen
           └─► Client pays → POST /payments/confirm
               └─► Success screen + receipt
                   └─► Warranty record visible in My Jobs

Flow 2: Handyman Journey
1. HANDYMAN OPENS APP
   └─► If not logged in → Login Screen
       If logged in    → Job Board Screen

2. JOB BOARD SCREEN
   └─► Shows available job requests near handyman location
       Each card: job type, distance, payout estimate, ETA required
       Real-time new jobs via WebSocket: job:available
       Actions: "Accept" | "Decline"

3. ACCEPT JOB
   └─► PATCH /jobs/:id/status { status: EN_ROUTE }
       └─► Client notified via WebSocket: job:status_update
           └─► Handyman sees: Active Job Screen

4. ACTIVE JOB SCREEN
   └─► Job details: type, address, materials needed
       Navigation CTA → opens Maps app with address
       Status controls:
         "Mark Arrived"      → PATCH /jobs/:id/status { status: ARRIVED }
         "Start Job"         → PATCH /jobs/:id/status { status: IN_PROGRESS }
         "Complete Job"      → PATCH /jobs/:id/status { status: COMPLETED }
       Chat button → opens Chat Screen
       └─► Each status change emits WebSocket to client

5. JOB HISTORY & EARNINGS
   └─► GET /handymen/:id/jobs
       Shows: completed jobs, payout per job, total earned

Flow 3: Real-Time Sync Between Client & Handyman
HANDYMAN action          →    WebSocket event         →    CLIENT sees
─────────────────────────────────────────────────────────────────────
Accepts job              →    job:matched             →    Handyman assigned + ETA shown
GPS updates (interval)   →    handyman:location       →    Pin moves on map
Marks Arrived            →    job:status_update       →    Status bar → "Arrived"
Marks In Progress        →    job:status_update       →    Status bar → "In Progress"
Marks Completed          →    job:completed           →    Payment screen triggered
Sends chat message       →    chat:message            →    Message appears in chat

Flow 4: Admin Journey
1. ADMIN LOGS IN → Admin Dashboard
   └─► Stats: active jobs, available handymen, revenue today

2. JOBS PANEL
   └─► GET /admin/jobs (filterable by status, date, handyman)
       Tap job → full detail view

3. HANDYMAN MANAGEMENT
   └─► GET /admin/handymen
       Pending vetting → "Approve" / "Reject" → PATCH /admin/handymen/:id/vet

4. WARRANTY CLAIMS
   └─► View open claims, mark as resolved