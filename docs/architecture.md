# SupplyShield AI — System Architecture

## 1. Overview
SupplyShield AI is an adaptive distribution intelligence and inventory optimization platform designed for FMCG supply chain resilience. It combines client-facing REST APIs and workflow management with deterministic mathematical optimization (Google OR-Tools MILP) and machine learning forecasting.

```mermaid
flowchart TD
    subgraph Client Tier
        UI[React / Vite Frontend]
    end

    subgraph Application Tier [Express.js Backend - Port 5000]
        Router[REST API Router]
        Auth[JWT & OAuth Security]
        Validation[Zod Validation Layer]
        Orchestration[Workflow Orchestrator]
        MLClient[FastAPI Integration Client]
        Logger[Pino Structured Logger]
    end

    subgraph Data Tier
        Mongo[(MongoDB Atlas / In-Memory Mock)]
    end

    subgraph Compute Tier [FastAPI ML Service - Port 8000]
        Health[Health & Readiness Probes]
        Validator[Schema & Relational Integrity]
        Forecasting[Demand Forecasting Engine]
        Optimizer[Google OR-Tools CP-SAT Solver]
        Scenario[Disruption Sandbox & Simulation]
    end

    UI -->|HTTP / JSON /api/v1| Router
    Router --> Auth
    Router --> Validation
    Validation --> Orchestration
    Orchestration -->|Mongoose ODM| Mongo
    Orchestration -->|Internal HTTP / Correlation ID| MLClient
    MLClient -->|HTTP / Port 8000| Compute Tier
```

## 2. Component Boundaries & Responsibilities

### Node.js / Express Backend (`InnovateX/backend`)
- **Client-Facing REST APIs**: Serves all authenticated and public frontend traffic.
- **Authentication & Authorization**: Issues and verifies JSON Web Tokens (JWT) with optional HttpOnly cookie support and Google OAuth 2.0.
- **Data Persistence**: MongoDB persistence via Mongoose schemas for users, audit logs, scenarios, and plans. Includes seamless offline in-memory fallback for local dev.
- **Input Validation**: Strict request payload schema validation using Zod.
- **Workflow Orchestration**: Manages optimization run lifecycle, approval workflows, and audit history.
- **ML Integration**: `MlClient` safely communicates with the Python ML service with deterministic timeouts, correlation tracking, and safe error normalization.
- **Observability**: Structured, redacted logging via Pino (`pino-http`).
- **Security**: Rate limiting via `express-rate-limit`, CSP & secure headers via `helmet`, explicit CORS controls.

### Python / FastAPI ML Service (`ml-service`)
- **Demand Forecasting**: Classical and baseline time-series forecasting (Seasonal Naive, Moving Averages, Historical Average).
- **Forecast Evaluation**: Backtesting with holdout splits and metric calculations (MAE, RMSE, WAPE, Bias).
- **Distribution Optimization**: Deterministic multi-echelon warehouse-to-store stock allocation solved with Google OR-Tools CP-SAT.
- **Disruption Simulation**: Scenario evaluation modeling lane closures, warehouse shutdowns, and demand surges with delta calculations against baselines.
- **Strict Boundary**: No numerical optimization is delegated to LLMs. All optimization adheres to verifiable mathematical constraints.

## 3. Communication Contract
- The frontend interacts exclusively with the Express backend (`/api/v1/*`).
- Express invokes the FastAPI service internally (`http://127.0.0.1:8000`).
- Every cross-service request carries `x-correlation-id` for distributed tracing without exposing secrets.

## 4. Phase 4 Mathematical Optimization Formulation (Google OR-Tools CP-SAT)

The distribution optimization engine solves a deterministic multi-commodity, capacitated network flow with shortage penalties using Google OR-Tools CP-SAT integer programming solver.

### Sets & Indices
- $w \in W$: Source warehouses ($|W| = 3$: Central, North, South in benchmark network; 5 in baseline CSV).
- $s \in S$: Destination retail stores or regional destinations ($|S| = 12$).
- $p \in P$: Product SKUs ($|P| = 20$).
- $L \subseteq W \times S$: Set of valid, active, non-disrupted transportation lanes.
- $H$: Planning horizon in days ($H \in [1, 30]$, default $H = 7$).

### Decision Variables
- $x_{w,s,p} \in \mathbb{Z}_{\ge 0}$: Integer units of product $p$ allocated from warehouse $w$ to store/region $s$ over planning horizon $H$.
- $u_{s,p} \in \mathbb{Z}_{\ge 0}$: Integer unmet shortage units for store/region $s$ and product $p$.

### Parameters & Units
- $\text{stock}_{w,p} \in \mathbb{Z}_{\ge 0}$: Available on-hand inventory at warehouse $w$ for SKU $p$ (units).
- $\text{store\_inv}_{s,p} \in \mathbb{Z}_{\ge 0}$: Physical inventory already located at store $s$ for SKU $p$ (units).
- $\text{demand}_{s,p} \in \mathbb{Z}_{\ge 0}$: Total forecasted or scenario demand at store $s$ for SKU $p$ over horizon $H$ (units).
- $\text{gross\_req}_{s,p} = \max(0, \text{demand}_{s,p} - \text{store\_inv}_{s,p})$: Net warehouse replenishment required (units).
- $c_{w,s} \in \mathbb{R}_{\ge 0}$: Unit transportation freight cost on lane $(w,s)$ in USD ($\$/\text{unit}$). Scaled integer factor $10^4$ applied for CP-SAT.
- $\pi \in \mathbb{R}_{> 0}$: Configurable shortage penalty per unit of unfulfilled demand (default $\pi = \$100.0/\text{unit}$).
- $\text{cap}_{w,s} \in \mathbb{Z}_{\ge 0}$: Daily lane throughput capacity (units/day). Total horizon capacity is $\text{cap}_{w,s} \times H$.

### Mathematical Objective Function
$$\min Z = \sum_{w \in W} \sum_{s \in S} \sum_{p \in P} c_{w,s} \cdot x_{w,s,p} + \sum_{s \in S} \sum_{p \in P} \pi \cdot u_{s,p}$$

### Operational Constraints
1. **Warehouse Supply Conservation**: Dispatched quantity cannot exceed available stock.
   $$\sum_{s \in S} x_{w,s,p} \le \text{stock}_{w,p} \quad \forall w \in W, \forall p \in P$$
2. **Demand Balance with Shortage**: Every store's gross requirement must be fulfilled by shipments or accounted as shortage.
   $$\sum_{w \in W} x_{w,s,p} + u_{s,p} = \text{gross\_req}_{s,p} \quad \forall s \in S, \forall p \in P$$
3. **Lane Capacity Bounds**: Total multi-SKU units shipped cannot exceed aggregate lane capacity.
   $$\sum_{p \in P} x_{w,s,p} \le \text{cap}_{w,s} \cdot H \quad \forall (w,s) \in L$$
4. **Lane Ineligibility & Disruption Zeroing**:
   $$x_{w,s,p} = 0 \quad \forall (w,s) \notin L, \forall p \in P$$
5. **Integer Non-Negativity**:
   $$x_{w,s,p} \in \mathbb{Z}_{\ge 0}, \quad u_{s,p} \in \mathbb{Z}_{\ge 0}$$

### Solver Status Codes
- **`OPTIMAL`**: Proven global optimum found by CP-SAT within time limit.
- **`FEASIBLE`**: Valid integer solution satisfying all constraints found, but search stopped at time limit before proving optimality.
- **`INFEASIBLE`**: Mathematical model has no solution satisfying all active constraints.
- **`MODEL_INVALID`**: Parameter bounds or domain specifications were violated.

### Deterministic Baseline Comparison
To objectively measure optimization value, every optimization run executes a deterministic greedy baseline alongside CP-SAT:
- Sorts destination store requirements in descending demand urgency.
- For each requirement, iterates available lanes sorted by lowest unit cost.
- Dispatches stock up to available warehouse inventory and remaining lane capacity.
- Records baseline transportation cost, unmet demand, and runtime under identical inputs.

### Scenario Simulation & Resilience Engine
Each simulation shock creates an immutable in-memory copy of the baseline topology:
- **`warehouse_outage`**: Zeros out source warehouse stock and disables all incoming/outgoing lanes.
- **`route_closure`**: Disables specific $(w,s)$ transport lane.
- **`lane_capacity_reduction`**: Applies fractional capacity multiplier $\alpha \in [0, 1]$.
- **`warehouse_stock_reduction`**: Scales available stock by factor $\beta \in [0, 1]$.
- **`demand_spike`**: Surges demand by multiplier $\gamma \in [1.0, 5.0]$.
Both baseline and disrupted models are re-solved to produce quantified cost and shortage deltas, bottleneck root-cause analysis, and recommended rerouting actions.

