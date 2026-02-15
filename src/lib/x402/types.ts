/**
 * x402 protocol types for Recurro
 *
 * These types align with the x402-stacks V2 (Coinbase-compatible) protocol.
 * The V2 protocol uses:
 *   - CAIP-2 network identifiers (e.g. "stacks:2147483648" for testnet)
 *   - Base64-encoded HTTP headers (payment-required, payment-signature, payment-response)
 *   - Facilitator pattern for transaction settlement
 */

/** Token types accepted for payment */
export type TokenType = 'STX';
export type Currency = 'STX';

/** Payment requirement returned in a 402 response */
export interface PaymentRequirement {
  scheme: string;
  network: string;       // CAIP-2 format, e.g. "stacks:2147483648"
  amount: string;        // in atomic units (microSTX or satoshis)
  asset: string;         // "STX" or "sBTC"
  payTo: string;         // creator's Stacks address
  maxTimeoutSeconds: number;
}

/** Full 402 response body per x402 V2 spec */
export interface PaymentRequiredResponse {
  x402Version: 2;
  resource: {
    url: string;
    method: string;
    description?: string;
    mimeType?: string;
  };
  accepts: PaymentRequirement[];
}

/** Payment payload sent by client in payment-signature header */
export interface PaymentPayload {
  x402Version: 2;
  resource: PaymentRequiredResponse['resource'];
  accepted: PaymentRequirement;
  payload: {
    transaction: string; // signed tx hex (NOT broadcast)
  };
}

/** Configuration for x402 paywall on a Next.js API route */
export interface X402RouteConfig {
  /** Amount in atomic units (microSTX). Use STXtoMicroSTX() helper */
  amount: string | bigint;
  /** Recipient Stacks address */
  payTo: string;
  /** 'testnet' or 'mainnet' */
  network: 'testnet' | 'mainnet';
  /** Asset type – defaults to 'STX' */
  asset?: string;
  /** Facilitator URL – defaults to env or public facilitator */
  facilitatorUrl?: string;
  /** Human-readable description */
  description?: string;
}


