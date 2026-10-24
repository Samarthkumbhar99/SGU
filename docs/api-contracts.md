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

## 2. FastAPI ML Service Endpoints (`http://127.0.0.1:8000`)

### Health & Readiness
- **`GET /health`** (and alias `/api/v1/health`): Liveness probe.
- **`GET /health/ready`** (and alias `/api/v1/health/ready`): Readiness probe with component audit.
- **`GET /api/v1/data/validate`**: Validates schema and referential integrity of CSV datasets.
- **`POST /api/v1/forecast`**: Demand forecasting.
- **`POST /api/v1/optimize`**: Google OR-Tools CP-SAT inventory allocation.
- **`POST /api/v1/scenario/simulate`**: Disruption simulation.
