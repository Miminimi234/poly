/**
 *  Service - Handles  micropayments for research resources
 * Implements HTTP 402 "Payment Required" protocol with Solana blockchain integration
 */

import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { SolanaAgentWallet } from '../solana/agent-wallet';

export interface PaymentRequest {
  resourceId: string;
  amount: string;
  currency: string;
  agentId: string;
  reasoning: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionHash?: string;
  paymentProof?: string;
  data?: any;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

export interface PaymentConfig {
  defaultCurrency: string;
  maxPaymentAmount: string;
  minPaymentAmount: string;
  gasPriceMultiplier: number;
  timeout: number;
  chainId: number;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  source: string;
  type: string;
  quality: string;
  freshness: string;
}

export interface PaymentSignature {
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
}

export class Service {
  private wallet: SolanaAgentWallet;
  private config: PaymentConfig;
  private paymentHistory: Map<string, PaymentResponse> = new Map();

  constructor(wallet: SolanaAgentWallet, config: PaymentConfig) {
    this.wallet = wallet;
    this.config = config;
  }

  /**
   * Make a payment for a research resource using  protocol
   */
  async makePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log(`Making  payment for resource ${request.resourceId} by agent ${request.agentId}`);

      // Validate payment request
      const validation = this.validatePaymentRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if we can afford the payment
      const canAfford = await this.wallet.canAfford(request.amount, request.currency);
      if (!canAfford) {
        return {
          success: false,
          error: 'Insufficient balance for payment'
        };
      }

      // Create payment signature using EIP-712
      const signature = await this.createPaymentSignature(request);
      if (!signature) {
        return {
          success: false,
          error: 'Failed to create payment signature'
        };
      }

      // Execute the payment transaction
      const paymentResult = await this.executePayment(request, signature);

      // Store payment in history
      if (paymentResult.success) {
        this.paymentHistory.set(request.resourceId, paymentResult);
      }

      return paymentResult;

    } catch (error) {
      console.error(' payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verify a payment signature
   */
  async verifyPaymentSignature(
    signature: PaymentSignature,
    request: PaymentRequest
  ): Promise<boolean> {
    try {
      // Recreate the message that was signed
      const message = this.createPaymentMessage(request);

      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature.signature);
      const expectedAddress = this.wallet.getAddress();

      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Payment signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get payment history for a resource
   */
  getPaymentHistory(resourceId: string): PaymentResponse | null {
    return this.paymentHistory.get(resourceId) || null;
  }

  /**
   * Get all payment history
   */
  getAllPaymentHistory(): Map<string, PaymentResponse> {
    return new Map(this.paymentHistory);
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    // Check required fields
    if (!request.resourceId || !request.amount || !request.currency || !request.agentId) {
      return { valid: false, error: 'Missing required fields' };
    }

    // Check amount limits
    const amount = parseFloat(request.amount);
    const minAmount = parseFloat(this.config.minPaymentAmount);
    const maxAmount = parseFloat(this.config.maxPaymentAmount);

    if (amount < minAmount) {
      return { valid: false, error: `Amount below minimum (${minAmount})` };
    }

    if (amount > maxAmount) {
      return { valid: false, error: `Amount above maximum (${maxAmount})` };
    }

    // Check currency
    if (request.currency !== this.config.defaultCurrency) {
      return { valid: false, error: `Unsupported currency (${request.currency})` };
    }

    return { valid: true };
  }

  /**
   * Create payment signature using EIP-712
   */
  private async createPaymentSignature(request: PaymentRequest): Promise<PaymentSignature | null> {
    try {
      const message = this.createPaymentMessage(request);
      const signature = await this.wallet.signMessage(message);
      const timestamp = Date.now();
      const nonce = randomBytes(16).toString('hex');

      return {
        signature,
        message,
        timestamp,
        nonce
      };
    } catch (error) {
      console.error('Failed to create payment signature:', error);
      return null;
    }
  }

  /**
   * Create payment message for signing
   */
  private createPaymentMessage(request: PaymentRequest): string {
    const message = {
      resourceId: request.resourceId,
      amount: request.amount,
      currency: request.currency,
      agentId: request.agentId,
      reasoning: request.reasoning,
      timestamp: Date.now(),
      chainId: this.config.chainId
    };

    return JSON.stringify(message);
  }

  /**
   * Execute the payment transaction
   */
  private async executePayment(
    request: PaymentRequest,
    signature: PaymentSignature
  ): Promise<PaymentResponse> {
    try {
      // For now, we'll simulate the payment by transferring tokens
      // In a real implementation, this would interact with the  protocol
      const result = await this.wallet.transferTokens(
        request.amount,
        request.currency,
        this.getResourcePaymentAddress(request.resourceId)
      );

      if (result.success) {
        return {
          success: true,
          transactionHash: result.transactionHash,
          paymentProof: signature.signature,
          gasUsed: result.gasUsed,
          blockNumber: result.blockNumber
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment execution failed'
      };
    }
  }

  /**
   * Get payment address for a resource
   * In a real implementation, this would query the  protocol
   */
  private getResourcePaymentAddress(resourceId: string): string {
    // For now, return a mock address
    // In reality, this would be the address of the resource provider
    return '0x742d35Cc6634C0532925a3b8D5C9E6C4C8C4C8C4';
  }

  /**
   * Create  payment request for HTTP 402 response
   */
  createPaymentRequest(resource: Resource, agentId: string): {
    status: number;
    headers: Record<string, string>;
    body: any;
  } {
    const paymentRequest = {
      resourceId: resource.id,
      amount: resource.price,
      currency: resource.currency,
      agentId: agentId,
      reasoning: `Purchase ${resource.name} for analysis`,
      metadata: {
        resourceName: resource.name,
        resourceType: resource.type,
        resourceQuality: resource.quality,
        resourceFreshness: resource.freshness
      }
    };

    return {
      status: 402, // Payment Required
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
        'X-Payment-Amount': resource.price,
        'X-Payment-Currency': resource.currency,
        'X-Payment-Address': this.getResourcePaymentAddress(resource.id)
      },
      body: {
        error: 'Payment Required',
        message: `Payment of ${resource.price} ${resource.currency} required to access ${resource.name}`,
        paymentRequest: paymentRequest,
        resource: resource
      }
    };
  }

  /**
   * Process  payment response
   */
  async processPaymentResponse(
    response: any,
    agentId: string
  ): Promise<PaymentResponse> {
    try {
      if (response.status !== 402) {
        return {
          success: false,
          error: 'Not a payment required response'
        };
      }

      const paymentRequest = response.body.paymentRequest;
      if (!paymentRequest) {
        return {
          success: false,
          error: 'No payment request in response'
        };
      }

      // Make the payment
      return await this.makePayment(paymentRequest);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment response'
      };
    }
  }

  /**
   * Purchase research resource from Polysentience's -enabled research endpoints
   */
  async purchaseResearchResource(
    resourceId: string,
    query: string,
    options: {
      startDate?: string;
      expertType?: string;
      platform?: string;
    } = {}
  ): Promise<PaymentResponse> {
    try {
      // Create payment request
      const paymentRequest: PaymentRequest = {
        resourceId,
        amount: this.getResourcePrice(resourceId),
        currency: 'USDT',
        agentId: this.wallet.getAddress(),
        reasoning: `Purchase ${resourceId} research for analysis`,
        metadata: {
          query,
          ...options
        }
      };

      // Create payment signature
      const signature = await this.createPaymentSignature(paymentRequest);
      if (!signature) {
        return {
          success: false,
          error: 'Failed to create payment signature'
        };
      }

      // Prepare request body
      const requestBody = {
        query,
        ...options,
        paymentRequest: {
          ...paymentRequest,
          signature: signature.signature,
          message: signature.message,
          timestamp: signature.timestamp,
          nonce: signature.nonce
        }
      };

      // Make request to research endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/research/${resourceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Request': JSON.stringify(paymentRequest)
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 402) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Payment required'
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Research request failed'
        };
      }

      const result = await response.json();

      // Deduct cost from balance
      await this.wallet.transferTokens(
        paymentRequest.amount,
        paymentRequest.currency,
        this.getResourcePaymentAddress(resourceId)
      );

      return {
        success: true,
        transactionHash: result.transactionHash,
        paymentProof: signature.signature,
        data: result.data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Research purchase failed'
      };
    }
  }

  /**
   * Get resource price by ID
   */
  private getResourcePrice(resourceId: string): string {
    const prices: Record<string, string> = {
      'valyu-web': '0.01',
      'valyu-academic': '0.10',
      'news-feeds': '0.05',
      'expert-analysis': '0.50',
      'sentiment': '0.02'
    };
    return prices[resourceId] || '0.01';
  }

  /**
   * Get payment statistics
   */
  getPaymentStatistics(): {
    totalPayments: number;
    successfulPayments: number;
    totalAmount: string;
    averageAmount: string;
    successRate: number;
  } {
    const payments = Array.from(this.paymentHistory.values());
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.success).length;
    const totalAmountValue = payments.reduce((sum, _p) => {
      // This would need to track actual amounts from the payment requests
      return sum + 0.01; // Mock value
    }, 0);
    const totalAmount = totalAmountValue.toString();
    const averageAmount = totalPayments > 0 ? (totalAmountValue / totalPayments).toString() : '0';
    const successRate = totalPayments > 0 ? successfulPayments / totalPayments : 0;

    return {
      totalPayments,
      successfulPayments,
      totalAmount,
      averageAmount,
      successRate
    };
  }

  /**
   * Create default  configuration
   */
  static createDefaultConfig(chainId: number): PaymentConfig {
    return {
      defaultCurrency: 'USDT',
      maxPaymentAmount: '1.0',
      minPaymentAmount: '0.001',
      gasPriceMultiplier: 1.1,
      timeout: 30000,
      chainId: chainId
    };
  }

  /**
   * Create  service for testnet
   */
  static createTestnetService(wallet: SolanaAgentWallet): Service {
    const config = Service.createDefaultConfig(97); // Solana testnet chain ID
    return new Service(wallet, config);
  }

  /**
   * Create  service for mainnet
   */
  static createMainnetService(wallet: SolanaAgentWallet): Service {
    const config = Service.createDefaultConfig(56); // Solana mainnet chain ID
    return new Service(wallet, config);
  }
}
