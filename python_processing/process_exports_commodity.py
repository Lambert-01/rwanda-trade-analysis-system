#!/usr/bin/env python3
"""
Process Exports Commodity Data from Excel
=========================================

This script processes the ExportsCommodity sheet from the trade report Excel file
and generates a properly structured JSON file for the commodity donut chart visualization.

Usage:
    python process_exports_commodity.py

Input:
    data/raw/2025Q1_Trade_report_annexTables.xlsx (sheet: ExportsCommodity)

Output:
    data/processed/exportscommodity_data.json
"""

import pandas as pd
import json
import numpy as np
from pathlib import Path
import sys

def calculate_growth_rate(current, previous):
    """Calculate growth rate between two periods"""
    if previous == 0 or pd.isna(previous):
        return 0
    return ((current - previous) / previous) * 100

def calculate_yoy_growth_rate(values):
    """Calculate year-over-year growth rate"""
    if len(values) < 2:
        return 0

    current_year_avg = np.mean(values[-1:])  # Last quarter
    previous_year_avg = np.mean(values[:-1]) if len(values) > 1 else values[0]

    if previous_year_avg == 0:
        return 0

    return ((current_year_avg - previous_year_avg) / previous_year_avg) * 100

def process_exports_commodity():
    """Process the ExportsCommodity sheet and generate JSON"""

    # File paths
    input_file = Path(__file__).parent.parent / 'data' / 'raw' / '2025Q1_Trade_report_annexTables.xlsx'
    output_file = Path(__file__).parent.parent / 'data' / 'processed' / 'exportscommodity_data.json'

    # Ensure input file exists
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    try:
        # Read the Excel file without headers first
        print(f"Reading Excel file: {input_file}")
        df_raw = pd.read_excel(input_file, sheet_name='ExportsCommodity', header=None)

        # Find the row that contains the column headers
        header_row_idx = None
        for idx, row in df_raw.iterrows():
            if any('SITC SECTION' in str(cell) for cell in row.values):
                header_row_idx = idx
                break

        if header_row_idx is None:
            print("Error: Could not find header row with 'SITC SECTION'")
            sys.exit(1)

        # Read the file again with the correct header
        df = pd.read_excel(input_file, sheet_name='ExportsCommodity', header=header_row_idx)

        # Manually set column names based on the expected structure
        expected_columns = [
            'SITC SECTION',
            'COMMODITY DESCRIPTION/ TOTAL ESTIMATES',
            '2023Q1', '2023Q2', '2023Q3', '2023Q4',
            '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1',
            'Shares in % Q1', '% change Q1/Q4', '% change Q1/Q1'
        ]

        # Ensure we have the right number of columns
        if len(df.columns) >= len(expected_columns):
            df.columns = expected_columns + [f'Unnamed_{i}' for i in range(len(expected_columns), len(df.columns))]
        else:
            print(f"Warning: Expected {len(expected_columns)} columns but found {len(df.columns)}")

        print("Columns set to:", list(df.columns))
        print("First 5 rows:")
        print(df.head())

        # Filter out rows that don't have numeric SITC sections
        df = df[df['SITC SECTION'].astype(str).str.match(r'^\d+$', na=False)].copy()

        if df.empty:
            print("Error: No valid data rows found after filtering")
            sys.exit(1)

        print(f"Found {len(df)} valid data rows")

        # Reset index
        df = df.reset_index(drop=True)

        # Clean up the dataframe
        df = df.dropna(subset=['SITC SECTION'])

        # Convert SITC SECTION to string and clean
        df['SITC SECTION'] = df['SITC SECTION'].astype(str).str.strip()

        # Rename columns for easier access
        column_mapping = {
            'SITC SECTION': 'sitc_section',
            'COMMODITY DESCRIPTION/ TOTAL ESTIMATES': 'commodity_description'
        }
        df = df.rename(columns=column_mapping)

        # Quarter columns
        quarter_columns = ['2023Q1', '2023Q2', '2023Q3', '2023Q4',
                          '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        # Ensure quarter columns exist and are numeric
        for col in quarter_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = 0

        # Process each commodity
        commodities_data = []

        for _, row in df.iterrows():
            sitc_section = str(row['sitc_section']).strip()
            commodity_desc = str(row['commodity_description']).strip()

            # Skip if not a valid SITC section
            if not sitc_section or sitc_section == 'nan':
                continue

            # Get quarterly values
            quarterly_values = {}
            values_list = []

            for quarter in quarter_columns:
                value = float(row.get(quarter, 0))
                quarterly_values[quarter] = value
                values_list.append(value)

            # Calculate metrics
            total_exports = sum(values_list)
            latest_value = values_list[-1] if values_list else 0

            # Calculate average (excluding zeros for more accurate average)
            non_zero_values = [v for v in values_list if v > 0]
            average_exports = np.mean(non_zero_values) if non_zero_values else 0

            # Find max value
            max_exports = max(values_list) if values_list else 0

            # Count active quarters (quarters with values > 0)
            quarters_active = len([v for v in values_list if v > 0])

            # Calculate growth rate (comparing latest to previous)
            if len(values_list) >= 2:
                prev_value = values_list[-2]
                growth_rate = calculate_growth_rate(latest_value, prev_value)
            else:
                growth_rate = 0

            # Calculate share percentage (this would need total from somewhere)
            # For now, we'll calculate based on the total row if available
            share_percentage = 0  # Will be calculated after processing all

            # Create commodity object
            commodity_obj = {
                "sitc_section": sitc_section,
                "commodity_description": commodity_desc,
                "data_type": "exports",
                "quarterly_values": quarterly_values,
                "total_exports": total_exports,
                "average_exports": average_exports,
                "max_exports": max_exports,
                "quarters_active": quarters_active,
                "growth_rate": growth_rate / 100,  # Convert to decimal
                "share_percentage": 0,  # Will be updated
                "latest_value": latest_value,
                "qoq_growth": growth_rate,
                "yoy_growth": calculate_yoy_growth_rate(values_list),
                "trend": "Stable"  # Will be determined based on growth
            }

            # Determine trend
            if growth_rate > 10:
                commodity_obj["trend"] = "Strong Growth"
            elif growth_rate > 0:
                commodity_obj["trend"] = "Moderate Growth"
            elif growth_rate < -10:
                commodity_obj["trend"] = "Declining"
            else:
                commodity_obj["trend"] = "Stable"

            commodities_data.append(commodity_obj)

        # Calculate share percentages based on total exports
        if commodities_data:
            total_all_exports = sum([c['total_exports'] for c in commodities_data])
            for commodity in commodities_data:
                if total_all_exports > 0:
                    commodity['share_percentage'] = (commodity['total_exports'] / total_all_exports) * 100
                else:
                    commodity['share_percentage'] = 0

        # Sort by share percentage (descending)
        commodities_data.sort(key=lambda x: x['share_percentage'], reverse=True)

        # Save to JSON
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(commodities_data, f, indent=2, ensure_ascii=False)

        print(f"Successfully processed {len(commodities_data)} commodities")
        print(f"Output saved to: {output_file}")

        # Print summary
        print("\nProcessing Summary:")
        print(f"   Total commodities: {len(commodities_data)}")
        print(f"   Total export value: ${sum([c['total_exports'] for c in commodities_data]):,.2f}")

        top_commodities = sorted(commodities_data, key=lambda x: x['share_percentage'], reverse=True)[:3]
        print("\nTop 3 commodities by share:")
        for i, commodity in enumerate(top_commodities, 1):
            print(f"   {i}. {commodity['commodity_description']}: {commodity['share_percentage']:.1f}%")

    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("Processing Exports Commodity Data")
    print("=" * 50)
    process_exports_commodity()
    print("=" * 50)
    print("Processing completed!")