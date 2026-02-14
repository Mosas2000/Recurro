'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubscribeButton } from '@/components/SubscribeButton';
import { WalletConnect } from '@/components/WalletConnect';
import { getWalletConnection } from '@/lib/stacks/wallet';
import type { Subscription } from '@/lib/db/schema';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';
import { CheckCircle2 } from 'lucide-react';

export default function SubscribePage({
  params,
}: {
  params: Promise<{ creatorAddress: string }>;
}) {
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [creatorAddress, setCreatorAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---- fetch plans from the SERVER via API ----
  const loadPlans = useCallback(async (address: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscriptions?creatorAddress=${encodeURIComponent(address)}`
      );
      if (!res.ok) return;
      const all: Subscription[] = await res.json();
      // "plans" are subscriptions with a placeholder subscriber (i.e. templates)
      setPlans(all.filter((s) => s.subscriberAddress === 'placeholder'));
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setCreatorAddress(p.creatorAddress);
      loadPlans(p.creatorAddress);
    });
    const wallet = getWalletConnection();
    setIsConnected(wallet?.connected ?? false);
  }, [params, loadPlans]);

  const handleConnectionChange = useCallback(
    (conn: WalletConnectionType | null) => {
      setIsConnected(conn?.connected ?? false);
    },
    []
  );

  const truncate = (addr: string) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Recurro
          </Link>
          <WalletConnect onConnectionChange={handleConnectionChange} />
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscribe to Creator</h1>
          <p className="text-muted-foreground font-mono">
            {truncate(creatorAddress)}
          </p>
        </div>

        {!isConnected && (
          <Card className="mb-6 border-yellow-300 dark:border-yellow-700">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Connect your wallet to subscribe to plans.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-muted-foreground text-center py-12">
            Loading plans…
          </p>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No subscription plans available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.planName}</CardTitle>
                  <CardDescription className="capitalize">
                    {plan.interval} subscription
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {plan.amount} {plan.currency}
                    <span className="text-sm font-normal text-muted-foreground">
                      /
                      {plan.interval === 'monthly'
                        ? 'mo'
                        : plan.interval === 'weekly'
                          ? 'wk'
                          : 'day'}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                  {plan.perks && plan.perks.length > 0 && (
                    <ul className="space-y-1.5">
                      {plan.perks.map((perk, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <SubscribeButton
                    planName={plan.planName ?? 'Plan'}
                    amount={plan.amount}
                    currency={plan.currency}
                    interval={plan.interval}
                    creatorAddress={creatorAddress}
                    onSuccess={() => loadPlans(creatorAddress)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
