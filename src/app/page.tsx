import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Recurro</div>
          <nav className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Bitcoin-Native <span className="text-[var(--brand-accent)]">Recurring Payments</span>
        </h1>
        <p className="text-xl text-muted-foreground mt-6 mb-8">
          Accept sBTC subscriptions with zero middlemen
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
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Bitcoin className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Bitcoin Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All payments settled on Bitcoin via sBTC. True decentralization with the security
                of the Bitcoin network.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Automated Recurring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set up once and forget. Automatic payment processing for monthly, weekly, or daily
                subscriptions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-[var(--brand-accent)] mb-4" />
              <CardTitle>Zero Intermediaries</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Direct creator-to-subscriber payments. No payment processors, no middlemen, no
                platform fees.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[var(--brand-accent)] text-white flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <CardTitle>Connect Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect your Leather or Xverse wallet to get started. No email or registration
                  required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[var(--brand-accent)] text-white flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <CardTitle>Create Subscription Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Set your pricing in sBTC or STX. Choose monthly, weekly, or daily billing
                  intervals.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-[var(--brand-accent)] text-white flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <CardTitle>Accept sBTC Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Share your subscription link. Payments are automatically processed and verified
                  on-chain.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Connect your wallet and start accepting Bitcoin payments
        </p>
        <Link href="/dashboard">
          <Button
            size="lg"
            className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
          >
            Get Started
          </Button>
        </Link>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>Built on Stacks. Powered by sBTC.</p>
        </div>
      </footer>
    </div>
  );
}
