## ADDED Requirements

### Requirement: Client can view warranty for a completed job
The system SHALL provide a warranty detail page accessible from the job history. It SHALL call `GET /v1/warranties/:jobId` and display: warranty status, valid-until date, job details, and handyman info.

#### Scenario: Active warranty displayed
- **WHEN** the client opens the warranty page for a COMPLETED job
- **THEN** the system shows warranty status ACTIVE, expiry date, job type, and handyman name

#### Scenario: No warranty yet
- **WHEN** `GET /v1/warranties/:jobId` returns 404
- **THEN** the system shows "Warranty not yet available for this job"

#### Scenario: Expired warranty
- **WHEN** the warranty `validUntil` date is in the past
- **THEN** the system shows status EXPIRED and hides the "File a Claim" button

### Requirement: Client can file a warranty claim
The system SHALL show a "File a Claim" button on active, non-expired warranties. Tapping it opens a form with: description (required, text area) and photo URL (optional). Submitting SHALL call `POST /v1/warranties/:jobId/claim`.

#### Scenario: Claim filed successfully
- **WHEN** the client submits the claim form with a valid description
- **THEN** the system calls `POST /v1/warranties/:jobId/claim`, displays a success toast "Claim submitted", and updates the warranty status to CLAIMED

#### Scenario: Description is empty
- **WHEN** the client submits the claim form without a description
- **THEN** the system shows "Please describe the issue" and does not submit

#### Scenario: Claim on expired warranty
- **WHEN** the warranty is expired
- **THEN** the "File a Claim" button is hidden and a message "Warranty period has ended" is shown
