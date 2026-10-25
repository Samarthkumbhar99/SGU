import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import SupplyShieldMap from './SupplyShieldMap.jsx'
import distributionNetworkData from './distributionNetwork3D.json'
import { MapPin, Warehouse, Store, Layers, X, ExternalLink, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NetworkMapPage() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeRescueStore, setActiveRescueStore] = useState(null)
  const navigate = useNavigate()

  return (
    <AppLayout
      pageTitle="Geographic Distribution Network"
      breadcrumbs={['Dashboard', 'Network Map']}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Selected Node Quick Banner (if a marker or column is clicked) */}
        {selectedNode && (
          <div
            className="card"
            style={{
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: selectedNode.type === 'Warehouse' ? '8px' : '50%',
                  backgroundColor: selectedNode.type === 'Warehouse' ? '#2563eb' : '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedNode.type === 'Warehouse' ? <Warehouse size={18} /> : <Store size={18} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    {selectedNode.name}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    {selectedNode.code || selectedNode.id}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor:
                        selectedNode.riskLevel === 'Critical'
                          ? '#fee2e2'
                          : selectedNode.riskLevel === 'Warning'
                          ? '#fef3c7'
                          : '#d1fae5',
                      color:
                        selectedNode.riskLevel === 'Critical'
                          ? '#b91c1c'
                          : selectedNode.riskLevel === 'Warning'
                          ? '#b45309'
                          : '#047857',
                    }}
                  >
                    {selectedNode.status || selectedNode.riskLevel}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Stock On-Hand:{' '}
                  <strong style={{ color: '#1e293b' }}>
                    {(selectedNode.stockOnHand || 0).toLocaleString()} units
                  </strong>{' '}
                  • Weekly Demand:{' '}
                  <strong style={{ color: '#1e293b' }}>
                    {(selectedNode.weeklyDemand || 0).toLocaleString()} u/wk
                  </strong>{' '}
                  • Region: {selectedNode.region}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {selectedNode.type === 'Retail Store' && (
                <button
                  type="button"
                  onClick={() => setActiveRescueStore({ ...selectedNode })}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                  }}
                  title="Auto-connect shortest road path from nearest warehouse"
                >
                  <Zap size={13} />
                  ⚡ Auto-Rescue Store
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <ExternalLink size={13} />
                View in Inventory
              </button>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Clear selection"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 3D Geographic Distribution Network Map */}
        <SupplyShieldMap
          height="calc(100vh - 195px)"
          nodes={distributionNetworkData.nodes}
          selectedNodeId={selectedNode?.id}
          activeRescueStore={activeRescueStore}
          onNodeSelect={(node) => setSelectedNode(node)}
          initial3D={true}
          initialShowColumns={true}
          initialShowArcs={false}
          initialShowHeatmap={false}
        />
      </div>
    </AppLayout>
  )
}
