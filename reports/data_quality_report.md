# SupplyShield AI — Comprehensive Data Quality & Integrity Audit

**Source Dataset:** `supply_chain_dataset1.csv.bak`  
**Audit Timestamp:** 2026-10-25T04:40:00Z  
**Auditor:** SupplyShield AI Senior Data & ML Engineering Team  
**Scope:** Canonical verification, data integrity, time-series continuity, inventory conservation, and leakage analysis.

---

## 1. Executive Summary

| Category | Finding | Operational Risk | Action Required |
| :--- | :--- | :--- | :--- |
| **Row & Schema Integrity** | 91,250 rows, 15 columns, 0 nulls, 0 duplicate keys | None | Retain pristine original, build canonical pipeline. |
| **Stockout Labeling** | `Stockout_Flag` is **100% Zero** across all 91,250 rows | High | **Do NOT train a supervised stockout classifier**. Use defensible rule-based inventory health flags ($Inv \le ROP$). |
| **Target Leakage** | `Demand_Forecast` has 0.949 correlation to contemporaneous sales | Critical | **Prohibit using `Demand_Forecast` as an input feature**. Treat as a synthetic baseline only. |
| **Regional Semantics** | Every warehouse operates across all 4 regions daily | Moderate | Clarify that `Region` represents destination/sales channel, not physical warehouse GPS. |
| **Inventory Physics** | Exact 100% adherence to $Inv_t = Inv_{t-1} + Order_t - Sales_t$ | None (Positive) | Leveraged for deterministic distribution optimization and reorder scheduling. |

---

## 2. Dataset Schema & Completeness

- **File Size:** 6,552,486 bytes (~6.25 MB)
- **Dimensions:** 91,250 rows $\times$ 15 columns
- **Exact Duplicate Rows:** 0
- **Duplicate Composite Keys (`Date, SKU_ID, Warehouse_ID`):** 0
- **Total Missing / Null Values:** 0 (0.00%)

### Entity Cardinalities
- **Unique SKUs:** 50 (`SKU_1` to `SKU_50`)
- **Unique Warehouses:** 5 (`WH_1` to `WH_5`)
- **Unique Suppliers:** 10 (`SUP_1` to `SUP_10`)
- **Unique Regions:** 4 (`North`, `South`, `East`, `West`)
- **Total Series Grid:** 5 warehouses $\times$ 50 SKUs = **250 distinct time-series**.

---

## 3. Temporal Coverage & Continuity

- **Date Range:** `2024-01-01` to `2024-12-30` (Full year 2024).
- **Days Spanned:** 365 consecutive calendar days.
- **Leap Year Note:** 2024 has 366 days; day 366 (`2024-12-31`) was omitted in the source dataset.
- **Series Continuity:** Every single $(Warehouse, SKU)$ pair has **exactly 365 daily observations** without any missing dates or gaps (250 $\times$ 365 = 91,250 rows).

---

## 4. Numeric Range & Business Rule Validation

| Column Name | Data Type | Min | Max | Mean | Std Dev | Negatives | Validity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Units_Sold` | `int64` | 0.0 | 59.0 | 20.0546 | 9.0686 | 0 | Valid non-negative demand |
| `Inventory_Level` | `int64` | 168.0 | 990.0 | 471.5223 | 133.488 | 0 | Never drops below 168 |
| `Supplier_Lead_Time_Days` | `int64` | 2.0 | 14.0 | 7.984 | 3.9079 | 0 | Constant per (WH, SKU) |
| `Reorder_Point` | `int64` | 201.0 | 398.0 | 300.068 | 54.8799 | 0 | Constant per (WH, SKU) |
| `Order_Quantity` | `int64` | 0.0 | 499.0 | 19.2725 | 82.3408 | 0 | Periodic batch arrivals |
| `Unit_Cost` | `float64` | 5.02 | 19.76 | 12.2033 | 4.575 | 0 | Positive economic cost |
| `Unit_Price` | `float64` | 6.95 | 35.1 | 18.2618 | 7.1211 | 0 | Always > Unit_Cost |
| `Promotion_Flag` | `int64` | 0.0 | 1.0 | 0.1016 | 0.3021 | 0 | Binary (0 or 1), 10.16% active |
| `Stockout_Flag` | `int64` | 0.0 | 0.0 | 0.0 | 0.0 | 0 | **CONSTANT ZERO (100% 0)** |
| `Demand_Forecast` | `float64` | 0.0 | 61.42 | 20.082 | 9.504 | 0 | Contemporaneous target leakage |

---

## 5. Critical Inconsistencies & Analytical Findings

### 5.1 Constant Column: `Stockout_Flag`
- **Audit Value:** `Stockout_Flag == 0` for all 91,250 rows.
- **Root Cause:** In the simulation generating this data, reorders were triggered whenever inventory reached ~360, and orders arrived before inventory could drop to zero (minimum observed inventory was 168 units).
- **Engineering Directive:**
  1. Supervised stockout classification is **mathematically impossible** on single-class data ($y=0$ everywhere).
  2. Do **not** invent fake stockout records inside the canonical historical dataset.
  3. Formulate stockout risk as a **deterministic operational risk metric**:
     $$\text{Stockout Risk} = \mathbb{I}(\text{Inventory Level} \le \text{Reorder Point}) \times \left(1 - \frac{\text{Inventory Level}}{\text{Reorder Point}}\right)$$

### 5.2 Target Leakage in `Demand_Forecast`
- **Contemporaneous Correlation:** $r = 0.9493$ between `Demand_Forecast` and `Units_Sold` on the same date.
- **Lag-1 Correlation:** Only $r = 0.6065$.
- **Root Cause:** `Demand_Forecast` was synthesized by adding Gaussian noise $\mathcal{N}(0, 3)$ to actual same-day sales.
- **Engineering Directive:** Never include `Demand_Forecast` as an input feature for ML models. Any true forecast model must be trained strictly on historical observations available prior to the forecast origin date.

### 5.3 Region vs. Warehouse Semantics
- Every warehouse (`WH_1` through `WH_5`) is logged with all 4 regions in roughly equal proportions (~4,500 rows per region per warehouse).
- **Conclusion:** `Region` is not a static warehouse attribute (e.g. WH_1 is not located in the North). Rather, it denotes the customer demand zone or destination territory served on that date.

### 5.4 Inventory Balance Law Adherence
- Evaluated transitions across all 91,000 forward dates:
  $$\text{Inventory}_t = \text{Inventory}_{t-1} + \text{Order\_Quantity}_t - \text{Units\_Sold}_t$$
- **Match Rate:** Exactly **91,000 / 91,000 (100.00%)**.
- The dataset perfectly satisfies discrete-time mass conservation.

---

## 6. Pipeline Action Items

1. **Format Standardization:** Convert source `.csv.bak` to clean Parquet (`data/processed/supply_chain_daily.parquet`) and CSV with standardized snake_case column names and strict typing.
2. **Leak-Free Feature Engineering:** Build modular lag and rolling features computed strictly within $(Warehouse, SKU)$ partitions with explicit `.shift(1)` offsets.
3. **Chronological Splitting:**
   - **Training Set:** `2024-01-01` to `2024-09-30` (9 months)
   - **Validation Set:** `2024-10-01` to `2024-10-31` (1 month)
   - **Test Set:** `2024-11-01` to `2024-12-30` (2 months)
4. **Preserve Raw Dataset:** The file `data/supply_chain_dataset1.csv.bak` remains unmodified as the gold-standard source of truth.
