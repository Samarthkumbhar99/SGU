/**
 * Inventory Scale Utility (Levels 1 to 7)
 * 
 * Maps store/warehouse stock levels to 3D shelf visualization images:
 * - 1.png: Out of Stock / Depleted (0% - 14%)
 * - 2.png: Critical Low Stock (15% - 28%)
 * - 3.png: Low Stock Threshold (29% - 42%)
 * - 4.png: Moderate Half Capacity (43% - 57%)
 * - 5.png: Healthy Safety Buffer (58% - 71%)
 * - 6.png: Optimal High Stock (72% - 85%)
 * - 7.png: Full Inventory Capacity (86% - 100%)
 */

export const INVENTORY_SCALE_TIERS = [
  {
    scale: 1,
    image: '/stocks/1.png',
    fallbackImage: '/1.png',
    title: 'Out of Stock / Depleted',
    shortLabel: 'Out of Stock',
    range: '0% – 14%',
    minPct: 0,
    maxPct: 14,
    status: 'Critical',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c',
    borderColor: '#fca5a5',
    barColor: '#ef4444',
    description: 'Shelves and pallets are virtually empty. Immediate emergency replenishment required.',
  },
  {
    scale: 2,
    image: '/stocks/2.png',
    fallbackImage: '/2.png',
    title: 'Critical Low Stock',
    shortLabel: 'Critical Low',
    range: '15% – 28%',
    minPct: 15,
    maxPct: 28,
    status: 'Critical',
    badgeBg: '#ffedd5',
    badgeColor: '#c2410c',
    borderColor: '#fdba74',
    barColor: '#f97316',
    description: 'Severely depleted safety buffer. Stockout projected within 12–24 operating hours.',
  },
  {
    scale: 3,
    image: '/stocks/3.png',
    fallbackImage: '/3.png',
    title: 'Low Stock Threshold',
    shortLabel: 'Low Stock',
    range: '29% – 42%',
    minPct: 29,
    maxPct: 42,
    status: 'Low Stock',
    badgeBg: '#fef9c3',
    badgeColor: '#a16207',
    borderColor: '#fde047',
    barColor: '#eab308',
    description: 'Inventory has breached the reorder point. Inbound replenishment should be scheduled.',
  },
  {
    scale: 4,
    image: '/stocks/4.png',
    fallbackImage: '/4.png',
    title: 'Moderate Half Capacity',
    shortLabel: 'Moderate',
    range: '43% – 57%',
    minPct: 43,
    maxPct: 57,
    status: 'Adequate',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    borderColor: '#7dd3fc',
    barColor: '#0284c7',
    description: 'Operational baseline buffer with approximately 50% rack and pallet utilization.',
  },
  {
    scale: 5,
    image: '/stocks/5.png',
    fallbackImage: '/5.png',
    title: 'Healthy Safety Buffer',
    shortLabel: 'Healthy',
    range: '58% – 71%',
    minPct: 58,
    maxPct: 71,
    status: 'Adequate',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    borderColor: '#86efac',
    barColor: '#22c55e',
    description: 'Good shelf fulfillment and healthy safety buffer able to absorb demand surges.',
  },
  {
    scale: 6,
    image: '/stocks/6.png',
    fallbackImage: '/6.png',
    title: 'Optimal High Stock',
    shortLabel: 'Well Stocked',
    range: '72% – 85%',
    minPct: 72,
    maxPct: 85,
    status: 'Optimal',
    badgeBg: '#ccfbf1',
    badgeColor: '#0f766e',
    borderColor: '#5eead4',
    barColor: '#14b8a6',
    description: 'High stock availability across all SKUs. Shelving is well-utilized without congestion.',
  },
  {
    scale: 7,
    image: '/stocks/7.png',
    fallbackImage: '/7.png',
    title: 'Full Inventory Capacity',
    shortLabel: 'Full Capacity',
    range: '86% – 100%',
    minPct: 86,
    maxPct: 100,
    status: 'Surplus',
    badgeBg: '#ecfdf5',
    badgeColor: '#047857',
    borderColor: '#6ee7b7',
    barColor: '#10b981',
    description: 'Racks and pallets at 100% capacity. Storage bays are fully populated with inventory.',
  },
]

/**
 * Computes the inventory scale 1..7 for any store or warehouse node
 */
export function getInventoryScale(node) {
  if (!node) {
    return {
      scale: 4,
      imageSrc: '/stocks/4.png',
      percent: 50,
      stockOnHand: 500,
      capacity: 1000,
      ...INVENTORY_SCALE_TIERS[3],
    }
  }

  // Determine stock on-hand
  const stockOnHand = Number(
    node.stockOnHand !== undefined
      ? node.stockOnHand
      : (node.currentStock !== undefined
          ? node.currentStock
          : (node.onHand !== undefined ? node.onHand : 0))
  )

  // Determine capacity with sensible defaults if missing
  const isWarehouse =
    node.type === 'Warehouse' ||
    String(node.name || '').toLowerCase().includes('dc') ||
    String(node.id || '').toLowerCase().startsWith('wh')

  const fallbackCapacity = isWarehouse ? 80000 : 800
  const capacity = Number(node.capacity) > 0 ? Number(node.capacity) : fallbackCapacity

  // Calculate percentage
  let ratio = capacity > 0 ? stockOnHand / capacity : 0.5
  let percent = Math.min(100, Math.max(0, Math.round(ratio * 100)))

  // Scale computation (1 to 7)
  let scale = 1

  // Handle explicit status or risk level triggers
  const statusStr = String(node.status || '').toLowerCase()
  const riskStr = String(node.riskLevel || '').toLowerCase()

  if (statusStr.includes('critical') || riskStr.includes('critical') || stockOnHand === 0 || percent <= 14) {
    scale = 1
  } else if (percent <= 28) {
    scale = 2
  } else if (statusStr.includes('low') || riskStr.includes('warning') || percent <= 42) {
    scale = 3
  } else if (percent <= 57) {
    scale = 4
  } else if (percent <= 71) {
    scale = 5
  } else if (percent <= 85) {
    scale = 6
  } else {
    scale = 7
  }

  const tier = INVENTORY_SCALE_TIERS[scale - 1]

  return {
    scale,
    imageSrc: tier.image,
    fallbackImageSrc: tier.fallbackImage,
    percent,
    stockOnHand,
    capacity,
    isWarehouse,
    nodeName: node.name || node.shortCode || node.id,
    nodeType: node.type || (isWarehouse ? 'Warehouse DC' : 'Retail Store'),
    ...tier,
  }
}
