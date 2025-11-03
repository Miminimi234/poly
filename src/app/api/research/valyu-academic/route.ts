/**
 * x402-enabled Valyu Academic Papers API
 * Returns HTTP 402 "Payment Required" when no payment is provided
 * Executes Valyu academic search when valid x402 payment is provided
 */

import { NextRequest, NextResponse } from 'next/server';
import { valyuDeepSearchTool, type ValyuToolResult } from '@/lib/tools/valyu_search';
import { 
  verifyX402Payment, 
  createX402PaymentRequiredResponse, 
  createX402PaymentSuccessResponse,
  createX402PaymentErrorResponse,
  getResearchResource,
  X402PaymentRequest
} from '@/lib/x402/payment-verification';

export async function POST(request: NextRequest) {
  try {
    const resource = getResearchResource('valyu-academic');
    if (!resource) {
      return NextResponse.json(
        { error: 'Research resource not found' },
        { status: 404 }
      );
    }

    // Extract payment request from body
    let paymentRequest: X402PaymentRequest | null = null;
    try {
      const body = await request.json();
      paymentRequest = body.paymentRequest || null;
    } catch (error) {
      // If no payment request, return 402
      return createX402PaymentRequiredResponse(resource);
    }

    // If no payment request provided, return 402
    if (!paymentRequest) {
      return createX402PaymentRequiredResponse(resource);
    }

    // Verify payment
    const verification = await verifyX402Payment(
      paymentRequest,
      resource.price,
      resource.currency
    );

    if (!verification.isValid) {
      return createX402PaymentErrorResponse(
        verification.error || 'Payment verification failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Extract search parameters from request
    const { query, startDate } = await request.json().catch(() => ({}));
    
    if (!query) {
      return createX402PaymentErrorResponse(
        'Search query is required',
        resource,
        paymentRequest.agentId
      );
    }

    // Execute Valyu academic search
    console.log(`[x402-ValyuAcademic] Executing academic search for agent ${paymentRequest.agentId}: "${query}"`);
    
    const executeSearch = valyuDeepSearchTool.execute;
    if (!executeSearch) {
      return createX402PaymentErrorResponse(
        'Valyu search tool unavailable',
        resource,
        paymentRequest.agentId
      );
    }

    const searchResult = await executeSearch({
      query,
      searchType: 'academic',
      startDate
    }, undefined as any) as ValyuToolResult;

    if (!searchResult.success) {
      return createX402PaymentErrorResponse(
        searchResult.error || 'Academic search failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Log successful payment and search
    console.log(`[x402-ValyuAcademic] Payment successful for agent ${paymentRequest.agentId}. Results: ${searchResult.results.length}, Cost: $${searchResult.totalCost}`);

    // Return successful response with search results
    return createX402PaymentSuccessResponse(
      {
        query: searchResult.query,
        results: searchResult.results,
        tx_id: searchResult.tx_id,
        totalCost: searchResult.totalCost,
        searchType: 'academic',
        timestamp: new Date().toISOString()
      },
      resource,
      paymentRequest.agentId
    );

  } catch (error) {
    console.error('[x402-ValyuAcademic] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // GET requests return resource information and payment requirements
  const resource = getResearchResource('valyu-academic');
  if (!resource) {
    return NextResponse.json(
      { error: 'Research resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    resource: resource,
    endpoint: '/api/research/valyu-academic',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json',
      'X-Payment-Request': 'JSON object with payment details'
    },
    example: {
      query: 'machine learning healthcare applications',
      startDate: '2024-01-01', // optional
      paymentRequest: {
        resourceId: 'valyu-academic',
        amount: '0.10',
        currency: 'USDT',
        agentId: 'agent_001',
        reasoning: 'Purchase academic research for analysis',
        signature: '0x...',
        message: '{"resourceId":"valyu-academic","amount":"0.10",...}',
        timestamp: Date.now(),
        nonce: 'random_hex_string'
      }
    }
  });
}
