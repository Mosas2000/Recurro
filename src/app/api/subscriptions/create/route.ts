import { NextRequest, NextResponse } from 'next/server';
import { subscriptionsStore, Subscription, SubscriptionInterval } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { creatorAddress, subscriberAddress, amount, currency, interval, planName, description, perks } = body;

  if (!creatorAddress || !subscriberAddress || !amount || !currency || !interval) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  if (amount <= 0) {
    return NextResponse.json(
      { error: 'Amount must be greater than 0' },
      { status: 400 }
    );
  }

  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  const nextPaymentDate = calculateNextPaymentDate(interval as SubscriptionInterval);
  
  const subscription: Subscription = {
    id: subscriptionId,
    creatorAddress,
    subscriberAddress,
    amount,
    currency,
    interval: interval as SubscriptionInterval,
    status: 'active',
    nextPaymentDate,
    createdAt: Date.now(),
    planName,
    description: description || '',
    perks: perks || [],
  };

  subscriptionsStore.set(subscriptionId, subscription);

  return NextResponse.json(subscription, { status: 201 });
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
