/**
 * GET /api/payments?address=ST…
 *
 * Returns all payments associated with a wallet address (as creator OR subscriber).
 * Each payment is enriched with the linked subscription's plan name and counterparty.
 *
 * Query params:
 *   address  – Stacks wallet address (required)
 *   limit    – max results (default 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentsStore, subscriptionsStore } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Missing required query param: address' },
      { status: 400 },
    );
  }

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get('limit') ?? 50),
    200,
  );

  // Build a lookup of subscription → wallet relationships
  const subMap = new Map<
    string,
    { creatorAddress: string; subscriberAddress: string; planName: string; interval: string }
  >();

  for (const sub of subscriptionsStore.values()) {
    subMap.set(sub.id, {
      creatorAddress: sub.creatorAddress,
      subscriberAddress: sub.subscriberAddress,
      planName: sub.planName ?? 'Unnamed Plan',
      interval: sub.interval,
    });
  }

  // Find payments where the linked subscription involves this address
  const payments = [];

  for (const payment of paymentsStore.values()) {
    const sub = subMap.get(payment.subscriptionId);
    if (!sub) continue;

    const isCreator = sub.creatorAddress === address;
    const isSubscriber = sub.subscriberAddress === address;

    if (!isCreator && !isSubscriber) continue;

    payments.push({
      id: payment.id,
      type: isCreator ? 'incoming' : 'outgoing',
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      timestamp: payment.timestamp,
      planName: sub.planName,
      interval: sub.interval,
      counterparty: isCreator ? sub.subscriberAddress : sub.creatorAddress,
      subscriptionId: payment.subscriptionId,
    });
  }

  // Sort newest first
  payments.sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json(payments.slice(0, limit));
}
