## ADDED Requirements

### Requirement: Admin job listing with filters
The system SHALL return a filterable, paginated list of all jobs via `GET /admin/jobs`. This endpoint SHALL be restricted to ADMIN role.

#### Scenario: Successful job listing
- **WHEN** an ADMIN calls `GET /admin/jobs` with optional `?status`, `?handymanId`, `?clientId`, `?page`, `?limit` query params
- **THEN** the system returns HTTP 200 with a paginated list of jobs including status, category, client, and handyman fields

#### Scenario: Non-admin access rejected
- **WHEN** a CLIENT or HANDYMAN JWT is used to call `GET /admin/jobs`
- **THEN** the system returns HTTP 403

### Requirement: Admin handyman listing
The system SHALL return a list of all handymen with their vetting and availability status via `GET /admin/handymen`. Restricted to ADMIN role.

#### Scenario: Successful handyman listing
- **WHEN** an ADMIN calls `GET /admin/handymen`
- **THEN** the system returns HTTP 200 with all handymen including `id`, `name`, `email`, `isVetted`, `isActive`, `rating`, and `skills`

### Requirement: Approve or reject handyman vetting
The system SHALL allow an ADMIN to approve or reject a handyman's vetting status via `PATCH /admin/handymen/:id/vet`. Per `docs/api-contract.md §4.7`.

#### Scenario: Approve handyman
- **WHEN** an ADMIN calls `PATCH /admin/handymen/:id/vet` with `{ isVetted: true }`
- **THEN** `HandymanProfile.isVetted` is set to `true` and the handyman becomes eligible for matching

#### Scenario: Reject handyman
- **WHEN** an ADMIN calls `PATCH /admin/handymen/:id/vet` with `{ isVetted: false }`
- **THEN** `HandymanProfile.isVetted` is set to `false` and the handyman is excluded from matching immediately

#### Scenario: Non-admin calls vet endpoint
- **WHEN** a non-ADMIN JWT is used to call `PATCH /admin/handymen/:id/vet`
- **THEN** the system returns HTTP 403

### Requirement: Admin dashboard stats
The system SHALL return aggregated platform statistics via `GET /admin/dashboard`. Restricted to ADMIN role. (Exact response shape to be defined before implementation per design.md open question.)

#### Scenario: Successful dashboard load
- **WHEN** an ADMIN calls `GET /admin/dashboard`
- **THEN** the system returns HTTP 200 with at minimum: active job count, available handyman count, and revenue total for the current day

#### Scenario: Non-admin access rejected
- **WHEN** a non-ADMIN JWT is used to call `GET /admin/dashboard`
- **THEN** the system returns HTTP 403
