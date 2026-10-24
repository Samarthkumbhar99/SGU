import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getMyNetwork,
  createStore,
  updateStore,
  createWarehouse,
  updateWarehouse,
  searchEntities,
  requestAccess,
  reviewAccessRequest,
  updateLiveLocation,
} from '../controllers/entityController.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.get('/my-network', getMyNetwork)
router.post('/stores', createStore)
router.put('/stores/:id', updateStore)
router.post('/warehouses', createWarehouse)
router.put('/warehouses/:id', updateWarehouse)
router.get('/search', searchEntities)
router.post('/access-request', requestAccess)
router.put('/access-request/:requestId', reviewAccessRequest)
router.post('/location', updateLiveLocation)

export default router
