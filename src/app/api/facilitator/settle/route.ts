/**
 * Local x402 Facilitator – /settle endpoint
 *
 * Receives a signed (but not broadcast) STX transaction,
 * broadcasts it to the Stacks network, and returns the result.
 *
 * This replaces the external facilitator at x402-backend-7eby.onrender.com
 * so we don't depend on a third-party service being online.
 */

import { NextRequest, NextResponse } from 'next/server';
import { hexToBytes } from '@/lib/utils';

const STACKS_API =
  process.env.STACKS_API_URL ?? 'https://api.testnet.hiro.so';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { paymentPayload, paymentRequirements } = body;

    if (!paymentPayload?.payload?.transaction) {
      return NextResponse.json(
        { success: false, errorReason: 'invalid_payload', message: 'Missing signed transaction' },
        { status: 400 },
      );
    }

    const signedTxHex = paymentPayload.payload.transaction;

    // --- 1. Broadcast the signed transaction to the Stacks network ---
    // Send raw hex as octet-stream (convert to Buffer for Node fetch compatibility)
    const txBytes = hexToBytes(signedTxHex);
    const broadcastRes = await fetch(`${STACKS_API}/v2/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(txBytes),
    });

    if (!broadcastRes.ok) {
      const errText = await broadcastRes.text();
      console.error('[facilitator/settle] broadcast failed:', broadcastRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          errorReason: 'broadcast_failed',
          message: `Broadcast failed: ${errText}`,
          network: paymentRequirements?.network ?? 'stacks:2147483648',
          transaction: '',
        },
        { status: 400 },
      );
    }

    // The Stacks API returns the txid as a JSON string (with quotes)
    const txidRaw = await broadcastRes.text();
    const txid = txidRaw.replace(/"/g, '').trim();

    // --- 2. Try to extract sender from the Stacks API ---
    let payer = '';
    try {
      // Give the mempool a moment to index
      await new Promise(r => setTimeout(r, 1500));
      const txInfoRes = await fetch(`${STACKS_API}/extended/v1/tx/${txid}`);
      if (txInfoRes.ok) {
        const txInfo = await txInfoRes.json();
        payer = txInfo.sender_address ?? '';
      }
    } catch {
      // Non-critical – we still have the txid
    }

    // --- 3. Return success ---
    return NextResponse.json({
      success: true,
      payer,
      transaction: txid,
      network: paymentRequirements?.network ?? 'stacks:2147483648',
    });
  } catch (error: any) {
    console.error('[facilitator/settle] error:', error);
    return NextResponse.json(
      {
        success: false,
        errorReason: 'unexpected_settle_error',
        message: String(error?.message ?? error),
      },
      { status: 500 },
    );
  }
}

