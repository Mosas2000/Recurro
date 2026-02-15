/**
 * Stacks Network Configuration
 *
 * Recurro operates on the Stacks blockchain via the x402-stacks protocol.
 * All payments are STX transfers settled on-chain — no smart contracts needed.
 * The x402 facilitator pattern handles settlement via raw transaction broadcast.
 */

export const NETWORK_TYPE = (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet') as 'testnet' | 'mainnet';

export const getNetwork = () => NETWORK_TYPE;

export const STACKS_API_URL =
  process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so';

export const EXPLORER_URL =
  NETWORK_TYPE === 'testnet'
    ? 'https://explorer.hiro.so/?chain=testnet'
    : 'https://explorer.hiro.so';
