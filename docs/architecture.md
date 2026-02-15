# Architecture

## Overview

Recurro is a Next.js 16 application using the App Router. It combines:
- A React frontend with Stacks wallet integration
- API routes implementing x402-stacks payment flows
- In-memory data stores for the hackathon demo

## Data Flow

### Plan Creation
```
Creator → Dashboard UI → POST /api/subscriptions/create → subscriptionsStore (Map)
```

### x402 Subscription Payment
```
Subscriber → SubscribeButton → POST /api/x402/subscribe
  → HTTP 402 + payment requirements
  → Wallet signs STX transfer
  → Retry with payment-signature header
  → Middleware broadcasts tx to Stacks API
  → Subscription + Payment records created
  → HTTP 200 with receipt
```

### x402 Premium Content
```
User → Payments Page → GET /api/x402/premium-content
  → HTTP 402 (no payment)
  → Wallet popup → sign tx
  → Retry with payment-signature
  → Tx broadcast → analytics data returned
```

## Storage

For the hackathon demo, data lives in `Map` objects in `src/lib/db/schema.ts`:

| Store | Key | Value | Purpose |
|---|---|---|---|
| `subscriptionsStore` | `sub_<timestamp>_<rand>` | `Subscription` | Plans and active subscriptions |
| `paymentsStore` | `pay_<timestamp>_<rand>` | `Payment` | Payment transaction records |
| `creatorsStore` | Stacks address | `Creator` | Creator profiles (reserved) |

**Note**: Data resets on server restart. A production deployment would use PostgreSQL or a similar persistent database.

### Plan vs Subscription

Plans and subscriptions share the same `Subscription` type. They're distinguished by the `subscriberAddress` field:
- `plan_template` → it's a plan template (created by the creator)
- Any real Stacks address → it's an active subscription

## Security

- **PUT /api/subscriptions/[id]** validates that only the `status` field can be updated (active/paused/cancelled)
- **x402 middleware** validates x402Version, checks for signed transaction, and verifies broadcast success before granting access
- Wallet connections are stored in `localStorage` — no sensitive data on the server

## Network Configuration

All Stacks interaction goes through the Hiro API:
- **Testnet**: `https://api.testnet.hiro.so`
- **Mainnet**: `https://api.hiro.so`

Transaction broadcast: `POST /v2/transactions` (octet-stream)
Transaction lookup: `GET /extended/v1/tx/{txid}`
