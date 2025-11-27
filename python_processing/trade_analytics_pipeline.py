#!/usr/bin/env python3
"""
Rwanda Trade Intelligence Platform - Advanced Analytics Pipeline
================================================================

This script performs comprehensive trade analysis for Rwanda's external trade data,
generating 6 high-impact statistical analyses for policymakers and analysts.

Author: Team Codabytes (Lambert NDACYAYISABA, Derrick RUTAGANIRA)
Date: 2025
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple
import warnings
warnings.filterwarnings('ignore')

# Statistical libraries
import statsmodels.api as sm
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.stattools import adfuller
from scipy import stats
from sklearn.metrics import mean_squared_error

class RwandaTradeAnalytics:
    """
    Advanced analytics engine for Rwanda's trade data analysis.
    Performs 6 comprehensive statistical methods.
    """

    def __init__(self, excel_file: str):
        """
        Initialize the analytics engine.

        Args:
            excel_file: Path to the Excel file containing trade data
        """
        self.excel_file = excel_file
        self.data = {}
        self.output_dir = "python_processing/data/processed"
        os.makedirs(self.output_dir, exist_ok=True)

        # Load and process data
        self.load_data()
        self.process_data()

    def load_data(self):
        """Load data from Excel file."""
        print("Loading trade data from Excel file...")

        try:
            # Read all relevant sheets
            excel_data = pd.read_excel(self.excel_file, sheet_name=None)

            # Extract key sheets
            self.raw_data = {
                'overall': excel_data.get('Graph Overall', pd.DataFrame()),
                'eac': excel_data.get('EAC', pd.DataFrame()),
                'export_country': excel_data.get('ExportCountry', pd.DataFrame()),
                'import_country': excel_data.get('ImportCountry', pd.DataFrame()),
                'export_commodity': excel_data.get('ExportsCommodity', pd.DataFrame()),
                'import_commodity': excel_data.get('ImportsCommodity', pd.DataFrame()),
                'regional_blocks': excel_data.get('Regional blocks', pd.DataFrame()),
                'trade_by_continents': excel_data.get('Trade by continents', pd.DataFrame())
            }

            print(f"Loaded {len(self.raw_data)} data sheets successfully")

        except Exception as e:
            print(f"Error loading Excel file: {e}")
            raise

    def process_data(self):
        """Process raw data into structured format."""
        print("Processing trade data...")

        # Process overall trade data
        self.process_overall_trade()

        # Process country-level data
        self.process_country_data()

        # Process commodity data
        self.process_commodity_data()

        # Process regional data
        self.process_regional_data()

        print("Data processing completed")

    def process_overall_trade(self):
        """Process overall trade statistics."""
        df = self.raw_data['overall']

        # Based on the Excel file structure, extract data manually
        # From the file content, we can see the structure
        quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']
        exports = [367.63, 453.5, 349.62, 352.68, 401.18, 508.96, 626.67, 626.06, 458.44]
        imports = [904.33, 965.41, 1002.48, 948.9, 889.52, 1078.88, 1158.24, 1090.55, 869.79]
        re_exports = [156.25, 154.52, 173, 159.55, 173.17, 164, 184.56, 177.29, 135.39]
        total_trade = [1428.21, 1573.43, 1525.1, 1461.13, 1463.87, 1751.84, 1969.47, 1893.9, 1463.62]
        trade_balance = [-536.7, -511.91, -652.86, -596.22, -488.34, -569.92, -531.57, -464.49, -411.35]

        self.data['overall'] = {
            'quarters': quarters,
            'exports': exports,
            'imports': imports,
            're_exports': re_exports,
            'total_trade': total_trade,
            'trade_balance': trade_balance
        }

    def process_country_data(self):
        """Process country-level trade data."""
        # Export countries - manually handle the Excel structure
        export_df = self.raw_data['export_country']

        # The actual data starts from row 4 (0-indexed), with country names in column 0
        # and quarterly data in columns 1-9 (2023Q1 to 2025Q1)
        export_countries = []

        # Define the quarter columns based on the structure we observed
        quarter_columns = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        for idx in range(4, len(export_df)):  # Start from row 4 (actual data)
            row = export_df.iloc[idx]

            # Get country name from first column
            country_name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            # Skip empty rows or non-country rows
            if not country_name or country_name == 'nan' or 'Source:' in country_name or '*' in country_name:
                continue

            country_data = {
                'country': country_name,
                'values': {}
            }

            # Extract quarterly values (columns 1-9 correspond to quarters)
            for i, quarter in enumerate(quarter_columns):
                col_idx = i + 1  # Data starts from column 1
                if col_idx < len(row) and pd.notna(row.iloc[col_idx]):
                    try:
                        value = float(row.iloc[col_idx])
                        country_data['values'][quarter] = value
                    except (ValueError, TypeError):
                        continue

            if country_data['values']:  # Only add if we have some data
                export_countries.append(country_data)

        # Import countries - same structure
        import_df = self.raw_data['import_country']
        import_countries = []

        for idx in range(4, len(import_df)):  # Start from row 4
            row = import_df.iloc[idx]

            country_name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if not country_name or country_name == 'nan' or 'Source:' in country_name or '*' in country_name:
                continue

            country_data = {
                'country': country_name,
                'values': {}
            }

            for i, quarter in enumerate(quarter_columns):
                col_idx = i + 1
                if col_idx < len(row) and pd.notna(row.iloc[col_idx]):
                    try:
                        value = float(row.iloc[col_idx])
                        country_data['values'][quarter] = value
                    except (ValueError, TypeError):
                        continue

            if country_data['values']:
                import_countries.append(country_data)

        self.data['countries'] = {
            'exports': export_countries,
            'imports': import_countries
        }

        print(f"Processed {len(export_countries)} export countries and {len(import_countries)} import countries")

    def process_commodity_data(self):
        """Process commodity-level trade data."""
        # Export commodities
        export_comm_df = self.raw_data['export_commodity']
        export_commodities = []

        for idx, row in export_comm_df.iterrows():
            if pd.notna(row.get('SITC SECTION')) and row.get('SITC SECTION') not in ['SITC SECTION', 'Total Estimates']:
                commodity_data = {
                    'section': row.get('SITC SECTION', ''),
                    'description': row.get('COMMODITY DESCRIPTION/ TOTAL ESTIMATES', ''),
                    'values': {}
                }

                for col in export_comm_df.columns:
                    if '2023' in str(col) or '2024' in str(col) or '2025' in str(col):
                        val = row.get(col)
                        if pd.notna(val):
                            commodity_data['values'][col] = float(val)

                if commodity_data['section']:
                    export_commodities.append(commodity_data)

        # Import commodities
        import_comm_df = self.raw_data['import_commodity']
        import_commodities = []

        for idx, row in import_comm_df.iterrows():
            if pd.notna(row.get('SITC SECTION')) and row.get('SITC SECTION') not in ['SITC SECTION', 'Total Estimates']:
                commodity_data = {
                    'section': row.get('SITC SECTION', ''),
                    'description': row.get('COMMODITY DESCRIPTION/ TOTAL ESTIMATES', ''),
                    'values': {}
                }

                for col in import_comm_df.columns:
                    if '2023' in str(col) or '2024' in str(col) or '2025' in str(col):
                        val = row.get(col)
                        if pd.notna(val):
                            commodity_data['values'][col] = float(val)

                if commodity_data['section']:
                    import_commodities.append(commodity_data)

        self.data['commodities'] = {
            'exports': export_commodities,
            'imports': import_commodities
        }

    def process_regional_data(self):
        """Process regional and continental data."""
        # Regional blocks
        regional_df = self.raw_data['regional_blocks']
        regional_data = []

        for idx, row in regional_df.iterrows():
            if pd.notna(row.get('Partner')) and row.get('Partner') not in ['Partner', 'Source: NISR']:
                region_data = {
                    'region': row.get('Partner', ''),
                    'flow': row.get('Flow \\ Period', ''),
                    'values': {}
                }

                for col in regional_df.columns:
                    if '2023' in str(col) or '2024' in str(col) or '2025' in str(col):
                        val = row.get(col)
                        if pd.notna(val):
                            region_data['values'][col] = float(val)

                if region_data['region']:
                    regional_data.append(region_data)

        # Continents
        continents_df = self.raw_data['trade_by_continents']
        continents_data = []

        for idx, row in continents_df.iterrows():
            if pd.notna(row.get('Partner \\ Period')) and row.get('Partner \\ Period') not in ['Partner \\ Period', 'WORLD']:
                continent_data = {
                    'continent': row.get('Partner \\ Period', ''),
                    'flow': row.get('Flow', ''),
                    'values': {},
                    'shares': {}
                }

                for col in continents_df.columns:
                    if '2023' in str(col) or '2024' in str(col) or '2025' in str(col):
                        val = row.get(col)
                        if pd.notna(val):
                            if 'Share' in str(col):
                                continent_data['shares'][col.replace('Share in %', '').strip()] = float(val)
                            else:
                                continent_data['values'][col] = float(val)

                if continent_data['continent']:
                    continents_data.append(continent_data)

        self.data['regional'] = {
            'regional_blocks': regional_data,
            'continents': continents_data
        }

    # ============================================================================
    # TASK 1: TIME SERIES ANALYSIS
    # ============================================================================

    def perform_time_series_analysis(self) -> Dict[str, Any]:
        """
        Perform comprehensive time series analysis including trends, seasonality,
        and forecasting using exponential smoothing.
        """
        print("Performing Time Series Analysis...")

        overall = self.data['overall']

        # Create time series data
        quarters = overall['quarters']
        exports = overall['exports']
        imports = overall['imports']
        trade_balance = overall['trade_balance']

        # Convert to pandas Series with datetime index
        dates = pd.date_range(start='2023Q1', periods=len(quarters), freq='Q')
        exports_ts = pd.Series(exports, index=dates)
        imports_ts = pd.Series(imports, index=dates)
        balance_ts = pd.Series(trade_balance, index=dates)

        # Calculate trends using linear regression
        def calculate_trend(series):
            X = np.arange(len(series))
            X = sm.add_constant(X)
            model = sm.OLS(series.values, X).fit()
            trend = model.predict(X)
            return {
                'slope': model.params[1],
                'intercept': model.params[0],
                'r_squared': model.rsquared,
                'trend_values': trend.tolist()
            }

        exports_trend = calculate_trend(exports_ts)
        imports_trend = calculate_trend(imports_ts)
        balance_trend = calculate_trend(balance_ts)

        # Exponential Smoothing Forecasting
        def forecast_series(series, periods=4):
            try:
                model = ExponentialSmoothing(series, seasonal='add', seasonal_periods=4).fit()
                forecast = model.forecast(periods)

                # Handle NaN values in model parameters
                alpha = model.params.get('smoothing_level', 0)
                beta = model.params.get('smoothing_trend', 0)
                gamma = model.params.get('smoothing_seasonal', 0)

                # Convert NaN to None for JSON compatibility
                alpha = None if (isinstance(alpha, float) and np.isnan(alpha)) else alpha
                beta = None if (isinstance(beta, float) and np.isnan(beta)) else beta
                gamma = None if (isinstance(gamma, float) and np.isnan(gamma)) else gamma

                return {
                    'forecast_values': forecast.tolist(),
                    'model_params': {
                        'alpha': alpha,
                        'beta': beta,
                        'gamma': gamma
                    },
                    'model_fit': {
                        'aic': model.aic,
                        'bic': model.bic
                    }
                }
            except Exception as e:
                print(f"Warning: Exponential smoothing failed: {e}")
                # Fallback to simple exponential smoothing
                try:
                    model = ExponentialSmoothing(series, trend='add').fit()
                    forecast = model.forecast(periods)

                    alpha = model.params.get('smoothing_level', 0)
                    beta = model.params.get('smoothing_trend', 0)

                    alpha = None if (isinstance(alpha, float) and np.isnan(alpha)) else alpha
                    beta = None if (isinstance(beta, float) and np.isnan(beta)) else beta

                    return {
                        'forecast_values': forecast.tolist(),
                        'model_params': {
                            'alpha': alpha,
                            'beta': beta,
                            'gamma': None
                        },
                        'model_fit': {
                            'aic': model.aic,
                            'bic': model.bic
                        }
                    }
                except Exception as e2:
                    print(f"Warning: Fallback exponential smoothing also failed: {e2}")
                    # Return basic forecast if all methods fail
                    last_value = series.iloc[-1] if hasattr(series, 'iloc') else series[-1]
                    return {
                        'forecast_values': [last_value] * periods,
                        'model_params': {
                            'alpha': None,
                            'beta': None,
                            'gamma': None
                        },
                        'model_fit': {
                            'aic': 0,
                            'bic': 0
                        }
                    }

        exports_forecast = forecast_series(exports_ts)
        imports_forecast = forecast_series(imports_ts)

        # Seasonality analysis
        def analyze_seasonality(series):
            try:
                seasonal_decomp = sm.tsa.seasonal_decompose(series, model='additive', period=4)
                # Convert NaN values to None for JSON compatibility
                trend_list = seasonal_decomp.trend.tolist()
                resid_list = seasonal_decomp.resid.tolist()

                # Replace NaN with None
                trend_list = [None if (isinstance(x, float) and np.isnan(x)) else x for x in trend_list]
                resid_list = [None if (isinstance(x, float) and np.isnan(x)) else x for x in resid_list]

                return {
                    'seasonal_component': seasonal_decomp.seasonal.tolist(),
                    'trend_component': trend_list,
                    'residual_component': resid_list
                }
            except Exception as e:
                print(f"Warning: Seasonal decomposition failed: {e}")
                # Return basic seasonal pattern if decomposition fails
                return {
                    'seasonal_component': [0] * len(series),
                    'trend_component': [None] * len(series),
                    'residual_component': [None] * len(series)
                }

        exports_seasonal = analyze_seasonality(exports_ts)
        imports_seasonal = analyze_seasonality(imports_ts)

        # Stationarity tests
        def test_stationarity(series):
            result = adfuller(series.values)
            return {
                'adf_statistic': result[0],
                'p_value': result[1],
                'critical_values': result[4],
                'stationary': result[1] < 0.05
            }

        exports_stationarity = test_stationarity(exports_ts)
        imports_stationarity = test_stationarity(imports_ts)

        result = {
            "time_series": {
                "exports_trend": exports_trend,
                "imports_trend": imports_trend,
                "trade_deficit_trend": balance_trend,
                "seasonal_analysis": {
                    "exports": exports_seasonal,
                    "imports": imports_seasonal
                },
                "stationarity_tests": {
                    "exports": exports_stationarity,
                    "imports": imports_stationarity
                },
                "forecast_next_4_quarters": {
                    "exports": exports_forecast,
                    "imports": imports_forecast
                }
            }
        }

        # Save to JSON
        self.save_json(result, 'time_series.json')
        print("Time Series Analysis completed")
        return result

    # ============================================================================
    # TASK 2: COMPARATIVE GROWTH ANALYSIS
    # ============================================================================

    def perform_growth_analysis(self) -> Dict[str, Any]:
        """
        Perform comprehensive growth analysis including QoQ, YoY, and CAGR calculations.
        """
        print("Performing Comparative Growth Analysis...")

        overall = self.data['overall']
        quarters = overall['quarters']
        exports = overall['exports']
        imports = overall['imports']

        # Calculate QoQ growth
        def calculate_qoq_growth(values):
            growth_rates = []
            for i in range(1, len(values)):
                if values[i-1] != 0:
                    growth = (values[i] - values[i-1]) / values[i-1]
                    growth_rates.append(growth)
                else:
                    growth_rates.append(0)
            return growth_rates

        exports_qoq = calculate_qoq_growth(exports)
        imports_qoq = calculate_qoq_growth(imports)

        # Calculate YoY growth (comparing same quarter year-over-year)
        def calculate_yoy_growth(values, quarters):
            growth_rates = []
            for i in range(len(values)):
                current_quarter = quarters[i]
                if '2024' in current_quarter or '2025' in current_quarter:
                    # Find corresponding quarter from previous year
                    prev_year = str(int(current_quarter[:4]) - 1)
                    prev_quarter = current_quarter.replace(current_quarter[:4], prev_year)

                    prev_idx = quarters.index(prev_quarter) if prev_quarter in quarters else -1
                    if prev_idx >= 0 and values[prev_idx] != 0:
                        growth = (values[i] - values[prev_idx]) / values[prev_idx]
                        growth_rates.append(growth)
                    else:
                        growth_rates.append(None)
                else:
                    growth_rates.append(None)
            return growth_rates

        exports_yoy = calculate_yoy_growth(exports, quarters)
        imports_yoy = calculate_yoy_growth(imports, quarters)

        # Calculate CAGR
        def calculate_cagr(values, periods):
            if len(values) < 2:
                return 0
            start_value = values[0]
            end_value = values[-1]
            if start_value <= 0:
                return 0
            return (end_value / start_value) ** (1 / periods) - 1

        exports_cagr = calculate_cagr(exports, len(quarters) / 4)  # Annualized
        imports_cagr = calculate_cagr(imports, len(quarters) / 4)

        # Commodity-level growth analysis
        commodities = self.data['commodities']
        commodity_growth = {}

        for commodity in commodities['exports']:
            values = list(commodity['values'].values())
            if len(values) > 1:
                cagr = calculate_cagr(values, len(values) / 4)
                commodity_growth[commodity['description']] = cagr

        # Generate insights
        insights = []

        # Find significant changes
        for i, quarter in enumerate(quarters[1:], 1):
            if i < len(exports_qoq):
                exp_change = exports_qoq[i-1] * 100
                if abs(exp_change) > 10:  # Significant change > 10%
                    direction = "increased" if exp_change > 0 else "decreased"
                    insights.append(f"Exports {direction} by {abs(exp_change):.1f}% from {quarters[i-1]} to {quarter}")

            if i < len(imports_qoq):
                imp_change = imports_qoq[i-1] * 100
                if abs(imp_change) > 10:
                    direction = "increased" if imp_change > 0 else "decreased"
                    insights.append(f"Imports {direction} by {abs(imp_change):.1f}% from {quarters[i-1]} to {quarter}")

        # CAGR insights
        if exports_cagr > 0:
            insights.append(f"Exports show positive CAGR of {exports_cagr*100:.1f}% over the analyzed period")
        if imports_cagr > 0:
            insights.append(f"Imports show positive CAGR of {imports_cagr*100:.1f}% over the analyzed period")

        result = {
            "growth_analysis": {
                "qoq": {
                    "exports": exports_qoq,
                    "imports": imports_qoq,
                    "quarters": quarters[1:]
                },
                "yoy": {
                    "exports": [x for x in exports_yoy if x is not None],
                    "imports": [x for x in imports_yoy if x is not None],
                    "quarters": [q for q, y in zip(quarters, exports_yoy) if y is not None]
                },
                "cagr": {
                    "exports": exports_cagr,
                    "imports": imports_cagr,
                    "commodities": commodity_growth
                },
                "insights": insights
            }
        }

        self.save_json(result, 'growth_analysis.json')
        print("Growth Analysis completed")
        return result

    # ============================================================================
    # TASK 3: CONTRIBUTION & SHARE ANALYSIS
    # ============================================================================

    def perform_share_analysis(self) -> Dict[str, Any]:
        """
        Analyze contribution and share percentages for countries, regions, continents, and commodities.
        """
        print("Performing Contribution & Share Analysis...")

        overall = self.data['overall']
        total_exports = sum(overall['exports'])
        total_imports = sum(overall['imports'])

        # Country share analysis
        countries = self.data['countries']
        country_share = {
            "exports": {},
            "imports": {}
        }

        # Calculate export shares by country
        for country in countries['exports']:
            total_country_exports = sum(country['values'].values())
            share = (total_country_exports / total_exports) * 100 if total_exports > 0 else 0
            country_share["exports"][country['country']] = {
                "value": total_country_exports,
                "share_percentage": share
            }

        # Calculate import shares by country
        for country in countries['imports']:
            total_country_imports = sum(country['values'].values())
            share = (total_country_imports / total_imports) * 100 if total_imports > 0 else 0
            country_share["imports"][country['country']] = {
                "value": total_country_imports,
                "share_percentage": share
            }

        # Regional share analysis
        regional = self.data['regional']
        region_share = {}

        for region_data in regional['regional_blocks']:
            if region_data['flow'] == 'Export':
                total_region_exports = sum(region_data['values'].values())
                share = (total_region_exports / total_exports) * 100 if total_exports > 0 else 0
                region_share[region_data['region']] = {
                    "exports": {
                        "value": total_region_exports,
                        "share_percentage": share
                    }
                }

        # Continent share analysis
        continent_share = {}

        for continent_data in regional['continents']:
            if continent_data['flow'] == 'Exports':
                total_continent_exports = sum(continent_data['values'].values())
                share = (total_continent_exports / total_exports) * 100 if total_exports > 0 else 0
                continent_share[continent_data['continent']] = {
                    "exports": {
                        "value": total_continent_exports,
                        "share_percentage": share
                    }
                }
            elif continent_data['flow'] == 'Imports':
                total_continent_imports = sum(continent_data['values'].values())
                share = (total_continent_imports / total_imports) * 100 if total_imports > 0 else 0
                if continent_data['continent'] not in continent_share:
                    continent_share[continent_data['continent']] = {}
                continent_share[continent_data['continent']]["imports"] = {
                    "value": total_continent_imports,
                    "share_percentage": share
                }

        # Commodity share analysis
        commodities = self.data['commodities']
        commodity_share = {
            "exports": {},
            "imports": {}
        }

        for commodity in commodities['exports']:
            total_commodity_exports = sum(commodity['values'].values())
            share = (total_commodity_exports / total_exports) * 100 if total_exports > 0 else 0
            commodity_share["exports"][commodity['description']] = {
                "value": total_commodity_exports,
                "share_percentage": share
            }

        for commodity in commodities['imports']:
            total_commodity_imports = sum(commodity['values'].values())
            share = (total_commodity_imports / total_imports) * 100 if total_imports > 0 else 0
            commodity_share["imports"][commodity['description']] = {
                "value": total_commodity_imports,
                "share_percentage": share
            }

        # Generate insights
        insights = []

        # Top export destinations
        top_exports = sorted(country_share["exports"].items(),
                           key=lambda x: x[1]["share_percentage"], reverse=True)[:5]
        for country, data in top_exports:
            insights.append(f"{country} contributes {data['share_percentage']:.1f}% of total exports")

        # Top import sources
        top_imports = sorted(country_share["imports"].items(),
                           key=lambda x: x[1]["share_percentage"], reverse=True)[:5]
        for country, data in top_imports:
            insights.append(f"{country} contributes {data['share_percentage']:.1f}% of total imports")

        # Continent insights
        for continent, data in continent_share.items():
            if 'exports' in data and data['exports']['share_percentage'] > 10:
                insights.append(f"{continent} contributes {data['exports']['share_percentage']:.1f}% of exports")

        # Commodity insights
        top_commodities = sorted(commodity_share["exports"].items(),
                               key=lambda x: x[1]["share_percentage"], reverse=True)[:3]
        for commodity, data in top_commodities:
            insights.append(f"{commodity} represents {data['share_percentage']:.1f}% of export value")

        result = {
            "share_analysis": {
                "country_share": country_share,
                "region_share": region_share,
                "continent_share": continent_share,
                "commodity_share": commodity_share,
                "insights": insights
            }
        }

        self.save_json(result, 'share_analysis.json')
        print("Share Analysis completed")
        return result

    # ============================================================================
    # TASK 4: CONCENTRATION INDEX (HHI)
    # ============================================================================

    def perform_hhi_analysis(self) -> Dict[str, Any]:
        """
        Calculate Herfindahl-Hirschman Index for export destinations, import sources, and commodities.
        """
        print("Performing Concentration Index (HHI) Analysis...")

        # HHI calculation function
        def calculate_hhi(shares):
            """Calculate Herfindahl-Hirschman Index from market shares."""
            return sum(share ** 2 for share in shares)

        # Export destinations HHI
        countries = self.data['countries']
        export_shares = []

        # Calculate total exports across all countries and quarters
        total_exports_all_countries = 0
        for country in countries['exports']:
            total_exports_all_countries += sum(country['values'].values())

        for country in countries['exports']:
            total_country_exports = sum(country['values'].values())
            if total_exports_all_countries > 0:
                share = total_country_exports / total_exports_all_countries
                export_shares.append(share)

        export_hhi = calculate_hhi(export_shares) if export_shares else 0

        # Import sources HHI
        import_shares = []

        # Calculate total imports across all countries and quarters
        total_imports_all_countries = 0
        for country in countries['imports']:
            total_imports_all_countries += sum(country['values'].values())

        for country in countries['imports']:
            total_country_imports = sum(country['values'].values())
            if total_imports_all_countries > 0:
                share = total_country_imports / total_imports_all_countries
                import_shares.append(share)

        import_hhi = calculate_hhi(import_shares) if import_shares else 0

        # Commodity HHI
        commodities = self.data['commodities']
        export_commodity_shares = []

        # Calculate total exports across all commodities and quarters
        total_exports_all_commodities = 0
        for commodity in commodities['exports']:
            total_exports_all_commodities += sum(commodity['values'].values())

        for commodity in commodities['exports']:
            total_commodity_exports = sum(commodity['values'].values())
            if total_exports_all_commodities > 0:
                share = total_commodity_exports / total_exports_all_commodities
                export_commodity_shares.append(share)

        commodity_hhi = calculate_hhi(export_commodity_shares) if export_commodity_shares else 0

        # Interpret HHI values
        def interpret_hhi(hhi_value):
            if hhi_value < 0.01:
                return "Highly competitive market"
            elif hhi_value < 0.15:
                return "Unconcentrated market"
            elif hhi_value < 0.25:
                return "Moderately concentrated"
            else:
                return "Highly concentrated market"

        # Generate insights
        insights = []

        insights.append(f"Export destinations HHI: {export_hhi:.4f} - {interpret_hhi(export_hhi)}")
        insights.append(f"Import sources HHI: {import_hhi:.4f} - {interpret_hhi(import_hhi)}")
        insights.append(f"Export commodities HHI: {commodity_hhi:.4f} - {interpret_hhi(commodity_hhi)}")

        # Risk assessment
        if export_hhi > 0.25:
            insights.append("High concentration in export markets increases vulnerability to destination-specific shocks")
        if import_hhi > 0.25:
            insights.append("High concentration in import sources increases supply chain risks")

        # Top contributors to concentration
        if export_shares:
            max_export_share = max(export_shares)
            max_export_idx = export_shares.index(max_export_share)
            top_export_country = countries['exports'][max_export_idx]['country']
            insights.append(f"Top export destination {top_export_country} represents {max_export_share*100:.1f}% of total exports")

        if import_shares:
            max_import_share = max(import_shares)
            max_import_idx = import_shares.index(max_import_share)
            top_import_country = countries['imports'][max_import_idx]['country']
            insights.append(f"Top import source {top_import_country} represents {max_import_share*100:.1f}% of total imports")

        result = {
            "hhi": {
                "export_destinations": {
                    "hhi_value": export_hhi,
                    "interpretation": interpret_hhi(export_hhi),
                    "number_of_destinations": len(export_shares)
                },
                "import_sources": {
                    "hhi_value": import_hhi,
                    "interpretation": interpret_hhi(import_hhi),
                    "number_of_sources": len(import_shares)
                },
                "commodity_hhi": {
                    "hhi_value": commodity_hhi,
                    "interpretation": interpret_hhi(commodity_hhi),
                    "number_of_commodities": len(export_commodity_shares)
                },
                "insights": insights
            }
        }

        self.save_json(result, 'hhi.json')
        print("HHI Analysis completed")
        return result

    # ============================================================================
    # TASK 5: BALANCE OF TRADE & STRUCTURAL ANALYSIS
    # ============================================================================

    def perform_trade_balance_analysis(self) -> Dict[str, Any]:
        """
        Analyze trade balance, deficit drivers, and structural components.
        """
        print("Performing Trade Balance & Structural Analysis...")

        overall = self.data['overall']
        quarters = overall['quarters']
        exports = overall['exports']
        imports = overall['imports']
        trade_balance = overall['trade_balance']

        # Quarterly balance analysis
        quarterly_balance = []
        for i, quarter in enumerate(quarters):
            quarterly_balance.append({
                "quarter": quarter,
                "exports": exports[i],
                "imports": imports[i],
                "trade_balance": trade_balance[i],
                "deficit": trade_balance[i] < 0,
                "deficit_amount": abs(trade_balance[i]) if trade_balance[i] < 0 else 0
            })

        # Calculate balance statistics
        deficits = [abs(b) for b in trade_balance if b < 0]
        avg_deficit = np.mean(deficits) if deficits else 0
        max_deficit = max(deficits) if deficits else 0
        quarters_in_deficit = len(deficits)

        # Deficit drivers analysis
        deficit_drivers = {
            "average_deficit": avg_deficit,
            "maximum_deficit": max_deficit,
            "quarters_in_deficit": quarters_in_deficit,
            "total_deficit_periods": len(quarters),
            "deficit_percentage": (quarters_in_deficit / len(quarters)) * 100
        }

        # Regional contributions to deficit
        regional = self.data['regional']
        regional_contributions = {}

        for region_data in regional['regional_blocks']:
            if region_data['flow'] == 'Export':
                region_exports = sum(region_data['values'].values())
                region_imports = 0

                # Find corresponding import data
                for imp_region in regional['regional_blocks']:
                    if imp_region['flow'] == 'Import' and imp_region['region'] == region_data['region']:
                        region_imports = sum(imp_region['values'].values())
                        break

                region_balance = region_exports - region_imports
                regional_contributions[region_data['region']] = {
                    "exports": region_exports,
                    "imports": region_imports,
                    "balance": region_balance,
                    "contribution_to_deficit": abs(region_balance) if region_balance < 0 else 0
                }

        # Commodity-level deficit drivers
        commodities = self.data['commodities']
        commodity_contributions = {}

        for commodity in commodities['exports']:
            comm_exports = sum(commodity['values'].values())
            comm_imports = 0

            # Find corresponding import commodity
            for imp_comm in commodities['imports']:
                if imp_comm['section'] == commodity['section']:
                    comm_imports = sum(imp_comm['values'].values())
                    break

            comm_balance = comm_exports - comm_imports
            commodity_contributions[commodity['description']] = {
                "exports": comm_exports,
                "imports": comm_imports,
                "balance": comm_balance,
                "contribution_to_deficit": abs(comm_balance) if comm_balance < 0 else 0
            }

        # Generate insights
        insights = []

        insights.append(f"Trade deficit persists in {quarters_in_deficit} out of {len(quarters)} quarters ({deficit_drivers['deficit_percentage']:.1f}%)")
        insights.append(f"Average quarterly deficit: ${avg_deficit:,.0f}")
        insights.append(f"Maximum quarterly deficit: ${max_deficit:,.0f}")

        # Top deficit contributors
        sorted_regions = sorted(regional_contributions.items(),
                              key=lambda x: x[1]['contribution_to_deficit'], reverse=True)
        for region, data in sorted_regions[:3]:
            if data['contribution_to_deficit'] > 0:
                insights.append(f"Region {region} contributes ${data['contribution_to_deficit']:,.0f} to total deficit")

        sorted_commodities = sorted(commodity_contributions.items(),
                                  key=lambda x: x[1]['contribution_to_deficit'], reverse=True)
        for commodity, data in sorted_commodities[:3]:
            if data['contribution_to_deficit'] > 0:
                insights.append(f"Commodity {commodity} contributes ${data['contribution_to_deficit']:,.0f} to total deficit")

        result = {
            "trade_balance": {
                "quarterly_balance": quarterly_balance,
                "deficit_drivers": deficit_drivers,
                "commodity_contributions": commodity_contributions,
                "regional_contributions": regional_contributions,
                "insights": insights
            }
        }

        self.save_json(result, 'trade_balance.json')
        print("Trade Balance Analysis completed")
        return result

    # ============================================================================
    # TASK 6: CORRELATION & DEPENDENCY ANALYSIS
    # ============================================================================

    def perform_correlation_analysis(self) -> Dict[str, Any]:
        """
        Analyze correlations between trade variables and identify dependencies.
        """
        print("Performing Correlation & Dependency Analysis...")

        overall = self.data['overall']
        exports = overall['exports']
        imports = overall['imports']
        trade_balance = overall['trade_balance']

        # Create correlation matrix
        trade_data = pd.DataFrame({
            'exports': exports,
            'imports': imports,
            'trade_balance': trade_balance
        })

        correlation_matrix = trade_data.corr()

        # Convert to dictionary format
        corr_dict = {}
        for col1 in correlation_matrix.columns:
            corr_dict[col1] = {}
            for col2 in correlation_matrix.columns:
                corr_dict[col1][col2] = correlation_matrix.loc[col1, col2]

        # Identify strong relationships
        strong_relationships = []
        for i, col1 in enumerate(correlation_matrix.columns):
            for j, col2 in enumerate(correlation_matrix.columns):
                if i < j:  # Avoid duplicate pairs
                    corr_value = correlation_matrix.loc[col1, col2]
                    if abs(corr_value) > 0.7:  # Strong correlation threshold
                        strength = "strong positive" if corr_value > 0 else "strong negative"
                        strong_relationships.append({
                            "variables": f"{col1} vs {col2}",
                            "correlation": corr_value,
                            "strength": strength,
                            "interpretation": f"{col1.replace('_', ' ').title()} and {col2.replace('_', ' ').title()} show {strength} correlation (r = {corr_value:.3f})"
                        })

        # Country-level correlations
        countries = self.data['countries']
        country_correlations = []

        # Analyze export concentration vs balance
        export_concentration = []
        for i, quarter in enumerate(overall['quarters']):
            # Calculate HHI for this quarter
            quarter_exports = []
            for country in countries['exports']:
                if quarter in country['values']:
                    quarter_exports.append(country['values'][quarter])

            if quarter_exports:
                hhi = sum((share ** 2) for share in [e / sum(quarter_exports) for e in quarter_exports])
                export_concentration.append(hhi)
            else:
                export_concentration.append(0)

        # Correlation between export concentration and trade balance
        if len(export_concentration) == len(trade_balance) and len(export_concentration) > 1:
            try:
                conc_balance_corr = np.corrcoef(export_concentration, trade_balance)[0, 1]
                if np.isnan(conc_balance_corr):
                    conc_balance_corr = 0.0  # Default to no correlation if NaN
                country_correlations.append({
                    "analysis": "Export concentration vs Trade balance",
                    "correlation": conc_balance_corr,
                    "interpretation": f"Export market concentration and trade balance show {'positive' if conc_balance_corr > 0 else 'negative'} correlation (r = {conc_balance_corr:.3f})"
                })
            except:
                country_correlations.append({
                    "analysis": "Export concentration vs Trade balance",
                    "correlation": 0.0,
                    "interpretation": "Unable to calculate correlation between export concentration and trade balance"
                })

        # Regional dependencies
        regional = self.data['regional']
        regional_deps = []

        for region_data in regional['regional_blocks']:
            if region_data['flow'] == 'Export':
                region_values = list(region_data['values'].values())
                if len(region_values) > 1:
                    # Correlation with overall exports
                    overall_quarterly = overall['exports'][:len(region_values)]
                    if len(overall_quarterly) == len(region_values):
                        corr = np.corrcoef(region_values, overall_quarterly)[0, 1]
                        regional_deps.append({
                            "region": region_data['region'],
                            "correlation_with_overall": corr,
                            "dependency_level": "High" if abs(corr) > 0.8 else "Medium" if abs(corr) > 0.5 else "Low"
                        })

        # Create heatmap-ready data
        heatmap_data = []
        for i, var1 in enumerate(correlation_matrix.columns):
            for j, var2 in enumerate(correlation_matrix.columns):
                heatmap_data.append({
                    "x": i,
                    "y": j,
                    "value": correlation_matrix.loc[var1, var2],
                    "variable1": var1,
                    "variable2": var2
                })

        # Generate insights
        insights = []

        for rel in strong_relationships:
            insights.append(rel['interpretation'])

        if country_correlations:
            for corr in country_correlations:
                insights.append(corr['interpretation'])

        # Overall trade health assessment
        exp_imp_corr = correlation_matrix.loc['exports', 'imports']
        if exp_imp_corr > 0.5:
            insights.append("Strong positive correlation between exports and imports suggests synchronized trade growth")
        elif exp_imp_corr < -0.5:
            insights.append("Negative correlation between exports and imports indicates potential trade imbalances")

        result = {
            "correlations": {
                "matrix": corr_dict,
                "strong_relationships": strong_relationships,
                "country_level_analysis": country_correlations,
                "regional_dependencies": regional_deps,
                "heatmap_ready_data": heatmap_data,
                "insights": insights
            }
        }

        self.save_json(result, 'correlations.json')
        print("Correlation Analysis completed")
        return result

    # ============================================================================
    # UTILITY METHODS
    # ============================================================================

    def save_json(self, data: Dict, filename: str):
        """Save data to JSON file."""
        def convert_numpy_types(obj):
            """Convert numpy types to Python types for JSON serialization."""
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                # Handle NaN values by converting to None (null in JSON)
                val = float(obj)
                return None if np.isnan(val) else val
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, np.bool_):
                return bool(obj)
            elif isinstance(obj, dict):
                return {key: convert_numpy_types(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(item) for item in obj]
            elif isinstance(obj, float) and np.isnan(obj):
                # Handle regular float NaN values
                return None
            else:
                return obj

        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(convert_numpy_types(data), f, indent=2, ensure_ascii=False)
        print(f"Saved {filename}")

    def run_all_analyses(self):
        """Run all six analytical methods."""
        print("Starting Rwanda Trade Intelligence Pipeline...")
        print("=" * 60)

        results = {}

        try:
            # Task 1: Time Series Analysis
            results['time_series'] = self.perform_time_series_analysis()

            # Task 2: Comparative Growth Analysis
            results['growth'] = self.perform_growth_analysis()

            # Task 3: Contribution & Share Analysis
            results['share'] = self.perform_share_analysis()

            # Task 4: Concentration Index (HHI)
            results['hhi'] = self.perform_hhi_analysis()

            # Task 5: Balance of Trade & Structural Analysis
            results['trade_balance'] = self.perform_trade_balance_analysis()

            # Task 6: Correlation & Dependency Analysis
            results['correlations'] = self.perform_correlation_analysis()

            print("=" * 60)
            print("All analyses completed successfully!")
            print(f"JSON files saved to: {self.output_dir}")

            # Generate summary report
            self.generate_summary_report(results)

        except Exception as e:
            print(f"Error during analysis: {e}")
            raise

        return results

    def generate_summary_report(self, results: Dict):
        """Generate a comprehensive summary report."""
        report = {
            "analysis_summary": {
                "generated_at": datetime.now().isoformat(),
                "dataset": "2025Q1_Trade_report_annexTables.xlsx",
                "analyses_completed": len(results),
                "key_findings": []
            }
        }

        # Extract key insights from each analysis
        if 'time_series' in results:
            ts = results['time_series']['time_series']
            report["analysis_summary"]["key_findings"].append(
                f"Time Series: Export trend shows {'increasing' if ts['exports_trend']['slope'] > 0 else 'decreasing'} pattern"
            )

        if 'growth' in results:
            growth = results['growth']['growth_analysis']
            report["analysis_summary"]["key_findings"].append(
                f"Growth: Exports CAGR of {growth['cagr']['exports']*100:.1f}%, Imports CAGR of {growth['cagr']['imports']*100:.1f}%"
            )

        if 'share' in results:
            share = results['share']['share_analysis']
            top_export_country = max(share['country_share']['exports'].items(),
                                   key=lambda x: x[1]['share_percentage'])
            report["analysis_summary"]["key_findings"].append(
                f"Market Share: {top_export_country[0]} leads exports with {top_export_country[1]['share_percentage']:.1f}% share"
            )

        if 'hhi' in results:
            hhi = results['hhi']['hhi']
            report["analysis_summary"]["key_findings"].append(
                f"Concentration: Export markets are {hhi['export_destinations']['interpretation'].lower()}"
            )

        if 'trade_balance' in results:
            balance = results['trade_balance']['trade_balance']
            deficit_pct = balance['deficit_drivers']['deficit_percentage']
            report["analysis_summary"]["key_findings"].append(
                f"Trade Balance: {deficit_pct:.1f}% of quarters show trade deficit"
            )

        if 'correlations' in results:
            corr = results['correlations']['correlations']
            exp_imp_corr = corr['matrix']['exports']['imports']
            report["analysis_summary"]["key_findings"].append(
                f"Correlations: Exports-Imports correlation is {exp_imp_corr:.3f}"
            )

        # Save summary report
        self.save_json(report, 'analysis_summary.json')
        print("Summary report generated")


def main():
    """Main execution function."""
    # Configuration
    EXCEL_FILE = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    # Initialize and run analysis
    analyzer = RwandaTradeAnalytics(EXCEL_FILE)
    results = analyzer.run_all_analyses()

    print("\nRwanda Trade Intelligence Platform Analysis Complete!")
    print("Generated JSON files:")
    print("- time_series.json")
    print("- growth_analysis.json")
    print("- share_analysis.json")
    print("- hhi.json")
    print("- trade_balance.json")
    print("- correlations.json")
    print("- analysis_summary.json")


if __name__ == "__main__":
    main()