import express from 'express'
import {
  getProducts,
  getWarehouses,
  getStores,
  getSuppliers,
  getInventory,
  getDemandHistory,
  getDataQualitySummary,
  getDataImports,
  triggerImport,
} from '../controllers/dataController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Master entities
router.get('/products', getProducts)
router.get('/warehouses', getWarehouses)
router.get('/stores', getStores)
router.get('/suppliers', getSuppliers)

// Operational & historical data
router.get('/inventory', getInventory)
router.get('/demand/history', getDemandHistory)

// Data quality and import audit logs
router.get('/data-quality/summary', getDataQualitySummary)
router.get('/data-imports', getDataImports)
router.post('/data-imports/trigger', protect, triggerImport)

export default router
