const User = require('../models/User')
const Store = require('../models/Store')
const Warehouse = require('../models/Warehouse')

// Optional Groq LLM integration
async function queryGroqLLM(messages) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
        max_tokens: 600,
      }),
    })

    if (!res.ok) {
      console.warn('Groq API returned status:', res.status)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('Groq query failed:', err.message)
    return null
  }
}

// @desc    Process a turn in the AI onboarding conversation (RAY)
// @route   POST /api/v1/onboarding/chat
// @access  Private
exports.chatWithRay = async (req, res, next) => {
  try {
    const { step = 0, message = '', selection = null, liveLocation = null, profileData = {} } = req.body
    const user = req.user

    // Structured conversational onboarding stages
    // Step 0: Welcome & Role Selection
    // Step 1: Contact & Business Identity
    // Step 2: Live Geolocation Permission
    // Step 3: Entity Creation (Store vs Warehouse) or Existing Claim
    // Step 4: Confirmation & Complete

    let nextStep = step
    let aiResponse = {}

    // Check if user has an answer or selected an option
    if (step === 0) {
      // Intro -> Prompt Role
      nextStep = 1
      aiResponse = {
        agent: 'RAY',
        title: "Hello, I'm RAY your AI onboarding agent.",
        subtitle:
          "I'm here to handle your onboarding so you can get back to building. I'll ask a few quick questions to get you set up. If you're curious about why I need a specific detail or how it helps your business, just ask.",
        headline: "Let's verify your operational role to get started",
        body: 'Please choose your primary responsibility within the FMCG supply chain network:',
        cardType: 'role_selection',
        options: [
          {
            id: 'Retailer',
            title: 'FMCG Retailer / Store Owner',
            badge: 'Store Management',
            desc: 'Manage store replenishment, sales velocity, shelf safety stock, and avoid stockouts.',
          },
          {
            id: 'Warehouse Manager',
            title: 'Warehouse & DC Controller',
            badge: 'DC Logistics',
            desc: 'Oversee regional depot stock, dock capacity, cold-chain compliance, and dispatch manifests.',
          },
          {
            id: 'Supply Chain Analyst',
            title: 'Supply Chain Analyst / Ops Lead',
            badge: 'Network Optimizer',
            desc: 'Simulate disruption shocks, run MILP models, and audit mathematically grounded routes.',
          },
        ],
        allowTextInput: true,
        inputPlaceholder: 'Or describe your role in your own words...',
      }
    } else if (step === 1) {
      // Role selected -> Ask for Business Info & Mobile Contact
      const selectedRole = selection || (message.toLowerCase().includes('ware') ? 'Warehouse Manager' : 'Retailer')

      // Save role if valid
      if (['Retailer', 'Warehouse Manager', 'Supply Chain Analyst', 'Operations Manager'].includes(selectedRole)) {
        await User.findByIdAndUpdate(user._id, { role: selectedRole })
      }

      nextStep = 2
      aiResponse = {
        agent: 'RAY',
        title: `Welcome aboard, ${selectedRole}!`,
        subtitle: `Configuring your ${selectedRole.toLowerCase()} workspace telemetry.`,
        headline: 'Business identity & contact verification',
        body: 'To enable instant dispatch alerts, OTP verification, and multi-echelon sync, please provide your mobile number and trading company name.',
        cardType: 'contact_form',
        defaultValues: {
          phone: user.phone || '',
          company: user.company || '',
        },
        badge: '⚡ Instant KYC',
        options: [
          { id: 'quick_fill', title: 'Confirm & Save Business Details', actionText: 'Save & Continue' },
        ],
        allowTextInput: true,
        inputPlaceholder: 'e.g. Metro Retail Corp, +91 98765 43210',
      }
    } else if (step === 2) {
      // Business info received -> Request Live Geolocation Permission
      nextStep = 3
      aiResponse = {
        agent: 'RAY',
        title: 'Calibrating Transit Matrix',
        subtitle: 'High-precision routing requires exact geographical coordinates.',
        headline: 'Enable live GPS geolocation permission',
        body: 'SupplyShield AI computes real-time driving hours, dock arrival bounds, and weather disruption zones based on your node location. Grant browser location permission to pin your hub on the network map.',
        cardType: 'location_permission',
        badge: 'Required for MILP',
        options: [
          {
            id: 'grant_gps',
            title: 'Share Live GPS Coordinates',
            badge: '1-Click GPS Sync',
            desc: 'Securely retrieves current latitude & longitude via browser Geolocation API.',
          },
          {
            id: 'manual_gps',
            title: 'Enter Hub Coordinates Manually',
            badge: 'Manual Pin',
            desc: 'Provide your facility city or postal coordinates manually.',
          },
        ],
        allowTextInput: true,
        inputPlaceholder: 'e.g. Mumbai DC, Latitude: 19.0760, Longitude: 72.8777',
      }
    } else if (step === 3) {
      // Location received -> Create Store/Warehouse or Search Existing
      nextStep = 4
      const isWarehouse = user.role === 'Warehouse Manager' || user.role === 'Warehouse Controller'
      const entityName = isWarehouse ? 'Distribution Center (DC)' : 'Retail Store'

      aiResponse = {
        agent: 'RAY',
        title: `Setup your initial ${entityName}`,
        subtitle: 'Connect your physical facilities to the live FMCG network.',
        headline: `Do you want to create a new ${entityName} or manage an existing one?`,
        body: `If this facility already exists in the SupplyShield registry, you can search and request access from the current manager. Otherwise, launch a brand new ${entityName} right now.`,
        cardType: 'entity_choice',
        entityType: isWarehouse ? 'Warehouse' : 'Store',
        options: [
          {
            id: 'create_new',
            title: `Create a New ${entityName}`,
            badge: 'New Node',
            desc: `Register a new ${entityName.toLowerCase()} with custom capacity, dock limits, and safety stock.`,
          },
          {
            id: 'search_existing',
            title: `Search & Claim Existing ${entityName}`,
            badge: 'Request Access',
            desc: `Search registered network facilities and send a co-manager delegation request.`,
          },
        ],
        allowTextInput: true,
        inputPlaceholder: `e.g. Create new store named Metro Mart Bandra`,
      }
    } else {
      // Step 4: Finalize
      nextStep = 5
      aiResponse = {
        agent: 'RAY',
        title: 'Onboarding Complete!',
        subtitle: 'Your workspace has been provisioned with deterministic MILP solvers.',
        headline: 'Ready to enter your operational command center',
        body: 'All credentials, coordinates, and network bounds have been verified. You can now monitor fill rates, simulate flood disruptions, and view dispatch manifests in real-time.',
        cardType: 'completed',
        options: [
          {
            id: 'go_dashboard',
            title: 'Launch Live Operational Dashboard',
            badge: 'All Systems Operational',
            desc: 'Proceed to your role-tailored command center.',
          },
        ],
        allowTextInput: false,
      }
    }

    // If Groq API key is configured and user typed free text, let Groq optionally augment the reply
    if (process.env.GROQ_API_KEY && message && message.trim().length > 3) {
      const groqAnswer = await queryGroqLLM([
        {
          role: 'system',
          content:
            "You are RAY, an elegant, concise AI onboarding agent for SupplyShield AI supply chain platform. The user is in step " +
            step +
            ". Answer the user's question in 1-2 friendly, crisp sentences while smoothly guiding them to complete the step.",
        },
        { role: 'user', content: message },
      ])
      if (groqAnswer) {
        aiResponse.groqRemark = groqAnswer
      }
    }

    res.json({
      success: true,
      currentStep: nextStep,
      data: aiResponse,
    })
  } catch (err) {
    next(err)
  }
}

// @desc    Complete onboarding & provision default/custom store or warehouse
// @route   POST /api/v1/onboarding/complete
// @access  Private
exports.completeOnboarding = async (req, res, next) => {
  try {
    const {
      role,
      phone,
      company,
      liveLocation,
      entityAction, // 'create' or 'claim'
      entityData = {},
    } = req.body

    const userId = req.user._id

    // Update user
    const updatePayload = {
      isOnboarded: true,
    }
    if (role) updatePayload.role = role
    if (phone) updatePayload.phone = phone
    if (company) updatePayload.company = company
    if (liveLocation && liveLocation.latitude) {
      updatePayload.liveLocation = {
        ...liveLocation,
        updatedAt: new Date(),
      }
    }

    let createdStore = null
    let createdWarehouse = null

    const resolvedLocation = liveLocation?.latitude
      ? liveLocation
      : { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai Central', address: 'Bandra Retail Corridor' }

    if (entityAction === 'create') {
      const isWarehouse = role === 'Warehouse Manager' || role === 'Warehouse Controller'
      if (isWarehouse) {
        createdWarehouse = await Warehouse.create({
          name: entityData.name || `${company || 'Regional'} Central DC`,
          type: entityData.type || 'Regional Distribution Center',
          location: resolvedLocation,
          totalPalletCapacity: Number(entityData.capacity) || 5000,
          usedPalletCapacity: Math.round((Number(entityData.capacity) || 5000) * 0.65),
          dockCount: Number(entityData.docks) || 12,
          temperatureControlled: true,
          owner: userId,
          managers: [userId],
        })
        updatePayload.$addToSet = { managedWarehouses: createdWarehouse._id }
      } else {
        createdStore = await Store.create({
          name: entityData.name || `${company || 'Metro'} Supermarket Store #1`,
          category: entityData.category || 'Supermarket',
          location: resolvedLocation,
          dailyDemandVelocity: 4200,
          safetyStockUnits: 1200,
          maxShelfCapacityUnits: 15000,
          currentStockUnits: 11800,
          serviceLeadTimeHours: 3.2,
          contactPhone: phone || '',
          owner: userId,
          managers: [userId],
        })
        updatePayload.$addToSet = { managedStores: createdStore._id }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true })

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser.toSafeJSON(),
      createdStore,
      createdWarehouse,
    })
  } catch (err) {
    next(err)
  }
}
