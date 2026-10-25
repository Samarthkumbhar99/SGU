# SupplyShield AI — Data Assumptions & Business Interpretations

This document formalizes the operational and business assumptions governing the SupplyShield AI data pipeline, models, and optimization engines.

---

## 1. Inventory & Time Semantics

### 1.1 Discrete Time Stepping
- Observations are recorded daily at midnight ($T=1\text{ day}$).
- The sequence of daily events follows:
  1. Beginning-of-day on-hand inventory is observed ($I_{t-1}$).
  2. Replenishment orders arriving from suppliers on day $t$ ($Q_t$) are received and stocked.
  3. Realized customer demand ($D_t$) is satisfied up to available inventory.
  4. End-of-day inventory is recorded as $I_t = I_{t-1} + Q_t - D_t$.

### 1.2 Constant Lead Time & Reorder Points
- In the source dataset, `Supplier_Lead_Time_Days` and `Reorder_Point` are invariant per $(Warehouse, SKU)$ pair throughout 2024.
- In production, lead time may experience stochastic variability. The inventory planning engine implements standard safety stock buffers based on lead-time demand standard deviation:
  $$\text{Safety Stock} = z \times \sigma_d \times \sqrt{L}$$
  where $z=1.65$ corresponds to a 95% cycle-service level.

---

## 2. Target Leakage & Forecast Provenance

### 2.1 The `Demand_Forecast` Artifact
- The column `Demand_Forecast` in the source dataset exhibits a contemporaneous Pearson correlation of $0.949$ with same-day `Units_Sold`, with an error distribution of $\mathcal{N}(0.027, 2.98)$.
- **Assumption:** This column represents an artificial or unversioned benchmark forecast generated after the fact.
- **Rule:** Under no circumstances will `Demand_Forecast` be utilized as an input feature for training predictive models. Any production forecast must be generated using historical features known prior to day $t$.

---

## 3. Stockout Semantics & Labels

### 3.1 Single-Class Target
- `Stockout_Flag` is $0$ across all 91,250 observations.
- **Assumption:** The operational policy in the simulated history maintained inventory above minimum safety levels ($I_t \ge 168$).
- **Rule:** Supervised classification for stockouts is marked **UNAVAILABLE** in the feature registry.
- **Alternative:** Operational stockout vulnerability is computed deterministically:
  - **Healthy:** $I_t > \text{Reorder Point}$
  - **Reorder Triggered:** $0.5 \times \text{Reorder Point} < I_t \le \text{Reorder Point}$
  - **Critical Stockout Risk:** $I_t \le 0.5 \times \text{Reorder Point}$

---

## 4. Geographic & Regional Semantics

### 4.1 Meaning of the `Region` Column
- Every warehouse records roughly 25% of its rows in each of the four regions (`North`, `South`, `East`, `West`).
- **Assumption:** The warehouses are centralized regional distribution hubs, and `Region` designates the destination territory/market where the retail or customer demand originated.
- **Rule:** Warehouses must not be statically assigned to a single region based on this column. Coordinates for physical facilities are maintained in the separate topology layer (`data/demo/warehouses.csv`).

---

## 5. Economic & Financial Rules

### 5.1 Profitability & Valuation
- `Unit_Price` strictly exceeds `Unit_Cost` for all SKUs and warehouses ($0 \text{ negative margin rows}$).
- Inventory valuation is computed at cost:
  $$\text{Valuation} = \sum_{i} I_i \times \text{Unit\_Cost}_i$$
- Potential retail value is computed at price:
  $$\text{Potential Revenue} = \sum_{i} I_i \times \text{Unit\_Price}_i$$
- Shortage penalty in distribution optimization defaults to $\$100.00$ per unmet unit to strongly prioritize demand fulfillment over transportation cost.
