import express from 'express'
import { protect } from '../middleware/auth.js'
import { chatWithRay, completeOnboarding } from '../controllers/onboardingController.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

router.post('/chat', chatWithRay)
router.post('/complete', completeOnboarding)

export default router
