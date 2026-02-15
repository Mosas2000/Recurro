import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, Clock, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <Image src="/logo.png" alt="Recurro" width={120} height={40} className="h-9 w-auto" priority />
          </Link>
          <nav className="flex gap-4">
            <Link href="/x402">
              <Button variant="ghost">Payments</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Powered by x402-stacks — HTTP 402 Payments
        </div>
        <h1 className="text-5xl font-bold mb-4">
          Bitcoin-Native <span className="text-[var(--brand-accent)]">Recurring Payments</span>
        </h1>
        <p className="text-xl text-muted-foreground mt-6 mb-8 max-w-2xl mx-auto">
          Accept STX &amp; sBTC subscriptions with zero middlemen. Payments settle
          on-chain via the x402 payment protocol — no API keys, no intermediaries.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
            >
              Start Accepting Payments
            </Button>
          </Link>
          <Link href="/x402">
            <Button size="lg" variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Try It Now
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>x402 Protocol</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Uses the HTTP 402 Payment Required standard. APIs return payment
                requirements, clients pay automatically with STX.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bitcoin className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Bitcoin Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All payments settled on Bitcoin via sBTC &amp; STX. True
                decentralization with the security of the Bitcoin network.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Flexible Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create daily, weekly, or monthly subscription plans.
                Subscribers pay via x402 with a single wallet confirmation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Secure Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Every payment is cryptographically signed and settled on-chain.
                Zero fraud, no double-spending, and instant confirmation.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Wallet',
                desc: 'Connect your Leather or Xverse wallet to get started. No email or registration required.',
              },
              {
                step: '2',
                title: 'Create Plan',
                desc: 'Set your pricing in STX or sBTC. Choose monthly, weekly, or daily billing intervals.',
              },
              {
                step: '3',
                title: 'x402 Payment',
                desc: 'Subscribers pay through the x402 protocol. Their wallet signs an STX transfer — no intermediaries involved.',
              },
              {
                step: '4',
                title: 'On-Chain Settlement',
                desc: 'Your signed transaction is broadcast to the Stacks network and confirmed on-chain.',
              },
            ].map((item) => (
              <Card key={item.step} className="bg-background">
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-[var(--brand-accent)] text-white flex items-center justify-center text-xl font-bold mb-4">
                    {item.step}
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Connect your wallet and start accepting Bitcoin payments via x402
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/x402">
            <Button size="lg" variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Try It Now
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
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
            on Stacks. Powered by sBTC &amp; STX.
          </p>
        </div>
      </footer>
    </div>
  );
}
