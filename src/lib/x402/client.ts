/**
 * x402 Payment Protocol Client
 * Implements HTTP 402 "Payment Required" for micropayments
 */

import { ethers } from 'ethers';
import {
  X402PaymentConfig,
  X402PaymentRequest,
  X402PaymentResponse,
  X402Resource
} from './types';

// Re-export payment config/type so other modules can import from this client file
export type { X402PaymentConfig } from './types';

export class X402Client {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private config: X402PaymentConfig;

  constructor(
    provider: ethers.Provider,
    wallet: ethers.Wallet,
    config: X402PaymentConfig
  ) {
    this.provider = provider;
    this.wallet = wallet;
    this.config = config;
  }

  /**
   * Process a payment request from an HTTP 402 response
   */
  async processPaymentRequest(paymentRequest: X402PaymentRequest): Promise<X402PaymentResponse> {
    try {
      // Validate payment amount
      if (!this.isValidPaymentAmount(paymentRequest.amount)) {
        return {
          success: false,
          error: 'Invalid payment amount'
        };
      }

      // Create and send transaction
      const transaction = await this.createPaymentTransaction(paymentRequest);
      const receipt = await transaction.wait();

      if (!receipt) {
        return {
          success: false,
          error: 'Transaction receipt not available'
        };
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        paymentProof: receipt.hash
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Purchase a resource using x402 micropayments
   */
  async purchaseResource(resource: X402Resource): Promise<X402PaymentResponse> {
    const paymentRequest: X402PaymentRequest = {
      amount: resource.price,
      currency: resource.currency,
      recipient: resource.id, // Assuming resource ID is the payment recipient
      requestId: `resource_${resource.id}_${Date.now()}`,
      metadata: {
        resourceId: resource.id,
        resourceName: resource.name
      }
    };

    return this.processPaymentRequest(paymentRequest);
  }

  /**
   * Create a payment transaction
   */
  private async createPaymentTransaction(paymentRequest: X402PaymentRequest) {
    const gasPrice = await this.provider.getFeeData();
    const adjustedGasPrice = gasPrice.gasPrice! * BigInt(Math.floor(this.config.gasPriceMultiplier * 100)) / BigInt(100);

    const transaction = {
      to: paymentRequest.recipient,
      value: ethers.parseEther(paymentRequest.amount),
      gasLimit: 21000,
      gasPrice: adjustedGasPrice
    };

    return this.wallet.sendTransaction(transaction);
  }

  /**
   * Validate payment amount against configuration limits
   */
  private isValidPaymentAmount(amount: string): boolean {
    const amountBN = BigInt(amount);
    const minAmount = BigInt(this.config.minPaymentAmount);
    const maxAmount = BigInt(this.config.maxPaymentAmount);

    return amountBN >= minAmount && amountBN <= maxAmount;
  }

  /**
   * Get current wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }
}
