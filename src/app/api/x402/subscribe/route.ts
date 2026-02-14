/**
 * /api/x402/subscribe – x402-gated subscription endpoint
 *
 * When a subscriber wants to pay for a subscription plan, this endpoint
 * requires an x402 STX payment matching the plan price. The facilitator
 * settles the payment on-chain and the subscription is created on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402Paywall, STXtoMicroSTX } from '@/lib/x402/middleware';
import { subscriptionsStore, paymentsStore } from '@/lib/db/schema';
import type { Subscription, Payment } from '@/lib/db/schema';

const NETWORK = (process.env.STACKS_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';

/**
 * POST /api/x402/subscribe
 *
 * Query params:
 *   ?creatorAddress=ST…
 *   &planId=sub_…          (optional – to reference an existing plan)
 *   &amount=0.001          (STX amount for the subscription)
 *   &interval=monthly
 *   &planName=Pro
 *   &subscriberAddress=ST…
 *
 * The endpoint dynamically builds the x402 paywall from the requested amount.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    creatorAddress,
    subscriberAddress,
    amount,
    currency = 'STX',
    interval = 'monthly',
    planName = 'Subscription',
  } = body;

  if (!creatorAddress || !subscriberAddress || !amount) {
    return NextResponse.json(
      { error: 'Missing required fields: creatorAddress, subscriberAddress, amount' },
      { status: 400 },
    );
  }

  // Build the paywall handler dynamically based on the plan price
  const paywallHandler = withX402Paywall(
    {
      amount: STXtoMicroSTX(Number(amount)),
      payTo: creatorAddress,
      network: NETWORK,
      asset: currency,
      description: `Subscription: ${planName} (${interval})`,
    },
    async (_r, settlement) => {
      // Payment verified! Create the subscription
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      const nextPaymentDate =
        interval === 'daily'
          ? now + day
          : interval === 'weekly'
            ? now + 7 * day
            : now + 30 * day;

      const subscription: Subscription = {
        id: subscriptionId,
        creatorAddress,
        subscriberAddress,
        amount: Number(amount),
        currency,
        interval,
        status: 'active',
        nextPaymentDate,
        createdAt: now,
        planName,
      };

      subscriptionsStore.set(subscriptionId, subscription);

      // Record the payment
      const payment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subscriptionId,
        transactionId: settlement?.transaction ?? '',
        amount: Number(amount),
        currency,
        status: 'completed',
        timestamp: now,
      };
      paymentsStore.set(payment.id, payment);

      return NextResponse.json({
        success: true,
        subscription,
        payment: {
          id: payment.id,
          transactionId: settlement?.transaction,
          payer: settlement?.payer,
          protocol: 'x402-stacks v2',
        },
      });
    },
  );

  return paywallHandler(req);
}
