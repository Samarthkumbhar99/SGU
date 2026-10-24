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
  - **Purpose**: Readiness & dependency probe. Verifies status of MongoDB and the FastAPI ML microservice.
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
          "databaseName": "supplyshield",
          "host": "127.0.0.1",
          "mode": "mongodb-persistent"
        },
        "mlService": {
          "status": "healthy",
          "connected": true,
          "latencyMs": 33,
          "url": "http://localhost:8000"
        }
      }
    }
    ```

### Interactive Documentation
- **`GET /api-docs`**: Swagger UI documentation.
- **`GET /api-docs.json`**: OpenAPI 3.0 specification JSON.

---

### Master Data Entities

- **`GET /api/v1/products`**
  - **Query Params**: `page` (default 1), `limit` (default 20, max 100), `skuId`, `supplierId`, `category`, `search`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "skuId": "SKU_1",
          "productName": "Product SKU_1",
          "category": "General FMCG",
          "unitCost": 13.95,
          "unitPrice": 20.48,
          "supplierId": "SUP_8",
          "leadTimeDays": 14,
          "reorderPoint": 379
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
    }
    ```

- **`GET /api/v1/warehouses`**
  - **Query Params**: `page`, `limit`, `warehouseId`, `region`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "warehouseId": "WH_1",
          "warehouseName": "Warehouse WH_1",
          "regionsServed": ["West", "North", "South", "East"],
          "storageCapacityUnits": 15000,
          "location": "Regional Distribution Hub"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
    }
    ```

- **`GET /api/v1/stores`**
  - **Query Params**: `page`, `limit`, `storeId`, `region`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [],
      "metadata": {
        "note": "Stores dataset is optional and not present in warehouse-level baseline CSV. Ingest stores.csv to populate retail store nodes."
      },
      "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
    }
    ```

- **`GET /api/v1/suppliers`**
  - **Query Params**: `page`, `limit`, `supplierId`, `region`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "supplierId": "SUP_1",
          "supplierName": "Supplier SUP_1",
          "defaultLeadTimeDays": 2,
          "regions": ["East", "West", "North", "South"]
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
    }
    ```

---

### Operational & Historical Data

- **`GET /api/v1/inventory`**
  - **Query Params**: `page`, `limit`, `skuId`, `warehouseId`, `supplierId`, `lowStock` (boolean)
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "skuId": "SKU_1",
          "warehouseId": "WH_1",
          "inventoryLevel": 410,
          "reorderPoint": 379,
          "orderQuantity": 0,
          "unitCost": 13.95,
          "unitPrice": 20.48,
          "isLowStock": false,
          "lastObservationDate": "2024-12-30T00:00:00.000Z"
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 250, "totalPages": 13 }
    }
    ```

- **`GET /api/v1/demand/history`**
  - **Query Params**: `page`, `limit`, `skuId`, `warehouseId`, `region`, `startDate`, `endDate`, `promotionOnly`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "dateString": "2024-12-30",
          "skuId": "SKU_1",
          "warehouseId": "WH_1",
          "region": "West",
          "unitsSold": 25,
          "inventoryLevel": 410,
          "demandForecast": 21.7,
          "promotionFlag": 0,
          "stockoutFlag": 0,
          "unitCost": 13.95,
          "unitPrice": 20.48
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 91250, "totalPages": 4563 }
    }
    ```

---

### Data Quality & Ingestion Audit

- **`GET /api/v1/data-quality/summary`**
  - **Purpose**: Audits dataset integrity, distinguishes actual zeros from missing values, and analyzes stockout flags.
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "datasetStatus": "ingested",
        "recordCounts": {
          "demandHistory": 91250,
          "products": 50,
          "warehouses": 5,
          "suppliers": 10,
          "inventorySnapshots": 250
        },
        "dataIntegrity": {
          "missingSourceValues": 0,
          "actualZeroValues": {
            "unitsSoldZero": 12,
            "orderQuantityZero": 87740,
            "stockoutFlagZero": 91250
          },
          "stockoutDistribution": {
            "zeroStockouts": 91250,
            "oneStockouts": 0,
            "isAllZeros": true,
            "analysisNote": "Stockout_Flag contains exclusively zero values in source dataset."
          },
          "promotionsCount": 9270,
          "dateCoverage": {
            "startDate": "2024-01-01",
            "endDate": "2024-12-30",
            "distinctObservationDays": 365
          },
          "averages": {
            "avgUnitsSold": 20.05,
            "avgInventoryLevel": 471.52
          }
        },
        "lastImportRun": {
          "importId": "IMP-1792852323328-9c1c84",
          "status": "completed",
          "totalRows": 91250,
          "validRows": 91250,
          "durationMs": 30444
        }
      }
    }
    ```

- **`GET /api/v1/data-imports`**
  - **Response (200 OK)**: Returns list of import execution logs.

- **`POST /api/v1/data-imports/trigger`**
  - **Auth**: Bearer JWT required
  - **Body**: `{ "dryRun": true, "filePath": "path/to/dataset.csv" }`
  - **Response (200 OK)**: Returns run summary with execution time and metrics.

---

### Phase 2: Supply-Chain Intelligence & Analytics

#### Mathematical Definitions & Units
- **Inventory Valuation**:
  $$\text{Inventory Value} = \sum_{i} (\text{Inventory Quantity}_i \times \text{Unit Cost}_i)$$
  - *Units*: Base Currency (USD).
- **Days of Supply (DOS)**:
  $$\text{Days of Supply} = \frac{\text{Current Inventory Level}}{\text{Average Daily Demand (trailing 30 days)}}$$
  - *Units*: Days.
  - *Zero/Missing Demand Policy*: When trailing demand is $0$ or unobserved, `daysOfSupply` is set to `null` with a clear explanation (`"No demand observed in trailing window"` or `"Demand history unavailable"`). It is never returned as `Infinity`, `NaN`, or an arbitrary number.
- **Low-Stock Alert**:
  $$\text{Low Stock} \iff \text{Inventory Level} \le \text{Reorder Point}$$
  - Products with missing values are never categorized as low stock simply because of null conversion.
- **Excess Inventory Rule**:
  $$\text{Excess Stock} \iff \text{Days of Supply} > 60 \quad\text{OR}\quad \text{Inventory Level} > 2.5 \times \text{Reorder Point}$$
- **Demand Volatility**:
  $$\text{Coefficient of Variation (CV)} = \frac{\sigma}{\mu} = \frac{\text{Standard Deviation of Daily Sales}}{\text{Mean Daily Sales}}$$
- **Promotional Comparison**:
  - Reports descriptive statistics only ($\bar{x}_{\text{promo}}, \bar{x}_{\text{non-promo}}$, difference, and sample sizes $N_{\text{promo}}, N_{\text{non-promo}}$).
  - Explicitly states no causal attribution or elasticity claims without counterfactual ML models.
- **Stockout Flag Caveat**:
  - Observed demand is represented by `Units_Sold`. In the baseline dataset, `Stockout_Flag` is 0 across all 91,250 observations. True unconstrained demand may be higher during stockout episodes.

---

#### Analytics Endpoints

- **`GET /api/v1/analytics/overview`**
  - **Purpose**: Executive dashboard KPIs aggregated across all or filtered warehouses/SKUs.
  - **Query Params**: `warehouseId`, `skuId`
  - **Auth**: Optional / Authenticated
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "inventory": {
          "totalSkus": 50,
          "totalWarehouses": 5,
          "totalStockUnits": 117880,
          "totalInventoryValueUsd": 2980420.50,
          "lowStockAlertsCount": 18,
          "excessStockAlertsCount": 24,
          "avgDaysOfSupply": 23.4
        },
        "demand": {
          "totalUnitsSold": 1829562,
          "totalForecastUnits": 1980750,
          "totalObservations": 91250,
          "avgDailyUnitsSold": 20.05,
          "dataQualityNote": "Stockout_Flag is 0 for 100% of rows; Units_Sold represents observed demand."
        },
        "suppliers": {
          "totalSuppliers": 10,
          "avgLeadTimeDays": 7.8,
          "maxLeadTimeDays": 14,
          "leadTimeConfidence": "deterministic_dataset_summary"
        },
        "activeRecommendationsCount": 42
      }
    }
    ```

- **`GET /api/v1/analytics/inventory`**
  - **Purpose**: Granular inventory positions, valuation, warehouse breakdown, low stock alerts, excess inventory indicators, and days of supply.
  - **Query Params**:
    - `page` (default 1)
    - `limit` (default 20, max 200)
    - `warehouseId` (e.g., `WH_1`)
    - `skuId` (e.g., `SKU_10`)
    - `lowStockOnly` (`true` / `false`)
    - `excessOnly` (`true` / `false`)
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "summary": {
          "totalValuationUsd": 2980420.50,
          "totalStockUnits": 117880,
          "lowStockCount": 18,
          "excessStockCount": 24,
          "evaluatedItemCount": 250,
          "valuationFormula": "Sum of (inventoryLevel * unitCost)"
        },
        "distributionByWarehouse": [
          {
            "warehouseId": "WH_1",
            "totalUnits": 24200,
            "skuCount": 50,
            "valuationUsd": 612400.00
          }
        ],
        "items": [
          {
            "skuId": "SKU_1",
            "productName": "Product SKU_1",
            "warehouseId": "WH_1",
            "inventoryLevel": 410,
            "reorderPoint": 379,
            "unitCost": 13.95,
            "totalValue": 5719.50,
            "averageDailyDemand": 20.5,
            "daysOfSupply": 20.0,
            "daysOfSupplyExplanation": null,
            "isLowStock": false,
            "isExcess": false,
            "excessReason": null
          }
        ]
      },
      "pagination": { "page": 1, "limit": 20, "total": 250, "totalPages": 13 }
    }
    ```

- **`GET /api/v1/analytics/demand`**
  - **Purpose**: Aggregated demand trends over configurable daily, weekly, or monthly intervals, descriptive promotional performance, and volatility metrics ($CV$).
  - **Query Params**:
    - `timeBucket`: `daily` | `weekly` | `monthly` (default `daily`)
    - `startDate`: ISO date `YYYY-MM-DD`
    - `endDate`: ISO date `YYYY-MM-DD`
    - `skuId`: Optional filter
    - `warehouseId`: Optional filter
    - `region`: Optional filter (`East`, `West`, `North`, `South`)
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "granularity": "weekly",
        "dateRange": {
          "startDate": "2024-01-01",
          "endDate": "2024-12-30",
          "distinctDaysCovered": 365,
          "totalObservations": 91250,
          "hasSufficientHistory": true
        },
        "volatility": {
          "mean": 5012.5,
          "stdDev": 234.1,
          "coefficientOfVariation": 0.0467,
          "volatilityClassification": "LOW"
        },
        "promotionAnalysis": {
          "promotional": { "sampleCount": 9270, "avgUnitsSold": 22.4 },
          "nonPromotional": { "sampleCount": 81980, "avgUnitsSold": 19.8 },
          "deltaUnits": 2.6,
          "percentageDiff": 13.13,
          "caveat": "Descriptive statistics only. Uncontrolled for seasonal factors or price discounts."
        },
        "timeSeries": [
          {
            "timeBucket": "2024-W01",
            "totalUnitsSold": 35120,
            "avgUnitsSold": 20.06,
            "observationsCount": 1750
          }
        ]
      }
    }
    ```

- **`GET /api/v1/analytics/suppliers`**
  - **Purpose**: Supplier performance, lead-time distribution, risk scores, and SKU coverage.
  - **Query Params**: `supplierId`, `minLeadTime`, `maxLeadTime`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "totalSuppliers": 10,
        "leadTimeMetrics": {
          "avgLeadTimeDays": 7.8,
          "minLeadTimeDays": 2,
          "maxLeadTimeDays": 14
        },
        "suppliers": [
          {
            "supplierId": "SUP_1",
            "supplierName": "Supplier SUP_1",
            "leadTimeDays": 2,
            "skusSuppliedCount": 5,
            "riskLevel": "LOW",
            "riskReason": "Lead time is within acceptable baseline (<= 7 days)"
          }
        ]
      }
    }
    ```

- **`GET /api/v1/recommendations`**
  - **Purpose**: Deterministic supply chain recommendations generated from audited operational rules.
  - **Query Params**:
    - `severity`: `CRITICAL` | `WARNING` | `INFO`
    - `type`: `REORDER_BREACH` | `LOW_DAYS_OF_SUPPLY` | `EXCESS_INVENTORY` | `DEMAND_SURGE` | `LEAD_TIME_RISK`
    - `skuId`: Optional filter
    - `warehouseId`: Optional filter
    - `limit`: default 50
  - **Recommendation Object Structure**:
    - `recommendationId`: Deterministic hash/string (e.g., `REC-REORDER-SKU_1-WH_1`)
    - `type`: Category code
    - `severity`: Urgency ranking (`CRITICAL`, `WARNING`, `INFO`)
    - `skuId`, `warehouseId`: Entity coordinates
    - `observedMetrics`: Quantitative metrics driving the rule
    - `triggerRule`: Explicit mathematical formula / business condition that fired
    - `recommendedAction`: Step-by-step resolution instruction
    - `dataQualityCaveats`: Limitations or data constraints
    - `timestamp`: Generation timestamp
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "recommendationId": "REC-REORDER-SKU_1-WH_3",
          "type": "REORDER_BREACH",
          "severity": "CRITICAL",
          "skuId": "SKU_1",
          "warehouseId": "WH_3",
          "observedMetrics": {
            "currentInventory": 350,
            "reorderPoint": 379,
            "deficit": 29
          },
          "triggerRule": "inventoryLevel <= reorderPoint",
          "recommendedAction": "Place expedited replenishment order of at least 29 units with primary supplier.",
          "dataQualityCaveats": "Assumes current inventory snapshot accurate as of 2024-12-30.",
          "timestamp": "2026-10-24T16:00:00.000Z"
        }
      ],
      "total": 42
    }
    ```

---

### Phase 3: Demand Forecasting Engine

#### Methodology & Leakage-Safe Validation
- **Target**: `Units_Sold` (observed demand units).
- **Provenance & Target Leakage Investigation of `Demand_Forecast`**:
  - Statistical inspection revealed that the `Demand_Forecast` column in `data/supply_chain_dataset1.csv` was generated synthetically on the exact same date as `Units_Sold + Normal(0, 3)` ($r = 0.9493$, mean diff $0.027$, std diff $2.987$).
  - **Decision & Rationale**: Using `Demand_Forecast` as an input feature for predicting `Units_Sold` on day $t$ constitutes severe contemporaneous target leakage. Furthermore, future third-party forecast values would be circular or unavailable at inference time. **`Demand_Forecast` is strictly excluded from all feature engineering**.
- **Stockout Flag Caveat**:
  - `Stockout_Flag` is 0 across all 91,250 observations in the dataset. Models are trained on observed sales (`Units_Sold`). During real-world stockouts, true unconstrained demand may be higher.
- **Leakage Prevention**:
  - Lags ($1, 7, 14, 28$) are calculated strictly per `(SKU_ID, Warehouse_ID)` series using past observations only.
  - Rolling statistics (means $7, 14, 28$ and stdDevs $7, 28$) are shifted by 1 day (`shift(1)`) so that target day demand is never included in its own rolling window.
  - Initial 28-day warm-up observations where lag 28 is unavailable are excluded from training with explicit accounting.
- **Chronological Split Boundaries**:
  - **Train Period**: `2024-01-29` to `2024-11-04` (70,250 observations after dropping 7,000 warm-up rows).
  - **Validation Period**: `2024-11-05` to `2024-12-02` (7,000 observations) used for model selection and comparison.
  - **Holdout Test Period**: `2024-12-03` to `2024-12-30` (7,000 observations) final untouched backtest across all 250 SKU-Warehouse series.
- **Evaluation Metric Formulas**:
  $$\text{MAE} = \frac{1}{N}\sum |y - \hat{y}|, \quad \text{RMSE} = \sqrt{\frac{1}{N}\sum (y - \hat{y})^2}$$
  $$\text{WAPE} = \frac{\sum |y - \hat{y}|}{\sum y} \quad (\text{returns null if } \sum y = 0), \quad \text{Signed Bias} = \frac{1}{N}\sum (\hat{y} - y)$$
  $$\text{Relative Improvement} = \frac{\text{WAPE}_{\text{baseline}} - \text{WAPE}_{\text{candidate}}}{\text{WAPE}_{\text{baseline}}} \times 100\%$$
- **Integer Ordering Rounding Policy**:
  - Point forecasts are computed as continuous floats ($\ge 0$). When integer replenishment orders are produced, `order_quantity_round` is derived via standard round (`round(val)`) or conservative safety buffer (`ceil(val)`).

---

#### Forecasting Application Endpoints (Express & FastAPI)

- **`POST /api/v1/forecast/predict`**
  - **Purpose**: Generates multi-day demand predictions for a given SKU and Warehouse using the active model or requested baseline.
  - **Auth**: Bearer JWT required (Express)
  - **Request Body**:
    ```json
    {
      "skuId": "SKU_1",
      "warehouseId": "WH_1",
      "horizonDays": 14,
      "modelType": "auto",
      "roundingPolicy": "round"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "sku_id": "SKU_1",
        "warehouse_id": "WH_1",
        "forecast_origin": "2024-12-30",
        "horizon_days": 14,
        "model_applied": "lightgbm",
        "model_version": "v_20261024_163137",
        "selection_metric": "Chronological holdout MAE",
        "selection_score": 7.2042,
        "forecasts": [
          { "date": "2024-12-31", "predicted_demand": 10.69, "order_quantity_round": 11 },
          { "date": "2025-01-01", "predicted_demand": 24.46, "order_quantity_round": 24 }
        ],
        "validation_metadata": { "mae": 7.2042, "wape": 0.4053 },
        "warnings": [
          "Stockout_Flag is 0 in source dataset; Units_Sold reflects observed sales rather than unconstrained demand."
        ]
      }
    }
    ```

- **`POST /api/v1/forecast/train`**
  - **Purpose**: Trains LightGBM or XGBoost on historical train split, validates on validation and holdout splits, and persists versioned artifact to disk.
  - **Auth**: Bearer JWT required (Admin / Manager)
  - **Request Body**:
    ```json
    {
      "modelType": "lightgbm",
      "forceRetrain": true,
      "setActive": true
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "model_name": "lightgbm",
        "model_version": "v_20261024_163137",
        "training_cutoff_date": "2024-11-04",
        "train_observations": 70250,
        "validation_metrics": { "mae": 4.5705, "rmse": 5.7434, "wape": 0.3401, "bias": -2.0943 },
        "holdout_metrics": { "mae": 7.2042, "rmse": 8.5955, "wape": 0.4053, "bias": -6.7042 },
        "artifact_path": "ml-service/models/lightgbm_v_20261024_163137/model.joblib",
        "is_active": true
      }
    }
    ```

- **`POST /api/v1/forecast/evaluate`**
  - **Purpose**: Executes leakage-safe chronological holdout backtest comparing Baselines, LightGBM, and XGBoost.
  - **Auth**: Bearer JWT required
  - **Request Body**:
    ```json
    {
      "includeMlModels": true,
      "testStartDate": "2024-12-03",
      "testEndDate": "2024-12-30"
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "target_evaluated": "Units_Sold (observed demand)",
        "is_synthetic_benchmark": false,
        "split_boundaries": {
          "train_end_date": "2024-11-04",
          "test_start_date": "2024-12-03",
          "test_end_date": "2024-12-30"
        },
        "holdout_dates": "2024-12-03 to 2024-12-30",
        "series_evaluated": 250,
        "total_test_observations": 7000,
        "method_metrics": [
          { "method": "seasonal_naive_7d", "mae": 6.0291, "rmse": 7.6122, "wape": 0.3392, "bias": -1.2040, "relative_improvement_pct": 0.0 },
          { "method": "moving_average_7d", "mae": 4.5026, "rmse": 5.7160, "wape": 0.2533, "bias": -0.6827, "relative_improvement_pct": 25.32 },
          { "method": "moving_average_14d", "mae": 4.6734, "rmse": 5.8641, "wape": 0.2629, "bias": -0.8124, "relative_improvement_pct": 22.49 },
          { "method": "lightgbm", "mae": 7.2042, "rmse": 8.5955, "wape": 0.4053, "bias": -6.7042, "relative_improvement_pct": -19.49 },
          { "method": "xgboost", "mae": 7.8325, "rmse": 9.2484, "wape": 0.4407, "bias": -7.4352, "relative_improvement_pct": -29.92 }
        ],
        "best_method": "moving_average_7d",
        "warnings": [
          "Evaluated on observed Units_Sold. Unconstrained true demand during stockout periods is unobservable in this dataset.",
          "Demand_Forecast was excluded from model features due to contemporaneous synthetic target leakage."
        ]
      }
    }
    ```

- **`GET /api/v1/forecast/models`**
  - **Purpose**: Lists registered forecaster model versions, training cutoffs, and active pointers.
  - **Auth**: Bearer JWT required
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "success": true,
        "active_version": "v_20261024_163137",
        "models": [
          {
            "model_name": "lightgbm",
            "model_version": "v_20261024_163137",
            "created_at": "2026-10-24T16:31:37.328421Z",
            "training_cutoff_date": "2024-11-04",
            "training_data_range": "2024-01-29 to 2024-11-04",
            "is_active": true,
            "holdout_metrics": { "mae": 7.2042, "rmse": 8.5955, "wape": 0.4053, "bias": -6.7042 }
          }
        ]
      }
    }
    ```

---

### Phase 4 Distribution Optimization & Inventory Intelligence

- **`POST /api/v1/optimization/solve`** *(alias: `/api/v1/optimize`)*
  - **Purpose**: Solves warehouse-to-store/region SKU inventory dispatch using Google OR-Tools CP-SAT with baseline comparison and independent feasibility verification. Persists plan metadata to MongoDB `OptimizationRun`.
  - **Auth**: Bearer JWT required
  - **Request Body**:
    ```json
    {
      "horizonDays": 7,
      "stores": ["STORE-01", "STORE-02"],
      "products": ["SKU-001", "SKU-002"],
      "shortagePenaltyPerUnit": 100.0,
      "transportCostMultiplier": 1.0,
      "solverTimeLimitSeconds": 10.0
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "runId": "opt-9f3a18e2",
      "data": {
        "run_id": "opt-9f3a18e2",
        "status": "OPTIMAL",
        "planning_horizon_days": 7,
        "forecast_origin": "2025-12-31",
        "solver_runtime_seconds": 0.045,
        "optimized_plan": {
          "total_forecast_demand": 3108,
          "total_store_inventory_on_hand": 200,
          "total_effective_store_stock_utilized": 200,
          "total_surplus_store_stock": 0,
          "total_gross_requirement": 2908,
          "total_warehouse_stock_available": 60000,
          "total_allocated_units": 2908,
          "total_unmet_demand_units": 0,
          "total_transport_cost": 290.80,
          "demand_fulfillment_rate": 100.0,
          "overall_demand_satisfied_rate": 100.0,
          "objective_score": 290.80
        },
        "baseline_plan": {
          "total_forecast_demand": 3108,
          "total_allocated_units": 2908,
          "total_unmet_demand_units": 0,
          "total_transport_cost": 348.96,
          "demand_fulfillment_rate": 100.0,
          "objective_score": 348.96
        },
        "delta_metrics": {
          "transport_cost_savings_dollars": 58.16,
          "unmet_demand_delta_units": 0
        },
        "allocations": [
          {
            "warehouse_id": "WH-CENTRAL",
            "store_id": "STORE-01",
            "product_id": "SKU-001",
            "allocated_units": 727,
            "unit_transport_cost": 0.10,
            "total_transport_cost": 72.70,
            "lead_time_hours": 12.0
          }
        ],
        "feasibility": {
          "is_feasible": true,
          "violations_count": 0,
          "errors": [],
          "warnings": []
        },
        "warnings": []
      }
    }
    ```

- **`POST /api/v1/optimization/simulate`** *(alias: `/api/v1/scenario/simulate`)*
  - **Purpose**: Injects disruption shocks (lane closure, warehouse outage, throughput reduction, demand surge), re-solves using OR-Tools CP-SAT, and returns resilience deltas and recovery recommendations.
  - **Auth**: Bearer JWT required
  - **Request Body (Preset Scenario)**:
    ```json
    {
      "presetScenarioId": "SCN-001",
      "horizonDays": 7,
      "stores": ["STORE-01", "STORE-02"],
      "products": ["SKU-001"]
    }
    ```
  - **Request Body (Custom Disruption)**:
    ```json
    {
      "scenarioName": "Central Hub Outage & Western Surge",
      "disruptions": [
        { "disruptionType": "warehouse_outage", "targetId": "WH-CENTRAL" },
        { "disruptionType": "demand_spike", "targetId": "STORE-01", "changeValue": 1.30 }
      ],
      "horizonDays": 7
    }
    ```
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "runId": "sim-2e4b78c1",
      "data": {
        "run_id": "sim-2e4b78c1",
        "scenario_name": "North Lane Closure (SCN-001)",
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
          "total_forecast_demand": 3108,
          "total_allocated_units": 2908,
          "total_unmet_demand_units": 0,
          "total_transport_cost": 290.80,
          "demand_fulfillment_rate": 100.0
        },
        "disrupted_plan": {
          "total_forecast_demand": 3108,
          "total_allocated_units": 2908,
          "total_unmet_demand_units": 0,
          "total_transport_cost": 348.96,
          "demand_fulfillment_rate": 100.0
        },
        "delta_metrics": {
          "demand_delta_units": 0,
          "allocated_units_delta": 0,
          "unmet_demand_delta_units": 0,
          "fulfillment_rate_delta_pct": 0.0,
          "transport_cost_delta_dollars": 58.16,
          "objective_score_delta": 58.16
        },
        "resilience_insights": {
          "primary_bottleneck": "Transportation route closure on WH-NORTH__STORE-01 forcing rerouting via secondary hubs",
          "net_additional_unmet_units": 0,
          "freight_cost_delta_dollars": 58.16,
          "is_disrupted_plan_feasible": true,
          "solver_status": "OPTIMAL",
          "executive_summary": "Network successfully absorbed the disruption without service loss. Shipments rerouted through secondary hubs with $58.16 additional freight cost."
        }
      }
    }
    ```

- **`GET /api/v1/optimization/runs`**
  - **Purpose**: Paginated list of historical optimization and simulation runs from MongoDB `OptimizationRun`.
  - **Auth**: Bearer JWT required
  - **Query Params**: `runType` ('solve'|'simulate'), `status`, `page`, `limit`
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "runId": "opt-9f3a18e2",
          "runType": "solve",
          "scenarioName": "Optimal Allocation Plan",
          "status": "OPTIMAL",
          "solverRuntimeSeconds": 0.045,
          "objectiveScore": 290.80,
          "metrics": {
            "baselineTransportCost": 348.96,
            "optimizedTransportCost": 290.80,
            "demandFulfillmentRatePct": 100.0
          },
          "createdAt": "2026-10-24T18:25:00.000Z"
        }
      ],
      "pagination": { "total": 1, "page": 1, "limit": 20, "pages": 1 }
    }
    ```

- **`GET /api/v1/optimization/runs/:runId`**
  - **Purpose**: Detailed report and allocation breakdown for a specific run ID.
  - **Auth**: Bearer JWT required
  - **Response (200 OK)**: Returns full `OptimizationRun` document.

---

## 2. FastAPI ML Service Endpoints (`http://127.0.0.1:8000`)

### Health & Readiness
- **`GET /health`** (and alias `/api/v1/health`): Liveness probe.
- **`GET /health/ready`** (and alias `/api/v1/health/ready`): Readiness probe with component audit.
- **`GET /api/v1/data/validate`**: Validates schema and referential integrity of CSV datasets.
- **`POST /api/v1/forecast/predict`** (and legacy `/api/v1/forecast`): Point prediction.
- **`POST /api/v1/forecast/train`**: Model training and artifact persistence.
- **`POST /api/v1/forecast/evaluate`** (and legacy `/api/v1/evaluate-forecast`): Chronological backtest evaluation.
- **`GET /api/v1/forecast/models`**: Model registry and active version metadata.
- **`POST /api/v1/optimization/solve`** (and legacy `/api/v1/optimize`): Google OR-Tools CP-SAT inventory allocation solver.
- **`POST /api/v1/optimization/simulate`** (and legacy `/api/v1/scenario/simulate`): Disruption simulation.
- **`GET /api/v1/optimization/runs`**: In-memory list of recent solver and simulation runs.
- **`GET /api/v1/optimization/runs/{run_id}`**: Run detail by run identifier.

