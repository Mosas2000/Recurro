# Recurro API Documentation

## Base URL

Development: `http://localhost:3000/api`
Production: `https://recurro.app/api`

## Authentication

No authentication required for public endpoints. Wallet signature verification used for mutations.

## Endpoints

### Create Subscription

Create a new subscription plan.

**Endpoint:** `POST /api/subscriptions/create`

**Request Body:**
```json
{
  "creatorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "subscriberAddress": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  "amount": 0.0001,
  "currency": "sBTC",
  "interval": "monthly",
  "planName": "Basic Plan"
}
```

**Response:**
```json
{
  "id": "sub_1234567890_abcdefghi",
  "creatorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "subscriberAddress": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  "amount": 0.0001,
  "currency": "sBTC",
  "interval": "monthly",
  "status": "active",
  "nextPaymentDate": 1735689600000,
  "createdAt": 1733097600000,
  "planName": "Basic Plan"
}
```

**Status Codes:**
- `201`: Subscription created successfully
- `400`: Invalid request (missing fields or invalid amount)
- `500`: Server error

### Get Subscription

Retrieve subscription details by ID.

**Endpoint:** `GET /api/subscriptions/[id]`

**Response:**
```json
{
  "id": "sub_1234567890_abcdefghi",
  "creatorAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "subscriberAddress": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  "amount": 0.0001,
  "currency": "sBTC",
  "interval": "monthly",
  "status": "active",
  "nextPaymentDate": 1735689600000,
  "createdAt": 1733097600000
}
```

**Status Codes:**
- `200`: Success
- `404`: Subscription not found

### Update Subscription

Update subscription status.

**Endpoint:** `PUT /api/subscriptions/[id]`

**Request Body:**
```json
{
  "status": "paused"
}
```

**Response:**
```json
{
  "id": "sub_1234567890_abcdefghi",
  "status": "paused",
  ...
}
```

**Status Codes:**
- `200`: Updated successfully
- `404`: Subscription not found
- `400`: Invalid status value

### Verify Payment

Verify a payment transaction on-chain.

**Endpoint:** `POST /api/payments/verify`

**Request Body:**
```json
{
  "transactionId": "0x1234567890abcdef1234567890abcdef12345678",
  "subscriptionId": "sub_1234567890_abcdefghi",
  "amount": 0.0001,
  "currency": "sBTC"
}
```

**Response:**
```json
{
  "verified": true,
  "payment": {
    "id": "pay_1234567890_abcdefghi",
    "subscriptionId": "sub_1234567890_abcdefghi",
    "transactionId": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": 0.0001,
    "currency": "sBTC",
    "status": "completed",
    "timestamp": 1733097600000
  }
}
```

**Status Codes:**
- `200`: Verification complete
- `400`: Missing required fields
- `404`: Subscription not found

## Rate Limiting

Current limits (subject to change):
- 100 requests per minute per IP
- 1000 requests per hour per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733097660
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common error codes:
- `400`: Bad Request - Invalid input
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

## Webhooks

Coming soon. Webhooks will notify you of payment events.
