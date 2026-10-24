"""Generate synthetic demo dataset matching exact schemas and dimensions for SupplyShield AI ML service."""

import json
from pathlib import Path
import numpy as np
import pandas as pd

def generate_demo():
    out_dir = Path("data/demo")
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Warehouses (3)
    warehouses_data = [
        {"warehouse_id": "WH-CENTRAL", "warehouse_name": "Central Hub", "region": "Central", "latitude": 19.076, "longitude": 72.877, "storage_capacity_units": 50000},
        {"warehouse_id": "WH-NORTH", "warehouse_name": "North Distribution Center", "region": "North", "latitude": 28.704, "longitude": 77.102, "storage_capacity_units": 45000},
        {"warehouse_id": "WH-SOUTH", "warehouse_name": "South Logistics Terminal", "region": "South", "latitude": 13.082, "longitude": 80.270, "storage_capacity_units": 45000},
    ]
    df_wh = pd.DataFrame(warehouses_data)
    df_wh.to_csv(out_dir / "warehouses.csv", index=False)

    # 2. Stores (12)
    stores_data = []
    regions = ["Central", "North", "South", "West"]
    for i in range(1, 13):
        s_id = f"STORE-{i:02d}"
        reg = regions[(i - 1) % len(regions)]
        stores_data.append({
            "store_id": s_id,
            "store_name": f"Retail Outlet {i:02d}",
            "region": reg,
            "latitude": round(15.0 + i * 1.1, 3),
            "longitude": round(73.0 + i * 0.8, 3),
            "store_capacity_units": 5000,
        })
    df_stores = pd.DataFrame(stores_data)
    df_stores.to_csv(out_dir / "stores.csv", index=False)

    # 3. Products (20)
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
            "product_name": f"Consumer Good {i:02d}",
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
            # Realistic transport cost and lead time
            cost = round(0.10 + (abs(hash(lane_id)) % 30) / 100.0, 2)
            lead = round(6.0 + (abs(hash(lane_id)) % 24), 1)
            lanes_data.append({
                "lane_id": lane_id,
                "source_warehouse_id": w_id,
                "destination_store_id": s_id,
                "distance_km_estimate": round(50.0 + (cost * 300), 1),
                "unit_transport_cost": cost,
                "lead_time_hours": lead,
                "capacity_units_per_day": 2000,
                "availability_status": "available",
            })
    df_lanes = pd.DataFrame(lanes_data)
    df_lanes.to_csv(out_dir / "transport_lanes.csv", index=False)

    # 5. Inventory Snapshot (Warehouses: 3x20 = 60, Stores: 12x20 = 240)
    snap_data = []
    snap_date = "2025-12-31"
    for wh in warehouses_data:
        w_id = wh["warehouse_id"]
        for prod in products_data:
            p_id = prod["product_id"]
            snap_data.append({
                "snapshot_date": snap_date,
                "location_type": "warehouse",
                "location_id": w_id,
                "product_id": p_id,
                "quantity_on_hand": 10000,
                "quantity_reserved": 0,
                "reorder_point": 500,
                "unit_cost": prod["unit_cost"],
            })
    for st in stores_data:
        s_id = st["store_id"]
        for prod in products_data:
            p_id = prod["product_id"]
            snap_data.append({
                "snapshot_date": snap_date,
                "location_type": "store",
                "location_id": s_id,
                "product_id": p_id,
                "quantity_on_hand": 50,
                "quantity_reserved": 0,
                "reorder_point": 20,
                "unit_cost": prod["unit_cost"],
            })
    df_snap = pd.DataFrame(snap_data)
    df_snap.to_csv(out_dir / "inventory_snapshot.csv", index=False)

    # 6. Inventory Batches (Warehouse batches: 3x20 = 60)
    batches_data = []
    b_idx = 1
    for wh in warehouses_data:
        w_id = wh["warehouse_id"]
        for prod in products_data:
            p_id = prod["product_id"]
            batches_data.append({
                "batch_id": f"BATCH-{b_idx:04d}",
                "location_type": "warehouse",
                "location_id": w_id,
                "product_id": p_id,
                "batch_number": f"LOT-{b_idx:04d}",
                "quantity_available": 10000,
                "quantity_reserved": 0,
                "snapshot_date": snap_date,
                "expiry_date": "2026-06-30",
                "days_to_expiry": 181,
            })
            b_idx += 1
    df_batches = pd.DataFrame(batches_data)
    df_batches.to_csv(out_dir / "inventory_batches.csv", index=False)

    # 7. Scenarios (SCN-001, SCN-002, SCN-003)
    scenarios_data = [
        {
            "scenario_id": "SCN-001",
            "scenario_name": "North Lane Closure",
            "disruption_type": "route_closure",
            "target_id": "WH-NORTH__STORE-01",
            "change_value": "unavailable",
            "description": "Closure of northern transport lane to store 01",
        },
        {
            "scenario_id": "SCN-002",
            "scenario_name": "South Capacity Reduction",
            "disruption_type": "delivery_delay",
            "target_id": "WH-SOUTH__STORE-04",
            "change_value": "0.50",
            "description": "50% capacity reduction on southern lane to store 04",
        },
        {
            "scenario_id": "SCN-003",
            "scenario_name": "Demand Surge West",
            "disruption_type": "demand_spike",
            "target_id": "STORE-01",
            "change_value": "0.30",
            "description": "30% demand surge at western store 01",
        },
    ]
    df_scenarios = pd.DataFrame(scenarios_data)
    df_scenarios.to_csv(out_dir / "scenarios.csv", index=False)

    # 8. Daily Demand (365 days x 12 stores x 20 products = 87,600 rows)
    np.random.seed(20261024)
    dates = pd.date_range("2025-01-01", "2025-12-31", freq="D")
    price_map = {p["product_id"]: p["unit_price"] for p in products_data}
    
    records = []
    # Weekly seasonality base: Mon(15), Tue(18), Wed(20), Thu(22), Fri(28), Sat(32), Sun(25)
    dow_multipliers = [15, 18, 20, 22, 28, 32, 25]

    for d in dates:
        d_str = d.strftime("%Y-%m-%d")
        dow = d.weekday()
        base_val = dow_multipliers[dow]
        for st in stores_data:
            s_id = st["store_id"]
            for prod in products_data:
                p_id = prod["product_id"]
                noise = np.random.randint(-3, 4)
                sold = max(1, base_val + noise)
                records.append({
                    "date": d_str,
                    "store_id": s_id,
                    "product_id": p_id,
                    "units_sold": sold,
                    "true_demand_units": sold,
                    "stockout_flag": 0,
                    "unit_price": price_map[p_id],
                })
    df_demand = pd.DataFrame(records)
    df_demand.to_csv(out_dir / "daily_demand.csv", index=False)

    # 9. data_dictionary.json
    dd = {
        "dataset_name": "SupplyShield AI Demo Dataset",
        "date_range": {"start": "2025-01-01", "end": "2025-12-31"},
        "version": "1.0.0"
    }
    with open(out_dir / "data_dictionary.json", "w", encoding="utf-8") as f:
        json.dump(dd, f, indent=2)

    # 10. README.md
    with open(out_dir / "README.md", "w", encoding="utf-8") as f:
        f.write("# SupplyShield AI Synthetic Demo Dataset\nContains 87,600 daily demand records across 20 SKUs and 12 Stores with 3 Regional Distribution Hubs.\n")

    print(f"Generated demo dataset with {len(df_demand)} demand rows, {len(df_products)} products, {len(df_wh)} warehouses, {len(df_stores)} stores.")

if __name__ == "__main__":
    generate_demo()
