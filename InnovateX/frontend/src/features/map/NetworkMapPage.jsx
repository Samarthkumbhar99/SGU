import { useState } from 'react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import SupplyShieldMap from './SupplyShieldMap.jsx'
import distributionNetworkData from './distributionNetwork3D.json'
import { MapPin, Warehouse, Store, Layers, X, ExternalLink, Zap, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getInventoryScale } from '../../utils/inventoryScale.js'
import InventoryShelfModal from '../../components/ui/InventoryShelfModal.jsx'

export default function NetworkMapPage() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeRescueStore, setActiveRescueStore] = useState(null)
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false)
  const navigate = useNavigate()

  const selectedInv = selectedNode ? getInventoryScale(selectedNode) : null

  return (
    <AppLayout
      pageTitle="Geographic Distribution Network"
      breadcrumbs={['Dashboard', 'Network Map']}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Selected Node Quick Banner with 3D Inventory Shelf Visualizer */}
        {selectedNode && selectedInv && (
          <div
            className="card"
            style={{
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
              {/* 3D Shelf Thumbnail with Quick Zoom */}
              <div
                onClick={() => setIsShelfModalOpen(true)}
                title="Click to inspect 3D Shelving Rack at full resolution"
                style={{
                  position: 'relative',
                  width: '64px',
                  height: '52px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                <img
                  src={selectedInv.imageSrc}
                  alt={selectedInv.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                  }}
                  onError={(e) => {
                    if (!e.target.dataset.tried) {
                      e.target.dataset.tried = '1'
                      e.target.src = selectedInv.fallbackImageSrc
                    }
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    fontSize: '8px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    color: '#38bdf8',
                    padding: '1px 3px',
                    borderRadius: '3px',
                  }}
                >
                  {selectedInv.scale}/7
                </span>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
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
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: '4px',
                      backgroundColor: selectedInv.badgeBg,
                      color: selectedInv.badgeColor,
                      border: `1px solid ${selectedInv.borderColor}`,
                    }}
                  >
                    Scale {selectedInv.scale}/7 • {selectedInv.shortLabel} ({selectedInv.percent}%)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span>
                    Stock: <strong style={{ color: '#0f172a' }}>{selectedInv.stockOnHand.toLocaleString()}</strong> / {selectedInv.capacity.toLocaleString()} u
                  </span>
                  <span>•</span>
                  <span>
                    Demand: <strong style={{ color: '#0f172a' }}>{(selectedNode.weeklyDemand || 0).toLocaleString()}</strong> u/wk
                  </span>
                  <span>•</span>
                  <span>Region: <strong style={{ color: '#0f172a' }}>{selectedNode.region}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* 3D Shelf Inspector Trigger Button */}
              <button
                type="button"
                onClick={() => setIsShelfModalOpen(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                }}
              >
                <Eye size={13} />
                <span>3D Shelf ({selectedInv.scale}/7)</span>
              </button>

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
                    borderRadius: '7px',
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
                  borderRadius: '7px',
                }}
              >
                <ExternalLink size={13} />
                Inventory
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

        {/* 3D Inventory Shelf Inspector Modal */}
        <InventoryShelfModal
          isOpen={isShelfModalOpen}
          node={selectedNode}
          onClose={() => setIsShelfModalOpen(false)}
          onTriggerRescue={(target) => {
            setActiveRescueStore({ ...target })
            setIsShelfModalOpen(false)
          }}
        />
      </div>
    </AppLayout>
  )
}
