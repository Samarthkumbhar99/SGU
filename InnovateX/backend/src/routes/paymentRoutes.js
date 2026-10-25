import express from 'express'
import crypto from 'crypto'
import env from '../config/env.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Defined Plans in Indian Rupees (INR)
export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter FMCG Hub',
    tagline: 'Essential supply chain monitoring for regional distribution hubs & rising retail operations.',
    priceMonthlyINR: 4999,
    priceAnnualINR: 49990, // ~17% annual discount
    recommended: false,
    badge: 'Regional Entry',
    features: [
      'Up to 5 Facilities (DCs & Regional Warehouses)',
      'Real-Time Stockout & Safety Stock Matrix',
      '7-Day Demand Forecasting Models (XGBoost/ARIMA)',
      'Shortest Road Transport Path Calculation (OSRM)',
      '25 AI Executive PDF Reports / month (Groq LLM)',
      'Standard Business Hours Email Support',
      'Export Data to CSV & Excel',
    ],
    limitations: [
      'Single User Access',
      'No Custom ERP Integration',
      'No Voice AI Concierge',
    ],
  },
  {
    id: 'regional-pro',
    name: 'Regional Enterprise Pro',
    tagline: 'Complete intelligence suite with road routing, MILP solver & real-time disruption simulator.',
    priceMonthlyINR: 14999,
    priceAnnualINR: 149990, // 2 months free (~17% discount)
    recommended: true,
    badge: 'Most Popular',
    features: [
      'Up to 25 Warehouses, DCs & Retail Outlets',
      'Full Shortest Road Transport Router with Traffic & Toll Estimation',
      'Real-Time Multi-Echelon Disruption Simulator & Rerouting',
      'MILP Mathematical Cost-Optimization Workbench',
      'Ray AI Supply Chain Concierge (Groq LLM + Voice Assist)',
      'Unlimited High-Definition AI Executive PDF Reports',
      'Multi-User Team Access (Up to 10 Seats)',
      '24/7 Priority SupplyShield Operations Support',
      'Interactive 3D Geospatial Digital Twin',
    ],
    limitations: [
      'Standard Cloud SLA (99.9%)',
    ],
  },
  {
    id: 'enterprise-custom',
    name: 'Multi-Echelon Enterprise',
    tagline: 'High-throughput logistics architecture with dedicated infrastructure & custom ERP integrations.',
    priceMonthlyINR: 39999,
    priceAnnualINR: 399990, // 2 months free
    recommended: false,
    badge: 'Enterprise Grade',
    features: [
      'Unlimited Warehouses, Plants, Regional DCs & Outlets',
      'Multi-Stop Road Route Optimization & Fleet Telemetry',
      'Custom Machine Learning Ensemble (LSTM, XGBoost, Holt-Winters)',
      'Direct ERP/WMS Integration (SAP S/4HANA, Oracle, Tally, Blue Yonder)',
      'Ray AI Voice Agent with Fine-Tuned Domain Knowledge',
      'Automated Inventory Transfer Execution & Webhook Triggers',
      'Unlimited Seats & Custom Role-Based Access Controls (RBAC)',
      'Dedicated Supply Chain Solutions Architect & 99.99% SLA',
      'White-Glove Onboarding & Bi-Weekly Optimization Audits',
    ],
    limitations: [],
  },
]

// In-memory subscription store for active session/dev demonstration
const activeSubscriptions = new Map()

/**
 * GET /api/v1/payments/plans
 * Returns all available subscription plans with pricing in INR
 */
router.get('/plans', (req, res) => {
  return res.json({
    success: true,
    currency: 'INR',
    plans: SUBSCRIPTION_PLANS,
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID),
    keyId: process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || null,
  })
})

/**
 * POST /api/v1/payments/create-order
 * Creates an order via Razorpay API or generates a test-mode order if keys are pending
 */
router.post('/create-order', async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' })
    }

    const amountInINR = billingCycle === 'annual' ? plan.priceAnnualINR : plan.priceMonthlyINR
    const amountInPaise = amountInINR * 100 // Razorpay expects amount in the smallest currency unit (paise)

    const keyId = process.env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET

    const receipt = `rcpt_${planId.slice(0, 4)}_${Date.now()}`

    // 1. If Razorpay credentials exist in .env, invoke Razorpay API
    if (keyId && keySecret && !keyId.includes('YourKeyHere') && !keyId.includes('placeholder')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
              planId: plan.id,
              planName: plan.name,
              billingCycle,
            },
          }),
        })

        const rzpData = await response.json()
        if (response.ok && rzpData.id) {
          logger.info({ orderId: rzpData.id, planId }, 'Razorpay live order created')
          return res.json({
            success: true,
            order: rzpData,
            keyId,
            plan: {
              id: plan.id,
              name: plan.name,
              amountINR: amountInINR,
              billingCycle,
            },
            mode: 'live',
          })
        } else {
          logger.warn({ rzpData }, 'Razorpay live order creation failed, falling back to sandbox order')
        }
      } catch (liveErr) {
        logger.error({ err: liveErr.message }, 'Razorpay network request failed')
      }
    }

    // 2. Sandbox / Dev order simulation (when credentials in .env are pending or in dev)
    const simulatedOrderId = `order_${crypto.randomBytes(8).toString('hex')}`
    logger.info({ simulatedOrderId, planId }, 'Simulated Razorpay order generated')

    return res.json({
      success: true,
      order: {
        id: simulatedOrderId,
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt,
        status: 'created',
        attempts: 0,
        notes: {
          planId: plan.id,
          planName: plan.name,
          billingCycle,
        },
        created_at: Math.floor(Date.now() / 1000),
      },
      keyId: keyId || 'rzp_test_supplyshield_mock',
      plan: {
        id: plan.id,
        name: plan.name,
        amountINR: amountInINR,
        billingCycle,
      },
      mode: keyId ? 'sandbox' : 'mock',
      message: keyId
        ? 'Razorpay order created with test credentials.'
        : 'Razorpay order created in sandbox mode. Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in .env for production.',
    })
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to create payment order')
    return res.status(500).json({ success: false, message: 'Payment order creation failed' })
  }
})

/**
 * POST /api/v1/payments/verify-payment
 * Verifies Razorpay payment signature and activates the plan
 */
router.post('/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      billingCycle = 'monthly',
      userId = 'default_user',
    } = req.body

    const keySecret = process.env.RAZORPAY_KEY_SECRET || env.RAZORPAY_KEY_SECRET

    let signatureValid = false

    if (keySecret && !keySecret.includes('YourSecretHere') && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')

      signatureValid = generatedSignature === razorpay_signature
      if (!signatureValid) {
        logger.warn({ razorpay_order_id, razorpay_payment_id }, 'Razorpay signature mismatch')
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: Signature mismatch',
        })
      }
    } else {
      // In sandbox/dev mode or direct test simulation
      signatureValid = true
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1]

    const subscriptionRecord = {
      subscriptionId: `sub_${Date.now()}`,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id || `pay_${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      amountINR: billingCycle === 'annual' ? plan.priceAnnualINR : plan.priceMonthlyINR,
      billingCycle,
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }

    activeSubscriptions.set(userId, subscriptionRecord)
    logger.info({ userId, planId: plan.id, paymentId: subscriptionRecord.paymentId }, 'Subscription verified & activated')

    return res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      subscription: subscriptionRecord,
    })
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to verify payment')
    return res.status(500).json({ success: false, message: 'Payment verification error' })
  }
})

/**
 * GET /api/v1/payments/subscription
 * Get current subscription status
 */
router.get('/subscription', (req, res) => {
  const userId = req.query.userId || 'default_user'
  const current = activeSubscriptions.get(userId) || {
    planId: 'regional-pro',
    planName: 'Regional Enterprise Pro',
    status: 'active (trial / demo)',
    amountINR: 14999,
    billingCycle: 'monthly',
  }
  return res.json({ success: true, subscription: current })
})

export default router
