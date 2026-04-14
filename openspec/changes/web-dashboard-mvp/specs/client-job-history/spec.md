## ADDED Requirements

### Requirement: Client can view a list of all their jobs
The system SHALL call `GET /v1/clients/:id/jobs` and render a paginated list of jobs. Each list item SHALL show: job type (category name), date, status badge, price, and warranty status indicator. The list SHALL support infinite scroll or a "Load more" button.

#### Scenario: Jobs list renders
- **WHEN** the client opens the "My Jobs" screen
- **THEN** the system fetches and renders the first page of jobs sorted by date descending

#### Scenario: Status badge colours
- **WHEN** a job item is rendered
- **THEN** PENDING and MATCHED jobs show a yellow badge, active jobs (EN_ROUTE through IN_PROGRESS) show a blue badge, COMPLETED shows green, CANCELLED shows grey

#### Scenario: Warranty indicator shown
- **WHEN** a COMPLETED job has an active warranty
- **THEN** a warranty shield icon is shown on the job list item

#### Scenario: Load more
- **WHEN** the client scrolls to the bottom of the list and more pages exist
- **THEN** the next page is fetched and appended to the list

### Requirement: Client can filter jobs by status
The system SHALL provide a status filter (segmented control or dropdown) above the list. Selecting a status passes `?status=<value>` to the API.

#### Scenario: Filter applied
- **WHEN** the client selects "Completed" from the status filter
- **THEN** the system refetches with `?status=COMPLETED` and renders only completed jobs

### Requirement: Client can open a job detail view
Tapping a job list item SHALL navigate to a job detail screen showing full job info, current status, price breakdown, handyman name, and links to chat, warranty, and payment (where applicable).

#### Scenario: Job detail opens
- **WHEN** the client taps a job list item
- **THEN** the system fetches `GET /v1/jobs/:id` and renders the full detail view

#### Scenario: Active job shows tracking link
- **WHEN** the job status is EN_ROUTE, ARRIVED, or IN_PROGRESS
- **THEN** the detail view shows a "Track Handyman" button that navigates to the tracking screen
