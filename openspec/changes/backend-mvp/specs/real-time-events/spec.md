## ADDED Requirements

### Requirement: WebSocket JWT authentication
The Socket.io server SHALL authenticate connections using the JWT passed as a query parameter (`?token=<JWT>`) on handshake per `docs/websocket-contract.md`. Connections without a valid token SHALL be rejected.

#### Scenario: Valid JWT on handshake
- **WHEN** a client connects to any namespace with a valid `?token=<JWT>` query parameter
- **THEN** the connection is accepted and the socket is associated with the authenticated user

#### Scenario: Missing or invalid JWT on handshake
- **WHEN** a client connects without a token or with an invalid token
- **THEN** the server rejects the connection with an auth error

### Requirement: /jobs namespace — server-to-client events
The system SHALL emit all job-related events from the `/jobs` namespace with exact event names and payload shapes defined in `docs/websocket-contract.md`.

#### Scenario: job:matched emitted on handyman assignment
- **WHEN** the matching engine assigns a handyman to a job
- **THEN** the server emits `job:matched` to the client's socket in the `/jobs` namespace with payload `{ jobId, handymanName, handymanAvatar, eta }`

#### Scenario: job:available emitted to handyman on assignment
- **WHEN** the matching engine assigns a job to a handyman
- **THEN** the server emits `job:available` to the handyman's socket in the `/jobs` namespace with payload `{ jobId, categoryName, distanceKm, payoutEstimate, eta }`

#### Scenario: job:status_update emitted on status change
- **WHEN** a handyman updates job status via `PATCH /jobs/:id/status`
- **THEN** the server emits `job:status_update` to the client's socket with payload `{ jobId, status: JobStatus, updatedAt }`

#### Scenario: job:completed emitted on job completion
- **WHEN** job status is set to `COMPLETED`
- **THEN** the server emits `job:completed` to the client's socket with payload `{ jobId, finalPrice, warrantyId }`

#### Scenario: handyman:location emitted on GPS update
- **WHEN** a handyman posts a GPS update via `PATCH /handymen/:id/location`
- **THEN** the server emits `handyman:location` to the client tracking that job with payload `{ jobId, lat, lng, eta }`

### Requirement: /chat namespace — bidirectional events
The system SHALL relay chat messages in real time over the `/chat` namespace per `docs/websocket-contract.md`.

#### Scenario: chat:message emitted to both parties
- **WHEN** the server receives `chat:send` from a client or handyman with `{ jobId, content }`
- **THEN** the server persists the message, then emits `chat:message` to both the client and the handyman in that job's chat room with payload `{ jobId, senderId, senderName, senderRole, content, isAI, createdAt }`

#### Scenario: chat:send from unauthenticated socket
- **WHEN** an unauthenticated socket sends `chat:send`
- **THEN** the server ignores the event and emits an error acknowledgement

### Requirement: Job-scoped rooms
Each job SHALL have its own Socket.io room. Clients and handymen SHALL be joined to their job room upon job confirmation. Events SHALL be scoped to that room.

#### Scenario: Client joins job room on connection
- **WHEN** a CLIENT with an active job connects to `/jobs`
- **THEN** the server joins their socket to the room identified by `jobId`

#### Scenario: Events do not cross job boundaries
- **WHEN** a `job:status_update` is emitted for job A
- **THEN** sockets in job B's room do not receive the event
