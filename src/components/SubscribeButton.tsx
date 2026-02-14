'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Check } from 'lucide-react';
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

  const handleSubscribe = async () => {
    const wallet = getWalletConnection();

    if (!wallet || !wallet.connected) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      if (response.ok) {
        setIsSubscribed(true);
        onSuccess?.();
      } else {
        alert('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription');
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
    <Button
      onClick={handleSubscribe}
      disabled={isProcessing}
      className="w-full bg-[var(--brand-accent)] hover:bg-[var(--brand-accent)]/90"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isProcessing ? 'Processing...' : 'Subscribe Now'}
    </Button>
  );
}
