import { PaymentRequest, PaymentVerification, Currency } from './types';

export class X402Client {
  private networkType: 'testnet' | 'mainnet';
  private apiUrl: string;

  constructor(networkType: 'testnet' | 'mainnet' = 'testnet') {
    this.networkType = networkType;
    this.apiUrl = networkType === 'testnet' 
      ? 'https://api.testnet.hiro.so' 
      : 'https://api.hiro.so';
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/extended/v1/tx/${transactionId}`);
    
    if (!response.ok) {
      return false;
    }

    const transaction = await response.json();
    return transaction.tx_status === 'success';
  }

  async createPaymentRequest(
    amount: number,
    currency: Currency,
    recipient: string
  ): Promise<PaymentRequest> {
    return {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      recipient,
      timestamp: Date.now(),
    };
  }

  async getTransactionDetails(transactionId: string) {
    const response = await fetch(`${this.apiUrl}/extended/v1/tx/${transactionId}`);
    
    if (!response.ok) {
      throw new Error('Transaction not found');
    }

    return await response.json();
  }

  async verifyPaymentDetails(
    transactionId: string,
    expectedAmount: number,
    expectedRecipient: string
  ): Promise<PaymentVerification> {
    const transaction = await this.getTransactionDetails(transactionId);
    
    const verified = 
      transaction.tx_status === 'success' &&
      transaction.sender_address !== expectedRecipient;

    return {
      transactionId,
      verified,
      timestamp: Date.now(),
    };
  }
}
