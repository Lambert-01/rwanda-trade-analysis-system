#!/usr/bin/env python3
"""
Examine Excel file structure to understand data layout
"""

import pandas as pd
import json

def examine_excel_structure():
    """Examine the structure of the Excel file"""

    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    # Try alternative path if the first one doesn't work
    import os
    if not os.path.exists(excel_file):
        excel_file = "data/raw/2025Q1_Trade_report_annexTables.xlsx"

    try:
        # Read all sheets
        excel_data = pd.read_excel(excel_file, sheet_name=None)

        structure_info = {}

        for sheet_name, df in excel_data.items():
            print(f"\n=== Sheet: {sheet_name} ===")
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")

            # Show first few rows
            print("First 5 rows:")
            print(df.head())

            # Check for data patterns
            structure_info[sheet_name] = {
                'shape': df.shape,
                'columns': list(df.columns),
                'first_rows': df.head().to_dict('records'),
                'data_types': df.dtypes.to_dict()
            }

        # Save structure info
        with open('excel_structure.json', 'w') as f:
            json.dump(structure_info, f, indent=2, default=str)

        print("\nStructure saved to excel_structure.json")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    examine_excel_structure()