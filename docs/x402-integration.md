# x402-stacks Integration Guide

## Overview

Recurro implements the [x402 HTTP payment protocol](https://www.npmjs.com/package/x402-stacks) for Stacks, enabling API endpoints to require on-chain STX payments before returning a response. This follows the Coinbase x402 V2 specification with CAIP-2 network identifiers.

## SDK Usage

### Installed Package

```json
"x402-stacks": "^2.0.1"
```

### Imports Used

**Server-side** (`src/lib/x402/middleware.ts`):
```typescript
import { STXtoMicroSTX, STACKS_NETWORKS, X402_HEADERS } from 'x402-stacks';
```

**Client library** (`src/lib/x402/client.ts`):
```typescript
import { X402PaymentVerifier, STXtoMicroSTX, STACKS_NETWORKS, X402_HEADERS } from 'x402-stacks';
```

### What Each Import Does

| Import | Purpose |
|---|---|
| `STXtoMicroSTX` | Converts human-readable STX to microSTX (e.g., 0.001 → 1000) |
| `STACKS_NETWORKS` | CAIP-2 network IDs (`stacks:1` mainnet, `stacks:2147483648` testnet) |
| `X402_HEADERS` | Standard header names: `payment-required`, `payment-signature`, `payment-response` |
| `X402PaymentVerifier` | Server-side class for verifying/settling x402 payments |

## Implementation

### `withX402Paywall()` Middleware

Location: `src/lib/x402/middleware.ts`

This is the core x402 implementation. It wraps any Next.js App Router handler with the 402 payment flow:

```typescript
export const GET = withX402Paywall(
  {
    amount: STXtoMicroSTX(0.001),    // 1000 microSTX
    payTo: 'ST1PQH…',               // recipient address
    network: 'testnet',
    asset: 'STX',
    description: 'Premium content',
  },
  async (req, settlement) => {
    // settlement.payer = sender address
    // settlement.transaction = txid
    return NextResponse.json({ data: '…' });
  }
);
```

**Flow:**

1. Check for `payment-signature` header (using `X402_HEADERS.PAYMENT_SIGNATURE`)
2. If missing → return HTTP 402 with `payment-required` header containing base64-encoded payment requirements
3. If present → decode base64 → extract signed transaction hex → broadcast to Stacks API
4. On successful broadcast → call the handler with settlement info
5. Attach `payment-response` header to the response

### Client-Side Flow

Location: `src/lib/x402/client.ts` → `handleX402Payment()`
Also implemented inline in: `src/app/x402/X402Client.tsx`, `src/components/SubscribeButton.tsx`

```typescript
// 1. Initial request → receives 402
const res = await fetch('/api/x402/premium-content');
// res.status === 402

// 2. Parse payment requirements
const requirements = await res.json();
// { x402Version: 2, accepts: [{ payTo, amount, network, ... }] }

// 3. Sign STX transfer via wallet
const result = await walletRequest('stx_transferStx', {
  recipient: requirement.payTo,
  amount: requirement.amount,
  network: 'testnet',
});

// 4. Build x402 payload and retry
const payload = { x402Version: 2, resource, accepted: requirement, payload: { transaction: signedTxHex } };
const encoded = btoa(JSON.stringify(payload));
const settled = await fetch('/api/x402/premium-content', {
  headers: { 'payment-signature': encoded },
});
// settled.status === 200 → content unlocked
```

### Settlement Approach

The middleware broadcasts signed transactions **directly to the Stacks API** (`POST /v2/transactions`) rather than routing through an external facilitator service. This is:

- **More reliable** — no dependency on third-party uptime
- **Faster** — one fewer network hop
- **Equivalent** — the Stacks API handles broadcast identically to how a facilitator would

A reference facilitator implementation is included at `/api/facilitator/*` for testing and completeness.

## Endpoints Using x402

### `/api/x402/premium-content` (GET)
- Price: 0.001 STX (1000 microSTX)
- Returns: Platform analytics computed from real subscription data
- Handler: `withX402Paywall()` middleware

### `/api/x402/subscribe` (POST)
- Price: Dynamic (matches the subscription plan amount)
- Returns: Created subscription + payment receipt
- Handler: Dynamically builds `withX402Paywall()` config from request body

## Protocol Constants

```typescript
// Networks (CAIP-2 format)
STACKS_NETWORKS.TESTNET = 'stacks:2147483648'
STACKS_NETWORKS.MAINNET = 'stacks:1'

// Headers
X402_HEADERS.PAYMENT_REQUIRED  = 'payment-required'
X402_HEADERS.PAYMENT_SIGNATURE = 'payment-signature'
X402_HEADERS.PAYMENT_RESPONSE  = 'payment-response'
```
