# Recurro

Bitcoin-Native Recurring Payments via x402-stacks

## Overview

Recurro is a decentralized subscription payment platform built on Stacks that enables creators to accept recurring sBTC and STX payments directly from subscribers without intermediaries.

## Problem Statement

Traditional subscription platforms charge 3-10% fees, control payment flows, and can freeze accounts. Cryptocurrency recurring payments lack proper infrastructure, requiring manual transactions each billing cycle.

## Solution

Recurro leverages the x402-stacks protocol to enable:
- Automated recurring Bitcoin payments via sBTC
- Direct creator-to-subscriber payments
- Zero platform fees
- Bitcoin's security guarantees
- Smart contract-based payment verification

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Stacks, sBTC, x402-stacks protocol
- **Wallet Integration**: Leather, Xverse
- **Network**: Stacks Testnet (demo), Mainnet (production)

## Features

- Connect Stacks wallets (Leather/Xverse)
- Create subscription plans with flexible intervals
- Accept sBTC and STX payments
- Automated payment processing and verification
- Creator dashboard with analytics
- Subscriber management interface
- Payment history tracking

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Creator   │────▶│   Recurro    │────▶│  Stacks     │
│             │     │   Platform   │     │  Network    │
└─────────────┘     └──────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Subscriber  │────▶│ x402 Client  │────▶│   sBTC      │
│             │     │              │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Leather or Xverse wallet
- STX/sBTC testnet tokens

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/recurro.git
cd recurro
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
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### For Creators

1. **Connect Wallet**: Click "Connect Wallet" and authorize Leather/Xverse
2. **Create Plan**: Navigate to Dashboard → Create Plan
3. **Configure Subscription**:
   - Set plan name
   - Define amount in sBTC or STX
   - Choose interval (monthly/weekly/daily)
4. **Share Link**: Share `/subscribe/[your-address]` with subscribers

### For Subscribers

1. **Browse Plans**: Visit creator's subscription page
2. **Connect Wallet**: Connect your Stacks wallet
3. **Subscribe**: Click "Subscribe Now" and confirm transaction
4. **Manage**: View payment history and cancel anytime

## x402-stacks Integration

Recurro uses x402-stacks for payment verification:

```typescript
const x402Client = new X402Client('testnet');
const verified = await x402Client.verifyPayment(transactionId);
```

Payment Flow:
1. Subscriber initiates payment
2. Transaction broadcast to Stacks network
3. x402 client verifies transaction on-chain
4. Payment recorded in subscription history
5. Next payment date calculated automatically

## API Documentation

See [docs/api.md](docs/api.md) for complete API reference.

## Future Roadmap

- Mainnet deployment
- Multi-chain support (Bitcoin L2s)
- NFT-gated subscriptions
- Payment analytics dashboard
- Webhook notifications
- Mobile app (iOS/Android)

## Security Considerations

- All payments verified on-chain
- No custody of user funds
- Smart contract audit recommended before mainnet
- Rate limiting on API endpoints
- Wallet signature verification

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details.

## Acknowledgments

Built for the Stacks Hackathon. Powered by sBTC and x402-stacks protocol.
