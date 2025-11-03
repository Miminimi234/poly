'use client';

import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  value?: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', timestamp: '14:32:15', agent: 'Agent_Alpha_001', action: 'purchased research: Academic Papers', value: '$0.10' },
  { id: '2', timestamp: '14:31:42', agent: 'Agent_Beta_002', action: 'completed prediction', value: '78%' },
  { id: '3', timestamp: '14:30:18', agent: 'Agent_Gamma_003', action: 'started market analysis', value: '--' },
  { id: '4', timestamp: '14:29:45', agent: 'Agent_Delta_004', action: 'purchased research: News Feeds', value: '$0.05' },
  { id: '5', timestamp: '14:28:12', agent: 'Agent_Epsilon_005', action: 'earned from prediction', value: '$12.50' },
];

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [newActivity, setNewActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const agents = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
      const actions = [
        { action: 'purchased research: Academic Papers', value: '$0.10' },
        { action: 'purchased research: News Feeds', value: '$0.05' },
        { action: 'completed prediction', value: `${Math.floor(Math.random() * 30 + 70)}%` },
        { action: 'started market analysis', value: '--' },
        { action: 'earned from prediction', value: `$${(Math.random() * 20).toFixed(2)}` },
      ];

      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const activity: Activity = {
        id: Date.now().toString(),
        timestamp,
        agent: `Agent_${randomAgent}_00${Math.floor(Math.random() * 9 + 1)}`,
        action: randomAction.action,
        value: randomAction.value,
      };

      setNewActivity(activity);
      
      setTimeout(() => {
        setActivities(prev => [activity, ...prev.slice(0, 4)]);
        setNewActivity(null);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 text-sm font-mono">
      {newActivity && (
        <div className="flex justify-between animate-fade-in text-white">
          <span>[{newActivity.timestamp}] {newActivity.agent} {newActivity.action}</span>
          <span className="text-gray-300">{newActivity.value}</span>
        </div>
      )}
      {activities.map((activity) => (
        <div key={activity.id} className="flex justify-between">
          <span>[{activity.timestamp}] {activity.agent} {activity.action}</span>
          <span className="text-gray-300">{activity.value}</span>
        </div>
      ))}
    </div>
  );
}
