'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { CreatePlanModal } from '@/components/CreatePlanModal';
import { WalletConnect } from '@/components/WalletConnect';
import { getWalletConnection } from '@/lib/stacks/wallet';
import type { Subscription } from '@/lib/db/schema';
import { Users, TrendingUp, Zap, Copy, Check, ArrowDownLeft, ArrowUpRight, ExternalLink, Clock } from 'lucide-react';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';

interface PaymentRecord {
  id: string;
  type: 'incoming' | 'outgoing';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  timestamp: number;
  planName: string;
  interval: string;
  counterparty: string;
  subscriptionId: string;
}

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
  });

  // ---- fetch subscriptions from the SERVER via API ----
  const loadData = useCallback(async (address: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/subscriptions?creatorAddress=${encodeURIComponent(address)}`
      );
      if (!res.ok) return;

      const allSubs: Subscription[] = await res.json();
      const activeSubs = allSubs.filter((s) => s.status === 'active');
      const realSubscribers = allSubs.filter(
        (s) => s.subscriberAddress !== 'placeholder' && s.subscriberAddress !== 'plan_template'
      );
      const monthlyRevenue = realSubscribers
        .filter((s) => s.status === 'active')
        .reduce((sum, s) => {
          const mult =
            s.interval === 'weekly' ? 4 : s.interval === 'daily' ? 30 : 1;
          return sum + s.amount * mult;
        }, 0);

      setSubscriptions(allSubs);
      setStats({
        totalSubscribers: realSubscribers.length,
        monthlyRevenue,
        activeSubscriptions: activeSubs.length,
      });

      // Fetch transaction history
      try {
        const payRes = await fetch(
          `/api/payments?address=${encodeURIComponent(address)}`
        );
        if (payRes.ok) {
          const payData: PaymentRecord[] = await payRes.json();
          setPayments(payData);
        }
      } catch {
        // Non-critical — dashboard still works without history
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---- hydrate wallet from localStorage on mount ----
  useEffect(() => {
    const wallet = getWalletConnection();
    if (wallet?.connected && wallet.address) {
      setWalletAddress(wallet.address);
      setIsConnected(true);
      loadData(wallet.address);
    }
  }, [loadData]);

  // ---- called by <WalletConnect /> ----
  const handleConnectionChange = useCallback(
    (conn: WalletConnectionType | null) => {
      if (conn?.connected && conn.address) {
        setWalletAddress(conn.address);
        setIsConnected(true);
        loadData(conn.address);
      } else {
        setWalletAddress('');
        setIsConnected(false);
        setSubscriptions([]);
        setStats({
          totalSubscribers: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
        });
      }
    },
    [loadData]
  );

  // ---- subscription actions (already API-driven) ----
  const handlePause = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
      body: JSON.stringify({ status: 'paused' }),
    });
    loadData(walletAddress);
  };

  const handleResume = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
      body: JSON.stringify({ status: 'active' }),
    });
    loadData(walletAddress);
  };

  const copySubscribeLink = () => {
    const url = `${window.location.origin}/subscribe/${walletAddress}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==================================================================
  // RENDER — wallet not connected
  // ==================================================================
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header onConnectionChange={handleConnectionChange} />
        <div className="container mx-auto max-w-md py-24 px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Zap className="h-8 w-8 text-[var(--brand-accent)]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-8">
            Connect a Stacks wallet to access your creator dashboard and start
            accepting recurring payments.
          </p>
          <WalletConnect onConnectionChange={handleConnectionChange} />
        </div>
      </div>
    );
  }

  // ==================================================================
  // RENDER — dashboard
  // ==================================================================
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header onConnectionChange={handleConnectionChange} />

      <div className="container mx-auto py-8 px-4">
        {/* heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your subscription plans
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copySubscribeLink}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy Subscribe Link'}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
            >
              Create Plan
            </Button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalSubscribers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthlyRevenue.toFixed(4)} STX
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeSubscriptions}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* plans & subscriptions */}
        <h2 className="text-2xl font-bold mb-4">Your Plans</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No plans yet. Create your first plan to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onPause={() => handlePause(sub.id)}
                onResume={() => handleResume(sub.id)}
              />
            ))}
          </div>
        )}

        {/* ---- Transaction History ---- */}
        <h2 className="text-2xl font-bold mt-12 mb-4">Transaction History</h2>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No transactions yet. Payments will appear here once subscribers start paying.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {payments.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    {/* icon + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          tx.type === 'incoming'
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {tx.type === 'incoming' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.planName}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            · {tx.interval}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {tx.type === 'incoming' ? 'From' : 'To'}{' '}
                          {tx.counterparty.slice(0, 8)}…{tx.counterparty.slice(-4)}
                        </p>
                      </div>
                    </div>

                    {/* amount + status */}
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold ${
                          tx.type === 'incoming'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-foreground'
                        }`}
                      >
                        {tx.type === 'incoming' ? '+' : '-'}
                        {tx.amount} {tx.currency}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            tx.status === 'completed'
                              ? 'bg-green-500'
                              : tx.status === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {tx.status}
                        </span>
                        {tx.transactionId && (
                          <a
                            href={`https://explorer.hiro.so/txid/${tx.transactionId}?chain=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-[var(--brand-accent)] transition-colors"
                            title="View on explorer"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* date */}
                    <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap shrink-0 w-24 text-right">
                      {new Date(tx.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      <br />
                      {new Date(tx.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* modal */}
      {showCreateModal && (
        <CreatePlanModal
          creatorAddress={walletAddress}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => loadData(walletAddress)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared header                                                       */
/* ------------------------------------------------------------------ */
function Header({
  onConnectionChange,
}: {
  onConnectionChange: (c: WalletConnectionType | null) => void;
}) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <Image src="/logo.png" alt="Recurro" width={120} height={40} className="h-9 w-auto" />
        </Link>
        <WalletConnect onConnectionChange={onConnectionChange} />
      </div>
    </header>
  );
}
