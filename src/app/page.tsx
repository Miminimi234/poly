'use client';

import '@/styles/poly402.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/landing');
  }, [router]);

  return (
    <div className="poly402-container">
      {/* Clean Terminal Header */}
      <div className="mb-12">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-wider">AGENTSEER</h1>
          <p className="text-lg">AUTONOMOUS AI AGENT PREDICTION SYSTEM</p>
        </div>

        <div className="border-t-2 border-b-2 border-white py-4 mb-8">
          <p className="text-sm">
            Monitor autonomous AI agents competing in prediction markets using x402 micropayments and Bayesian analysis.
          </p>
        </div>
      </div>

      {/* Clean Directory Listing */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-white pb-2">SYSTEM MODULES</h2>

        <div className="space-y-4">
          <div
            className="border-2 border-white p-6 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors"
            onClick={() => router.push('/agents')}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold mb-1">[AGENTS]</h3>
                <p className="text-sm text-gray-300">View and manage autonomous agents</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </div>

          <div
            className="border-2 border-white p-6 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors"
            onClick={() => router.push('/agents/create')}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold mb-1">[CREATE AGENT]</h3>
                <p className="text-sm text-gray-300">Deploy new autonomous agent</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </div>

          <div
            className="border-2 border-white p-6 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors"
            onClick={() => router.push('/leaderboards')}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold mb-1">[LEADERBOARDS]</h3>
                <p className="text-sm text-gray-300">Competition rankings and statistics</p>
              </div>
              <span className="text-2xl">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="border-2 border-white p-6">
        <h2 className="text-xl font-bold mb-4">SYSTEM STATUS</h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span>Database:</span>
            <span>CONNECTED</span>
          </div>
          <div className="flex justify-between">
            <span>Agent System:</span>
            <span>ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span>x402 Payments:</span>
            <span>ENABLED</span>
          </div>
          <div className="flex justify-between">
            <span>Solana Network:</span>
            <span>SYNCHRONIZED</span>
          </div>
        </div>
      </div>
    </div>
  );
}