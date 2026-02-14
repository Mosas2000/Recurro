export type Currency = 'sBTC' | 'STX';

export interface PaymentRequest {
  id: string;
  amount: number;
  currency: Currency;
  recipient: string;
  timestamp: number;
}

export interface PaymentVerification {
  transactionId: string;
  verified: boolean;
  timestamp: number;
}
