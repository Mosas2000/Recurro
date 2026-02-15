/**
 * Recurring Payment Processor
 *
 * Utility functions for managing subscription payment cycles.
 * Used by the scheduler API route, subscription creation, and
 * payment verification to calculate next payment dates and
 * identify subscriptions that are due for renewal.
 *
 * In production this would be backed by a persistent database and
 * a cron-based scheduler (e.g. Vercel Cron, AWS EventBridge).
 */

import {
  subscriptionsStore,
  paymentsStore,
  type Subscription,
  type Payment,
  type SubscriptionInterval,
} from '@/lib/db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

/** Calculate the next payment timestamp from a given base time. */
export function getNextPaymentDate(
  interval: SubscriptionInterval,
  from: number = Date.now(),
): number {
  switch (interval) {
    case 'daily':
      return from + DAY_MS;
    case 'weekly':
      return from + 7 * DAY_MS;
    case 'monthly':
      return from + 30 * DAY_MS;
    default:
      return from + 30 * DAY_MS;
  }
}

/* ------------------------------------------------------------------ */
/*  Due-payment detection                                              */
/* ------------------------------------------------------------------ */

/** Return all active subscriptions whose next payment date has passed. */
export function findDueSubscriptions(): Subscription[] {
  const now = Date.now();
  const due: Subscription[] = [];

  for (const sub of subscriptionsStore.values()) {
    if (
      sub.status === 'active' &&
      sub.nextPaymentDate > 0 &&
      sub.nextPaymentDate <= now &&
      sub.subscriberAddress !== 'placeholder' &&
      sub.subscriberAddress !== 'plan_template'
    ) {
      due.push(sub);
    }
  }

  return due;
}

/* ------------------------------------------------------------------ */
/*  Payment record helpers                                             */
/* ------------------------------------------------------------------ */

/** Create a pending payment record for a subscription renewal. */
export function createPendingPayment(subscription: Subscription): Payment {
  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    subscriptionId: subscription.id,
    transactionId: '',
    amount: subscription.amount,
    currency: subscription.currency,
    status: 'pending',
    timestamp: Date.now(),
  };

  paymentsStore.set(payment.id, payment);
  return payment;
}

/** Advance a subscription's next payment date after a successful renewal. */
export function advanceSubscription(subscription: Subscription): Subscription {
  const updated: Subscription = {
    ...subscription,
    nextPaymentDate: getNextPaymentDate(subscription.interval),
  };
  subscriptionsStore.set(subscription.id, updated);
  return updated;
}
