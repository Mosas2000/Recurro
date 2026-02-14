'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Subscription, Payment, paymentsStore } from '@/lib/db/schema';
import { Calendar, CreditCard } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription: Subscription;
  onCancel?: () => void;
}

export function SubscriptionStatus({ subscription, onCancel }: SubscriptionStatusProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const payments = Array.from(paymentsStore.values()).filter(
    (p) => p.subscriptionId === subscription.id
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>Your active subscription information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Next Payment</span>
            </div>
            <span className="font-medium">{formatDate(subscription.nextPaymentDate)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Amount</span>
            </div>
            <span className="font-medium">
              {subscription.amount} {subscription.currency}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Interval</span>
            <span className="font-medium capitalize">{subscription.interval}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`font-medium capitalize ${
              subscription.status === 'active' ? 'text-green-600' :
              subscription.status === 'paused' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {subscription.status}
            </span>
          </div>

          {subscription.status === 'active' && onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              className="w-full mt-4"
            >
              Cancel Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your past subscription payments</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payments yet
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {payment.amount} {payment.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.timestamp)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
