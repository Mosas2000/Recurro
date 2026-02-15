/**
 * x402 Middleware for Next.js API Routes
 *
 * Since x402-stacks ships Express middleware and Recurro uses Next.js
 * App Router, this module re-implements the same HTTP 402 flow using
 * the x402-stacks `X402PaymentVerifier` directly.
 *
 * Flow:
 *  1. Client requests a paywall-protected route
 *  2. If no `payment-signature` header → respond HTTP 402 with payment requirements
 *  3. If header present → decode, send to facilitator `/settle`, verify
 *  4. On success → return the resource + `payment-response` header
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  STXtoMicroSTX,
  STACKS_NETWORKS,
  X402_HEADERS,
} from 'x402-stacks';
import { hexToBytes } from '@/lib/utils';
import type { X402RouteConfig, PaymentRequiredResponse, PaymentPayload } from './types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STACKS_API =
  process.env.STACKS_API_URL ??
  process.env.NEXT_PUBLIC_STACKS_API_URL ??
  'https://api.testnet.hiro.so';

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

export { STXtoMicroSTX };

/**
 * Wrap a Next.js route handler with x402 paywall logic.
 *
 * Usage:
 * ```ts
 * export const GET = withX402Paywall(
 *   { amount: STXtoMicroSTX(0.001), payTo: 'ST…', network: 'testnet' },
 *   async (req, settlement) => {
 *     return NextResponse.json({ data: '…', paidBy: settlement?.payer });
 *   }
 * );
 * ```
 */
export function withX402Paywall(
  config: X402RouteConfig,
  handler: (
    req: NextRequest,
    settlement: { success: boolean; payer?: string; transaction?: string; network?: string } | null,
  ) => Promise<NextResponse>,
) {
  // Normalise network to CAIP-2
  const caip2 =
    config.network === 'testnet'
      ? STACKS_NETWORKS.TESTNET
      : STACKS_NETWORKS.MAINNET;

  const asset = config.asset ?? 'STX';
  const amount = config.amount.toString();

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      /* ---- 1. Check for payment-signature header ---- */
      const paymentHeader = req.headers.get(X402_HEADERS.PAYMENT_SIGNATURE);

      if (!paymentHeader) {
        return send402(req, config, caip2, asset, amount);
      }

      /* ---- 2. Decode payment payload ---- */
      let paymentPayload: PaymentPayload;
      try {
        const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
        paymentPayload = JSON.parse(decoded);
      } catch {
        return NextResponse.json(
          { error: 'invalid_payload', message: 'Failed to decode payment-signature header' },
          { status: 400 },
        );
      }

      if (paymentPayload.x402Version !== 2) {
        return NextResponse.json(
          { error: 'invalid_x402_version', message: 'Only x402 v2 is supported' },
          { status: 400 },
        );
      }

      /* ---- 3. Settle: broadcast the signed tx directly to Stacks API ---- */
      const signedTxHex = paymentPayload.payload?.transaction;
      if (!signedTxHex) {
        return NextResponse.json(
          { error: 'invalid_payload', message: 'No signed transaction in payment payload' },
          { status: 400 },
        );
      }

      const settlement = await broadcastAndSettle(signedTxHex, caip2);

      if (!settlement.success) {
        console.error('x402 settlement failed:', settlement.errorReason);
        return send402(req, config, caip2, asset, amount);
      }

      /* ---- 4. Success – call the actual handler ---- */
      const response = await handler(req, settlement);

      // Attach payment-response header
      const paymentResponse = {
        success: settlement.success,
        payer: settlement.payer,
        transaction: settlement.transaction,
        network: settlement.network,
      };
      response.headers.set(
        X402_HEADERS.PAYMENT_RESPONSE,
        Buffer.from(JSON.stringify(paymentResponse)).toString('base64'),
      );

      return response;
    } catch (error) {
      console.error('x402 middleware error:', error);
      return NextResponse.json(
        { error: 'unexpected_settle_error', message: String(error) },
        { status: 500 },
      );
    }
  };
}

/* ------------------------------------------------------------------ */
/*  Internal                                                           */
/* ------------------------------------------------------------------ */

function send402(
  req: NextRequest,
  config: X402RouteConfig,
  caip2: string,
  asset: string,
  amount: string,
): NextResponse {
  const body: PaymentRequiredResponse = {
    x402Version: 2,
    resource: {
      url: req.nextUrl.pathname,
      method: req.method,
      description: config.description ?? 'Payment required to access this resource',
      mimeType: 'application/json',
    },
    accepts: [
      {
        scheme: 'exact',
        network: caip2,
        amount,
        asset,
        payTo: config.payTo,
        maxTimeoutSeconds: 300,
      },
    ],
  };

  const encoded = Buffer.from(JSON.stringify(body)).toString('base64');

  return NextResponse.json(body, {
    status: 402,
    headers: {
      [X402_HEADERS.PAYMENT_REQUIRED]: encoded,
    },
  });
}

/**
 * Broadcast a signed transaction to the Stacks network and return settlement info.
 * This replaces the external facilitator – we talk directly to the Stacks API.
 */
async function broadcastAndSettle(
  signedTxHex: string,
  network: string,
): Promise<{ success: boolean; payer?: string; transaction?: string; network?: string; errorReason?: string }> {
  try {
    const txBytes = hexToBytes(signedTxHex);
    const broadcastRes = await fetch(`${STACKS_API}/v2/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(txBytes),
    });

    if (!broadcastRes.ok) {
      const errText = await broadcastRes.text();
      console.error('[x402 settle] broadcast error:', broadcastRes.status, errText);
      return { success: false, errorReason: `broadcast_failed: ${errText}`, network };
    }

    const txidRaw = await broadcastRes.text();
    const txid = txidRaw.replace(/"/g, '').trim();

    // Try to get the sender address from the mempool
    let payer = '';
    try {
      await new Promise(r => setTimeout(r, 1000));
      const infoRes = await fetch(`${STACKS_API}/extended/v1/tx/${txid}`);
      if (infoRes.ok) {
        const info = await infoRes.json();
        payer = info.sender_address ?? '';
      }
    } catch {
      // Non-critical
    }

    return { success: true, payer, transaction: txid, network };
  } catch (err: any) {
    return { success: false, errorReason: String(err?.message ?? err), network };
  }
}

