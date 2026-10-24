# SupplyShield AI — Development Setup & Operations Guide

## 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v22.20.0, npm 10.9.3)
- **Python**: v3.11+ (tested on Python 3.13.5)
- **MongoDB**: MongoDB Atlas or local MongoDB Community Edition (`mongodb://127.0.0.1:27017/supplyshield`). Real persistence is required; in-memory fallback is strictly restricted to unit tests.

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
MONGODB_URI=mongodb://127.0.0.1:27017/supplyshield
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
REQUEST_TIMEOUT_MS=10000
DATASET_PATH=e:/Hackathons/Triwizathon/data/supply_chain_dataset1.csv
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
Executes all 51 test specifications across 6 test suites covering health probes, ML client integration, CSV ingestion validation, duplicate rejection, paginated read endpoints, Phase 2 supply-chain analytics calculations, deterministic recommendation triggers, and Phase 3 demand forecasting endpoints.

---

## 3. CSV Dataset Placement & Ingestion Engine

### Dataset Location
Place the primary supply-chain dataset at:
`data/supply_chain_dataset1.csv` (relative to repository root) or specify a custom path via `DATASET_PATH`.

### Required CSV Headers
```csv
Date,SKU_ID,Warehouse_ID,Supplier_ID,Region,Units_Sold,Inventory_Level,Supplier_Lead_Time_Days,Reorder_Point,Order_Quantity,Unit_Cost,Unit_Price,Promotion_Flag,Stockout_Flag,Demand_Forecast
```

### Ingestion Commands

1. **Dry-Run Validation (No Database Writes)**:
   ```bash
   cd InnovateX/backend
   npm run ingest:dry
   # Or directly:
   node src/scripts/ingestData.js --dry-run
   ```
   Validates schema, checks column headers, checks data types and numeric ranges, and calculates entity metrics without mutating the database.

2. **Live Ingestion (Writing to MongoDB)**:
   ```bash
   cd InnovateX/backend
   npm run ingest
   # Or directly:
   node src/scripts/ingestData.js
   ```
   Streaming chunked ingestion:
   - Upserts Master Entities (`Product`, `Warehouse`, `Supplier`, `TransportLane`).
   - Upserts latest Inventory snapshot per `(SKU_ID, Warehouse_ID)`.
   - Inserts historical observations into `DemandHistory` with strict deduplication on composite key `(dateString, skuId, warehouseId)`.
   - Records an immutable audit entry in `DataImportRun`.

3. **Custom File Path**:
   ```bash
   node src/scripts/ingestData.js --file "path/to/custom_dataset.csv" [--dry-run]
   ```

### Audit Report Interpretation
- **Total Rows Read**: Total records encountered after header.
- **Valid Records**: Rows passing all schema, numeric range, and calendar validations.
- **Imported Records**: Rows committed to MongoDB (0 during dry run).
- **Duplicate Records**: Observations with identical `(dateString, skuId, warehouseId)`.
- **Rejected Records**: Malformed rows, non-numeric values, or negative figures. Up to 100 sample rejections are logged with line numbers and exact reasons.

---

## 4. Python ML Service Setup (`ml-service`)

### Installation & Virtual Environment
```bash
cd ml-service

# Create and activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Launching the Service
```bash
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`
- Readiness Endpoint: `http://127.0.0.1:8000/health/ready`

### Running ML Service Tests
```bash
python -m pytest tests/test_health.py tests/test_forecasting.py
```
Executes all 21 test specifications covering health probes, feature engineering, leakage prevention, baseline forecasters, LightGBM/XGBoost models, model persistence, and chronological holdout evaluation.


---

## 5. Frontend Setup (`InnovateX/frontend`)

```bash
cd InnovateX/frontend
npm install
npm run dev
```
- UI URL: `http://localhost:5173`
- API calls proxy automatically to `http://localhost:5000` via Vite configuration.
