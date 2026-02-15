# API Reference

## Subscriptions

### List Subscriptions
```
GET /api/subscriptions?creatorAddress=ST…&subscriberAddress=ST…
```
Both query parameters are optional. Returns all matching subscriptions.

**Response**: `Subscription[]`

### Create Plan / Subscription
```
POST /api/subscriptions/create
Content-Type: application/json

{
  "creatorAddress": "ST1PQH…",
  "subscriberAddress": "plan_template",
  "amount": 5.0,
  "currency": "STX",
  "interval": "monthly",
  "planName": "Pro Plan"
}
```

**Response** (201):
```json
{
  "id": "sub_1739000000000_abc123def",
  "creatorAddress": "ST1PQH…",
  "subscriberAddress": "plan_template",
  "amount": 5,
  "currency": "STX",
  "interval": "monthly",
  "status": "active",
  "nextPaymentDate": 1741592000000,
  "createdAt": 1739000000000,
  "planName": "Pro Plan"
}
```

### Get Subscription
```
GET /api/subscriptions/:id
```

### Update Subscription Status
```
PUT /api/subscriptions/:id
Content-Type: application/json

{ "status": "paused" }
```
Only `status` can be updated. Valid values: `active`, `paused`, `cancelled`.

---

## x402 Endpoints

### Premium Content (Paywalled)
```
GET /api/x402/premium-content
```

**Without payment**: Returns HTTP 402 with `payment-required` header.

**With payment** (include `payment-signature` header): Returns HTTP 200 with analytics data.

**Price**: 0.001 STX

### Subscribe via x402 (Paywalled)
```
POST /api/x402/subscribe
Content-Type: application/json

{
  "creatorAddress": "ST…",
  "subscriberAddress": "ST…",
  "amount": 5.0,
  "currency": "STX",
  "interval": "monthly",
  "planName": "Pro"
}
```

First call returns 402. Retry with `payment-signature` header to complete.

### x402 Status (Free)
```
GET /api/x402/status
```
Returns x402 configuration, supported endpoints, and facilitator connectivity status.

---

## Payment Verification

### Verify Transaction
```
POST /api/payments/verify
Content-Type: application/json

{
  "transactionId": "0xabc…",
  "subscriptionId": "sub_…",
  "amount": 5.0,
  "currency": "STX"
}
```

Checks the Stacks API for transaction status and records the payment.

---

## Local Facilitator

Reference implementation of the x402 facilitator pattern.

### Settle
```
POST /api/facilitator/settle
```
Broadcasts a signed transaction to the Stacks network.

### Verify
```
POST /api/facilitator/verify
```
Validates transaction payload structure.

### Supported
```
GET /api/facilitator/supported
```
Returns supported payment kinds (Stacks mainnet + testnet).
