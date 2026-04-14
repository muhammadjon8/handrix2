PART 2 — API CONTRACT
Global Conventions

Base URL: https://api.handrix.com/v1
Auth: All endpoints require Authorization: Bearer <JWT> except /auth/*
Content-Type: application/json
Timestamps: ISO 8601 — 2025-04-07T14:30:00Z
IDs: UUID v4 strings
Errors: Standard format (see §2.1)


2.3 Auth Endpoints
POST /auth/register
Body:
json{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "role": "CLIENT | HANDYMAN"
}
Response 201:
json{
  "accessToken": "string",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "CLIENT | HANDYMAN"
  }
}

POST /auth/login
Body:
json{
  "email": "string",
  "password": "string"
}
Response 200:
json{
  "accessToken": "string",
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "CLIENT | HANDYMAN | ADMIN"
  }
}

2.4 Job Endpoints
POST /jobs — Create job & get price estimate
Body:
json{
  "categoryId": "uuid",
  "description": "string | null",
  "locationLat": "float",
  "locationLng": "float",
  "locationAddress": "string"
}
Response 201:
json{
  "jobId": "uuid",
  "status": "PENDING",
  "priceEstimate": {
    "laborCost": 45.00,
    "materialCost": 20.00,
    "transportCost": 10.00,
    "total": 75.00,
    "currency": "USD"
  },
  "estimatedDuration": 60
}

POST /jobs/:id/confirm — Client confirms booking
Body: (none)
Response 200:
json{
  "jobId": "uuid",
  "status": "MATCHED",
  "handyman": {
    "id": "uuid",
    "name": "string",
    "avatarUrl": "string | null",
    "rating": 4.8
  },
  "eta": "ISO8601 datetime"
}

GET /jobs/:id — Get job details
Response 200:
json{
  "jobId": "uuid",
  "status": "JobStatus",
  "category": {
    "id": "uuid",
    "name": "string"
  },
  "description": "string | null",
  "locationAddress": "string",
  "locationLat": "float",
  "locationLng": "float",
  "quotedPrice": 75.00,
  "finalPrice": "float | null",
  "laborCost": 45.00,
  "materialCost": 20.00,
  "transportCost": 10.00,
  "eta": "ISO8601 | null",
  "handyman": {
    "id": "uuid",
    "name": "string",
    "avatarUrl": "string | null",
    "rating": 4.8
  } ,
  "createdAt": "ISO8601"
}

PATCH /jobs/:id/status — Handyman updates job status
Body:
json{
  "status": "EN_ROUTE | ARRIVED | IN_PROGRESS | COMPLETED"
}
Response 200:
json{
  "jobId": "uuid",
  "status": "JobStatus",
  "updatedAt": "ISO8601"
}

GET /clients/:id/jobs — Client job history
Query params: ?status=COMPLETED&page=1&limit=10
Response 200:
json{
  "jobs": [
    {
      "jobId": "uuid",
      "category": "string",
      "status": "JobStatus",
      "quotedPrice": 75.00,
      "finalPrice": 75.00,
      "createdAt": "ISO8601",
      "warrantyStatus": "WarrantyStatus | null"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}

GET /handymen/:id/jobs — Handyman job history + earnings
Query params: ?status=COMPLETED&page=1&limit=10
Response 200:
json{
  "jobs": [
    {
      "jobId": "uuid",
      "category": "string",
      "status": "JobStatus",
      "payout": 60.00,
      "createdAt": "ISO8601"
    }
  ],
  "totalEarned": 1240.00,
  "total": 20,
  "page": 1,
  "limit": 10
}

PATCH /handymen/:id/location — Handyman posts GPS update
Body:
json{
  "lat": "float",
  "lng": "float"
}
Response 200:
json{ "updated": true }

2.5 Chat Endpoints
GET /chat/:jobId/messages
Response 200:
json{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "senderName": "string",
      "senderRole": "CLIENT | HANDYMAN | AI",
      "content": "string",
      "isAI": false,
      "createdAt": "ISO8601"
    }
  ]
}

POST /chat/:jobId/messages
Body:
json{
  "content": "string"
}
Response 201:
json{
  "id": "uuid",
  "senderId": "uuid",
  "content": "string",
  "isAI": false,
  "createdAt": "ISO8601"
}

2.6 Payment Endpoints
POST /payments/intent — Create Stripe payment intent
Body:
json{
  "jobId": "uuid"
}
Response 201:
json{
  "clientSecret": "string",
  "amount": 75.00,
  "currency": "USD"
}

POST /payments/confirm — Confirm payment after job completion
Body:
json{
  "jobId": "uuid",
  "stripePaymentIntentId": "string"
}
Response 200:
json{
  "paymentId": "uuid",
  "status": "SUCCEEDED",
  "amount": 75.00,
  "receiptUrl": "string"
}

2.7 Warranty Endpoints
GET /warranties/:jobId
Response 200:
json{
  "warrantyId": "uuid",
  "jobId": "uuid",
  "status": "WarrantyStatus",
  "validUntil": "ISO8601",
  "createdAt": "ISO8601"
}

POST /warranties/:jobId/claim
Body:
json{
  "description": "string",
  "photoUrl": "string | null"
}
Response 201:
json{
  "claimId": "uuid",
  "warrantyId": "uuid",
  "status": "OPEN",
  "createdAt": "ISO8601"
}

2.8 Job Categories Endpoint
GET /job-categories
Response 200:
json{
  "categories": [
    {
      "id": "uuid",
      "name": "Small Leak",
      "description": "string",
      "iconUrl": "string",
      "basePrice": 45.00,
      "estimatedDuration": 60
    }
  ]
}
