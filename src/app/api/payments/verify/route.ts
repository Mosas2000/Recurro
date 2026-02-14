import { NextRequest, NextResponse } from 'next/server';
import { X402ServerVerifier } from '@/lib/x402/client';
import { paymentsStore, subscriptionsStore, Payment, SubscriptionInterval } from '@/lib/db/schema';

const NETWORK = (process.env.STACKS_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';
const verifier = new X402ServerVerifier();

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { transactionId, subscriptionId, amount, currency } = body;

  if (!transactionId || !subscriptionId || !amount || !currency) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const subscription = subscriptionsStore.get(subscriptionId);
  
  if (!subscription) {
    return NextResponse.json(
      { error: 'Subscription not found' },
      { status: 404 }
    );
  }

  // Use the real x402-stacks facilitator to check supported networks
  let facilitatorReachable = false;
  try {
    const supported = await verifier.getSupported();
    facilitatorReachable = true;
  } catch {
    facilitatorReachable = false;
  }

  // For direct tx verification, check via Hiro API
  const apiUrl = NETWORK === 'testnet'
    ? 'https://api.testnet.hiro.so'
    : 'https://api.hiro.so';

  let verified = false;
  try {
    const response = await fetch(`${apiUrl}/extended/v1/tx/${transactionId}`);
    if (response.ok) {
      const transaction = await response.json();
      verified = transaction.tx_status === 'success';
    }
  } catch {
    verified = false;
  }

  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subscriptionId,
    transactionId,
    amount,
    currency,
    status: verified ? 'completed' : 'failed',
    timestamp: Date.now(),
  };

  paymentsStore.set(payment.id, payment);

  if (verified) {
    const nextPaymentDate = calculateNextPaymentDate(subscription.interval);
    const updatedSubscription = {
      ...subscription,
      nextPaymentDate,
    };
    subscriptionsStore.set(subscriptionId, updatedSubscription);
  }

  return NextResponse.json({
    verified,
    payment,
    x402: {
      facilitatorReachable,
      protocol: 'x402-stacks v2',
    },
  });
}

function calculateNextPaymentDate(interval: SubscriptionInterval): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  switch (interval) {
    case 'daily':
      return now + day;
    case 'weekly':
      return now + (7 * day);
    case 'monthly':
      return now + (30 * day);
    default:
      return now + (30 * day);
  }
}
