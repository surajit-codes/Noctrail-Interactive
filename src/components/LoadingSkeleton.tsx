export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>

      {/* Executive summary skeleton */}
      <div className="glass-card p-6 space-y-3">
        <div className="skeleton h-5 w-32 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-4 w-3/5 rounded" />
      </div>

      {/* Market row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Sectors skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>

      {/* Two column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-3">
            <div className="skeleton h-4 w-36 rounded" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="space-y-2 pb-3 border-b border-white/5">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
