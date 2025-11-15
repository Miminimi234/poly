'use client';

import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/Polysentience.css';
import Link from 'next/link';

export default function WalletPage() {
  return (
    <div className="min-h-screen  text-white">
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

      <div className="relative z-10 p-4 sm:p-8">
        <MainNav />

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/dashboard" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            ▶ WALLET
          </h1>
          <p className="text-xs text-white-600">
            Solana WALLET & TRANSACTION MANAGEMENT
          </p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto px-4">
          <div className=" border-1 border-gray p-6 sm:p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>

            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">$</div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              COMING_SOON
            </h2>

            <p className="text-xs text-white-700 mb-6 sm:mb-8 leading-relaxed">
              WALLET MANAGEMENT
              <br />
              WILL BE AVAILABLE SOON.
              <br /><br />
              VIEW YOUR Solana WALLET,
              <br />
              MANAGE USDT/USDC BALANCES,
              <br />
              AND TRACK ALL TRANSACTIONS.
            </p>

            <Link href="/agents/create"
              className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-black border-2 border-gray text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
              CREATE AN AGENT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
