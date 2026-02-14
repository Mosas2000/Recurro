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
import { subscriptionsStore } from '@/lib/db/schema';

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
    // Pull real data from the subscription store
    const allSubs = Array.from(subscriptionsStore.values());
    const activeSubs = allSubs.filter((s) => s.status === 'active' && s.subscriberAddress !== 'placeholder');
    const plans = allSubs.filter((s) => s.subscriberAddress === 'placeholder');
    const totalRevenue = activeSubs.reduce((sum, s) => sum + s.amount, 0);
    const pausedSubs = allSubs.filter((s) => s.status === 'paused');

    // Find the most popular plan
    const planCounts: Record<string, number> = {};
    activeSubs.forEach((s) => {
      const name = s.planName || 'Unnamed';
      planCounts[name] = (planCounts[name] || 0) + 1;
    });
    const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

    return NextResponse.json({
      success: true,
      message: 'Premium analytics unlocked! Here are your real-time platform insights.',
      data: {
        overview: {
          totalPlans: plans.length,
          activeSubscribers: activeSubs.length,
          pausedSubscriptions: pausedSubs.length,
          totalRevenue: `${totalRevenue.toFixed(4)} STX`,
          topPlan,
        },
        recentPlans: plans.slice(-5).map((p) => ({
          name: p.planName || 'Unnamed',
          price: `${p.amount} ${p.currency}`,
          interval: p.interval,
          created: new Date(p.createdAt).toLocaleDateString(),
        })),
        insights: {
          churnRate: activeSubs.length > 0
            ? `${((pausedSubs.length / (activeSubs.length + pausedSubs.length)) * 100).toFixed(1)}%`
            : '0%',
          averageRevenue: activeSubs.length > 0
            ? `${(totalRevenue / activeSubs.length).toFixed(4)} STX`
            : '0 STX',
          mostPopularCurrency: allSubs.filter((s) => s.currency === 'STX').length >=
            allSubs.filter((s) => s.currency === 'sBTC').length ? 'STX' : 'sBTC',
          mostPopularInterval: (['monthly', 'weekly', 'daily'] as const)
            .map((i) => ({ interval: i, count: allSubs.filter((s) => s.interval === i).length }))
            .sort((a, b) => b.count - a.count)[0]?.interval || 'monthly',
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
