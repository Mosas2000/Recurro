export interface WalletConnection {
  address: string;
  network: 'testnet' | 'mainnet';
  connected: boolean;
}
