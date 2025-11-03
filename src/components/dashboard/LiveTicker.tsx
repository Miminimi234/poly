'use client';

import { useEffect, useState } from 'react';

interface LiveTickerProps {
  initialValue: number;
  label: string;
  prefix?: string;
  suffix?: string;
  updateInterval?: number;
}

export function LiveTicker({ 
  initialValue, 
  label, 
  prefix = '', 
  suffix = '',
  updateInterval = 3000 
}: LiveTickerProps) {
  const [value, setValue] = useState(initialValue);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      
      // Simulate value changes
      const change = Math.random() > 0.5 ? 1 : -1;
      const amount = Math.floor(Math.random() * 3) + 1;
      
      setValue(prev => Math.max(0, prev + (change * amount)));
      
      setTimeout(() => setIsUpdating(false), 300);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return (
    <div className={`transition-all duration-300 ${isUpdating ? 'scale-105 text-yellow-300' : ''}`}>
      <div className="text-3xl font-bold mb-1">
        {prefix}{value.toLocaleString()}{suffix}
      </div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
