# Recurro Architecture

## System Overview

Recurro is a decentralized recurring payment platform built on Stacks blockchain, enabling creators to accept automated sBTC/STX subscriptions.

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                     │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐             │
│  │  Landing │  │Dashboard │  │ Subscriber │             │
│  │   Page   │  │   UI     │  │    UI      │             │
│  └──────────┘  └──────────┘  └────────────┘             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                    │
│                                                            │
│  /api/subscriptions/create  │  /api/subscriptions/[id]   │
│  /api/payments/verify       │  ...                       │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    Core Business Logic                     │
│                                                            │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐        │
│  │  Payment  │  │   x402     │  │   Database   │        │
│  │ Processor │  │  Client    │  │   (In-Memory)│        │
│  └───────────┘  └────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│                  Stacks Blockchain Layer                   │
│                                                            │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐        │
│  │   sBTC    │  │    STX     │  │   Stacks     │        │
│  │ Payments  │  │  Payments  │  │   Network    │        │
│  └───────────┘  └────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Layer

**Technology**: Next.js 14 App Router, React Server Components

**Components**:
- Landing Page: Marketing page with typewriter effect
- Creator Dashboard: Subscription management interface
- Subscriber Interface: Plan browsing and subscription flow
- Wallet Connection: Stacks wallet integration

**State Management**: React hooks, localStorage for wallet state

### API Layer

**Technology**: Next.js API Routes

**Endpoints**:
- `POST /api/subscriptions/create`: Create new subscription
- `GET /api/subscriptions/[id]`: Get subscription details
- `PUT /api/subscriptions/[id]`: Update subscription status
- `POST /api/payments/verify`: Verify payment transaction

**Data Flow**:
```
Client Request → API Route → Business Logic → Data Store → Response
```

### Business Logic Layer

#### x402 Client

Handles Bitcoin payment verification via Stacks blockchain.

```typescript
class X402Client {
  verifyPayment(txId: string): Promise<boolean>
  createPaymentRequest(amount, currency): Promise<PaymentRequest>
  getTransactionDetails(txId: string): Promise<Transaction>
}
```

#### Payment Processor

Manages subscription payment lifecycle.

```typescript
class PaymentProcessor {
  processSubscriptionPayment(subId: string): Promise<PaymentResult>
  scheduleNextPayment(subId: string): void
  checkDuePayments(): Promise<Subscription[]>
}
```

#### Payment Scheduler

Background job that checks for due payments every 5 minutes.

```typescript
function startScheduler(): void
function stopScheduler(): void
```

### Data Layer

**Technology**: In-memory Map store (development), planned PostgreSQL/SQLite

**Schema**:

```typescript
interface Subscription {
  id: string
  creatorAddress: string
  subscriberAddress: string
  amount: number
  currency: 'sBTC' | 'STX'
  interval: 'monthly' | 'weekly' | 'daily'
  status: 'active' | 'paused' | 'cancelled'
  nextPaymentDate: number
  createdAt: number
}

interface Payment {
  id: string
  subscriptionId: string
  transactionId: string
  amount: number
  currency: 'sBTC' | 'STX'
  status: 'pending' | 'completed' | 'failed'
  timestamp: number
}
```

### Blockchain Layer

**Network**: Stacks Testnet (development), Mainnet (production)

**Integration**:
- `@stacks/connect`: Wallet connection
- `@stacks/transactions`: Transaction building
- `@stacks/network`: Network configuration

**Transaction Flow**:
```
1. User initiates payment in UI
2. Wallet prompts for signature
3. Signed transaction broadcast to Stacks
4. x402 client polls for confirmation
5. Payment verified and recorded
6. Next payment date calculated
```

## x402-stacks Payment Flow

```
┌──────────┐                                     ┌──────────┐
│Subscriber│                                     │ Creator  │
└─────┬────┘                                     └────┬─────┘
      │                                               │
      │ 1. Click "Subscribe"                         │
      │────────────────────────────────────▶         │
      │                                               │
      │ 2. Connect Wallet                            │
      │◀───────────────────────────────────          │
      │                                               │
      │ 3. Approve Transaction                       │
      │────────────────────────────────────▶         │
      │                                               │
      │           4. Broadcast TX                    │
      │──────────────────────────────────────────────│
      │                    │                          │
      │                    ▼                          │
      │          ┌──────────────────┐                │
      │          │ Stacks Blockchain│                │
      │          └──────────────────┘                │
      │                    │                          │
      │           5. Verify TX                        │
      │◀──────────────────────────────────────────── │
      │                                               │
      │ 6. Update Subscription                       │
      │──────────────────────────────────▶           │
      │                                    │          │
      │ 7. Confirmation                    ▼          │
      │◀──────────────────────────────────────────── │
      │                                               │
```

## Security Architecture

### Wallet Security
- No private keys stored
- All transactions signed in wallet
- Read-only access to blockchain data

### API Security
- Input validation on all endpoints
- Rate limiting (100 req/min)
- CORS configuration
- Error message sanitization

### Payment Security
- On-chain verification via x402
- Transaction hash validation
- Amount and recipient verification
- Idempotency checks

## Scalability Considerations

### Current Limitations
- In-memory data store (not persistent)
- Single server instance
- No caching layer

### Future Improvements
1. **Database**: Migrate to PostgreSQL for persistence
2. **Caching**: Add Redis for frequently accessed data
3. **Queue System**: Use Bull/BullMQ for payment processing
4. **Load Balancing**: Deploy multiple instances
5. **CDN**: Use Vercel Edge Network for static assets

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Vercel Platform               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Next.js Application           │ │
│  │  (Serverless Functions)           │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Edge Network (CDN)            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        Stacks Network                   │
│  (Testnet/Mainnet)                      │
└─────────────────────────────────────────┘
```

## Technology Decisions

### Why Next.js?
- Server-side rendering for SEO
- API routes for backend logic
- React Server Components for performance
- Excellent Vercel deployment

### Why Stacks?
- Bitcoin settlement via sBTC
- Smart contract capabilities
- Mature wallet ecosystem
- Active developer community

### Why In-Memory Storage?
- Rapid prototyping
- Simple deployment
- Easy testing
- Low operational complexity

### Migration Path to Production
1. Replace in-memory store with PostgreSQL
2. Add Redis caching layer
3. Implement proper authentication
4. Set up monitoring (Sentry, LogRocket)
5. Deploy to mainnet
6. Audit smart contracts
