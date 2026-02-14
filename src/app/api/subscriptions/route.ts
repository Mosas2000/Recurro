import { NextRequest, NextResponse } from 'next/server';
import { subscriptionsStore } from '@/lib/db/schema';

/**
 * GET /api/subscriptions
 *
 * Query params (all optional – returns everything if none given):
 *   ?creatorAddress=SP…     — subscriptions created by this address
 *   ?subscriberAddress=ST…  — subscriptions where someone subscribed
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const creatorAddress = searchParams.get('creatorAddress');
  const subscriberAddress = searchParams.get('subscriberAddress');

  let results = Array.from(subscriptionsStore.values());

  if (creatorAddress) {
    results = results.filter((s) => s.creatorAddress === creatorAddress);
  }

  if (subscriberAddress) {
    results = results.filter((s) => s.subscriberAddress === subscriberAddress);
  }

  return NextResponse.json(results);
}
