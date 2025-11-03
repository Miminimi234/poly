/**
 * x402 Payment Verification
 * Handles verification of x402 payment signatures and processing
 */

import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

export interface X402PaymentRequest {
  resourceId: string;
  amount: string;
  currency: string;
  agentId: string;
  reasoning: string;
  signature: string;
  message: string;
  timestamp: number;
  nonce: string;
  metadata?: Record<string, any>;
}

export interface X402PaymentVerification {
  isValid: boolean;
  error?: string;
  agentAddress?: string;
  amount?: string;
  currency?: string;
}

export interface X402Resource {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  type: 'web' | 'academic' | 'news' | 'expert' | 'sentiment';
  quality: 'high' | 'medium' | 'low';
  freshness: 'fresh' | 'recent' | 'stale';
}

/**
 * Verify x402 payment signature
 */
export async function verifyX402Payment(
  paymentRequest: X402PaymentRequest,
  expectedAmount: string,
  expectedCurrency: string
): Promise<X402PaymentVerification> {
  try {
    // Verify signature
    const recoveredAddress = ethers.verifyMessage(paymentRequest.message, paymentRequest.signature);
    
    // Verify message content
    const messageData = JSON.parse(paymentRequest.message);
    
    // Check if message matches payment request
    if (messageData.resourceId !== paymentRequest.resourceId ||
        messageData.amount !== paymentRequest.amount ||
        messageData.currency !== paymentRequest.currency ||
        messageData.agentId !== paymentRequest.agentId) {
      return {
        isValid: false,
        error: 'Message content does not match payment request'
      };
    }
    
    // Check amount and currency
    if (paymentRequest.amount !== expectedAmount || paymentRequest.currency !== expectedCurrency) {
      return {
        isValid: false,
        error: `Invalid amount or currency. Expected ${expectedCurrency} ${expectedAmount}, got ${paymentRequest.currency} ${paymentRequest.amount}`
      };
    }
    
    // Check timestamp (within 5 minutes)
    const now = Date.now();
    const timeDiff = Math.abs(now - paymentRequest.timestamp);
    if (timeDiff > 5 * 60 * 1000) { // 5 minutes
      return {
        isValid: false,
        error: 'Payment request expired'
      };
    }
    
    return {
      isValid: true,
      agentAddress: recoveredAddress,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Payment verification failed'
    };
  }
}

/**
 * Create x402 payment required response
 */
export function createX402PaymentRequiredResponse(
  resource: X402Resource,
  agentId?: string
): NextResponse {
  const paymentRequest = {
    resourceId: resource.id,
    amount: resource.price,
    currency: resource.currency,
    agentId: agentId || 'unknown',
    reasoning: `Purchase ${resource.name} for analysis`,
    metadata: {
      resourceName: resource.name,
      resourceType: resource.type,
      resourceQuality: resource.quality,
      resourceFreshness: resource.freshness
    }
  };

  return NextResponse.json(
    {
      error: 'Payment Required',
      message: `Payment of ${resource.price} ${resource.currency} required to access ${resource.name}`,
      paymentRequest: paymentRequest,
      resource: resource
    },
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'true',
        'X-Payment-Amount': resource.price,
        'X-Payment-Currency': resource.currency,
        'X-Payment-Resource-Id': resource.id,
        'X-Payment-Resource-Type': resource.type
      }
    }
  );
}

/**
 * Create x402 payment success response
 */
export function createX402PaymentSuccessResponse(
  data: any,
  resource: X402Resource,
  agentId: string,
  transactionHash?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data: data,
      resource: resource,
      agentId: agentId,
      transactionHash: transactionHash,
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Response': 'success',
        'X-Payment-Amount': resource.price,
        'X-Payment-Currency': resource.currency,
        'X-Payment-Resource-Id': resource.id,
        'X-Payment-Agent-Id': agentId
      }
    }
  );
}

/**
 * Create x402 payment error response
 */
export function createX402PaymentErrorResponse(
  error: string,
  resource: X402Resource,
  agentId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: error,
      resource: resource,
      agentId: agentId,
      timestamp: new Date().toISOString()
    },
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Response': 'error',
        'X-Payment-Resource-Id': resource.id
      }
    }
  );
}

/**
 * Extract payment request from request headers or body
 */
export function extractX402PaymentRequest(request: NextRequest): X402PaymentRequest | null {
  try {
    // Try to get from headers first
    const paymentHeader = request.headers.get('X-Payment-Request');
    if (paymentHeader) {
      return JSON.parse(paymentHeader);
    }
    
    // Try to get from body
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // This would need to be handled in the route handler
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract payment request:', error);
    return null;
  }
}

/**
 * Research resource definitions
 */
export const RESEARCH_RESOURCES: Record<string, X402Resource> = {
  'valyu-web': {
    id: 'valyu-web',
    name: 'Valyu Web Search',
    description: 'Basic web search using Valyu for up-to-date information',
    price: '0.01',
    currency: 'USDT',
    type: 'web',
    quality: 'medium',
    freshness: 'fresh'
  },
  'valyu-academic': {
    id: 'valyu-academic',
    name: 'Valyu Academic Papers',
    description: 'Academic research papers and scholarly articles',
    price: '0.10',
    currency: 'USDT',
    type: 'academic',
    quality: 'high',
    freshness: 'recent'
  },
  'news-feeds': {
    id: 'news-feeds',
    name: 'Real-time News Feeds',
    description: 'Breaking news and current events from multiple sources',
    price: '0.05',
    currency: 'USDT',
    type: 'news',
    quality: 'medium',
    freshness: 'fresh'
  },
  'expert-analysis': {
    id: 'expert-analysis',
    name: 'Expert Analysis',
    description: 'Professional insights and expert opinions',
    price: '0.50',
    currency: 'USDT',
    type: 'expert',
    quality: 'high',
    freshness: 'recent'
  },
  'sentiment': {
    id: 'sentiment',
    name: 'Social Sentiment Analysis',
    description: 'Social media sentiment and trends analysis',
    price: '0.02',
    currency: 'USDT',
    type: 'sentiment',
    quality: 'low',
    freshness: 'fresh'
  }
};

/**
 * Get research resource by ID
 */
export function getResearchResource(resourceId: string): X402Resource | null {
  return RESEARCH_RESOURCES[resourceId] || null;
}

/**
 * Get all available research resources
 */
export function getAllResearchResources(): X402Resource[] {
  return Object.values(RESEARCH_RESOURCES);
}

