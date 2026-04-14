## ADDED Requirements

### Requirement: Admin sees platform statistics header
The system SHALL display a stats header at the top of the dashboard by calling `GET /v1/admin/dashboard`. It SHALL show: active job count, available handyman count, and today's revenue (USD).

#### Scenario: Stats header loads
- **WHEN** the admin opens the dashboard
- **THEN** the system fetches dashboard stats and renders three metric cards: Active Jobs, Available Handymen, Revenue Today

#### Scenario: Stats auto-refresh
- **WHEN** the dashboard is open
- **THEN** the stats refresh every 60 seconds automatically (TanStack Query `refetchInterval`)

### Requirement: Admin can view and filter active jobs
The system SHALL display a paginated table of all jobs fetched from `GET /v1/admin/jobs`. Columns SHALL include: client name, job type, handyman assigned (or "Unassigned"), status badge, and ETA. The table SHALL support filtering by status, handymanId, and clientId via query params. A search input SHALL filter by client name or job type client-side.

#### Scenario: Jobs table loads
- **WHEN** the admin opens the Jobs tab
- **THEN** the system fetches the first page of all jobs and renders the table

#### Scenario: Filter by status
- **WHEN** the admin selects a status from the status filter dropdown
- **THEN** the system refetches with `?status=<value>` and re-renders the table

#### Scenario: Search input filters client-side
- **WHEN** the admin types in the search input
- **THEN** the visible rows are filtered in real time by client name or job type substring (case-insensitive)

### Requirement: Admin can view and manage handymen
The system SHALL display a paginated table of all handymen fetched from `GET /v1/admin/handymen`. Columns SHALL include: name, status (Active/Inactive/Pending Vetting), rating, and a Vet/Reject action for unvetted handymen.

#### Scenario: Handymen table loads
- **WHEN** the admin opens the Handymen tab
- **THEN** the system fetches and renders all handyman profiles

#### Scenario: Vet a handyman
- **WHEN** the admin clicks "Approve" on an unvetted handyman
- **THEN** the system calls `PATCH /v1/admin/handymen/:id/vet` with `{ isVetted: true }`, shows a success toast, and updates the row's status to Vetted

#### Scenario: Reject a handyman
- **WHEN** the admin clicks "Reject" on an unvetted handyman
- **THEN** the system calls `PATCH /v1/admin/handymen/:id/vet` with `{ isVetted: false }`, shows a success toast, and updates the row's status to Rejected

#### Scenario: View handyman profile
- **WHEN** the admin clicks on a handyman row
- **THEN** a side panel or modal opens showing the handyman's full profile details

### Requirement: Admin views are accessible only to ADMIN role
The system SHALL redirect any non-ADMIN user attempting to access `/admin/*` routes to their role-appropriate home screen.

#### Scenario: Non-admin redirected
- **WHEN** a CLIENT or HANDYMAN navigates to `/admin/dashboard`
- **THEN** the system redirects to the user's role home without rendering any admin content
