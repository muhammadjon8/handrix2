## ADDED Requirements

### Requirement: User can register an account
The system SHALL provide a registration form with fields: name, email, phone, password (min 8 chars), and role selector (CLIENT / HANDYMAN). On submit it SHALL call `POST /v1/auth/register` and redirect to the role-appropriate home screen on success.

#### Scenario: Successful client registration
- **WHEN** a user fills all required fields with valid data and selects role CLIENT
- **THEN** the system calls `POST /v1/auth/register`, stores the returned token, and redirects to the client home page

#### Scenario: Duplicate email error
- **WHEN** the submitted email is already registered (409 response)
- **THEN** the system displays an inline error "Email already in use" without clearing other fields

#### Scenario: Weak password
- **WHEN** the password field has fewer than 8 characters
- **THEN** the form displays "Password must be at least 8 characters" before submission

### Requirement: User can log in
The system SHALL provide a login form with email and password fields. On submit it SHALL call `POST /v1/auth/login` and store the returned `accessToken` and `refreshToken`.

#### Scenario: Successful login redirects by role
- **WHEN** login succeeds and the JWT payload contains `role: CLIENT`
- **THEN** the system redirects to `/client/home`
- **WHEN** login succeeds and the JWT payload contains `role: HANDYMAN`
- **THEN** the system redirects to `/handyman/jobs`
- **WHEN** login succeeds and the JWT payload contains `role: ADMIN`
- **THEN** the system redirects to `/admin/dashboard`

#### Scenario: Invalid credentials
- **WHEN** the backend returns HTTP 401
- **THEN** the system displays "Invalid email or password" without disclosing which field is wrong

### Requirement: Access token is silently refreshed
The system SHALL intercept 401 responses on authenticated requests, call `POST /v1/auth/refresh` with the stored `refreshToken`, update the stored `accessToken`, and retry the original request — transparent to the user.

#### Scenario: Silent refresh succeeds
- **WHEN** an API call returns 401 and a valid refreshToken is stored
- **THEN** the system refreshes the token and retries the request without user interaction

#### Scenario: Refresh token expired
- **WHEN** `POST /v1/auth/refresh` returns 401
- **THEN** the system clears all stored tokens and redirects to `/login` with a toast "Session expired, please log in again"

### Requirement: User can log out
The system SHALL provide a logout action that calls `POST /v1/auth/logout` (with Bearer token), clears all stored tokens and Zustand state, closes the WebSocket connection, and redirects to `/login`.

#### Scenario: Logout clears session
- **WHEN** the user triggers logout
- **THEN** tokens are cleared, WebSocket disconnects, and the user lands on `/login`

### Requirement: Protected routes redirect unauthenticated users
The system SHALL redirect any unauthenticated request to a protected route to `/login`. Role-mismatched routes (e.g., a CLIENT accessing `/admin/`) SHALL redirect to the user's role-appropriate home.

#### Scenario: Unauthenticated access to protected route
- **WHEN** a user without a valid token navigates to `/client/home`
- **THEN** the system redirects to `/login`

#### Scenario: Role mismatch
- **WHEN** a CLIENT-role user navigates to `/admin/dashboard`
- **THEN** the system redirects to `/client/home`
