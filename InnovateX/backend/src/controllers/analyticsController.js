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

export const simulateInventory = async (req, res, next) => {
  try {
    const { mlClient } = await import('../integrations/mlClient.js')
    const result = await mlClient.simulateInventory(req.body, {
      correlationId: req.correlationId,
    })
    return res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    // If ML service times out or is unreachable, compute deterministic fallback
    const {
      sku_id = 'SKU-001',
      location_id = 'WH-CENTRAL',
      starting_on_hand = 350,
      avg_daily_demand = 22.0,
      std_daily_demand = 4.5,
      supplier_lead_time_days = 5.0,
      lead_time_delay_days = 0.0,
      demand_multiplier = 1.0,
      service_level = 0.95,
      pack_size = 10,
      minimum_order_quantity = 50,
      review_horizon_days = 30,
      enable_replenishment = true,
    } = req.body

    const z = 1.645
    const effLt = Number(supplier_lead_time_days) + Number(lead_time_delay_days)
    const effMu = Number(avg_daily_demand) * Number(demand_multiplier)
    const ss = Math.ceil(z * Number(std_daily_demand) * Math.sqrt(effLt))
    const rop = Math.ceil(effMu * effLt) + ss
    const rawDeficit = Math.max(0, rop + Math.ceil(effMu * 7) - Number(starting_on_hand))
    const roq = Math.ceil(Math.max(rawDeficit, Number(minimum_order_quantity)) / Number(pack_size)) * Number(pack_size)

    let stock = Number(starting_on_hand)
    let unmanagedStock = Number(starting_on_hand)
    const timeline = []
    const orders = []
    const seasonality = [0.85, 0.95, 1.0, 1.05, 1.15, 1.25, 0.9]

    let totalDemand = 0
    let fulfilled = 0
    let unmet = 0
    let minStock = stock

    for (let day = 1; day <= review_horizon_days; day++) {
      const dailyD = Math.round(effMu * seasonality[(day - 1) % 7])
      totalDemand += dailyD

      let arrived = 0
      for (let i = orders.length - 1; i >= 0; i--) {
        if (orders[i].arrivalDay <= day) {
          arrived += orders[i].qty
          orders.splice(i, 1)
        }
      }

      const startStock = stock + arrived
      const sold = Math.min(startStock, dailyD)
      const unfulfilled = Math.max(0, dailyD - startStock)
      stock = Math.max(0, startStock - sold)
      fulfilled += sold
      unmet += unfulfilled
      minStock = Math.min(minStock, stock)

      const unmanagedSold = Math.min(unmanagedStock, dailyD)
      unmanagedStock = Math.max(0, unmanagedStock - unmanagedSold)

      const pending = orders.reduce((s, o) => s + o.qty, 0)
      const netInv = stock + pending
      if (enable_replenishment && netInv <= rop) {
        orders.push({ qty: roq, arrivalDay: day + Math.round(effLt) })
      }

      timeline.push({
        day,
        demand: dailyD,
        starting_stock: startStock,
        order_arrived: arrived,
        units_sold: sold,
        ending_stock: stock,
        net_inventory: netInv,
        unmanaged_ending_stock: unmanagedStock,
        is_stockout: stock === 0 && dailyD > 0,
        unmet_demand: unfulfilled,
        reorder_point: rop,
        safety_stock: ss,
      })
    }

    return res.json({
      success: true,
      data: {
        sku_id,
        location_id,
        safety_stock: ss,
        reorder_point: rop,
        recommended_order_quantity: roq,
        effective_lead_time_days: effLt,
        effective_daily_demand: effMu,
        total_simulated_demand: totalDemand,
        managed_total_fulfilled: fulfilled,
        managed_total_unmet: unmet,
        managed_service_level_achieved: totalDemand > 0 ? Number(((fulfilled / totalDemand) * 100).toFixed(1)) : 100.0,
        managed_min_stock: minStock,
        unmanaged_stockout_day: timeline.find((t) => t.unmanaged_ending_stock === 0)?.day || null,
        unmanaged_total_unmet: timeline.reduce((s, t) => s + Math.max(0, t.demand - t.units_sold), 0),
        replenishment_orders_count: orders.length,
        timeline,
        fallback: true,
      },
    })
  }
}

export default {
  getOverview,
  getInventory,
  getDemand,
  getSuppliers,
  getRecommendations,
  simulateInventory,
}
