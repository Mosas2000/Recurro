'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Zap, ExternalLink, CalendarClock, CreditCard } from 'lucide-react';
import { getWalletConnection } from '@/lib/stacks/wallet';
import { performX402Payment } from '@/lib/x402/client';
import { toast } from 'sonner';

interface SubscriptionResult {
  id: string;
  status: string;
  nextPaymentDate: number;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
}

interface PaymentResult {
  id: string;
  transactionId: string;
  payer: string;
  protocol: string;
}

export interface SubscribeSuccessData {
  subscription: SubscriptionResult;
  payment: PaymentResult;
}

interface SubscribeButtonProps {
  planName: string;
  amount: number;
  currency: 'STX';
  interval: string;
  creatorAddress: string;
  onSuccess?: (data: SubscribeSuccessData) => void;
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
  const [successData, setSuccessData] = useState<SubscribeSuccessData | null>(null);

  const handleSubscribe = async () => {
    const wallet = getWalletConnection();

    if (!wallet || !wallet.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Starting payment…');

    try {
      const { data } = await performX402Payment({
        url: '/api/x402/subscribe',
        method: 'POST',
        body: {
          creatorAddress,
          subscriberAddress: wallet.address,
          amount,
          currency,
          interval,
          planName,
        },
        network: wallet.network === 'testnet' ? 'testnet' : 'mainnet',
        memo: `x402:recurro:${planName}`.substring(0, 34),
        onPaymentRequired: () => setPaymentStatus('Preparing your payment…'),
        onWalletPrompt: () => setPaymentStatus('Please confirm in your wallet…'),
        onSettling: () => setPaymentStatus('Processing your payment…'),
      });

      handleSuccess(data, wallet.address);
    } catch (error: any) {
      console.error('x402 subscription error:', error);
      setPaymentStatus('');
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccess = (data: any, walletAddress: string) => {
    const result: SubscribeSuccessData = {
      subscription: {
        id: data.subscription?.id ?? '',
        status: data.subscription?.status ?? 'active',
        nextPaymentDate: data.subscription?.nextPaymentDate ?? 0,
        planName: data.subscription?.planName ?? planName,
        amount: data.subscription?.amount ?? amount,
        currency: data.subscription?.currency ?? currency,
        interval: data.subscription?.interval ?? interval,
      },
      payment: {
        id: data.payment?.id ?? '',
        transactionId: data.payment?.transactionId ?? '',
        payer: data.payment?.payer ?? walletAddress,
        protocol: data.payment?.protocol ?? 'x402-stacks',
      },
    };

    setSuccessData(result);
    setPaymentStatus('');
    setIsSubscribed(true);

    const txShort = result.payment.transactionId
      ? `${result.payment.transactionId.slice(0, 8)}…${result.payment.transactionId.slice(-6)}`
      : '';
    toast.success('Subscription confirmed!', {
      description: txShort
        ? `Transaction: ${txShort}`
        : `Subscribed to ${planName}`,
      duration: 8000,
    });

    onSuccess?.(result);
  };

  const truncateTx = (tx: string) =>
    tx ? `${tx.slice(0, 8)}…${tx.slice(-6)}` : '';

  const formatDate = (ts: number) =>
    ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const explorerUrl = successData?.payment.transactionId
    ? `https://explorer.hiro.so/txid/${successData.payment.transactionId}?chain=testnet`
    : null;

  if (isSubscribed && successData) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                Subscription Active
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Paid via {successData.payment.protocol}
              </p>
            </div>
          </div>

          {/* Subscription details */}
          <div className="space-y-2 text-xs border-t border-green-200 dark:border-green-800 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" /> Amount
              </span>
              <span className="font-semibold text-green-800 dark:text-green-200">
                {successData.subscription.amount} {successData.subscription.currency}
                <span className="font-normal text-muted-foreground"> / {successData.subscription.interval}</span>
              </span>
            </div>

            {successData.subscription.nextPaymentDate > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" /> Next Payment
                </span>
                <span className="font-medium text-green-800 dark:text-green-200">
                  {formatDate(successData.subscription.nextPaymentDate)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 font-medium capitalize">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {successData.subscription.status}
              </span>
            </div>

            {successData.subscription.id && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subscription ID</span>
                <code className="font-mono text-[10px] text-green-700 dark:text-green-300">
                  {successData.subscription.id.length > 20
                    ? `${successData.subscription.id.slice(0, 16)}…`
                    : successData.subscription.id}
                </code>
              </div>
            )}
          </div>

          {/* Transaction / on-chain receipt */}
          {successData.payment.transactionId && (
            <div className="space-y-2 text-xs border-t border-green-200 dark:border-green-800 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction</span>
                <code className="font-mono text-green-700 dark:text-green-300">
                  {truncateTx(successData.payment.transactionId)}
                </code>
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full mt-2 py-1.5 rounded-md text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
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
