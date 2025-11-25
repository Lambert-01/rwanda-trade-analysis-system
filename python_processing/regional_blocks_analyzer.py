#!/usr/bin/env python3
"""
Regional Blocks Data Analyzer for Rwanda Trade Data
Analyzes regional blocks column from Excel sheets and exports data in various JSON formats
for API consumption and frontend visualization.
"""

import pandas as pd
import json
import numpy as np
from datetime import datetime
import os

class RegionalBlocksAnalyzer:
    def __init__(self, excel_file_path):
        self.excel_file_path = excel_file_path
        self.output_dir = "../data/processed"
        os.makedirs(self.output_dir, exist_ok=True)

    def load_regional_blocks_data(self):
        """Load and clean the regional blocks data from Excel"""
        try:
            # Read the Regional blocks sheet without headers first
            df = pd.read_excel(self.excel_file_path, sheet_name='Regional blocks', header=None)

            print(f"Raw data shape: {df.shape}")

            # Find the header row and data start
            header_row_idx = None
            data_start_idx = None

            for idx in range(len(df)):
                row = df.iloc[idx]
                row_values = [str(val) for val in row if pd.notna(val)]

                # Look for header row (contains 'Partner')
                if any('Partner' in val for val in row_values):
                    header_row_idx = idx
                    data_start_idx = idx + 1
                    break

            if header_row_idx is None:
                # Fallback: assume data starts at row 2 (after title)
                header_row_idx = 2
                data_start_idx = 3

            print(f"Header row: {header_row_idx}, Data starts: {data_start_idx}")

            # Extract headers
            header_row = df.iloc[header_row_idx]

            # Create clean headers
            headers = []
            for i, val in enumerate(header_row):
                if pd.isna(val) or str(val).strip() == '' or str(val).startswith('Unnamed'):
                    if i == 0:
                        headers.append('regional_block')
                    else:
                        headers.append(f'period_{i}')
                else:
                    headers.append(str(val).strip())

            # Extract data rows
            data_df = df.iloc[data_start_idx:].copy()
            data_df.columns = headers[:len(data_df.columns)]

            # Rename 'Partner' column to 'regional_block' if it exists
            if 'Partner' in data_df.columns:
                data_df = data_df.rename(columns={'Partner': 'regional_block'})

            # Remove empty rows
            data_df = data_df.dropna(how='all')

            # Remove rows where regional_block column is empty
            if 'regional_block' in data_df.columns:
                data_df = data_df[data_df['regional_block'].notna()]
                data_df = data_df[data_df['regional_block'].astype(str).str.strip() != '']

            # Reset index
            data_df = data_df.reset_index(drop=True)

            # Convert numeric columns
            for col in data_df.columns:
                if col != 'regional_block':
                    data_df[col] = pd.to_numeric(data_df[col], errors='coerce')

            # Remove rows that don't have any numeric data
            numeric_cols = [col for col in data_df.columns if col != 'regional_block']
            data_df = data_df.dropna(subset=numeric_cols, how='all')

            # Fill NaN values in regional_block column with empty string temporarily
            data_df['regional_block'] = data_df['regional_block'].fillna('')

            print(f"Final data shape: {data_df.shape}")
            print("Columns:", data_df.columns.tolist())
            print("\nFirst few rows:")
            print(data_df.head())

            return data_df

        except Exception as e:
            print(f"Error loading regional blocks data: {e}")
            import traceback
            traceback.print_exc()
            return None

    def analyze_regional_blocks(self, df):
        """Analyze the regional blocks data and create various output formats"""

        if df is None or df.empty:
            return {}

        results = {}

        # 1. Basic regional blocks summary
        results['regional_blocks_summary'] = self._create_regional_blocks_summary(df)

        # 2. EAC specific analysis (East African Community)
        results['eac_analysis'] = self._create_eac_analysis(df)

        # 3. Continental distribution
        results['continental_distribution'] = self._create_continental_distribution(df)

        # 4. Regional trends over time
        results['regional_trends'] = self._create_regional_trends(df)

        # 5. Regional export distribution
        results['regional_export_distribution'] = self._create_regional_export_distribution(df)

        # 6. Regional insights and recommendations
        results['regional_insights'] = self._create_regional_insights(df)

        # 7. Regional comparison data
        results['regional_comparison'] = self._create_regional_comparison(df)

        return results

    def _create_regional_blocks_summary(self, df):
        """Create basic summary of regional blocks"""
        summary = {
            'generated_at': datetime.now().isoformat(),
            'total_regional_blocks': len(df),
            'regional_blocks': []
        }

        # Get the latest period column (usually the last numeric column)
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if numeric_cols:
            latest_period = numeric_cols[-1]  # Assume last column is most recent

            for _, row in df.iterrows():
                block_data = {
                    'regional_block': str(row['regional_block']),
                    'latest_value': float(row[latest_period]) if pd.notna(row[latest_period]) else 0,
                    'period': latest_period
                }
                summary['regional_blocks'].append(block_data)

            # Sort by value descending
            summary['regional_blocks'].sort(key=lambda x: x['latest_value'], reverse=True)

        return summary

    def _create_eac_analysis(self, df):
        """Create EAC-specific analysis"""
        eac_data = {
            'generated_at': datetime.now().isoformat(),
            'eac_trade': [],
            'eac_stats': {}
        }

        # EAC members and related regional blocks
        eac_blocks = ['EAC', 'CEPGL', 'COMESA']  # EAC, CEPGL, COMESA are African regional blocks

        # Get numeric columns
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        for block in eac_blocks:
            block_row = df[df['regional_block'].str.contains(block, case=False, na=False)]
            if not block_row.empty:
                row = block_row.iloc[0]
                block_info = {
                    'regional_block': block,
                    'trade_volume': float(row[numeric_cols[-1]]) if numeric_cols else 0,
                    'period': numeric_cols[-1] if numeric_cols else 'unknown'
                }
                eac_data['eac_trade'].append(block_info)

        # Calculate EAC statistics
        if eac_data['eac_trade']:
            total_eac_trade = sum(item['trade_volume'] for item in eac_data['eac_trade'])
            eac_data['eac_stats'] = {
                'total_eac_trade': total_eac_trade,
                'eac_blocks_count': len(eac_data['eac_trade']),
                'top_eac_partner': max(eac_data['eac_trade'], key=lambda x: x['trade_volume'])['regional_block']
            }

        return eac_data

    def _create_continental_distribution(self, df):
        """Create continental distribution analysis"""
        # Map regional blocks to continents
        continent_mapping = {
            'Asia': ['ASEAN', 'SAARC', 'Shanghai Cooperation', 'Asia'],
            'Africa': ['EAC', 'SADC', 'COMESA', 'CEPGL', 'ECOWAS', 'African Union', 'Africa'],
            'Europe': ['EU', 'European Union', 'EEA', 'Europe'],
            'Americas': ['NAFTA', 'USMCA', 'MERCOSUR', 'CARICOM', 'Americas', 'North America', 'South America'],
            'Oceania': ['Pacific Islands', 'Oceania']
        }

        distribution = {
            'generated_at': datetime.now().isoformat(),
            'continental_distribution': [],
            'total_trade_value': 0
        }

        # Get latest period data
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if numeric_cols:
            latest_period = numeric_cols[-1]
            continent_totals = {}

            for _, row in df.iterrows():
                block_name = str(row['regional_block'])
                value = float(row[latest_period]) if pd.notna(row[latest_period]) else 0

                # Determine continent
                continent = 'Other'
                for cont, keywords in continent_mapping.items():
                    if any(keyword.lower() in block_name.lower() for keyword in keywords):
                        continent = cont
                        break

                if continent not in continent_totals:
                    continent_totals[continent] = 0
                continent_totals[continent] += value

            # Convert to list format
            total_trade = sum(continent_totals.values())
            distribution['total_trade_value'] = total_trade

            for continent, value in continent_totals.items():
                share = (value / total_trade * 100) if total_trade > 0 else 0
                distribution['continental_distribution'].append({
                    'continent': continent,
                    'value': value,
                    'share': round(share, 2)
                })

            # Sort by value descending
            distribution['continental_distribution'].sort(key=lambda x: x['value'], reverse=True)

        return distribution

    def _create_regional_trends(self, df):
        """Create regional trends over time"""
        trends = {
            'generated_at': datetime.now().isoformat(),
            'regional_trends': []
        }

        # Get all numeric columns (periods)
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if len(numeric_cols) > 1:
            for _, row in df.iterrows():
                block_trend = {
                    'regional_block': str(row['regional_block']),
                    'periods': []
                }

                for col in numeric_cols:
                    value = float(row[col]) if pd.notna(row[col]) else 0
                    block_trend['periods'].append({
                        'period': col,
                        'value': value
                    })

                trends['regional_trends'].append(block_trend)

        return trends

    def _create_regional_export_distribution(self, df):
        """Create regional export distribution data"""
        distribution = {
            'generated_at': datetime.now().isoformat(),
            'regional_exports': []
        }

        # Map to the regions expected by frontend
        region_mapping = {
            'Asia': ['ASEAN', 'SAARC', 'Shanghai', 'Asia'],
            'Africa': ['EAC', 'SADC', 'COMESA', 'CEPGL', 'ECOWAS', 'Africa'],
            'Europe': ['EU', 'European Union', 'EEA', 'Europe'],
            'Americas': ['NAFTA', 'USMCA', 'MERCOSUR', 'CARICOM', 'Americas']
        }

        # Get latest period data
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if numeric_cols:
            latest_period = numeric_cols[-1]
            region_totals = {}

            for _, row in df.iterrows():
                block_name = str(row['regional_block'])
                value = float(row[latest_period]) if pd.notna(row[latest_period]) else 0

                # Determine region
                region = 'Other'
                for reg, keywords in region_mapping.items():
                    if any(keyword.lower() in block_name.lower() for keyword in keywords):
                        region = reg
                        break

                if region not in region_totals:
                    region_totals[region] = 0
                region_totals[region] += value

            # Convert to expected format
            total_exports = sum(region_totals.values())

            for region, value in region_totals.items():
                percentage = (value / total_exports * 100) if total_exports > 0 else 0
                distribution['regional_exports'].append({
                    'region': region,
                    'export_value': round(value, 2),
                    'percentage': round(percentage, 1)
                })

            # Sort by value descending
            distribution['regional_exports'].sort(key=lambda x: x['export_value'], reverse=True)

        return distribution

    def _create_regional_insights(self, df):
        """Create AI-generated insights about regional performance"""
        insights = {
            'generated_at': datetime.now().isoformat(),
            'insights': []
        }

        # Get latest data for analysis
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if numeric_cols:
            latest_period = numeric_cols[-1]

            # Calculate total trade and regional shares
            total_trade = df[latest_period].sum()

            # Find top performing regions
            top_regions = df.nlargest(3, latest_period)[['regional_block', latest_period]]

            # Generate insights based on data
            insights_list = [
                {
                    'type': 'info',
                    'icon': 'fas fa-globe-africa',
                    'title': 'Regional Trade Focus',
                    'message': f'Rwanda\'s trade is concentrated in {len(df)} regional blocks, with {top_regions.iloc[0]["regional_block"]} leading at ${top_regions.iloc[0][latest_period]:.2f}M'
                },
                {
                    'type': 'success',
                    'icon': 'fas fa-chart-line',
                    'title': 'Growth Opportunities',
                    'message': f'Several regional blocks show strong trade potential. {top_regions.iloc[1]["regional_block"]} and {top_regions.iloc[2]["regional_block"]} represent key growth areas.'
                },
                {
                    'type': 'warning',
                    'icon': 'fas fa-exclamation-triangle',
                    'title': 'Diversification Needed',
                    'message': 'Heavy concentration in specific regional blocks increases vulnerability to regional economic changes.'
                },
                {
                    'type': 'primary',
                    'icon': 'fas fa-lightbulb',
                    'title': 'Strategic Recommendations',
                    'message': 'Consider strengthening trade relations with emerging regional blocks to diversify export markets and reduce dependency risks.'
                }
            ]

            insights['insights'] = insights_list

        return insights

    def _create_regional_comparison(self, df):
        """Create regional comparison data for charts"""
        comparison = {
            'generated_at': datetime.now().isoformat(),
            'regional_comparison': []
        }

        # Get all numeric columns for comparison
        numeric_cols = [col for col in df.columns if col != 'regional_block' and
                       df[col].dtype in ['float64', 'int64']]

        if numeric_cols:
            for _, row in df.iterrows():
                block_data = {
                    'regional_block': str(row['regional_block']),
                    'periods': {}
                }

                for col in numeric_cols:
                    block_data['periods'][col] = float(row[col]) if pd.notna(row[col]) else 0

                comparison['regional_comparison'].append(block_data)

        return comparison

    def export_to_json_files(self, analysis_results):
        """Export analysis results to various JSON files"""

        # Export each analysis type to separate JSON files
        json_files = {
            'regional_blocks_summary.json': analysis_results.get('regional_blocks_summary', {}),
            'eac_analysis.json': analysis_results.get('eac_analysis', {}),
            'continental_distribution.json': analysis_results.get('continental_distribution', {}),
            'regional_trends.json': analysis_results.get('regional_trends', {}),
            'regional_export_distribution.json': analysis_results.get('regional_export_distribution', {}),
            'regional_insights.json': analysis_results.get('regional_insights', {}),
            'regional_comparison.json': analysis_results.get('regional_comparison', {})
        }

        exported_files = []

        for filename, data in json_files.items():
            filepath = os.path.join(self.output_dir, filename)
            try:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                exported_files.append(filename)
                print(f"Exported {filename}")
            except Exception as e:
                print(f"Error exporting {filename}: {e}")

        return exported_files

    def run_analysis(self):
        """Run the complete regional blocks analysis"""
        print("Starting Regional Blocks Analysis...")

        # Load data
        df = self.load_regional_blocks_data()
        if df is None:
            print("Failed to load regional blocks data")
            return None

        # Analyze data
        analysis_results = self.analyze_regional_blocks(df)

        # Export to JSON files
        exported_files = self.export_to_json_files(analysis_results)

        print(f"Analysis complete! Exported {len(exported_files)} JSON files:")
        for file in exported_files:
            print(f"   - {file}")

        return analysis_results

def main():
    # Path to the Excel file
    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    # Create analyzer and run analysis
    analyzer = RegionalBlocksAnalyzer(excel_file)
    results = analyzer.run_analysis()

    if results:
        print("\nAnalysis Summary:")
        print(f"   - Regional blocks analyzed: {len(results.get('regional_blocks_summary', {}).get('regional_blocks', []))}")
        print(f"   - EAC blocks found: {len(results.get('eac_analysis', {}).get('eac_trade', []))}")
        print(f"   - Continents identified: {len(results.get('continental_distribution', {}).get('continental_distribution', []))}")

if __name__ == "__main__":
    main()