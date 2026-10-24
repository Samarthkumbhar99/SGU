const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getMyNetwork,
  createStore,
  updateStore,
  createWarehouse,
  updateWarehouse,
  searchEntities,
  requestAccess,
  reviewAccessRequest,
  updateLiveLocation,
} = require('../controllers/entityController')

// All routes require authentication
router.use(protect)

router.get('/my-network', getMyNetwork)
router.post('/stores', createStore)
router.put('/stores/:id', updateStore)

router.post('/warehouses', createWarehouse)
router.put('/warehouses/:id', updateWarehouse)

router.get('/search', searchEntities)
router.post('/access-requests', requestAccess)
router.patch('/access-requests/:id/review', reviewAccessRequest)

router.post('/location', updateLiveLocation)

module.exports = router
