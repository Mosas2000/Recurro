/**
 * Local x402 Facilitator – /verify endpoint
 *
 * Verifies a signed transaction payload without broadcasting it.
 * Checks basic structure and that the transaction is well-formed.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentPayload, paymentRequirements } = body;

    if (!paymentPayload?.payload?.transaction) {
      return NextResponse.json(
        { isValid: false, invalidReason: 'invalid_payload' },
        { status: 400 },
      );
    }

    const signedTxHex = paymentPayload.payload.transaction;

    // Basic validation: ensure it looks like a valid hex-encoded transaction
    const cleanHex = signedTxHex.startsWith('0x') ? signedTxHex.slice(2) : signedTxHex;
    if (!/^[0-9a-fA-F]+$/.test(cleanHex) || cleanHex.length < 100) {
      return NextResponse.json(
        { isValid: false, invalidReason: 'invalid_transaction_state' },
        { status: 400 },
      );
    }

    // Check that payment requirements exist
    if (!paymentRequirements?.payTo || !paymentRequirements?.amount) {
      return NextResponse.json(
        { isValid: false, invalidReason: 'invalid_payment_requirements' },
        { status: 400 },
      );
    }

    // For a local facilitator, we trust the wallet-signed transaction
    // A production facilitator would deserialize and fully validate
    return NextResponse.json({
      isValid: true,
      payer: '', // Would need to deserialize tx to extract sender
    });
  } catch (error: any) {
    console.error('[facilitator/verify] error:', error);
    return NextResponse.json(
      { isValid: false, invalidReason: 'unexpected_verify_error' },
      { status: 500 },
    );
  }
}
