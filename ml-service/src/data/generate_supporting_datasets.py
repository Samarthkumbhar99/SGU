"""Deterministic generator for supporting multi-echelon distribution topology datasets.

Generates:
1. data/demo/stores.csv
2. data/demo/transport_lanes.csv
3. data/demo/inventory_batches.csv
4. data/demo/disruption_scenarios.csv
5. data/demo/warehouses.csv
6. data/demo/products.csv

All records are explicitly labelled as synthetic benchmarks with configurable seed.
"""

from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd


def generate_supporting_datasets(output_dir: Optional[Path] = None, seed: int = 42):
    """Generate deterministic synthetic distribution network datasets."""
    repo_root = Path(__file__).resolve().parents[3]
    out_dir = output_dir or (repo_root / "data" / "demo")
    out_dir.mkdir(parents=True, exist_ok=True)

    np.random.seed(seed)

    # 1. Warehouses (3 Regional Hubs)
    warehouses_data = [
        {
            "warehouse_id": "WH-CENTRAL",
            "warehouse_name": "Central Hub (Fictional Demo)",
            "region": "Central",
            "latitude": 19.076,
            "longitude": 72.877,
            "storage_capacity_units": 50000,
        },
        {
            "warehouse_id": "WH-NORTH",
            "warehouse_name": "North DC (Fictional Demo)",
            "region": "North",
            "latitude": 28.704,
            "longitude": 77.102,
            "storage_capacity_units": 45000,
        },
        {
            "warehouse_id": "WH-SOUTH",
            "warehouse_name": "South Logistics (Fictional Demo)",
            "region": "South",
            "latitude": 13.082,
            "longitude": 80.270,
            "storage_capacity_units": 45000,
        },
    ]
    df_wh = pd.DataFrame(warehouses_data)
    df_wh.to_csv(out_dir / "warehouses.csv", index=False)

    # 2. Stores (12 Retail Outlets)
    stores_data = []
    regions = ["Central", "North", "South", "West"]
    priorities = ["P1_CRITICAL", "P2_STANDARD", "P3_FLEXIBLE"]

    for i in range(1, 13):
        s_id = f"STORE-{i:02d}"
        reg = regions[(i - 1) % len(regions)]
        prio = priorities[(i - 1) % len(priorities)]
        cap = 5000 if prio == "P1_CRITICAL" else 4000
        stores_data.append({
            "store_id": s_id,
            "store_name": f"Retail Outlet {i:02d} (Synthetic)",
            "region_id": reg,
            "region": reg,  # alias for backward compatibility
            "latitude": round(15.0 + i * 1.15, 3),
            "longitude": round(73.0 + i * 0.85, 3),
            "storage_capacity": cap,
            "store_capacity_units": cap,  # alias
            "service_priority": prio,
        })
    df_stores = pd.DataFrame(stores_data)
    df_stores.to_csv(out_dir / "stores.csv", index=False)

    # 3. Products (20 SKUs)
    categories = ["Dairy", "Bakery", "Beverages", "Produce", "Snacks"]
    products_data = []
    for i in range(1, 21):
        p_id = f"SKU-{i:03d}"
        cat = categories[(i - 1) % len(categories)]
        cost = round(2.0 + (i * 0.75), 2)
        price = round(cost * 1.5, 2)
        products_data.append({
            "product_id": p_id,
            "sku": p_id,
            "product_name": f"Consumer Good {i:02d} (Synthetic)",
            "category": cat,
            "unit_of_measure": "unit",
            "unit_cost": cost,
            "unit_price": price,
            "pack_size": 1,
            "shelf_life_days": 30 + (i * 5),
        })
    df_products = pd.DataFrame(products_data)
    df_products.to_csv(out_dir / "products.csv", index=False)

    # 4. Transport Lanes (3 warehouses x 12 stores = 36 lanes)
    lanes_data = []
    for wh in warehouses_data:
        w_id = wh["warehouse_id"]
        for st in stores_data:
            s_id = st["store_id"]
            lane_id = f"{w_id}__{s_id}"
            dist = round(120.0 + (abs(hash(lane_id)) % 350), 1)
            transit_hours = round(dist / 45.0, 1)  # ~45 km/h freight speed
            cost_unit = round(0.15 + (dist * 0.0005), 2)
            cost_shipment = round(50.0 + (dist * 0.10), 2)
            capacity = 2500

            lanes_data.append({
                "lane_id": lane_id,
                "source_warehouse_id": w_id,
                "destination_store_id": s_id,
                "distance_km": dist,
                "distance_km_estimate": dist,  # alias
                "transit_time_hours": transit_hours,
                "lead_time_hours": transit_hours,  # alias
                "cost_per_shipment": cost_shipment,
                "cost_per_unit": cost_unit,
                "unit_transport_cost": cost_unit,  # alias
                "lane_capacity": capacity,
                "capacity_units_per_day": capacity,  # alias
                "lane_available": True,
                "availability_status": "available",  # alias
            })
    df_lanes = pd.DataFrame(lanes_data)
    df_lanes.to_csv(out_dir / "transport_lanes.csv", index=False)

    # 5. Inventory Batches
    batches_data = []
    b_idx = 1
    today = pd.Timestamp("2026-01-01")
    for wh in warehouses_data:
        w_id = wh["warehouse_id"]
        for prod in products_data:
            p_id = prod["product_id"]
            shelf_life = prod["shelf_life_days"]
            exp_date = (today + pd.Timedelta(days=shelf_life)).strftime("%Y-%m-%d")
            qty = 10000

            batches_data.append({
                "batch_id": f"BATCH-{b_idx:04d}",
                "sku_id": p_id,
                "product_id": p_id,  # alias
                "location_id": w_id,
                "location_type": "warehouse",
                "batch_number": f"LOT-{b_idx:04d}",
                "available_quantity": qty,
                "quantity_available": qty,  # alias
                "reserved_quantity": 0,
                "quantity_reserved": 0,  # alias
                "snapshot_date": "2025-12-31",
                "expiry_date": exp_date,
                "days_to_expiry": shelf_life,
            })
            b_idx += 1
    df_batches = pd.DataFrame(batches_data)
    df_batches.to_csv(out_dir / "inventory_batches.csv", index=False)

    # 6. Disruption Scenarios
    scenarios_data = [
        {
            "scenario_id": "SCN-001",
            "scenario_name": "North Corridor Lane Closure",
            "affected_location_or_lane": "WH-NORTH__STORE-01",
            "target_id": "WH-NORTH__STORE-01",  # alias
            "disruption_type": "route_closure",
            "start_time": "2026-02-01T00:00:00Z",
            "duration_hours": 72,
            "capacity_reduction_fraction": 1.0,
            "change_value": "unavailable",  # alias
            "demand_multiplier": 1.0,
            "description": "Complete highway shutdown on northern freight lane to Retail Outlet 01.",
        },
        {
            "scenario_id": "SCN-002",
            "scenario_name": "South Logistics Congestion",
            "affected_location_or_lane": "WH-SOUTH__STORE-04",
            "target_id": "WH-SOUTH__STORE-04",  # alias
            "disruption_type": "delivery_delay",
            "start_time": "2026-02-05T06:00:00Z",
            "duration_hours": 48,
            "capacity_reduction_fraction": 0.50,
            "change_value": "0.50",  # alias
            "demand_multiplier": 1.0,
            "description": "50% throughput choking on southern lane due to port transit delay.",
        },
        {
            "scenario_id": "SCN-003",
            "scenario_name": "Western Regional Retail Surge",
            "affected_location_or_lane": "STORE-01",
            "target_id": "STORE-01",  # alias
            "disruption_type": "demand_spike",
            "start_time": "2026-02-10T00:00:00Z",
            "duration_hours": 96,
            "capacity_reduction_fraction": 0.0,
            "change_value": "0.30",  # alias
            "demand_multiplier": 1.30,
            "description": "30% unexpected retail demand surge across western stores during flash sale.",
        },
    ]
    df_scenarios = pd.DataFrame(scenarios_data)
    df_scenarios.to_csv(out_dir / "disruption_scenarios.csv", index=False)
    # Also save as scenarios.csv for backwards compatibility with scenario service
    df_scenarios.to_csv(out_dir / "scenarios.csv", index=False)

    print(f"Generated supporting synthetic distribution datasets in {out_dir}:")
    print(f"  - stores.csv:              {len(df_stores)} stores")
    print(f"  - transport_lanes.csv:     {len(df_lanes)} lanes")
    print(f"  - inventory_batches.csv:   {len(df_batches)} batches")
    print(f"  - disruption_scenarios.csv:{len(df_scenarios)} scenarios")
    print(f"  - warehouses.csv:          {len(df_wh)} hubs")
    print(f"  - products.csv:            {len(df_products)} SKUs")


if __name__ == "__main__":
    generate_supporting_datasets()
