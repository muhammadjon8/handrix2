## ADDED Requirements

### Requirement: Handyman sees incoming job requests on a job board
The system SHALL display a list of available job requests matched to the handyman's area and skills. Each item SHALL show: job type, client description (truncated), address, estimated payout, and required ETA. The list SHALL update in real time via the `job:available` WebSocket event on the `/jobs` namespace.

#### Scenario: Job board loads on login
- **WHEN** the handyman logs in and navigates to the job board
- **THEN** the system fetches `GET /v1/handymen/:id/jobs?status=MATCHED` and renders current matched jobs

#### Scenario: New job appears via WebSocket
- **WHEN** the `job:available` WebSocket event is received
- **THEN** the new job card is prepended to the job board list without a full page reload

#### Scenario: No jobs available
- **WHEN** the job board is empty
- **THEN** the system shows "No jobs available in your area right now" with a pull-to-refresh option

### Requirement: Handyman can accept a job
Each job card SHALL have an "Accept" action. Tapping it SHALL call `POST /v1/jobs/:id/confirm` (HANDYMAN perspective — triggers job assignment confirmation). On success the handyman is navigated to the active job view.

#### Scenario: Accept navigates to active job
- **WHEN** the handyman taps "Accept" on a job card
- **THEN** the system confirms the job and navigates to the active job view for that job

### Requirement: Handyman sees active job detail
The system SHALL display the active job's details: job type, client description, full address, and materials list (from job category). A navigation deep-link SHALL open the address in Google Maps or Waze.

#### Scenario: Active job detail renders
- **WHEN** the handyman opens an active job
- **THEN** the system fetches `GET /v1/jobs/:id` and shows type, description, address, and a "Navigate" link

#### Scenario: Navigate button opens maps app
- **WHEN** the handyman taps "Navigate"
- **THEN** the system opens a `maps://` or `https://maps.google.com` deep-link with the job address

### Requirement: Handyman can update job status
The system SHALL provide status action buttons on the active job view: "Mark as Arrived", "Start Job", "Complete Job" — visible only when the status transition is valid per the backend lifecycle (MATCHED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED). Each tap SHALL call `PATCH /v1/jobs/:id/status`.

#### Scenario: Status button calls API
- **WHEN** the handyman taps "Mark as Arrived"
- **THEN** the system calls `PATCH /v1/jobs/:id/status` with `{ status: "ARRIVED" }` and updates the UI on success

#### Scenario: Only valid next status is shown
- **WHEN** the job status is ARRIVED
- **THEN** only the "Start Job" button is shown; "Mark as Arrived" and "Complete Job" are hidden

### Requirement: Handyman can toggle availability
The system SHALL provide an availability toggle (on/off) that calls `PATCH /v1/handymen/:id/active`. When off, the handyman does not receive new `job:available` events.

#### Scenario: Toggle to offline
- **WHEN** the handyman sets availability to offline
- **THEN** the system calls `PATCH /v1/handymen/:id/active` with `{ isActive: false }` and the job board shows "You are offline"

### Requirement: Handyman location is reported in real time
The system SHALL use the browser Geolocation API `watchPosition` to track the handyman's location during an active job and emit updates via WebSocket or call a location update endpoint at a regular interval (≤ 10 seconds) so the client's tracking map stays current.

#### Scenario: Location sent during active job
- **WHEN** the handyman has an active job and location permission is granted
- **THEN** the system sends location updates at ≤ 10-second intervals via `PATCH /v1/handymen/:id/location`
