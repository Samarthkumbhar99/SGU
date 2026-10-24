// Skeleton loader components for dashboard states

export function SkeletonLine({ width = '100%', height = '16px', className = '' }) {
  return (
    <div
      className={`ss-skeleton ${className}`}
      style={{ width, height, borderRadius: '6px' }}
      aria-hidden="true"
    />
  )
}

export function SkeletonKPICard() {
  return (
    <div className="ss-kpi-card" aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <SkeletonLine width="40%" height="14px" />
        <SkeletonLine width="36px" height="36px" style={{ borderRadius: '8px' }} />
      </div>
      <SkeletonLine width="55%" height="32px" style={{ marginBottom: '8px' }} />
      <SkeletonLine width="70%" height="12px" />
    </div>
  )
}

export function SkeletonCard({ height = '200px' }) {
  return (
    <div
      className="ss-card"
      style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      aria-hidden="true"
    >
      <div className="ss-skeleton" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '14px 20px', alignItems: 'center' }}>
      <SkeletonLine width="24px" height="24px" />
      <SkeletonLine width="20%" height="14px" />
      <SkeletonLine width="15%" height="14px" />
      <SkeletonLine width="12%" height="14px" />
      <SkeletonLine width="10%" height="20px" />
    </div>
  )
}
