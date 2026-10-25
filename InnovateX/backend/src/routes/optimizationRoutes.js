import express from 'express'
import {
  solveOptimization,
  simulateOptimization,
  getOptimizationRuns,
  getOptimizationRunById,
} from '../controllers/optimizationController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Phase 4 Distribution Optimization & Simulation endpoints
router.post('/optimization/solve', protect, solveOptimization)
router.post('/optimize', protect, solveOptimization) // compatibility alias

router.post('/optimization/simulate', protect, simulateOptimization)
router.post('/scenario/simulate', protect, simulateOptimization) // compatibility alias

router.get('/optimization/runs', protect, getOptimizationRuns)
router.get('/optimization/runs/:runId', protect, getOptimizationRunById)

export default router
