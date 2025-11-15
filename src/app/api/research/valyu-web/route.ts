/**
 * -enabled Valyu Web Search API
 * Returns HTTP 402 "Payment Required" when no payment is provided
 * Executes Valyu web search when valid  payment is provided
 */

import {
  createPaymentErrorResponse,
  createPaymentRequiredResponse,
  createPaymentSuccessResponse,
  getResearchResource,
  PaymentRequest,
  verifyPayment
} from '@/lib//payment-verification';
import { valyuWebSearchTool, type ValyuToolResult } from '@/lib/tools/valyu_search';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const resource = getResearchResource('valyu-web');
    if (!resource) {
      return NextResponse.json(
        { error: 'Research resource not found' },
        { status: 404 }
      );
    }

    // Extract payment request from body
    let paymentRequest: PaymentRequest | null = null;
    try {
      const body = await request.json();
      paymentRequest = body.paymentRequest || null;
    } catch (error) {
      // If no payment request, return 402
      return createPaymentRequiredResponse(resource);
    }

    // If no payment request provided, return 402
    if (!paymentRequest) {
      return createPaymentRequiredResponse(resource);
    }

    // Verify payment
    const verification = await verifyPayment(
      paymentRequest,
      resource.price,
      resource.currency
    );

    if (!verification.isValid) {
      return createPaymentErrorResponse(
        verification.error || 'Payment verification failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Extract search parameters from request
    const { query, startDate } = await request.json().catch(() => ({}));

    if (!query) {
      return createPaymentErrorResponse(
        'Search query is required',
        resource,
        paymentRequest.agentId
      );
    }

    // Execute Valyu web search
    console.log(`[-ValyuWeb] Executing web search for agent ${paymentRequest.agentId}: "${query}"`);

    const executeSearch = valyuWebSearchTool.execute;
    if (!executeSearch) {
      return createPaymentErrorResponse(
        'Valyu search tool unavailable',
        resource,
        paymentRequest.agentId
      );
    }

    const searchResult = await executeSearch({
      query,
      startDate
    }, undefined as any) as ValyuToolResult;

    if (!searchResult.success) {
      return createPaymentErrorResponse(
        searchResult.error || 'Search failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Log successful payment and search
    console.log(`[-ValyuWeb] Payment successful for agent ${paymentRequest.agentId}. Results: ${searchResult.results.length}, Cost: $${searchResult.totalCost}`);

    // Return successful response with search results
    return createPaymentSuccessResponse(
      {
        query: searchResult.query,
        results: searchResult.results,
        tx_id: searchResult.tx_id,
        totalCost: searchResult.totalCost,
        searchType: 'web',
        timestamp: new Date().toISOString()
      },
      resource,
      paymentRequest.agentId
    );

  } catch (error) {
    console.error('[-ValyuWeb] Error:', error);
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
  const resource = getResearchResource('valyu-web');
  if (!resource) {
    return NextResponse.json(
      { error: 'Research resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    resource: resource,
    endpoint: '/api/research/valyu-web',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json',
      'X-Payment-Request': 'JSON object with payment details'
    },
    example: {
      query: 'search query here',
      startDate: '2024-01-01', // optional
      paymentRequest: {
        resourceId: 'valyu-web',
        amount: '0.01',
        currency: 'USDT',
        agentId: 'agent_001',
        reasoning: 'Purchase web search for analysis',
        signature: '0x...',
        message: '{"resourceId":"valyu-web","amount":"0.01",...}',
        timestamp: Date.now(),
        nonce: 'random_hex_string'
      }
    }
  });
}
