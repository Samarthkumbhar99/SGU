"""Google OR-Tools CP-SAT inventory allocation optimization engine."""

import time
from typing import Dict, List, Optional, Set, Tuple
from ortools.sat.python import cp_model

from src.schemas.optimization import AllocationRecord, PlanSummary, StoreProductDemandSummary


class AllocationOptimizer:
    """Solves deterministic warehouse-to-store inventory allocation using OR-Tools CP-SAT.

    Decision Variables:
        x[w, s, p]: Integer units of product p allocated from warehouse w to store s.
        u[s, p]: Integer unmet demand shortage for store s and product p.

    Constraints:
        1. Warehouse stock conservation: sum_s(x[w, s, p]) <= available_stock[w, p]
        2. Demand satisfaction balance: sum_w(x[w, s, p]) + u[s, p] == gross_req[s, p]
        3. Lane validity: x[w, s, p] == 0 if (w, s) not in valid_lanes
        4. Lane capacity: sum_p(x[w, s, p]) <= daily_capacity[w, s] * horizon_days
        5. Non-negativity: x[w, s, p] >= 0, u[s, p] >= 0

    Objective:
        Minimize:
            sum_{s, p} (shortage_penalty * u[s, p])
          + sum_{w, s, p} (unit_transport_cost * x[w, s, p])
    """

    def __init__(
        self,
        warehouse_stock: Dict[Tuple[str, str], int],
        store_inventory: Dict[Tuple[str, str], int],
        forecast_demand: Dict[Tuple[str, str], int],
        valid_lanes: Set[Tuple[str, str]],
        lane_costs: Dict[Tuple[str, str], float],
        lane_lead_times: Dict[Tuple[str, str], float],
        lane_capacities: Dict[Tuple[str, str], int],
        stores: List[str],
        products: List[str],
        warehouses: List[str],
        planning_horizon_days: int = 7,
        shortage_penalty_per_unit: float = 100.0,
        transport_cost_multiplier: float = 1.0,
        solver_time_limit_seconds: float = 10.0,
    ):
        self.warehouse_stock = warehouse_stock
        self.store_inventory = store_inventory
        self.forecast_demand = forecast_demand
        self.valid_lanes = valid_lanes
        self.lane_costs = lane_costs
        self.lane_lead_times = lane_lead_times
        self.lane_capacities = lane_capacities
        self.stores = sorted(stores)
        self.products = sorted(products)
        self.warehouses = sorted(warehouses)
        self.horizon_days = planning_horizon_days
        self.shortage_penalty = shortage_penalty_per_unit
        self.transport_mult = transport_cost_multiplier
        self.time_limit = solver_time_limit_seconds

    def solve(self) -> Tuple[str, float, List[AllocationRecord], List[StoreProductDemandSummary], PlanSummary]:
        start_time = time.perf_counter()

        model = cp_model.CpModel()

        # Decision Variables
        # x[(w, s, p)] - integer units shipped
        x: Dict[Tuple[str, str, str], cp_model.IntVar] = {}
        # u[(s, p)] - integer unmet shortage
        u: Dict[Tuple[str, str], cp_model.IntVar] = {}

        # 1. Precalculate gross requirements for each store-SKU
        gross_requirements: Dict[Tuple[str, str], int] = {}
        for s in self.stores:
            for p in self.products:
                f_dem = self.forecast_demand.get((s, p), 0)
                on_hand = self.store_inventory.get((s, p), 0)
                req = max(0, f_dem - on_hand)
                gross_requirements[(s, p)] = req

                # Max possible shortage is the gross requirement itself
                u[(s, p)] = model.NewIntVar(0, req, f"shortage_{s}_{p}")

        # 2. Create allocation variables only for valid lanes and available stock
        for w in self.warehouses:
            for s in self.stores:
                is_lane_valid = (w, s) in self.valid_lanes
                for p in self.products:
                    avail_stock = self.warehouse_stock.get((w, p), 0)
                    gross_req = gross_requirements[(s, p)]

                    if not is_lane_valid or avail_stock == 0 or gross_req == 0:
                        # Fixed to zero if lane invalid, no stock, or no requirement
                        x[(w, s, p)] = model.NewConstant(0)
                    else:
                        upper_bound = min(avail_stock, gross_req)
                        x[(w, s, p)] = model.NewIntVar(0, upper_bound, f"alloc_{w}_{s}_{p}")

        # 3. Constraint: Warehouse stock conservation
        for w in self.warehouses:
            for p in self.products:
                avail_stock = self.warehouse_stock.get((w, p), 0)
                shipments_from_w_for_p = [x[(w, s, p)] for s in self.stores]
                model.Add(sum(shipments_from_w_for_p) <= avail_stock)

        # 4. Constraint: Demand satisfaction balance
        for s in self.stores:
            for p in self.products:
                req = gross_requirements[(s, p)]
                inbound_shipments = [x[(w, s, p)] for w in self.warehouses]
                model.Add(sum(inbound_shipments) + u[(s, p)] == req)

        # 5. Constraint: Lane cumulative capacity over planning horizon
        for w in self.warehouses:
            for s in self.stores:
                if (w, s) in self.valid_lanes:
                    daily_cap = self.lane_capacities.get((w, s), 100000)
                    max_horizon_cap = daily_cap * self.horizon_days
                    lane_shipments = [x[(w, s, p)] for p in self.products]
                    model.Add(sum(lane_shipments) <= max_horizon_cap)

        # 6. Objective: Minimize Scaled Integer Penalty
        # Scale factor 10,000 for precision of fractional transport costs
        SCALE = 10000
        objective_terms = []

        # Shortage penalty: shortage_penalty * SCALE * u[s, p]
        shortage_coeff = int(round(self.shortage_penalty * SCALE))
        for (s, p), u_var in u.items():
            objective_terms.append(shortage_coeff * u_var)

        # Transport cost: cost * multiplier * SCALE * x[w, s, p]
        for (w, s, p), x_var in x.items():
            cost = self.lane_costs.get((w, s), 0.0)
            cost_coeff = int(round(cost * self.transport_mult * SCALE))
            if cost_coeff > 0:
                objective_terms.append(cost_coeff * x_var)

        model.Minimize(sum(objective_terms))

        # Solve with CP-SAT
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        solver.parameters.random_seed = 20261024
        solver.parameters.num_search_workers = 1  # Guaranteed determinism

        solver_status_code = solver.Solve(model)
        runtime = round(time.perf_counter() - start_time, 4)

        status_mapping = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN",
        }
        status_str = status_mapping.get(solver_status_code, "UNKNOWN")

        if solver_status_code not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Infeasible or invalid result
            tot_f = sum(self.forecast_demand.values())
            tot_eff = sum(min(self.forecast_demand.get((s, p), 0), self.store_inventory.get((s, p), 0)) for s in self.stores for p in self.products)
            tot_sur = sum(max(0, self.store_inventory.get((s, p), 0) - self.forecast_demand.get((s, p), 0)) for s in self.stores for p in self.products)
            empty_summary = PlanSummary(
                total_forecast_demand=tot_f,
                total_store_inventory_on_hand=sum(self.store_inventory.values()),
                total_effective_store_stock_utilized=tot_eff,
                total_surplus_store_stock=tot_sur,
                total_gross_requirement=sum(gross_requirements.values()),
                total_warehouse_stock_available=sum(self.warehouse_stock.values()),
                total_allocated_units=0,
                total_unmet_demand_units=sum(gross_requirements.values()),
                total_transport_cost=0.0,
                demand_fulfillment_rate=0.0,
                overall_demand_satisfied_rate=round((tot_eff / tot_f) * 100.0, 2) if tot_f > 0 else 100.0,
                objective_score=0.0,
            )
            return status_str, runtime, [], [], empty_summary

        # Extract Optimal Solution
        allocations: List[AllocationRecord] = []
        store_summaries: List[StoreProductDemandSummary] = []

        total_allocated = 0
        total_unmet = 0
        total_transport_cost = 0.0

        for s in self.stores:
            for p in self.products:
                gross_req = gross_requirements[(s, p)]
                f_dem = self.forecast_demand.get((s, p), 0)
                on_hand = self.store_inventory.get((s, p), 0)

                shipped_for_sku = 0
                for w in self.warehouses:
                    alloc_val = int(solver.Value(x[(w, s, p)]))
                    if alloc_val > 0:
                        shipped_for_sku += alloc_val
                        c = self.lane_costs.get((w, s), 0.0)
                        lt = self.lane_lead_times.get((w, s), 0.0)
                        tot_c = round(alloc_val * c, 4)
                        total_transport_cost += tot_c

                        allocations.append(
                            AllocationRecord(
                                warehouse_id=w,
                                store_id=s,
                                product_id=p,
                                allocated_units=alloc_val,
                                unit_transport_cost=c,
                                total_transport_cost=tot_c,
                                lead_time_hours=lt,
                            )
                        )

                unmet_val = int(solver.Value(u[(s, p)]))
                total_allocated += shipped_for_sku
                total_unmet += unmet_val

                store_summaries.append(
                    StoreProductDemandSummary(
                        store_id=s,
                        product_id=p,
                        store_inventory_on_hand=on_hand,
                        forecast_demand_units=f_dem,
                        gross_requirement=gross_req,
                        allocated_units=shipped_for_sku,
                        unmet_demand_units=unmet_val,
                    )
                )

        total_forecast = sum(self.forecast_demand.values())
        total_store_on_hand = sum(self.store_inventory.values())
        total_gross_req = sum(gross_requirements.values())
        total_wh_avail = sum(self.warehouse_stock.values())

        # Exact store-level inventory accounting
        total_effective_store_stock = sum(
            min(self.forecast_demand.get((s, p), 0), self.store_inventory.get((s, p), 0))
            for s in self.stores for p in self.products
        )
        total_surplus_store_stock = sum(
            max(0, self.store_inventory.get((s, p), 0) - self.forecast_demand.get((s, p), 0))
            for s in self.stores for p in self.products
        )

        fulfillment_rate = (
            round((total_allocated / total_gross_req) * 100.0, 2) if total_gross_req > 0 else 100.0
        )
        overall_satisfied_rate = (
            round(((total_effective_store_stock + total_allocated) / total_forecast) * 100.0, 2)
            if total_forecast > 0 else 100.0
        )
        objective_score = round(
            (total_unmet * self.shortage_penalty) + (total_transport_cost * self.transport_mult),
            2,
        )

        plan_summary = PlanSummary(
            total_forecast_demand=total_forecast,
            total_store_inventory_on_hand=total_store_on_hand,
            total_effective_store_stock_utilized=total_effective_store_stock,
            total_surplus_store_stock=total_surplus_store_stock,
            total_gross_requirement=total_gross_req,
            total_warehouse_stock_available=total_wh_avail,
            total_allocated_units=total_allocated,
            total_unmet_demand_units=total_unmet,
            total_transport_cost=round(total_transport_cost, 2),
            demand_fulfillment_rate=fulfillment_rate,
            overall_demand_satisfied_rate=overall_satisfied_rate,
            objective_score=objective_score,
        )

        return status_str, runtime, allocations, store_summaries, plan_summary
