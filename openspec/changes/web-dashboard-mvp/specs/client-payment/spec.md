## ADDED Requirements

### Requirement: Payment screen is triggered automatically on job completion
The system SHALL navigate to the payment screen when the `job:completed` WebSocket event is received OR when the client opens a job whose status is COMPLETED and no payment record exists yet.

#### Scenario: Automatic navigation on completion event
- **WHEN** the `job:completed` WebSocket event is received
- **THEN** the system navigates to the payment screen for the completed job

#### Scenario: Manual access from job history
- **WHEN** the client taps a COMPLETED job in history that has no payment yet
- **THEN** the system opens the payment screen for that job

### Requirement: Payment screen shows final job summary
The system SHALL display the final price breakdown (labor, materials, transport, total) from the job record. If the final price differs from the initial estimate, a clear explanation SHALL be shown. The total amount in the Stripe payment intent SHALL match the displayed total.

#### Scenario: Price matches estimate
- **WHEN** the payment screen loads and finalPrice equals the estimated total
- **THEN** the price breakdown is shown with no additional messaging

#### Scenario: Price differs from estimate
- **WHEN** finalPrice differs from the original estimate
- **THEN** both the original estimate and the final price are displayed with a note explaining the difference

### Requirement: Client pays using Stripe Elements
The system SHALL render a Stripe `CardElement` for card input. On "Pay Now" tap the system SHALL call `POST /v1/payments/intent` to get a `clientSecret`, confirm the payment using Stripe.js `confirmCardPayment`, then call `POST /v1/payments/confirm` with the resulting `stripePaymentIntentId`.

#### Scenario: Successful payment
- **WHEN** the client enters valid card details and taps "Pay Now"
- **THEN** the system calls the intent endpoint, confirms with Stripe, calls the confirm endpoint, and navigates to the receipt screen

#### Scenario: Card declined
- **WHEN** Stripe returns a payment failure
- **THEN** the system displays the Stripe error message inline below the card input and enables retry

#### Scenario: One-tap pay with saved card (future placeholder)
- **WHEN** a saved card is on file (future feature)
- **THEN** a "Pay with saved card" button is shown above the new card input (not implemented in MVP — layout reserves space)

### Requirement: Receipt is displayed after successful payment
The system SHALL display an on-screen receipt including: job type, handyman name, date, itemised cost breakdown, and total paid. A "Done" button returns the client to job history.

#### Scenario: Receipt rendered
- **WHEN** `POST /v1/payments/confirm` returns success
- **THEN** the receipt screen shows all line items and a "Done" button

#### Scenario: Download receipt (deferred)
- **WHEN** the receipt screen is shown
- **THEN** no PDF/email download button is shown in MVP (feature is deferred)
