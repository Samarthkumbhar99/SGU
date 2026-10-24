import { useState, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  Warehouse,
  Store,
  CheckCircle,
  X,
  ArrowUpDown,
  Layers,
  Calendar,
  AlertCircle,
  TrendingDown,
  ShieldAlert,
  Send,
  Eye,
} from 'lucide-react'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { inventoryAPI } from '../../services/api.js'

// Realistic FMCG initial inventory dataset for SupplyShield AI
const INITIAL_INVENTORY = [
  {
    id: 'INV-1001',
    sku: 'SKU-DRY-01',
    productName: 'Fresh Whole Milk 1L',
    category: 'Dairy & Chilled',
    batchNumber: 'LOT-2026-089A',
    location: 'WH-Delhi',
    locationType: 'Warehouse',
    onHand: 12500,
    reserved: 1800,
    safetyStock: 4000,
    unitCost: 1.45,
    expiryDate: '2026-11-04',
    daysToExpiry: 11,
    storageType: 'Cold Chain (2-4°C)',
    status: 'Adequate',
    riskLevel: 'Critical',
  },
  {
    id: 'INV-1002',
    sku: 'SKU-DRY-02',
    productName: 'Greek Yogurt Blueberry 400g',
    category: 'Dairy & Chilled',
    batchNumber: 'LOT-2026-092C',
    location: 'WH-Mumbai',
    locationType: 'Warehouse',
    onHand: 8400,
    reserved: 1200,
    safetyStock: 3000,
    unitCost: 2.15,
    expiryDate: '2026-11-12',
    daysToExpiry: 19,
    storageType: 'Cold Chain (2-4°C)',
    status: 'Adequate',
    riskLevel: 'Warning',
  },
  {
    id: 'INV-1003',
    sku: 'SKU-BEV-01',
    productName: 'Cold Brew Coffee 250ml',
    category: 'Beverages',
    batchNumber: 'LOT-2026-104B',
    location: 'Store S-01 (South Delhi)',
    locationType: 'Store',
    onHand: 420,
    reserved: 50,
    safetyStock: 600,
    unitCost: 2.80,
    expiryDate: '2026-11-02',
    daysToExpiry: 9,
    storageType: 'Chilled (4-8°C)',
    status: 'Low Stock',
    riskLevel: 'Critical',
  },
  {
    id: 'INV-1004',
    sku: 'SKU-BEV-02',
    productName: 'Organic Sparkling Lemon 750ml',
    category: 'Beverages',
    batchNumber: 'LOT-2026-077A',
    location: 'WH-Bangalore',
    locationType: 'Warehouse',
    onHand: 14200,
    reserved: 2100,
    safetyStock: 5000,
    unitCost: 1.90,
    expiryDate: '2027-02-18',
    daysToExpiry: 117,
    storageType: 'Ambient',
    status: 'Adequate',
    riskLevel: 'Good',
  },
  {
    id: 'INV-1005',
    sku: 'SKU-STP-01',
    productName: 'Premium Basmati Rice 5kg',
    category: 'Staples',
    batchNumber: 'LOT-2026-042R',
    location: 'WH-Delhi',
    locationType: 'Warehouse',
    onHand: 24000,
    reserved: 3500,
    safetyStock: 6000,
    unitCost: 7.20,
    expiryDate: '2027-08-30',
    daysToExpiry: 310,
    storageType: 'Ambient',
    status: 'Surplus',
    riskLevel: 'Good',
  },
  {
    id: 'INV-1006',
    sku: 'SKU-STP-02',
    productName: 'Cold Pressed Mustard Oil 1L',
    category: 'Staples',
    batchNumber: 'LOT-2026-058M',
    location: 'Store S-04 (Bandra West)',
    locationType: 'Store',
    onHand: 180,
    reserved: 20,
    safetyStock: 450,
    unitCost: 4.10,
    expiryDate: '2027-04-15',
    daysToExpiry: 173,
    storageType: 'Ambient',
    status: 'Critical Stockout',
    riskLevel: 'Good',
  },
  {
    id: 'INV-1007',
    sku: 'SKU-SNK-01',
    productName: 'Dark Chocolate Almond Bar 80g',
    category: 'Packaged Snacks',
    batchNumber: 'LOT-2026-118D',
    location: 'Store S-07 (Indiranagar)',
    locationType: 'Store',
    onHand: 620,
    reserved: 40,
    safetyStock: 800,
    unitCost: 1.75,
    expiryDate: '2026-11-20',
    daysToExpiry: 27,
    storageType: 'Air-Conditioned (<22°C)',
    status: 'Low Stock',
    riskLevel: 'Warning',
  },
  {
    id: 'INV-1008',
    sku: 'SKU-SNK-02',
    productName: 'Roasted Salted Cashews 200g',
    category: 'Packaged Snacks',
    batchNumber: 'LOT-2026-081N',
    location: 'WH-Mumbai',
    locationType: 'Warehouse',
    onHand: 18500,
    reserved: 2400,
    safetyStock: 4500,
    unitCost: 3.50,
    expiryDate: '2027-01-10',
    daysToExpiry: 78,
    storageType: 'Ambient',
    status: 'Adequate',
    riskLevel: 'Good',
  },
  {
    id: 'INV-1009',
    sku: 'SKU-PSC-01',
    productName: 'Botanical Foaming Hand Wash 250ml',
    category: 'Personal Care',
    batchNumber: 'LOT-2026-033H',
    location: 'WH-Bangalore',
    locationType: 'Warehouse',
    onHand: 16800,
    reserved: 1500,
    safetyStock: 3500,
    unitCost: 2.30,
    expiryDate: '2027-06-25',
    daysToExpiry: 244,
    storageType: 'Ambient',
    status: 'Adequate',
    riskLevel: 'Good',
  },
  {
    id: 'INV-1010',
    sku: 'SKU-PSC-02',
    productName: 'Eco-Enzyme Toothpaste 100g',
    category: 'Personal Care',
    batchNumber: 'LOT-2026-064T',
    location: 'Store S-02 (Gurugram)',
    locationType: 'Store',
    onHand: 310,
    reserved: 15,
    safetyStock: 500,
    unitCost: 2.10,
    expiryDate: '2027-05-12',
    daysToExpiry: 200,
    storageType: 'Ambient',
    status: 'Low Stock',
    riskLevel: 'Good',
  },
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [search, setSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedRisk, setSelectedRisk] = useState('All')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'expiry' | 'warehouses'
  const [sortBy, setSortBy] = useState('onHand')
  const [sortDirection, setSortDirection] = useState('desc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState(null)
  const [transferUnits, setTransferUnits] = useState(100)
  const [transferTarget, setTransferTarget] = useState('Store S-04 (Bandra West)')

  // Form state for new batch modal
  const [newBatch, setNewBatch] = useState({
    sku: '',
    productName: '',
    category: 'Dairy & Chilled',
    batchNumber: '',
    location: 'WH-Delhi',
    locationType: 'Warehouse',
    onHand: 1000,
    safetyStock: 300,
    unitCost: 2.5,
    expiryDate: '2026-12-31',
    storageType: 'Ambient',
  })

  const { addToast } = useToast()

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return inventory
      .filter((item) => {
        // Tab filtering
        if (activeTab === 'expiry' && item.daysToExpiry > 30) return false
        if (activeTab === 'warehouses' && item.locationType !== 'Warehouse') return false

        // Search
        if (search) {
          const q = search.toLowerCase()
          const matches =
            item.sku.toLowerCase().includes(q) ||
            item.productName.toLowerCase().includes(q) ||
            item.batchNumber.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q)
          if (!matches) return false
        }

        // Dropdowns
        if (selectedLocation !== 'All' && item.location !== selectedLocation) return false
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false
        if (selectedStatus !== 'All' && item.status !== selectedStatus) return false
        if (selectedRisk !== 'All' && item.riskLevel !== selectedRisk) return false

        return true
      })
      .sort((a, b) => {
        let valA = a[sortBy]
        let valB = b[sortBy]
        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA
      })
  }, [
    inventory,
    search,
    selectedLocation,
    selectedCategory,
    selectedStatus,
    selectedRisk,
    activeTab,
    sortBy,
    sortDirection,
  ])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalUnits = inventory.reduce((acc, curr) => acc + curr.onHand, 0)
    const totalValuation = inventory.reduce((acc, curr) => acc + curr.onHand * curr.unitCost, 0)
    const expiringBatches = inventory.filter((item) => item.daysToExpiry <= 30).length
    const criticalStockouts = inventory.filter((item) => item.onHand <= item.safetyStock).length
    return {
      totalUnits,
      totalValuation,
      expiringBatches,
      criticalStockouts,
      totalSkus: inventory.length,
    }
  }, [inventory])

  // Sorting helper
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Batch Number',
      'Location',
      'Type',
      'On Hand',
      'Reserved',
      'Safety Stock',
      'Unit Cost ($)',
      'Total Value ($)',
      'Expiry Date',
      'Days to Expiry',
      'Storage Type',
      'Status',
    ]

    const rows = filteredData.map((item) => [
      item.sku,
      `"${item.productName}"`,
      `"${item.category}"`,
      item.batchNumber,
      `"${item.location}"`,
      item.locationType,
      item.onHand,
      item.reserved,
      item.safetyStock,
      item.unitCost,
      (item.onHand * item.unitCost).toFixed(2),
      item.expiryDate,
      item.daysToExpiry,
      `"${item.storageType}"`,
      item.status,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `supplyshield-inventory-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    addToast('Inventory CSV exported successfully!', 'success')
  }

  // Handle Add Batch submit
  const handleAddBatch = (e) => {
    e.preventDefault()
    if (!newBatch.sku || !newBatch.productName || !newBatch.batchNumber) {
      addToast('Please fill all required fields.', 'error')
      return
    }

    const today = new Date()
    const exp = new Date(newBatch.expiryDate)
    const diffTime = exp - today
    const daysToExpiry = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    const riskLevel = daysToExpiry <= 15 ? 'Critical' : daysToExpiry <= 30 ? 'Warning' : 'Good'
    const status =
      newBatch.onHand <= newBatch.safetyStock * 0.5
        ? 'Critical Stockout'
        : newBatch.onHand <= newBatch.safetyStock
        ? 'Low Stock'
        : 'Adequate'

    const item = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      ...newBatch,
      reserved: 0,
      daysToExpiry,
      riskLevel,
      status,
    }

    setInventory((prev) => [item, ...prev])
    setIsAddModalOpen(false)
    addToast(`Batch ${item.batchNumber} added successfully!`, 'success')

    // Reset form
    setNewBatch({
      sku: '',
      productName: '',
      category: 'Dairy & Chilled',
      batchNumber: '',
      location: 'WH-Delhi',
      locationType: 'Warehouse',
      onHand: 1000,
      safetyStock: 300,
      unitCost: 2.5,
      expiryDate: '2026-12-31',
      storageType: 'Ambient',
    })
  }

  // Handle Transfer stock
  const handleExecuteTransfer = () => {
    if (!selectedItemForTransfer) return
    const units = parseInt(transferUnits, 10)
    if (isNaN(units) || units <= 0 || units > selectedItemForTransfer.onHand) {
      addToast('Invalid transfer quantity.', 'error')
      return
    }

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === selectedItemForTransfer.id) {
          const updatedOnHand = item.onHand - units
          return {
            ...item,
            onHand: updatedOnHand,
            status: updatedOnHand <= item.safetyStock ? 'Low Stock' : 'Adequate',
          }
        }
        return item
      })
    )

    setIsTransferModalOpen(false)
    addToast(
      `Dispatched ${units} units of ${selectedItemForTransfer.productName} to ${transferTarget}.`,
      'success'
    )
  }

  return (
    <AppLayout pageTitle="Inventory & Batch Management" breadcrumbs={['Dashboard', 'Inventory']}>
      {/* Top Header & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#17324d', margin: '0 0 4px' }}>
            Inventory Command & Batch Control
          </h1>
          <p style={{ margin: 0, color: '#64778b', fontSize: '14px' }}>
            Multi-node FMCG network tracking, shelf-life monitoring, and stockout prevention.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => addToast('Inventory synced with central nodes.', 'info')}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={15} />
            Sync
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
            }}
          >
            <Download size={15} />
            Export CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            Add Batch
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64778b', fontWeight: 600 }}>Total Units On-Hand</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#eef6ff', color: '#247bc1' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#17324d' }}>
            {metrics.totalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#208567', marginTop: '4px', fontWeight: 500 }}>
            Across 3 DCs & 10 retail stores
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64778b', fontWeight: 600 }}>Inventory Valuation</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#effaf5', color: '#208567' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#17324d' }}>
            ${metrics.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64778b', marginTop: '4px' }}>
            Cost-weighted holding value
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64778b', fontWeight: 600 }}>Expiring Soon (≤30 Days)</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#fffbeb', color: '#d99a27' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: metrics.expiringBatches > 0 ? '#d99a27' : '#17324d' }}>
            {metrics.expiringBatches} Batches
          </div>
          <div style={{ fontSize: '12px', color: '#d99a27', marginTop: '4px', fontWeight: 600 }}>
            Priority for Adaptive Rescue
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64778b', fontWeight: 600 }}>Stockout & Low Alerts</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#fef2f2', color: '#d94b50' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: metrics.criticalStockouts > 0 ? '#d94b50' : '#17324d' }}>
            {metrics.criticalStockouts} SKUs
          </div>
          <div style={{ fontSize: '12px', color: '#d94b50', marginTop: '4px', fontWeight: 600 }}>
            Below safety buffer threshold
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'all' ? '#247bc1' : 'transparent',
              color: activeTab === 'all' ? '#ffffff' : '#64778b',
              transition: 'all 0.2s ease',
            }}
          >
            All Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('expiry')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'expiry' ? '#d99a27' : 'transparent',
              color: activeTab === 'expiry' ? '#ffffff' : '#64778b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Clock size={14} />
            Expiry Risk Radar ({metrics.expiringBatches})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'warehouses' ? '#247bc1' : 'transparent',
              color: activeTab === 'warehouses' ? '#ffffff' : '#64778b',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Warehouse size={14} />
            Central Warehouses
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Search by SKU, Product, Batch, or Node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{
                paddingLeft: '36px',
                width: '100%',
                fontSize: '13px',
                height: '38px',
                borderRadius: '8px',
              }}
            />
          </div>

          {/* Node Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="input"
              style={{ width: '100%', fontSize: '13px', height: '38px', borderRadius: '8px' }}
            >
              <option value="All">All Locations (13)</option>
              <option value="WH-Delhi">WH-Delhi</option>
              <option value="WH-Mumbai">WH-Mumbai</option>
              <option value="WH-Bangalore">WH-Bangalore</option>
              <option value="Store S-01 (South Delhi)">Store S-01</option>
              <option value="Store S-02 (Gurugram)">Store S-02</option>
              <option value="Store S-04 (Bandra West)">Store S-04</option>
              <option value="Store S-07 (Indiranagar)">Store S-07</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
              style={{ width: '100%', fontSize: '13px', height: '38px', borderRadius: '8px' }}
            >
              <option value="All">All Categories</option>
              <option value="Dairy & Chilled">Dairy & Chilled</option>
              <option value="Beverages">Beverages</option>
              <option value="Staples">Staples</option>
              <option value="Packaged Snacks">Packaged Snacks</option>
              <option value="Personal Care">Personal Care</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
              style={{ width: '100%', fontSize: '13px', height: '38px', borderRadius: '8px' }}
            >
              <option value="All">All Stock Levels</option>
              <option value="Adequate">Adequate</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical Stockout">Critical Stockout</option>
              <option value="Surplus">Surplus</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  onClick={() => handleSort('sku')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    SKU & Product <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                  }}
                >
                  Batch / Lot #
                </th>
                <th
                  onClick={() => handleSort('location')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Facility Node <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('onHand')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    On Hand / Buffer <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('daysToExpiry')}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Shelf Life Expiry <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                  }}
                >
                  Stock Status
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#64778b',
                    textAlign: 'right',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '15px' }}>
                      No inventory records match the selected filter criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const percentOfBuffer = Math.min(100, Math.round((item.onHand / item.safetyStock) * 100))

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* SKU & Product */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#17324d', fontSize: '13px' }}>
                          {item.productName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              color: '#247bc1',
                              fontWeight: 600,
                            }}
                          >
                            {item.sku}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
                          <span style={{ fontSize: '11px', color: '#64778b' }}>{item.category}</span>
                        </div>
                      </td>

                      {/* Batch & Storage */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#334155',
                            padding: '3px 8px',
                            background: '#f1f5f9',
                            borderRadius: '4px',
                          }}
                        >
                          {item.batchNumber}
                        </span>
                        <div style={{ fontSize: '11px', color: '#64778b', marginTop: '4px' }}>
                          {item.storageType}
                        </div>
                      </td>

                      {/* Location Node */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.locationType === 'Warehouse' ? (
                            <Warehouse size={14} color="#247bc1" />
                          ) : (
                            <Store size={14} color="#208567" />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                            {item.location}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: item.locationType === 'Warehouse' ? '#eef6ff' : '#effaf5',
                            color: item.locationType === 'Warehouse' ? '#247bc1' : '#208567',
                            fontWeight: 600,
                            marginTop: '4px',
                            display: 'inline-block',
                          }}
                        >
                          {item.locationType}
                        </span>
                      </td>

                      {/* On Hand & Buffer progress */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: '#17324d' }}>
                            {item.onHand.toLocaleString()} units
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                            Threshold: {item.safetyStock.toLocaleString()}
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            width: '120px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percentOfBuffer}%`,
                              background:
                                item.status === 'Critical Stockout'
                                  ? '#d94b50'
                                  : item.status === 'Low Stock'
                                  ? '#d99a27'
                                  : '#208567',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      </td>

                      {/* Shelf life & expiry */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                          {item.expiryDate}
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            marginTop: '4px',
                            background:
                              item.riskLevel === 'Critical'
                                ? '#fef2f2'
                                : item.riskLevel === 'Warning'
                                ? '#fffbeb'
                                : '#f0fdf4',
                            color:
                              item.riskLevel === 'Critical'
                                ? '#d94b50'
                                : item.riskLevel === 'Warning'
                                ? '#d99a27'
                                : '#16a34a',
                          }}
                        >
                          <Clock size={11} />
                          {item.daysToExpiry} days left
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            display: 'inline-block',
                            background:
                              item.status === 'Critical Stockout'
                                ? '#fee2e2'
                                : item.status === 'Low Stock'
                                ? '#fef3c7'
                                : item.status === 'Surplus'
                                ? '#e0f2fe'
                                : '#dcfce7',
                            color:
                              item.status === 'Critical Stockout'
                                ? '#991b1b'
                                : item.status === 'Low Stock'
                                ? '#92400e'
                                : item.status === 'Surplus'
                                ? '#0369a1'
                                : '#166534',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedItemForTransfer(item)
                            setIsTransferModalOpen(true)
                          }}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '12px',
                            padding: '4px 10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Send size={12} />
                          Transfer
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Batch */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#17324d' }}>
                  Register Incoming FMCG Batch
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64778b' }}>
                  Log new SKU inventory batch into SupplyShield network.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddBatch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-DRY-05"
                    value={newBatch.sku}
                    onChange={(e) => setNewBatch({ ...newBatch, sku: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Category
                  </label>
                  <select
                    value={newBatch.category}
                    onChange={(e) => setNewBatch({ ...newBatch, category: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="Dairy & Chilled">Dairy & Chilled</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Staples">Staples</option>
                    <option value="Packaged Snacks">Packaged Snacks</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Ghee 1L Tin"
                  value={newBatch.productName}
                  onChange={(e) => setNewBatch({ ...newBatch, productName: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Batch / Lot Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LOT-2026-140G"
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Location Node
                  </label>
                  <select
                    value={newBatch.location}
                    onChange={(e) => {
                      const isWh = e.target.value.startsWith('WH')
                      setNewBatch({
                        ...newBatch,
                        location: e.target.value,
                        locationType: isWh ? 'Warehouse' : 'Store',
                      })
                    }}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="WH-Delhi">WH-Delhi (Central DC)</option>
                    <option value="WH-Mumbai">WH-Mumbai (Regional DC)</option>
                    <option value="WH-Bangalore">WH-Bangalore (Regional DC)</option>
                    <option value="Store S-01 (South Delhi)">Store S-01 (South Delhi)</option>
                    <option value="Store S-04 (Bandra West)">Store S-04 (Bandra West)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatch.onHand}
                    onChange={(e) => setNewBatch({ ...newBatch, onHand: parseInt(e.target.value, 10) || 0 })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Safety Buffer
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newBatch.safetyStock}
                    onChange={(e) => setNewBatch({ ...newBatch, safetyStock: parseInt(e.target.value, 10) || 0 })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={newBatch.unitCost}
                    onChange={(e) => setNewBatch({ ...newBatch, unitCost: parseFloat(e.target.value) || 0 })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Storage Condition
                  </label>
                  <select
                    value={newBatch.storageType}
                    onChange={(e) => setNewBatch({ ...newBatch, storageType: e.target.value })}
                    className="input"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    <option value="Ambient">Ambient (Normal)</option>
                    <option value="Cold Chain (2-4°C)">Cold Chain (2-4°C)</option>
                    <option value="Chilled (4-8°C)">Chilled (4-8°C)</option>
                    <option value="Deep Freeze (-18°C)">Deep Freeze (-18°C)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  Register Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fast Transfer / Rebalance */}
      {isTransferModalOpen && selectedItemForTransfer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#17324d' }}>
                Simulate Rapid Stock Rebalance
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64778b', margin: '0 0 16px' }}>
              Transferring units from <strong>{selectedItemForTransfer.location}</strong> to an at-risk retail store to avert stockout.
            </p>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#17324d' }}>
                {selectedItemForTransfer.productName}
              </div>
              <div style={{ fontSize: '12px', color: '#64778b', marginTop: '2px' }}>
                Batch: {selectedItemForTransfer.batchNumber} • Available: {selectedItemForTransfer.onHand.toLocaleString()} units
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Destination Node
              </label>
              <select
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="Store S-01 (South Delhi)">Store S-01 (South Delhi) - Low Stock</option>
                <option value="Store S-04 (Bandra West)">Store S-04 (Bandra West) - Critical Stockout</option>
                <option value="Store S-07 (Indiranagar)">Store S-07 (Indiranagar) - Low Stock</option>
                <option value="Store S-02 (Gurugram)">Store S-02 (Gurugram)</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Quantity to Dispatch
              </label>
              <input
                type="number"
                min="10"
                max={selectedItemForTransfer.onHand}
                value={transferUnits}
                onChange={(e) => setTransferUnits(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="btn btn-primary"
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
