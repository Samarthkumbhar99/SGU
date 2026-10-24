"""Canonical data preparation pipeline for SupplyShield AI.

Transforms raw supply chain backups into standardized, validated Parquet and CSV datasets.
Deterministic, idempotent, with explicit quarantine logging and data dictionary generation.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd


class CanonicalPipeline:
    """Configurable pipeline producing canonical processed datasets from source backups."""

    def __init__(
        self,
        source_path: Optional[Path] = None,
        output_dir: Optional[Path] = None,
    ):
        repo_root = Path(__file__).resolve().parents[3]
        self.source_path = source_path or (repo_root / "data" / "supply_chain_dataset1.csv.bak")
        self.output_dir = output_dir or (repo_root / "data" / "processed")

    def run(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Execute extraction, standardization, validation, quarantine check, and storage."""
        self.output_dir.mkdir(parents=True, exist_ok=True)

        if not self.source_path.exists():
            raise FileNotFoundError(f"Source file {self.source_path} does not exist.")

        # 1. Extraction
        raw_df = pd.read_csv(self.source_path)

        # 2. Schema standardization & renaming
        column_mapping = {
            "Date": "date",
            "SKU_ID": "sku_id",
            "Warehouse_ID": "warehouse_id",
            "Supplier_ID": "supplier_id",
            "Region": "region",
            "Units_Sold": "units_sold",
            "Inventory_Level": "inventory_level",
            "Supplier_Lead_Time_Days": "supplier_lead_time_days",
            "Reorder_Point": "reorder_point",
            "Order_Quantity": "order_quantity",
            "Unit_Cost": "unit_cost",
            "Unit_Price": "unit_price",
            "Promotion_Flag": "promotion_flag",
            "Stockout_Flag": "stockout_flag",
            "Demand_Forecast": "demand_forecast_raw",
        }

        df = raw_df.rename(columns=column_mapping).copy()

        # 3. Type normalization
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
        df["sku_id"] = df["sku_id"].astype(str).str.strip().str.upper()
        df["warehouse_id"] = df["warehouse_id"].astype(str).str.strip().str.upper()
        df["supplier_id"] = df["supplier_id"].astype(str).str.strip().str.upper()
        df["region"] = df["region"].astype(str).str.strip().str.capitalize()

        int_cols = [
            "units_sold",
            "inventory_level",
            "supplier_lead_time_days",
            "reorder_point",
            "order_quantity",
            "promotion_flag",
            "stockout_flag",
        ]
        for c in int_cols:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0).astype(np.int64)

        float_cols = ["unit_cost", "unit_price", "demand_forecast_raw"]
        for c in float_cols:
            df[c] = pd.to_numeric(df[c], errors="coerce").round(2)

        # 4. Derived business features
        df["gross_margin"] = (df["unit_price"] - df["unit_cost"]).round(2)
        df["inventory_valuation"] = (df["inventory_level"] * df["unit_cost"]).round(2)
        df["is_below_reorder_point"] = df["inventory_level"] <= df["reorder_point"]

        # Sort chronologically by business keys
        df = df.sort_values(["warehouse_id", "sku_id", "date"]).reset_index(drop=True)

        # 5. Validation & Quarantine checks
        quarantine_reasons: List[str] = []
        is_quarantine = pd.Series(False, index=df.index)

        # Rule 1: Negative quantities or prices
        negative_mask = (
            (df["units_sold"] < 0)
            | (df["inventory_level"] < 0)
            | (df["order_quantity"] < 0)
            | (df["unit_cost"] <= 0)
            | (df["unit_price"] <= 0)
        )
        if negative_mask.any():
            is_quarantine |= negative_mask
            df.loc[negative_mask, "quarantine_reason"] = "Negative quantity or non-positive price/cost"

        # Rule 2: Negative margin
        neg_margin_mask = df["gross_margin"] < 0
        if neg_margin_mask.any():
            is_quarantine |= neg_margin_mask
            df.loc[neg_margin_mask, "quarantine_reason"] = "Negative profit margin (unit_price < unit_cost)"

        # Rule 3: Duplicate business keys
        dup_mask = df.duplicated(subset=["date", "sku_id", "warehouse_id"], keep=False)
        if dup_mask.any():
            is_quarantine |= dup_mask
            df.loc[dup_mask, "quarantine_reason"] = "Duplicate observation for (date, sku_id, warehouse_id)"

        # Partition clean vs quarantined
        clean_df = df[~is_quarantine].copy().reset_index(drop=True)
        quarantine_df = df[is_quarantine].copy().reset_index(drop=True)

        # 6. Save Canonical Datasets
        parquet_path = self.output_dir / "supply_chain_daily.parquet"
        csv_path = self.output_dir / "supply_chain_daily.csv"
        quarantine_path = self.output_dir / "quarantine.csv"

        clean_df.to_parquet(parquet_path, engine="pyarrow", index=False, compression="snappy")
        clean_df.to_csv(csv_path, index=False)
        quarantine_df.to_csv(quarantine_path, index=False)

        # 7. Generate Data Dictionary
        data_dictionary = {
            "dataset_name": "SupplyShield AI Canonical Daily Supply Chain Dataset",
            "version": "1.0.0",
            "format": ["parquet", "csv"],
            "source": str(self.source_path),
            "generated_rows": len(clean_df),
            "quarantined_rows": len(quarantine_df),
            "date_range": {
                "start": clean_df["date"].min(),
                "end": clean_df["date"].max(),
            },
            "columns": {
                "date": {"type": "string (YYYY-MM-DD)", "description": "Calendar observation date"},
                "sku_id": {"type": "string", "description": "Unique product SKU identifier"},
                "warehouse_id": {"type": "string", "description": "Unique distribution warehouse facility ID"},
                "supplier_id": {"type": "string", "description": "Primary restocking supplier ID"},
                "region": {"type": "string", "description": "Customer/outlet demand market region"},
                "units_sold": {"type": "int64", "description": "Daily units sold to retail destinations"},
                "inventory_level": {"type": "int64", "description": "End-of-day available stock on hand"},
                "supplier_lead_time_days": {"type": "int64", "description": "Replenishment delivery lead time in days"},
                "reorder_point": {"type": "int64", "description": "Inventory threshold triggering replenishment"},
                "order_quantity": {"type": "int64", "description": "Units received from replenishment order on date"},
                "unit_cost": {"type": "float64", "description": "Unit acquisition cost in USD"},
                "unit_price": {"type": "float64", "description": "Unit retail selling price in USD"},
                "promotion_flag": {"type": "int64 (0/1)", "description": "1 if product had an active price promotion"},
                "stockout_flag": {"type": "int64 (0/1)", "description": "1 if inventory was completely exhausted"},
                "demand_forecast_raw": {"type": "float64", "description": "Synthetic benchmark forecast from source file (contains target leakage; not used for ML training)"},
                "gross_margin": {"type": "float64", "description": "Unit margin: unit_price - unit_cost"},
                "inventory_valuation": {"type": "float64", "description": "Total position dollar value: inventory_level * unit_cost"},
                "is_below_reorder_point": {"type": "bool", "description": "True if inventory_level <= reorder_point"},
            },
        }

        dict_path = self.output_dir / "data_dictionary.json"
        with open(dict_path, "w", encoding="utf-8") as f:
            json.dump(data_dictionary, f, indent=2)

        print(f"Canonical pipeline executed successfully:")
        print(f"  - Clean Parquet: {parquet_path} ({len(clean_df)} rows)")
        print(f"  - Clean CSV:     {csv_path} ({len(clean_df)} rows)")
        print(f"  - Quarantine:    {quarantine_path} ({len(quarantine_df)} rows)")
        print(f"  - Dictionary:    {dict_path}")

        return clean_df, quarantine_df


if __name__ == "__main__":
    pipeline = CanonicalPipeline()
    pipeline.run()
