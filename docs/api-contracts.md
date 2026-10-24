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

## 2. FastAPI ML Service Endpoints (`http://127.0.0.1:8000`)

### Health & Readiness
- **`GET /health`** (and alias `/api/v1/health`): Liveness probe.
- **`GET /health/ready`** (and alias `/api/v1/health/ready`): Readiness probe with component audit.
- **`GET /api/v1/data/validate`**: Validates schema and referential integrity of CSV datasets.
- **`POST /api/v1/forecast`**: Demand forecasting.
- **`POST /api/v1/optimize`**: Google OR-Tools CP-SAT inventory allocation.
- **`POST /api/v1/scenario/simulate`**: Disruption simulation.
