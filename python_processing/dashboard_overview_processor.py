#!/usr/bin/env python3
"""
Dashboard Overview Data Processor
Extracts key metrics and overview data from NISR Excel file for dashboard display
"""

import pandas as pd
import json
import os
from pathlib import Path

def format_number(num):
    """Format number to readable string with appropriate suffix"""
    if num >= 1e9:
        return f"${(num / 1e9):.2f}B"
    elif num >= 1e6:
        return f"${(num / 1e6):.1f}M"
    elif num >= 1e3:
        return f"${(num / 1e3):.1f}K"
    else:
        return f"${num:.1f}"

def calculate_growth_rate(current, previous):
    """Calculate growth rate percentage"""
    if previous == 0:
        return 0
    return ((current - previous) / previous) * 100

def extract_overview_data():
    """Extract overview data from Excel file   """  

    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    if not os.path.exists(excel_file):
        print(f"Excel file not found: {excel_file}")
        return None

    try:
        # Read all sheets
        excel_data = pd.read_excel(excel_file, sheet_name=None)
        print(f"Loaded Excel file with {len(excel_data)} sheets")

        overview_data = {
            "overview": {},
            "top_export_countries": [],
            "top_import_countries": [],
            "quarterly_trends": {}
        }

        # Extract data from "Total trade with the World" sheet for quarterly metrics
        if "Total trade with the World" in excel_data:
            df = excel_data["Total trade with the World"]
            print(f"Processing 'Total trade with the World' sheet with shape: {df.shape}")
            print("First 10 rows:")
            print(df.head(10))

            # The data is structured differently - let's examine it
            print("Values in column 2 (where 2025Q1 should be):")
            for idx, val in enumerate(df.iloc[:, 2]):
                print(f"  Row {idx}: '{val}' (type: {type(val)})")

            # The data structure from excel_structure.json:
            # Row 2: "Partner \ Period" in column 3, periods in columns 4-11
            # Row 3: "WORLD" in column 3, exports values in columns 4-11
            # Row 5: "WORLD" in column 3, imports values in columns 4-11
            # Column 11 contains 2025Q1 data

            # Find WORLD exports and imports rows
            world_exports_row = df[df.iloc[:, 2] == "WORLD"].iloc[0] if len(df[df.iloc[:, 2] == "WORLD"]) > 0 else None
            world_imports_row = df[df.iloc[:, 2] == "WORLD"].iloc[1] if len(df[df.iloc[:, 2] == "WORLD"]) > 1 else None

            if world_exports_row is not None and world_imports_row is not None:
                # Extract 2025Q1 values (column 11)
                total_exports = float(world_exports_row.iloc[11]) if not pd.isna(world_exports_row.iloc[11]) else 0
                total_imports = float(world_imports_row.iloc[11]) if not pd.isna(world_imports_row.iloc[11]) else 0
                trade_balance = total_exports - total_imports

                print(f"Raw values - Exports: {total_exports}, Imports: {total_imports}, Balance: {trade_balance}")

                # Calculate growth rates (2024Q1 is in column 10)
                export_growth = 0
                import_growth = 0

                prev_exports = float(world_exports_row.iloc[10]) if not pd.isna(world_exports_row.iloc[10]) else 0
                prev_imports = float(world_imports_row.iloc[10]) if not pd.isna(world_imports_row.iloc[10]) else 0

                if prev_exports > 0:
                    export_growth = calculate_growth_rate(total_exports, prev_exports)
                if prev_imports > 0:
                    import_growth = calculate_growth_rate(total_imports, prev_imports)

                overview_data["overview"] = {
                    "total_exports": {
                        "value": total_exports,
                        "formatted": format_number(total_exports),
                        "growth_rate": round(export_growth, 1)
                    },
                    "total_imports": {
                        "value": total_imports,
                        "formatted": format_number(total_imports),
                        "growth_rate": round(import_growth, 1)
                    },
                    "trade_balance": {
                        "value": trade_balance,
                        "formatted": format_number(trade_balance),
                        "status": "deficit" if trade_balance < 0 else "surplus"
                    },
                    "total_trade": {
                        "value": total_exports + total_imports,
                        "formatted": format_number(total_exports + total_imports)
                    }
                }

                print(f"Overview metrics extracted: Exports {format_number(total_exports)}, Imports {format_number(total_imports)}, Balance {format_number(trade_balance)}")
            else:
                print("Could not find WORLD trade data rows")

        # Extract top export countries from "ExportCountry" sheet
        if "ExportCountry" in excel_data:
            df = excel_data["ExportCountry"]

            # Find rows with country data (skip headers)
            country_data = []
            for idx, row in df.iterrows():
                if idx >= 3:  # Skip header rows
                    country_name = str(row.iloc[0]).strip()
                    if country_name and not pd.isna(country_name) and country_name != "nan":
                        try:
                            # Get the latest value (2025Q1)
                            value_2025q1 = float(row.iloc[-1]) if not pd.isna(row.iloc[-1]) else 0
                            if value_2025q1 > 0:
                                country_data.append({
                                    "country": country_name,
                                    "value": value_2025q1,
                                    "formatted": format_number(value_2025q1)
                                })
                        except (ValueError, IndexError):
                            continue

            # Sort by value and take top 10
            country_data.sort(key=lambda x: x["value"], reverse=True)
            overview_data["top_export_countries"] = country_data[:10]

            print(f"Top export countries extracted: {len(overview_data['top_export_countries'])} countries")

        # Extract top import countries from "ImportCountry" sheet
        if "ImportCountry" in excel_data:
            df = excel_data["ImportCountry"]

            # Find rows with country data (skip headers)
            country_data = []
            for idx, row in df.iterrows():
                if idx >= 3:  # Skip header rows
                    country_name = str(row.iloc[0]).strip()
                    if country_name and not pd.isna(country_name) and country_name != "nan":
                        try:
                            # Get the latest value (2025Q1)
                            value_2025q1 = float(row.iloc[-1]) if not pd.isna(row.iloc[-1]) else 0
                            if value_2025q1 > 0:
                                country_data.append({
                                    "country": country_name,
                                    "value": value_2025q1,
                                    "formatted": format_number(value_2025q1)
                                })
                        except (ValueError, IndexError):
                            continue

            # Sort by value and take top 10
            country_data.sort(key=lambda x: x["value"], reverse=True)
            overview_data["top_import_countries"] = country_data[:10]

            print(f"Top import countries extracted: {len(overview_data['top_import_countries'])} countries")

        # Extract quarterly trends from "Graph Overall"
        if "Graph Overall" in excel_data:
            df = excel_data["Graph Overall"]

            quarterly_exports = []
            quarterly_imports = []
            quarterly_balance = []

            # Extract quarterly data
            for col in df.columns:
                if "Q" in str(col) and ("2023" in str(col) or "2024" in str(col) or "2025" in str(col)):
                    quarter = str(col)

                    exports_row = df[df.iloc[:, 1] == "Exports"]
                    imports_row = df[df.iloc[:, 1] == "Imports"]

                    if not exports_row.empty and not imports_row.empty:
                        try:
                            exp_val = float(exports_row[col].iloc[0])
                            imp_val = float(imports_row[col].iloc[0])
                            bal_val = exp_val - imp_val

                            quarterly_exports.append({
                                "quarter": quarter,
                                "value": exp_val
                            })
                            quarterly_imports.append({
                                "quarter": quarter,
                                "value": imp_val
                            })
                            quarterly_balance.append({
                                "quarter": quarter,
                                "value": bal_val
                            })
                        except (ValueError, IndexError):
                            continue

            overview_data["quarterly_trends"] = {
                "exports": quarterly_exports,
                "imports": quarterly_imports,
                "trade_balance": quarterly_balance
            }

            print(f"Quarterly trends extracted: {len(quarterly_exports)} quarters")

        return overview_data

    except Exception as e:
        print(f"Error processing Excel file: {e}")
        return None

def save_dashboard_overview(data):
    """Save dashboard overview data to JSON file"""

    output_dir = "../data/processed"
    os.makedirs(output_dir, exist_ok=True)

    output_file = os.path.join(output_dir, "dashboard_overview.json")

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"Dashboard overview data saved to: {output_file}")
        return True

    except Exception as e:
        print(f"Error saving dashboard data: {e}")
        return False

def main():
    """Main function to process dashboard overview data"""

    print("Starting Dashboard Overview Data Processing...")
    print("=" * 50)

    # Extract data from Excel
    data = extract_overview_data()

    if data:
        # Save to JSON
        success = save_dashboard_overview(data)

        if success:
            print("=" * 50)
            print("Dashboard overview processing completed successfully!")
            print("\nSummary:")
            print(f"   - Total Exports: {data['overview'].get('total_exports', {}).get('formatted', 'N/A')}")
            print(f"   - Total Imports: {data['overview'].get('total_imports', {}).get('formatted', 'N/A')}")
            print(f"   - Trade Balance: {data['overview'].get('trade_balance', {}).get('formatted', 'N/A')}")
            print(f"   - Top Export Countries: {len(data.get('top_export_countries', []))}")
            print(f"   - Top Import Countries: {len(data.get('top_import_countries', []))}")
            print(f"   - Quarterly Data Points: {len(data.get('quarterly_trends', {}).get('exports', []))}")
        else:
            print("Failed to save dashboard data")
            return False
    else:
        print("Failed to extract data from Excel file")
        return False

    return True

if __name__ == "__main__":
    main()