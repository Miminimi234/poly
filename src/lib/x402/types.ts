/**
 * x402 Payment Protocol Types
 * Based on the x402 specification for HTTP 402 "Payment Required" status code
 */

export interface X402PaymentRequest {
  amount: string; // Amount in wei or token units
  currency: string; // Token symbol (USDT, USDC, etc.)
  recipient: string; // Payment recipient address
  requestId: string; // Unique request identifier
  metadata?: Record<string, any>; // Additional payment metadata
}

export interface X402PaymentResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
  paymentProof?: string;
  data?: any;
}

export interface X402Resource {
  id: string;
  name: string;
  price: string; // Price in token units
  currency: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface X402PaymentConfig {
  defaultCurrency: string;
  maxPaymentAmount: string;
  minPaymentAmount: string;
  gasPriceMultiplier: number;
  timeout: number; // Timeout in milliseconds
}
