/**
 * x402 Client – Real integration with the x402-stacks SDK
 *
 * This module provides:
 *  1. `handleX402Payment()` – browser-side helper that detects a 402 response,
 *     shows the user what they're paying, signs a STX transfer via the connected
 *     wallet, and retries the request with the `payment-signature` header.
 *  2. `X402ServerVerifier` – thin server-side wrapper around x402-stacks'
 *     `X402PaymentVerifier` for manual verification / settlement.
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
  SettlementResult,
} from './types';

/* ====================================================================
 *  RE-EXPORTS for convenience
 * ==================================================================*/

export { STXtoMicroSTX, X402_HEADERS, STACKS_NETWORKS };

/* ====================================================================
 *  BROWSER-SIDE: handle a 402 response from our own API
 * ==================================================================*/

/**
 * Given a fetch Response with status 402, parse the payment requirements,
 * build and sign a STX transfer transaction via the user's connected wallet,
 * then retry the original request with the `payment-signature` header.
 *
 * Returns the successful Response from the retried request, or throws.
 */
export async function handleX402Payment(
  original402Response: Response,
  originalUrl: string,
  originalOptions: RequestInit = {},
): Promise<Response> {
  // 1. Decode payment requirements from the 402 body
  const body: PaymentRequiredResponse = await original402Response.json();

  if (body.x402Version !== 2 || !body.accepts?.length) {
    throw new Error('Invalid x402 payment requirements');
  }

  const requirement = body.accepts[0]; // pick the first option

  // 2. Determine network and prepare memo
  const isTestnet = requirement.network === STACKS_NETWORKS.TESTNET;
  const memo = `x402:${Date.now().toString(36)}`.substring(0, 34);

  // We need the user's private key → in a browser we DON'T have it.
  // Instead we use @stacks/connect `request('stx_transferStx')` which
  // opens the wallet popup, returns a signed tx hex, and we forward it.
  const { request: walletRequest } = await import('@stacks/connect');

  const result: any = await walletRequest('stx_transferStx', {
    recipient: requirement.payTo,
    amount: requirement.amount, // already in microSTX
    memo,
    network: isTestnet ? 'testnet' : 'mainnet',
  });

  // `result.txid` or `result.transaction` depending on the wallet
  const signedTxHex: string =
    result.transaction ?? result.txRaw ?? result.result?.transaction ?? '';

  if (!signedTxHex) {
    throw new Error('Wallet did not return a signed transaction');
  }

  // 3. Build x402 V2 payment payload
  const paymentPayload: PaymentPayload = {
    x402Version: 2,
    resource: body.resource,
    accepted: requirement,
    payload: {
      transaction: signedTxHex,
    },
  };

  const encoded = btoa(JSON.stringify(paymentPayload));

  // 4. Retry the original request with the payment-signature header
  const retryHeaders = new Headers(originalOptions.headers);
  retryHeaders.set(X402_HEADERS.PAYMENT_SIGNATURE, encoded);

  const retryResponse = await fetch(originalUrl, {
    ...originalOptions,
    headers: retryHeaders,
  });

  if (!retryResponse.ok) {
    const errBody = await retryResponse.json().catch(() => ({}));
    throw new Error(errBody.message ?? `Payment retry failed: ${retryResponse.status}`);
  }

  return retryResponse;
}

/**
 * Convenience wrapper: fetch a URL and automatically handle 402.
 *
 * Usage (browser):
 * ```ts
 * const res = await fetchWithX402('/api/x402/premium-content');
 * const data = await res.json();
 * ```
 */
export async function fetchWithX402(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 402) {
    return handleX402Payment(response, url, options);
  }

  return response;
}

/* ====================================================================
 *  SERVER-SIDE: verifier / settler
 * ==================================================================*/

const DEFAULT_FACILITATOR =
  process.env.X402_FACILITATOR_URL ??
  process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
  'https://x402-backend-7eby.onrender.com';

/**
 * Server-side verifier that wraps x402-stacks' `X402PaymentVerifier`.
 */
export class X402ServerVerifier {
  private verifier: X402PaymentVerifier;

  constructor(facilitatorUrl: string = DEFAULT_FACILITATOR) {
    this.verifier = new X402PaymentVerifier(facilitatorUrl);
  }

  async settle(
    paymentPayload: PaymentPayload,
    payTo: string,
    amount: string | bigint,
    network: 'testnet' | 'mainnet' = 'testnet',
    asset: string = 'STX',
  ): Promise<SettlementResult> {
    const caip2 = network === 'testnet' ? STACKS_NETWORKS.TESTNET : STACKS_NETWORKS.MAINNET;

    const paymentRequirements = {
      scheme: 'exact' as const,
      network: caip2,
      amount: amount.toString(),
      asset,
      payTo,
      maxTimeoutSeconds: 300,
    };

    return this.verifier.settle(paymentPayload as any, { paymentRequirements } as any);
  }

  async verify(
    paymentPayload: PaymentPayload,
    payTo: string,
    amount: string | bigint,
    network: 'testnet' | 'mainnet' = 'testnet',
    asset: string = 'STX',
  ) {
    const caip2 = network === 'testnet' ? STACKS_NETWORKS.TESTNET : STACKS_NETWORKS.MAINNET;

    const paymentRequirements = {
      scheme: 'exact' as const,
      network: caip2,
      amount: amount.toString(),
      asset,
      payTo,
      maxTimeoutSeconds: 300,
    };

    return this.verifier.verify(paymentPayload as any, { paymentRequirements } as any);
  }

  async getSupported() {
    return this.verifier.getSupported();
  }
}

