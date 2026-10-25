import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { SkeletonKPICard } from './Skeleton.jsx'
import { ProvenanceBadge } from './ProvenanceBadge.jsx'

export function KPICard({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  changeLabel,
  color,
  loading,
  id,
  provenanceType,
  provenanceTooltip,
}) {
  const trendColor = change > 0 ? (color === 'success' ? '#166a52' : '#b03035') : '#166a52'

  if (loading) return <SkeletonKPICard />

  const iconBg =
    color === 'success' ? '#ecfdf5' :
    color === 'warning' ? '#fffbeb' :
    color === 'critical' ? '#fff1f2' :
    '#eff6ff'

  const iconBorder =
    color === 'success' ? '#a7f3d0' :
    color === 'warning' ? '#fde68a' :
    color === 'critical' ? '#fecdd3' :
    '#bfdbfe'

  const iconColor =
    color === 'success' ? '#059669' :
    color === 'warning' ? '#d97706' :
    color === 'critical' ? '#e11d48' :
    '#2563eb'

  return (
    <div className="ss-kpi-card group hover:border-sky-300 transition-all duration-200" id={id}>
      <div>
        {/* Top Header: Label & Category Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {label}
          </span>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: iconBg,
              border: `1px solid ${iconBorder}`,
            }}
          >
            {Icon && <Icon size={17} color={iconColor} />}
          </div>
        </div>

        {/* Provenance Badge */}
        {provenanceType && (
          <div style={{ marginBottom: '12px' }}>
            <ProvenanceBadge type={provenanceType} tooltip={provenanceTooltip} />
          </div>
        )}

        {/* Metric Value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
          <span
            className="tabular-nums font-mono tracking-tight"
            style={{ fontSize: '27px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Metric Trend & Context */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {change >= 0 ? (
            <ArrowUpRight size={14} color={trendColor} />
          ) : (
            <ArrowDownRight size={14} color={trendColor} />
          )}
          <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 700, color: trendColor }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default KPICard
