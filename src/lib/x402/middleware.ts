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
  X402PaymentVerifier,
  networkToCAIP2,
  STXtoMicroSTX,
  STACKS_NETWORKS,
  X402_HEADERS,
} from 'x402-stacks';
import type { X402RouteConfig, PaymentRequiredResponse, PaymentPayload } from './types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_FACILITATOR_URL =
  process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
  process.env.X402_FACILITATOR_URL ??
  'https://x402-backend-7eby.onrender.com';

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
  const facilitatorUrl = config.facilitatorUrl ?? DEFAULT_FACILITATOR_URL;
  const verifier = new X402PaymentVerifier(facilitatorUrl);

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

      /* ---- 3. Settle via facilitator ---- */
      const paymentRequirements = {
        scheme: 'exact' as const,
        network: caip2,
        amount,
        asset,
        payTo: config.payTo,
        maxTimeoutSeconds: 300,
      };

      const settlement = await verifier.settle(paymentPayload as any, { paymentRequirements } as any);

      if (!settlement.success) {
        const res = send402(req, config, caip2, asset, amount);
        return res;
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
