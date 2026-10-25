import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import connectDB, { disconnectDB } from '../src/config/db.js'
import mlClient, { MlServiceError } from '../src/integrations/mlClient.js'
import User from '../src/models/User.js'
import OptimizationRun from '../src/models/OptimizationRun.js'
import { generateToken } from '../src/utils/jwt.js'

describe('Optimization & Scenario Simulation Express Integration Suite', () => {
  let authToken
  let testUser

  beforeAll(async () => {
    await connectDB()
    await OptimizationRun.deleteMany({ runId: { $in: ['opt-mock-test01', 'sim-mock-test02'] } })

    testUser = await User.findOne({ email: 'opt_test@supplyshield.io' })
    if (!testUser) {
      testUser = await User.create({
        name: 'Optimization Test Analyst',
        email: 'opt_test@supplyshield.io',
        role: 'Supply Chain Analyst',
        isActive: true,
      })
    }
    authToken = generateToken(testUser._id)
  })

  afterAll(async () => {
    await OptimizationRun.deleteMany({ runId: { $in: ['opt-mock-test01', 'sim-mock-test02'] } })
    await disconnectDB()
  })

  describe('Route Authorization', () => {
    it('should reject unauthenticated POST /api/v1/optimization/solve with 401', async () => {
      const res = await request(app)
        .post('/api/v1/optimization/solve')
        .send({ horizonDays: 7 })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated POST /api/v1/optimization/simulate with 401', async () => {
      const res = await request(app)
        .post('/api/v1/optimization/simulate')
        .send({ presetScenarioId: 'SCN-001' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated GET /api/v1/optimization/runs with 401', async () => {
      const res = await request(app).get('/api/v1/optimization/runs')
      expect(res.status).toBe(401)
    })

    it('should reject unauthenticated GET /api/v1/optimization/runs/:runId with 401', async () => {
      const res = await request(app).get('/api/v1/optimization/runs/opt-12345')
      expect(res.status).toBe(401)
    })
  })

  describe('Input Validation', () => {
    it('should reject invalid horizonDays <= 0 with 400', async () => {
      const res = await request(app)
        .post('/api/v1/optimization/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ horizonDays: 0 })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('horizonDays must be an integer between 1 and 30')
    })

    it('should reject simulation without presetScenarioId or disruptions array with 400', async () => {
      const res = await request(app)
        .post('/api/v1/optimization/simulate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ horizonDays: 7 })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Either \'presetScenarioId\' or \'disruptions\' array must be provided')
    })
  })

  describe('POST /api/v1/optimization/solve', () => {
    it('should call mlClient.solveOptimization, return result and persist run in MongoDB', async () => {
      const mockResult = {
        run_id: 'opt-mock-test01',
        status: 'OPTIMAL',
        planning_horizon_days: 7,
        forecast_origin: '2025-12-31',
        solver_runtime_seconds: 0.125,
        optimized_plan: {
          total_forecast_demand: 1500,
          total_store_inventory_on_hand: 200,
          total_effective_store_stock_utilized: 200,
          total_surplus_store_stock: 0,
          total_gross_requirement: 1300,
          total_warehouse_stock_available: 5000,
          total_allocated_units: 1300,
          total_unmet_demand_units: 0,
          total_transport_cost: 142.5,
          demand_fulfillment_rate: 100.0,
          overall_demand_satisfied_rate: 100.0,
          objective_score: 142.5,
        },
        baseline_plan: {
          total_forecast_demand: 1500,
          total_store_inventory_on_hand: 200,
          total_effective_store_stock_utilized: 200,
          total_surplus_store_stock: 0,
          total_gross_requirement: 1300,
          total_warehouse_stock_available: 5000,
          total_allocated_units: 1300,
          total_unmet_demand_units: 0,
          total_transport_cost: 168.0,
          demand_fulfillment_rate: 100.0,
          overall_demand_satisfied_rate: 100.0,
          objective_score: 168.0,
        },
        delta_metrics: {
          transport_cost_savings_dollars: 25.5,
          unmet_demand_delta_units: 0,
        },
        allocations: [
          {
            warehouse_id: 'WH-CENTRAL',
            store_id: 'STORE-01',
            product_id: 'SKU-001',
            allocated_units: 500,
            unit_transport_cost: 0.1,
            total_transport_cost: 50.0,
            lead_time_hours: 12.0,
          },
        ],
        store_summaries: [],
        feasibility: {
          is_feasible: true,
          violations_count: 0,
          errors: [],
          warnings: [],
        },
        warnings: [],
      }

      const spy = vi.spyOn(mlClient, 'solveOptimization').mockResolvedValueOnce(mockResult)

      const res = await request(app)
        .post('/api/v1/optimization/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          horizonDays: 7,
          stores: ['STORE-01'],
          products: ['SKU-001'],
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.runId).toBe('opt-mock-test01')
      expect(res.body.data.status).toBe('OPTIMAL')
      expect(res.body.data.optimized_plan.total_allocated_units).toBe(1300)

      expect(spy).toHaveBeenCalledOnce()

      // Verify persisted run in MongoDB
      const runInDb = await OptimizationRun.findOne({ runId: 'opt-mock-test01' })
      expect(runInDb).not.toBeNull()
      expect(runInDb.runType).toBe('solve')
      expect(runInDb.status).toBe('OPTIMAL')
      expect(runInDb.isFeasible).toBe(true)
      expect(runInDb.objectiveScore).toBe(142.5)
      expect(runInDb.metrics.optimizedTransportCost).toBe(142.5)
      expect(runInDb.metrics.allocatedUnits).toBe(1300)

      spy.mockRestore()
    })

    it('should propagate MlServiceError properly', async () => {
      const spy = vi
        .spyOn(mlClient, 'solveOptimization')
        .mockRejectedValueOnce(new MlServiceError('CP-SAT solver timed out', 504))

      const res = await request(app)
        .post('/api/v1/optimization/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ horizonDays: 14 })

      expect(res.status).toBe(504)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('CP-SAT solver timed out')

      spy.mockRestore()
    })
  })

  describe('POST /api/v1/optimization/simulate', () => {
    it('should simulate disruption scenario and record in MongoDB', async () => {
      const mockSimResult = {
        run_id: 'sim-mock-test02',
        scenario_name: 'North Route Disruption (SCN-001)',
        applied_disruptions: [
          {
            disruption_type: 'route_closure',
            target_id: 'WH-NORTH__STORE-01',
            change_value: null,
          },
        ],
        affected_entities: {
          warehouses: [],
          stores: ['STORE-01'],
          products: [],
          lanes: ['WH-NORTH__STORE-01'],
        },
        baseline_plan: {
          total_forecast_demand: 1200,
          total_allocated_units: 1200,
          total_unmet_demand_units: 0,
          total_transport_cost: 120.0,
          demand_fulfillment_rate: 100.0,
          objective_score: 120.0,
        },
        disrupted_plan: {
          total_forecast_demand: 1200,
          total_allocated_units: 1200,
          total_unmet_demand_units: 0,
          total_transport_cost: 155.0,
          demand_fulfillment_rate: 100.0,
          objective_score: 155.0,
        },
        delta_metrics: {
          transport_cost_delta_dollars: 35.0,
          unmet_demand_delta_units: 0,
        },
        baseline_feasibility: { is_feasible: true, violations_count: 0, errors: [], warnings: [] },
        disrupted_feasibility: { is_feasible: true, violations_count: 0, errors: [], warnings: [] },
        baseline_runtime_seconds: 0.08,
        disrupted_runtime_seconds: 0.09,
        disrupted_allocations: [],
        resilience_insights: {
          primary_bottleneck: 'WH-NORTH__STORE-01 route closure',
          net_additional_unmet_units: 0,
          freight_cost_delta_dollars: 35.0,
          top_shortage_stores: [],
          top_shortage_products: [],
          is_disrupted_plan_feasible: true,
          solver_status: 'OPTIMAL',
          executive_summary: 'Rescued via WH-CENTRAL with +$35 freight delta.',
        },
        warnings: [],
      }

      const spy = vi.spyOn(mlClient, 'simulateOptimization').mockResolvedValueOnce(mockSimResult)

      const res = await request(app)
        .post('/api/v1/optimization/simulate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          presetScenarioId: 'SCN-001',
          horizonDays: 7,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.runId).toBe('sim-mock-test02')
      expect(res.body.data.resilience_insights.is_disrupted_plan_feasible).toBe(true)

      const simRunInDb = await OptimizationRun.findOne({ runId: 'sim-mock-test02' })
      expect(simRunInDb).not.toBeNull()
      expect(simRunInDb.runType).toBe('simulate')
      expect(simRunInDb.resilienceInsights.primary_bottleneck).toContain('route closure')

      spy.mockRestore()
    })
  })

  describe('GET /api/v1/optimization/runs and /:runId', () => {
    it('should list historical runs with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/optimization/runs?limit=10')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1)
    })

    it('should retrieve a specific run by ID from MongoDB', async () => {
      const res = await request(app)
        .get('/api/v1/optimization/runs/opt-mock-test01')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.runId).toBe('opt-mock-test01')
      expect(res.body.data.runType).toBe('solve')
    })

    it('should return 404 for unknown run ID', async () => {
      const spy = vi
        .spyOn(mlClient, 'getOptimizationRunById')
        .mockRejectedValueOnce(new MlServiceError('Not found', 404))

      const res = await request(app)
        .get('/api/v1/optimization/runs/opt-non-existent-xyz')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('NotFound')

      spy.mockRestore()
    })
  })
})
