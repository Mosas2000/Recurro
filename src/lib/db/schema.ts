export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SubscriptionInterval = 'monthly' | 'weekly' | 'daily';

export interface Subscription {
  id: string;
  creatorAddress: string;
  subscriberAddress: string;
  amount: number;
  currency: 'STX';
  interval: SubscriptionInterval;
  status: SubscriptionStatus;
  nextPaymentDate: number;
  createdAt: number;
  planName?: string;
  description?: string;
  perks?: string[];
}

export interface Payment {
  id: string;
  subscriptionId: string;
  transactionId: string;
  amount: number;
  currency: 'STX';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export const subscriptionsStore = new Map<string, Subscription>();
export const paymentsStore = new Map<string, Payment>();
