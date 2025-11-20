'use client';

import { useEffect, useState } from 'react';

interface AgentStatusProps {
  name: string;
  initialStatus: string;
}

const STATUSES = ['RESEARCHING', 'ANALYZING', 'IDLE', 'PREDICTING'];

export function AgentStatus({ name, initialStatus }: AgentStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatus(STATUSES[Math.floor(Math.random() * STATUSES.length)]);
    }, 8000);

    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    if (status === 'RESEARCHING' || status === 'ANALYZING' || status === 'PREDICTING') {
      const dotsInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);

      return () => clearInterval(dotsInterval);
    } else {
      setDots('');
    }
  }, [status]);

  return (
    <div className="flex justify-between transition-all duration-300">
      <span>{name}</span>
      <span className="text-black-300 min-w-[120px] text-right">
        {status}{dots}
      </span>
    </div>
  );
}
