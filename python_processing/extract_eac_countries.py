#!/usr/bin/env python3
"""
Extract EAC countries from Excel file and create JSON data for filtering
"""

import pandas as pd
import json
import os

def extract_eac_countries():
    """Extract EAC countries from the Excel EAC sheet"""

    # Try different possible paths for the Excel file
    possible_paths = [
        "../data/raw/2025Q1_Trade_report_annexTables.xlsx",
        "data/raw/2025Q1_Trade_report_annexTables.xlsx",
        "../data/raw/2025Q1_Trade_report_annexTables.xlsx"
    ]

    excel_file = None
    for path in possible_paths:
        if os.path.exists(path):
            excel_file = path
            break

    if not excel_file:
        print("Error: Excel file not found in any of the expected locations")
        return

    try:
        # Read the EAC sheet
        df = pd.read_excel(excel_file, sheet_name='EAC')

        print(f"EAC Sheet shape: {df.shape}")
        print(f"EAC Sheet columns: {list(df.columns)}")

        # Look for country names in the data
        # Based on the structure, countries are in column "Unnamed: 2" (index 2)
        # They appear in rows where column 1 has "Exports" and column 2 has the country name
        countries = []

        # Skip header rows and find country names
        for idx, row in df.iterrows():
            # Look for rows where the first column contains "Exports"
            first_col = str(row.iloc[0]).strip() if not pd.isna(row.iloc[0]) else ""
            second_col = str(row.iloc[1]).strip() if not pd.isna(row.iloc[1]) else ""
            third_col = str(row.iloc[2]).strip() if not pd.isna(row.iloc[2]) else ""

            # Check if this is a row with country data (first column has "Exports" or is NaN, and third column has a country name)
            if (first_col == "Exports" or pd.isna(row.iloc[0])) and third_col and third_col != "Partner \\ Period":
                # Clean up the country name
                clean_name = third_col.strip()
                if clean_name and len(clean_name) > 2 and clean_name.lower() not in ['nan', 'partner \\ period']:
                    countries.append(clean_name)

        # Remove duplicates and clean
        unique_countries = list(set(countries))
        unique_countries.sort()

        # Clean up country names
        cleaned_countries = []
        for country in unique_countries:
            if country == "DRC":
                cleaned_countries.append("Democratic Republic of the Congo")
            elif country == "EAC":
                continue  # Skip EAC as it's a regional block, not a country
            else:
                cleaned_countries.append(country)

        unique_countries = cleaned_countries

        print(f"Found {len(unique_countries)} EAC countries:")
        for country in unique_countries:
            print(f"  - {country}")

        # Create the JSON structure
        eac_data = {
            "eac_countries": unique_countries,
            "metadata": {
                "source": "EAC sheet from 2025Q1_Trade_report_annexTables.xlsx",
                "total_countries": len(unique_countries),
                "extraction_date": pd.Timestamp.now().isoformat()
            }
        }

        # Save to data/processed/
        output_path = "../data/processed/eac_countries.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(eac_data, f, indent=2, ensure_ascii=False)

        print(f"\nEAC countries data saved to {output_path}")

        # Also create a simple list for easier frontend consumption
        simple_list = {
            "countries": unique_countries,
            "default": "All Countries"
        }

        simple_path = "../data/processed/eac_countries_simple.json"
        with open(simple_path, 'w', encoding='utf-8') as f:
            json.dump(simple_list, f, indent=2, ensure_ascii=False)

        print(f"Simple EAC countries list saved to {simple_path}")

    except Exception as e:
        print(f"Error processing Excel file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    extract_eac_countries()