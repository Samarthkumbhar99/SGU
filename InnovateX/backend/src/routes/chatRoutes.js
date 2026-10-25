import { Router } from 'express'
import logger from '../utils/logger.js'

const router = Router()

// SupplyShield Project Knowledge Context for Groq LLM
const SYSTEM_PROMPT = `You are the SupplyShield AI Concierge, a highly knowledgeable, professional, and friendly sales and operations consultant for SupplyShield AI.

SupplyShield AI is an AI-native distribution intelligence and multi-echelon supply-chain optimization platform designed for high-velocity regional FMCG and perishable distribution networks.

Key Core Capabilities of SupplyShield AI:
1. Deterministic Optimization with Google OR-Tools MILP:
   - Uses Mixed-Integer Linear Programming (MILP) to eliminate phantom inventory and enforce flow conservation constraints.
   - Solves full regional network instances (3-5 regional distribution centers, 10-50 retail stores, hundreds of SKU batches) in ≤ 2.8 seconds.
   - Re-routes freight dynamically around highway disruptions (e.g. Western Corridor NH-48 closures).

2. Dynamic FEFO (First-Expired, First-Out) Spoilage Defense:
   - Pairs warehouse batch expiration dates with retail store sales velocity and transit lead times.
   - Automatically prioritizes routing expiring perishables to high-velocity metropolitan retail stores (e.g. Store S-04 in Colaba, Mumbai) so items sell before spoiling.
   - Reduces food waste and unsaleable product returns by up to 43%.

3. Regional Distribution Infrastructure:
   - Primary DCs: Bhiwandi Central DC (WH-MUM-01, 24,000 sq ft ambient + cold-chain), Pune Metro Hub (WH-PUN-02, 18,500 sq ft cross-docking), Nagpur Cold-Chain Center (WH-NAG-03, 12,000 sq ft deep-freeze).
   - Retail Network: 12 connected supermarkets across Mumbai, Pune, Thane, and Navi Mumbai.
   - Monitored SKUs: High-velocity perishable FMCG including SKU-MILK-001 (Pasteurized Toned Milk 1L), SKU-BUTTER-002, SKU-PANEER-003, and SKU-YOGURT-004.

4. AI Demand Forecasting Studio:
   - LightGBM gradient-boosted decision trees and statistical time-series models predicting 7-day demand with 94.2% historical accuracy, accounting for weather and promotional spikes.

5. Ray AI Onboarding Concierge:
   - Automated conversational agent that allows fast onboarding and digital-twin setup of new warehouses, retail stores, and transport lanes.

Guidelines for your answers:
- Be concise, engaging, and professional (2-4 brief paragraphs max).
- Ground your answers in SupplyShield AI's actual features (Google OR-Tools, Dynamic FEFO, 2.8s solve time, multi-echelon network).
- Always include 2 to 3 relevant suggested follow-up options in your response in JSON format.
- Output your response strictly as JSON with the following structure:
{
  "reply": "Your clear, helpful message here.",
  "suggestedOptions": ["Suggested Question 1", "Suggested Question 2", "Suggested Question 3"]
}`

// Fallback canned responses if Groq API key is unavailable or rate-limited
const FALLBACK_RESPONSES = [
  {
    pattern: /fefo|waste|spoilage|expiry/i,
    reply: "Dynamic FEFO (First-Expired, First-Out) synchronizes batch shelf-life directly with store sales velocities. If dairy or perishable batches are approaching their expiry date, SupplyShield automatically routes them to high-velocity metropolitan stores like Colaba Store S-04, cutting unsaleable food waste by up to 43%.",
    suggestedOptions: ["How does Google OR-Tools MILP work?", "What distribution centers are supported?", "How fast does it re-plan during disruptions?"]
  },
  {
    pattern: /or-tools|milp|solver|math|algorithm/i,
    reply: "Unlike probabilistic schedulers, SupplyShield enforces deterministic Google OR-Tools Mixed-Integer Linear Programming (MILP). It guarantees that loading dock limits, vehicle capacity, and flow conservation constraints are mathematically satisfied within ≤ 2.8 seconds.",
    suggestedOptions: ["Tell me about Dynamic FEFO", "How does highway re-routing work?", "Can I see the 3D Network Map?"]
  },
  {
    pattern: /warehouse|dc|bhiwandi|pune|nagpur|store/i,
    reply: "SupplyShield currently coordinates the Western Regional Cluster: Bhiwandi Central DC (WH-MUM-01, ambient & cold-chain), Pune Metro Hub (WH-PUN-02, cross-docking), Nagpur Cold Storage (WH-NAG-03, deep freeze), and 12 high-velocity retail supermarkets.",
    suggestedOptions: ["How do I onboard a new facility?", "Explain Dynamic FEFO", "What is the ROI?"]
  },
  {
    pattern: /hello|hi|hey|greet|who are you/i,
    reply: "Hello! I'm your SupplyShield AI Sales Concierge. I help distribution operations managers explore our AI-native supply-chain planning, deterministic MILP optimization, and Dynamic FEFO waste elimination.",
    suggestedOptions: ["How does SupplyShield eliminate phantom stockouts?", "How fast does the engine re-plan?", "What ROI can we expect?"]
  }
]

// Query Groq API
async function callGroqAPI(messages) {
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
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.2,
        max_tokens: 650,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      logger.warn({ status: res.status }, 'Groq concierge API returned non-200 status')
      return null
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null

    try {
      const parsed = JSON.parse(content)
      return {
        reply: parsed.reply || content,
        suggestedOptions: Array.isArray(parsed.suggestedOptions) ? parsed.suggestedOptions : [
          'How does Dynamic FEFO work?',
          'Tell me about Google OR-Tools',
          'Simulate a disruption on NH-48'
        ]
      }
    } catch {
      return {
        reply: content,
        suggestedOptions: [
          'How does Dynamic FEFO work?',
          'Tell me about Google OR-Tools',
          'Simulate a disruption on NH-48'
        ]
      }
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Groq concierge request failed')
    return null
  }
}

// POST /api/v1/chat/concierge
router.post('/concierge', async (req, res) => {
  const { message, conversationHistory = [] } = req.body || {}

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Message string is required' })
  }

  // Format messages for LLM
  const formattedMessages = [
    ...conversationHistory.slice(-6).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text || msg.content || '',
    })),
    { role: 'user', content: message },
  ]

  // Try Groq LLM first
  const groqResult = await callGroqAPI(formattedMessages)
  if (groqResult) {
    return res.json({
      success: true,
      source: 'groq-llama-3.3-70b',
      reply: groqResult.reply,
      suggestedOptions: groqResult.suggestedOptions,
    })
  }

  // Fallback pattern matching
  for (const item of FALLBACK_RESPONSES) {
    if (item.pattern.test(message)) {
      return res.json({
        success: true,
        source: 'knowledge-engine',
        reply: item.reply,
        suggestedOptions: item.suggestedOptions,
      })
    }
  }

  // Generic fallback
  return res.json({
    success: true,
    source: 'knowledge-engine',
    reply: `SupplyShield AI coordinates distribution planning using Google OR-Tools MILP and Dynamic FEFO perishable routing. With sub-3-second solve times and zero phantom stockouts, regional hubs maintain 99.4% service levels across FMCG categories.`,
    suggestedOptions: [
      'How does Dynamic FEFO prevent food waste?',
      'Tell me about Google OR-Tools MILP solver',
      'What warehouses and retail stores are connected?'
    ]
  })
})

export default router
