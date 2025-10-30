import hashlib
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd


def stable_int_from_string(value: str, modulo: int) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % modulo


def parse_sales_csv(sales_csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(sales_csv_path)
    # Ensure required columns exist
    required_cols = [
        "date",
        "time",
        "invoice_id",
        "medicine_name",
        "generic_name",
        "brand",
        "manufacturer",
        "supplier",
        "dosage_form",
        "strength",
        "category",
        "prescription_required",
        "quantity",
        "unit_price",
    ]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in sales CSV: {missing}")

    # Types and combined datetime
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    # Some rows can have malformed time; guard conversion
    def to_time_safe(t: str) -> datetime:
        try:
            return datetime.strptime(str(t), "%H:%M:%S").time()
        except Exception:
            return datetime.strptime("00:00:00", "%H:%M:%S").time()

    df["time"] = df["time"].apply(to_time_safe)
    df["order_dt"] = df.apply(lambda r: datetime.combine(r["date"], r["time"]), axis=1)
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0.0)
    df["prescription_required"] = df["prescription_required"].astype(int)
    return df


def compute_inventory(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
    # Aggregate per medicine_name
    agg = (
        df.groupby("medicine_name")
        .agg(
            generic_name=("generic_name", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            brand=("brand", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            manufacturer=("manufacturer", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            supplier=("supplier", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            dosage_form=("dosage_form", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            strength=("strength", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            category=("category", lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0]),
            prescription_required=(
                "prescription_required",
                lambda s: int((s.astype(int).mean() >= 0.5)),
            ),
            total_qty=("quantity", "sum"),
        )
        .reset_index()
    )

    # Compute daily sales velocity
    df_day = (
        df.groupby(["medicine_name", df["order_dt"].dt.date])["quantity"].sum().reset_index(name="qty")
    )
    stats = df_day.groupby("medicine_name")["qty"].agg(avg_daily="mean", std_daily="std").reset_index()
    agg = agg.merge(stats, on="medicine_name", how="left")
    agg["std_daily"] = agg["std_daily"].fillna(0.0)

    # Stock level: 14 days of avg + 1.5*std, at least 5, and not less than last 90th percentile day
    day_quantiles = df_day.groupby("medicine_name")["qty"].quantile(0.9).rename("p90").reset_index()
    agg = agg.merge(day_quantiles, on="medicine_name", how="left")
    def compute_stock(row) -> int:
        avg = row["avg_daily"] if not np.isnan(row["avg_daily"]) else 0.0
        std = row["std_daily"] if not np.isnan(row["std_daily"]) else 0.0
        p90 = row["p90"] if not np.isnan(row["p90"]) else 0.0
        recommended = int(np.ceil(14 * avg + 1.5 * std))
        recommended = max(recommended, int(np.ceil(p90)))
        return max(recommended, 5)

    agg["stock_level"] = agg.apply(compute_stock, axis=1)

    # Expiry date based on dosage form shelf-life and deterministic offset
    max_date = df["order_dt"].max().date()
    shelf_by_form = {
        "Tablet": 24,
        "Capsule": 24,
        "Syrup": 12,
        "Liquid": 12,
        "Drops": 12,
        "Inhaler": 18,
        "Ointment": 18,
        "Cream": 18,
        "Gel": 18,
        "Powder": 24,
        "Jar": 24,
        "Kit": 60,
    }

    def expiry_for_row(row) -> datetime:
        dosage_form = str(row["dosage_form"]).strip()
        shelf_months = shelf_by_form.get(dosage_form, 24)
        # Deterministic offset 0..6 months deducted from shelf
        offset = stable_int_from_string(str(row["medicine_name"]), 7)
        effective_months = max(6, shelf_months - offset)
        # Convert months to days approx using 30.44 days/month
        days = int(round(effective_months * 30.44))
        return pd.Timestamp(max_date) + pd.Timedelta(days=days)

    agg["expiry_date"] = agg.apply(expiry_for_row, axis=1).dt.date

    # Add deterministic medicine_id
    agg = agg.sort_values(["total_qty"], ascending=False).reset_index(drop=True)
    agg["medicine_id"] = [f"M{str(i+1).zfill(5)}" for i in range(len(agg))]

    # Reorder columns
    inventory_cols = [
        "medicine_id",
        "medicine_name",
        "generic_name",
        "brand",
        "manufacturer",
        "supplier",
        "dosage_form",
        "strength",
        "category",
        "prescription_required",
        "stock_level",
        "expiry_date",
    ]
    inventory_df = agg[inventory_cols]

    # Map from medicine_name to id
    name_to_id = dict(zip(inventory_df["medicine_name"], inventory_df["medicine_id"]))
    return inventory_df, name_to_id


def build_customers(df: pd.DataFrame) -> pd.DataFrame:
    # One unique customer per invoice (as per requirement)
    invoices = df[["invoice_id", "order_dt"]].drop_duplicates().reset_index(drop=True)

    # Deterministic synthetic customer names
    first_names = [
        "Akash",
        "Aditi",
        "Prakash",
        "Snehal",
        "Sumit",
        "Pooja",
        "Sagar",
        "Komal",
        "Rohit",
        "Neha",
        "Vikas",
        "Ankita",
        "Sandeep",
        "Manisha",
        "Mahesh",
        "Rutuja",
    ]
    last_names = [
        "Patil",
        "Sawant",
        "Desai",
        "Naik",
        "Jadhav",
        "Chavan",
        "Bhosale",
        "Kadam",
        "Parab",
        "Gawde",
        "Shinde",
        "Pawar",
        "More",
        "Kulkarni",
        "Rane",
        "Kamble",
    ]

    def make_customer_row(idx, row):
        fn = first_names[stable_int_from_string(row["invoice_id"], len(first_names))]
        ln = last_names[stable_int_from_string(row["invoice_id"] + "_ln", len(last_names))]
        customer_id = f"C{stable_int_from_string(row["invoice_id"], 10_000_000):07d}"
        return pd.Series(
            {
                "customer_id": customer_id,
                "invoice_id": row["invoice_id"],
                "customer_name": f"{fn} {ln}",
                "city": "Sindhudurg",
                "state": "Maharashtra",
                "created_at": row["order_dt"].date(),
            }
        )

    customers_df = invoices.apply(lambda r: make_customer_row(None, r), axis=1)
    return customers_df


def build_purchase_invoices(df: pd.DataFrame, customers_df: pd.DataFrame) -> pd.DataFrame:
    invoice_totals = (
        df.assign(line_total=df["quantity"] * df["unit_price"])
        .groupby("invoice_id")
        .agg(purchase_date=("order_dt", "min"), total_amount=("line_total", "sum"))
        .reset_index()
    )
    purchase_invoices = invoice_totals.merge(customers_df[["invoice_id", "customer_id"]], on="invoice_id", how="left")
    purchase_invoices = purchase_invoices[
        ["invoice_id", "customer_id", "purchase_date", "total_amount"]
    ]
    purchase_invoices["purchase_date"] = purchase_invoices["purchase_date"].dt.date
    purchase_invoices["total_amount"] = purchase_invoices["total_amount"].round(2)
    return purchase_invoices


def build_purchase_items(df: pd.DataFrame, name_to_id: Dict[str, str]) -> pd.DataFrame:
    items = df.copy()
    items["medicine_id"] = items["medicine_name"].map(name_to_id)
    items["line_total"] = (items["quantity"] * items["unit_price"]).round(2)
    items = items[
        [
            "invoice_id",
            "order_dt",
            "medicine_id",
            "medicine_name",
            "quantity",
            "unit_price",
            "line_total",
            "prescription_required",
            "category",
        ]
    ]
    items.rename(columns={"order_dt": "purchase_datetime"}, inplace=True)
    return items


def build_returns_and_refunds(items: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    # Deterministic selection ~1% returns (more realistic)
    def is_return_row(row) -> bool:
        return stable_int_from_string(f"{row['invoice_id']}_{row['medicine_id']}", 100) == 0

    returned = items[items.apply(is_return_row, axis=1)].copy()
    if returned.empty:
        return pd.DataFrame(columns=[
            "return_id",
            "invoice_id",
            "medicine_id",
            "quantity_returned",
            "return_date",
            "reason",
            "refund_eligible",
        ]), pd.DataFrame(columns=[
            "refund_id",
            "return_id",
            "refund_amount",
            "refund_date",
            "method",
        ])

    def returned_quantity(row) -> int:
        # Return up to quantity, deterministically (1 or more if purchased more)
        max_q = int(row["quantity"]) if int(row["quantity"]) > 0 else 1
        # Map to 1..max_q
        return 1 + stable_int_from_string(f"Q_{row['invoice_id']}_{row['medicine_id']}", max_q)

    returned["quantity_returned"] = returned.apply(returned_quantity, axis=1)
    returned["quantity_returned"] = returned[["quantity_returned", "quantity"]].min(axis=1)

    reasons = ["Expired", "Adverse reaction", "Damaged", "Wrong item", "Quality issue"]
    returned["reason"] = returned.apply(
        lambda r: reasons[stable_int_from_string(f"R_{r['invoice_id']}_{r['medicine_id']}", len(reasons))],
        axis=1,
    )
    returned["refund_eligible"] = returned["reason"].apply(
        lambda s: s in {"Damaged", "Wrong item", "Quality issue", "Adverse reaction"}
    )
    def ret_date(row) -> datetime:
        delta_days = 1 + stable_int_from_string(f"D_{row['invoice_id']}_{row['medicine_id']}", 14)
        base_dt = pd.to_datetime(row["purchase_datetime"]).to_pydatetime()
        return (base_dt + timedelta(days=delta_days)).date()

    returned["return_date"] = returned.apply(ret_date, axis=1)

    # Create return_id
    returned = returned.assign(
        return_id=returned.apply(
            lambda r: f"RET{stable_int_from_string(f'{r['invoice_id']}_{r['medicine_id']}', 10_000_000):07d}",
            axis=1,
        )
    )

    returns_df = returned[[
        "return_id",
        "invoice_id",
        "medicine_id",
        "quantity_returned",
        "return_date",
        "reason",
        "refund_eligible",
    ]].copy()

    # Refunds for eligible returns
    eligible = returned[returned["refund_eligible"]].copy()
    if eligible.empty:
        return returns_df, pd.DataFrame(columns=[
            "refund_id",
            "return_id",
            "refund_amount",
            "refund_date",
            "method",
        ])

    eligible["refund_amount"] = (eligible["quantity_returned"] * eligible["unit_price"]).round(2)
    def refund_date(row) -> datetime:
        # Refund same day or next day deterministically
        add = stable_int_from_string(f"F_{row['return_id']}", 2)
        return (pd.to_datetime(row["return_date"]) + pd.Timedelta(days=add)).date()

    methods = ["Cash", "Original payment method", "Store credit"]
    refunds = eligible.assign(
        refund_id=eligible.apply(
            lambda r: f"RF{stable_int_from_string(r['return_id'], 10_000_000):07d}", axis=1
        ),
        refund_date=eligible.apply(refund_date, axis=1),
        method=eligible.apply(
            lambda r: methods[stable_int_from_string(f"M_{r['return_id']}", len(methods))], axis=1
        ),
    )

    refunds_df = refunds[["refund_id", "return_id", "refund_amount", "refund_date", "method"]].copy()
    return returns_df, refunds_df


def choose_doctor(category: str) -> Tuple[str, str]:
    # Map category to specialty and select deterministic doctor practicing in Sindhudurg district
    cat = (category or "").lower()
    if any(k in cat for k in ["respiratory", "asthma", "pulmon"]):
        spec = "Pulmonologist"
        doctors = [("Dr. S. Patankar", "District Hospital Oros"), ("Dr. V. Sawant", "Malvan SDH")]
    elif any(k in cat for k in ["antibiotic", "antibacterial", "analgesic", "vitamin", "otc"]):
        spec = "General Physician"
        doctors = [("Dr. A. Naik", "Kankavli SDH"), ("Dr. R. Desai", "Sawantwadi RH")]
    elif "gastro" in cat:
        spec = "Gastroenterologist"
        doctors = [("Dr. P. Jadhav", "Vengurla RH"), ("Dr. K. Parab", "Kankavli SDH")]
    elif "dermat" in cat:
        spec = "Dermatologist"
        doctors = [("Dr. M. Rane", "Malvan SDH"), ("Dr. N. Chavan", "Sawantwadi RH")]
    elif "ophthalm" in cat:
        spec = "Ophthalmologist"
        doctors = [("Dr. S. Gawde", "District Hospital Oros"), ("Dr. T. Kadam", "Vengurla RH")]
    elif "antimal" in cat:
        spec = "Infectious Disease"
        doctors = [("Dr. L. Patil", "Kankavli SDH"), ("Dr. D. Shinde", "Malvan SDH")]
    else:
        spec = "General Physician"
        doctors = [("Dr. A. Naik", "Kankavli SDH"), ("Dr. R. Desai", "Sawantwadi RH")]

    idx = stable_int_from_string(category or "general", len(doctors))
    name, hospital = doctors[idx]
    return f"{name} ({spec})", hospital


def build_prescriptions(items: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    # Consider invoices that contain at least one prescription_required item
    rx_items = items[items["prescription_required"] == 1].copy()
    if rx_items.empty:
        return (
            pd.DataFrame(columns=["prescription_id", "invoice_id", "doctor_name", "hospital", "prescription_date"]),
            pd.DataFrame(columns=["prescription_id", "medicine_id", "quantity"]),
        )

    # Choose dominant category per invoice for doctor selection
    dominant_cat = (
        rx_items.groupby(["invoice_id", "category"])  # category present in items
        ["quantity"].sum()
        .reset_index()
        .sort_values(["invoice_id", "quantity"], ascending=[True, False])
        .drop_duplicates(subset=["invoice_id"], keep="first")
        .rename(columns={"category": "dominant_category"})
    )

    invoices = (
        rx_items.groupby("invoice_id")["purchase_datetime"].min().reset_index().rename(columns={"purchase_datetime": "prescription_date"})
    )
    invoices = invoices.merge(dominant_cat[["invoice_id", "dominant_category"]], on="invoice_id", how="left")

    # Assign doctor
    invoices[["doctor_name", "hospital"]] = invoices.apply(
        lambda r: pd.Series(choose_doctor(str(r.get("dominant_category", "General")))),
        axis=1,
    )

    invoices["prescription_id"] = invoices["invoice_id"].apply(lambda inv: f"P_{inv}")
    invoices["prescription_date"] = pd.to_datetime(invoices["prescription_date"]).dt.date
    prescriptions_df = invoices[["prescription_id", "invoice_id", "doctor_name", "hospital", "prescription_date"]]

    # Link medicines for each rx-required line in those invoices
    rx_lines = rx_items.merge(
        prescriptions_df[["prescription_id", "invoice_id"]], on="invoice_id", how="inner"
    )
    rx_meds = rx_lines[["prescription_id", "medicine_id", "quantity"]].copy()
    rx_meds = (
        rx_meds.groupby(["prescription_id", "medicine_id"]).agg(quantity=("quantity", "sum")).reset_index()
    )
    return prescriptions_df, rx_meds


def main():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sales_csv_path = os.path.join(project_root, "input", "konkan_pharmacy_sales_55k.csv")
    output_dir = os.path.join(project_root, "output", "normalized_dataset")
    os.makedirs(output_dir, exist_ok=True)

    print(f"Reading sales CSV from: {sales_csv_path}")
    sales_df = parse_sales_csv(sales_csv_path)

    print("Computing inventory and medicine IDs...")
    inventory_df, name_to_id = compute_inventory(sales_df)

    print("Building customers...")
    customers_df = build_customers(sales_df)

    print("Building purchase invoices...")
    purchase_invoices_df = build_purchase_invoices(sales_df, customers_df)

    print("Building purchase items...")
    purchase_items_df = build_purchase_items(sales_df, name_to_id)

    print("Building returns and refunds...")
    returns_df, refunds_df = build_returns_and_refunds(purchase_items_df)

    print("Building prescriptions and prescription medicines...")
    prescriptions_df, rx_medicines_df = build_prescriptions(purchase_items_df)

    # Write outputs
    files_to_write = [
        ("Inventory.csv", inventory_df),
        ("Customers.csv", customers_df),
        ("Purchase_Invoice.csv", purchase_invoices_df),
        ("Purchase_Item.csv", purchase_items_df.drop(columns=["prescription_required", "category"])),
        ("Medicine_Return.csv", returns_df),
        ("Refund.csv", refunds_df),
        ("Prescription.csv", prescriptions_df),
        ("Prescription_Medicines.csv", rx_medicines_df),
    ]

    for fname, frame in files_to_write:
        path = os.path.join(output_dir, fname)
        frame.to_csv(path, index=False)
        print(f"Wrote {fname}: {len(frame):,} rows")

    print("Done. Output directory:", output_dir)


if __name__ == "__main__":
    main()


