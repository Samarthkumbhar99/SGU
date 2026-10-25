import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import connectDB, { disconnectDB } from '../src/config/db.js'
import mlClient, { MlServiceError } from '../src/integrations/mlClient.js'
import User from '../src/models/User.js'
import { generateToken } from '../src/utils/jwt.js'

describe('Demand Forecasting Express Integration Suite', () => {
  let authToken
  let testUser

  beforeAll(async () => {
    await connectDB()

    testUser = await User.findOne({ email: 'forecast_test@supplyshield.io' })
    if (!testUser) {
      testUser = await User.create({
        name: 'Forecast Test User',
        email: 'forecast_test@supplyshield.io',
        role: 'Supply Chain Analyst',
        isActive: true,
      })
    }
    authToken = generateToken(testUser._id)
  })

  afterAll(async () => {
    await disconnectDB()
  })

  describe('Route Authorization', () => {
    it('should reject unauthenticated POST /api/v1/forecast/predict with 401', async () => {
      const res = await request(app)
        .post('/api/v1/forecast/predict')
        .send({ skuId: 'SKU_1', warehouseId: 'WH_1' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated POST /api/v1/forecast/train with 401', async () => {
      const res = await request(app).post('/api/v1/forecast/train').send({})
      expect(res.status).toBe(401)
    })

    it('should reject unauthenticated POST /api/v1/forecast/evaluate with 401', async () => {
      const res = await request(app).post('/api/v1/forecast/evaluate').send({})
      expect(res.status).toBe(401)
    })

    it('should reject unauthenticated GET /api/v1/forecast/models with 401', async () => {
      const res = await request(app).get('/api/v1/forecast/models')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/forecast/predict', () => {
    it('should reject missing skuId or warehouseId with 400', async () => {
      const res = await request(app)
        .post('/api/v1/forecast/predict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ horizonDays: 14 })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Both skuId and warehouseId are required')
    })

    it('should call mlClient.predictForecast and return forecast items', async () => {
      const mockForecastResponse = {
        sku_id: 'SKU_1',
        warehouse_id: 'WH_1',
        forecast_origin: '2024-12-30',
        horizon_days: 7,
        model_applied: 'lightgbm',
        model_version: 'v_test123',
        forecasts: [
          { date: '2024-12-31', predicted_demand: 18.5, order_quantity_round: 19 },
          { date: '2025-01-01', predicted_demand: 22.0, order_quantity_round: 22 },
        ],
        warnings: [],
      }

      const spy = vi.spyOn(mlClient, 'predictForecast').mockResolvedValueOnce(mockForecastResponse)

      const res = await request(app)
        .post('/api/v1/forecast/predict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skuId: 'SKU_1',
          warehouseId: 'WH_1',
          horizonDays: 7,
          modelType: 'lightgbm',
          roundingPolicy: 'round',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.sku_id).toBe('SKU_1')
      expect(res.body.data.forecasts).toHaveLength(2)
      expect(spy).toHaveBeenCalled()

      spy.mockRestore()
    })

    it('should propagate MlServiceError with proper status and normalized payload', async () => {
      const spy = vi.spyOn(mlClient, 'predictForecast').mockRejectedValueOnce(
        new MlServiceError('ML Service is unreachable: ECONNREFUSED', 503)
      )

      const res = await request(app)
        .post('/api/v1/forecast/predict')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ skuId: 'SKU_1', warehouseId: 'WH_1' })

      expect(res.status).toBe(503)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('unreachable')

      spy.mockRestore()
    })
  })

  describe('POST /api/v1/forecast/train', () => {
    it('should invoke mlClient.trainForecast and return training summary', async () => {
      const mockTrainResponse = {
        success: true,
        model_name: 'lightgbm',
        model_version: 'v_20261024_test',
        training_cutoff_date: '2024-11-04',
        train_observations: 70250,
        validation_metrics: { mae: 4.57, rmse: 5.74, wape: 0.34, bias: -2.09 },
        holdout_metrics: { mae: 7.20, rmse: 8.60, wape: 0.40, bias: -6.70 },
        artifact_path: '/models/lightgbm_v_test',
        is_active: true,
      }

      const spy = vi.spyOn(mlClient, 'trainForecast').mockResolvedValueOnce(mockTrainResponse)

      const res = await request(app)
        .post('/api/v1/forecast/train')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ modelType: 'lightgbm', forceRetrain: true })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.model_name).toBe('lightgbm')
      expect(res.body.data.is_active).toBe(true)

      spy.mockRestore()
    })
  })

  describe('POST /api/v1/forecast/evaluate', () => {
    it('should invoke mlClient.evaluateForecast and return model comparison', async () => {
      const mockEvalResponse = {
        target_evaluated: 'Units_Sold (observed demand)',
        is_synthetic_benchmark: false,
        split_boundaries: {
          train_end_date: '2024-11-04',
          test_start_date: '2024-12-03',
          test_end_date: '2024-12-30',
        },
        holdout_dates: '2024-12-03 to 2024-12-30',
        series_evaluated: 250,
        total_test_observations: 7000,
        method_metrics: [
          { method: 'seasonal_naive_7d', mae: 6.03, rmse: 7.61, wape: 0.34, bias: -1.20, relative_improvement_pct: 0.0 },
          { method: 'moving_average_7d', mae: 4.50, rmse: 5.72, wape: 0.25, bias: -0.68, relative_improvement_pct: 25.32 },
          { method: 'lightgbm', mae: 7.20, rmse: 8.60, wape: 0.41, bias: -6.70, relative_improvement_pct: -19.49 },
        ],
        best_method: 'moving_average_7d',
        warnings: [],
      }

      const spy = vi.spyOn(mlClient, 'evaluateForecast').mockResolvedValueOnce(mockEvalResponse)

      const res = await request(app)
        .post('/api/v1/forecast/evaluate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ includeMlModels: true })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.series_evaluated).toBe(250)
      expect(res.body.data.method_metrics).toHaveLength(3)
      expect(res.body.data.best_method).toBe('moving_average_7d')

      spy.mockRestore()
    })
  })

  describe('GET /api/v1/forecast/models', () => {
    it('should invoke mlClient.getForecastModels and return model registry list', async () => {
      const mockModelsResponse = {
        success: true,
        active_version: 'v_20261024_163137',
        models: [
          {
            model_name: 'lightgbm',
            model_version: 'v_20261024_163137',
            created_at: '2026-10-24T16:31:37Z',
            is_active: true,
            holdout_metrics: { mae: 7.20, wape: 0.40 },
          },
        ],
      }

      const spy = vi.spyOn(mlClient, 'getForecastModels').mockResolvedValueOnce(mockModelsResponse)

      const res = await request(app)
        .get('/api/v1/forecast/models')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.active_version).toBe('v_20261024_163137')
      expect(res.body.data.models).toHaveLength(1)

      spy.mockRestore()
    })
  })
})
