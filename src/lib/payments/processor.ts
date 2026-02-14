import { subscriptionsStore, paymentsStore, Subscription, Payment } from '@/lib/db/schema';
import { X402Client } from '@/lib/x402/client';
import { PaymentResult, PaymentStatus } from '@/types/payment';

export class PaymentProcessor {
  private x402Client: X402Client;

  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    this.x402Client = new X402Client(networkType);
  }

  async processSubscriptionPayment(subscriptionId: string): Promise<PaymentResult> {
    const subscription = subscriptionsStore.get(subscriptionId);

    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
      };
    }

    if (subscription.status !== 'active') {
      return {
        success: false,
        error: 'Subscription is not active',
      };
    }

    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subscriptionId,
      transactionId: '',
      amount: subscription.amount,
      currency: subscription.currency,
      status: 'pending',
      timestamp: Date.now(),
    };

    paymentsStore.set(payment.id, payment);

    return {
      success: true,
      transactionId: payment.id,
    };
  }

  scheduleNextPayment(subscriptionId: string): void {
    const subscription = subscriptionsStore.get(subscriptionId);

    if (!subscription) {
      return;
    }

    const day = 24 * 60 * 60 * 1000;
    let nextPaymentDate: number;

    switch (subscription.interval) {
      case 'daily':
        nextPaymentDate = Date.now() + day;
        break;
      case 'weekly':
        nextPaymentDate = Date.now() + (7 * day);
        break;
      case 'monthly':
        nextPaymentDate = Date.now() + (30 * day);
        break;
      default:
        nextPaymentDate = Date.now() + (30 * day);
    }

    const updatedSubscription = {
      ...subscription,
      nextPaymentDate,
    };

    subscriptionsStore.set(subscriptionId, updatedSubscription);
  }

  async checkDuePayments(): Promise<Subscription[]> {
    const now = Date.now();
    const dueSubscriptions: Subscription[] = [];

    for (const subscription of subscriptionsStore.values()) {
      if (subscription.status === 'active' && subscription.nextPaymentDate <= now) {
        dueSubscriptions.push(subscription);
      }
    }

    return dueSubscriptions;
  }
}
