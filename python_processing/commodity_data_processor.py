#!/usr/bin/env python3
"""
Commodity Data Processor for Rwanda Trade Analysis
Processes ExportsCommodity, ImportsCommodity, and ReexportsCommodity sheets
Generates JSON data for frontend visualization
"""

import pandas as pd
import json
import os
from datetime import datetime
import numpy as np

class CommodityDataProcessor:
    def __init__(self):
        self.excel_file = '../data/raw/2025Q1_Trade_report_annexTables.xlsx'
        self.output_dir = '../data/processed'
        self.sheets = {
            'exports': 'ExportsCommodity',
            'imports': 'ImportsCommodity',
            'reexports': 'ReexportsCommodity'
        }

        # SITC section descriptions
        self.sitc_descriptions = {
            '0': 'Food and live animals',
            '1': 'Beverages and tobacco',
            '2': 'Crude materials, inedible, except fuels',
            '3': 'Mineral fuels, lubricants and related materials',
            '4': 'Animals and vegetable oils, fats & waxes',
            '5': 'Chemicals & related products',
            '6': 'Manufactured goods classified chiefly by material',
            '7': 'Machinery and transport equipment',
            '8': 'Miscellaneous manufactured articles',
            '9': 'Other commodities & transactions'
        }

        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)

    def process_all_commodities(self):
        """Process all three commodity sheets and generate JSON files"""
        print("Starting commodity data processing...")

        results = {}
        for data_type, sheet_name in self.sheets.items():
            print(f"Processing {data_type} data from {sheet_name}...")
            results[data_type] = self.process_commodity_sheet(sheet_name, data_type)

        # Generate summary
        summary = self.generate_summary(results)
        self.save_json(summary, 'commodity_summary.json')

        print("Commodity data processing completed!")
        return results

    def process_commodity_sheet(self, sheet_name, data_type):
        """Process a single commodity sheet"""
        try:
            # Read the sheet
            df = pd.read_excel(self.excel_file, sheet_name=sheet_name, header=None)

            # Find the data start row (skip headers)
            data_start_row = self.find_data_start(df)

            # Extract column headers
            headers = self.extract_headers(df, data_start_row)

            # Extract data rows
            data_rows = df.iloc[data_start_row + 1:].copy()

            # Process each commodity
            commodities = []
            for idx, row in data_rows.iterrows():
                commodity = self.process_commodity_row(row, headers, data_type)
                if commodity:
                    commodities.append(commodity)

            # Save individual file
            filename = f'{data_type}commodity_data.json'
            self.save_json(commodities, filename)

            print(f"Processed {len(commodities)} {data_type} commodities")
            return commodities

        except Exception as e:
            print(f"Error processing {sheet_name}: {e}")
            return []

    def find_data_start(self, df):
        """Find where the actual data starts (after headers)"""
        for idx, row in df.iterrows():
            # Look for row containing 'SITC SECTION'
            if row.astype(str).str.contains('SITC SECTION', case=False, na=False).any():
                return idx
        return 3  # Default fallback

    def extract_headers(self, df, data_start_row):
        """Extract column headers from the data row"""
        header_row = df.iloc[data_start_row]

        headers = []
        for col_idx, value in enumerate(header_row):
            if pd.isna(value):
                headers.append(f'col_{col_idx}')
            else:
                headers.append(str(value).strip())

        return headers

    def process_commodity_row(self, row, headers, data_type):
        """Process a single commodity data row"""
        try:
            # Extract SITC section (first column)
            sitc_section_raw = row.iloc[0]

            # Skip if NaN or not a valid SITC section
            if pd.isna(sitc_section_raw):
                return None

            # Convert to string and check if it's a valid SITC section (0-9)
            sitc_section = str(int(float(sitc_section_raw))) if str(sitc_section_raw).replace('.', '').isdigit() else str(sitc_section_raw).strip()

            # Skip if not a single digit SITC section
            if sitc_section not in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                return None

            # Create commodity object
            commodity = {
                'sitc_section': sitc_section,
                'commodity_description': self.sitc_descriptions.get(sitc_section, f'SITC Section {sitc_section}'),
                'data_type': data_type
            }

            # Process quarterly data columns (skip first column which is SITC)
            quarterly_data = {}
            growth_rates = {}
            share_percentage = None

            # Map column indices to quarter names (based on typical Excel structure)
            # Assuming columns 1-9 are quarters, 10 is share %, 11-12 are growth rates
            quarter_names = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

            for col_idx, header in enumerate(headers):
                if col_idx == 0:  # Skip SITC column
                    continue

                value = row.iloc[col_idx]
                if pd.isna(value):
                    continue

                header_str = str(header).strip()

                # Map columns to proper names
                if col_idx <= 9:  # Quarterly data columns (1-9)
                    quarter_name = quarter_names[col_idx - 1] if col_idx - 1 < len(quarter_names) else f'Q{col_idx}'
                    try:
                        quarterly_data[quarter_name] = float(value)
                    except (ValueError, TypeError):
                        quarterly_data[quarter_name] = 0
                elif header_str == '100':
                    # Share percentage column
                    try:
                        share_percentage = float(value)
                    except (ValueError, TypeError):
                        share_percentage = 0
                elif header_str.startswith('-'):
                    # Growth rate columns - map to meaningful names
                    if 'qoq' in header_str.lower() or col_idx == 11:
                        growth_rates['qoq_growth_rate'] = float(value) if not pd.isna(value) else 0
                    elif 'yoy' in header_str.lower() or col_idx == 12:
                        growth_rates['yoy_growth_rate'] = float(value) if not pd.isna(value) else 0
                    else:
                        growth_rates[f'growth_rate_{col_idx}'] = float(value) if not pd.isna(value) else 0
                else:
                    # Other metadata
                    commodity[header_str.lower().replace(' ', '_').replace('/', '_')] = str(value)

            # Add quarterly data with proper quarter names
            commodity.update(quarterly_data)

            # Add growth rates
            commodity.update(growth_rates)

            # Add share percentage
            if share_percentage is not None:
                commodity['share_percentage'] = share_percentage

            # Calculate additional metrics
            commodity.update(self.calculate_metrics_v3(commodity, quarterly_data))

            return commodity

        except Exception as e:
            print(f"Warning: Error processing commodity row: {e}")
            return None

    def calculate_metrics_v3(self, commodity, quarterly_data):
        """Calculate additional metrics for a commodity"""
        metrics = {}

        if not quarterly_data:
            return metrics

        # Get quarterly values as list
        quarterly_values = list(quarterly_data.values())

        # Latest value
        metrics['latest_value'] = quarterly_values[-1] if quarterly_values else 0

        # Calculate growth rates if we have enough data
        if len(quarterly_values) >= 2:
            # Quarter-over-quarter growth (compare last two values)
            prev_value = quarterly_values[-2]
            current_value = quarterly_values[-1]

            if prev_value != 0:
                qoq_growth = ((current_value - prev_value) / prev_value) * 100
                metrics['qoq_growth'] = round(qoq_growth, 2)
            else:
                metrics['qoq_growth'] = 0

            # Year-over-year growth (if we have enough quarters)
            if len(quarterly_values) >= 5:
                # Compare with value 4 quarters ago (approximate YoY)
                yoy_prev_value = quarterly_values[-5]
                if yoy_prev_value != 0:
                    yoy_growth = ((current_value - yoy_prev_value) / yoy_prev_value) * 100
                    metrics['yoy_growth'] = round(yoy_growth, 2)
                else:
                    metrics['yoy_growth'] = 0

        # Trend analysis
        metrics['trend'] = self.analyze_trend(quarterly_values)

        return metrics

    def analyze_trend(self, values):
        """Analyze trend based on quarterly values"""
        if len(values) < 3:
            return 'Insufficient Data'

        # Calculate recent trend (last 3 values)
        recent = values[-3:]
        if recent[2] > recent[1] > recent[0]:
            return 'Strong Growth'
        elif recent[2] > recent[1]:
            return 'Moderate Growth'
        elif recent[2] < recent[1] < recent[0]:
            return 'Declining'
        else:
            return 'Stable'

    def generate_summary(self, results):
        """Generate overall commodity summary"""
        summary = {
            'generated_at': datetime.now().isoformat(),
            'total_exports_commodities': len(results.get('exports', [])),
            'total_imports_commodities': len(results.get('imports', [])),
            'total_reexports_commodities': len(results.get('reexports', [])),
            'data_sources': list(self.sheets.values())
        }

        # Calculate totals
        for data_type, commodities in results.items():
            if commodities:
                total_value = sum(c.get('latest_value', 0) for c in commodities)
                summary[f'total_{data_type}_value'] = round(total_value, 2)

                # Top commodities
                top_commodities = sorted(commodities,
                                       key=lambda x: x.get('latest_value', 0),
                                       reverse=True)[:5]

                summary[f'top_{data_type}_commodities'] = [
                    {
                        'sitc_section': c['sitc_section'],
                        'description': c['commodity_description'],
                        'value': round(c.get('latest_value', 0), 2),
                        'share': round(c.get('share_percentage', 0), 2)
                    }
                    for c in top_commodities
                ]

        # Trade balance calculation
        exports_total = summary.get('total_exports_value', 0)
        imports_total = summary.get('total_imports_value', 0)
        summary['trade_balance'] = round(exports_total - imports_total, 2)
        summary['balance_type'] = 'surplus' if exports_total >= imports_total else 'deficit'

        return summary

    def save_json(self, data, filename):
        """Save data to JSON file"""
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {filename} ({len(json.dumps(data))} bytes)")

def main():
    """Main execution function"""
    processor = CommodityDataProcessor()
    results = processor.process_all_commodities()

    print("\nProcessing Summary:")
    print(f"Exports commodities: {len(results.get('exports', []))}")
    print(f"Imports commodities: {len(results.get('imports', []))}")
    print(f"Re-exports commodities: {len(results.get('reexports', []))}")

if __name__ == "__main__":
    main()