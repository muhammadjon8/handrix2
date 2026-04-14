## ADDED Requirements

### Requirement: HandymanProfile created on registration
When a user registers with `role: HANDYMAN`, the system SHALL automatically create a linked `HandymanProfile` record with `isActive: false` and `isVetted: false` as defaults.

#### Scenario: Profile created on HANDYMAN registration
- **WHEN** `POST /auth/register` succeeds with `role: "HANDYMAN"`
- **THEN** a `HandymanProfile` record is created for the new user with `isActive: false` and `isVetted: false`

### Requirement: Handyman posts live GPS location
The system SHALL accept GPS coordinates from a handyman and broadcast them to the tracking client via WebSocket when `PATCH /handymen/:id/location` is called. Response MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful location update
- **WHEN** the authenticated HANDYMAN calls `PATCH /handymen/:id/location` with `{ lat: float, lng: float }`
- **THEN** the system returns HTTP 200 with `{ updated: true }`, updates `HandymanProfile.currentLat` and `currentLng`, and emits `handyman:location` to the job-scoped client room via `/jobs` WebSocket namespace

#### Scenario: Handyman updates another handyman's location
- **WHEN** a HANDYMAN JWT is used to call `PATCH /handymen/:otherId/location`
- **THEN** the system returns HTTP 403

#### Scenario: No active job for location update
- **WHEN** a HANDYMAN with no active job posts a location update
- **THEN** the system stores the coordinates but emits no WebSocket event (no client to notify)

### Requirement: Handyman availability toggle
The system SHALL allow a HANDYMAN to set themselves as active or inactive (available for jobs).

#### Scenario: Handyman sets active
- **WHEN** an authenticated HANDYMAN sets `isActive: true` on their profile
- **THEN** they become eligible to be selected by the matching engine

#### Scenario: Handyman sets inactive
- **WHEN** a HANDYMAN sets `isActive: false`
- **THEN** they are excluded from matching engine queries immediately

### Requirement: Vetting status blocks matching
Only handymen with `isVetted: true` SHALL be eligible for job matching. Unvetted handymen SHALL be excluded regardless of their `isActive` flag.

#### Scenario: Unvetted handyman excluded from matching
- **WHEN** the matching engine runs
- **THEN** handymen with `isVetted: false` are not included in the candidate set

#### Scenario: Vetted handyman eligible
- **WHEN** a handyman has `isVetted: true` AND `isActive: true`
- **THEN** they are included in the matching engine's candidate query
