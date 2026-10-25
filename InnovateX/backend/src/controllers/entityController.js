import Store from '../models/Store.js'
import Warehouse from '../models/Warehouse.js'
import AccessRequest from '../models/AccessRequest.js'
import User from '../models/User.js'


// @desc    Get current user's owned & managed stores, warehouses, and access requests
// @route   GET /api/v1/entities/my-network
// @access  Private
export const getMyNetwork = async (req, res, next) => {
  try {
    const userId = req.user._id

    const [stores, warehouses, incomingRequests, outgoingRequests] = await Promise.all([
      Store.find({
        $or: [{ owner: userId }, { managers: userId }],
      }).populate('owner', 'name email company').populate('managers', 'name email role'),

      Warehouse.find({
        $or: [{ owner: userId }, { managers: userId }],
      }).populate('owner', 'name email company').populate('managers', 'name email role'),

      AccessRequest.find({
        targetOwner: userId,
        status: 'Pending',
      })
        .populate('requester', 'name email phone role company avatar')
        .populate('targetStore', 'name code category location')
        .populate('targetWarehouse', 'name code type location')
        .sort({ createdAt: -1 }),

      AccessRequest.find({
        requester: userId,
      })
        .populate('targetOwner', 'name email company')
        .populate('targetStore', 'name code category location')
        .populate('targetWarehouse', 'name code type location')
        .sort({ createdAt: -1 }),
    ])

    res.json({
      success: true,
      data: {
        stores,
        warehouses,
        incomingRequests,
        outgoingRequests,
        totalStores: stores.length,
        totalWarehouses: warehouses.length,
        pendingApprovalsCount: incomingRequests.length,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Create a new store (for Retailers & Ops)
// @route   POST /api/v1/entities/stores
// @access  Private
export const createStore = async (req, res, next) => {
  try {
    const {
      name,
      category,
      location,
      dailyDemandVelocity,
      safetyStockUnits,
      maxShelfCapacityUnits,
      currentStockUnits,
      serviceLeadTimeHours,
      contactPhone,
    } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Store name is required' })
    }

    // Default coordinates to user liveLocation if not specified
    const coords = location?.latitude && location?.longitude
      ? location
      : req.user.liveLocation?.latitude
      ? req.user.liveLocation
      : { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai Central', address: 'Bandra Retail Boulevard' }

    const store = await Store.create({
      name,
      category: category || 'Supermarket',
      location: coords,
      dailyDemandVelocity: dailyDemandVelocity || 4500,
      safetyStockUnits: safetyStockUnits || 1200,
      maxShelfCapacityUnits: maxShelfCapacityUnits || 18000,
      currentStockUnits: currentStockUnits || 14200,
      serviceLeadTimeHours: serviceLeadTimeHours || 3.2,
      contactPhone: contactPhone || req.user.phone || '',
      owner: req.user._id,
      managers: [req.user._id],
    })

    // Bind to user
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { managedStores: store._id },
    })

    res.status(201).json({
      success: true,
      message: 'Store registered successfully in FMCG network',
      data: store,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update store profile & operational parameters
// @route   PUT /api/v1/entities/stores/:id
// @access  Private
export const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id)
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' })
    }

    const isAuthorized =
      store.owner.toString() === req.user._id.toString() ||
      store.managers.some(m => m.toString() === req.user._id.toString()) ||
      req.user.role === 'Admin'

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this store' })
    }

    const allowedUpdates = [
      'name',
      'category',
      'location',
      'dailyDemandVelocity',
      'safetyStockUnits',
      'maxShelfCapacityUnits',
      'currentStockUnits',
      'serviceLeadTimeHours',
      'contactPhone',
      'status',
    ]

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        store[field] = req.body[field]
      }
    })

    await store.save()

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Create a new warehouse / DC
// @route   POST /api/v1/entities/warehouses
// @access  Private
export const createWarehouse = async (req, res, next) => {
  try {
    const {
      name,
      type,
      location,
      totalPalletCapacity,
      usedPalletCapacity,
      dockCount,
      temperatureControlled,
      fleetCount,
    } = req.body

    if (!name) {
      return res.status(400).json({ success: false, message: 'Warehouse name is required' })
    }

    const coords = location?.latitude && location?.longitude
      ? location
      : req.user.liveLocation?.latitude
      ? req.user.liveLocation
      : { latitude: 18.5204, longitude: 73.8567, city: 'Pune Hub', address: 'NH4 Logistics Park, Sector 9' }

    const warehouse = await Warehouse.create({
      name,
      type: type || 'Regional Distribution Center',
      location: coords,
      totalPalletCapacity: totalPalletCapacity || 5000,
      usedPalletCapacity: usedPalletCapacity || 3200,
      dockCount: dockCount || 14,
      temperatureControlled: temperatureControlled !== undefined ? temperatureControlled : true,
      fleetCount: fleetCount || 20,
      owner: req.user._id,
      managers: [req.user._id],
    })

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { managedWarehouses: warehouse._id },
    })

    res.status(201).json({
      success: true,
      message: 'Warehouse DC registered successfully',
      data: warehouse,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update warehouse profile & capacity
// @route   PUT /api/v1/entities/warehouses/:id
// @access  Private
export const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' })
    }

    const isAuthorized =
      warehouse.owner.toString() === req.user._id.toString() ||
      warehouse.managers.some(m => m.toString() === req.user._id.toString()) ||
      req.user.role === 'Admin'

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this warehouse' })
    }

    const allowedUpdates = [
      'name',
      'type',
      'location',
      'totalPalletCapacity',
      'usedPalletCapacity',
      'dockCount',
      'temperatureControlled',
      'fleetCount',
      'status',
    ]

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        warehouse[field] = req.body[field]
      }
    })

    await warehouse.save()

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Search all registered network stores & warehouses to request access
// @route   GET /api/v1/entities/search
// @access  Private
export const searchEntities = async (req, res, next) => {
  try {
    const { q = '', type = 'all' } = req.query
    const queryRegex = new RegExp(q, 'i')

    let stores = []
    let warehouses = []

    if (type === 'all' || type === 'store') {
      stores = await Store.find({
        $or: [{ name: queryRegex }, { code: queryRegex }, { 'location.city': queryRegex }],
      })
        .select('name code category location owner managers status currentStockUnits maxShelfCapacityUnits')
        .populate('owner', 'name email company')
        .limit(20)
    }

    if (type === 'all' || type === 'warehouse') {
      warehouses = await Warehouse.find({
        $or: [{ name: queryRegex }, { code: queryRegex }, { 'location.city': queryRegex }],
      })
        .select('name code type location owner managers status totalPalletCapacity usedPalletCapacity dockCount')
        .populate('owner', 'name email company')
        .limit(20)
    }

    res.json({
      success: true,
      data: {
        stores,
        warehouses,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Request manager/staff access to an existing store or warehouse
// @route   POST /api/v1/entities/access-requests
// @access  Private
export const requestAccess = async (req, res, next) => {
  try {
    const { targetType, targetId, roleRequested = 'Co-Manager', reason } = req.body

    if (!['Store', 'Warehouse'].includes(targetType) || !targetId) {
      return res.status(400).json({ success: false, message: 'targetType (Store|Warehouse) and targetId are required' })
    }

    let targetOwner = null
    let targetStore = null
    let targetWarehouse = null

    if (targetType === 'Store') {
      targetStore = await Store.findById(targetId)
      if (!targetStore) {
        return res.status(404).json({ success: false, message: 'Target store not found' })
      }
      targetOwner = targetStore.owner
      // Check if already manager
      if (targetStore.managers.some(m => m.toString() === req.user._id.toString())) {
        return res.status(400).json({ success: false, message: 'You are already a manager of this store' })
      }
    } else {
      targetWarehouse = await Warehouse.findById(targetId)
      if (!targetWarehouse) {
        return res.status(404).json({ success: false, message: 'Target warehouse not found' })
      }
      targetOwner = targetWarehouse.owner
      if (targetWarehouse.managers.some(m => m.toString() === req.user._id.toString())) {
        return res.status(400).json({ success: false, message: 'You are already a manager of this warehouse' })
      }
    }

    // Check existing pending request
    const existing = await AccessRequest.findOne({
      requester: req.user._id,
      targetType,
      ...(targetType === 'Store' ? { targetStore: targetId } : { targetWarehouse: targetId }),
      status: 'Pending',
    })

    if (existing) {
      return res.status(400).json({ success: false, message: 'An access request is already pending review for this entity' })
    }

    const request = await AccessRequest.create({
      requester: req.user._id,
      targetType,
      targetStore: targetStore ? targetStore._id : undefined,
      targetWarehouse: targetWarehouse ? targetWarehouse._id : undefined,
      targetOwner,
      roleRequested,
      reason: reason || `Requesting access as ${roleRequested} to coordinate replenishment and dispatch manifest operations.`,
    })

    res.status(201).json({
      success: true,
      message: 'Access request submitted to entity manager successfully',
      data: request,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Review (Approve/Reject) an access request
// @route   PATCH /api/v1/entities/access-requests/:id/review
// @access  Private
export const reviewAccessRequest = async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body // action: 'Approved' | 'Rejected'
    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'Approved' or 'Rejected'" })
    }

    const accessReq = await AccessRequest.findById(req.params.id)
    if (!accessReq) {
      return res.status(404).json({ success: false, message: 'Access request not found' })
    }

    if (accessReq.targetOwner.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only the entity owner can review this request' })
    }

    accessReq.status = action
    accessReq.reviewedAt = new Date()
    accessReq.reviewNote = reviewNote || (action === 'Approved' ? 'Access granted.' : 'Request declined.')
    await accessReq.save()

    // If approved, add user to managers list and user's managedStores/managedWarehouses
    if (action === 'Approved') {
      if (accessReq.targetType === 'Store') {
        await Store.findByIdAndUpdate(accessReq.targetStore, {
          $addToSet: { managers: accessReq.requester },
        })
        await User.findByIdAndUpdate(accessReq.requester, {
          $addToSet: { managedStores: accessReq.targetStore },
        })
      } else {
        await Warehouse.findByIdAndUpdate(accessReq.targetWarehouse, {
          $addToSet: { managers: accessReq.requester },
        })
        await User.findByIdAndUpdate(accessReq.requester, {
          $addToSet: { managedWarehouses: accessReq.targetWarehouse },
        })
      }
    }

    res.json({
      success: true,
      message: `Access request ${action.toLowerCase()} successfully`,
      data: accessReq,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Update user live GPS location
// @route   POST /api/v1/entities/location
// @access  Private
export const updateLiveLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, city, address } = req.body

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' })
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        liveLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: Number(accuracy) || 10,
          city: city || 'Detected City',
          address: address || 'Live GPS Location',
          updatedAt: new Date(),
        },
      },
      { new: true }
    )

    res.json({
      success: true,
      message: 'Live GPS location synchronized',
      data: updatedUser.liveLocation,
    })
  } catch (err) {
    next(err)
  }
}
