# Recurro

**Bitcoin-Native Recurring Payments via x402-stacks**

> 🏆 Built for the [DoraHacks x402 Stacks Challenge](https://dorahacks.io/hackathon/x402-stacks/detail)

## Overview

Recurro is a decentralized subscription payment platform built on Stacks that enables creators to accept recurring STX and sBTC payments directly from subscribers — using the **x402 HTTP 402 payment protocol** with zero intermediaries.

## x402-stacks Integration ⚡

Recurro uses the **[x402-stacks](https://www.npmjs.com/package/x402-stacks)** SDK (v2.0.1) to implement real HTTP-level payments following the Coinbase x402 specification.

### How x402 Works in Recurro

```
1. Client requests paywall-protected API endpoint
2. Server responds HTTP 402 + payment-required header (base64 JSON)
3. Client decodes requirements, signs STX transfer via wallet
4. Client retries with payment-signature header (base64 signed tx)
5. Server sends signed tx to facilitator /settle endpoint
6. Facilitator broadcasts tx, waits for on-chain confirmation
7. Server returns resource + payment-response header with tx details
```

### x402-Protected Endpoints

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/api/x402/premium-content` | GET | 0.001 STX | Paywall-protected premium analytics |
| `/api/x402/subscribe` | POST | Dynamic | x402-gated subscription with on-chain settlement |
| `/api/x402/status` | GET | Free | x402 protocol configuration & status |

### Key x402 Components

- **`src/lib/x402/middleware.ts`** — `withX402Paywall()` adapter for Next.js API routes using `X402PaymentVerifier`
- **`src/lib/x402/client.ts`** — Browser-side `fetchWithX402()` and server-side `X402ServerVerifier`
- **`src/lib/x402/types.ts`** — V2-compatible types (CAIP-2 networks, payment requirements, payloads)
- **`src/app/x402/page.tsx`** — Interactive demo page with live 402 payment flow

### Protocol Details

- **x402 Version**: 2 (Coinbase-compatible)
- **Network**: `stacks:2147483648` (testnet) / `stacks:1` (mainnet)
- **Headers**: `payment-required`, `payment-signature`, `payment-response`
- **Facilitator**: Settles signed transactions on-chain via `/settle` endpoint
- **SDK**: `x402-stacks@2.0.1` from npm

## Problem Statement

Traditional subscription platforms charge 3-10% fees, control payment flows, and can freeze accounts. Cryptocurrency recurring payments lack proper infrastructure, requiring manual transactions each billing cycle.

## Solution

Recurro leverages the x402-stacks protocol to enable:
- **HTTP 402 Payment Required** — native payment protocol using HTTP status codes
- Automated recurring Bitcoin payments via STX / sBTC
- Direct creator-to-subscriber payments (no middlemen)
- On-chain settlement via the facilitator pattern
- Zero platform fees

## Technology Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Blockchain**: Stacks, STX, sBTC, x402-stacks SDK v2
- **x402 Protocol**: `x402-stacks` npm package, facilitator pattern
- **Wallet**: @stacks/connect v8 (Leather, Xverse)
- **Network**: Stacks Testnet (demo), Mainnet (production)

## Features

- ⚡ **x402 Paywall** — API endpoints gated by HTTP 402 + on-chain STX payment
- 🔗 **Wallet Connection** — Connect Leather/Xverse via @stacks/connect v8
- 📊 **Creator Dashboard** — Create plans, view subscribers, track revenue
- 💰 **Subscribe Flow** — Full x402 payment → facilitator settlement → subscription creation
- 🎮 **Interactive Demo** — `/x402` page demonstrating the complete 402 flow
- 📡 **Status API** — `/api/x402/status` showing live protocol configuration

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Creator   │────▶│   Recurro        │────▶│  Stacks      │
│   Wallet    │     │   (Next.js)      │     │  Network     │
└─────────────┘     └──────────────────┘     └──────────────┘
                            │                       ▲
                    ┌───────┴───────┐               │
                    ▼               ▼               │
            ┌──────────┐   ┌──────────────┐        │
            │ HTTP 402 │   │ x402-stacks  │────────┘
            │ Paywall  │   │ Facilitator  │  /settle
            └──────────┘   └──────────────┘
                    ▲
                    │ payment-signature
            ┌──────────────┐
            │  Subscriber  │
            │  Wallet      │
            └──────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Leather or Xverse wallet browser extension
- STX testnet tokens (get from [Stacks Faucet](https://explorer.stacks.co/sandbox/faucet?chain=testnet))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mosas2000/Recurro.git
cd Recurro
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so

# x402-stacks configuration
X402_FACILITATOR_URL=https://x402-backend-7eby.onrender.com
NEXT_PUBLIC_X402_FACILITATOR_URL=https://x402-backend-7eby.onrender.com

# Set to your testnet address to receive payments
X402_CREATOR_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_X402_CREATOR_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Try the x402 Demo

1. Visit `/x402` — the interactive x402 demo page
2. Connect your wallet
3. Click "Try x402 Payment" to trigger the full HTTP 402 flow
4. Sign the STX transfer in your wallet popup
5. Watch the facilitator settle the transaction on-chain

### For Creators

1. **Connect Wallet**: Click "Connect Wallet" and authorize Leather/Xverse
2. **Create Plan**: Navigate to Dashboard → Create Plan
3. **Configure Subscription**: Set plan name, amount (STX/sBTC), and interval
4. **Share Link**: Share `/subscribe/[your-address]` with subscribers

### For Subscribers

1. **Browse Plans**: Visit creator's subscription page
2. **Connect Wallet**: Connect your Stacks wallet
3. **Pay with x402**: Click "Pay with x402" — your wallet signs a STX transfer
4. **Settlement**: The facilitator broadcasts the tx and confirms payment on-chain

## API Documentation

### x402 Endpoints

```bash
# Check x402 status (free)
curl http://localhost:3000/api/x402/status

# Hit the paywall (returns 402 + payment requirements)
curl -i http://localhost:3000/api/x402/premium-content
# → HTTP 402 + payment-required header (base64 JSON)

# With payment (after signing)
curl -H "payment-signature: <base64_payload>" http://localhost:3000/api/x402/premium-content
# → HTTP 200 + premium data + payment-response header
```

See [docs/api.md](docs/api.md) for complete API reference.

## Links

- **x402-stacks npm**: https://www.npmjs.com/package/x402-stacks
- **x402Stacks GitHub**: https://github.com/tony1908/x402Stacks
- **Stacks Testnet Faucet**: https://explorer.stacks.co/sandbox/faucet?chain=testnet
- **Stacks Explorer**: https://explorer.stacks.co/

## License

MIT License

## Acknowledgments

Built for the [x402 Stacks Challenge](https://dorahacks.io/hackathon/x402-stacks/detail) hackathon. Powered by x402-stacks, STX, and sBTC.
