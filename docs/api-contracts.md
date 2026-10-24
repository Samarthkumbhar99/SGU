# SupplyShield AI — API Contracts & Endpoints Specification

## 1. Express Backend Endpoints (`http://localhost:5000`)

### Health & Observability
- **`GET /api/v1/health`**
  - **Purpose**: Liveness probe. Verifies the Express application process is running and accepting HTTP requests.
  - **Auth**: Public
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "status": "ok",
      "service": "supplyshield-backend",
      "version": "1.0.0",
      "uptimeSeconds": 142,
      "timestamp": "2026-10-24T14:11:34.105Z",
      "environment": "development"
    }
    ```

- **`GET /api/v1/health/dependencies`**
  - **Purpose**: Readiness & dependency probe. Verifies status of MongoDB Atlas and the FastAPI ML microservice.
  - **Auth**: Public
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "status": "ready",
      "service": "supplyshield-backend",
      "timestamp": "2026-10-24T14:11:44.236Z",
      "dependencies": {
        "mongodb": {
          "connected": true,
          "status": "connected",
          "host": "cluster0.mongodb.net",
          "mode": "atlas-live"
        },
        "mlService": {
          "status": "healthy",
          "connected": true,
          "latencyMs": 33,
          "url": "http://localhost:8000",
          "details": {
            "status": "healthy",
            "service": "SupplyShield AI ML Service",
            "version": "0.1.0"
          }
        }
      }
    }
    ```

### Interactive Documentation
- **`GET /api-docs`**: Swagger UI documentation.
- **`GET /api-docs.json`**: OpenAPI 3.0 specification JSON.

### Authentication (`/api/v1/auth`)
- **`POST /api/v1/auth/signup`**: Email, password, name registration.
- **`POST /api/v1/auth/login`**: Credential authentication returning JWT.
- **`POST /api/v1/auth/google`**: Google ID token verification and account upsert.
- **`GET /api/v1/auth/me`**: Current user profile (Bearer JWT required).

---

## 2. FastAPI ML Service Endpoints (`http://127.0.0.1:8000`)

### Health & Readiness
- **`GET /health`** (and alias `/api/v1/health`)
  - **Purpose**: Liveness probe. Confirms Python FastAPI process is running.
  - **Response (200 OK)**:
    ```json
    {
      "status": "healthy",
      "service": "SupplyShield AI ML Service",
      "version": "0.1.0",
      "environment": "development",
      "components": {
        "api_server": "running",
        "forecasting_engine": "ready",
        "optimization_solver": "ready"
      }
    }
    ```

- **`GET /health/ready`** (and alias `/api/v1/health/ready`)
  - **Purpose**: Readiness probe. Validates dataset accessibility and engine readiness.
  - **Response (200 OK)**:
    ```json
    {
      "status": "ready",
      "service": "SupplyShield AI ML Service",
      "version": "0.1.0",
      "environment": "development",
      "ready": true,
      "components": {
        "api_server": "running",
        "forecasting_engine": "ready",
        "optimization_solver": "ready",
        "dataset_directory_accessible": true
      }
    }
    ```

### ML Engine Endpoints (Internal / Express Proxy)
- **`GET /api/v1/data/validate`**: Validates schema and referential integrity of CSV datasets.
- **`POST /api/v1/forecast`**: Computes deterministic demand forecasts.
- **`POST /api/v1/optimize`**: Solves inventory allocation MILP using Google OR-Tools CP-SAT.
- **`POST /api/v1/scenario/simulate`**: Simulates supply chain disruptions and returns delta KPI metrics.
