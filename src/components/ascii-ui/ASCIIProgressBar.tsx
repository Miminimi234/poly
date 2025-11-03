'use client';

interface ASCIIProgressBarProps {
  value: number;
  max: number;
  color?: 'green' | 'amber' | 'cyan' | 'pink' | 'red';
  showPercent?: boolean;
}

export function ASCIIProgressBar({
  value,
  max,
  color = 'green',
  showPercent = false
}: ASCIIProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const filled = Math.floor(percentage / 5); // 20 characters total
  const empty = 20 - filled;

  const colorClasses = {
    green: 'text-green-500',
    amber: 'text-amber-500',
    cyan: 'text-cyan-500',
    pink: 'text-pink-500',
    red: 'text-red-500'
  };

  const fillChar = '█';
  const emptyChar = '░';

  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 ${colorClasses[color]}`}>
        <div className="flex-1 font-mono text-sm">
          <span className={`border border-${color}-500 p-1`}>
            {fillChar.repeat(filled)}
            {emptyChar.repeat(empty)}
          </span>
        </div>
        {showPercent && (
          <span className="text-xs font-bold min-w-[50px] text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}

