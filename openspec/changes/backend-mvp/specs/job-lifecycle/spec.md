## ADDED Requirements

### Requirement: Create job and return price estimate
The system SHALL create a `Job` record in `PENDING` status and return an itemized price estimate when `POST /jobs` is called. Response shape MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful job creation
- **WHEN** an authenticated CLIENT calls `POST /jobs` with valid `categoryId`, `locationLat`, `locationLng`, and `locationAddress`
- **THEN** the system returns HTTP 201 with `jobId`, `status: "PENDING"`, `priceEstimate` (laborCost, materialCost, transportCost, total, currency), and `estimatedDuration`

#### Scenario: Invalid category
- **WHEN** `POST /jobs` is called with a `categoryId` that does not exist
- **THEN** the system returns HTTP 404

#### Scenario: HANDYMAN attempts to create a job
- **WHEN** a HANDYMAN JWT is used to call `POST /jobs`
- **THEN** the system returns HTTP 403

### Requirement: Client confirms job and triggers matching
The system SHALL confirm a PENDING job and invoke the matching engine when `POST /jobs/:id/confirm` is called by the owning CLIENT. Response MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful confirmation with available handyman
- **WHEN** the owning CLIENT calls `POST /jobs/:id/confirm` on a PENDING job
- **THEN** the system assigns a handyman, updates `Job.status` to `MATCHED`, and returns HTTP 200 with `jobId`, `status: "MATCHED"`, `handyman` (id, name, avatarUrl, rating), and `eta`

#### Scenario: No available handyman
- **WHEN** `POST /jobs/:id/confirm` is called but no vetted, active handyman is available
- **THEN** the system returns HTTP 422 with a message indicating no handyman is available

#### Scenario: Confirming a non-PENDING job
- **WHEN** `POST /jobs/:id/confirm` is called on a job that is not in `PENDING` status
- **THEN** the system returns HTTP 409

#### Scenario: Wrong client confirms job
- **WHEN** a CLIENT calls `POST /jobs/:id/confirm` on a job they did not create
- **THEN** the system returns HTTP 403

### Requirement: Get job details
The system SHALL return full job details for `GET /jobs/:id`. Response MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful retrieval
- **WHEN** an authenticated user calls `GET /jobs/:id` for a job they are party to
- **THEN** the system returns HTTP 200 with all job fields including category, pricing breakdown, handyman, and ETA

#### Scenario: Job not found
- **WHEN** `GET /jobs/:id` is called with a non-existent ID
- **THEN** the system returns HTTP 404

### Requirement: Handyman updates job status
The system SHALL allow the assigned HANDYMAN to advance job status in the defined lifecycle order. Allowed transitions: `MATCHED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED`. Response MUST match `docs/api-contract.md §2.4`. Each transition SHALL emit a WebSocket event per `docs/websocket-contract.md`.

#### Scenario: Valid status transition
- **WHEN** the assigned HANDYMAN calls `PATCH /jobs/:id/status` with the next valid status
- **THEN** the system updates `Job.status`, returns HTTP 200 with `jobId`, `status`, `updatedAt`, and emits `job:status_update` to the client

#### Scenario: Invalid status transition (out of order)
- **WHEN** the HANDYMAN calls `PATCH /jobs/:id/status` with a status that skips steps (e.g., `MATCHED → IN_PROGRESS`)
- **THEN** the system returns HTTP 422

#### Scenario: COMPLETED transition triggers payment and warranty
- **WHEN** the HANDYMAN sets status to `COMPLETED`
- **THEN** the system emits `job:completed` WebSocket event, creates a `Warranty` record, and sets `Job.finalPrice`

#### Scenario: Unassigned handyman attempts status update
- **WHEN** a HANDYMAN who is not assigned to the job calls `PATCH /jobs/:id/status`
- **THEN** the system returns HTTP 403

### Requirement: Client job history
The system SHALL return paginated job history for a client via `GET /clients/:id/jobs`. Response MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful history retrieval
- **WHEN** an authenticated CLIENT calls `GET /clients/:id/jobs` with optional `?status` and `?page` / `?limit` query params
- **THEN** the system returns HTTP 200 with a paginated list of jobs including `warrantyStatus`

#### Scenario: Client accessing another client's history
- **WHEN** a CLIENT calls `GET /clients/:id/jobs` with a different client's ID
- **THEN** the system returns HTTP 403

### Requirement: Handyman job history and earnings
The system SHALL return paginated job history and total earnings for a handyman via `GET /handymen/:id/jobs`. Response MUST match `docs/api-contract.md §2.4`.

#### Scenario: Successful earnings retrieval
- **WHEN** an authenticated HANDYMAN calls `GET /handymen/:id/jobs`
- **THEN** the system returns HTTP 200 with jobs including `payout` per job and `totalEarned`

### Requirement: Job categories
The system SHALL return all available job categories via `GET /job-categories` per `docs/api-contract.md §2.8`.

#### Scenario: Successful category listing
- **WHEN** any authenticated user calls `GET /job-categories`
- **THEN** the system returns HTTP 200 with all categories including `id`, `name`, `description`, `iconUrl`, `basePrice`, and `estimatedDuration`
