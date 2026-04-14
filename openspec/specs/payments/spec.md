## ADDED Requirements

### Requirement: Create Stripe payment intent
The system SHALL create a Stripe payment intent for a completed job when `POST /payments/intent` is called. Response MUST match `docs/api-contract.md §2.6`.

#### Scenario: Successful intent creation
- **WHEN** an authenticated CLIENT calls `POST /payments/intent` with `{ jobId: "uuid" }` for a COMPLETED job
- **THEN** the system returns HTTP 201 with `clientSecret`, `amount` (equal to `Job.quotedPrice`), and `currency: "USD"`

#### Scenario: Job not yet completed
- **WHEN** `POST /payments/intent` is called for a job that is not in `COMPLETED` status
- **THEN** the system returns HTTP 422

#### Scenario: Non-owner attempts payment
- **WHEN** a CLIENT who did not create the job calls `POST /payments/intent`
- **THEN** the system returns HTTP 403

### Requirement: Confirm payment
The system SHALL record the payment outcome and update job state when `POST /payments/confirm` is called. Response MUST match `docs/api-contract.md §2.6`.

#### Scenario: Successful payment confirmation
- **WHEN** `POST /payments/confirm` is called with `{ jobId, stripePaymentIntentId }` and Stripe reports `SUCCEEDED`
- **THEN** the system returns HTTP 200 with `paymentId`, `status: "SUCCEEDED"`, `amount`, and `receiptUrl`; `Job.finalPrice` is set; `PaymentStatus` is `SUCCEEDED`

#### Scenario: Payment failed
- **WHEN** the Stripe payment intent reports a failure
- **THEN** `Payment.status` is set to `FAILED` and the system returns HTTP 402

### Requirement: Stripe webhook handling
The system SHALL handle `payment_intent.succeeded` and `payment_intent.payment_failed` Stripe webhooks. Webhook payloads MUST be verified using Stripe signature validation before processing.

#### Scenario: Webhook signature valid
- **WHEN** a Stripe webhook arrives with a valid `Stripe-Signature` header
- **THEN** the system processes the event and updates the corresponding `Payment` record

#### Scenario: Webhook signature invalid
- **WHEN** a Stripe webhook arrives with an invalid or missing `Stripe-Signature` header
- **THEN** the system returns HTTP 400 and does not process the event

#### Scenario: payment_intent.succeeded webhook
- **WHEN** Stripe sends `payment_intent.succeeded`
- **THEN** `Payment.status` is updated to `SUCCEEDED` and `Job.finalPrice` is confirmed

#### Scenario: payment_intent.payment_failed webhook
- **WHEN** Stripe sends `payment_intent.payment_failed`
- **THEN** `Payment.status` is updated to `FAILED`

### Requirement: Payment status uses shared enum
All `Payment.status` values SHALL use `PaymentStatus` enum from `docs/types-enums.md` (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`). No other values are permitted.

#### Scenario: Invalid payment status rejected at DTO level
- **WHEN** any internal code attempts to write a status string not in `PaymentStatus`
- **THEN** TypeScript compilation fails (enforced via Prisma-generated types)
