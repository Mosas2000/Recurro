'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubscribeButton } from '@/components/SubscribeButton';
import type { SubscribeSuccessData } from '@/components/SubscribeButton';
import { WalletConnect } from '@/components/WalletConnect';
import { getWalletConnection } from '@/lib/stacks/wallet';
import type { Subscription } from '@/lib/db/schema';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';
import { CheckCircle2, ExternalLink, PartyPopper, CalendarClock, CreditCard } from 'lucide-react';

interface CompletedSubscription {
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  transactionId: string;
  subscriptionId: string;
  nextPaymentDate: number;
  status: string;
}

export default function SubscribePage({
  params,
}: {
  params: Promise<{ creatorAddress: string }>;
}) {
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [creatorAddress, setCreatorAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedSubs, setCompletedSubs] = useState<CompletedSubscription[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);

  // ---- fetch plans from the SERVER via API ----
  const loadPlans = useCallback(async (address: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/subscriptions?creatorAddress=${encodeURIComponent(address)}`
      );
      if (!res.ok) return;
      const all: Subscription[] = await res.json();
      // "plans" are templates (not real subscriber subscriptions)
      setPlans(all.filter((s) => s.subscriberAddress === 'placeholder' || s.subscriberAddress === 'plan_template'));

      // Also load current user's active subscriptions to this creator
      const wallet = getWalletConnection();
      if (wallet?.connected && wallet.address) {
        const mySubs = all.filter(
          (s) =>
            s.subscriberAddress !== 'placeholder' &&
            s.subscriberAddress !== 'plan_template' &&
            s.subscriberAddress === wallet.address &&
            s.status === 'active'
        );
        setMySubscriptions(mySubs);
      }
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
          <Link href="/">
            <Image src="/logo.png" alt="Recurro" width={120} height={40} className="h-9 w-auto" />
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

        {completedSubs.length > 0 && (
          <div className="mb-6 space-y-3">
            {completedSubs.map((sub, i) => (
              <Card key={i} className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          Successfully subscribed to {sub.planName}!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                          {sub.amount} {sub.currency} / {sub.interval} — payment confirmed on-chain
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="capitalize">{sub.status}</span>
                        </div>
                        {sub.nextPaymentDate > 0 && (
                          <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                            <CalendarClock className="h-3 w-3" />
                            <span>Next: {new Date(sub.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {sub.transactionId && (
                        <a
                          href={`https://explorer.hiro.so/txid/${sub.transactionId}?chain=testnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-300 hover:underline"
                        >
                          View transaction on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    onSuccess={(data: SubscribeSuccessData) => {
                      setCompletedSubs((prev) => [
                        ...prev,
                        {
                          planName: data.subscription.planName,
                          amount: data.subscription.amount,
                          currency: data.subscription.currency,
                          interval: data.subscription.interval,
                          transactionId: data.payment.transactionId,
                          subscriptionId: data.subscription.id,
                          nextPaymentDate: data.subscription.nextPaymentDate,
                          status: data.subscription.status,
                        },
                      ]);
                      loadPlans(creatorAddress);
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Active subscriptions for current wallet */}
        {isConnected && mySubscriptions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Your Active Subscriptions</h2>
            <div className="space-y-3">
              {mySubscriptions.map((sub) => (
                <Card key={sub.id} className="border-blue-200 dark:border-blue-800">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{sub.planName ?? 'Subscription'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {sub.amount} {sub.currency} / {sub.interval}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            Next: {new Date(sub.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
