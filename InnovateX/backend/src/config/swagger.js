import swaggerUi from 'swagger-ui-express'

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SupplyShield AI — Backend API',
    version: '1.0.0',
    description:
      'Production-minded REST API for SupplyShield AI: Distribution Intelligence and Inventory Optimization Platform.',
    contact: {
      name: 'InnovateX Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT token to authenticate',
      },
    },
    schemas: {
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 50 },
          totalPages: { type: 'integer', example: 3 },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'supplyshield-backend' },
          version: { type: 'string', example: '1.0.0' },
          uptimeSeconds: { type: 'integer', example: 120 },
          timestamp: { type: 'string', format: 'date-time' },
          environment: { type: 'string', example: 'development' },
        },
      },
      DependencyHealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status: { type: 'string', example: 'ready' },
          service: { type: 'string', example: 'supplyshield-backend' },
          dependencies: {
            type: 'object',
            properties: {
              mongodb: {
                type: 'object',
                properties: {
                  connected: { type: 'boolean' },
                  status: { type: 'string' },
                  mode: { type: 'string' },
                },
              },
              mlService: {
                type: 'object',
                properties: {
                  connected: { type: 'boolean' },
                  status: { type: 'string' },
                  latencyMs: { type: 'number' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          skuId: { type: 'string', example: 'SKU_1' },
          productName: { type: 'string', example: 'Product SKU_1' },
          category: { type: 'string', example: 'General FMCG' },
          unitCost: { type: 'number', example: 13.95 },
          unitPrice: { type: 'number', example: 20.48 },
          supplierId: { type: 'string', example: 'SUP_8' },
          leadTimeDays: { type: 'number', example: 14 },
          reorderPoint: { type: 'number', example: 379 },
        },
      },
      Warehouse: {
        type: 'object',
        properties: {
          warehouseId: { type: 'string', example: 'WH_1' },
          warehouseName: { type: 'string', example: 'Warehouse WH_1' },
          regionsServed: { type: 'array', items: { type: 'string' }, example: ['West', 'North', 'South', 'East'] },
          storageCapacityUnits: { type: 'number', example: 15000 },
        },
      },
      Supplier: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', example: 'SUP_8' },
          supplierName: { type: 'string', example: 'Supplier SUP_8' },
          defaultLeadTimeDays: { type: 'number', example: 14 },
          regions: { type: 'array', items: { type: 'string' } },
        },
      },
      InventoryItem: {
        type: 'object',
        properties: {
          skuId: { type: 'string', example: 'SKU_1' },
          warehouseId: { type: 'string', example: 'WH_1' },
          inventoryLevel: { type: 'number', example: 410 },
          reorderPoint: { type: 'number', example: 379 },
          orderQuantity: { type: 'number', example: 0 },
          unitCost: { type: 'number', example: 13.95 },
          unitPrice: { type: 'number', example: 20.48 },
          isLowStock: { type: 'boolean', example: false },
        },
      },
      DemandHistoryRecord: {
        type: 'object',
        properties: {
          dateString: { type: 'string', example: '2024-01-01' },
          skuId: { type: 'string', example: 'SKU_1' },
          warehouseId: { type: 'string', example: 'WH_1' },
          region: { type: 'string', example: 'West' },
          unitsSold: { type: 'number', example: 10 },
          inventoryLevel: { type: 'number', example: 592 },
          demandForecast: { type: 'number', example: 8.52 },
          promotionFlag: { type: 'integer', example: 0 },
          stockoutFlag: { type: 'integer', example: 0 },
        },
      },
      DataQualitySummary: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              datasetStatus: { type: 'string', example: 'ingested' },
              recordCounts: { type: 'object' },
              dataIntegrity: { type: 'object' },
              lastImportRun: { type: 'object' },
            },
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
          user: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description' },
        },
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Liveness probe',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Backend is healthy and operational',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
        },
      },
    },
    '/api/v1/health/dependencies': {
      get: {
        summary: 'Dependency readiness probe',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Health of MongoDB and ML Service',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DependencyHealthResponse' } } },
          },
        },
      },
    },
    '/api/v1/auth/signup': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        responses: { 201: { description: 'User registered successfully' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/api/v1/products': {
      get: {
        summary: 'Get paginated product catalog',
        tags: ['Master Data'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Product list' },
        },
      },
    },
    '/api/v1/warehouses': {
      get: {
        summary: 'Get paginated warehouse list',
        tags: ['Master Data'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Warehouse list' },
        },
      },
    },
    '/api/v1/stores': {
      get: {
        summary: 'Get retail stores (optional)',
        tags: ['Master Data'],
        responses: {
          200: { description: 'Store list' },
        },
      },
    },
    '/api/v1/suppliers': {
      get: {
        summary: 'Get suppliers catalog',
        tags: ['Master Data'],
        parameters: [
          { name: 'supplierId', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Supplier list' },
        },
      },
    },
    '/api/v1/inventory': {
      get: {
        summary: 'Get current inventory snapshot',
        tags: ['Operational Data'],
        parameters: [
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'lowStock', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Inventory list' },
        },
      },
    },
    '/api/v1/demand/history': {
      get: {
        summary: 'Get historical daily demand observations',
        tags: ['Operational Data'],
        parameters: [
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', example: '2024-01-01' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', example: '2024-12-30' } },
          { name: 'promotionOnly', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Demand history series' },
        },
      },
    },
    '/api/v1/data-quality/summary': {
      get: {
        summary: 'Inspect dataset quality, missing data vs zero values, and import audit metrics',
        tags: ['Data Engineering'],
        responses: {
          200: {
            description: 'Comprehensive data quality summary',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DataQualitySummary' } } },
          },
        },
      },
    },
    '/api/v1/data-imports': {
      get: {
        summary: 'Audit log of CSV dataset ingestion runs',
        tags: ['Data Engineering'],
        responses: {
          200: { description: 'List of import runs' },
        },
      },
    },
    '/api/v1/data-imports/trigger': {
      post: {
        summary: 'Trigger CSV data ingestion or dry-run validation',
        tags: ['Data Engineering'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  dryRun: { type: 'boolean', default: false },
                  filePath: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Ingestion initiated or completed' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/api/v1/analytics/overview': {
      get: {
        summary: 'Network-wide inventory health and demand overview KPIs',
        tags: ['Analytics'],
        parameters: [
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Overview KPI summary' },
        },
      },
    },
    '/api/v1/analytics/inventory': {
      get: {
        summary: 'Item-by-item inventory intelligence, valuation, and days of supply',
        tags: ['Analytics'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'lowStock', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: { description: 'Inventory analytics positions' },
        },
      },
    },
    '/api/v1/analytics/demand': {
      get: {
        summary: 'Demand trend aggregation, volatility metrics (stdDev, CV), and promotion comparison',
        tags: ['Analytics'],
        parameters: [
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'region', in: 'query', schema: { type: 'string' } },
          { name: 'granularity', in: 'query', schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string' } },
          { name: 'endDate', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Aggregated demand series' },
        },
      },
    },
    '/api/v1/analytics/suppliers': {
      get: {
        summary: 'Supplier lead-time summaries and inventory exposure',
        tags: ['Analytics'],
        responses: {
          200: { description: 'Supplier analytics profiles' },
        },
      },
    },
    '/api/v1/recommendations': {
      get: {
        summary: 'Deterministic rule-based replenishment and risk recommendations',
        tags: ['Recommendations'],
        parameters: [
          { name: 'warehouseId', in: 'query', schema: { type: 'string' } },
          { name: 'skuId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Prioritized recommendations list' },
        },
      },
    },
  },
}

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
}

export default setupSwagger
