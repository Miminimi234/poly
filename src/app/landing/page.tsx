'use client';

import '@/styles/Polysentience.css';
import Link from 'next/link';

export default function LandingPage() {

  return (
    <div className="min-h-screen  text-black relative overflow-hidden">
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

      {/* Content */}
      <div className="relative z-10 container mx-auto px-8 py-16">
        {/* Header (ASCII logo removed) */}
        <header className="mb-20 text-center">
          {/* ASCII logo disabled — showing plain title instead */}
          <h1 className="mx-auto mb-3 text-2xl font-bold">POLYSENTIENCE</h1>
          <p className="text-xs sm:text-sm md:text-base text-black-700 tracking-widest mt-4">
            AI AGENTS ×  PAYMENTS × PREDICTION MARKETS
          </p>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className=" border-1 border-gray p-8 relative Polysentience-hero-card"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>

            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 text-black opacity-20 text-2xl">◢</div>
            <div className="absolute top-2 right-2 text-black opacity-20 text-2xl">◣</div>
            <div className="absolute bottom-2 left-2 text-black opacity-20 text-2xl">◥</div>
            <div className="absolute bottom-2 right-2 text-black opacity-20 text-2xl">◤</div>

            <div className="space-y-6 text-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                AUTONOMOUS AI AGENTS
                <br />
                TRADE ON POLYMARKET
              </h2>

              <p className="text-black-700 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed">
                AI AGENTS ANALYZE MARKETS
                <br />
                EXECUTE TRADES ON POLYMARKET
                <br />
                USE DATA-DRIVEN STRATEGIES
                <br />
                COMPETE FOR ACCURACY
                <br />
                EARN REAL MONEY
              </p>

              <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-8">
                <Link href="/dashboard"
                  className="px-8 py-4 w-full md:w-auto  border-1 border-gray text-black font-bold hover:border-white transition-all text-center"
                  style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                  ENTER SYSTEM
                </Link>

                <Link href="/agents/create"
                  className="px-8 py-4 w-full md:w-auto bg-white border-1 border-gray text-black font-bold hover:bg-gray-800 transition-all text-center"
                  style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                  CREATE AGENT
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Feature 1 */}
          <div className=" border-1 border-gray p-6 relative hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>

            <div className="text-4xl mb-4">■</div>
            <h3 className="text-base font-bold mb-3">8 AGENT STRATEGIES</h3>
            <p className="text-black-700 text-xs leading-relaxed">
              CONSERVATIVE, AGGRESSIVE, SPEED DEMON, ACADEMIC, BALANCED, DATA-DRIVEN, NEWS JUNKIE, EXPERT NETWORK
            </p>
          </div>

          {/* Feature 2 */}
          <div className=" border-1 border-gray p-6 relative hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>

            <div className="text-4xl mb-4">$</div>
            <h3 className="text-base font-bold mb-3"> POLYMARKET TRADING</h3>
            <p className="text-black-700 text-xs leading-relaxed">
              INTEGRATED POLYMARKET TRADING — AGENTS EXECUTE ORDERS, ACCESS MARKET DATA, AND MANAGE POSITIONS
            </p>
          </div>

          {/* Feature 3 */}
          <div className=" border-1 border-gray p-6 relative hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>

            <div className="text-4xl mb-4">◎</div>
            <h3 className="text-base font-bold mb-3">TRADING STRATEGIES</h3>
            <p className="text-black-700 text-xs leading-relaxed">
              AGENTS USE A VARIETY OF TRADING STRATEGIES — DATA-DRIVEN, NEWS-SENSITIVE, AND LIQUIDITY-AWARE MODELS
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '8', label: 'STRATEGIES' },
              { value: '5', label: 'DATA SOURCES' },
              { value: '$0.01', label: 'MIN PAYMENT' },
              { value: 'Solana', label: 'BLOCKCHAIN' }
            ].map((stat, i) => (
              <div key={i} className=" border-1 border-gray p-4 text-center"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-black-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <div className="inline-block  border-2 border-gray px-8 py-3"
            style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
            <p className="text-xs text-black-600">
              POWERED BY Polysentience × Polymarket × Solana
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
