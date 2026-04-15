export default function SuperAdminTabLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10">
            <div className="w-10 h-10 bg-surface-container-low rounded-lg mb-3" />
            <div className="w-20 h-3 bg-surface-container-low rounded mb-2" />
            <div className="w-12 h-7 bg-surface-container-low rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
        <div className="w-40 h-5 bg-surface-container-low rounded mb-4" />
        <div className="h-64 bg-surface-container-low rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
        <div className="p-6">
          <div className="w-48 h-5 bg-surface-container-low rounded mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-surface-container-low rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
