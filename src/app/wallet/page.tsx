'use client';

import Link from 'next/link';
import '@/styles/poly402.css';

export default function WalletPage() {
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
                  className={`nav-item ${item.href === '/wallet' ? 'active' : ''}`}>
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
            ▶ WALLET
          </h1>
          <p className="text-xs text-gray-600">
            BSC WALLET & TRANSACTION MANAGEMENT
          </p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-4 border-black p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>
            
            <div className="text-6xl mb-6">$</div>
            
            <h2 className="text-3xl font-bold mb-4">
              COMING_SOON
            </h2>
            
            <p className="text-xs text-gray-700 mb-8 leading-relaxed">
              WALLET MANAGEMENT
              <br />
              WILL BE AVAILABLE SOON.
              <br /><br />
              VIEW YOUR BSC WALLET,
              <br />
              MANAGE USDT/USDC BALANCES,
              <br />
              AND TRACK ALL TRANSACTIONS.
            </p>

            <Link href="/agents/create"
              className="inline-block px-8 py-3 bg-black border-2 border-black text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
              CREATE AN AGENT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
