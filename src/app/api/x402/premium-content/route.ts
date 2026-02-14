/**
 * /api/x402/premium-content – x402-paywall protected endpoint
 *
 * Demonstrates the core x402 HTTP 402 flow:
 *  • First request (no payment) → 402 with `payment-required` header
 *  • Second request (with `payment-signature`) → settles via facilitator → 200
 *
 * This is the canonical example of using x402-stacks with a Next.js API route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402Paywall, STXtoMicroSTX } from '@/lib/x402/middleware';

const CREATOR_ADDRESS =
  process.env.X402_CREATOR_ADDRESS ??
  process.env.NEXT_PUBLIC_X402_CREATOR_ADDRESS ??
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // default testnet address

const NETWORK = (process.env.STACKS_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';

export const GET = withX402Paywall(
  {
    amount: STXtoMicroSTX(0.001),       // 0.001 STX = 1000 microSTX
    payTo: CREATOR_ADDRESS,
    network: NETWORK,
    asset: 'STX',
    description: 'Access premium subscription analytics',
  },
  async (_req, settlement) => {
    // This code only runs AFTER the payment is verified & settled
    return NextResponse.json({
      success: true,
      message: 'Premium content unlocked via x402 payment!',
      data: {
        analytics: {
          totalRevenue: '12.45 STX',
          subscribers: 142,
          churnRate: '3.2%',
          topPlan: 'Pro Monthly',
        },
        generatedAt: new Date().toISOString(),
      },
      payment: {
        protocol: 'x402-stacks v2',
        paidBy: settlement?.payer ?? 'unknown',
        transaction: settlement?.transaction ?? 'unknown',
        network: settlement?.network ?? 'unknown',
      },
    });
  },
);
