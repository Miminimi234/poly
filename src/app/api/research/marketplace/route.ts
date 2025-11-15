/**
 * Research Marketplace API
 * Lists all available -enabled research resources and their costs
 */

import { getAllResearchResources, RESEARCH_RESOURCES } from '@/lib/x402/payment-verification';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const resources = getAllResearchResources();

    // Get query parameters for filtering
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const quality = url.searchParams.get('quality');
    const maxPrice = url.searchParams.get('maxPrice');
    const minPrice = url.searchParams.get('minPrice');

    // Filter resources based on query parameters
    let filteredResources = resources;

    if (type) {
      filteredResources = filteredResources.filter(r => r.type === type);
    }

    if (quality) {
      filteredResources = filteredResources.filter(r => r.quality === quality);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredResources = filteredResources.filter(r => parseFloat(r.price) <= max);
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredResources = filteredResources.filter(r => parseFloat(r.price) >= min);
    }

    // Sort by price (ascending)
    filteredResources.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    // Calculate statistics
    const stats = {
      totalResources: resources.length,
      filteredResources: filteredResources.length,
      totalTypes: [...new Set(resources.map(r => r.type))].length,
      priceRange: {
        min: Math.min(...resources.map(r => parseFloat(r.price))),
        max: Math.max(...resources.map(r => parseFloat(r.price))),
        average: resources.reduce((sum, r) => sum + parseFloat(r.price), 0) / resources.length
      },
      qualityDistribution: {
        high: resources.filter(r => r.quality === 'high').length,
        medium: resources.filter(r => r.quality === 'medium').length,
        low: resources.filter(r => r.quality === 'low').length
      },
      freshnessDistribution: {
        fresh: resources.filter(r => r.freshness === 'fresh').length,
        recent: resources.filter(r => r.freshness === 'recent').length,
        stale: resources.filter(r => r.freshness === 'stale').length
      }
    };

    return NextResponse.json({
      success: true,
      marketplace: {
        resources: filteredResources,
        statistics: stats,
        filters: {
          type: type || null,
          quality: quality || null,
          maxPrice: maxPrice || null,
          minPrice: minPrice || null
        }
      },
      usage: {
        endpoint: '/api/research/marketplace',
        method: 'GET',
        queryParameters: {
          type: 'Filter by resource type (web, academic, news, expert, sentiment)',
          quality: 'Filter by quality (high, medium, low)',
          maxPrice: 'Maximum price in USDT',
          minPrice: 'Minimum price in USDT'
        },
        examples: [
          '/api/research/marketplace?type=academic&quality=high',
          '/api/research/marketplace?maxPrice=0.10',
          '/api/research/marketplace?type=news&quality=fresh'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ResearchMarketplace] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST requests can be used to get detailed information about specific resources
  try {
    const body = await request.json();
    const { resourceIds } = body;

    if (!resourceIds || !Array.isArray(resourceIds)) {
      return NextResponse.json(
        { error: 'resourceIds array is required' },
        { status: 400 }
      );
    }

    const detailedResources = resourceIds.map(id => {
      const resource = RESEARCH_RESOURCES[id];
      if (!resource) {
        return { id, error: 'Resource not found' };
      }

      return {
        ...resource,
        endpoint: `/api/research/${id}`,
        method: 'POST',
        requiredHeaders: {
          'Content-Type': 'application/json',
          'X-Payment-Request': 'JSON object with payment details'
        },
        example: {
          query: 'example search query',
          paymentRequest: {
            resourceId: id,
            amount: resource.price,
            currency: resource.currency,
            agentId: 'agent_001',
            reasoning: `Purchase ${resource.name} for analysis`,
            signature: '0x...',
            message: `{"resourceId":"${id}","amount":"${resource.price}",...}`,
            timestamp: Date.now(),
            nonce: 'random_hex_string'
          }
        }
      };
    });

    return NextResponse.json({
      success: true,
      resources: detailedResources,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ResearchMarketplace] POST Error:', error);
    return NextResponse.json(
      {
        error: 'Invalid request body',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

