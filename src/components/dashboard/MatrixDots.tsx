'use client';

import { useEffect, useState } from 'react';

export function MatrixDots() {
  const [dots, setDots] = useState<string[]>([]);

  useEffect(() => {
    // Generate random dot pattern
    const generateDots = () => {
      const pattern = [];
      for (let i = 0; i < 50; i++) {
        pattern.push(Math.random() > 0.5 ? '•' : '·');
      }
      return pattern;
    };

    setDots(generateDots());

    const interval = setInterval(() => {
      setDots(generateDots());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-10 overflow-hidden">
      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {dots.join(' ')}
      </div>
    </div>
  );
}
