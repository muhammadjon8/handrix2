## ADDED Requirements

### Requirement: Find nearest available handyman
The matching engine SHALL query all `HandymanProfile` records where `isActive = true` AND `isVetted = true`, filter by skill tags matching the job's `JobCategory.skillTags`, and rank results by proximity to the job location using the Haversine formula.

#### Scenario: Nearest vetted available handyman assigned
- **WHEN** matching is triggered for a job
- **THEN** the handyman with the smallest great-circle distance to the job location who has at least one overlapping skill tag is selected

#### Scenario: No matching skill
- **WHEN** no active, vetted handyman has a skill tag matching the job category
- **THEN** matching returns a "no handyman available" result and the job remains in PENDING status

#### Scenario: Tie-breaking by distance
- **WHEN** multiple handymen have equal skill match
- **THEN** the one with the smallest Haversine distance is selected

### Requirement: Assign handyman to job
After selecting a handyman, the matching engine SHALL atomically update `Job.handymanId` and `Job.status` to `MATCHED`, and compute an ETA.

#### Scenario: Successful assignment
- **WHEN** a handyman is selected
- **THEN** `Job.handymanId` is set, `Job.status` becomes `MATCHED`, `Job.eta` is computed (estimated travel time + current time), and the changes are persisted in a single transaction

#### Scenario: Handyman becomes unavailable between selection and assignment (race)
- **WHEN** the selected handyman's `isActive` is set to false between query and write
- **THEN** the engine retries with the next nearest handyman; if none available, returns a failure result

### Requirement: Notify both parties after matching
After a successful assignment, the matching engine SHALL emit WebSocket events to both the client and the handyman per `docs/websocket-contract.md`.

#### Scenario: Client receives job:matched event
- **WHEN** a handyman is assigned to a job
- **THEN** the `/jobs` namespace emits `job:matched` to the client's socket with `{ jobId, handymanName, handymanAvatar, eta }`

#### Scenario: Handyman receives job:available event
- **WHEN** a handyman is assigned to a job
- **THEN** the `/jobs` namespace emits `job:available` to the handyman's socket with `{ jobId, categoryName, distanceKm, payoutEstimate, eta }`

### Requirement: Matching triggered only by job confirmation
The matching engine SHALL be invoked exclusively from `POST /jobs/:id/confirm` and never called directly by external HTTP clients.

#### Scenario: Matching not exposed as an endpoint
- **WHEN** any HTTP client attempts to call the matching engine directly
- **THEN** no such route exists (matching is an internal service method only)
