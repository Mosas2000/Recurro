import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert a hex string (with or without 0x prefix) to Uint8Array. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Validate a Stacks address format (testnet ST… or mainnet SP…). */
export function isValidStacksAddress(address: string): boolean {
  return /^S[PT][A-Z0-9]{38,40}$/i.test(address);
}
