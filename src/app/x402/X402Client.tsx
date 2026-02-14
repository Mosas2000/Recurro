'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { getWalletConnection } from '@/lib/stacks/wallet';
import {
  Zap,
  Shield,
  Lock,
  Unlock,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Wallet,
  CreditCard,
  Globe,
} from 'lucide-react';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';

interface PremiumResult {
  success: boolean;
  message: string;
  data: any;
  payment: {
    protocol: string;
    paidBy: string;
    transaction: string;
    network: string;
  };
}

export default function PaymentsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading402, setLoading402] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PremiumResult | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const wallet = getWalletConnection();
    setIsConnected(wallet?.connected ?? false);
  }, []);

  const handleConnectionChange = useCallback((conn: WalletConnectionType | null) => {
    setIsConnected(conn?.connected ?? false);
  }, []);

  const handlePayment = async () => {
    setLoading402(true);
    setError('');
    setPaymentResult(null);
    setStep(1);

    try {
      const response = await fetch('/api/x402/premium-content');
      if (response.status !== 402) {
        throw new Error(`Expected payment request but got ${response.status}`);
      }
      const requirements = await response.json();

      setStep(2);
      const requirement = requirements.accepts?.[0];
      if (!requirement) throw new Error('No payment requirements received');

      const wallet = getWalletConnection();
      if (!wallet?.connected) throw new Error('Wallet not connected');

      const { request: walletRequest } = await import('@stacks/connect');
      const result: any = await walletRequest('stx_transferStx', {
        recipient: requirement.payTo,
        amount: requirement.amount,
        memo: `x402:recurro:${Date.now().toString(36)}`.substring(0, 34),
        network: wallet.network === 'testnet' ? 'testnet' : 'mainnet',
      });

      const signedTxHex: string =
        result.transaction ?? result.txRaw ?? result.result?.transaction ?? '';
      if (!signedTxHex) throw new Error('Wallet did not return a signed transaction');

      setStep(3);
      const paymentPayload = {
        x402Version: 2,
        resource: requirements.resource,
        accepted: requirement,
        payload: { transaction: signedTxHex },
      };

      const encoded = btoa(JSON.stringify(paymentPayload));
      const settled = await fetch('/api/x402/premium-content', {
        headers: { 'payment-signature': encoded },
      });

      if (!settled.ok) {
        const errBody = await settled.json().catch(() => ({}));
        throw new Error(errBody.message || `Payment could not be processed (${settled.status})`);
      }

      const data: PremiumResult = await settled.json();
      setPaymentResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep(0);
    } finally {
      setLoading402(false);
    }
  };

  const progressSteps = [
    { label: 'Request', n: 1 },
    { label: 'Confirm', n: 2 },
    { label: 'Settle', n: 3 },
    { label: 'Complete', n: 4 },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Recurro
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <WalletConnect onConnectionChange={handleConnectionChange} />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            Powered by x402
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Instant On-Chain Payments
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pay for premium content and subscriptions directly from your wallet.
            Every transaction is settled on the Stacks blockchain &mdash; fast, secure,
            and transparent.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              How Payments Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Lock className="h-6 w-6" />,
                  title: '1. Access Content',
                  desc: 'Browse premium content and choose what you want to unlock.',
                },
                {
                  icon: <Wallet className="h-6 w-6" />,
                  title: '2. Confirm Payment',
                  desc: 'Your wallet will ask you to approve a small STX payment.',
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: '3. On-Chain Settlement',
                  desc: 'Your payment is broadcast and settled on the Stacks blockchain.',
                },
                {
                  icon: <Unlock className="h-6 w-6" />,
                  title: '4. Content Unlocked',
                  desc: 'Once confirmed, you get instant access to your premium content.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="text-center p-4 rounded-lg bg-muted/50"
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-accent)] text-white">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-2 border-[var(--brand-accent)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[var(--brand-accent)]" />
              Premium Analytics
            </CardTitle>
            <CardDescription>
              Unlock premium subscription analytics and insights for a one-time payment of 0.001 STX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to make a payment.
                </p>
                <WalletConnect onConnectionChange={handleConnectionChange} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  {progressSteps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                          step > s.n || (s.n === 4 && step === 4)
                            ? 'bg-green-500 text-white'
                            : step === s.n
                              ? 'bg-[var(--brand-accent)] text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step > s.n || (s.n === 4 && step === 4) ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : step === s.n ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="text-sm font-semibold">{s.n}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          step >= s.n ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={loading402}
                  size="lg"
                  className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
                >
                  {loading402 ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-5 w-5" />
                  )}
                  {loading402
                    ? step === 1
                      ? 'Requesting payment...'
                      : step === 2
                        ? 'Confirm in your wallet...'
                        : step === 3
                          ? 'Settling on-chain...'
                          : 'Processing...'
                    : 'Unlock Premium Content (0.001 STX)'}
                </Button>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {paymentResult && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800 dark:text-green-200">
                          Payment Successful &mdash; Content Unlocked
                        </h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {paymentResult.message}
                      </p>
                      {paymentResult.payment?.transaction && (
                        <a
                          href={`https://explorer.stacks.co/txid/${paymentResult.payment.transaction}?chain=testnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-accent)] hover:underline font-medium mt-2"
                        >
                          View transaction on Stacks Explorer
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Render the analytics data */}
                    {paymentResult.data && (
                      <div className="space-y-4">
                        {/* Overview Stats */}
                        {paymentResult.data.overview && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(paymentResult.data.overview).map(([key, value]) => (
                              <div key={key} className="p-3 rounded-lg bg-muted/50 text-center">
                                <p className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-lg font-bold mt-1">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recent Plans */}
                        {paymentResult.data.recentPlans && paymentResult.data.recentPlans.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold mb-2">Recent Plans</h5>
                            <div className="space-y-2">
                              {paymentResult.data.recentPlans.map((plan: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                                  <div>
                                    <p className="font-medium">{plan.name}</p>
                                    <p className="text-xs text-muted-foreground">{plan.interval} &middot; Created {plan.created}</p>
                                  </div>
                                  <span className="font-mono font-semibold">{plan.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Insights */}
                        {paymentResult.data.insights && (
                          <div>
                            <h5 className="text-sm font-semibold mb-2">Insights</h5>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(paymentResult.data.insights).map(([key, value]) => (
                                <div key={key} className="p-3 rounded-lg border text-sm">
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </p>
                                  <p className="font-semibold mt-0.5">{String(value)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {paymentResult.data.generatedAt && (
                          <p className="text-xs text-muted-foreground text-right">
                            Generated {new Date(paymentResult.data.generatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 text-[var(--brand-accent)] mb-2" />
              <CardTitle className="text-base">No Middlemen</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Payments go directly from your wallet to the creator. No payment
                processors, no fees beyond gas.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-[var(--brand-accent)] mb-2" />
              <CardTitle className="text-base">On-Chain Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Every payment is cryptographically signed and verifiable on the
                Stacks blockchain.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-[var(--brand-accent)] mb-2" />
              <CardTitle className="text-base">Instant Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No waiting for approvals. Once your transaction is signed,
                content is unlocked immediately.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a
            href="https://www.npmjs.com/package/x402-stacks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">x402-stacks Protocol</p>
              <p className="text-xs text-muted-foreground">Learn about the protocol</p>
            </div>
          </a>
          <a
            href="https://github.com/tony1908/x402Stacks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Open Source</p>
              <p className="text-xs text-muted-foreground">View protocol source code</p>
            </div>
          </a>
          <a
            href="https://github.com/Mosas2000/Recurro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">Recurro on GitHub</p>
              <p className="text-xs text-muted-foreground">View project source</p>
            </div>
          </a>
        </div>
      </div>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            Built with{' '}
            <a
              href="https://www.npmjs.com/package/x402-stacks"
              className="text-[var(--brand-accent)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              x402-stacks
            </a>{' '}
            on Stacks blockchain. Powered by sBTC &amp; STX.
          </p>
        </div>
      </footer>
    </div>
  );
}
