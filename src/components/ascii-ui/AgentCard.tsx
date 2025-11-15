'use client';

import { getAgentAvatar } from '@/lib/ascii-art/agent-avatars';
import { DOT_MATRIX_AVATARS } from '@/lib/ascii-art/dot-matrix';
import { ASCIIProgressBar } from './ASCIIProgressBar';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    strategy_type: string;
    current_balance_usdt: number;
    accuracy: number;
    roi: number;
    is_active: boolean;
    is_bankrupt: boolean;
    total_predictions: number;
  };
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const avatar = getAgentAvatar(agent.strategy_type);

  const dotMatrixAvatar = DOT_MATRIX_AVATARS[agent.strategy_type] || DOT_MATRIX_AVATARS.default;

  return (
    <div
      className={`ascii-card-electric ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Dot-Matrix ASCII Avatar */}
      <div className="ascii-text text-center mb-4">
        <pre className="text-xs text-cyan-400 font-mono">{dotMatrixAvatar}</pre>
      </div>

      {/* Agent Name */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-green-400 mb-1">{agent.name}</h3>
        <p className="text-sm text-amber-400">[{avatar.name}]</p>
        <p className="text-xs text-green-600">{avatar.description}</p>
      </div>

      {/* Status Badge */}
      <div className="mb-4 text-center">
        {agent.is_bankrupt ? (
          <span className="inline-block px-3 py-1 border-2 border-red-500 text-red-500 font-bold">
            [BANKRUPT]
          </span>
        ) : agent.is_active ? (
          <span className="inline-block px-3 py-1 border-2 border-gray-500 text-green-500 font-bold">
            [ACTIVE]
          </span>
        ) : (
          <span className="inline-block px-3 py-1 border-2 border-amber-500 text-amber-500 font-bold">
            [IDLE]
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {/* Balance */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-600">Balance:</span>
            <span className="text-green-400 font-bold">
              {agent.current_balance_usdt.toFixed(2)} USDT
            </span>
          </div>
          <ASCIIProgressBar
            value={agent.current_balance_usdt}
            max={100}
            color="green"
          />
        </div>

        {/* Accuracy */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-cyan-600">Accuracy:</span>
            <span className="text-cyan-400 font-bold">
              {(agent.accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <ASCIIProgressBar
            value={agent.accuracy * 100}
            max={100}
            color="cyan"
          />
        </div>

        {/* ROI */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-amber-600">ROI:</span>
            <span className="text-amber-400 font-bold">
              {(agent.roi * 100).toFixed(1)}%
            </span>
          </div>
          <ASCIIProgressBar
            value={agent.roi * 100}
            max={50}
            color="amber"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-500 text-center">
        <span className="text-xs text-green-600">
          Predictions: {agent.total_predictions}
        </span>
      </div>

      {/* Hover Effect Indicator */}
      {onClick && (
        <div className="absolute top-2 right-2 text-green-400 opacity-0 transition-opacity group-hover:opacity-100">
          →
        </div>
      )}
    </div>
  );
}
