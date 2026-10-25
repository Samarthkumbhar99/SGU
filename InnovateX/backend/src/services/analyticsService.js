import Inventory from '../models/Inventory.js'
import DemandHistory from '../models/DemandHistory.js'
import Product from '../models/Product.js'
import Warehouse from '../models/Warehouse.js'
import Supplier from '../models/Supplier.js'

/**
 * Mathematical & Statistical Helpers
 */
export const calculateDaysOfSupply = (inventoryLevel, avgDailyDemand) => {
  if (inventoryLevel === undefined || inventoryLevel === null || inventoryLevel < 0) {
    return {
      daysOfSupply: null,
      explanation: 'Inventory quantity is unavailable or invalid',
    }
  }
  if (avgDailyDemand === undefined || avgDailyDemand === null || avgDailyDemand <= 0) {
    return {
      daysOfSupply: null,
      explanation: 'Average daily demand is zero or unavailable; cannot calculate days of supply',
    }
  }
  const days = Number((inventoryLevel / avgDailyDemand).toFixed(1))
  return {
    daysOfSupply: days,
    explanation: `${days} days based on available stock (${inventoryLevel} units) / average daily sales (${avgDailyDemand.toFixed(2)} units/day)`,
  }
}

export const calculateInventoryValuation = (quantity, unitCost) => {
  if (quantity === null || quantity === undefined || unitCost === null || unitCost === undefined) {
    return 0
  }
  return Number((Math.max(0, quantity) * Math.max(0, unitCost)).toFixed(2))
}

/**
 * 1. Overview Analytics Aggregation
 * Returns top-level network health, total inventory valuation, and at-risk item summary
 */
export async function getOverviewAnalytics(filters = {}) {
  const matchFilter = {}
  if (filters.warehouseId) matchFilter.warehouseId = filters.warehouseId.toUpperCase()
  if (filters.skuId) matchFilter.skuId = filters.skuId.toUpperCase()

  // 1. Inventory Aggregations
  const [inventoryStats, countStats, demandWindowStats] = await Promise.all([
    Inventory.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalInventoryUnits: { $sum: '$inventoryLevel' },
          totalInventoryValuation: { $sum: { $multiply: ['$inventoryLevel', '$unitCost'] } },
          totalPotentialRevenue: { $sum: { $multiply: ['$inventoryLevel', '$unitPrice'] } },
          totalReorderPoint: { $sum: '$reorderPoint' },
          count: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$inventoryLevel', '$reorderPoint'] }, 1, 0],
            },
          },
          excessStockCount: {
            $sum: {
              $cond: [{ $gt: ['$inventoryLevel', { $multiply: ['$reorderPoint', 2.0] }] }, 1, 0],
            },
          },
        },
      },
    ]),

    Promise.all([
      Product.countDocuments(),
      Warehouse.countDocuments(),
      Supplier.countDocuments(),
    ]),

    // Recent 30-day demand aggregation for network daily burn rate
    DemandHistory.aggregate([
      {
        $match: {
          dateString: { $gte: '2024-12-01', $lte: '2024-12-30' },
          ...(filters.warehouseId ? { warehouseId: filters.warehouseId.toUpperCase() } : {}),
          ...(filters.skuId ? { skuId: filters.skuId.toUpperCase() } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalUnitsSold30d: { $sum: '$unitsSold' },
          avgDailyDemandNetwork: { $avg: '$unitsSold' },
          promoUnitsSold30d: {
            $sum: { $cond: [{ $eq: ['$promotionFlag', 1] }, '$unitsSold', 0] },
          },
        },
      },
    ]),
  ])

  const invSummary = inventoryStats[0] || {
    totalInventoryUnits: 0,
    totalInventoryValuation: 0,
    totalPotentialRevenue: 0,
    lowStockCount: 0,
    excessStockCount: 0,
    count: 0,
  }

  const [totalProducts, totalWarehouses, totalSuppliers] = countStats
  const demand30d = demandWindowStats[0] || {
    totalUnitsSold30d: 0,
    avgDailyDemandNetwork: 0,
    promoUnitsSold30d: 0,
  }

  const networkDaysOfSupply =
    demand30d.totalUnitsSold30d > 0
      ? Number((invSummary.totalInventoryUnits / (demand30d.totalUnitsSold30d / 30)).toFixed(1))
      : null

  return {
    kpis: {
      totalInventoryUnits: invSummary.totalInventoryUnits,
      totalInventoryValuation: Number(invSummary.totalInventoryValuation.toFixed(2)),
      totalPotentialRevenue: Number(invSummary.totalPotentialRevenue.toFixed(2)),
      grossMarginValue: Number(
        (invSummary.totalPotentialRevenue - invSummary.totalInventoryValuation).toFixed(2)
      ),
      grossMarginPercentage:
        invSummary.totalPotentialRevenue > 0
          ? Number(
              (
                ((invSummary.totalPotentialRevenue - invSummary.totalInventoryValuation) /
                  invSummary.totalPotentialRevenue) *
                100
              ).toFixed(1)
            )
          : 0,
      activeSkusCount: totalProducts,
      activeWarehousesCount: totalWarehouses,
      activeSuppliersCount: totalSuppliers,
      networkDaysOfSupply,
    },
    inventoryHealth: {
      totalPositions: invSummary.count,
      lowStockPositions: invSummary.lowStockCount,
      excessStockPositions: invSummary.excessStockCount,
      healthyPositions: Math.max(
        0,
        invSummary.count - invSummary.lowStockCount - invSummary.excessStockCount
      ),
      lowStockPercentage:
        invSummary.count > 0 ? Number(((invSummary.lowStockCount / invSummary.count) * 100).toFixed(1)) : 0,
    },
    recentDemandVelocity: {
      windowDays: 30,
      totalUnitsSold: demand30d.totalUnitsSold30d,
      dailyAverageUnits: Number((demand30d.totalUnitsSold30d / 30).toFixed(1)),
      promotionVolumeShare:
        demand30d.totalUnitsSold30d > 0
          ? Number(((demand30d.promoUnitsSold30d / demand30d.totalUnitsSold30d) * 100).toFixed(1))
          : 0,
    },
    metadata: {
      valuationFormula: 'Σ(inventoryLevel × unitCost)',
      daysOfSupplyFormula: 'totalInventoryUnits / (totalUnitsSoldLast30Days / 30)',
      currency: 'USD',
      stockoutCaveat:
        'Stockout_Flag is 0 in the source dataset. Sales volume serves as proxy for realized demand.',
    },
  }
}

/**
 * 2. Detailed Inventory Intelligence
 * Item-by-item inventory positions with valuations, lead-time stats, and days of supply
 */
export async function getInventoryAnalytics(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))
  const skip = (page - 1) * limit

  const filter = {}
  if (query.skuId) filter.skuId = query.skuId.toUpperCase()
  if (query.warehouseId) filter.warehouseId = query.warehouseId.toUpperCase()
  if (query.supplierId) filter.supplierId = query.supplierId.toUpperCase()
  if (query.lowStock === 'true') {
    filter.$expr = { $lte: ['$inventoryLevel', '$reorderPoint'] }
  }

  // 1. Fetch paginated inventory records
  const [total, items, warehouseBreakdown, demandRates] = await Promise.all([
    Inventory.countDocuments(filter),
    Inventory.find(filter).sort({ warehouseId: 1, skuId: 1 }).skip(skip).limit(limit),

    // Warehouse distribution summary
    Inventory.aggregate([
      {
        $group: {
          _id: '$warehouseId',
          totalUnits: { $sum: '$inventoryLevel' },
          totalValuation: { $sum: { $multiply: ['$inventoryLevel', '$unitCost'] } },
          skusStored: { $sum: 1 },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$inventoryLevel', '$reorderPoint'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Precompute 30-day average daily demand for active items
    DemandHistory.aggregate([
      {
        $match: {
          dateString: { $gte: '2024-12-01', $lte: '2024-12-30' },
          ...(query.warehouseId ? { warehouseId: query.warehouseId.toUpperCase() } : {}),
          ...(query.skuId ? { skuId: query.skuId.toUpperCase() } : {}),
        },
      },
      {
        $group: {
          _id: { skuId: '$skuId', warehouseId: '$warehouseId' },
          avgDailyDemand30d: { $avg: '$unitsSold' },
          totalUnitsSold30d: { $sum: '$unitsSold' },
        },
      },
    ]),
  ])

  // Build lookup map for 30-day demand averages
  const demandMap = new Map()
  demandRates.forEach((d) => {
    const key = `${d._id.skuId}__${d._id.warehouseId}`
    demandMap.set(key, {
      avgDailyDemand: Number(d.avgDailyDemand30d.toFixed(2)),
      totalSold30d: d.totalUnitsSold30d,
    })
  })

  // Format enriched positions
  const records = items.map((inv) => {
    const demandInfo = demandMap.get(`${inv.skuId}__${inv.warehouseId}`)
    const avgDemand = demandInfo ? demandInfo.avgDailyDemand : null
    const dosResult = calculateDaysOfSupply(inv.inventoryLevel, avgDemand)
    const valuation = calculateInventoryValuation(inv.inventoryLevel, inv.unitCost)
    const potentialRevenue = calculateInventoryValuation(inv.inventoryLevel, inv.unitPrice)

    // Explicit stock categorization rules
    let stockStatus = 'HEALTHY'
    if (inv.inventoryLevel === 0) {
      stockStatus = 'STOCKOUT'
    } else if (inv.inventoryLevel <= inv.reorderPoint * 0.5) {
      stockStatus = 'CRITICAL_LOW'
    } else if (inv.inventoryLevel <= inv.reorderPoint) {
      stockStatus = 'REORDER_TRIGGERED'
    } else if (dosResult.daysOfSupply !== null && dosResult.daysOfSupply > 60) {
      stockStatus = 'EXCESS'
    } else if (inv.inventoryLevel > inv.reorderPoint * 2.5) {
      stockStatus = 'EXCESS'
    }

    return {
      skuId: inv.skuId,
      warehouseId: inv.warehouseId,
      supplierId: inv.supplierId,
      inventoryLevel: inv.inventoryLevel,
      reorderPoint: inv.reorderPoint,
      orderQuantity: inv.orderQuantity,
      unitCost: inv.unitCost,
      unitPrice: inv.unitPrice,
      valuation,
      potentialRevenue,
      marginPerUnit: Number((inv.unitPrice - inv.unitCost).toFixed(2)),
      supplierLeadTimeDays: inv.supplierLeadTimeDays,
      averageDailyDemand30d: avgDemand,
      daysOfSupply: dosResult.daysOfSupply,
      daysOfSupplyExplanation: dosResult.explanation,
      isLowStock: inv.inventoryLevel <= inv.reorderPoint,
      stockStatus,
      lastObservationDate: inv.lastObservationDate,
    }
  })

  return {
    records,
    warehouseDistribution: warehouseBreakdown.map((w) => ({
      warehouseId: w._id,
      totalUnits: w.totalUnits,
      totalValuation: Number(w.totalValuation.toFixed(2)),
      skusStored: w.skusStored,
      lowStockPositions: w.lowStockCount,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    definitions: {
      valuation: 'quantity × unitCost',
      daysOfSupply: 'quantity / averageDailyDemand (30-day baseline)',
      excessStockRule: 'daysOfSupply > 60 days OR inventoryLevel > 2.5 × reorderPoint',
    },
  }
}

/**
 * 3. Demand Analytics & Aggregation
 * Daily, weekly, monthly demand slices, volatility (stdDev, CV), and descriptive promotional comparisons
 */
export async function getDemandAnalytics(query = {}) {
  const {
    skuId,
    warehouseId,
    region,
    granularity = 'daily', // 'daily' | 'weekly' | 'monthly'
    startDate = '2024-01-01',
    endDate = '2024-12-30',
  } = query

  const matchFilter = {
    dateString: { $gte: startDate, $lte: endDate },
  }
  if (skuId) matchFilter.skuId = skuId.toUpperCase()
  if (warehouseId) matchFilter.warehouseId = warehouseId.toUpperCase()
  if (region) matchFilter.region = region

  // Date grouping format
  let dateGroupExpr
  if (granularity === 'monthly') {
    dateGroupExpr = { $substr: ['$dateString', 0, 7] } // YYYY-MM
  } else if (granularity === 'weekly') {
    // Group by year and week
    dateGroupExpr = {
      $concat: [
        { $substr: ['$dateString', 0, 4] },
        '-W',
        { $toString: { $isoWeek: '$date' } },
      ],
    }
  } else {
    dateGroupExpr = '$dateString' // daily
  }

  const [timeSeriesAggregation, summaryStats, promotionComparison, regionBreakdown] =
    await Promise.all([
      // 1. Grouped time series
      DemandHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: dateGroupExpr,
            totalUnitsSold: { $sum: '$unitsSold' },
            avgUnitsSold: { $avg: '$unitsSold' },
            minUnitsSold: { $min: '$unitsSold' },
            maxUnitsSold: { $max: '$unitsSold' },
            totalForecast: { $sum: '$demandForecast' },
            observationsCount: { $sum: 1 },
            promotionDaysCount: {
              $sum: { $cond: [{ $eq: ['$promotionFlag', 1] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 366 },
      ]),

      // 2. Statistical Distribution Summary (Mean, StdDev, Min, Max)
      DemandHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalObservations: { $sum: 1 },
            totalUnitsSold: { $sum: '$unitsSold' },
            meanDemand: { $avg: '$unitsSold' },
            stdDevDemand: { $stdDevPop: '$unitsSold' },
            minDemand: { $min: '$unitsSold' },
            maxDemand: { $max: '$unitsSold' },
          },
        },
      ]),

      // 3. Promotion vs Non-Promotion Comparison
      DemandHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$promotionFlag',
            sampleSize: { $sum: 1 },
            totalUnitsSold: { $sum: '$unitsSold' },
            avgUnitsSold: { $avg: '$unitsSold' },
            stdDevDemand: { $stdDevPop: '$unitsSold' },
          },
        },
      ]),

      // 4. Regional breakdown
      DemandHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$region',
            totalUnitsSold: { $sum: '$unitsSold' },
            avgUnitsSold: { $avg: '$unitsSold' },
            observations: { $sum: 1 },
          },
        },
        { $sort: { totalUnitsSold: -1 } },
      ]),
    ])

  const stats = summaryStats[0] || {
    totalObservations: 0,
    totalUnitsSold: 0,
    meanDemand: 0,
    stdDevDemand: 0,
    minDemand: 0,
    maxDemand: 0,
  }

  const mean = Number((stats.meanDemand || 0).toFixed(2))
  const stdDev = Number((stats.stdDevDemand || 0).toFixed(2))
  const cv = mean > 0 ? Number((stdDev / mean).toFixed(3)) : 0

  // Format promotion comparison
  const promoGroup = promotionComparison.find((p) => p._id === 1) || {
    sampleSize: 0,
    totalUnitsSold: 0,
    avgUnitsSold: 0,
    stdDevDemand: 0,
  }
  const nonPromoGroup = promotionComparison.find((p) => p._id === 0) || {
    sampleSize: 0,
    totalUnitsSold: 0,
    avgUnitsSold: 0,
    stdDevDemand: 0,
  }

  const promoAvg = Number((promoGroup.avgUnitsSold || 0).toFixed(2))
  const nonPromoAvg = Number((nonPromoGroup.avgUnitsSold || 0).toFixed(2))
  const descriptiveDifferencePercentage =
    nonPromoAvg > 0 ? Number((((promoAvg - nonPromoAvg) / nonPromoAvg) * 100).toFixed(1)) : 0

  return {
    granularity,
    dateRange: { startDate, endDate },
    summary: {
      totalObservations: stats.totalObservations,
      totalUnitsSold: stats.totalUnitsSold,
      meanDailySales: mean,
      standardDeviation: stdDev,
      coefficientOfVariation: cv,
      volatilityCategory: cv > 0.6 ? 'HIGH' : cv > 0.3 ? 'MODERATE' : 'LOW',
      minObservation: stats.minDemand,
      maxObservation: stats.maxDemand,
    },
    promotionAnalysis: {
      promotional: {
        sampleSize: promoGroup.sampleSize,
        totalUnits: promoGroup.totalUnitsSold,
        meanSalesPerDay: promoAvg,
        stdDev: Number((promoGroup.stdDevDemand || 0).toFixed(2)),
      },
      baselineNonPromotional: {
        sampleSize: nonPromoGroup.sampleSize,
        totalUnits: nonPromoGroup.totalUnitsSold,
        meanSalesPerDay: nonPromoAvg,
        stdDev: Number((nonPromoGroup.stdDevDemand || 0).toFixed(2)),
      },
      descriptiveDifferencePercentage,
      statisticalCaveat:
        'Descriptive statistics only. Higher volume during promotions does not imply causality; sample size differences, calendar seasonality, and inventory stocking policies confound promotional impact.',
    },
    regionalDistribution: regionBreakdown.map((r) => ({
      region: r._id,
      totalUnitsSold: r.totalUnitsSold,
      averagePerDay: Number(r.avgUnitsSold.toFixed(2)),
      observationsCount: r.observations,
    })),
    timeSeries: timeSeriesAggregation.map((t) => ({
      period: t._id,
      totalUnitsSold: t.totalUnitsSold,
      averageUnitsSold: Number(t.avgUnitsSold.toFixed(2)),
      minUnits: t.minUnitsSold,
      maxUnits: t.maxUnitsSold,
      forecastComparison: Number(t.totalForecast.toFixed(1)),
      observations: t.observationsCount,
      promotionDays: t.promotionDaysCount,
    })),
  }
}

/**
 * 4. Supplier Intelligence & Lead Time Analytics
 */
export async function getSupplierAnalytics() {
  const [supplierMetrics, catalogSuppliers] = await Promise.all([
    Inventory.aggregate([
      {
        $group: {
          _id: '$supplierId',
          totalInventoryUnits: { $sum: '$inventoryLevel' },
          totalValuation: { $sum: { $multiply: ['$inventoryLevel', '$unitCost'] } },
          skusSupplied: { $addToSet: '$skuId' },
          warehousesServed: { $addToSet: '$warehouseId' },
          avgLeadTimeDays: { $avg: '$supplierLeadTimeDays' },
          minLeadTimeDays: { $min: '$supplierLeadTimeDays' },
          maxLeadTimeDays: { $max: '$supplierLeadTimeDays' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Supplier.find().lean(),
  ])

  const supplierMetaMap = new Map()
  catalogSuppliers.forEach((s) => supplierMetaMap.set(s.supplierId, s))

  return supplierMetrics.map((sm) => {
    const meta = supplierMetaMap.get(sm._id) || {}
    return {
      supplierId: sm._id,
      supplierName: meta.supplierName || `Supplier ${sm._id}`,
      defaultLeadTimeDays: meta.defaultLeadTimeDays || Math.round(sm.avgLeadTimeDays),
      leadTimeStats: {
        avgLeadTimeDays: Number(sm.avgLeadTimeDays.toFixed(1)),
        minLeadTimeDays: sm.minLeadTimeDays,
        maxLeadTimeDays: sm.maxLeadTimeDays,
        leadTimeRisk: sm.maxLeadTimeDays >= 12 ? 'HIGH' : sm.maxLeadTimeDays >= 7 ? 'MODERATE' : 'LOW',
      },
      skusSuppliedCount: sm.skusSupplied.length,
      warehousesServedCount: sm.warehousesServed.length,
      warehousesServed: sm.warehousesServed,
      currentInventoryUnitsHeld: sm.totalInventoryUnits,
      currentInventoryValuation: Number(sm.totalValuation.toFixed(2)),
      regions: meta.regions || [],
    }
  })
}

/**
 * 5. Deterministic Recommendations Engine
 * Evaluates stock breach rules, days of supply, lead time risk, and excess capital lockup
 */
export async function getRecommendations(filters = {}) {
  const query = {}
  if (filters.warehouseId) query.warehouseId = filters.warehouseId.toUpperCase()
  if (filters.skuId) query.skuId = filters.skuId.toUpperCase()

  const [inventoryList, recentDemand] = await Promise.all([
    Inventory.find(query).sort({ warehouseId: 1, skuId: 1 }).lean(),
    DemandHistory.aggregate([
      {
        $match: {
          dateString: { $gte: '2024-12-01', $lte: '2024-12-30' },
          ...(filters.warehouseId ? { warehouseId: filters.warehouseId.toUpperCase() } : {}),
          ...(filters.skuId ? { skuId: filters.skuId.toUpperCase() } : {}),
        },
      },
      {
        $group: {
          _id: { skuId: '$skuId', warehouseId: '$warehouseId' },
          avgDailyDemand: { $avg: '$unitsSold' },
          stdDevDemand: { $stdDevPop: '$unitsSold' },
        },
      },
    ]),
  ])

  const demandMap = new Map()
  recentDemand.forEach((d) => {
    demandMap.set(`${d._id.skuId}__${d._id.warehouseId}`, {
      avgDailyDemand: Number(d.avgDailyDemand.toFixed(2)),
      stdDevDemand: Number(d.stdDevDemand.toFixed(2)),
    })
  })

  const recommendations = []
  const generatedAt = new Date().toISOString()

  inventoryList.forEach((inv) => {
    const key = `${inv.skuId}__${inv.warehouseId}`
    const demandInfo = demandMap.get(key)
    const avgDemand = demandInfo ? demandInfo.avgDailyDemand : 0
    const stdDev = demandInfo ? demandInfo.stdDevDemand : 0
    const cv = avgDemand > 0 ? Number((stdDev / avgDemand).toFixed(2)) : 0
    const dosResult = calculateDaysOfSupply(inv.inventoryLevel, avgDemand)
    const leadTime = inv.supplierLeadTimeDays || 7
    const leadTimeDemand = Math.round(avgDemand * leadTime)

    // Rule 1: Reorder Point Breach
    if (inv.inventoryLevel <= inv.reorderPoint) {
      const isCritical = inv.inventoryLevel <= inv.reorderPoint * 0.5
      // Recommended Order Qty = Reorder Shortfall + Safety Buffer
      const shortfall = inv.reorderPoint - inv.inventoryLevel
      const suggestedOrderQty = Math.max(inv.orderQuantity || 0, shortfall + leadTimeDemand, 50)

      recommendations.push({
        id: `REC-REORDER-${inv.skuId}-${inv.warehouseId}`,
        type: 'REORDER_POINT_BREACH',
        severity: isCritical ? 'CRITICAL' : 'WARNING',
        skuId: inv.skuId,
        warehouseId: inv.warehouseId,
        supplierId: inv.supplierId,
        observedMetrics: {
          currentInventory: inv.inventoryLevel,
          reorderPoint: inv.reorderPoint,
          shortfallUnits: shortfall,
          averageDailyDemand: avgDemand,
          supplierLeadTimeDays: leadTime,
          expectedLeadTimeDemand: leadTimeDemand,
          daysOfSupply: dosResult.daysOfSupply,
          unitCost: inv.unitCost,
        },
        triggerRule: `inventoryLevel (${inv.inventoryLevel}) <= reorderPoint (${inv.reorderPoint})`,
        recommendedAction: `Place replenishment order of ${suggestedOrderQty} units with supplier ${inv.supplierId} immediately.`,
        recommendedOrderQuantity: suggestedOrderQty,
        estimatedCapitalRequired: Number((suggestedOrderQty * inv.unitCost).toFixed(2)),
        caveats: [
          'Calculated using 30-day trailing daily sales rate.',
          'Assumes unconstrained supplier capacity and constant lead time.',
        ],
        generatedAt,
      })
    }

    // Rule 2: Low Days of Supply Below Supplier Lead Time
    if (dosResult.daysOfSupply !== null && dosResult.daysOfSupply < leadTime && inv.inventoryLevel > inv.reorderPoint) {
      recommendations.push({
        id: `REC-DOS-${inv.skuId}-${inv.warehouseId}`,
        type: 'LOW_DAYS_OF_SUPPLY',
        severity: 'CRITICAL',
        skuId: inv.skuId,
        warehouseId: inv.warehouseId,
        supplierId: inv.supplierId,
        observedMetrics: {
          currentInventory: inv.inventoryLevel,
          daysOfSupply: dosResult.daysOfSupply,
          supplierLeadTimeDays: leadTime,
          averageDailyDemand: avgDemand,
        },
        triggerRule: `daysOfSupply (${dosResult.daysOfSupply}d) < supplierLeadTimeDays (${leadTime}d)`,
        recommendedAction: `Expedite stock transfer or priority delivery. Inventory will exhaust before standard supplier lead time arrives.`,
        caveats: ['Assumes persistent daily demand rate without stockout recovery.'],
        generatedAt,
      })
    }

    // Rule 3: Potential Excess Inventory / Capital Lockup
    const isExcessDos = dosResult.daysOfSupply !== null && dosResult.daysOfSupply > 60
    const isExcessQty = inv.inventoryLevel > inv.reorderPoint * 2.5
    if (isExcessDos || isExcessQty) {
      const capitalLocked = Number((inv.inventoryLevel * inv.unitCost).toFixed(2))
      recommendations.push({
        id: `REC-EXCESS-${inv.skuId}-${inv.warehouseId}`,
        type: 'POTENTIAL_EXCESS_STOCK',
        severity: 'INFO',
        skuId: inv.skuId,
        warehouseId: inv.warehouseId,
        supplierId: inv.supplierId,
        observedMetrics: {
          currentInventory: inv.inventoryLevel,
          reorderPoint: inv.reorderPoint,
          daysOfSupply: dosResult.daysOfSupply,
          inventoryValuation: capitalLocked,
        },
        triggerRule: isExcessDos
          ? `daysOfSupply (${dosResult.daysOfSupply}d) > 60 days threshold`
          : `inventoryLevel (${inv.inventoryLevel}) > 2.5 × reorderPoint (${inv.reorderPoint * 2.5})`,
        recommendedAction: `Audit holding costs for capital lockup ($${capitalLocked}). Consider rebalancing transfers to deficit nodes or promotional activation.`,
        caveats: ['Excess determination relies on 60-day turnover velocity limit.'],
        generatedAt,
      })
    }

    // Rule 4: High Demand Volatility / Safety Stock Buffer Warning
    if (cv > 0.65 && avgDemand > 10) {
      recommendations.push({
        id: `REC-VOLATILITY-${inv.skuId}-${inv.warehouseId}`,
        type: 'UNUSUAL_DEMAND_SURGE',
        severity: 'WARNING',
        skuId: inv.skuId,
        warehouseId: inv.warehouseId,
        observedMetrics: {
          averageDailyDemand: avgDemand,
          standardDeviation: stdDev,
          coefficientOfVariation: cv,
        },
        triggerRule: `coefficientOfVariation (${cv}) > 0.65 threshold indicates erratic sales pattern`,
        recommendedAction: `Increase dynamic safety stock buffer by 15-20% to mitigate sudden stockout exposure.`,
        caveats: ['High variation may be driven by promotional spikes in source dataset.'],
        generatedAt,
      })
    }
  })

  // Sort by severity (CRITICAL first, then WARNING, then INFO)
  const severityRank = { CRITICAL: 1, WARNING: 2, INFO: 3 }
  recommendations.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])

  return {
    totalRecommendations: recommendations.length,
    criticalCount: recommendations.filter((r) => r.severity === 'CRITICAL').length,
    warningCount: recommendations.filter((r) => r.severity === 'WARNING').length,
    infoCount: recommendations.filter((r) => r.severity === 'INFO').length,
    recommendations,
  }
}

export default {
  calculateDaysOfSupply,
  calculateInventoryValuation,
  getOverviewAnalytics,
  getInventoryAnalytics,
  getDemandAnalytics,
  getSupplierAnalytics,
  getRecommendations,
}
