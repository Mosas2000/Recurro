/**
 * /api/x402/status – Public endpoint showing x402 integration status
 *
 * This endpoint is NOT paywalled. It returns information about the
 * x402 protocol configuration so the frontend can display it.
 */

import { NextResponse } from 'next/server';
import {
  STACKS_NETWORKS,
  X402_HEADERS,
} from 'x402-stacks';

const CREATOR_ADDRESS =
  process.env.X402_CREATOR_ADDRESS ??
  process.env.NEXT_PUBLIC_X402_CREATOR_ADDRESS ??
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

const NETWORK = (process.env.STACKS_NETWORK as 'testnet' | 'mainnet') ?? 'testnet';

const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ??
  process.env.NEXT_PUBLIC_X402_FACILITATOR_URL ??
  'http://localhost:3000/api/facilitator';

export async function GET() {
  // Try to reach the facilitator
  let facilitatorStatus = 'unknown';
  try {
    const res = await fetch(`${FACILITATOR_URL}/supported`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      facilitatorStatus = 'connected';
    } else {
      facilitatorStatus = `error (${res.status})`;
    }
  } catch {
    facilitatorStatus = 'unreachable';
  }

  return NextResponse.json({
    x402: {
      version: 2,
      protocol: 'x402-stacks',
      npmPackage: 'x402-stacks@2.0.1',
      headers: X402_HEADERS,
      networks: STACKS_NETWORKS,
    },
    config: {
      network: NETWORK,
      networkCAIP2: NETWORK === 'testnet' ? STACKS_NETWORKS.TESTNET : STACKS_NETWORKS.MAINNET,
      creatorAddress: CREATOR_ADDRESS,
      facilitatorUrl: FACILITATOR_URL,
      facilitatorStatus,
    },
    endpoints: {
      premiumContent: {
        url: '/api/x402/premium-content',
        method: 'GET',
        price: '0.001 STX',
        description: 'Paywall-protected premium analytics (x402 demo)',
      },
      subscribe: {
        url: '/api/x402/subscribe',
        method: 'POST',
        price: 'Dynamic (based on plan)',
        description: 'x402-gated subscription creation with on-chain settlement',
      },
      status: {
        url: '/api/x402/status',
        method: 'GET',
        price: 'Free',
        description: 'This endpoint – x402 configuration info',
      },
    },
    flow: [
      '1. Client requests paywall-protected endpoint',
      '2. Server responds HTTP 402 + payment-required header (base64 JSON)',
      '3. Client decodes requirements, signs STX transfer via wallet',
      '4. Client retries with payment-signature header (base64 signed tx)',
      '5. Server broadcasts signed tx directly to Stacks API (/v2/transactions)',
      '6. On-chain confirmation, sender address resolved from mempool',
      '7. Server returns resource + payment-response header with tx details',
    ],
  });
}
