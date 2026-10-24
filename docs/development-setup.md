# SupplyShield AI — Development Setup & Operations Guide

## 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v22.20.0, npm 10.9.3)
- **Python**: v3.11+ (tested on Python 3.13.5)
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance (optional in development; backend falls back gracefully to in-memory state).

---

## 2. Express Backend Setup (`InnovateX/backend`)

### Installation
```bash
cd InnovateX/backend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration keys:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=10000
```

### Launching the Backend
```bash
# Production mode
npm start

# Development watch mode
npm run dev
```
- Server URL: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/api-docs`
- Health Endpoint: `http://localhost:5000/api/v1/health`
- Dependency Probe: `http://localhost:5000/api/v1/health/dependencies`

### Running Backend Tests
```bash
npm test
```

---

## 3. Python ML Service Setup (`ml-service`)

### Installation & Virtual Environment
```bash
cd ml-service

# Create and activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### Launching the Service
```bash
# Start Uvicorn ASGI server
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`
- Readiness Endpoint: `http://127.0.0.1:8000/health/ready`

### Running ML Service Tests
```bash
python -m pytest tests/test_health.py
```

---

## 4. Frontend Setup (`InnovateX/frontend`)

```bash
cd InnovateX/frontend
npm install
npm run dev
```
- UI URL: `http://localhost:5173`
- API calls proxy automatically to `http://localhost:5000` via Vite configuration.
