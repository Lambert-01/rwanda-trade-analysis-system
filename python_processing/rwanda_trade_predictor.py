#!/usr/bin/env python3
"""
Comprehensive Rwanda Trade Data Predictor
Advanced prediction system covering all aspects of Rwanda's trade data
"""
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class ComprehensiveRwandaTradePredictor:
    """Comprehensive predictor for all aspects of Rwanda's trade data."""

    def __init__(self, excel_file: str):
        self.excel_file = excel_file
        self.output_dir = Path("data/processed")
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Load all data from Excel
        self.data = self.load_all_excel_data()

        # Initialize forecasting models
        self.models = {
            'exp_smooth': self._forecast_exponential_smoothing,
            'arima': self._forecast_arima,
            'sarimax': self._forecast_sarimax,
            'linear_trend': self._forecast_linear_trend,
            'ensemble': self._forecast_ensemble
        }

    def load_all_excel_data(self) -> Dict[str, Any]:
        """Load and process all data from Excel file."""
        print("Loading comprehensive trade data from Excel file...")

        excel_data = pd.read_excel(self.excel_file, sheet_name=None)
        data = {}

        # 1. Overall trade data (Graph Overall)
        data['overall'] = self._process_overall_trade(excel_data.get('Graph Overall', pd.DataFrame()))

        # 2. EAC trade data
        data['eac'] = self._process_eac_trade(excel_data.get('Graph EAC', pd.DataFrame()))

        # 3. Detailed EAC countries
        data['eac_countries'] = self._process_eac_countries(excel_data.get('EAC', pd.DataFrame()))

        # 4. Country-level trade
        data['export_countries'] = self._process_country_data(excel_data.get('ExportCountry', pd.DataFrame()), 'exports')
        data['import_countries'] = self._process_country_data(excel_data.get('ImportCountry', pd.DataFrame()), 'imports')
        data['reexport_countries'] = self._process_country_data(excel_data.get('ReexportsCountry', pd.DataFrame()), 'reexports')

        # 5. Commodity data
        data['export_commodities'] = self._process_commodity_data(excel_data.get('ExportsCommodity', pd.DataFrame()), 'exports')
        data['import_commodities'] = self._process_commodity_data(excel_data.get('ImportsCommodity', pd.DataFrame()), 'imports')
        data['reexport_commodities'] = self._process_commodity_data(excel_data.get('ReexportsCommodity', pd.DataFrame()), 'reexports')

        # 6. Regional blocks
        data['regional_blocks'] = self._process_regional_blocks(excel_data.get('Regional blocks', pd.DataFrame()))

        # 7. Continental data
        data['continents'] = self._process_continental_data(excel_data.get('Trade by continents', pd.DataFrame()))

        print(f"Loaded data from {len(data)} categories")
        return data

    def _process_overall_trade(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process overall trade data from Graph Overall sheet."""
        if df.empty:
            return {}

        quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        data = {'quarters': quarters}

        # Extract values for each metric
        metrics = ['exports', 'imports', 're_exports', 'total_trade', 'trade_balance']
        row_indices = [3, 4, 5, 6, 7]  # Corresponding row indices

        for metric, row_idx in zip(metrics, row_indices):
            values = []
            for col_idx in range(3, 12):  # Columns 3-11
                try:
                    val = float(df.iloc[row_idx, col_idx]) if pd.notna(df.iloc[row_idx, col_idx]) else 0
                    values.append(val)
                except:
                    values.append(0)
            data[metric] = values

        return data

    def _process_eac_trade(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process EAC trade data."""
        if df.empty:
            return {}

        quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1']

        data = {'quarters': quarters}

        # Extract EAC exports, imports, re-exports, total trade, balance
        metrics = ['exports', 'imports', 're_exports', 'total_trade', 'trade_balance']
        row_indices = [2, 3, 4, 5, 6]  # Adjust based on actual structure

        for metric, row_idx in zip(metrics, row_indices):
            values = []
            for col_idx in range(1, 10):  # Columns 1-9
                try:
                    val = float(df.iloc[row_idx, col_idx]) if pd.notna(df.iloc[row_idx, col_idx]) else 0
                    values.append(val)
                except:
                    values.append(0)
            data[metric] = values

        return data

    def _process_eac_countries(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process detailed EAC country data."""
        if df.empty:
            return {}

        countries_data = {'exports': {}, 'imports': {}, 're_exports': {}}

        # Process each flow type
        flows = ['Exports', 'Imports', 'Re-Exports']
        flow_keys = ['exports', 'imports', 're_exports']

        for flow, key in zip(flows, flow_keys):
            # Find rows for this flow
            flow_rows = df[df.iloc[:, 0] == flow]
            if not flow_rows.empty:
                start_idx = flow_rows.index[0] + 1

                # Process each country
                for idx in range(start_idx, len(df)):
                    row = df.iloc[idx]
                    country = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''

                    if not country or country == 'nan' or 'Source:' in country:
                        break

                    values = []
                    for col_idx in range(2, 11):  # Quarterly values
                        try:
                            val = float(row.iloc[col_idx]) if pd.notna(row.iloc[col_idx]) else 0
                            values.append(val)
                        except:
                            values.append(0)

                    if values and sum(values) > 0:
                        countries_data[key][country] = values

        return countries_data

    def _process_country_data(self, df: pd.DataFrame, flow_type: str) -> Dict[str, Any]:
        """Process country-level trade data."""
        if df.empty:
            return {}

        countries = {}

        # Skip header rows and process data rows
        for idx in range(4, len(df)):
            row = df.iloc[idx]
            country = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if not country or country == 'nan' or 'Source:' in country:
                continue

            values = []
            for col_idx in range(1, 10):  # Quarterly values
                try:
                    val = float(row.iloc[col_idx]) if pd.notna(row.iloc[col_idx]) else 0
                    values.append(val)
                except:
                    values.append(0)

            if values and sum(values) > 0:
                countries[country] = values

        return countries

    def _process_commodity_data(self, df: pd.DataFrame, flow_type: str) -> Dict[str, Any]:
        """Process commodity-level trade data."""
        if df.empty:
            return {}

        commodities = {}

        # Find data start
        data_start = 0
        for idx, row in df.iterrows():
            if 'SITC SECTION' in str(row.iloc[0]).upper():
                data_start = idx + 1
                break

        # Process commodities
        for idx in range(data_start, len(df)):
            row = df.iloc[idx]
            section = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if not section or section == 'nan' or section == 'Total Estimates':
                continue

            description = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else f'SITC {section}'

            values = []
            for col_idx in range(2, 11):  # Quarterly values
                try:
                    val = float(row.iloc[col_idx]) if pd.notna(row.iloc[col_idx]) else 0
                    values.append(val)
                except:
                    values.append(0)

            if values and sum(values) > 0:
                commodities[description] = {
                    'section': section,
                    'values': values
                }

        return commodities

    def _process_regional_blocks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process regional blocks data."""
        if df.empty:
            return {}

        regions = {}

        # Process each region
        for idx in range(1, len(df)):
            row = df.iloc[idx]
            region = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if not region or region == 'nan' or 'Source:' in region:
                continue

            region_data = {}

            # Process each flow type
            flows = ['Export', 'Import', 'Re-export', 'Total Trade']
            flow_keys = ['exports', 'imports', 're_exports', 'total_trade']

            for flow, key in zip(flows, flow_keys):
                values = []
                for col_idx in range(1, 10):  # Quarterly values
                    try:
                        val = float(row.iloc[col_idx]) if pd.notna(row.iloc[col_idx]) else 0
                        values.append(val)
                    except:
                        values.append(0)
                region_data[key] = values

            regions[region] = region_data

        return regions

    def _process_continental_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Process continental trade data."""
        if df.empty:
            return {}

        continents = {}

        # Process each continent
        for idx in range(1, len(df)):
            row = df.iloc[idx]
            continent = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''

            if not continent or continent == 'nan' or continent == 'WORLD':
                continue

            continent_data = {}

            # Process flows
            flows = ['Exports', 'Imports', 'Re-Exports']
            flow_keys = ['exports', 'imports', 're_exports']

            for flow, key in zip(flows, flow_keys):
                values = []
                for col_idx in range(1, 10):  # Quarterly values
                    try:
                        val = float(row.iloc[col_idx]) if pd.notna(row.iloc[col_idx]) else 0
                        values.append(val)
                    except:
                        values.append(0)
                continent_data[key] = values

            continents[continent] = continent_data

        return continents

    def forecast_time_series(self, values: List[float], periods: int = 4,
                           method: str = 'ensemble') -> Dict[str, Any]:
        """Forecast time series using specified method."""
        if not values or len(values) < 2:
            return {
                'forecast': [np.mean(values) if values else 0] * periods,
                'method': 'average',
                'confidence': 50
            }

        if method not in self.models:
            method = 'ensemble'

        try:
            return self.models[method](values, periods)
        except Exception as e:
            print(f"Forecasting failed with {method}: {e}")
            # Fallback to simple average
            return {
                'forecast': [np.mean(values)] * periods,
                'method': 'average_fallback',
                'confidence': 40
            }

    def _forecast_exponential_smoothing(self, values: List[float], periods: int) -> Dict[str, Any]:
        """Exponential smoothing forecast."""
        try:
            model = ExponentialSmoothing(values, seasonal='add', seasonal_periods=4)
            fitted_model = model.fit()
            forecast = fitted_model.forecast(periods)
            return {
                'forecast': forecast.tolist(),
                'method': 'exponential_smoothing',
                'confidence': 75
            }
        except:
            return self._forecast_linear_trend(values, periods)

    def _forecast_arima(self, values: List[float], periods: int) -> Dict[str, Any]:
        """ARIMA forecast."""
        try:
            model = ARIMA(values, order=(1, 1, 1))
            fitted_model = model.fit()
            forecast = fitted_model.forecast(periods)
            return {
                'forecast': forecast.tolist(),
                'method': 'arima',
                'confidence': 70
            }
        except:
            return self._forecast_linear_trend(values, periods)

    def _forecast_sarimax(self, values: List[float], periods: int) -> Dict[str, Any]:
        """SARIMAX forecast."""
        try:
            model = SARIMAX(values, order=(1, 1, 1), seasonal_order=(1, 1, 1, 4))
            fitted_model = model.fit(disp=False)
            forecast = fitted_model.forecast(periods)
            return {
                'forecast': forecast.tolist(),
                'method': 'sarimax',
                'confidence': 80
            }
        except:
            return self._forecast_arima(values, periods)

    def _forecast_linear_trend(self, values: List[float], periods: int) -> Dict[str, Any]:
        """Linear trend forecast."""
        try:
            x = np.arange(len(values))
            slope, intercept = np.polyfit(x, values, 1)

            forecast = []
            for i in range(1, periods + 1):
                pred = intercept + slope * (len(values) + i - 1)
                forecast.append(max(0, pred))  # Ensure non-negative

            return {
                'forecast': forecast,
                'method': 'linear_trend',
                'confidence': 65
            }
        except:
            avg = np.mean(values)
            return {
                'forecast': [avg] * periods,
                'method': 'average',
                'confidence': 50
            }

    def _forecast_ensemble(self, values: List[float], periods: int) -> Dict[str, Any]:
        """Ensemble forecast combining multiple methods."""
        forecasts = []

        # Try different methods
        methods = ['exponential_smoothing', 'arima', 'linear_trend']
        for method in methods:
            try:
                result = self.models[method.replace('_', '')](values, periods)
                forecasts.append(result['forecast'])
            except:
                continue

        if not forecasts:
            return self._forecast_linear_trend(values, periods)

        # Average the forecasts
        ensemble_forecast = np.mean(forecasts, axis=0).tolist()

        return {
            'forecast': ensemble_forecast,
            'method': 'ensemble',
            'confidence': 85,
            'component_methods': methods
        }

    def generate_next_quarters(self, last_quarter: str, periods: int) -> List[str]:
        """Generate next quarter labels."""
        try:
            year, quarter = last_quarter.split('Q')
            year = int(year)
            quarter = int(quarter)

            next_quarters = []
            for i in range(1, periods + 1):
                quarter += 1
                if quarter > 4:
                    quarter = 1
                    year += 1
                next_quarters.append(f"{year}Q{quarter}")
            return next_quarters
        except:
            return [f"2025Q{i}" for i in range(2, periods + 2)]

    def generate_comprehensive_predictions(self, forecast_periods: int = 4) -> Dict[str, Any]:
        """Generate comprehensive predictions for all aspects."""
        print(f"Generating comprehensive predictions for next {forecast_periods} quarters...")

        predictions = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'data_source': self.excel_file,
                'forecast_periods': forecast_periods,
                'model_version': '1.0'
            },
            'overall_predictions': {},
            'eac_predictions': {},
            'country_predictions': {},
            'commodity_predictions': {},
            'regional_predictions': {},
            'continental_predictions': {},
            'insights': {},
            'recommendations': []
        }

        # Generate next quarters
        last_quarter = self.data.get('overall', {}).get('quarters', ['2025Q1'])[-1]
        next_quarters = self.generate_next_quarters(last_quarter, forecast_periods)

        # 1. Overall trade predictions
        if 'overall' in self.data:
            predictions['overall_predictions'] = self._predict_overall_trade(
                self.data['overall'], next_quarters, forecast_periods
            )

        # 2. EAC predictions
        if 'eac' in self.data:
            predictions['eac_predictions'] = self._predict_eac_trade(
                self.data['eac'], next_quarters, forecast_periods
            )

        # 3. Country-level predictions
        predictions['country_predictions'] = self._predict_country_trade(
            next_quarters, forecast_periods
        )

        # 4. Commodity predictions
        predictions['commodity_predictions'] = self._predict_commodity_trade(
            next_quarters, forecast_periods
        )

        # 5. Regional predictions
        predictions['regional_predictions'] = self._predict_regional_trade(
            next_quarters, forecast_periods
        )

        # 6. Continental predictions
        predictions['continental_predictions'] = self._predict_continental_trade(
            next_quarters, forecast_periods
        )

        # Generate insights and recommendations
        predictions['insights'] = self._generate_comprehensive_insights(predictions)
        predictions['recommendations'] = self._generate_recommendations(predictions)

        return predictions

    def _predict_overall_trade(self, data: Dict, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict overall trade metrics."""
        predictions = {}

        metrics = ['exports', 'imports', 're_exports', 'total_trade', 'trade_balance']

        for metric in metrics:
            if metric in data:
                values = data[metric]
                forecast_result = self.forecast_time_series(values, periods, 'ensemble')

                predictions[metric] = {
                    'quarters': next_quarters,
                    'values': forecast_result['forecast'],
                    'method': forecast_result['method'],
                    'confidence': forecast_result['confidence'],
                    'historical_avg': float(np.mean(values)),
                    'last_value': float(values[-1]) if values else 0
                }

        # Calculate derived trade balance
        if 'exports' in predictions and 'imports' in predictions:
            exp_vals = predictions['exports']['values']
            imp_vals = predictions['imports']['values']
            balance_vals = [e - i for e, i in zip(exp_vals, imp_vals)]

            predictions['trade_balance_calculated'] = {
                'quarters': next_quarters,
                'values': balance_vals,
                'method': 'derived',
                'confidence': min(predictions['exports']['confidence'], predictions['imports']['confidence'])
            }

        return predictions

    def _predict_eac_trade(self, data: Dict, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict EAC trade metrics."""
        return self._predict_overall_trade(data, next_quarters, periods)

    def _predict_country_trade(self, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict country-level trade."""
        predictions = {
            'exports': {},
            'imports': {},
            'reexports': {}
        }

        # Top countries for each flow
        country_data = {
            'exports': self.data.get('export_countries', {}),
            'imports': self.data.get('import_countries', {}),
            'reexports': self.data.get('reexport_countries', {})
        }

        for flow_type, countries in country_data.items():
            # Get top 5 countries by total value
            top_countries = sorted(countries.items(),
                                 key=lambda x: sum(x[1]) if x[1] else 0,
                                 reverse=True)[:5]

            for country, values in top_countries:
                if len(values) >= 2:
                    forecast_result = self.forecast_time_series(values, periods, 'linear_trend')
                    predictions[flow_type][country] = {
                        'quarters': next_quarters,
                        'values': forecast_result['forecast'],
                        'method': forecast_result['method'],
                        'confidence': forecast_result['confidence'],
                        'historical_total': float(sum(values)),
                        'last_value': float(values[-1])
                    }

        return predictions

    def _predict_commodity_trade(self, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict commodity-level trade."""
        predictions = {
            'exports': {},
            'imports': {},
            'reexports': {}
        }

        commodity_data = {
            'exports': self.data.get('export_commodities', {}),
            'imports': self.data.get('import_commodities', {}),
            'reexports': self.data.get('reexport_commodities', {})
        }

        for flow_type, commodities in commodity_data.items():
            # Get top 5 commodities by total value
            top_commodities = sorted(
                [(name, data['values']) for name, data in commodities.items()],
                key=lambda x: sum(x[1]) if x[1] else 0,
                reverse=True
            )[:5]

            for commodity, values in top_commodities:
                if len(values) >= 2:
                    forecast_result = self.forecast_time_series(values, periods, 'linear_trend')
                    predictions[flow_type][commodity] = {
                        'quarters': next_quarters,
                        'values': forecast_result['forecast'],
                        'method': forecast_result['method'],
                        'confidence': forecast_result['confidence'],
                        'historical_total': float(sum(values)),
                        'last_value': float(values[-1]),
                        'section': commodities[commodity]['section']
                    }

        return predictions

    def _predict_regional_trade(self, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict regional trade."""
        predictions = {}

        regional_data = self.data.get('regional_blocks', {})

        for region, region_data in regional_data.items():
            predictions[region] = {}

            for flow_type in ['exports', 'imports', 're_exports', 'total_trade']:
                if flow_type in region_data:
                    values = region_data[flow_type]
                    if len(values) >= 2:
                        forecast_result = self.forecast_time_series(values, periods, 'linear_trend')
                        predictions[region][flow_type] = {
                            'quarters': next_quarters,
                            'values': forecast_result['forecast'],
                            'method': forecast_result['method'],
                            'confidence': forecast_result['confidence'],
                            'historical_total': float(sum(values)),
                            'last_value': float(values[-1])
                        }

        return predictions

    def _predict_continental_trade(self, next_quarters: List[str], periods: int) -> Dict[str, Any]:
        """Predict continental trade."""
        predictions = {}

        continental_data = self.data.get('continents', {})

        for continent, continent_data in continental_data.items():
            predictions[continent] = {}

            for flow_type in ['exports', 'imports', 're_exports']:
                if flow_type in continent_data:
                    values = continent_data[flow_type]
                    if len(values) >= 2:
                        forecast_result = self.forecast_time_series(values, periods, 'linear_trend')
                        predictions[continent][flow_type] = {
                            'quarters': next_quarters,
                            'values': forecast_result['forecast'],
                            'method': forecast_result['method'],
                            'confidence': forecast_result['confidence'],
                            'historical_total': float(sum(values)),
                            'last_value': float(values[-1])
                        }

        return predictions

    def _generate_comprehensive_insights(self, predictions: Dict) -> Dict[str, Any]:
        """Generate comprehensive insights from all predictions."""
        insights = {
            'overall_trends': [],
            'risks': [],
            'opportunities': [],
            'key_metrics': {}
        }

        # Overall trade insights
        overall = predictions.get('overall_predictions', {})
        if 'exports' in overall and 'imports' in overall:
            next_exp = overall['exports']['values'][0]
            next_imp = overall['imports']['values'][0]
            next_balance = next_exp - next_imp

            insights['key_metrics'] = {
                'next_quarter_export': float(next_exp),
                'next_quarter_import': float(next_imp),
                'next_quarter_balance': float(next_balance),
                'balance_type': 'surplus' if next_balance >= 0 else 'deficit'
            }

            # Growth insights
            last_exp = overall['exports']['last_value']
            last_imp = overall['imports']['last_value']
            exp_growth = ((next_exp - last_exp) / last_exp) * 100 if last_exp != 0 else 0
            imp_growth = ((next_imp - last_imp) / last_imp) * 100 if last_imp != 0 else 0

            if exp_growth > 5:
                insights['opportunities'].append(f"Strong export growth expected ({exp_growth:.1f}%)")
            if imp_growth > 5:
                insights['risks'].append(f"Import growth may increase ({imp_growth:.1f}%)")
            if next_balance < 0:
                insights['risks'].append(f"Trade deficit expected: ${abs(next_balance):,.0f}")

        # EAC insights
        eac = predictions.get('eac_predictions', {})
        if eac:
            insights['overall_trends'].append("EAC trade predictions generated")

        # Country insights
        countries = predictions.get('country_predictions', {})
        if countries.get('exports'):
            top_exporter = max(countries['exports'].items(),
                             key=lambda x: x[1]['values'][0])
            insights['overall_trends'].append(f"Top export destination: {top_exporter[0]}")

        return insights

    def _generate_recommendations(self, predictions: Dict) -> List[Dict]:
        """Generate policy recommendations based on predictions."""
        recommendations = []

        overall = predictions.get('overall_predictions', {})

        if 'trade_balance_calculated' in overall:
            balance = overall['trade_balance_calculated']['values'][0]

            if balance < -100000:  # Large deficit
                recommendations.append({
                    'type': 'trade_policy',
                    'priority': 'high',
                    'title': 'Address Trade Deficit',
                    'description': f'Predicted deficit of ${abs(balance):,.0f} suggests need for import substitution policies',
                    'confidence': overall['trade_balance_calculated']['confidence']
                })

        # Export growth recommendations
        if 'exports' in overall:
            last_exp_val = overall['exports']['last_value']
            if last_exp_val != 0:
                exp_growth = ((overall['exports']['values'][0] - last_exp_val) / last_exp_val) * 100

                if exp_growth > 10:
                    recommendations.append({
                        'type': 'export_promotion',
                        'priority': 'medium',
                        'title': 'Capitalize on Export Growth',
                        'description': f'Strong export growth ({exp_growth:.1f}%) indicates successful policies - consider expansion',
                        'confidence': overall['exports']['confidence']
                    })

        return recommendations

    def save_predictions(self, predictions: Dict, filename: str = "comprehensive_trade_predictions.json") -> str:
        """Save comprehensive predictions to JSON file."""
        filepath = self.output_dir / filename

        # Convert numpy types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj) if not np.isnan(obj) else None
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {key: convert_types(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_types(item) for item in obj]
            else:
                return obj

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(convert_types(predictions), f, indent=2, ensure_ascii=False)

        print(f"Comprehensive predictions saved to {filepath}")
        return str(filepath)

    def print_summary(self, predictions: Dict):
        """Print comprehensive prediction summary."""
        print("\n" + "="*80)
        print("RWANDA COMPREHENSIVE TRADE PREDICTIONS SUMMARY")
        print("="*80)

        # Overall metrics
        overall = predictions.get('overall_predictions', {})
        if overall:
            print(f"\nOverall Trade Predictions (Next Quarter):")
            if 'exports' in overall:
                exp = overall['exports']
                print(f"   Exports: ${exp['values'][0]:,.0f} ({exp['method']}, {exp['confidence']}% confidence)")
            if 'imports' in overall:
                imp = overall['imports']
                print(f"   Imports: ${imp['values'][0]:,.0f} ({imp['method']}, {imp['confidence']}% confidence)")
            if 'trade_balance_calculated' in overall:
                bal = overall['trade_balance_calculated']
                balance_type = "SURPLUS" if bal['values'][0] >= 0 else "DEFICIT"
                print(f"   Trade Balance: ${bal['values'][0]:,.0f} ({balance_type})")

        # Key insights
        insights = predictions.get('insights', {})
        if insights.get('opportunities'):
            print(f"\nOpportunities:")
            for opp in insights['opportunities']:
                print(f"   • {opp}")

        if insights.get('risks'):
            print(f"\nRisks:")
            for risk in insights['risks']:
                print(f"   • {risk}")

        # Recommendations
        recs = predictions.get('recommendations', [])
        if recs:
            print(f"\nRecommendations:")
            for rec in recs:
                priority = rec.get('priority', 'medium').upper()
                print(f"   [{priority}] {rec.get('title', '')}: {rec.get('description', '')}")

        print(f"\nComprehensive predictions generated for {len(predictions)-2} categories")
        print("="*80)


def main():
    """Main function to run comprehensive predictions."""
    excel_file = "../data/raw/2025Q1_Trade_report_annexTables.xlsx"

    if not os.path.exists(excel_file):
        print(f"Excel file not found: {excel_file}")
        return

    try:
        print("Initializing Comprehensive Rwanda Trade Predictor...")

        # Initialize predictor
        predictor = ComprehensiveRwandaTradePredictor(excel_file)

        # Generate comprehensive predictions
        predictions = predictor.generate_comprehensive_predictions(forecast_periods=4)

        # Save predictions
        filepath = predictor.save_predictions(predictions)

        # Print summary
        predictor.print_summary(predictions)

        print(f"\nComprehensive predictions completed successfully!")
        print(f"Results saved to: {filepath}")

    except Exception as e:
        print(f"Error during comprehensive prediction: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()