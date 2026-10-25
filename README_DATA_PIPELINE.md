# SupplyShield AI: Production-Ready Intelligence Pipeline & Inventory Engine

SupplyShield AI is an enterprise-grade **Distribution Intelligence & Inventory Optimization Engine** designed to solve SKU-level demand forecasting, multi-echelon stock health monitoring, continuous-review replenishment planning, and integer-constrained warehouse-to-store distribution optimization under disruption conditions.

This document details the end-to-end data pipeline, mathematical formulations, critical dataset audit findings, forecasting benchmarks, and exact commands required to reproduce all results deterministically.

---

## 1. System Architecture & End-to-End Flow

```
[Raw Backup: supply_chain_dataset1.csv.bak] (Pristine, Read-Only)
                     │
                     ▼
       ┌───────────────────────────────┐
       │   scripts/audit_dataset.py    │ ──► reports/data_quality_report.md & .json
       └───────────────────────────────┘     reports/data_assumptions.md
                     │
                     ▼
       ┌───────────────────────────────┐
       │     Canonical Pipeline        │ ──► data/processed/supply_chain_daily.parquet
       │   (ml-service/src/data/)      │ ──► data/processed/supply_chain_daily.csv
       └───────────────────────────────┘ ──► data/processed/data_dictionary.json
                     │
         ┌───────────┴─────────────────────────────┐
         ▼                                         ▼
┌──────────────────────────────┐       ┌─────────────────────────────────────┐
│  Leakage-Free Features       │       │  Demo Topology Generation           │
│  (Lags, Rolling Stds/Means)  │       │  (Stores, Lanes, Batches, Scenarios)│
└──────────────────────────────┘       └─────────────────────────────────────┘
         │                                         │
         ▼                                         ▼
┌──────────────────────────────┐       ┌─────────────────────────────────────┐
│  Demand Forecasting          │       │  Inventory Planning (ROP / SS / ROQ)│
│  (Moving Avg, LightGBM,      │       │  & Google OR-Tools CP-SAT Optimizer │
│   Ridge, Naive, SNaive)      │       │  (Multi-Commodity Capacitated Flow) │
└──────────────────────────────┘       └─────────────────────────────────────┘
         │                                         │
         ▼                                         ▼
reports/model_evaluation.md           reports/optimization_evaluation.md
         │                                         │
         └───────────────────┬─────────────────────┘
                             │
                             ▼
              ┌───────────────────────────────┐
              │  FastAPI ML Service (/api/v1) │
              │  + Automated Test Suite       │
              │  (77 / 77 Pytest Passed)      │
              └───────────────────────────────┘
```

---

## 2. Key Audit Findings & Ground-Truth Discoveries

The automated audit (`scripts/audit_dataset.py`) evaluated all 91,250 records across 15 columns from `data/supply_chain_dataset1.csv.bak` without modifying or deleting the source.

| Finding Category | Metric / Reality | Engineering Decision |
| :--- | :--- | :--- |
| **Row Count & Date Range** | 91,250 daily records (2024-01-01 to 2024-12-30) | Full 365 calendar days present with zero date gaps across all 50 SKUs × 5 Warehouses (250 distinct series). |
| **Stockout_Flag Ground Truth** | **100% Constant Zero** (Min inventory: 168 units) | **Supervised stockout classification is strictly prohibited.** Positive historical labels are NOT invented. Replaced with deterministic continuous-review breach alerts ($Inv \le ROP$). |
| **Demand_Forecast Target Leakage** | Pearson correlation $r = 0.949$ with same-day `Units_Sold` ($MAE = 2.38$) | The source forecast was synthesized via $Units\_Sold + \mathcal{N}(0, 3)$. **Strictly excluded from ML training features** to eliminate contemporaneous lookahead leakage. |
| **Inventory Physics Balance** | $Inv_t = Inv_{t-1} + Order_t - Sales_t$ holds in **100% of rows** | Inventory transition equation verified across all 91,000 day-over-day steps with zero mathematical violations. |
| **Regional Semantics** | Each warehouse appears uniformly (~25%) across North, South, East, West | `Region` designates the **destination retail market**, not fixed warehouse real estate. Topology generator models dedicated warehouse-to-store logistics. |

---

## 3. Forecasting Benchmark & Model Leaderboard

Evaluated on strict chronological split:
- **Training**: Jan 29, 2024 – Sep 30, 2024 (61,500 observations)
- **Validation**: Oct 01, 2024 – Oct 31, 2024 (7,750 observations)
- **Held-Out Test**: Nov 01, 2024 – Dec 30, 2024 (15,000 observations)

### Held-Out Test Evaluation Results
| Rank | Model Name | Test MAE | Test RMSE | Test WAPE (%) | Bias (MFE) | Baseline Improvement |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 🥇 | **14-Day Moving Average** | **4.4087** | **5.5262** | **28.75%** | +0.0169 | **+31.4% vs Naive** |
| 🥈 | **Ridge Regression (L2)** | 4.4116 | 5.5298 | 28.77% | +0.0195 | +31.3% vs Naive |
| 🥉 | **LightGBM Regressor** | 6.0648 | 7.6327 | 39.55% | -0.1982 | +5.6% vs Naive |
| 4 | **Naive Baseline (Lag-1)** | 6.4259 | 8.0831 | 41.91% | +0.0270 | 0.0% (Anchor) |
| 5 | **Seasonal Naive (Lag-7)** | 6.4389 | 8.0991 | 41.99% | +0.0409 | -0.2% vs Naive |

*Note: For steady-state stationary demand, Moving Average serves as the robust production fallback, while LightGBM is trained to model promotional surges and discount price elasticity.*

---

## 4. Inventory Planning & Optimization Formulations

### Continuous-Review Inventory Policy
- **Safety Stock ($SS$)**:
  - Constant Lead Time: $SS = z \cdot \sigma_d \cdot \sqrt{L}$
  - Stochastic Lead Time: $SS = z \cdot \sqrt{L \cdot \sigma_d^2 + \mu_d^2 \cdot \sigma_L^2}$
- **Reorder Point ($ROP$)**:
  $$ROP = (\mu_d \cdot L) + SS$$
- **Recommended Order Quantity ($ROQ$)**:
  $$ROQ = \left\lceil \frac{\max(\text{TargetStock} - \text{NetInventory}, \text{MOQ})}{\text{PackSize}} \right\rceil \times \text{PackSize}$$

### Google OR-Tools CP-SAT Distribution Optimizer
- **Decision Variables**:
  - $x_{w, s, p} \in \mathbb{Z}_{\ge 0}$: Integer units shipped from warehouse $w$ to store $s$ of SKU $p$.
  - $u_{s, p} \in \mathbb{Z}_{\ge 0}$: Integer unmet shortage at destination $s$.
- **Objective**:
  $$\min \sum_{s, p} (c_{\text{shortage}} \cdot u_{s, p}) + \sum_{w, s, p} (c_{w, s} \cdot x_{w, s, p})$$
  *(Shortage penalty $c_{\text{shortage}} = \$100.00/\text{unit}$ ensures stockout mitigation precedes freight economy).*
- **Guaranteed Constraints**:
  1. $\sum_s x_{w, s, p} \le \text{AvailableStock}_{w, p}$ (Zero phantom inventory)
  2. $\sum_w x_{w, s, p} + u_{s, p} = \text{GrossRequirement}_{s, p}$ (Demand balance)
  3. $\sum_p x_{w, s, p} \le \text{DailyCapacity}_{w, s} \cdot H$ (Physical lane throughput)
  4. $x_{w, s, p} = 0$ for closed/invalid lanes.

---

## 5. Step-by-Step Reproduction Commands

Execute the entire pipeline in sequence from the repository root (`E:\Hackathons\Triwizathon`):

### Step 1: Install Dependencies
```powershell
pip install -r ml-service/requirements.txt
```

### Step 2: Run Source Dataset Audit
Audits `data/supply_chain_dataset1.csv.bak` and generates data quality reports.
```powershell
python scripts/audit_dataset.py
```
*Outputs: `reports/data_quality_report.md`, `reports/data_quality_report.json`, `reports/data_assumptions.md`.*

### Step 3: Execute Canonical Data Preparation Pipeline
Standardizes types, validates business rules, and outputs Parquet and CSV files.
```powershell
cd ml-service
python -m src.data.canonical
cd ..
```
*Outputs: `data/processed/supply_chain_daily.parquet`, `data/processed/supply_chain_daily.csv`, `data/processed/data_dictionary.json`, `data/processed/quarantine.csv`.*

### Step 4: Generate Supporting Distribution Demo Topologies
Generates store catalogs, multi-lane logistics networks, inventory batches, and disruption presets.
```powershell
cd ml-service
python -m src.data.generate_supporting_datasets
cd ..
```
*Outputs: `data/demo/stores.csv`, `data/demo/transport_lanes.csv`, `data/demo/inventory_batches.csv`, `data/demo/disruption_scenarios.csv`.*

### Step 5: Feature Engineering & Model Training
Computes leakage-free temporal features and trains benchmark forecasting models.
```powershell
cd ml-service
python -m src.forecasting.train_models
cd ..
```
*Outputs: `ml-service/models/demand_lightgbm_v1.joblib`, `ml-service/models/demand_ridge_v1.joblib`, `reports/model_evaluation.md`.*

### Step 6: Distribution Optimization & Disruption Benchmarking
Executes CP-SAT allocation across normal and disrupted operating environments.
```powershell
python scripts/evaluate_optimization.py
```
*Outputs: `reports/optimization_evaluation.md`.*

### Step 7: Run Automated Test Suite
Executes 77 automated unit and integration tests across data, features, forecasting, inventory, and optimization.
```powershell
cd ml-service
python -m pytest tests
cd ..
```
*Result: 77 passed in ~5 seconds.*

### Step 8: Start the FastAPI Service
Launches the high-performance ML & Optimization API.
```powershell
cd ml-service
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
*Interactive Swagger Documentation available at: `http://localhost:8000/docs`.*

---

## 6. Documented API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check reporting service status, version, and timestamp. |
| `GET` | `/api/v1/data/quality` | Returns comprehensive schema and statistical data quality audit summary. |
| `GET` | `/api/v1/data/canonical/summary` | Returns row counts, date ranges, and schema of processed Parquet data. |
| `GET` | `/api/v1/data/validate` | Runs 12-point structural validation against demo dataset bundle. |
| `POST` | `/api/v1/forecast` | Generates 1 to 30 day demand forecast using trained models or moving average. |
| `POST` | `/api/v1/evaluate-forecast` | Evaluates user forecast against test period with MAE, RMSE, WAPE, and Bias. |
| `POST` | `/api/v1/inventory/plan` | Evaluates continuous-review replenishment, ROP, SS, and pack-size ROQ. |
| `GET` | `/api/v1/inventory/health` | Audits inventory posture across warehouses and flags stockout risk. |
| `POST` | `/api/v1/optimize` | Solves multi-echelon warehouse-to-store distribution using Google OR-Tools CP-SAT. |
| `POST` | `/api/v1/optimize/compare` | Compares CP-SAT optimal plan against greedy baseline with delta metrics. |
| `POST` | `/api/v1/scenario/simulate` | Injects disruption shocks (lane closure, stock cut, demand spike) and assesses resilience. |

---

## 7. Deliverables Index

- `reports/data_quality_report.md`: Markdown data audit and schema discovery.
- `reports/data_quality_report.json`: Machine-readable audit findings.
- `reports/data_assumptions.md`: Business logic, inventory physics, and leakage documentation.
- `reports/model_evaluation.md`: Comparative model leaderboard and validation metrics.
- `reports/optimization_evaluation.md`: Mathematical formulation, baseline benchmarks, and scenario resilience.
- `data/processed/supply_chain_daily.parquet`: High-performance columnar canonical dataset.
- `data/processed/supply_chain_daily.csv`: Comma-separated canonical dataset.
- `data/processed/data_dictionary.json`: Schema definitions, types, and column descriptions.
- `data/demo/`: Verified topologies (`stores.csv`, `transport_lanes.csv`, `inventory_batches.csv`, `scenarios.csv`).
- `ml-service/src/`: Tested modules for canonical processing, features, forecasting, inventory, and optimization.
- `ml-service/tests/`: 77 automated test cases verifying zero lookahead, constraint adherence, and error handling.
