'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
import { Users, TrendingUp, Zap, Copy, Check } from 'lucide-react';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
  });

  // ---- fetch subscriptions from the SERVER via API ----
  const loadData = useCallback(async (address: string) => {
    try {
      const res = await fetch(
        `/api/subscriptions?creatorAddress=${encodeURIComponent(address)}`
      );
      if (!res.ok) return;

      const allSubs: Subscription[] = await res.json();
      const activeSubs = allSubs.filter((s) => s.status === 'active');
      const monthlyRevenue = activeSubs.reduce((sum, s) => {
        const mult =
          s.interval === 'weekly' ? 4 : s.interval === 'daily' ? 30 : 1;
        return sum + s.amount * mult;
      }, 0);

      setSubscriptions(allSubs);
      setStats({
        totalSubscribers: allSubs.filter(
          (s) => s.subscriberAddress !== 'placeholder'
        ).length,
        monthlyRevenue,
        activeSubscriptions: activeSubs.length,
      });
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    });
    loadData(walletAddress);
  };

  const handleResume = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
                {stats.monthlyRevenue.toFixed(4)} sBTC
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

        {/* subscriptions */}
        <h2 className="text-2xl font-bold mb-4">Subscriptions</h2>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No subscriptions yet. Create your first plan to get started.
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
        <Link href="/" className="text-2xl font-bold">
          Recurro
        </Link>
        <WalletConnect onConnectionChange={onConnectionChange} />
      </div>
    </header>
  );
}
