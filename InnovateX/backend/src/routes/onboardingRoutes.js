const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { chatWithRay, completeOnboarding } = require('../controllers/onboardingController')

// Protect onboarding routes
router.use(protect)

router.post('/chat', chatWithRay)
router.post('/complete', completeOnboarding)

module.exports = router
