'use client';

import { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface Stats {
  activeAgents: number;
  predictions: number;
  earnings: number;
  accuracy: number;
}

export function RealTimeStats() {
  const [stats, setStats] = useState<Stats>({
    activeAgents: 12,
    predictions: 847,
    earnings: 2450,
    accuracy: 78.4
  });

  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const updateType = Math.floor(Math.random() * 4);

      setStats(prev => {
        const newStats = { ...prev };

        switch (updateType) {
          case 0:
            newStats.activeAgents = Math.max(1, prev.activeAgents + (Math.random() > 0.7 ? 1 : 0));
            break;
          case 1:
            newStats.predictions = prev.predictions + Math.floor(Math.random() * 3);
            break;
          case 2:
            newStats.earnings = prev.earnings + parseFloat((Math.random() * 10).toFixed(2));
            break;
          case 3:
            newStats.accuracy = Math.min(99.9, Math.max(50, prev.accuracy + (Math.random() - 0.5) * 0.5));
            break;
        }

        return newStats;
      });

      setFlashingIndex(updateType);
      setTimeout(() => setFlashingIndex(null), 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`bg-[#0f1729] border-2 border-[#00fff9] p-4 cursor-pointer transition-all duration-300 relative ${flashingIndex === 0 ? 'scale-105 border-[#ff006e]' : ''}`}
        style={{
          boxShadow: flashingIndex === 0
            ? '0 0 25px rgba(255, 0, 110, 0.6)'
            : '0 0 15px rgba(0, 255, 249, 0.3)'
        }}>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#00fff9]" style={{ boxShadow: '0 0 8px #00fff9' }} />
        <div className="text-4xl font-black mb-2 text-[#00fff9]" style={{ textShadow: '0 0 15px #00fff9' }}>
          <AnimatedCounter value={stats.activeAgents} duration={800} />
        </div>
        <div className="text-xs font-mono uppercase tracking-wider text-white-400">ACTIVE_AGENTS</div>
      </div>

      <div className={`bg-[#0f1729] border-2 border-[#ff006e] p-4 cursor-pointer transition-all duration-300 relative ${flashingIndex === 1 ? 'scale-105 border-[#00fff9]' : ''}`}
        style={{
          boxShadow: flashingIndex === 1
            ? '0 0 25px rgba(0, 255, 249, 0.6)'
            : '0 0 15px rgba(255, 0, 110, 0.3)'
        }}>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#ff006e]" style={{ boxShadow: '0 0 8px #ff006e' }} />
        <div className="text-4xl font-black mb-2 text-[#ff006e]" style={{ textShadow: '0 0 15px #ff006e' }}>
          <AnimatedCounter value={stats.predictions} duration={800} />
        </div>
        <div className="text-xs font-mono uppercase tracking-wider text-white-400">PREDICTIONS</div>
      </div>

      <div className={`bg-[#0f1729] border-2 border-[#8b00ff] p-4 cursor-pointer transition-all duration-300 relative ${flashingIndex === 2 ? 'scale-105 border-[#00fff9]' : ''}`}
        style={{
          boxShadow: flashingIndex === 2
            ? '0 0 25px rgba(0, 255, 249, 0.6)'
            : '0 0 15px rgba(139, 0, 255, 0.3)'
        }}>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#8b00ff]" style={{ boxShadow: '0 0 8px #8b00ff' }} />
        <div className="text-4xl font-black mb-2 text-[#8b00ff]" style={{ textShadow: '0 0 15px #8b00ff' }}>
          $<AnimatedCounter value={Math.floor(stats.earnings)} duration={800} />
        </div>
        <div className="text-xs font-mono uppercase tracking-wider text-white-400">TOTAL_EARNINGS</div>
      </div>

      <div className={`bg-[#0f1729] border-2 border-[#39ff14] p-4 cursor-pointer transition-all duration-300 relative ${flashingIndex === 3 ? 'scale-105 border-[#00fff9]' : ''}`}
        style={{
          boxShadow: flashingIndex === 3
            ? '0 0 25px rgba(0, 255, 249, 0.6)'
            : '0 0 15px rgba(57, 255, 20, 0.3)'
        }}>
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#39ff14]" style={{ boxShadow: '0 0 8px #39ff14' }} />
        <div className="text-4xl font-black mb-2 text-[#39ff14]" style={{ textShadow: '0 0 15px #39ff14' }}>
          <AnimatedCounter value={parseFloat(stats.accuracy.toFixed(1))} duration={800} />%
        </div>
        <div className="text-xs font-mono uppercase tracking-wider text-white-400">AVG_ACCURACY</div>
      </div>
    </>
  );
}
