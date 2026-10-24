"""Enhance supply chain datasets with realistic stockout dynamics, censored demand, and inventory depletion."""

import shutil
from pathlib import Path
import numpy as np
import pandas as pd


def enhance_supply_chain_dataset1():
    csv_path = Path("e:/Hackathons/Triwizathon/data/supply_chain_dataset1.csv")
    bak_path = Path("e:/Hackathons/Triwizathon/data/supply_chain_dataset1.csv.bak")

    if not bak_path.exists():
        shutil.copyfile(csv_path, bak_path)
        print(f"Backed up original dataset to {bak_path}")

    # Read from backup to guarantee deterministic enhancement from original state
    df = pd.read_csv(bak_path)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["Warehouse_ID", "SKU_ID", "Date"]).reset_index(drop=True)

    np.random.seed(20261025)

    pairs = df[["Warehouse_ID", "SKU_ID"]].drop_duplicates().values
    # Select ~160 pairs out of 250 across all warehouses
    stockout_pairs = pairs[np.random.choice(len(pairs), size=160, replace=False)]
    stockout_pairs_set = {(p[0], p[1]) for p in stockout_pairs}

    # Tracking counters
    stockout_rows = 0

    for (w_id, p_id), group in df.groupby(["Warehouse_ID", "SKU_ID"]):
        if (w_id, p_id) not in stockout_pairs_set:
            continue

        indices = group.index.tolist()
        n_days = len(indices)
        if n_days < 60:
            continue

        # Choose 2 to 3 stockout events in the year for this pair
        num_episodes = np.random.choice([2, 3], p=[0.5, 0.5])
        episode_starts = np.random.choice(range(20, n_days - 20), size=num_episodes, replace=False)

        for start_idx_in_group in episode_starts:
            duration = np.random.randint(2, 5)  # 2 to 4 stockout days
            lead_time = int(group.iloc[start_idx_in_group]["Supplier_Lead_Time_Days"])

            # 3 days before: inventory starts draining
            pre_start = max(0, start_idx_in_group - 3)
            for d_offset, row_idx in enumerate(indices[pre_start:start_idx_in_group]):
                # Inventory drops below reorder point
                reorder_pt = df.at[row_idx, "Reorder_Point"]
                df.at[row_idx, "Inventory_Level"] = max(5, int(reorder_pt * (0.6 - d_offset * 0.15)))

            # Stockout duration: stock is 0, stockout_flag = 1, units sold capped or 0
            for row_idx in indices[start_idx_in_group : start_idx_in_group + duration]:
                latent_demand = df.at[row_idx, "Units_Sold"]
                df.at[row_idx, "Stockout_Flag"] = 1
                df.at[row_idx, "Inventory_Level"] = 0
                df.at[row_idx, "Units_Sold"] = 0
                # Demand_Forecast keeps the true customer intent
                df.at[row_idx, "Demand_Forecast"] = round(float(latent_demand * 1.1), 2)
                stockout_rows += 1

            # Day after stockout finishes: replenishment shipment arrives!
            post_idx = start_idx_in_group + duration
            if post_idx < len(indices):
                post_row = indices[post_idx]
                order_qty = df.at[post_row, "Order_Quantity"]
                reorder_pt = df.at[post_row, "Reorder_Point"]
                df.at[post_row, "Inventory_Level"] = int(reorder_pt + order_qty)
                df.at[post_row, "Stockout_Flag"] = 0

    # Format Date back to string YYYY-MM-DD
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    # Save enhanced CSV
    df.to_csv(csv_path, index=False)
    print(f"Enhanced supply_chain_dataset1.csv: {stockout_rows} stockout records injected ({stockout_rows/len(df)*100:.2f}%).")


def enhance_demo_daily_demand():
    demo_demand_path = Path("e:/Hackathons/Triwizathon/data/demo/daily_demand.csv")
    demo_bak_path = Path("e:/Hackathons/Triwizathon/data/demo/daily_demand.csv.bak")

    if not demo_bak_path.exists():
        shutil.copyfile(demo_demand_path, demo_bak_path)
        print(f"Backed up demo demand to {demo_bak_path}")

    df = pd.read_csv(demo_bak_path)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["store_id", "product_id", "date"]).reset_index(drop=True)

    np.random.seed(20261025)

    pairs = df[["store_id", "product_id"]].drop_duplicates().values
    # Select ~80 store-product pairs to experience censored demand
    selected_pairs = pairs[np.random.choice(len(pairs), size=80, replace=False)]
    selected_set = {(p[0], p[1]) for p in selected_pairs}

    stockout_count = 0
    for (s_id, p_id), group in df.groupby(["store_id", "product_id"]):
        if (s_id, p_id) not in selected_set:
            continue

        indices = group.index.tolist()
        n_days = len(indices)
        if n_days < 60:
            continue

        num_episodes = np.random.choice([2, 3], p=[0.5, 0.5])
        starts = np.random.choice(range(20, n_days - 20), size=num_episodes, replace=False)

        for s_idx in starts:
            duration = np.random.randint(2, 5)
            for row_idx in indices[s_idx : s_idx + duration]:
                true_dem = df.at[row_idx, "true_demand_units"]
                df.at[row_idx, "stockout_flag"] = 1
                df.at[row_idx, "units_sold"] = 0  # No stock available to sell
                df.at[row_idx, "true_demand_units"] = true_dem  # Latent customer demand remains
                stockout_count += 1

    df["date"] = df["date"].dt.strftime("%Y-%m-%d")
    df.to_csv(demo_demand_path, index=False)
    print(f"Enhanced daily_demand.csv: {stockout_count} censored demand stockout days injected ({stockout_count/len(df)*100:.2f}%).")


if __name__ == "__main__":
    enhance_supply_chain_dataset1()
    enhance_demo_daily_demand()
