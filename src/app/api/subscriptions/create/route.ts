import { NextRequest, NextResponse } from 'next/server';
import { subscriptionsStore, Subscription, SubscriptionInterval } from '@/lib/db/schema';
import { getNextPaymentDate } from '@/lib/payments/processor';
import { isValidStacksAddress } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const { creatorAddress, subscriberAddress, amount, currency, interval, planName, description, perks } = body;

  if (!creatorAddress || !subscriberAddress || !amount || !currency || !interval) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Validate the creator address (must be a real Stacks address).
  // subscriberAddress may be "placeholder" or "plan_template" when creating a plan.
  const isPlanTemplate = subscriberAddress === 'placeholder' || subscriberAddress === 'plan_template';
  if (!isValidStacksAddress(creatorAddress) || (!isPlanTemplate && !isValidStacksAddress(subscriberAddress))) {
    return NextResponse.json(
      { error: 'Invalid Stacks address format' },
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
  
  const nextPaymentDate = getNextPaymentDate(interval as SubscriptionInterval);
  
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
