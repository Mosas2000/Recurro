/**
 * Local x402 Facilitator – /supported endpoint
 *
 * Returns the supported payment kinds for this facilitator.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    kinds: [
      { x402Version: 2, scheme: 'exact', network: 'stacks:1' },
      { x402Version: 2, scheme: 'exact', network: 'stacks:2147483648' },
    ],
    extensions: [],
    signers: {},
  });
}
