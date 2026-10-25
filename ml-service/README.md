# SupplyShield AI — ML Service
Adaptive Distribution Intelligence and Inventory Optimization Engine.

## Stack
- Python 3.13 (or 3.11+)
- FastAPI & Starlette
- Pydantic v2
- pandas, NumPy, SciPy
- statsmodels
- scikit-learn
- Google OR-Tools (CP-SAT solver)
- pytest & HTTPX

---

## Boundaries & Architecture
- **ML Service (`ml-service/`)**: Autonomous microservice executing demand forecasting, dataset integrity validation, OR-Tools mathematical dispatch optimization, and disruption resilience analysis.
- **Frontend / Express Backend**: Communicates with this service via standard JSON REST API endpoints (`http://127.0.0.1:8000`).
- **Data Boundary**: Consumes synthetic demo data located at `data/demo/`. **No data is loaded into memory at startup**; all endpoints load data on-demand or operate in-memory statelessly.

---

## Setup & Virtual Environment (PowerShell)

```powershell
# 1. Navigate to ml-service
cd e:\All_Projects\InnovateX_SupplyShield\SGU\ml-service

# 2. Activate existing virtual environment
.\.venv\Scripts\Activate.ps1

# 3. (Optional) Re-install or verify pinned dependencies
pip install -r requirements.txt
```

---

## Launch Command

```powershell
# Start Uvicorn ASGI server on port 8000
python -m uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive documentation:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## Test Command

```powershell
# Run the complete test suite (61 tests covering unit, regression, and E2E integration)
.\.venv\Scripts\python.exe -m pytest -v
```

---

## API Contract & Endpoint Reference

Base URL: `http://127.0.0.1:8000`

| Endpoint | Method | Required Fields | Defaults | Success Status | Error Status | Dataset Required? | Solves OR-Tools? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | *None* | *None* | `200 OK` | `500` | No | No |
| `/api/v1/health` | `GET` | *None* | *None* | `200 OK` | `500` | No | No |
| `/api/v1/data/validate` | `GET` | *None* | *None* | `200 OK` | `422`, `500` | Yes | No |
| `/api/v1/forecast` | `POST` | `store_id`, `product_id` | `horizon_days: 14`, `model_type: "auto"`, `window_days: 14` | `200 OK` | `400`, `422`, `500` | Yes | No |
| `/api/v1/evaluate-forecast` *(alias: `/evaluate-forecast`)* | `POST` | *None* | `train_end_date: "2025-10-31"`, `test_start_date: "2025-11-01"`, `test_end_date: "2025-12-31"` | `200 OK` | `400`, `422`, `500` | Yes | No |
| `/api/v1/optimize` *(alias: `/optimize`)* | `POST` | *None* | `horizon_days: 7`, `shortage_penalty_per_unit: 100.0`, `transport_cost_multiplier: 1.0`, `expiry_penalty_multiplier: 1.0`, `solver_time_limit_seconds: 10.0` | `200 OK` | `422`, `500` | Yes | Yes |
| `/api/v1/scenario/simulate` *(alias: `/scenario/simulate`)* | `POST` | *None* | `scenario_name: "Custom Disruption Scenario"`, `horizon_days: 7`, `shortage_penalty_per_unit: 100.0`, `transport_cost_multiplier: 1.0`, `solver_time_limit_seconds: 10.0` | `200 OK` | `400`, `422`, `500` | Yes | Yes (Twice: Baseline + Disrupted) |
| `/api/v1/scenario/disrupt` *(alias: `/scenario/disrupt`)* | `POST` | *None* | *(Identical to `/api/v1/scenario/simulate`)* | `200 OK` | `400`, `422`, `500` | Yes | Yes (Twice: Baseline + Disrupted) |

---

## Detailed Payload Specifications

### 1. Health Checks
- **Paths**: `GET /health`, `GET /api/v1/health`
- **Response**:
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

### 2. Dataset Validation Gate
- **Path**: `GET /api/v1/data/validate`
- **Response**:
```json
{
  "status": "valid_with_warnings",
  "summary": {
    "total_files_checked": 10,
    "files_loaded": 10,
    "total_errors": 0,
    "total_warnings": 1
  },
  "row_counts": {
    "products.csv": 10,
    "warehouses.csv": 3,
    "stores.csv": 10,
    "inventory_batches.csv": 45,
    "store_inventory.csv": 100,
    "daily_demand.csv": 3650,
    "transport_lanes.csv": 30,
    "scenarios.csv": 4,
    "benchmark_forecasts.csv": 3650,
    "data_dictionary.json": 9
  },
  "errors": [],
  "warnings": [
    {
      "code": "STOCKOUT_WITHOUT_UNMET_DEMAND",
      "message": "Found 1 demand rows with stockout_flag=1 but units_sold equal to true_demand_units.",
      "file": "daily_demand.csv",
      "column": "stockout_flag",
      "context": { "count": 1 }
    }
  ]
}
```

### 3. Demand Forecasting
- **Path**: `POST /api/v1/forecast`
- **Request Payload**:
```json
{
  "store_id": "STORE-01",
  "product_id": "SKU-001",
  "horizon_days": 14,
  "model_type": "auto",
  "window_days": 14
}
```
- **Response**:
```json
{
  "store_id": "STORE-01",
  "product_id": "SKU-001",
  "forecast_origin": "2025-12-31",
  "horizon_days": 14,
  "model_applied": "seasonal_naive",
  "selection_metric": "wape",
  "selection_score": 0.0825,
  "forecasts": [
    { "date": "2026-01-01", "predicted_demand": 14.0 },
    { "date": "2026-01-02", "predicted_demand": 18.0 }
  ],
  "warnings": []
}
```

### 4. Forecast Evaluation (Holdout Backtest)
- **Paths**: `POST /api/v1/evaluate-forecast`, `POST /evaluate-forecast`
- **Request Payload** *(all fields optional)*:
```json
{
  "store_id": "STORE-01",
  "product_id": "SKU-001",
  "train_end_date": "2025-10-31",
  "test_start_date": "2025-11-01",
  "test_end_date": "2025-12-31"
}
```
- **Response**:
```json
{
  "target_evaluated": "units_sold",
  "is_synthetic_benchmark": true,
  "split_boundaries": {
    "train_end_date": "2025-10-31",
    "test_start_date": "2025-11-01",
    "test_end_date": "2025-12-31"
  },
  "series_evaluated": 1,
  "total_test_observations": 61,
  "method_metrics": [
    { "method": "seasonal_naive_7d", "mae": 1.25, "rmse": 1.68, "wape": 0.071, "bias": 0.02 },
    { "method": "moving_average_14d", "mae": 1.84, "rmse": 2.21, "wape": 0.105, "bias": -0.11 },
    { "method": "moving_average_28d", "mae": 2.12, "rmse": 2.54, "wape": 0.121, "bias": -0.19 },
    { "method": "historical_average", "mae": 3.45, "rmse": 4.10, "wape": 0.197, "bias": 0.05 }
  ],
  "best_method": "seasonal_naive_7d",
  "warnings": []
}
```

### 5. Inventory Allocation & Optimization
- **Paths**: `POST /api/v1/optimize`, `POST /optimize`
- **Request Payload**:
```json
{
  "horizon_days": 7,
  "stores": ["STORE-01", "STORE-02"],
  "products": ["SKU-001", "SKU-002"],
  "shortage_penalty_per_unit": 100.0,
  "transport_cost_multiplier": 1.0,
  "expiry_penalty_multiplier": 1.0,
  "solver_time_limit_seconds": 10.0
}
```
- **Response**:
```json
{
  "status": "OPTIMAL",
  "planning_horizon_days": 7,
  "forecast_origin": "2025-12-31",
  "solver_runtime_seconds": 0.015,
  "optimized_plan": {
    "total_forecast_demand": 620,
    "total_store_inventory_on_hand": 450,
    "total_effective_store_stock_utilized": 430,
    "total_surplus_store_stock": 20,
    "total_gross_requirement": 190,
    "total_warehouse_stock_available": 1400,
    "total_allocated_units": 190,
    "total_unmet_demand_units": 0,
    "total_transport_cost": 28.50,
    "demand_fulfillment_rate": 100.0,
    "overall_demand_satisfied_rate": 100.0,
    "objective_score": 28.50
  },
  "baseline_plan": {
    "total_forecast_demand": 620,
    "total_allocated_units": 190,
    "total_unmet_demand_units": 0,
    "total_transport_cost": 41.20,
    "demand_fulfillment_rate": 100.0,
    "objective_score": 41.20
  },
  "delta_metrics": {
    "cost_savings_dollars": 12.70,
    "cost_savings_pct": 30.83,
    "shortage_reduction_units": 0
  },
  "allocations": [
    {
      "warehouse_id": "WH-NORTH",
      "store_id": "STORE-01",
      "product_id": "SKU-001",
      "allocated_units": 95,
      "unit_transport_cost": 0.15,
      "total_transport_cost": 14.25,
      "lead_time_hours": 6.0
    }
  ],
  "feasibility": {
    "is_feasible": true,
    "violations_count": 0,
    "errors": [],
    "warnings": []
  }
}
```

### 6. Disruption Scenario Simulation & Resilience Analysis
- **Paths**: `POST /api/v1/scenario/simulate`, `POST /api/v1/scenario/disrupt`, `/scenario/simulate`, `/scenario/disrupt`
- **Request Payload (Preset ID)**:
```json
{
  "scenario_name": "SCN-001 North Route Disruption",
  "preset_scenario_id": "SCN-001",
  "horizon_days": 7
}
```
- **Request Payload (Custom Disruption)**:
```json
{
  "scenario_name": "Central Hub Outage & Demand Surge",
  "disruptions": [
    {
      "disruption_type": "warehouse_outage",
      "target_id": "WH-CENTRAL"
    },
    {
      "disruption_type": "demand_spike",
      "target_id": "STORE-01",
      "change_value": 1.35
    }
  ],
  "horizon_days": 7
}
```
- **Supported Disruption Types**:
  1. `warehouse_outage`: `target_id` is `warehouse_id` (e.g. `"WH-CENTRAL"`).
  2. `route_closure`: `target_id` is `lane_id` formatted as `"WH-ID__STORE-ID"` (e.g. `"WH-NORTH__STORE-01"`).
  3. `lane_capacity_reduction`: `target_id` is `lane_id`, `change_value` is remaining capacity factor (e.g. `0.50` for -50%).
  4. `warehouse_stock_reduction`: `target_id` is `warehouse_id`, `change_value` is remaining stock factor (e.g. `0.70` for -30%).
  5. `demand_spike`: `target_id` is `store_id`, `change_value` is demand multiplier (e.g. `1.25` for +25%).
- **Response**:
```json
{
  "scenario_name": "SCN-001 North Route Disruption",
  "applied_disruptions": [
    {
      "disruption_type": "route_closure",
      "target_id": "WH-NORTH__STORE-01",
      "change_value": null
    }
  ],
  "affected_entities": {
    "warehouses": [],
    "stores": ["STORE-01"],
    "products": [],
    "lanes": ["WH-NORTH__STORE-01"]
  },
  "baseline_plan": {
    "total_forecast_demand": 31079,
    "total_allocated_units": 8889,
    "total_unmet_demand_units": 0,
    "total_transport_cost": 871.52,
    "demand_fulfillment_rate": 100.0
  },
  "disrupted_plan": {
    "total_forecast_demand": 31079,
    "total_allocated_units": 8889,
    "total_unmet_demand_units": 0,
    "total_transport_cost": 1033.55,
    "demand_fulfillment_rate": 100.0
  },
  "delta_metrics": {
    "demand_delta_units": 0,
    "allocated_units_delta": 0,
    "unmet_demand_delta_units": 0,
    "fulfillment_rate_delta_pct": 0.0,
    "transport_cost_delta_dollars": 162.03,
    "objective_score_delta": 162.03
  },
  "resilience_insights": {
    "primary_bottleneck": "Transportation route closure on WH-NORTH__STORE-01 forcing rerouting via secondary hubs",
    "net_additional_unmet_units": 0,
    "freight_cost_delta_dollars": 162.03,
    "top_shortage_stores": [],
    "top_shortage_products": [],
    "is_disrupted_plan_feasible": true,
    "solver_status": "OPTIMAL",
    "executive_summary": "Disruption absorbed successfully without customer stockouts. Shipments rerouted through secondary lanes with a freight cost increase of $162.03 (+18.59%)."
  }
}
```

---

## Metric Definitions & Formulas

1. **Forecast Metrics**:
   - $\text{MAE} = \frac{1}{n} \sum |y_t - \hat{y}_t|$
   - $\text{RMSE} = \sqrt{\frac{1}{n} \sum (y_t - \hat{y}_t)^2}$
   - $\text{WAPE} = \frac{\sum |y_t - \hat{y}_t|}{\sum y_t}$
   - $\text{Signed Bias} = \frac{1}{n} \sum (\hat{y}_t - y_t)$

2. **Inventory Arithmetic & Reconciliation**:
   - $\text{Gross Requirement} = \max(0, \text{forecast\_demand} - \text{store\_inventory\_on\_hand})$
   - $\text{Effective Store Stock Utilized} = \min(\text{forecast\_demand}, \text{store\_inventory\_on\_hand})$
   - $\text{Surplus Store Stock} = \max(0, \text{store\_inventory\_on\_hand} - \text{forecast\_demand})$
   - Strict identity: $\text{Total Demand} \equiv \text{Effective Store Stock} + \text{Gross Requirement}$
   - Strict identity: $\text{Total Store Inventory} \equiv \text{Effective Store Stock} + \text{Surplus Store Stock}$

3. **Optimization Objective**:
   $$\min \sum_{(w, s, p)} c_{w,s} \cdot x_{w,s,p} + P_{\text{shortage}} \sum_{(s, p)} u_{s,p}$$
   subject to:
   - Warehouse stock conservation: $\sum_s x_{w,s,p} \le S_{w,p}$
   - Store replenishment fulfillment: $\sum_w x_{w,s,p} + u_{s,p} = \text{gross\_req}_{s,p}$
   - Lane physical capacity limits: $\sum_p x_{w,s,p} \le C_{w,s}$
   - Valid lane domain: $x_{w,s,p} = 0$ for all $(w, s) \notin \mathcal{L}_{\text{valid}}$
   - Integrality: $x_{w,s,p} \in \mathbb{Z}_{\ge 0}, u_{s,p} \in \mathbb{Z}_{\ge 0}$

---

## Known Limitations

1. **Aggregate Planning Window**: The optimization engine solves an aggregate dispatch plan across the requested planning horizon (e.g., 7 days). It is not a day-by-day discrete dynamic multi-period simulation.
2. **Missing Batch-Level Expiry Optimization**: Decision variables $x_{w,s,p}$ are modeled at the SKU level. Batch-indexed decision variables $x_{w,s,p,b}$ and hard shelf-life constraints are not enforced in the solver.
3. **Synthetic Benchmark Dataset**: All data under `data/demo/` is synthetic. Historical demand contains clean weekly periodicity and synthetic stockout flags.
4. **Lane Capacity Disruption Modeling**: For route closures and capacity drops, disruptions apply strictly to network lanes defined in `transport_lanes.csv`.

---

## Troubleshooting

- **Server fails to start with port conflict**:
  Change port to `8001`: `python -m uvicorn src.main:app --host 127.0.0.1 --port 8001`.
- **`ModuleNotFoundError: No module named 'pydantic_settings'`**:
  Ensure you are using the pinned repository environment; `src/config.py` uses pure `pydantic.BaseModel` without `pydantic-settings`.
- **`400 Bad Request: No historical demand records found`**:
  Verify the exact IDs in `data/demo/stores.csv` (`STORE-01` to `STORE-10`) and `products.csv` (`SKU-001` to `SKU-010`).
- **`422 Unprocessable Entity`**:
  Inspect request JSON against schema; common causes include `horizon_days > 90` for forecasting or invalid disruption types.
