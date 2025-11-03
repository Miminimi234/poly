'use client';

import { useEffect, useState } from 'react';

interface TerminalProgressBarProps {
  label: string;
  duration?: number;
  autoRestart?: boolean;
}

export function TerminalProgressBar({ 
  label, 
  duration = 10000,
  autoRestart = true 
}: TerminalProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return autoRestart ? 0 : 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, autoRestart]);

  const barWidth = Math.floor((progress / 100) * 30); // 30 characters wide
  const bar = '█'.repeat(barWidth) + '░'.repeat(30 - barWidth);

  return (
    <div className="font-mono text-sm">
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span>{Math.floor(progress)}%</span>
      </div>
      <div className="text-gray-300">[{bar}]</div>
    </div>
  );
}
