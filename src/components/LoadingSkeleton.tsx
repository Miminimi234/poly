export function AgentCardSkeleton() {
  return (
    <div className="border-1 border-gray p-4 animate-pulse"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="h-4 w-3/4 mb-2"></div>
      <div className="h-3 w-1/2 mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 w-full"></div>
        <div className="h-3 w-2/3"></div>
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="border-2 border-gray p-3 animate-pulse">
      <div className="h-4 w-full mb-2"></div>
      <div className="h-3 w-3/4 mb-3"></div>
      <div className="flex justify-between">
        <div className="h-3 w-1/3"></div>
        <div className="h-3 w-1/4"></div>
      </div>
    </div>
  );
}

export function PredictionCardSkeleton() {
  return (
    <div className="border-2 border-gray p-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 w-2/3"></div>
        <div className="h-6 w-16"></div>
      </div>
      <div className="h-3 w-1/2"></div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="border-1 border-gray p-4 animate-pulse"
      style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
      <div className="h-3 w-1/2 mb-2"></div>
      <div className="h-8 w-3/4"></div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="border-2 border-gray p-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 w-1/2"></div>
            <div className="h-4 w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

