import { randomUUID } from 'crypto'
import mlClient, { MlServiceError } from '../integrations/mlClient.js'
import OptimizationRun from '../models/OptimizationRun.js'
import logger from '../utils/logger.js'

/**
 * Controller for OR-Tools inventory allocation optimization and disruption simulation.
 */

/**
 * POST /api/v1/optimization/solve
 * Solves warehouse-to-store/region SKU allocation using OR-Tools CP-SAT and records run metadata.
 */
export const solveOptimization = async (req, res, next) => {
  try {
    const {
      horizonDays,
      horizon_days,
      stores,
      products,
      shortagePenaltyPerUnit,
      shortage_penalty_per_unit,
      transportCostMultiplier,
      transport_cost_multiplier,
      solverTimeLimitSeconds,
      solver_time_limit_seconds,
    } = req.body

    const rawHorizon = horizonDays !== undefined ? horizonDays : horizon_days !== undefined ? horizon_days : 7
    const parsedHorizon = Number(rawHorizon)

    if (isNaN(parsedHorizon) || parsedHorizon <= 0 || parsedHorizon > 30) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: 'horizonDays must be an integer between 1 and 30 days',
      })
    }

    const payload = {
      horizon_days: parsedHorizon,
      stores: Array.isArray(stores) ? stores : undefined,
      products: Array.isArray(products) ? products : undefined,
      shortage_penalty_per_unit: Number(shortagePenaltyPerUnit !== undefined ? shortagePenaltyPerUnit : shortage_penalty_per_unit !== undefined ? shortage_penalty_per_unit : 100.0),
      transport_cost_multiplier: Number(transportCostMultiplier !== undefined ? transportCostMultiplier : transport_cost_multiplier !== undefined ? transport_cost_multiplier : 1.0),
      solver_time_limit_seconds: Number(solverTimeLimitSeconds !== undefined ? solverTimeLimitSeconds : solver_time_limit_seconds !== undefined ? solver_time_limit_seconds : 10.0),
    }

    const correlationId = req.correlationId || randomUUID()
    const result = await mlClient.solveOptimization(payload, { correlationId })

    const runId = result.run_id || `opt-${randomUUID().slice(0, 10)}`

    // Persist run metadata to MongoDB (Plan is a recommendation; NEVER overwrite Inventory)
    try {
      await OptimizationRun.create({
        runId,
        runType: 'solve',
        scenarioName: 'Optimal Allocation Plan',
        datasetVersion: 'v1.0-demo',
        solver: 'Google OR-Tools CP-SAT',
        status: result.status || 'OPTIMAL',
        isFeasible: result.feasibility?.is_feasible ?? true,
        solverRuntimeSeconds: result.solver_runtime_seconds || 0,
        objectiveScore: result.optimized_plan?.objective_score || 0,
        metrics: {
          baselineTransportCost: result.baseline_plan?.total_transport_cost || 0,
          optimizedTransportCost: result.optimized_plan?.total_transport_cost || 0,
          baselineUnmetDemandUnits: result.baseline_plan?.total_unmet_demand_units || 0,
          optimizedUnmetDemandUnits: result.optimized_plan?.total_unmet_demand_units || 0,
          demandFulfillmentRatePct: result.optimized_plan?.demand_fulfillment_rate || 0,
          allocatedUnits: result.optimized_plan?.total_allocated_units || 0,
          forecastDemandUnits: result.optimized_plan?.total_forecast_demand || 0,
        },
        parameters: payload,
        planSummary: result.optimized_plan || {},
        warnings: result.warnings || [],
        allocationsCount: (result.allocations || []).length,
        allocationsSample: (result.allocations || []).slice(0, 50),
        createdBy: req.user?._id || null,
        correlationId,
      })
    } catch (dbErr) {
      logger.warn({ err: dbErr.message, runId }, 'Failed to persist optimization run to MongoDB')
    }

    return res.status(200).json({
      success: true,
      runId,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}

/**
 * POST /api/v1/optimization/simulate
 * Simulates network disruption shocks, solves baseline vs disrupted plans, and records run metadata.
 */
export const simulateOptimization = async (req, res, next) => {
  try {
    const {
      scenarioName,
      scenario_name,
      presetScenarioId,
      preset_scenario_id,
      disruptions,
      horizonDays,
      horizon_days,
      stores,
      products,
      shortagePenaltyPerUnit,
      shortage_penalty_per_unit,
      transportCostMultiplier,
      transport_cost_multiplier,
      solverTimeLimitSeconds,
      solver_time_limit_seconds,
    } = req.body

    const effectivePreset = presetScenarioId || preset_scenario_id
    const effectiveDisruptions = Array.isArray(disruptions) ? disruptions : []

    if (!effectivePreset && effectiveDisruptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: "Either 'presetScenarioId' or 'disruptions' array must be provided for scenario simulation",
      })
    }

    const payload = {
      scenario_name: scenarioName || scenario_name || 'Custom Disruption Scenario',
      preset_scenario_id: effectivePreset || undefined,
      disruptions: effectiveDisruptions.map((d) => ({
        disruption_type: d.disruptionType || d.disruption_type,
        target_id: d.targetId || d.target_id,
        change_value: d.changeValue !== undefined ? Number(d.changeValue) : d.change_value !== undefined ? Number(d.change_value) : undefined,
      })),
      horizon_days: Number(horizonDays || horizon_days || 7),
      stores: Array.isArray(stores) ? stores : undefined,
      products: Array.isArray(products) ? products : undefined,
      shortage_penalty_per_unit: Number(shortagePenaltyPerUnit || shortage_penalty_per_unit || 100.0),
      transport_cost_multiplier: Number(transportCostMultiplier || transport_cost_multiplier || 1.0),
      solver_time_limit_seconds: Number(solverTimeLimitSeconds || solver_time_limit_seconds || 10.0),
    }

    const correlationId = req.correlationId || randomUUID()
    const result = await mlClient.simulateOptimization(payload, { correlationId })

    const runId = result.run_id || `sim-${randomUUID().slice(0, 10)}`

    // Persist simulation run metadata to MongoDB
    try {
      await OptimizationRun.create({
        runId,
        runType: 'simulate',
        scenarioName: result.scenario_name || payload.scenario_name,
        datasetVersion: 'v1.0-demo',
        solver: 'Google OR-Tools CP-SAT',
        status: result.resilience_insights?.solver_status || 'OPTIMAL',
        isFeasible: result.disrupted_feasibility?.is_feasible ?? true,
        solverRuntimeSeconds: result.disrupted_runtime_seconds || 0,
        objectiveScore: result.disrupted_plan?.objective_score || 0,
        metrics: {
          baselineTransportCost: result.baseline_plan?.total_transport_cost || 0,
          optimizedTransportCost: result.disrupted_plan?.total_transport_cost || 0,
          baselineUnmetDemandUnits: result.baseline_plan?.total_unmet_demand_units || 0,
          optimizedUnmetDemandUnits: result.disrupted_plan?.total_unmet_demand_units || 0,
          demandFulfillmentRatePct: result.disrupted_plan?.demand_fulfillment_rate || 0,
          allocatedUnits: result.disrupted_plan?.total_allocated_units || 0,
          forecastDemandUnits: result.disrupted_plan?.total_forecast_demand || 0,
        },
        parameters: payload,
        planSummary: result.disrupted_plan || {},
        resilienceInsights: result.resilience_insights || null,
        warnings: result.warnings || [],
        allocationsCount: (result.disrupted_allocations || []).length,
        allocationsSample: (result.disrupted_allocations || []).slice(0, 50),
        createdBy: req.user?._id || null,
        correlationId,
      })
    } catch (dbErr) {
      logger.warn({ err: dbErr.message, runId }, 'Failed to persist simulation run to MongoDB')
    }

    return res.status(200).json({
      success: true,
      runId,
      data: result,
    })
  } catch (error) {
    if (error instanceof MlServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.name,
        message: error.message,
        details: error.details,
      })
    }
    next(error)
  }
}

/**
 * GET /api/v1/optimization/runs
 * Lists historical optimization and simulation run summaries with pagination.
 */
export const getOptimizationRuns = async (req, res, next) => {
  try {
    const { runType, status: runStatus, page = 1, limit = 20 } = req.query

    const filter = {}
    if (runType) filter.runType = runType
    if (runStatus) filter.status = runStatus

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const [total, runs] = await Promise.all([
      OptimizationRun.countDocuments(filter),
      OptimizationRun.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ])

    return res.status(200).json({
      success: true,
      data: runs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/optimization/runs/:runId
 * Retrieves full details and allocations for a specific optimization run.
 */
export const getOptimizationRunById = async (req, res, next) => {
  try {
    const { runId } = req.params

    const run = await OptimizationRun.findOne({ runId }).lean()
    if (run) {
      return res.status(200).json({
        success: true,
        data: run,
      })
    }

    // Fallback query to ML microservice if not found in local MongoDB
    try {
      const mlRun = await mlClient.getOptimizationRunById(runId, {
        correlationId: req.correlationId,
      })
      return res.status(200).json({
        success: true,
        data: mlRun,
        source: 'ml_service_memory',
      })
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `Optimization run '${runId}' not found`,
      })
    }
  } catch (error) {
    next(error)
  }
}
