## ADDED Requirements

### Requirement: Client sees real-time handyman location on map
The system SHALL display an OpenStreetMap map (rendered via `react-leaflet`) with two markers: the job location and the handyman's current location. The handyman marker SHALL update in real time via the `handyman:location` WebSocket event defined in `docs/websocket-contract.md`. No API key is required — OpenStreetMap tile layers are free.

#### Scenario: Handyman location marker updates
- **WHEN** the `handyman:location` event is received on the `/jobs` namespace
- **THEN** the handyman map marker moves to the new `lat`/`lng` coordinates without a full page reload

#### Scenario: WebSocket disconnected during tracking
- **WHEN** the WebSocket connection drops
- **THEN** the system shows a "Reconnecting…" toast and attempts automatic reconnection; the last known marker position is retained

### Requirement: Client sees ETA countdown and job status bar
The system SHALL display an ETA countdown (minutes remaining) computed from the ETA timestamp in the job record. A horizontal `JobStatusBar` stepper SHALL show the current status: Matched → En Route → Arrived → In Progress → Completed. The bar SHALL update in real time via `job:status_update` events.

#### Scenario: Status bar advances on event
- **WHEN** the `job:status_update` WebSocket event is received with a new status
- **THEN** the `JobStatusBar` advances to the new step immediately

#### Scenario: ETA reaches zero
- **WHEN** the ETA countdown reaches zero and the job is not yet ARRIVED
- **THEN** the countdown displays "Arriving soon" instead of a negative number

### Requirement: Client can open chat from tracking screen
The system SHALL provide a persistent "Chat" quick-access button on the tracking screen that opens the in-app chat for the active job without leaving the tracking context (e.g., bottom sheet or navigation to chat page).

#### Scenario: Chat button navigates to chat
- **WHEN** the client taps the "Chat" button on the tracking screen
- **THEN** the system navigates to or opens the chat view for the active job

### Requirement: Tracking screen triggers payment flow on job completion
The system SHALL listen for the `job:completed` event. On receipt it SHALL display a modal or navigate to the payment screen automatically.

#### Scenario: Job completed event received
- **WHEN** the `job:completed` WebSocket event is received
- **THEN** the system shows a "Job Complete!" banner and after 2 seconds navigates to the payment screen for the job
