/**
 * -enabled News Feeds API
 * Returns HTTP 402 "Payment Required" when no payment is provided
 * Executes news search when valid  payment is provided
 */

import {
  createPaymentErrorResponse,
  createPaymentRequiredResponse,
  createPaymentSuccessResponse,
  getResearchResource,
  PaymentRequest,
  verifyPayment
} from '@/lib/payment-verification';
import { valyuDeepSearchTool, type ValyuToolResult } from '@/lib/tools/valyu_search';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const resource = getResearchResource('news-feeds');
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

    // Execute news search using Valyu
    console.log(`[-NewsFeeds] Executing news search for agent ${paymentRequest.agentId}: "${query}"`);

    const executeSearch = valyuDeepSearchTool.execute;
    if (!executeSearch) {
      return createPaymentErrorResponse(
        'Valyu search tool unavailable',
        resource,
        paymentRequest.agentId
      );
    }

    const searchResult = await executeSearch({
      query,
      searchType: 'web', // Use web search for news
      startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // Default to last 7 days
    }, undefined as any) as ValyuToolResult;

    if (!searchResult.success) {
      return createPaymentErrorResponse(
        searchResult.error || 'News search failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Filter results for news sources
    const newsResults = searchResult.results.filter(result =>
      result.source.toLowerCase().includes('news') ||
      result.source.toLowerCase().includes('reuters') ||
      result.source.toLowerCase().includes('bloomberg') ||
      result.source.toLowerCase().includes('cnn') ||
      result.source.toLowerCase().includes('bbc') ||
      result.source.toLowerCase().includes('guardian') ||
      result.source.toLowerCase().includes('nytimes') ||
      result.source.toLowerCase().includes('washingtonpost') ||
      result.url.includes('news') ||
      result.title.toLowerCase().includes('breaking') ||
      result.title.toLowerCase().includes('update')
    );

    // Log successful payment and search
    console.log(`[-NewsFeeds] Payment successful for agent ${paymentRequest.agentId}. Results: ${newsResults.length}, Cost: $${searchResult.totalCost}`);

    // Return successful response with news results
    return createPaymentSuccessResponse(
      {
        query: searchResult.query,
        results: newsResults,
        tx_id: searchResult.tx_id,
        totalCost: searchResult.totalCost,
        searchType: 'news',
        timestamp: new Date().toISOString(),
        filteredFrom: searchResult.results.length
      },
      resource,
      paymentRequest.agentId
    );

  } catch (error) {
    console.error('[-NewsFeeds] Error:', error);
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
  const resource = getResearchResource('news-feeds');
  if (!resource) {
    return NextResponse.json(
      { error: 'Research resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    resource: resource,
    endpoint: '/api/research/news-feeds',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json',
      'X-Payment-Request': 'JSON object with payment details'
    },
    example: {
      query: 'breaking news about AI regulation',
      startDate: '2024-01-01', // optional, defaults to last 7 days
      paymentRequest: {
        resourceId: 'news-feeds',
        amount: '0.05',
        currency: 'USDT',
        agentId: 'agent_001',
        reasoning: 'Purchase news feeds for analysis',
        signature: '0x...',
        message: '{"resourceId":"news-feeds","amount":"0.05",...}',
        timestamp: Date.now(),
        nonce: 'random_hex_string'
      }
    }
  });
}
