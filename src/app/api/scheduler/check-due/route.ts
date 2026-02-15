/**
 * /api/scheduler/check-due – Recurring Payment Scheduler
 *
 * Checks for subscriptions with overdue payments and optionally processes them.
 * In production, this would be triggered by a cron job (e.g. Vercel Cron,
 * AWS EventBridge) on a regular interval.
 *
 * GET  → returns all subscriptions whose next payment date has passed
 * POST → processes due subscriptions: creates pending payment records and
 *         advances each subscription's nextPaymentDate to the next cycle
 */

import { NextResponse } from 'next/server';
import {
  findDueSubscriptions,
  createPendingPayment,
  advanceSubscription,
} from '@/lib/payments/processor';

/**
 * GET /api/scheduler/check-due
 *
 * List every active subscription whose next payment date is in the past.
 * The dashboard polls this endpoint to display renewal notifications.
 */
export async function GET() {
  const due = findDueSubscriptions();

  return NextResponse.json({
    dueCount: due.length,
    subscriptions: due.map((s) => ({
      id: s.id,
      planName: s.planName,
      subscriberAddress: s.subscriberAddress,
      creatorAddress: s.creatorAddress,
      amount: s.amount,
      currency: s.currency,
      interval: s.interval,
      nextPaymentDate: s.nextPaymentDate,
    })),
    checkedAt: new Date().toISOString(),
  });
}

/**
 * POST /api/scheduler/check-due
 *
 * Process every due subscription:
 *  1. Create a pending payment record (awaiting on-chain settlement)
 *  2. Advance the subscription's nextPaymentDate to the next cycle
 *
 * The pending payment records can then be settled via the x402 flow
 * when the subscriber next visits the platform.
 */
export async function POST() {
  const due = findDueSubscriptions();
  const processed: { subscriptionId: string; paymentId: string; nextPaymentDate: number }[] = [];

  for (const subscription of due) {
    const payment = createPendingPayment(subscription);
    const updated = advanceSubscription(subscription);

    processed.push({
      subscriptionId: subscription.id,
      paymentId: payment.id,
      nextPaymentDate: updated.nextPaymentDate,
    });
  }

  return NextResponse.json({
    processedCount: processed.length,
    processed,
    processedAt: new Date().toISOString(),
  });
}
