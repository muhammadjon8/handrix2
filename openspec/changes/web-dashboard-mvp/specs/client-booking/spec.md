## ADDED Requirements

### Requirement: Step 1 — Client selects a service category
The system SHALL display all job categories fetched from `GET /v1/job-categories` as icon-based tiles. Each tile SHALL show the category name and icon. Selecting a tile advances to Step 2.

#### Scenario: Categories load and are selectable
- **WHEN** the client opens the booking flow
- **THEN** the system fetches and renders all categories as tappable tiles within 2 seconds

#### Scenario: Category selected
- **WHEN** the client taps a category tile
- **THEN** the selected category is highlighted and the system advances to Step 2

### Requirement: Step 2 — Client provides job location
The system SHALL offer two location input methods: (a) browser Geolocation API auto-detect button, (b) a free-text address search field powered by the Nominatim OpenStreetMap geocoding API (no API key required). The selected location SHALL render a pin on an OpenStreetMap map preview (via Leaflet). An optional description field (max 300 chars) SHALL be available for extra detail.

#### Scenario: Auto-detect location
- **WHEN** the client taps "Use my location"
- **THEN** the browser requests geolocation permission, and on grant, populates lat/lng and shows a map pin at the detected location

#### Scenario: Manual location via Nominatim search
- **WHEN** the client types an address in the search field and selects a Nominatim suggestion
- **THEN** the system populates lat/lng from the Nominatim result and renders the pin on the Leaflet map preview

#### Scenario: Location not provided
- **WHEN** the client attempts to advance to Step 3 without a location
- **THEN** the system displays "Please provide a job location" and does not advance

### Requirement: Step 3 — Client reviews price estimate
The system SHALL call `POST /v1/jobs` with `categoryId`, `locationLat`, `locationLng`, `locationAddress`, and optional `description` when advancing from Step 2. It SHALL display the returned price breakdown: labor, materials, transport, and total. The client must tap "Confirm & Book" to proceed or "Cancel" to discard.

#### Scenario: Price estimate displayed
- **WHEN** the system receives the job creation response
- **THEN** the system displays labor, materials, transport, and total amounts in a PriceBreakdown card

#### Scenario: Client cancels on price screen
- **WHEN** the client taps "Cancel"
- **THEN** the system returns to Step 1 and the created job is discarded (client may re-book)

#### Scenario: API error during job creation
- **WHEN** `POST /v1/jobs` returns an error
- **THEN** the system displays a toast "Could not get a price estimate. Please try again." and stays on Step 2

### Requirement: Step 4 — Booking confirmed screen
After the client taps "Confirm & Book" the system SHALL call `POST /v1/jobs/:id/confirm`. On success it SHALL display a confirmation screen with: job reference number, handyman name and photo (if available), and estimated arrival time (ETA). A "Track your Handyman" button SHALL navigate to the job tracking screen.

#### Scenario: Booking confirmed with handyman assigned
- **WHEN** `POST /v1/jobs/:id/confirm` returns a matched handyman
- **THEN** the screen shows the job ID, handyman name, photo, and ETA

#### Scenario: No handyman available (422)
- **WHEN** `POST /v1/jobs/:id/confirm` returns HTTP 422
- **THEN** the system shows "No handymen available right now. Please try again shortly." with a retry button

### Requirement: Booking completes in under 60 seconds of user interaction
The system SHALL minimise clicks and pre-fill where possible. Auto-detect location MUST be the primary action. The price screen SHALL not require additional input. Total taps from category selection to confirmed booking SHALL be ≤ 5.

#### Scenario: Happy-path booking under 60 seconds
- **WHEN** the client uses auto-detected location and accepts the price
- **THEN** the booking flow from category selection to confirmation screen requires no more than 5 taps and completes in under 60 seconds of user time
