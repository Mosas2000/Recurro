import { NextRequest, NextResponse } from 'next/server';
import { X402PaymentVerifier } from 'x402-stacks';
import { paymentsStore, subscriptionsStore, Payment } from '@/lib/db/schema';
import { getNextPaymentDate } from '@/lib/payments/processor';

const NETWORK = (process.env.STACKS_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ??
  process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
  'http://localhost:3000/api/facilitator';
const verifier = new X402PaymentVerifier(FACILITATOR_URL);

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

  // Use x402-stacks' X402PaymentVerifier to check facilitator status
  let facilitatorReachable = false;
  try {
    await verifier.getSupported();
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
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    subscriptionId,
    transactionId,
    amount,
    currency,
    status: verified ? 'completed' : 'failed',
    timestamp: Date.now(),
  };

  paymentsStore.set(payment.id, payment);

  if (verified) {
    const nextPaymentDate = getNextPaymentDate(subscription.interval);
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
