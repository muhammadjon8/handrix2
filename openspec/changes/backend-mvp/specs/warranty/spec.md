## ADDED Requirements

### Requirement: Auto-generate warranty on job completion
The system SHALL automatically create a `Warranty` record when a job's status transitions to `COMPLETED`. The warranty period SHALL default to 30 days (configurable via `ConfigService`).

#### Scenario: Warranty created on COMPLETED status
- **WHEN** a handyman sets `Job.status` to `COMPLETED`
- **THEN** a `Warranty` record is created with `status: "ACTIVE"`, `validUntil = now + warrantyPeriodDays`, linked to `jobId` and `clientId`

#### Scenario: Warranty period from config
- **WHEN** `WARRANTY_PERIOD_DAYS` environment variable is set to `60`
- **THEN** `Warranty.validUntil` is set to 60 days from completion date

#### Scenario: Warranty not created for cancelled jobs
- **WHEN** a job is `CANCELLED`
- **THEN** no `Warranty` record is created

### Requirement: Get warranty for a job
The system SHALL return warranty details via `GET /warranties/:jobId`. Response MUST match `docs/api-contract.md §2.7`.

#### Scenario: Successful warranty retrieval
- **WHEN** an authenticated CLIENT calls `GET /warranties/:jobId` for a job they own
- **THEN** the system returns HTTP 200 with `warrantyId`, `jobId`, `status` (using `WarrantyStatus` from `docs/types-enums.md`), `validUntil`, and `createdAt`

#### Scenario: Warranty not yet generated
- **WHEN** `GET /warranties/:jobId` is called for a job not yet `COMPLETED`
- **THEN** the system returns HTTP 404

### Requirement: File a warranty claim
The system SHALL allow a CLIENT to file a claim against an `ACTIVE` warranty via `POST /warranties/:jobId/claim`. Response MUST match `docs/api-contract.md §2.7`.

#### Scenario: Successful claim filed
- **WHEN** a CLIENT calls `POST /warranties/:jobId/claim` on an `ACTIVE` warranty with `{ description, photoUrl }`
- **THEN** the system returns HTTP 201 with `claimId`, `warrantyId`, `status: "OPEN"`, and `createdAt`; `Warranty.status` is updated to `CLAIMED`

#### Scenario: Claim on expired warranty
- **WHEN** `POST /warranties/:jobId/claim` is called on a warranty where `validUntil` is in the past
- **THEN** `Warranty.status` is `EXPIRED` and the system returns HTTP 422

#### Scenario: Claim on already-claimed warranty
- **WHEN** `POST /warranties/:jobId/claim` is called on a warranty already in `CLAIMED` status
- **THEN** the system returns HTTP 409

### Requirement: Warranty and claim statuses use shared enums
`Warranty.status` SHALL use `WarrantyStatus` and `WarrantyClaim.status` SHALL use `ClaimStatus` from `docs/types-enums.md`. No other values are permitted.

#### Scenario: WarrantyStatus values enforced
- **WHEN** any write to `Warranty.status` uses a value outside `ACTIVE | CLAIMED | EXPIRED`
- **THEN** TypeScript compilation fails (enforced via Prisma-generated types)

#### Scenario: ClaimStatus values enforced
- **WHEN** any write to `WarrantyClaim.status` uses a value outside `OPEN | IN_REVIEW | RESOLVED`
- **THEN** TypeScript compilation fails (enforced via Prisma-generated types)
