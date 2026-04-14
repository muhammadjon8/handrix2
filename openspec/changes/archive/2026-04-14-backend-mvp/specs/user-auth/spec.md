## ADDED Requirements

### Requirement: User registration
The system SHALL allow a new user to register with name, email, phone, password, and role (`CLIENT` or `HANDYMAN`). On success it SHALL return an `accessToken` (JWT) and a user object matching `docs/api-contract.md §2.3`.

#### Scenario: Successful client registration
- **WHEN** `POST /auth/register` is called with valid name, email, phone, password, and role `CLIENT`
- **THEN** the system returns HTTP 201 with `accessToken` and `user` (id, name, email, role)

#### Scenario: Successful handyman registration
- **WHEN** `POST /auth/register` is called with valid fields and role `HANDYMAN`
- **THEN** the system returns HTTP 201 and also creates a `HandymanProfile` record for the new user

#### Scenario: Duplicate email
- **WHEN** `POST /auth/register` is called with an email that already exists
- **THEN** the system returns HTTP 409 with a standard error body per `docs/types-enums.md §2.1`

#### Scenario: Missing required field
- **WHEN** `POST /auth/register` is called with any required field absent or empty
- **THEN** the system returns HTTP 400 with a descriptive validation error

### Requirement: User login
The system SHALL authenticate a user by email and password and return a JWT `accessToken` and user object per `docs/api-contract.md §2.3`.

#### Scenario: Successful login
- **WHEN** `POST /auth/login` is called with a valid email and correct password
- **THEN** the system returns HTTP 200 with `accessToken` and `user` (id, name, email, role)

#### Scenario: Wrong password
- **WHEN** `POST /auth/login` is called with a valid email and incorrect password
- **THEN** the system returns HTTP 401

#### Scenario: Unknown email
- **WHEN** `POST /auth/login` is called with an email that does not exist
- **THEN** the system returns HTTP 401 (no information disclosure about existence)

### Requirement: JWT refresh
The system SHALL issue a new `accessToken` when a valid refresh token is presented per `docs/api-contract.md §2.3`.

#### Scenario: Valid refresh token
- **WHEN** `POST /auth/refresh` is called with a valid, unexpired refresh token
- **THEN** the system returns HTTP 200 with a new `accessToken`

#### Scenario: Expired refresh token
- **WHEN** `POST /auth/refresh` is called with an expired refresh token
- **THEN** the system returns HTTP 401

### Requirement: Logout
The system SHALL invalidate the user's session on logout per `docs/api-contract.md §2.3`.

#### Scenario: Successful logout
- **WHEN** `POST /auth/logout` is called with a valid Bearer token
- **THEN** the system returns HTTP 200 and the token is invalidated for subsequent requests

### Requirement: JWT guard on protected routes
All routes except `/auth/*` SHALL require a valid `Authorization: Bearer <JWT>` header. Requests without or with an invalid token SHALL be rejected.

#### Scenario: Request without token to protected route
- **WHEN** any non-auth endpoint is called without an `Authorization` header
- **THEN** the system returns HTTP 401

#### Scenario: Request with valid token
- **WHEN** a protected endpoint is called with a valid unexpired JWT
- **THEN** the request proceeds and `req.user` is populated with the decoded payload

### Requirement: Role-based access control
The system SHALL enforce role-based access using `UserRole` values from `docs/types-enums.md`. CLIENT routes SHALL be inaccessible to HANDYMAN and vice versa. ADMIN routes SHALL only be accessible to ADMIN role.

#### Scenario: Client accessing handyman-only route
- **WHEN** a CLIENT JWT is used to call a HANDYMAN-only route
- **THEN** the system returns HTTP 403

#### Scenario: Admin accessing admin route
- **WHEN** an ADMIN JWT is used to call `GET /admin/jobs`
- **THEN** the request succeeds

### Requirement: Rate limiting on auth endpoints
Auth endpoints SHALL be rate-limited to prevent brute-force attacks using `@nestjs/throttler`.

#### Scenario: Excessive login attempts
- **WHEN** `POST /auth/login` is called more than the configured threshold times in a short window from the same IP
- **THEN** the system returns HTTP 429
