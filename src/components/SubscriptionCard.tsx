'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Subscription } from '@/lib/db/schema';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPause?: () => void;
  onResume?: () => void;
}

export function SubscriptionCard({ subscription, onPause, onResume }: SubscriptionCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {subscription.planName || 'Subscription Plan'}
        </CardTitle>
        <CardDescription>
          {truncateAddress(subscription.subscriberAddress)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">
              {subscription.amount} {subscription.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Interval:</span>
            <span className="capitalize">{subscription.interval}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={`capitalize ${
              subscription.status === 'active' ? 'text-green-600' :
              subscription.status === 'paused' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {subscription.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next Payment:</span>
            <span>{formatDate(subscription.nextPaymentDate)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          {subscription.status === 'active' && onPause && (
            <Button variant="outline" size="sm" onClick={onPause}>
              Pause
            </Button>
          )}
          {subscription.status === 'paused' && onResume && (
            <Button variant="outline" size="sm" onClick={onResume}>
              Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
