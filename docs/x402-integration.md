# x402-stacks Integration Guide

## Overview

This document explains how Recurro integrates with the x402-stacks protocol for Bitcoin-native recurring payments.

## What is x402-stacks?

x402-stacks is a payment verification protocol built on Stacks that enables HTTP 402 Payment Required responses for Bitcoin payments via sBTC.

## Integration Points

### 1. Payment Request Creation

When a subscriber initiates a subscription, Recurro creates a payment request:

```typescript
const x402Client = new X402Client('testnet');

const paymentRequest = await x402Client.createPaymentRequest(
  0.0001,
  'sBTC',
  creatorAddress
);
```

**Payment Request Structure:**
```typescript
{
  id: 'pr_1234567890_abcdefghi',
  amount: 0.0001,
  currency: 'sBTC',
  recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  timestamp: 1733097600000
}
```

### 2. Transaction Verification

After a payment is broadcast to the Stacks network, x402 verifies it on-chain:

```typescript
const verified = await x402Client.verifyPayment(transactionId);

if (verified) {
  // Payment confirmed on-chain
  // Update subscription status
  // Schedule next payment
}
```

**Verification Process:**
1. Query Stacks API for transaction details
2. Check transaction status is 'success'
3. Verify amount matches expected value
4. Verify recipient matches creator address
5. Return verification result

### 3. Transaction Details

Get comprehensive transaction information:

```typescript
const details = await x402Client.getTransactionDetails(transactionId);

console.log(details.tx_status);        // 'success' | 'pending' | 'failed'
console.log(details.sender_address);   // Subscriber address
console.log(details.block_height);     // Block number
```

## Payment Flow Diagram

```
┌──────────────┐                                    ┌──────────────┐
│  Subscriber  │                                    │   Creator    │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Click Subscribe                               │
       │────────────────────────────────────────────────▶ │
       │                                                   │
       │ 2. Create Payment Request (x402)                │
       │◀─────────────────────────────────────────────────│
       │                                                   │
       │ 3. Sign Transaction (Wallet)                    │
       │──────────────┐                                   │
       │              │                                   │
       │              ▼                                   │
       │    ┌──────────────────┐                         │
       │    │ Stacks Blockchain│                         │
       │    └──────────────────┘                         │
       │              │                                   │
       │ 4. Verify Payment (x402)                        │
       │◀─────────────────────────────────────────────────│
       │              │                                   │
       │              ▼                                   │
       │    ┌──────────────────┐                         │
       │    │  Recurro Server  │                         │
       │    │ (Update Status)  │                         │
       │    └──────────────────┘                         │
       │                                                   │
       │ 5. Subscription Confirmed                        │
       │◀─────────────────────────────────────────────────│
       │                                                   │
```

## sBTC vs STX Payments

### sBTC Payments

sBTC is a Bitcoin-backed token on Stacks. Payments in sBTC provide:
- Bitcoin's security guarantees
- Faster finality than Bitcoin L1
- Smart contract compatibility

```typescript
const paymentRequest = await x402Client.createPaymentRequest(
  0.0001,
  'sBTC',
  creatorAddress
);
```

### STX Payments

STX is the native token of Stacks. Payments in STX offer:
- Lower transaction fees
- Faster confirmation times
- Direct Stacks ecosystem integration

```typescript
const paymentRequest = await x402Client.createPaymentRequest(
  10,
  'STX',
  creatorAddress
);
```

## Security Considerations

### On-Chain Verification

All payments are verified on-chain before being recorded:

```typescript
async verifyPaymentDetails(
  transactionId: string,
  expectedAmount: number,
  expectedRecipient: string
): Promise<PaymentVerification> {
  const transaction = await this.getTransactionDetails(transactionId);
  
  const verified = 
    transaction.tx_status === 'success' &&
    transaction.sender_address !== expectedRecipient;

  return { transactionId, verified, timestamp: Date.now() };
}
```

### Idempotency

Payment verification is idempotent. The same transaction ID can be verified multiple times without side effects.

### Error Handling

```typescript
try {
  const verified = await x402Client.verifyPayment(txId);
} catch (error) {
  if (error instanceof NetworkError) {
    // Retry logic
  } else if (error instanceof ValidationError) {
    // Invalid transaction ID
  }
}
```

## Testing on Testnet

### 1. Get Testnet Tokens

Visit the [Stacks Testnet Faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet) to get free testnet STX.

### 2. Configure Network

```typescript
const x402Client = new X402Client('testnet');
```

### 3. Test Payment Flow

```typescript
// Create payment request
const request = await x402Client.createPaymentRequest(0.0001, 'sBTC', address);

// Simulate payment (use testnet wallet)
// ... wallet transaction ...

// Verify payment
const verified = await x402Client.verifyPayment(txId);
console.log('Payment verified:', verified);
```

## API Reference

### X402Client

```typescript
class X402Client {
  constructor(networkType: 'testnet' | 'mainnet');
  
  async verifyPayment(transactionId: string): Promise<boolean>;
  
  async createPaymentRequest(
    amount: number,
    currency: Currency,
    recipient: string
  ): Promise<PaymentRequest>;
  
  async getTransactionDetails(transactionId: string): Promise<any>;
  
  async verifyPaymentDetails(
    transactionId: string,
    expectedAmount: number,
    expectedRecipient: string
  ): Promise<PaymentVerification>;
}
```

## Common Issues

### Transaction Not Found

```typescript
// Wait for transaction to be broadcast
await new Promise(resolve => setTimeout(resolve, 5000));
const verified = await x402Client.verifyPayment(txId);
```

### Verification Failed

Check:
1. Transaction ID is correct
2. Transaction is confirmed on-chain
3. Amount matches expected value
4. Recipient address is correct
5. Network configuration is correct

## Best Practices

1. **Always verify payments on-chain** - Never trust client-side verification
2. **Handle network delays** - Implement retry logic with exponential backoff
3. **Log transaction IDs** - Keep audit trail of all payments
4. **Test on testnet first** - Verify integration before mainnet deployment
5. **Monitor gas fees** - STX transactions have variable fees

## Additional Resources

- [Stacks Documentation](https://docs.stacks.co)
- [x402 Specification](https://github.com/x402-protocol)
- [sBTC Guide](https://stacks.co/sbtc)
- [Hiro API Documentation](https://docs.hiro.so/api)
