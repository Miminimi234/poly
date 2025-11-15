/**
 * -enabled Expert Analysis API
 * Returns HTTP 402 "Payment Required" when no payment is provided
 * Executes expert analysis when valid  payment is provided
 */

import {
  createPaymentErrorResponse,
  createPaymentRequiredResponse,
  createPaymentSuccessResponse,
  getResearchResource,
  PaymentRequest,
  verifyPayment
} from '@/lib//payment-verification';
import { valyuDeepSearchTool, type ValyuToolResult } from '@/lib/tools/valyu_search';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const resource = getResearchResource('expert-analysis');
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
    const { query, startDate, expertType } = await request.json().catch(() => ({}));

    if (!query) {
      return createPaymentErrorResponse(
        'Search query is required',
        resource,
        paymentRequest.agentId
      );
    }

    // Enhance query for expert analysis
    const expertQuery = expertType
      ? `${query} expert analysis ${expertType} professional opinion`
      : `${query} expert analysis professional opinion industry insight`;

    // Execute expert analysis search using Valyu
    console.log(`[-ExpertAnalysis] Executing expert analysis for agent ${paymentRequest.agentId}: "${expertQuery}"`);

    const executeSearch = valyuDeepSearchTool.execute;
    if (!executeSearch) {
      return createPaymentErrorResponse(
        'Valyu search tool unavailable',
        resource,
        paymentRequest.agentId
      );
    }

    const searchResult = await executeSearch({
      query: expertQuery,
      searchType: 'all', // Use comprehensive search for expert content
      startDate
    }, undefined as any) as ValyuToolResult;

    if (!searchResult.success) {
      return createPaymentErrorResponse(
        searchResult.error || 'Expert analysis search failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Filter results for expert sources
    const expertResults = searchResult.results.filter(result =>
      result.source.toLowerCase().includes('expert') ||
      result.source.toLowerCase().includes('analysis') ||
      result.source.toLowerCase().includes('research') ||
      result.source.toLowerCase().includes('institute') ||
      result.source.toLowerCase().includes('university') ||
      result.source.toLowerCase().includes('think tank') ||
      result.source.toLowerCase().includes('consulting') ||
      result.source.toLowerCase().includes('advisory') ||
      result.title.toLowerCase().includes('expert') ||
      result.title.toLowerCase().includes('analysis') ||
      result.title.toLowerCase().includes('opinion') ||
      result.title.toLowerCase().includes('insight') ||
      result.title.toLowerCase().includes('perspective') ||
      result.content.toLowerCase().includes('expert') ||
      result.content.toLowerCase().includes('professional') ||
      result.content.toLowerCase().includes('industry')
    );

    // If no expert results found, use all results but mark as general
    const finalResults = expertResults.length > 0 ? expertResults : searchResult.results;

    // Log successful payment and search
    console.log(`[-ExpertAnalysis] Payment successful for agent ${paymentRequest.agentId}. Results: ${finalResults.length}, Cost: $${searchResult.totalCost}`);

    // Return successful response with expert analysis results
    return createPaymentSuccessResponse(
      {
        query: searchResult.query,
        results: finalResults,
        tx_id: searchResult.tx_id,
        totalCost: searchResult.totalCost,
        searchType: 'expert',
        timestamp: new Date().toISOString(),
        expertType: expertType || 'general',
        filteredFrom: searchResult.results.length,
        isExpertContent: expertResults.length > 0
      },
      resource,
      paymentRequest.agentId
    );

  } catch (error) {
    console.error('[-ExpertAnalysis] Error:', error);
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
  const resource = getResearchResource('expert-analysis');
  if (!resource) {
    return NextResponse.json(
      { error: 'Research resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    resource: resource,
    endpoint: '/api/research/expert-analysis',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json',
      'X-Payment-Request': 'JSON object with payment details'
    },
    example: {
      query: 'AI regulation impact on financial services',
      expertType: 'financial', // optional: financial, tech, legal, etc.
      startDate: '2024-01-01', // optional
      paymentRequest: {
        resourceId: 'expert-analysis',
        amount: '0.50',
        currency: 'USDT',
        agentId: 'agent_001',
        reasoning: 'Purchase expert analysis for analysis',
        signature: '0x...',
        message: '{"resourceId":"expert-analysis","amount":"0.50",...}',
        timestamp: Date.now(),
        nonce: 'random_hex_string'
      }
    }
  });
}
