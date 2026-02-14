/**
 * Wallet integration using @stacks/connect v8.
 *
 * `connect()` opens the built-in provider-selector modal so the user
 * can pick Leather, Xverse, or any other installed Stacks wallet.
 * It returns the addresses directly.
 *
 * The "Cannot redefine property: StacksProvider" console error is a
 * known conflict between the Leather and Xverse browser extensions
 * both trying to claim `window.StacksProvider`. It does NOT originate
 * from our code and does NOT prevent the wallet from working — the
 * `@stacks/connect` modal handles provider selection independently.
 */

import { connect, disconnect, request } from '@stacks/connect';
import type { WalletConnection } from '@/types/wallet';

const STORAGE_KEY = 'recurro_wallet';

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

/** Pick the first STX address from a heterogeneous address list. */
function pickStxAddress(addrs: any[]): string | undefined {
  // Prefer an entry explicitly flagged as STX / stacks
  const stx = addrs.find(
    (a: any) =>
      a.symbol === 'STX' ||
      a.purpose === 'stacks' ||
      (typeof a.address === 'string' && /^S[PT]/.test(a.address))
  );
  return stx?.address ?? addrs[0]?.address;
}

/** Safely extract an address array from a wallet response object. */
function extractAddresses(obj: unknown): any[] | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, any>;
  const arr = o.addresses ?? o.result?.addresses;
  return Array.isArray(arr) && arr.length > 0 ? arr : null;
}

/* ------------------------------------------------------------------ */
/*  public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Open the wallet-selector modal, ask the user to approve, and
 * persist the connection in localStorage.
 */
export async function connectWallet(): Promise<WalletConnection> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot connect wallet on the server');
  }

  let address: string | undefined;

  // 1. `connect()` opens the provider picker and returns addresses.
  try {
    const response = await connect({ network: 'testnet' });
    const addrs = extractAddresses(response);
    if (addrs) address = pickStxAddress(addrs);
  } catch (err) {
    console.warn('[Recurro] connect() threw, trying getAddresses:', err);
  }

  // 2. Fallback – if connect() didn't return addresses, request them.
  if (!address) {
    try {
      const response = await request('getAddresses');
      const addrs = extractAddresses(response);
      if (addrs) address = pickStxAddress(addrs);
    } catch (err) {
      console.warn('[Recurro] getAddresses request failed:', err);
    }
  }

  if (!address) {
    throw new Error(
      'Could not retrieve a Stacks wallet address. ' +
        'Make sure Leather or Xverse is installed and try again.'
    );
  }

  const connection: WalletConnection = {
    address,
    network: 'testnet',
    connected: true,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
  return connection;
}

/** Disconnect the wallet and clear persisted state. */
export function disconnectWallet(): void {
  if (typeof window === 'undefined') return;
  try {
    disconnect();
  } catch {
    // disconnect may throw if no provider was selected — safe to ignore
  }
  localStorage.removeItem(STORAGE_KEY);
}

/** Read the persisted wallet connection from localStorage. */
export function getWalletConnection(): WalletConnection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletConnection) : null;
  } catch {
    return null;
  }
}

/** Return the stored address, or null. */
export function getAddress(): string | null {
  return getWalletConnection()?.address ?? null;
}

/** Quick boolean check. */
export function isWalletConnected(): boolean {
  return getWalletConnection()?.connected === true;
}
