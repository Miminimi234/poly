/**
 * -enabled Social Sentiment Analysis API
 * Returns HTTP 402 "Payment Required" when no payment is provided
 * Executes sentiment analysis when valid  payment is provided
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
    const resource = getResearchResource('sentiment');
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
    const { query, startDate, platform } = await request.json().catch(() => ({}));

    if (!query) {
      return createPaymentErrorResponse(
        'Search query is required',
        resource,
        paymentRequest.agentId
      );
    }

    // Enhance query for sentiment analysis
    const sentimentQuery = platform
      ? `${query} ${platform} sentiment opinion reaction social media`
      : `${query} sentiment opinion reaction social media twitter reddit`;

    // Execute sentiment analysis search using Valyu
    console.log(`[-Sentiment] Executing sentiment analysis for agent ${paymentRequest.agentId}: "${sentimentQuery}"`);

    const executeSearch = valyuDeepSearchTool.execute;
    if (!executeSearch) {
      return createPaymentErrorResponse(
        'Valyu search tool unavailable',
        resource,
        paymentRequest.agentId
      );
    }

    const searchResult = await executeSearch({
      query: sentimentQuery,
      searchType: 'web', // Use web search for social media content
      startDate: startDate || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // Default to last 3 days
    }, undefined as any) as ValyuToolResult;

    if (!searchResult.success) {
      return createPaymentErrorResponse(
        searchResult.error || 'Sentiment analysis search failed',
        resource,
        paymentRequest.agentId
      );
    }

    // Filter results for social media and sentiment content
    const sentimentResults = searchResult.results.filter(result =>
      result.source.toLowerCase().includes('twitter') ||
      result.source.toLowerCase().includes('reddit') ||
      result.source.toLowerCase().includes('facebook') ||
      result.source.toLowerCase().includes('linkedin') ||
      result.source.toLowerCase().includes('youtube') ||
      result.source.toLowerCase().includes('tiktok') ||
      result.source.toLowerCase().includes('instagram') ||
      result.url.includes('twitter.com') ||
      result.url.includes('reddit.com') ||
      result.url.includes('facebook.com') ||
      result.url.includes('linkedin.com') ||
      result.url.includes('youtube.com') ||
      result.url.includes('tiktok.com') ||
      result.url.includes('instagram.com') ||
      result.title.toLowerCase().includes('sentiment') ||
      result.title.toLowerCase().includes('opinion') ||
      result.title.toLowerCase().includes('reaction') ||
      result.title.toLowerCase().includes('viral') ||
      result.title.toLowerCase().includes('trending') ||
      result.content.toLowerCase().includes('sentiment') ||
      result.content.toLowerCase().includes('opinion') ||
      result.content.toLowerCase().includes('reaction')
    );

    // If no social media results found, use all results but mark as general
    const finalResults = sentimentResults.length > 0 ? sentimentResults : searchResult.results;

    // Simple sentiment analysis (in a real implementation, this would use a proper sentiment analysis model)
    const sentimentAnalysis = {
      positive: finalResults.filter(r =>
        r.title.toLowerCase().includes('positive') ||
        r.title.toLowerCase().includes('good') ||
        r.title.toLowerCase().includes('great') ||
        r.title.toLowerCase().includes('excellent') ||
        r.content.toLowerCase().includes('positive') ||
        r.content.toLowerCase().includes('good')
      ).length,
      negative: finalResults.filter(r =>
        r.title.toLowerCase().includes('negative') ||
        r.title.toLowerCase().includes('bad') ||
        r.title.toLowerCase().includes('terrible') ||
        r.title.toLowerCase().includes('awful') ||
        r.content.toLowerCase().includes('negative') ||
        r.content.toLowerCase().includes('bad')
      ).length,
      neutral: finalResults.length - finalResults.filter(r =>
        r.title.toLowerCase().includes('positive') ||
        r.title.toLowerCase().includes('good') ||
        r.title.toLowerCase().includes('great') ||
        r.title.toLowerCase().includes('excellent') ||
        r.title.toLowerCase().includes('negative') ||
        r.title.toLowerCase().includes('bad') ||
        r.title.toLowerCase().includes('terrible') ||
        r.title.toLowerCase().includes('awful') ||
        r.content.toLowerCase().includes('positive') ||
        r.content.toLowerCase().includes('good') ||
        r.content.toLowerCase().includes('negative') ||
        r.content.toLowerCase().includes('bad')
      ).length
    };

    const totalSentiment = sentimentAnalysis.positive + sentimentAnalysis.negative + sentimentAnalysis.neutral;
    const sentimentScore = totalSentiment > 0
      ? (sentimentAnalysis.positive - sentimentAnalysis.negative) / totalSentiment
      : 0;

    // Log successful payment and search
    console.log(`[-Sentiment] Payment successful for agent ${paymentRequest.agentId}. Results: ${finalResults.length}, Sentiment Score: ${sentimentScore.toFixed(3)}, Cost: $${searchResult.totalCost}`);

    // Return successful response with sentiment analysis results
    return createPaymentSuccessResponse(
      {
        query: searchResult.query,
        results: finalResults,
        tx_id: searchResult.tx_id,
        totalCost: searchResult.totalCost,
        searchType: 'sentiment',
        timestamp: new Date().toISOString(),
        platform: platform || 'all',
        sentimentAnalysis: {
          ...sentimentAnalysis,
          score: sentimentScore,
          interpretation: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral'
        },
        filteredFrom: searchResult.results.length,
        isSocialContent: sentimentResults.length > 0
      },
      resource,
      paymentRequest.agentId
    );

  } catch (error) {
    console.error('[-Sentiment] Error:', error);
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
  const resource = getResearchResource('sentiment');
  if (!resource) {
    return NextResponse.json(
      { error: 'Research resource not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    resource: resource,
    endpoint: '/api/research/sentiment',
    method: 'POST',
    requiredHeaders: {
      'Content-Type': 'application/json',
      'X-Payment-Request': 'JSON object with payment details'
    },
    example: {
      query: 'Bitcoin price prediction',
      platform: 'twitter', // optional: twitter, reddit, all
      startDate: '2024-01-01', // optional, defaults to last 3 days
      paymentRequest: {
        resourceId: 'sentiment',
        amount: '0.02',
        currency: 'USDT',
        agentId: 'agent_001',
        reasoning: 'Purchase sentiment analysis for analysis',
        signature: '0x...',
        message: '{"resourceId":"sentiment","amount":"0.02",...}',
        timestamp: Date.now(),
        nonce: 'random_hex_string'
      }
    }
  });
}
