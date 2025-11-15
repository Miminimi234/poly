'use client';

import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/Polysentience.css';
import Link from 'next/link';

export default function BreedingPage() {
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

      <div className="relative z-10 p-8">
        <MainNav />

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="font-bold mb-3 breeding-title">
            ▶ AGENT_BREEDING
          </h1>
          <p className="text-white-600 breeding-subtitle">
            COMBINE AGENT STRATEGIES TO CREATE NEW AGENTS
          </p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-2xl mx-auto">
          <div className=" border-1 border-gray p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>

            <div className="text-6xl mb-6">◈</div>

            <h2 className="text-3xl font-bold mb-4">
              COMING_SOON
            </h2>

            <p className="text-xs text-white-700 mb-8 leading-relaxed">
              AGENT BREEDING & EVOLUTION
              <br />
              WILL BE AVAILABLE SOON.
              <br /><br />
              COMBINE SUCCESSFUL AGENT STRATEGIES,
              <br />
              EVOLVE BETTER RESEARCH APPROACHES,
              <br />
              AND CREATE NEXT-GEN AI AGENTS.
            </p>

            <Link href="/agents/create"
              className="inline-block px-8 py-3 bg-black border-2 border-gray text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
              CREATE AN AGENT
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
