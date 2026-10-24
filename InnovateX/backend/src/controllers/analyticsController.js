import {
  getOverviewAnalytics,
  getInventoryAnalytics,
  getDemandAnalytics,
  getSupplierAnalytics,
  getRecommendations as getRecommendationsService,
} from '../services/analyticsService.js'

export const getOverview = async (req, res, next) => {
  try {
    const data = await getOverviewAnalytics(req.query)
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export const getInventory = async (req, res, next) => {
  try {
    const data = await getInventoryAnalytics(req.query)
    res.json({
      success: true,
      data: data.records,
      warehouseDistribution: data.warehouseDistribution,
      pagination: data.pagination,
      definitions: data.definitions,
    })
  } catch (err) {
    next(err)
  }
}

export const getDemand = async (req, res, next) => {
  try {
    const data = await getDemandAnalytics(req.query)
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export const getSuppliers = async (req, res, next) => {
  try {
    const data = await getSupplierAnalytics()
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export const getRecommendations = async (req, res, next) => {
  try {
    const data = await getRecommendationsService(req.query)
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

export default {
  getOverview,
  getInventory,
  getDemand,
  getSuppliers,
  getRecommendations,
}
