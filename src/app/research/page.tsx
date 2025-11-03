'use client';

import '@/styles/poly402.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MainNav } from '@/components/navigation/MainNav';

interface ResearchResource {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  type: string;
  quality: string;
  freshness: string;
}

export default function ResearchPage() {
  const [resources, setResources] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/research/marketplace');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (quality: string) => {
    return quality.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-base">LOADING<span className="retro-blink">_</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Perspective Grid Background */}
      <div className="fixed bottom-0 left-0 right-0 h-[50vh] pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />

      <div className="relative z-10 p-8">
        <MainNav />

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ RESEARCH_MARKETPLACE
          </h1>
          <p className="text-xs text-gray-600">
            DATA SOURCES YOUR AI AGENTS CAN PURCHASE
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-white border-4 border-black p-6 mb-8"
          style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
          <h3 className="text-lg font-bold mb-3 uppercase">
            ▶ HOW X402 PAYMENTS WORK
          </h3>
          <p className="text-xs text-gray-700 mb-3">
            Your AI agents autonomously purchase research data using x402 micropayments.
            Each resource below can be accessed by your agents when they need it for analysis.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="bg-gray-100 border-2 border-black p-3">
              <div className="font-bold mb-1">STEP 1</div>
              <div className="text-gray-700">Agent decides research is needed</div>
            </div>
            <div className="bg-gray-100 border-2 border-black p-3">
              <div className="font-bold mb-1">STEP 2</div>
              <div className="text-gray-700">Payment made via BSC wallet</div>
            </div>
            <div className="bg-gray-100 border-2 border-black p-3">
              <div className="font-bold mb-1">STEP 3</div>
              <div className="text-gray-700">Data received and analyzed</div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <div key={resource.id}
              className="bg-white border-3 border-black p-6 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>

              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="text-2xl">
                  {resource.type === 'web' && '◎'}
                  {resource.type === 'academic' && '▣'}
                  {resource.type === 'news' && '▧'}
                  {resource.type === 'expert' && '◈'}
                  {resource.type === 'sentiment' && '◐'}
                </div>
                <span className="text-xs uppercase px-2 py-1 border-2 border-black bg-gray-100">
                  {getQualityBadge(resource.quality)}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-base font-bold mb-2">
                {resource.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-700 mb-4">
                {resource.description}
              </p>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div>
                  <div className="text-gray-600 mb-1">TYPE</div>
                  <div className="font-bold uppercase">{resource.type}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">FRESHNESS</div>
                  <div className="font-bold uppercase">{resource.freshness}</div>
                </div>
              </div>

              {/* Price */}
              <div className="pt-4 border-t-2 border-black text-center">
                <div className="text-2xl font-bold mb-1">
                  ${resource.price}
                </div>
                <div className="text-xs text-gray-600 uppercase">
                  {resource.currency} PER REQUEST
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-gray-100 border-2 border-black p-6">
          <div className="text-xs">
            <p className="mb-2">
              <span className="font-bold">▶</span> Agents automatically select resources based on their strategy
            </p>
            <p className="mb-2">
              <span className="font-bold">▶</span> Costs are deducted from agent&apos;s USDT balance
            </p>
            <p>
              <span className="font-bold">▶</span> Payment happens via BSC blockchain using x402 protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
