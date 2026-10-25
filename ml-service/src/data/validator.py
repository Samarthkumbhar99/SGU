"""Data validation module enforcing schema integrity, demand sanity, and cross-file relational rules."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import numpy as np
import pandas as pd

from src.data.loader import LoadedDataset, load_dataset_bundle
from src.schemas.validation import IssueDetail, ValidationReport, ValidationSummary


REQUIRED_COLUMNS: Dict[str, List[str]] = {
    "daily_demand.csv": [
        "date",
        "store_id",
        "product_id",
        "units_sold",
        "true_demand_units",
        "stockout_flag",
        "unit_price",
    ],
    "products.csv": [
        "product_id",
        "sku",
        "product_name",
        "category",
        "unit_of_measure",
        "unit_cost",
        "unit_price",
        "pack_size",
        "shelf_life_days",
    ],
    "warehouses.csv": [
        "warehouse_id",
        "warehouse_name",
        "region",
        "latitude",
        "longitude",
        "storage_capacity_units",
    ],
    "stores.csv": [
        "store_id",
        "store_name",
        "region",
        "latitude",
        "longitude",
        "store_capacity_units",
    ],
    "inventory_snapshot.csv": [
        "snapshot_date",
        "location_type",
        "location_id",
        "product_id",
        "quantity_on_hand",
        "quantity_reserved",
        "reorder_point",
        "unit_cost",
    ],
    "transport_lanes.csv": [
        "lane_id",
        "source_warehouse_id",
        "destination_store_id",
        "distance_km_estimate",
        "unit_transport_cost",
        "lead_time_hours",
        "capacity_units_per_day",
        "availability_status",
    ],
    "inventory_batches.csv": [
        "batch_id",
        "location_type",
        "location_id",
        "product_id",
        "batch_number",
        "quantity_available",
        "quantity_reserved",
        "snapshot_date",
        "expiry_date",
        "days_to_expiry",
    ],
    "scenarios.csv": [
        "scenario_id",
        "scenario_name",
        "disruption_type",
        "target_id",
        "change_value",
        "description",
    ],
}


class DataValidator:
    """Validates SupplyShield AI dataset files against schema and business integrity rules."""

    def __init__(self, dataset_dir: Path):
        self.dataset_dir = dataset_dir
        self.errors: List[IssueDetail] = []
        self.warnings: List[IssueDetail] = []
        self.row_counts: Dict[str, int] = {}
        self.date_coverage: Optional[Dict[str, Any]] = None
        self.dimensions: Optional[Dict[str, Any]] = None

    def add_error(self, code: str, message: str, file: Optional[str] = None, column: Optional[str] = None, context: Optional[Dict[str, Any]] = None):
        self.errors.append(IssueDetail(code=code, message=message, file=file, column=column, context=context))

    def add_warning(self, code: str, message: str, file: Optional[str] = None, column: Optional[str] = None, context: Optional[Dict[str, Any]] = None):
        self.warnings.append(IssueDetail(code=code, message=message, file=file, column=column, context=context))

    def validate(self) -> ValidationReport:
        dataset = load_dataset_bundle(self.dataset_dir)

        # Ingest loader-level errors and warnings
        for err in dataset.errors:
            self.add_error(**err)
        for warn in dataset.warnings:
            self.add_warning(**warn)

        # Collect row counts for successfully loaded tables
        dfs = {
            "daily_demand.csv": dataset.daily_demand,
            "products.csv": dataset.products,
            "warehouses.csv": dataset.warehouses,
            "stores.csv": dataset.stores,
            "inventory_snapshot.csv": dataset.inventory_snapshot,
            "transport_lanes.csv": dataset.transport_lanes,
            "inventory_batches.csv": dataset.inventory_batches,
            "scenarios.csv": dataset.scenarios,
        }

        for fname, df in dfs.items():
            if df is not None:
                self.row_counts[fname] = len(df)

        # 1. Schema & Required Columns Verification
        self._validate_schemas(dfs)

        # 2. Key Uniqueness Checks
        self._validate_uniqueness(dfs)

        # 3. Numeric & Date Fields Sanity
        self._validate_data_types_and_ranges(dfs)

        # 4. Cross-File Relational Integrity
        self._validate_cross_file_relationships(dfs)

        # 5. Daily Demand & Stockout Consistency
        if dataset.daily_demand is not None:
            self._validate_daily_demand(dataset.daily_demand)

        # Summary Metrics
        if (
            dataset.products is not None
            and dataset.warehouses is not None
            and dataset.stores is not None
            and dataset.transport_lanes is not None
        ):
            self.dimensions = {
                "products_count": len(dataset.products),
                "warehouses_count": len(dataset.warehouses),
                "stores_count": len(dataset.stores),
                "transport_lanes_count": len(dataset.transport_lanes),
                "inventory_batches_count": len(dataset.inventory_batches) if dataset.inventory_batches is not None else 0,
            }

        # Determine overall status
        if self.errors:
            status = "invalid"
        elif self.warnings:
            status = "valid_with_warnings"
        else:
            status = "valid"

        summary = ValidationSummary(
            total_files_checked=len(REQUIRED_COLUMNS) + 2,  # + data_dictionary and README
            files_loaded=len(dataset.loaded_files),
            total_errors=len(self.errors),
            total_warnings=len(self.warnings),
        )

        return ValidationReport(
            status=status,
            summary=summary,
            row_counts=self.row_counts,
            errors=self.errors,
            warnings=self.warnings,
            date_coverage=self.date_coverage,
            dimensions=self.dimensions,
        )

    def _validate_schemas(self, dfs: Dict[str, Optional[pd.DataFrame]]):
        for fname, expected_cols in REQUIRED_COLUMNS.items():
            df = dfs.get(fname)
            if df is None:
                continue
            missing_cols = [c for c in expected_cols if c not in df.columns]
            if missing_cols:
                self.add_error(
                    code="MISSING_COLUMNS",
                    message=f"File '{fname}' is missing required columns: {missing_cols}",
                    file=fname,
                    context={"missing_columns": missing_cols},
                )

    def _validate_uniqueness(self, dfs: Dict[str, Optional[pd.DataFrame]]):
        primary_keys = {
            "products.csv": "product_id",
            "warehouses.csv": "warehouse_id",
            "stores.csv": "store_id",
            "transport_lanes.csv": "lane_id",
            "inventory_batches.csv": "batch_id",
            "scenarios.csv": "scenario_id",
        }

        for fname, pk in primary_keys.items():
            df = dfs.get(fname)
            if df is not None and pk in df.columns:
                dupes = df[df.duplicated(subset=[pk], keep=False)]
                if not dupes.empty:
                    self.add_error(
                        code="DUPLICATE_PRIMARY_KEY",
                        message=f"File '{fname}' contains {len(dupes)} duplicate primary key records on '{pk}'.",
                        file=fname,
                        column=pk,
                        context={"duplicate_count": len(dupes)},
                    )

        # Check composite key on inventory snapshot (location_id, product_id)
        snap = dfs.get("inventory_snapshot.csv")
        if snap is not None and {"location_id", "product_id"}.issubset(snap.columns):
            snap_dupes = snap[snap.duplicated(subset=["location_id", "product_id"], keep=False)]
            if not snap_dupes.empty:
                self.add_error(
                    code="DUPLICATE_SNAPSHOT_KEY",
                    message=f"File 'inventory_snapshot.csv' has {len(snap_dupes)} duplicate entries for (location_id, product_id).",
                    file="inventory_snapshot.csv",
                    context={"duplicate_count": len(snap_dupes)},
                )

    def _validate_data_types_and_ranges(self, dfs: Dict[str, Optional[pd.DataFrame]]):
        # 1. Products checks
        products = dfs.get("products.csv")
        if products is not None:
            for col in ["unit_cost", "unit_price", "pack_size", "shelf_life_days"]:
                if col in products.columns:
                    non_num = pd.to_numeric(products[col], errors="coerce")
                    if non_num.isna().any():
                        self.add_error(
                            code="INVALID_NUMERIC_VALUE",
                            message=f"Non-numeric values in products.csv column '{col}'.",
                            file="products.csv",
                            column=col,
                        )
                    elif (non_num <= 0).any():
                        self.add_error(
                            code="NON_POSITIVE_VALUE",
                            message=f"products.csv column '{col}' has values <= 0.",
                            file="products.csv",
                            column=col,
                        )

        # 2. Transport lanes checks
        lanes = dfs.get("transport_lanes.csv")
        if lanes is not None:
            for col in ["distance_km_estimate", "unit_transport_cost", "lead_time_hours", "capacity_units_per_day"]:
                if col in lanes.columns:
                    non_num = pd.to_numeric(lanes[col], errors="coerce")
                    if non_num.isna().any():
                        self.add_error(
                            code="INVALID_NUMERIC_VALUE",
                            message=f"Non-numeric values in transport_lanes.csv column '{col}'.",
                            file="transport_lanes.csv",
                            column=col,
                        )
                    elif (non_num < 0).any():
                        self.add_error(
                            code="NEGATIVE_VALUE",
                            message=f"transport_lanes.csv column '{col}' cannot contain negative values.",
                            file="transport_lanes.csv",
                            column=col,
                        )

        # 3. Inventory batches checks
        batches = dfs.get("inventory_batches.csv")
        if batches is not None:
            if "expiry_date" in batches.columns:
                parsed_dates = pd.to_datetime(batches["expiry_date"], errors="coerce")
                if parsed_dates.isna().any():
                    self.add_error(
                        code="INVALID_DATE_FORMAT",
                        message="Invalid or unparseable expiry_date found in inventory_batches.csv.",
                        file="inventory_batches.csv",
                        column="expiry_date",
                    )
            for col in ["quantity_available", "quantity_reserved", "days_to_expiry"]:
                if col in batches.columns:
                    non_num = pd.to_numeric(batches[col], errors="coerce")
                    if non_num.isna().any() or (non_num < 0).any():
                        self.add_error(
                            code="INVALID_NUMERIC_VALUE",
                            message=f"inventory_batches.csv column '{col}' contains negative or non-numeric values.",
                            file="inventory_batches.csv",
                            column=col,
                        )

    def _validate_cross_file_relationships(self, dfs: Dict[str, Optional[pd.DataFrame]]):
        products = dfs.get("products.csv")
        warehouses = dfs.get("warehouses.csv")
        stores = dfs.get("stores.csv")

        valid_product_ids: Set[str] = set(products["product_id"]) if products is not None and "product_id" in products.columns else set()
        valid_warehouse_ids: Set[str] = set(warehouses["warehouse_id"]) if warehouses is not None and "warehouse_id" in warehouses.columns else set()
        valid_store_ids: Set[str] = set(stores["store_id"]) if stores is not None and "store_id" in stores.columns else set()

        # Check transport lanes
        lanes = dfs.get("transport_lanes.csv")
        if lanes is not None:
            if "source_warehouse_id" in lanes.columns and valid_warehouse_ids:
                invalid_wh = set(lanes["source_warehouse_id"]) - valid_warehouse_ids
                if invalid_wh:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"transport_lanes.csv references unknown warehouse_ids: {sorted(list(invalid_wh))}",
                        file="transport_lanes.csv",
                        column="source_warehouse_id",
                        context={"invalid_ids": sorted(list(invalid_wh))},
                    )
            if "destination_store_id" in lanes.columns and valid_store_ids:
                invalid_st = set(lanes["destination_store_id"]) - valid_store_ids
                if invalid_st:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"transport_lanes.csv references unknown store_ids: {sorted(list(invalid_st))}",
                        file="transport_lanes.csv",
                        column="destination_store_id",
                        context={"invalid_ids": sorted(list(invalid_st))},
                    )

        # Check inventory snapshot
        snapshot = dfs.get("inventory_snapshot.csv")
        if snapshot is not None:
            if "product_id" in snapshot.columns and valid_product_ids:
                invalid_p = set(snapshot["product_id"]) - valid_product_ids
                if invalid_p:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"inventory_snapshot.csv references unknown product_ids: {sorted(list(invalid_p))}",
                        file="inventory_snapshot.csv",
                        column="product_id",
                        context={"invalid_ids": sorted(list(invalid_p))},
                    )
            if "location_type" in snapshot.columns and "location_id" in snapshot.columns:
                wh_locs = set(snapshot[snapshot["location_type"] == "warehouse"]["location_id"]) - valid_warehouse_ids
                st_locs = set(snapshot[snapshot["location_type"] == "store"]["location_id"]) - valid_store_ids
                if wh_locs and valid_warehouse_ids:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"inventory_snapshot.csv references unknown warehouse locations: {sorted(list(wh_locs))}",
                        file="inventory_snapshot.csv",
                        column="location_id",
                        context={"invalid_ids": sorted(list(wh_locs))},
                    )
                if st_locs and valid_store_ids:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"inventory_snapshot.csv references unknown store locations: {sorted(list(st_locs))}",
                        file="inventory_snapshot.csv",
                        column="location_id",
                        context={"invalid_ids": sorted(list(st_locs))},
                    )

        # Check inventory batches
        batches = dfs.get("inventory_batches.csv")
        if batches is not None:
            if "product_id" in batches.columns and valid_product_ids:
                invalid_bp = set(batches["product_id"]) - valid_product_ids
                if invalid_bp:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"inventory_batches.csv references unknown product_ids: {sorted(list(invalid_bp))}",
                        file="inventory_batches.csv",
                        column="product_id",
                        context={"invalid_ids": sorted(list(invalid_bp))},
                    )
            if "location_id" in batches.columns and valid_warehouse_ids:
                invalid_bw = set(batches["location_id"]) - valid_warehouse_ids
                if invalid_bw:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"inventory_batches.csv references unknown warehouse location_ids: {sorted(list(invalid_bw))}",
                        file="inventory_batches.csv",
                        column="location_id",
                        context={"invalid_ids": sorted(list(invalid_bw))},
                    )

        # Check daily demand foreign keys
        demand = dfs.get("daily_demand.csv")
        if demand is not None:
            if "product_id" in demand.columns and valid_product_ids:
                invalid_dp = set(demand["product_id"]) - valid_product_ids
                if invalid_dp:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"daily_demand.csv references unknown product_ids: {sorted(list(invalid_dp))}",
                        file="daily_demand.csv",
                        column="product_id",
                        context={"invalid_ids": sorted(list(invalid_dp))},
                    )
            if "store_id" in demand.columns and valid_store_ids:
                invalid_ds = set(demand["store_id"]) - valid_store_ids
                if invalid_ds:
                    self.add_error(
                        code="FOREIGN_KEY_VIOLATION",
                        message=f"daily_demand.csv references unknown store_ids: {sorted(list(invalid_ds))}",
                        file="daily_demand.csv",
                        column="store_id",
                        context={"invalid_ids": sorted(list(invalid_ds))},
                    )

        # Check scenarios target_id
        scenarios = dfs.get("scenarios.csv")
        if scenarios is not None and "target_id" in scenarios.columns and "disruption_type" in scenarios.columns:
            all_valid_entities = valid_product_ids | valid_warehouse_ids | valid_store_ids
            if lanes is not None and "lane_id" in lanes.columns:
                all_valid_entities.update(set(lanes["lane_id"]))

            for _, row in scenarios.iterrows():
                target = str(row["target_id"])
                dtype = str(row["disruption_type"])
                if dtype in ["route_closure", "demand_spike", "warehouse_stock_reduction", "delivery_delay", "expiry_risk"]:
                    if all_valid_entities and target not in all_valid_entities:
                        self.add_warning(
                            code="UNKNOWN_SCENARIO_TARGET",
                            message=f"Scenario '{row['scenario_id']}' target '{target}' not found in known entity IDs.",
                            file="scenarios.csv",
                            column="target_id",
                            context={"scenario_id": row["scenario_id"], "target_id": target},
                        )

    def _validate_daily_demand(self, demand: pd.DataFrame):
        req_cols = {"date", "store_id", "product_id", "units_sold", "true_demand_units", "stockout_flag"}
        if not req_cols.issubset(demand.columns):
            return

        # 1. Parse and validate dates
        parsed_dates = pd.to_datetime(demand["date"], errors="coerce")
        if parsed_dates.isna().any():
            self.add_error(
                code="INVALID_DATE_FORMAT",
                message="Unparseable dates found in daily_demand.csv.",
                file="daily_demand.csv",
                column="date",
            )
            return

        min_date = parsed_dates.min().strftime("%Y-%m-%d")
        max_date = parsed_dates.max().strftime("%Y-%m-%d")
        num_dates = parsed_dates.nunique()
        stores_count = demand["store_id"].nunique()
        products_count = demand["product_id"].nunique()
        expected_rows = num_dates * stores_count * products_count

        self.date_coverage = {
            "start_date": min_date,
            "end_date": max_date,
            "unique_dates": num_dates,
            "series_count": stores_count * products_count,
            "expected_grid_rows": expected_rows,
            "actual_rows": len(demand),
        }

        # 2. Duplicate business key check
        dupes = demand[demand.duplicated(subset=["date", "store_id", "product_id"], keep=False)]
        if not dupes.empty:
            self.add_error(
                code="DUPLICATE_DEMAND_RECORD",
                message=f"daily_demand.csv has {len(dupes)} duplicate records for (date, store_id, product_id).",
                file="daily_demand.csv",
                context={"duplicate_count": len(dupes)},
            )

        # 3. Numeric range checks
        for col in ["units_sold", "true_demand_units", "unit_price"]:
            if col in demand.columns:
                non_num = pd.to_numeric(demand[col], errors="coerce")
                if non_num.isna().any():
                    self.add_error(
                        code="INVALID_NUMERIC_VALUE",
                        message=f"Non-numeric values in daily_demand.csv column '{col}'.",
                        file="daily_demand.csv",
                        column=col,
                    )
                elif (non_num < 0).any():
                    self.add_error(
                        code="NEGATIVE_DEMAND_VALUE",
                        message=f"daily_demand.csv column '{col}' contains negative values.",
                        file="daily_demand.csv",
                        column=col,
                    )

        # 4. Stockout & Censoring Relationship Checks
        # When stockout_flag == 1, units_sold should typically be < true_demand_units (censored sales).
        # When stockout_flag == 0, units_sold should equal true_demand_units in this synthetic dataset.
        stockout_mask = demand["stockout_flag"] == 1
        no_stockout_mask = demand["stockout_flag"] == 0

        # Discrepancy where no stockout is claimed, but units_sold != true_demand_units
        uncensored_mismatch = (no_stockout_mask & (demand["units_sold"] != demand["true_demand_units"])).sum()
        if uncensored_mismatch > 0:
            self.add_warning(
                code="UNCENSORED_DEMAND_MISMATCH",
                message=f"{uncensored_mismatch} records have stockout_flag=0 but units_sold != true_demand_units.",
                file="daily_demand.csv",
                context={"mismatch_count": int(uncensored_mismatch)},
            )

        # Discrepancy where stockout is claimed, but units_sold == true_demand_units
        stockout_no_loss = (stockout_mask & (demand["units_sold"] == demand["true_demand_units"])).sum()
        if stockout_no_loss > 0:
            self.add_warning(
                code="STOCKOUT_WITHOUT_UNMET_DEMAND",
                message=f"{stockout_no_loss} records have stockout_flag=1 but units_sold equals true_demand_units (marginal stockout).",
                file="daily_demand.csv",
                context={"count": int(stockout_no_loss)},
            )

        # Inconsistency where units_sold exceeds synthetic true_demand_units
        sales_exceed_demand = (demand["units_sold"] > demand["true_demand_units"]).sum()
        if sales_exceed_demand > 0:
            self.add_error(
                code="SALES_EXCEED_TRUE_DEMAND",
                message=f"{sales_exceed_demand} records have units_sold > true_demand_units, which violates ground truth definitions.",
                file="daily_demand.csv",
                context={"count": int(sales_exceed_demand)},
            )
