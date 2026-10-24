import env from '../config/env.js'
import logger from '../utils/logger.js'
import { randomUUID } from 'crypto'

/**
 * Standard ML Service Client Error
 */
export class MlServiceError extends Error {
  constructor(message, statusCode = 502, details = null) {
    super(message)
    this.name = 'MlServiceError'
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * Reusable HTTP client for communicating with the FastAPI ML Service
 */
export class MlClient {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs || env.REQUEST_TIMEOUT_MS || 10000
  }

  /**
   * Internal request wrapper with timeout, correlation ID, and safe error normalization
   */
  async request(path, options = {}) {
    const correlationId = options.correlationId || randomUUID()
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    const timeout = options.timeoutMs || this.timeoutMs

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-correlation-id': correlationId,
      'x-request-id': correlationId,
      ...(options.headers || {}),
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timer)

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await response.json() : await response.text()

      if (!response.ok) {
        const errorMsg =
          typeof data === 'object' && data?.message
            ? data.message
            : typeof data === 'object' && data?.detail
            ? typeof data.detail === 'string'
              ? data.detail
              : JSON.stringify(data.detail)
            : `ML service request failed with HTTP ${response.status}`

        throw new MlServiceError(errorMsg, response.status >= 500 ? 502 : response.status, data)
      }

      return data
    } catch (err) {
      clearTimeout(timer)

      if (err.name === 'AbortError') {
        logger.error({ correlationId, url, timeout }, 'ML Service request timed out')
        throw new MlServiceError(`ML Service request timed out after ${timeout}ms`, 504)
      }

      if (err instanceof MlServiceError) {
        throw err
      }

      logger.error({ correlationId, url, err: err.message }, 'Failed to communicate with ML Service')
      throw new MlServiceError(`ML Service is unreachable: ${err.message}`, 503)
    }
  }

  /**
   * Liveness health check
   */
  async checkHealth(options = {}) {
    return this.request('/health', { method: 'GET', ...options })
  }

  /**
   * Readiness health check
   */
  async checkReadiness(options = {}) {
    return this.request('/health/ready', { method: 'GET', ...options })
  }

  /**
   * Validate dataset
   */
  async validateData(options = {}) {
    return this.request('/api/v1/data/validate', { method: 'GET', ...options })
  }

  /**
   * Request demand forecast (predict)
   */
  async forecast(payload, options = {}) {
    return this.predictForecast(payload, options)
  }

  /**
   * Request demand forecast prediction
   */
  async predictForecast(payload, options = {}) {
    return this.request('/api/v1/forecast/predict', {
      method: 'POST',
      body: payload,
      ...options,
    })
  }

  /**
   * Trigger model training
   */
  async trainForecast(payload = {}, options = {}) {
    return this.request('/api/v1/forecast/train', {
      method: 'POST',
      body: payload,
      timeoutMs: options.timeoutMs || 120000,
      ...options,
    })
  }

  /**
   * Run holdout backtest evaluation
   */
  async evaluateForecast(payload = {}, options = {}) {
    return this.request('/api/v1/forecast/evaluate', {
      method: 'POST',
      body: payload,
      timeoutMs: options.timeoutMs || 60000,
      ...options,
    })
  }

  /**
   * List registered forecaster models
   */
  async getForecastModels(options = {}) {
    return this.request('/api/v1/forecast/models', {
      method: 'GET',
      ...options,
    })
  }

  /**
   * Request optimization solve
   */
  async optimize(payload, options = {}) {
    return this.request('/api/v1/optimize', {
      method: 'POST',
      body: payload,
      ...options,
    })
  }

  /**
   * Run scenario simulation
   */
  async simulateScenario(payload, options = {}) {
    return this.request('/api/v1/scenario/simulate', {
      method: 'POST',
      body: payload,
      ...options,
    })
  }
}

export const mlClient = new MlClient()
export default mlClient
