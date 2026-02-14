import { NextRequest, NextResponse } from 'next/server';
import { X402Client } from '@/lib/x402/client';
import { paymentsStore, subscriptionsStore, Payment, SubscriptionInterval } from '@/lib/db/schema';

const x402Client = new X402Client('testnet');

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

  const verified = await x402Client.verifyPayment(transactionId);

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
