'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Subscription } from '@/lib/db/schema';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPause?: () => void;
  onResume?: () => void;
}

const planColors = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
];

export function SubscriptionCard({ subscription, onPause, onResume }: SubscriptionCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Assign a consistent color based on the plan name
  const colorIndex = (subscription.planName || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % planColors.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-lg">
            {subscription.planName || 'Subscription Plan'}
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planColors[colorIndex]}`}>
            {subscription.interval}
          </span>
        </div>
        <CardDescription className="text-base font-semibold">
          {subscription.amount} {subscription.currency}
          <span className="text-muted-foreground font-normal text-sm"> / {subscription.interval}</span>
        </CardDescription>
        {subscription.subscriberAddress !== 'placeholder' && (
          <p className="text-xs text-muted-foreground mt-1">
            Subscriber: {truncateAddress(subscription.subscriberAddress)}
          </p>
        )}
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
        
        {subscription.perks && subscription.perks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Includes:</p>
            <ul className="space-y-1">
              {subscription.perks.map((perk, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
