'use client';

import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/poly402.css';
import Link from 'next/link';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function CreateAgentPage() {
  // const router = useRouter();
  // const [step, setStep] = useState(1);
  // const [formData, setFormData] = useState({
  //   name: '',
  //   description: '',
  //   strategyType: '',
  //   initialBalance: '10.0'
  // });
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState('');

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setLoading(true);

  //   try {
  //     const response = await fetch('/api/agents/create', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         name: formData.name,
  //         description: formData.description,
  //         strategy_type: formData.strategyType,
  //         initial_balance: parseFloat(formData.initialBalance)
  //       })
  //     });

  //     const data = await response.json();
  //     if (!response.ok) throw new Error(data.error || 'Failed to create agent');
  //     router.push(`/agents/${data.agent.id}`);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to create agent');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const selectedStrategy = AGENT_STRATEGIES.find(s => s.type === formData.strategyType);

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
          <Link href="/agents" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO AGENTS
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ CREATE_AGENT
          </h1>
          <p className="text-xs text-gray-600">
            CUSTOM AGENT CREATION
          </p>
        </div>

        {/* Coming Soon Message */}
        <div className="max-w-4xl">
          <div className="bg-white border-4 border-black p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold mb-4">
              COMING SOON
            </h2>
          </div>
        </div>

        {/* 
        COMMENTED OUT FOR FUTURE USE - Original Create Agent Form
        
        <form onSubmit={handleSubmit} className="max-w-4xl">
          // STEP 1: Basic Information
          {step === 1 && (
            <div className="bg-white border-4 border-black p-8"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-6">▶ BASIC_INFO</h2>
              // ... all form steps commented out for future use ...
            </div>
          )}
        </form>
        */}
      </div>
    </div>
  );
}
