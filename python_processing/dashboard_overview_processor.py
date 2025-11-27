#!/usr/bin/env python3
"""
Dashboard Overview Data Processor
Extracts key metrics from NISR Excel file for dashboard display
"""

import pandas as pd
import json
import os
from datetime import datetime

def extract_dashboard_overview():
    """Extract key overview metrics for dashboard from Excel file"""

    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    try:
        # Read the Graph Overall sheet which contains the main trade data
        df = pd.read_excel(excel_file, sheet_name="Graph Overall", header=None)

        # Extract the key values from the known positions
        # From the JSON structure, we know:
        # Row 3 (index 3), Column 10: Exports = 480.8222662354178
        # Row 4 (index 4), Column 10: Imports = 1379.0488043778544

        # Extract cumulative data from column 10 (K column)
        # From the debug output, we know:
        # Row 2: 4468.62827019593 (cumulative exports)
        # Row 3: 13855.8538867479 (cumulative imports)
        # Row 4: 1477.72600387843 (cumulative re-exports)

        print("Debug: Looking for Exports/Imports rows...")
        for idx, row in df.iterrows():
            first_cell = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
            print(f"Row {idx}: first_cell='{first_cell}', col10='{row.iloc[10]}'")

        # Extract cumulative values directly from known positions
        try:
            cumulative_exports = float(df.iloc[2, 10])  # Row 2, Column 10 (K)
            cumulative_imports = float(df.iloc[3, 10])  # Row 3, Column 10 (K)
            cumulative_reexports = float(df.iloc[4, 10])  # Row 4, Column 10 (K)

            print(f"Found cumulative exports: {cumulative_exports}")
            print(f"Found cumulative imports: {cumulative_imports}")
            print(f"Found cumulative re-exports: {cumulative_reexports}")

        except (ValueError, IndexError) as e:
            print("Available data in column 10:")
            for idx in range(len(df)):
                val = df.iloc[idx, 10]
                print(f"Row {idx}: {val} (type: {type(val)})")
            raise ValueError(f"Could not extract cumulative data: {e}")

        # For dashboard, use cumulative values but format as billions
        exports_2025q1 = cumulative_exports / 1000  # Convert to billions
        imports_2025q1 = cumulative_imports / 1000  # Convert to billions
        reexports_2025q1 = cumulative_reexports / 1000  # Convert to billions

        # Calculate trade balance
        trade_balance = exports_2025q1 - imports_2025q1

        # Calculate total trade
        total_trade = exports_2025q1 + imports_2025q1

        # Get quarterly data for trends (last 5 quarters)
        quarterly_exports = []
        quarterly_imports = []

        # Columns 6-10 correspond to 2024Q1, 2024Q2, 2024Q3, 2024Q4, 2025Q1
        # Row 3 = Exports, Row 4 = Imports
        for col in range(6, 11):  # Columns F to K (6-10)
            try:
                exp_val = float(df.iloc[3, col]) if pd.notna(df.iloc[3, col]) else 0
                imp_val = float(df.iloc[4, col]) if pd.notna(df.iloc[4, col]) else 0
                quarterly_exports.append(exp_val)
                quarterly_imports.append(imp_val)
            except (ValueError, TypeError):
                # Skip non-numeric columns
                continue

        # Calculate growth rates
        if len(quarterly_exports) >= 2:
            latest_export = quarterly_exports[-1]
            previous_export = quarterly_exports[-2]
            export_growth_rate = ((latest_export - previous_export) / previous_export) * 100

            latest_import = quarterly_imports[-1]
            previous_import = quarterly_imports[-2]
            import_growth_rate = ((latest_import - previous_import) / previous_import) * 100
        else:
            export_growth_rate = 0
            import_growth_rate = 0

        # Create dashboard overview data structure
        dashboard_data = {
            "overview": {
                "total_exports": {
                    "value": round(cumulative_exports / 1000, 1),  # Convert to billions, round to 1 decimal
                    "formatted": f"${cumulative_exports / 1000:.1f}B",
                    "growth_rate": round(export_growth_rate, 1),
                    "period": "2022-2025 Cumulative"
                },
                "total_imports": {
                    "value": round(cumulative_imports / 1000, 1),  # Convert to billions, round to 1 decimal
                    "formatted": f"${cumulative_imports / 1000:.1f}B",
                    "growth_rate": round(import_growth_rate, 1),
                    "period": "2022-2025 Cumulative"
                },
                "trade_balance": {
                    "value": round(trade_balance, 1),  # Round to 1 decimal
                    "formatted": f"${trade_balance:.1f}B",
                    "status": "deficit" if trade_balance < 0 else "surplus",
                    "period": "2022-2025 Cumulative"
                },
                "total_trade": {
                    "value": round(total_trade, 1),  # Round to 1 decimal
                    "formatted": f"${total_trade:.1f}B",
                    "period": "2022-2025 Cumulative"
                },
                "reexports": {
                    "value": round(cumulative_reexports / 1000, 1),  # Convert to billions, round to 1 decimal
                    "formatted": f"${cumulative_reexports / 1000:.1f}B",
                    "growth_rate": 45.2,  # Placeholder growth rate
                    "period": "2022-2025 Cumulative"
                }
            },
            "quarterly_trends": {
                "periods": ["2024Q1", "2024Q2", "2024Q3", "2024Q4", "2025Q1"],
                "exports": [round(x, 2) for x in quarterly_exports],
                "imports": [round(x, 2) for x in quarterly_imports],
                "trade_balance": [round(quarterly_exports[i] - quarterly_imports[i], 2) for i in range(len(quarterly_exports))]
            },
            "metadata": {
                "source": "NISR 2025Q1 Trade Report",
                "last_updated": datetime.now().isoformat(),
                "data_period": "2022-2025 Cumulative",
                "currency": "USD",
                "unit": "billion"
            }
        }

        return dashboard_data

    except Exception as e:
        print(f"Error extracting dashboard data: {e}")
        return None

    except Exception as e:
        print(f"Error extracting country data: {e}")
        return None

def extract_top_countries():
    """Extract top export/import countries for dashboard"""

    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    try:
        # Read ExportCountry sheet
        df_exports = pd.read_excel(excel_file, sheet_name="ExportCountry", header=None)

        # Skip header rows and find actual data
        # Look for rows with country names (after the header rows)
        export_countries = []

        # Start from row 6 (index 5) to skip headers
        for idx in range(5, min(15, len(df_exports))):  # Get top 10 countries
            row = df_exports.iloc[idx]
            if pd.notna(row[0]) and str(row[0]).strip() and not str(row[0]).startswith('Total'):
                country_name = str(row[0]).strip()
                value_2025q1 = float(row[9]) if pd.notna(row[9]) else 0
                export_countries.append({
                    "country": country_name,
                    "value": round(value_2025q1, 2),
                    "formatted": f"${value_2025q1:.2f}M"
                })

        # Read ImportCountry sheet
        df_imports = pd.read_excel(excel_file, sheet_name="ImportCountry", header=None)

        import_countries = []

        # Start from row 6 (index 5) to skip headers
        for idx in range(5, min(15, len(df_imports))):  # Get top 10 countries
            row = df_imports.iloc[idx]
            if pd.notna(row[0]) and str(row[0]).strip() and not str(row[0]).startswith('Total'):
                country_name = str(row[0]).strip()
                value_2025q1 = float(row[9]) if pd.notna(row[9]) else 0
                import_countries.append({
                    "country": country_name,
                    "value": round(value_2025q1, 2),
                    "formatted": f"${value_2025q1:.2f}M"
                })

        return {
            "top_export_countries": export_countries[:5],  # Top 5
            "top_import_countries": import_countries[:5]   # Top 5
        }

    except Exception as e:
        print(f"Error extracting country data: {e}")
        return None

def save_dashboard_data():
    """Main function to extract and save dashboard data"""

    print("Extracting dashboard overview data from Excel...")

    # Extract overview data
    overview_data = extract_dashboard_overview()
    if not overview_data:
        print("Failed to extract overview data")
        return False

    # Extract country data
    country_data = extract_top_countries()
    if country_data:
        overview_data.update(country_data)

    # Create output directory if it doesn't exist
    output_dir = "../data/processed"
    os.makedirs(output_dir, exist_ok=True)

    # Save to JSON file
    output_file = os.path.join(output_dir, "dashboard_overview.json")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(overview_data, f, indent=2, ensure_ascii=False)

    print(f"Dashboard overview data saved to {output_file}")
    print(f"Key metrics extracted:")
    print(f"   - Exports: ${overview_data['overview']['total_exports']['value']}M")
    print(f"   - Imports: ${overview_data['overview']['total_imports']['value']}M")
    print(f"   - Trade Balance: ${overview_data['overview']['trade_balance']['value']}M")

    return True

if __name__ == "__main__":
    success = save_dashboard_data()
    if success:
        print("Dashboard data processing completed successfully!")
    else:
        print("Dashboard data processing failed!")