# SupplyShield AI — System Architecture

## 1. Overview
SupplyShield AI is an adaptive distribution intelligence and inventory optimization platform designed for FMCG supply chain resilience. It combines client-facing REST APIs and workflow management with deterministic mathematical optimization (Google OR-Tools MILP) and machine learning forecasting.

```mermaid
flowchart TD
    subgraph Client Tier
        UI[React / Vite Frontend]
    end

    subgraph Application Tier [Express.js Backend - Port 5000]
        Router[REST API Router]
        Auth[JWT & OAuth Security]
        Validation[Zod Validation Layer]
        Orchestration[Workflow Orchestrator]
        MLClient[FastAPI Integration Client]
        Logger[Pino Structured Logger]
    end

    subgraph Data Tier
        Mongo[(MongoDB Atlas / In-Memory Mock)]
    end

    subgraph Compute Tier [FastAPI ML Service - Port 8000]
        Health[Health & Readiness Probes]
        Validator[Schema & Relational Integrity]
        Forecasting[Demand Forecasting Engine]
        Optimizer[Google OR-Tools CP-SAT Solver]
        Scenario[Disruption Sandbox & Simulation]
    end

    UI -->|HTTP / JSON /api/v1| Router
    Router --> Auth
    Router --> Validation
    Validation --> Orchestration
    Orchestration -->|Mongoose ODM| Mongo
    Orchestration -->|Internal HTTP / Correlation ID| MLClient
    MLClient -->|HTTP / Port 8000| Compute Tier
```

## 2. Component Boundaries & Responsibilities

### Node.js / Express Backend (`InnovateX/backend`)
- **Client-Facing REST APIs**: Serves all authenticated and public frontend traffic.
- **Authentication & Authorization**: Issues and verifies JSON Web Tokens (JWT) with optional HttpOnly cookie support and Google OAuth 2.0.
- **Data Persistence**: MongoDB persistence via Mongoose schemas for users, audit logs, scenarios, and plans. Includes seamless offline in-memory fallback for local dev.
- **Input Validation**: Strict request payload schema validation using Zod.
- **Workflow Orchestration**: Manages optimization run lifecycle, approval workflows, and audit history.
- **ML Integration**: `MlClient` safely communicates with the Python ML service with deterministic timeouts, correlation tracking, and safe error normalization.
- **Observability**: Structured, redacted logging via Pino (`pino-http`).
- **Security**: Rate limiting via `express-rate-limit`, CSP & secure headers via `helmet`, explicit CORS controls.

### Python / FastAPI ML Service (`ml-service`)
- **Demand Forecasting**: Classical and baseline time-series forecasting (Seasonal Naive, Moving Averages, Historical Average).
- **Forecast Evaluation**: Backtesting with holdout splits and metric calculations (MAE, RMSE, WAPE, Bias).
- **Distribution Optimization**: Deterministic multi-echelon warehouse-to-store stock allocation solved with Google OR-Tools CP-SAT.
- **Disruption Simulation**: Scenario evaluation modeling lane closures, warehouse shutdowns, and demand surges with delta calculations against baselines.
- **Strict Boundary**: No numerical optimization is delegated to LLMs. All optimization adheres to verifiable mathematical constraints.

## 3. Communication Contract
- The frontend interacts exclusively with the Express backend (`/api/v1/*`).
- Express invokes the FastAPI service internally (`http://127.0.0.1:8000`).
- Every cross-service request carries `x-correlation-id` for distributed tracing without exposing secrets.
