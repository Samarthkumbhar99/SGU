import express from 'express'
import {
  predictForecast,
  trainForecast,
  evaluateForecast,
  getForecastModels,
} from '../controllers/forecastController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Forecasting endpoints
router.post('/forecast/predict', protect, predictForecast)
router.post('/forecast', protect, predictForecast) // alias
router.post('/forecast/train', protect, trainForecast)
router.post('/forecast/evaluate', protect, evaluateForecast)
router.get('/forecast/models', protect, getForecastModels)

export default router
