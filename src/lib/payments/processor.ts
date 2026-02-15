/**
 * Payment Processor
 *
 * Handles processing subscription payments and scheduling next payments.
 * Works with the in-memory subscription store for the hackathon demo.
 * In production, this would be backed by a persistent database and
 * a cron-based scheduler (e.g. Vercel Cron, AWS EventBridge).
 */

import { subscriptionsStore, paymentsStore, Subscription, Payment } from '@/lib/db/schema';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentProcessor {
  private network: 'testnet' | 'mainnet';

  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    this.network = networkType;
  }

  async processSubscriptionPayment(subscriptionId: string): Promise<PaymentResult> {
    const subscription = subscriptionsStore.get(subscriptionId);

    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.status !== 'active') {
      return { success: false, error: 'Subscription is not active' };
    }

    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      subscriptionId,
      transactionId: '',
      amount: subscription.amount,
      currency: subscription.currency,
      status: 'pending',
      timestamp: Date.now(),
    };

    paymentsStore.set(payment.id, payment);

    return { success: true, transactionId: payment.id };
  }

  scheduleNextPayment(subscriptionId: string): void {
    const subscription = subscriptionsStore.get(subscriptionId);
    if (!subscription) return;

    const day = 24 * 60 * 60 * 1000;
    let nextPaymentDate: number;

    switch (subscription.interval) {
      case 'daily':
        nextPaymentDate = Date.now() + day;
        break;
      case 'weekly':
        nextPaymentDate = Date.now() + 7 * day;
        break;
      case 'monthly':
        nextPaymentDate = Date.now() + 30 * day;
        break;
      default:
        nextPaymentDate = Date.now() + 30 * day;
    }

    subscriptionsStore.set(subscriptionId, { ...subscription, nextPaymentDate });
  }

  async checkDuePayments(): Promise<Subscription[]> {
    const now = Date.now();
    const due: Subscription[] = [];

    for (const subscription of subscriptionsStore.values()) {
      if (subscription.status === 'active' && subscription.nextPaymentDate <= now) {
        due.push(subscription);
      }
    }

    return due;
  }
}
