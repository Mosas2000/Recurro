export const NETWORK_TYPE = (process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet') as 'testnet' | 'mainnet';

export const getNetwork = () => {
  return NETWORK_TYPE;
};

export const STACKS_API_URL = process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so';

export const CONTRACT_ADDRESSES = {
  recurro: NETWORK_TYPE === 'testnet' 
    ? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.recurro'
    : 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.recurro',
};

export const EXPLORER_URL = NETWORK_TYPE === 'testnet'
  ? 'https://explorer.hiro.so/?chain=testnet'
  : 'https://explorer.hiro.so';
