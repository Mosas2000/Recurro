# Recurro

**Bitcoin-Native Recurring Payments via x402-stacks**



---

## What is Recurro?

Recurro is a decentralized subscription payment platform built on the Stacks blockchain. Creators can set up recurring payment plans (daily / weekly / monthly) and share a subscribe link — subscribers pay directly from their Stacks wallet via the **x402 HTTP 402 payment protocol**, with every transaction settled on-chain.

**No API keys. No payment processors. No middlemen.**

---

## x402-stacks Integration

Recurro uses the **[x402-stacks](https://www.npmjs.com/package/x402-stacks)** SDK (v2.0.1) to implement real HTTP-level payments following the Coinbase x402 specification.

### How the x402 Flow Works

```
Client ──GET /api/x402/premium-content──▶ Server
                                          │
Client ◀──HTTP 402 + payment-required─────┘ (base64 JSON with payTo, amount, network)
  │
  │ User signs STX transfer in wallet popup
  │
Client ──GET + payment-signature header──▶ Server
                                          │ Decodes base64 payload
                                          │ Extracts signed tx hex
                                          │ Broadcasts to Stacks API /v2/transactions
                                          │ Resolves sender from mempool
                                          │
Client ◀──HTTP 200 + payment-response─────┘ (resource data + tx receipt)
```

### x402-Protected Endpoints

| Endpoint | Method | Price | Description |
|---|---|---|---|
| `/api/x402/premium-content` | GET | 0.001 STX | Paywall-protected premium analytics |
| `/api/x402/subscribe` | POST | Dynamic | x402-gated subscription with on-chain settlement |
| `/api/x402/status` | GET | Free | x402 protocol configuration & status |

### SDK Usage

**Server-side** (`src/lib/x402/middleware.ts`):
```ts
import { STXtoMicroSTX, STACKS_NETWORKS, X402_HEADERS } from 'x402-stacks';

export const GET = withX402Paywall(
  { amount: STXtoMicroSTX(0.001), payTo: 'ST…', network: 'testnet', asset: 'STX' },
  async (req, settlement) => {
    return NextResponse.json({ data: '…', paidBy: settlement?.payer });
  }
);
```

**Client-side** (`src/lib/x402/client.ts`):
```ts
import { performX402Payment } from '@/lib/x402/client';

const { data } = await performX402Payment({
  url: '/api/x402/subscribe',
  method: 'POST',
  body: { creatorAddress, subscriberAddress, amount, currency, interval, planName },
  network: 'testnet',
  onWalletPrompt: () => setStatus('Confirm in wallet…'),
  onSettling: () => setStatus('Settling on-chain…'),
});
```

The middleware broadcasts signed transactions directly to the Stacks API (`/v2/transactions`), which is more efficient than routing through an external facilitator. A local facilitator implementation is also included at `/api/facilitator/*` for reference and testing.

---

## Architecture

```
┌──────────────┐     ┌────────────────────────────────────┐     ┌──────────────┐
│  Creator     │────▶│  Recurro (Next.js 16 + App Router) │────▶│  Stacks      │
│  Wallet      │     │                                    │     │  Blockchain  │
└──────────────┘     │  ┌──────────────┐ ┌─────────────┐  │     │  (Testnet)   │
                     │  │ x402 Paywall │ │ Subscription │  │     └──────────────┘
                     │  │ Middleware   │ │ Store        │  │           ▲
                     │  └──────────────┘ └─────────────┘  │           │
                     │  ┌──────────────┐ ┌─────────────┐  │           │
                     │  │ Payment      │ │ x402-stacks │──┼───────────┘
                     │  │ Processor    │ │ SDK v2.0.1  │  │  broadcast tx
                     │  └──────────────┘ └─────────────┘  │
                     └────────────────────────────────────┘
                               ▲
                     ┌─────────┴──────────┐
                     │  Subscriber Wallet  │
                     │  (Leather / Xverse) │
                     └────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|---|---|---|
| x402 Middleware | `src/lib/x402/middleware.ts` | `withX402Paywall()` — wraps API routes with 402 flow |
| x402 Client | `src/lib/x402/client.ts` | Shared `performX402Payment()` — single reusable 402→sign→settle flow |
| x402 Types | `src/lib/x402/types.ts` | V2-compatible types (CAIP-2 networks, payment payloads) |
| Wallet | `src/lib/stacks/wallet.ts` | @stacks/connect v8 — wallet connection + localStorage persistence |
| Payment Processor | `src/lib/payments/processor.ts` | Recurring payment utilities — `findDueSubscriptions()`, `getNextPaymentDate()` |
| Scheduler | `src/app/api/scheduler/check-due/` | Finds & processes subscriptions due for renewal |
| Subscriptions API | `src/app/api/subscriptions/` | CRUD for plans and subscriptions (with address auth) |
| Payment Verify | `src/app/api/payments/verify/` | On-chain tx verification via Hiro API + x402-stacks verifier |
| Local Facilitator | `src/app/api/facilitator/` | Reference facilitator (`/settle`, `/verify`, `/supported`) |
| Dashboard | `src/app/dashboard/` | Creator dashboard — plans, subscribers, revenue |
| Subscribe Page | `src/app/subscribe/[address]/` | Public page for subscribers to browse and pay for plans |
| Payments Page | `src/app/x402/` | Interactive x402 payment flow with progress stepper |

---

## Tech Stack

- **Framework**: Next.js 16.1.6, TypeScript, App Router
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Blockchain**: Stacks Testnet, STX transfers
- **x402 Protocol**: `x402-stacks@2.0.1` (npm)
- **Wallet**: `@stacks/connect@8.2.4` (Leather, Xverse)
- **Notifications**: Sonner toast library

---

## Getting Started

### Prerequisites

- Node.js 18+
- Leather or Xverse wallet browser extension
- STX testnet tokens → [Stacks Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet)

### Installation

```bash
git clone https://github.com/Mosas2000/Recurro.git
cd Recurro
npm install
```

### Environment Setup

Create `.env.local`:

```env
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so

X402_FACILITATOR_URL=http://localhost:3000/api/facilitator
NEXT_PUBLIC_X402_FACILITATOR_URL=http://localhost:3000/api/facilitator

X402_CREATOR_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_X402_CREATOR_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

### Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## Usage

### For Creators

1. Connect your Leather or Xverse wallet on the **Dashboard**
2. Click **Create Plan** — set name, amount (STX), and billing interval
3. Copy your **Subscribe Link** and share it with your audience

### For Subscribers

1. Visit a creator's subscribe page (`/subscribe/[address]`)
2. Connect your wallet
3. Click **Subscribe Now** — the x402 flow handles everything:
   - Your wallet asks you to approve an STX transfer
   - The signed transaction is broadcast to Stacks
   - Subscription is activated on success

### Try the x402 Payment Flow

Visit `/x402` for an interactive demo of the full HTTP 402 payment cycle with a progress stepper.

---

## API Reference

### Subscriptions

```bash
# List all subscriptions
GET /api/subscriptions?creatorAddress=ST…

# Create a plan
POST /api/subscriptions/create
{ "creatorAddress": "ST…", "subscriberAddress": "plan_template", "amount": 5, "currency": "STX", "interval": "monthly", "planName": "Pro" }

# Update subscription status
PUT /api/subscriptions/:id
{ "status": "paused" }  # active | paused | cancelled
```

### x402 Endpoints

```bash
# Check x402 configuration (free)
GET /api/x402/status

# Premium content (paywall — 0.001 STX)
GET /api/x402/premium-content
# → 402 without payment-signature header
# → 200 with valid payment-signature header

# x402-gated subscription
POST /api/x402/subscribe
# → 402, then retried with signed payment
```

### Recurring Payment Scheduler

```bash
# Check for due subscriptions
GET /api/scheduler/check-due
# → { dueCount, subscriptions, checkedAt }

# Process due subscriptions (create pending payments, advance dates)
POST /api/scheduler/check-due
# → { processedCount, processed, processedAt }
```

### Payment Verification

```bash
POST /api/payments/verify
{ "transactionId": "0x…", "subscriptionId": "sub_…", "amount": 5, "currency": "STX" }
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── facilitator/     # Local x402 facilitator (settle/verify/supported)
│   │   ├── payments/verify/  # On-chain tx verification
│   │   ├── scheduler/        # Recurring payment scheduler (check-due)
│   │   ├── subscriptions/    # CRUD API for plans & subscriptions (with auth)
│   │   └── x402/            # x402-paywalled endpoints
│   ├── dashboard/           # Creator dashboard
│   ├── subscribe/           # Public subscribe page
│   ├── x402/                # Interactive payment flow page
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── CreatePlanModal.tsx
│   ├── SubscribeButton.tsx  # Full x402 payment flow
│   ├── SubscriptionCard.tsx
│   └── WalletConnect.tsx
├── lib/
│   ├── db/schema.ts         # TypeScript interfaces + in-memory stores
│   ├── payments/processor.ts # Payment processing logic
│   ├── stacks/              # Network config + wallet helpers
│   └── x402/                # Middleware, client, types
└── types/
    └── wallet.ts
```

---

## Design Decisions

1. **Direct Stacks broadcast** over external facilitator — more reliable, no third-party dependency
2. **In-memory storage** for hackathon demo — production would use PostgreSQL/Drizzle
3. **STX-first** — all payments are STX transfers via `stx_transferStx`
4. **x402 V2 spec** — CAIP-2 network identifiers, base64-encoded headers, `X402_HEADERS` constants from the SDK
5. **Shared x402 flow** — single `performX402Payment()` function used by all payment UI, eliminating duplication
6. **Recurring scheduler** — API-driven with `findDueSubscriptions()` + `advanceSubscription()`, ready for Vercel Cron in production
7. **Address-based auth** — mutation routes require wallet address verification to prevent unauthorized changes

---

## Links

- [x402-stacks on npm](https://www.npmjs.com/package/x402-stacks)
- [x402Stacks GitHub](https://github.com/tony1908/x402Stacks)
- [Stacks Testnet Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet)
- [Stacks Explorer](https://explorer.hiro.so/?chain=testnet)

## License

MIT
