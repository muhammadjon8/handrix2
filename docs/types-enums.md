2.1 Standard Error Response
json{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Description of what went wrong"
}

2.2 Shared Enums
typescriptenum UserRole {
  CLIENT    = "CLIENT",
  HANDYMAN  = "HANDYMAN",
  ADMIN     = "ADMIN"
}

enum JobStatus {
  PENDING     = "PENDING",
  MATCHED     = "MATCHED",
  EN_ROUTE    = "EN_ROUTE",
  ARRIVED     = "ARRIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED   = "COMPLETED",
  CANCELLED   = "CANCELLED"
}

enum PaymentStatus {
  PENDING   = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED    = "FAILED",
  REFUNDED  = "REFUNDED"
}

enum WarrantyStatus {
  ACTIVE  = "ACTIVE",
  CLAIMED = "CLAIMED",
  EXPIRED = "EXPIRED"
}

enum ClaimStatus {
  OPEN      = "OPEN",
  IN_REVIEW = "IN_REVIEW",
  RESOLVED  = "RESOLVED"
}