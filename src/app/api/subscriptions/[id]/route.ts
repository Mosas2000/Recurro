import { NextRequest, NextResponse } from 'next/server';
import { subscriptionsStore } from '@/lib/db/schema';
import { isValidStacksAddress } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subscription = subscriptionsStore.get(id);

  if (!subscription) {
    return NextResponse.json(
      { error: 'Subscription not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(subscription);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const subscription = subscriptionsStore.get(id);

  if (!subscription) {
    return NextResponse.json(
      { error: 'Subscription not found' },
      { status: 404 }
    );
  }

  // --- Auth: require the caller to identify as the creator or subscriber ---
  const walletAddress = request.headers.get('x-wallet-address') ?? body.walletAddress;

  if (!walletAddress || !isValidStacksAddress(walletAddress)) {
    return NextResponse.json(
      { error: 'Missing or invalid x-wallet-address header' },
      { status: 401 },
    );
  }

  if (
    walletAddress !== subscription.creatorAddress &&
    walletAddress !== subscription.subscriberAddress
  ) {
    return NextResponse.json(
      { error: 'You are not authorised to modify this subscription' },
      { status: 403 },
    );
  }

  const { status } = body;

  // Only allow updating the status field (active, paused, cancelled)
  if (!status || !['active', 'paused', 'cancelled'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid or missing status. Must be: active, paused, or cancelled' },
      { status: 400 }
    );
  }

  const updatedSubscription = {
    ...subscription,
    status,
  };

  subscriptionsStore.set(id, updatedSubscription);

  return NextResponse.json(updatedSubscription);
}
