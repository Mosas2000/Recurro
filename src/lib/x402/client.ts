/**
 * x402 Client – Integration with the x402-stacks SDK
 *
 * Provides shared helpers for the x402 payment flow:
 *  - `performX402Payment()` – reusable 402→sign→settle flow used by
 *    SubscribeButton and X402Client
 *  - Re-exports from x402-stacks for convenience
 */

import {
  X402PaymentVerifier,
  STXtoMicroSTX,
  STACKS_NETWORKS,
  X402_HEADERS,
} from 'x402-stacks';

import type {
  PaymentRequiredResponse,
  PaymentPayload,
} from './types';

/* ====================================================================
 *  RE-EXPORTS for convenience
 * ==================================================================*/

export { STXtoMicroSTX, X402_HEADERS, STACKS_NETWORKS, X402PaymentVerifier };

/* ====================================================================
 *  SHARED x402 PAYMENT FLOW
 *  Used by SubscribeButton and X402Client to avoid code duplication
 * ==================================================================*/

export interface X402PaymentOptions {
  /** URL to hit (e.g. '/api/x402/subscribe') */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST';
  /** Request body (for POST) */
  body?: Record<string, unknown>;
  /** Wallet network ('testnet' | 'mainnet') */
  network: 'testnet' | 'mainnet';
  /** Memo string for the transaction */
  memo?: string;
  /** Callback when 402 is received */
  onPaymentRequired?: () => void;
  /** Callback when wallet popup is shown */
  onWalletPrompt?: () => void;
  /** Callback when settlement is in progress */
  onSettling?: () => void;
}

export interface X402PaymentResult {
  /** The parsed JSON body from the successful response */
  data: any;
  /** The raw Response object */
  response: Response;
}

/**
 * Perform a complete x402 payment flow:
 * 1. Hit the endpoint → expect 402
 * 2. Parse payment requirements
 * 3. Sign STX transfer via wallet
 * 4. Retry with payment-signature header
 *
 * Throws on any failure.
 */
export async function performX402Payment(
  options: X402PaymentOptions,
): Promise<X402PaymentResult> {
  const {
    url,
    method = 'GET',
    body,
    network,
    memo = `x402:recurro:${Date.now().toString(36)}`.substring(0, 34),
    onPaymentRequired,
    onWalletPrompt,
    onSettling,
  } = options;

  const fetchOptions: RequestInit = {
    method,
    ...(body ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : {}),
  };

  // Step 1: Hit endpoint – expect 402
  const initial = await fetch(url, fetchOptions);

  if (initial.ok) {
    // Already succeeded (no payment needed)
    const data = await initial.json();
    return { data, response: initial };
  }

  if (initial.status !== 402) {
    const err = await initial.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `Unexpected status: ${initial.status}`);
  }

  onPaymentRequired?.();

  // Step 2: Parse 402 requirements
  const requirements: PaymentRequiredResponse = await initial.json();
  const requirement = requirements.accepts?.[0];

  if (!requirement) {
    throw new Error('No payment requirements received');
  }

  // Step 3: Sign via wallet
  onWalletPrompt?.();
  const { request: walletRequest } = await import('@stacks/connect');

  const result: any = await walletRequest('stx_transferStx', {
    recipient: requirement.payTo,
    amount: requirement.amount,
    memo,
    network: network === 'testnet' ? 'testnet' : 'mainnet',
  });

  const signedTxHex: string =
    result.transaction ?? result.txRaw ?? result.result?.transaction ?? '';

  if (!signedTxHex) {
    throw new Error('Wallet did not return a signed transaction');
  }

  // Step 4: Build x402 payload and retry
  onSettling?.();
  const paymentPayload: PaymentPayload = {
    x402Version: 2,
    resource: requirements.resource,
    accepted: requirement,
    payload: { transaction: signedTxHex },
  };

  const encoded = btoa(JSON.stringify(paymentPayload));

  const retryHeaders: Record<string, string> = {
    [X402_HEADERS.PAYMENT_SIGNATURE]: encoded,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  };

  const settled = await fetch(url, {
    method,
    headers: retryHeaders,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!settled.ok) {
    const errBody = await settled.json().catch(() => ({}));
    throw new Error(errBody.message ?? `Payment settlement failed: ${settled.status}`);
  }

  const data = await settled.json();
  return { data, response: settled };
}

