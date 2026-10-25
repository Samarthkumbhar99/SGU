import express from 'express'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Synthetic FMCG inventory dataset for SupplyShield AI
const DEMO_INVENTORY_ITEMS = [
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

// GET /api/v1/inventory
router.get('/', async (req, res, next) => {
  try {
    const { search, category, location, status, riskLevel } = req.query
    let items = [...DEMO_INVENTORY_ITEMS]

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.batchNumber.toLowerCase().includes(q)
      )
    }

    if (category && category !== 'All') {
      items = items.filter((item) => item.category === category)
    }

    if (location && location !== 'All') {
      items = items.filter((item) => item.location === location)
    }

    if (status && status !== 'All') {
      items = items.filter((item) => item.status === status)
    }

    if (riskLevel && riskLevel !== 'All') {
      items = items.filter((item) => item.riskLevel === riskLevel)
    }

    res.json({
      success: true,
      count: items.length,
      data: items,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/inventory/summary
router.get('/summary', async (req, res, next) => {
  try {
    const totalUnits = DEMO_INVENTORY_ITEMS.reduce((sum, item) => sum + item.onHand, 0)
    const totalValuation = DEMO_INVENTORY_ITEMS.reduce(
      (sum, item) => sum + item.onHand * item.unitCost,
      0
    )
    const expiringBatches = DEMO_INVENTORY_ITEMS.filter((item) => item.daysToExpiry <= 30).length
    const lowStockCount = DEMO_INVENTORY_ITEMS.filter(
      (item) => item.onHand <= item.safetyStock
    ).length

    res.json({
      success: true,
      data: {
        totalUnits,
        totalSkus: DEMO_INVENTORY_ITEMS.length,
        expiringBatches,
        lowStockCount,
        totalValuation: Math.round(totalValuation * 100) / 100,
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/inventory
router.post('/', async (req, res, next) => {
  try {
    const newItem = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    }
    DEMO_INVENTORY_ITEMS.unshift(newItem)
    res.status(201).json({
      success: true,
      message: 'Batch successfully registered in inventory.',
      data: newItem,
    })
  } catch (err) {
    next(err)
  }
})

export default router
