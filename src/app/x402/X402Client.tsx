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
  ArrowRight,
  Shield,
  Globe,
  Lock,
  Unlock,
  Code,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import type { WalletConnection as WalletConnectionType } from '@/types/wallet';

interface X402Status {
  x402: {
    version: number;
    protocol: string;
    npmPackage: string;
    headers: Record<string, string>;
    networks: Record<string, string>;
  };
  config: {
    network: string;
    networkCAIP2: string;
    creatorAddress: string;
    facilitatorUrl: string;
    facilitatorStatus: string;
  };
  endpoints: Record<string, { url: string; method: string; price: string; description: string }>;
  flow: string[];
}

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

export default function X402DemoPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<X402Status | null>(null);
  const [loading402, setLoading402] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PremiumResult | null>(null);
  const [raw402, setRaw402] = useState<any>(null);
  const [step, setStep] = useState(0); // 0=idle, 1=402, 2=signing, 3=settling, 4=done
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  // Load x402 status on mount
  useEffect(() => {
    fetch('/api/x402/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(console.error);

    const wallet = getWalletConnection();
    setIsConnected(wallet?.connected ?? false);
  }, []);

  const handleConnectionChange = useCallback((conn: WalletConnectionType | null) => {
    setIsConnected(conn?.connected ?? false);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  /**
   * Demo: trigger the full x402 flow against /api/x402/premium-content
   */
  const handleX402Demo = async () => {
    setLoading402(true);
    setError('');
    setPaymentResult(null);
    setRaw402(null);
    setStep(1);

    try {
      // Step 1: Request the paywall endpoint → expect 402
      const response = await fetch('/api/x402/premium-content');

      if (response.status !== 402) {
        throw new Error(`Expected HTTP 402 but got ${response.status}`);
      }

      const requirements = await response.json();
      setRaw402(requirements);

      // Step 2: Sign via wallet
      setStep(2);
      const requirement = requirements.accepts?.[0];
      if (!requirement) throw new Error('No payment requirements in 402 response');

      const wallet = getWalletConnection();
      if (!wallet?.connected) throw new Error('Wallet not connected');

      const { request: walletRequest } = await import('@stacks/connect');
      const result: any = await walletRequest('stx_transferStx', {
        recipient: requirement.payTo,
        amount: requirement.amount,
        memo: `x402:demo:${Date.now().toString(36)}`.substring(0, 34),
        network: wallet.network === 'testnet' ? 'testnet' : 'mainnet',
      });

      const signedTxHex: string =
        result.transaction ?? result.txRaw ?? result.result?.transaction ?? '';

      if (!signedTxHex) throw new Error('Wallet returned no signed tx');

      // Step 3: Settle via facilitator
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
        throw new Error(errBody.message || `Settlement failed: ${settled.status}`);
      }

      const data: PremiumResult = await settled.json();
      setPaymentResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setStep(0);
    } finally {
      setLoading402(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
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

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            x402-stacks Integration
          </div>
          <h1 className="text-4xl font-bold mb-4">
            HTTP 402 Payment Protocol Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Recurro uses the <strong>x402-stacks</strong> SDK to enable native HTTP-level
            payments on Stacks. APIs return <code className="text-sm bg-muted px-1.5 py-0.5 rounded">402 Payment Required</code> and
            clients pay automatically with STX.
          </p>
        </div>

        {/* Protocol Status */}
        {status && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                x402 Protocol Status
              </CardTitle>
              <CardDescription>Live configuration for this deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SDK</span>
                    <span className="font-mono">{status.x402.npmPackage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protocol Version</span>
                    <span className="font-mono">v{status.x402.version} (Coinbase-compatible)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-mono">{status.config.networkCAIP2}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Facilitator</span>
                    <span className="flex items-center gap-1.5">
                      {status.config.facilitatorStatus === 'connected' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {status.config.facilitatorUrl}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Creator Address</span>
                    <span className="font-mono text-xs">
                      {status.config.creatorAddress.slice(0, 8)}…
                      {status.config.creatorAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Headers</span>
                    <span className="font-mono text-xs">
                      payment-required, payment-signature, payment-response
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              How x402 Works in Recurro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Lock className="h-6 w-6" />,
                  title: '1. Request Resource',
                  desc: 'Client requests a paywall-protected API endpoint',
                },
                {
                  icon: <Code className="h-6 w-6" />,
                  title: '2. HTTP 402 Response',
                  desc: 'Server responds with 402 + payment-required header (base64 JSON)',
                },
                {
                  icon: <Zap className="h-6 w-6" />,
                  title: '3. Sign & Pay',
                  desc: 'Client signs STX transfer via wallet, sends payment-signature header',
                },
                {
                  icon: <Unlock className="h-6 w-6" />,
                  title: '4. Settle & Serve',
                  desc: 'Facilitator broadcasts tx, server confirms and serves resource',
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

        {/* Interactive Demo */}
        <Card className="mb-8 border-2 border-[var(--brand-accent)]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[var(--brand-accent)]" />
              Live x402 Payment Demo
            </CardTitle>
            <CardDescription>
              Try the full HTTP 402 flow against <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/x402/premium-content</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to try the x402 payment demo
                </p>
                <WalletConnect onConnectionChange={handleConnectionChange} />
              </div>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="flex items-center justify-between text-sm">
                  {[
                    { label: 'Request', n: 1 },
                    { label: '402 Received', n: 1 },
                    { label: 'Sign TX', n: 2 },
                    { label: 'Settle', n: 3 },
                    { label: 'Done', n: 4 },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 ${
                        step >= s.n ? 'text-[var(--brand-accent)]' : 'text-muted-foreground'
                      }`}
                    >
                      {step > s.n || (s.n === 4 && step === 4) ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : step === s.n ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-current" />
                      )}
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleX402Demo}
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
                      ? 'Requesting (HTTP 402)…'
                      : step === 2
                        ? 'Sign in Wallet…'
                        : step === 3
                          ? 'Settling via Facilitator…'
                          : 'Processing…'
                    : 'Try x402 Payment (0.001 STX)'}
                </Button>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Raw 402 Response */}
                {raw402 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">HTTP 402 Response (payment-required)</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(raw402, null, 2), '402')}
                      >
                        {copied === '402' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-48">
                      {JSON.stringify(raw402, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Success Result */}
                {paymentResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Payment Settled — Resource Unlocked
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(paymentResult, null, 2), 'result')
                        }
                      >
                        {copied === 'result' ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                      {JSON.stringify(paymentResult, null, 2)}
                    </pre>
                    {paymentResult.payment?.transaction && (
                      <a
                        href={`https://explorer.stacks.co/txid/${paymentResult.payment.transaction}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[var(--brand-accent)] hover:underline"
                      >
                        View on Stacks Explorer
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* API Endpoints */}
        {status && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                x402-Protected API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(status.endpoints).map(([key, ep]) => (
                  <div key={key} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                        ep.method === 'GET'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">{ep.url}</code>
                      <p className="text-xs text-muted-foreground mt-1">{ep.description}</p>
                    </div>
                    <span className="text-sm font-mono whitespace-nowrap">
                      {ep.price}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Server Side (Next.js API Routes)</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <code className="text-xs">withX402Paywall()</code> middleware wraps any route handler
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Uses <code className="text-xs">X402PaymentVerifier</code> from x402-stacks
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Sends 402 + base64 payment-required header
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Settles signed tx via facilitator /settle endpoint
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Client Side (Browser)</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Detects HTTP 402 response, parses requirements
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Signs STX transfer via <code className="text-xs">@stacks/connect</code> wallet
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Retries with <code className="text-xs">payment-signature</code> header
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    Reads <code className="text-xs">payment-response</code> header for tx details
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a
            href="https://www.npmjs.com/package/x402-stacks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-semibold text-sm">x402-stacks on npm</p>
              <p className="text-xs text-muted-foreground">v2.0.1 – npm package</p>
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
              <p className="font-semibold text-sm">x402Stacks on GitHub</p>
              <p className="text-xs text-muted-foreground">Protocol source code</p>
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
              <p className="text-xs text-muted-foreground">This project&apos;s source</p>
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
