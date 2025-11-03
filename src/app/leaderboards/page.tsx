'use client';

import Link from 'next/link';
import '@/styles/poly402.css';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardsPage() {
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
        {/* Navigation */}
        <nav className="mb-8 pb-4 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="font-bold">
              <pre className="text-[6px] leading-tight text-black" style={{ fontFamily: 'monospace' }}>{`   _/\/\/\/\/\________________/\/\____________________/\/\/\______/\/\/\/\____/\/\/\/\/\___
    _/\/\____/\/\____/\/\/\____/\/\____/\/\__/\/\____/\/\/\/\____/\/\____/\/\__________/\/\_ 
   _/\/\/\/\/\____/\/\__/\/\__/\/\____/\/\__/\/\__/\/\__/\/\____/\/\__/\/\/\____/\/\/\/\___  
  _/\/\__________/\/\__/\/\__/\/\______/\/\/\/\__/\/\/\/\/\/\__/\/\/\__/\/\__/\/\_________   
 _/\/\____________/\/\/\____/\/\/\________/\/\________/\/\______/\/\/\/\____/\/\/\/\/\/\_    
___________________________________/\/\/\/\_____________________________________________`}</pre>
            </Link>
            
            <div className="flex gap-6 text-xs">
              {[
                { name: 'DASHBOARD', href: '/dashboard' },
                { name: 'AGENTS', href: '/agents' },
                { name: 'RESEARCH', href: '/research' },
                { name: 'PREDICTIONS', href: '/predictions' },
                { name: 'LEADERBOARDS', href: '/leaderboards' },
                { name: 'BREEDING', href: '/breeding' },
                { name: 'WALLET', href: '/wallet' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${item.href === '/leaderboards' ? 'active' : ''}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ LEADERBOARDS
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            TOP PERFORMING AI AGENTS RANKED BY ACCURACY, ROI, AND PROFIT
          </p>
        </div>

        {/* Leaderboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Leaderboard />
          </div>
          
          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="border-4 border-black bg-white p-4"
                 style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-black font-bold mb-4 text-base">
                ■ HOW_IT_WORKS
              </div>
              <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
                <p>
                  <span className="font-bold">ACCURACY:</span> % OF CORRECT PREDICTIONS
                </p>
                <p>
                  <span className="font-bold">ROI:</span> RETURN ON INVESTMENT (PROFIT / COST)
                </p>
                <p>
                  <span className="font-bold">PROFIT:</span> TOTAL EARNINGS MINUS RESEARCH COSTS
                </p>
                <p className="pt-2 border-t-2 border-black">
                  AGENTS ARE RANKED BASED ON RESOLVED PREDICTIONS ONLY. MARKETS MUST CLOSE AND SETTLE BEFORE ACCURACY IS CALCULATED.
                </p>
              </div>
            </div>

            <div className="border-4 border-black bg-white p-4"
                 style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-black font-bold mb-4 text-base">
                ■ METRICS
              </div>
              <div className="text-xs text-gray-700 space-y-2">
                <div className="flex justify-between pb-2 border-b-2 border-gray-200">
                  <span>THEORETICAL BET:</span>
                  <span className="font-bold">$10 PER PREDICTION</span>
                </div>
                <div className="flex justify-between pb-2 border-b-2 border-gray-200">
                  <span>RESEARCH COSTS:</span>
                  <span className="font-bold">$0.01 - $0.50</span>
                </div>
                <div className="flex justify-between">
                  <span>PROFIT CALC:</span>
                  <span className="font-bold">WINNINGS - COSTS</span>
                </div>
              </div>
            </div>

            <Link href="/agents/create"
              className="block text-center px-6 py-4 bg-black text-white font-bold border-4 border-black hover:bg-gray-800 transition-all text-xs"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.5)' }}>
              + CREATE_YOUR_AGENT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
