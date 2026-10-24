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
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              company: { type: 'string' },
            },
          },
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
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
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
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DependencyHealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/signup': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Vikram Malhotra' },
                  email: { type: 'string', example: 'vikram@supplyshield.io' },
                  password: { type: 'string', example: 'Password123' },
                  company: { type: 'string', example: 'InnovateX' },
                  role: { type: 'string', example: 'Distribution Manager' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'vikram@supplyshield.io' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/v1/dashboard/summary': {
      get: {
        summary: 'Retrieve distribution network summary KPIs',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Aggregated KPI metrics',
          },
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
