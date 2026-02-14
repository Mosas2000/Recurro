'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Check, Loader2, Zap } from 'lucide-react';
import { getWalletConnection } from '@/lib/stacks/wallet';

interface SubscribeButtonProps {
  planName: string;
  amount: number;
  currency: 'sBTC' | 'STX';
  interval: string;
  creatorAddress: string;
  onSuccess?: () => void;
}

export function SubscribeButton({
  planName,
  amount,
  currency,
  interval,
  creatorAddress,
  onSuccess,
}: SubscribeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handleSubscribe = async () => {
    const wallet = getWalletConnection();

    if (!wallet || !wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Starting payment…');

    try {
      // Step 1: Hit the x402-gated subscribe endpoint – expect a 402
      setPaymentStatus('Preparing your payment…');
      const initial = await fetch('/api/x402/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress,
          subscriberAddress: wallet.address,
          amount,
          currency,
          interval,
          planName,
        }),
      });

      if (initial.status === 402) {
        // Step 2: Parse the 402 requirements
        const requirements = await initial.json();
        setPaymentStatus('Please confirm in your wallet…');

        // Step 3: Sign the transaction through the wallet
        const { request: walletRequest } = await import('@stacks/connect');
        const requirement = requirements.accepts?.[0];

        if (!requirement) {
          throw new Error('No payment requirements received');
        }

        // Use stx_transferStx to sign the transfer (wallet popup)
        const result: any = await walletRequest('stx_transferStx', {
          recipient: requirement.payTo,
          amount: requirement.amount,
          memo: `x402:recurro:${planName}`.substring(0, 34),
          network: wallet.network === 'testnet' ? 'testnet' : 'mainnet',
        });

        const signedTxHex: string =
          result.transaction ?? result.txRaw ?? result.result?.transaction ?? '';

        if (!signedTxHex) {
          throw new Error('Wallet did not return a signed transaction');
        }

        // Step 4: Build x402 payment payload and retry
        setPaymentStatus('Processing your payment…');
        const paymentPayload = {
          x402Version: 2,
          resource: requirements.resource,
          accepted: requirement,
          payload: { transaction: signedTxHex },
        };

        const encoded = btoa(JSON.stringify(paymentPayload));

        const settled = await fetch('/api/x402/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'payment-signature': encoded,
          },
          body: JSON.stringify({
            creatorAddress,
            subscriberAddress: wallet.address,
            amount,
            currency,
            interval,
            planName,
          }),
        });

        if (settled.ok) {
          const data = await settled.json();
          setPaymentStatus('');
          setIsSubscribed(true);
          onSuccess?.();
        } else {
          const err = await settled.json().catch(() => ({}));
          throw new Error(err.message ?? `Settlement failed: ${settled.status}`);
        }
      } else if (initial.ok) {
        // Somehow succeeded without 402 (e.g. payment was already in headers)
        setPaymentStatus('');
        setIsSubscribed(true);
        onSuccess?.();
      } else {
        const err = await initial.json().catch(() => ({}));
        throw new Error(err.error ?? 'Subscription request failed');
      }
    } catch (error: any) {
      console.error('x402 subscription error:', error);
      setPaymentStatus('');
      alert(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSubscribed) {
    return (
      <Button disabled className="w-full">
        <Check className="mr-2 h-4 w-4" />
        Subscribed
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSubscribe}
        disabled={isProcessing}
        className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {isProcessing ? 'Processing…' : 'Subscribe Now'}
      </Button>
      {paymentStatus && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          {paymentStatus}
        </p>
      )}
    </div>
  );
}
