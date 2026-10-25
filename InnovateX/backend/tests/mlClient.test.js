import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MlClient, MlServiceError } from '../src/integrations/mlClient.js'

describe('ML Service Client Integration', () => {
  let client

  beforeEach(() => {
    client = new MlClient({
      baseUrl: 'http://127.0.0.1:8000',
      timeoutMs: 1000,
    })
    vi.restoreAllMocks()
  })

  it('should initialize with provided options', () => {
    expect(client.baseUrl).toBe('http://127.0.0.1:8000')
    expect(client.timeoutMs).toBe(1000)
  })

  it('should make GET request and parse JSON response', async () => {
    const mockHealth = {
      status: 'healthy',
      service: 'SupplyShield AI ML Service',
      version: '0.1.0',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockHealth,
    })

    const result = await client.checkHealth({ correlationId: 'test-123' })
    expect(result).toEqual(mockHealth)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-correlation-id': 'test-123',
        }),
      })
    )
  })

  it('should translate 4xx/5xx responses to MlServiceError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ detail: 'Invalid parameters provided' }),
    })

    await expect(client.request('/api/v1/forecast', { method: 'POST' })).rejects.toThrow(
      MlServiceError
    )
  })

  it('should handle network connection errors gracefully without crashing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'))

    await expect(client.checkHealth()).rejects.toThrow(
      'ML Service is unreachable: ECONNREFUSED'
    )
  })
})
