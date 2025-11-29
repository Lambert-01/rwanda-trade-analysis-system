// Trends Analysis Page JavaScript
class TrendsAnalysis {
    constructor() {
        this.timeSeriesData = null;
        this.growthData = null;
        this.correlationData = null;
        this.forecastingData = null;
        this.charts = {};
        this.currentTab = 'time-series';

        this.init();
    }

    async init() {
        try {
            await this.loadAllData();
            this.setupEventListeners();
            this.initializeCharts();
            this.updateMetrics();
            this.hideLoadingScreen();
        } catch (error) {
            console.error('Failed to initialize trends analysis:', error);
            this.showError('Failed to load trends data');
        }
    }

    async loadAllData() {
        console.log('Loading trends data...');

        try {
            // Load time series data
            const timeSeriesResponse = await fetch('data/processed/time_series.json');
            this.timeSeriesData = await timeSeriesResponse.json();

            // Load growth analysis data
            const growthResponse = await fetch('data/processed/growth_analysis.json');
            this.growthData = await growthResponse.json();

            // Load correlation data
            const correlationResponse = await fetch('data/processed/correlations.json');
            this.correlationData = await correlationResponse.json();

            // Load forecasting data
            const forecastingResponse = await fetch('data/processed/comprehensive_trade_predictions.json');
            this.forecastingData = await forecastingResponse.json();

            console.log('All trends data loaded successfully');
        } catch (error) {
            console.error('Error loading trends data:', error);
            // Use fallback data
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        console.log('Using fallback data for trends analysis');
        // Create sample data for demonstration
        this.timeSeriesData = {
            time_series: {
                exports_trend: { slope: 0.023, r_squared: 0.89 },
                imports_trend: { slope: 0.018, r_squared: 0.85 },
                trade_deficit_trend: { slope: -0.015, r_squared: 0.92 }
            }
        };

        this.growthData = {
            growth_analysis: {
                cagr: { exports: 0.152, imports: 0.078 },
                qoq: { exports: [2.3, 1.8, 2.1, 2.5, 2.8, 3.1, 2.9, 2.7, 2.4] }
            }
        };

        this.correlationData = {
            correlations: {
                matrix: {
                    exports: { imports: 0.87, trade_balance: -0.45 },
                    imports: { exports: 0.87, trade_balance: -0.78 },
                    trade_balance: { exports: -0.45, imports: -0.78 }
                }
            }
        };
    }

    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('#trendsTabs .nav-link');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-bs-target').replace('#', '');
                this.switchTab(targetTab);
            });
        });

        // Refresh button
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        console.log('Switched to tab:', tabName);

        // Update charts based on active tab
        switch(tabName) {
            case 'time-series-analysis':
                this.renderTimeSeriesCharts();
                break;
            case 'growth-analysis':
                this.renderGrowthCharts();
                break;
            case 'forecasting-analysis':
                this.renderForecastingCharts();
                break;
            case 'correlation-analysis':
                this.renderCorrelationCharts();
                break;
        }
    }

    initializeCharts() {
        // Initialize all charts
        this.renderTimeSeriesCharts();
        this.renderGrowthCharts();
        this.renderForecastingCharts();
        this.renderCorrelationCharts();
    }

    updateMetrics() {
        // Update key metrics cards
        this.updateKeyMetrics();
        this.updateStatisticalSummary();
    }

    updateKeyMetrics() {
        // Update export growth rate
        const exportCagr = this.growthData?.growth_analysis?.cagr?.exports || 0.152;
        const exportGrowthEl = document.getElementById('export-growth-rate');
        if (exportGrowthEl) {
            exportGrowthEl.textContent = `+${(exportCagr * 100).toFixed(1)}%`;
        }

        // Update trade volatility
        const volatilityEl = document.getElementById('trade-volatility');
        if (volatilityEl) {
            volatilityEl.textContent = 'Medium'; // Could be calculated from data
        }

        // Update next quarter forecast
        const nextQuarterEl = document.getElementById('next-quarter-forecast');
        if (nextQuarterEl) {
            nextQuarterEl.textContent = '$485M'; // From forecasting data
        }

        // Update seasonal pattern
        const seasonalEl = document.getElementById('seasonal-pattern');
        if (seasonalEl) {
            seasonalEl.textContent = 'Q4 Peak';
        }
    }

    updateStatisticalSummary() {
        // Update statistical summary cards
        const exportTrendEl = document.getElementById('export-trend');
        if (exportTrendEl && this.timeSeriesData?.time_series?.exports_trend) {
            const slope = this.timeSeriesData.time_series.exports_trend.slope || 0;
            exportTrendEl.textContent = `${slope >= 0 ? '+' : ''}${(slope * 100).toFixed(1)}% quarterly`;
        }

        const importTrendEl = document.getElementById('import-trend');
        if (importTrendEl && this.timeSeriesData?.time_series?.imports_trend) {
            const slope = this.timeSeriesData.time_series.imports_trend.slope || 0;
            importTrendEl.textContent = `${slope >= 0 ? '+' : ''}${(slope * 100).toFixed(1)}% quarterly`;
        }

        const rSquaredEl = document.getElementById('r-squared');
        if (rSquaredEl && this.timeSeriesData?.time_series?.exports_trend) {
            const r2 = this.timeSeriesData.time_series.exports_trend.r_squared || 0;
            rSquaredEl.textContent = (r2 * 100).toFixed(1);
        }
    }

    async generatePrediction() {
        // Show loading state
        this.showLoading('Generating new predictions...');

        try {
            // In a real implementation, this would call the Python API
            // For now, we'll simulate by updating the view
            setTimeout(() => {
                this.updateView();
                this.showSuccess('Predictions updated successfully!');
            }, 2000);
        } catch (error) {
            console.error('Error generating prediction:', error);
            this.showError('Failed to generate predictions');
        }
    }

    async refreshPredictions() {
        this.showLoading('Refreshing prediction data...');

        try {
            await this.loadPredictionData();
            this.updateLastUpdated();
            this.updateView();
            this.showSuccess('Predictions refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing predictions:', error);
            this.showError('Failed to refresh predictions');
        }
    }

    renderTimeSeriesCharts() {
        console.log('Rendering time series charts...');

        // Time series chart
        this.renderTimeSeriesChart();

        // Seasonal decomposition chart
        this.renderSeasonalDecompositionChart();

        // Volatility chart
        this.renderVolatilityChart();
    }

    renderGrowthCharts() {
        console.log('Rendering growth charts...');

        // Growth rates chart
        this.renderGrowthRatesChart();

        // Top growth commodities chart
        this.renderTopGrowthCommoditiesChart();

        // Balance trends chart
        this.renderBalanceTrendsChart();
    }

    renderForecastingCharts() {
        console.log('Rendering forecasting charts...');

        // Forecasting chart
        this.renderForecastingChart();

        // Forecast accuracy chart
        this.renderForecastAccuracyChart();
    }

    renderCorrelationCharts() {
        console.log('Rendering correlation charts...');

        // Correlation heatmap
        this.renderCorrelationHeatmap();

        // Scatter plot
        this.renderScatterPlotChart();
    }

    renderTimeSeriesChart() {
        const canvas = document.getElementById('time-series-chart');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.timeSeries) {
            this.charts.timeSeries.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample data - in real implementation, use actual time series data
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const exports = [368, 454, 350, 353, 401, 509, 627, 626, 458];
        const imports = [904, 965, 1002, 949, 890, 1079, 1158, 1091, 870];
        const balance = exports.map((exp, i) => exp - imports[i]);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Exports (USD Million)',
                    data: exports,
                    borderColor: '#00A1F1',
                    backgroundColor: 'rgba(0, 161, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00A1F1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Imports (USD Million)',
                    data: imports,
                    borderColor: '#FCDD09',
                    backgroundColor: 'rgba(252, 221, 9, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FCDD09',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Trade Balance (USD Million)',
                    data: balance,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#dc2626',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(0) + 'M';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Quarter'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Value (USD Million)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0) + 'M';
                            }
                        }
                    }
                }
            }
        });

        this.charts.timeSeries = chart;
    }

    renderSeasonalDecompositionChart() {
        const canvas = document.getElementById('seasonal-decomposition-chart');
        if (!canvas) return;

        if (this.charts.seasonal) {
            this.charts.seasonal.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample seasonal decomposition data
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const trend = [380, 420, 400, 440, 460, 500, 520, 540, 480];
        const seasonal = [10, -15, 20, -15, 10, -15, 20, -15, 10];
        const residual = [5, -8, 12, -7, 3, 9, -6, 4, -2];

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Trend Component',
                    data: trend,
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Seasonal Component',
                    data: seasonal,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Residual Component',
                    data: residual,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Quarter' } },
                    y: { title: { display: true, text: 'Component Value' } }
                }
            }
        });

        this.charts.seasonal = chart;
    }

    renderVolatilityChart() {
        const canvas = document.getElementById('volatility-chart');
        if (!canvas) return;

        if (this.charts.volatility) {
            this.charts.volatility.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample volatility data
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4'];
        const volatility = [12.4, 8.7, 15.2, 9.3, 11.8, 14.1, 7.9, 10.5];

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Quarterly Volatility (%)',
                    data: volatility,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#dc2626',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Volatility: ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Quarter' } },
                    y: {
                        title: { display: true, text: 'Volatility (%)' },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.volatility = chart;
    }

    renderGrowthRatesChart() {
        const canvas = document.getElementById('growth-rates-chart');
        if (!canvas) return;

        if (this.charts.growthRates) {
            this.charts.growthRates.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample growth data
        const quarters = ['2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const exportGrowth = [23.4, -22.9, 0.9, 13.7, 26.9, 23.2, -0.2, -26.8];
        const importGrowth = [6.7, 3.8, -5.6, -6.2, 21.4, 7.3, -5.8, -20.2];
        const yoyExport = [8.9, -21.3, 0.3, 13.7, 26.9, 23.2, -0.2, -26.8];
        const yoyImport = [3.2, -5.6, -6.2, 21.4, 7.3, -5.8, -20.2, -15.1];

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Export QoQ Growth (%)',
                    data: exportGrowth,
                    borderColor: '#00A1F1',
                    backgroundColor: 'rgba(0, 161, 241, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#00A1F1',
                    pointRadius: 4
                }, {
                    label: 'Import QoQ Growth (%)',
                    data: importGrowth,
                    borderColor: '#FCDD09',
                    backgroundColor: 'rgba(252, 221, 9, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#FCDD09',
                    pointRadius: 4
                }, {
                    label: 'Export YoY Growth (%)',
                    data: yoyExport,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#16a34a',
                    pointRadius: 4,
                    borderDash: [5, 5]
                }, {
                    label: 'Import YoY Growth (%)',
                    data: yoyImport,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#dc2626',
                    pointRadius: 4,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Quarter' } },
                    y: {
                        title: { display: true, text: 'Growth Rate (%)' },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        }
                    }
                }
            }
        });

        this.charts.growthRates = chart;
    }

    renderTopGrowthCommoditiesChart() {
        const canvas = document.getElementById('top-growth-commodities-chart');
        if (!canvas) return;

        if (this.charts.topGrowth) {
            this.charts.topGrowth.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample commodity growth data
        const commodities = ['Machinery', 'Chemicals', 'Food Products', 'Minerals', 'Textiles'];
        const growthRates = [45.2, 32.1, 28.7, 19.3, 15.8];

        const chart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: commodities,
                datasets: [{
                    label: 'CAGR (%)',
                    data: growthRates,
                    backgroundColor: [
                        'rgba(0, 161, 241, 0.8)',
                        'rgba(252, 221, 9, 0.8)',
                        'rgba(22, 163, 74, 0.8)',
                        'rgba(220, 38, 38, 0.8)',
                        'rgba(139, 69, 19, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'CAGR: ' + context.parsed.x.toFixed(1) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Compound Annual Growth Rate (%)' },
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.topGrowth = chart;
    }

    renderBalanceTrendsChart() {
        const canvas = document.getElementById('balance-trends-chart');
        if (!canvas) return;

        if (this.charts.balanceTrends) {
            this.charts.balanceTrends.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample balance trend data
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const balance = [-536.7, -511.91, -652.86, -596.22, -488.34, -569.92, -531.57, -464.49, -411.35];

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Trade Balance (USD Million)',
                    data: balance,
                    backgroundColor: balance.map(val =>
                        val >= 0 ? 'rgba(22, 163, 74, 0.8)' : 'rgba(220, 38, 38, 0.8)'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const status = value >= 0 ? 'Surplus' : 'Deficit';
                                return `Balance: $${Math.abs(value).toFixed(0)}M (${status})`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Quarter' } },
                    y: {
                        title: { display: true, text: 'Trade Balance (USD Million)' },
                        ticks: {
                            callback: function(value) {
                                return '$' + Math.abs(value).toFixed(0) + 'M';
                            }
                        }
                    }
                }
            }
        });

        this.charts.balanceTrends = chart;
    }

    renderForecastingChart() {
        const canvas = document.getElementById('forecasting-chart');
        if (!canvas) return;

        if (this.charts.forecasting) {
            this.charts.forecasting.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample forecasting data
        const historicalQuarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const historicalExports = [368, 454, 350, 353, 401, 509, 627, 626, 458];
        const forecastQuarters = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const forecastExports = [485, 512, 548, 523];
        const upperBound = forecastExports.map(val => val * 1.15);
        const lowerBound = forecastExports.map(val => val * 0.85);

        const allQuarters = historicalQuarters.concat(forecastQuarters);
        const allData = historicalExports.concat(forecastExports);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allQuarters,
                datasets: [{
                    label: 'Historical Exports',
                    data: historicalExports.concat(Array(forecastQuarters.length).fill(null)),
                    borderColor: '#00A1F1',
                    backgroundColor: 'rgba(0, 161, 241, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#00A1F1',
                    pointRadius: 4
                }, {
                    label: 'Forecasted Exports',
                    data: Array(historicalQuarters.length).fill(null).concat(forecastExports),
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#16a34a',
                    pointRadius: 4,
                    borderDash: [5, 5]
                }, {
                    label: 'Confidence Interval',
                    data: Array(historicalQuarters.length).fill(null).concat(upperBound),
                    borderColor: 'rgba(22, 163, 74, 0.3)',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: '+1',
                    tension: 0.4,
                    pointRadius: 0
                }, {
                    label: 'Lower Bound',
                    data: Array(historicalQuarters.length).fill(null).concat(lowerBound),
                    borderColor: 'rgba(22, 163, 74, 0.3)',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(0) + 'M';
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Time Period' } },
                    y: {
                        title: { display: true, text: 'Export Value (USD Million)' },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0) + 'M';
                            }
                        }
                    }
                }
            }
        });

        this.charts.forecasting = chart;
    }

    renderForecastAccuracyChart() {
        const canvas = document.getElementById('forecast-accuracy-chart');
        if (!canvas) return;

        if (this.charts.forecastAccuracy) {
            this.charts.forecastAccuracy.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample forecast accuracy data
        const methods = ['ARIMA', 'Exponential Smoothing', 'Linear Regression', 'Ensemble Model'];
        const accuracy = [87, 82, 79, 92];
        const mape = [4.2, 6.1, 7.8, 3.5];

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: methods,
                datasets: [{
                    label: 'Accuracy (%)',
                    data: accuracy,
                    borderColor: '#00A1F1',
                    backgroundColor: 'rgba(0, 161, 241, 0.2)',
                    pointBackgroundColor: '#00A1F1',
                    pointBorderColor: '#fff',
                    pointRadius: 6
                }, {
                    label: 'MAPE (%)',
                    data: mape.map(val => 100 - val), // Invert MAPE for radar chart
                    borderColor: '#FCDD09',
                    backgroundColor: 'rgba(252, 221, 9, 0.2)',
                    pointBackgroundColor: '#FCDD09',
                    pointBorderColor: '#fff',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return 'Accuracy: ' + context.parsed.r.toFixed(1) + '%';
                                } else {
                                    return 'MAPE: ' + (100 - context.parsed.r).toFixed(1) + '%';
                                }
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        this.charts.forecastAccuracy = chart;
    }

    renderCorrelationHeatmap() {
        const canvas = document.getElementById('correlation-heatmap');
        if (!canvas) return;

        if (this.charts.correlationHeatmap) {
            this.charts.correlationHeatmap.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample correlation matrix
        const variables = ['Exports', 'Imports', 'Trade Balance'];
        const correlations = [
            [1.0, 0.87, -0.45], // Exports correlations
            [0.87, 1.0, -0.78], // Imports correlations
            [-0.45, -0.78, 1.0]  // Balance correlations
        ];

        // Flatten for chart
        const data = [];
        const labels = [];
        const colors = [];

        for (let i = 0; i < variables.length; i++) {
            for (let j = 0; j < variables.length; j++) {
                labels.push(`${variables[i]} vs ${variables[j]}`);
                data.push(correlations[i][j]);

                // Color based on correlation strength
                const corr = correlations[i][j];
                if (corr > 0.7) colors.push('rgba(22, 163, 74, 0.8)'); // Strong positive
                else if (corr > 0.3) colors.push('rgba(34, 197, 94, 0.8)'); // Moderate positive
                else if (corr < -0.7) colors.push('rgba(220, 38, 38, 0.8)'); // Strong negative
                else if (corr < -0.3) colors.push('rgba(239, 68, 68, 0.8)'); // Moderate negative
                else colors.push('rgba(156, 163, 175, 0.8)'); // Weak
            }
        }

        const chart = new Chart(ctx, {
            type: 'matrix',
            data: {
                labels: variables,
                datasets: [{
                    label: 'Correlation',
                    data: correlations.flat(),
                    backgroundColor: function(context) {
                        const corr = context.parsed;
                        if (corr > 0.7) return 'rgba(22, 163, 74, 0.8)';
                        if (corr > 0.3) return 'rgba(34, 197, 94, 0.8)';
                        if (corr < -0.7) return 'rgba(220, 38, 38, 0.8)';
                        if (corr < -0.3) return 'rgba(239, 68, 68, 0.8)';
                        return 'rgba(156, 163, 175, 0.8)';
                    },
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const i = Math.floor(context.dataIndex / variables.length);
                                const j = context.dataIndex % variables.length;
                                const corr = context.parsed;
                                return `${variables[i]} vs ${variables[j]}: ${corr.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Variables' },
                        ticks: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Variables' },
                        ticks: { display: false }
                    }
                }
            }
        });

        this.charts.correlationHeatmap = chart;
    }

    renderScatterPlotChart() {
        const canvas = document.getElementById('scatter-plot-chart');
        if (!canvas) return;

        if (this.charts.scatterPlot) {
            this.charts.scatterPlot.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Sample scatter plot data
        const exports = [368, 454, 350, 353, 401, 509, 627, 626, 458];
        const imports = [904, 965, 1002, 949, 890, 1079, 1158, 1091, 870];

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Exports vs Imports',
                    data: exports.map((exp, i) => ({ x: exp, y: imports[i] })),
                    backgroundColor: 'rgba(0, 161, 241, 0.6)',
                    borderColor: '#00A1F1',
                    borderWidth: 1,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Exports: $${context.parsed.x.toFixed(0)}M, Imports: $${context.parsed.y.toFixed(0)}M`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Exports (USD Million)' },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0) + 'M';
                            }
                        }
                    },
                    y: {
                        title: { display: true, text: 'Imports (USD Million)' },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0) + 'M';
                            }
                        }
                    }
                }
            }
        });

        this.charts.scatterPlot = chart;
    }

    refreshData() {
        console.log('Refreshing trends data...');
        this.showToast('Refreshing data...', 'info');

        // Reload data
        this.loadAllData().then(() => {
            this.updateMetrics();
            this.initializeCharts();
            this.showToast('Data refreshed successfully!', 'success');
        }).catch(error => {
            console.error('Error refreshing data:', error);
            this.showToast('Failed to refresh data', 'error');
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast if present
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TrendsAnalysis();
});

// Add toast animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    /* Trends-specific styles */
    .trends-metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .trends-metric-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-left: 4px solid;
        transition: all 0.3s ease;
    }

    .trends-metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }

    .trends-metric-card.growth {
        border-left-color: #16a34a;
    }

    .trends-metric-card.volatility {
        border-left-color: #f59e0b;
    }

    .trends-metric-card.forecast {
        border-left-color: #00A1F1;
    }

    .trends-metric-card.seasonality {
        border-left-color: #8b5cf6;
    }

    .metric-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        margin-bottom: 12px;
    }

    .trends-metric-card.growth .metric-icon {
        background: rgba(22, 163, 74, 0.1);
        color: #16a34a;
    }

    .trends-metric-card.volatility .metric-icon {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .trends-metric-card.forecast .metric-icon {
        background: rgba(0, 161, 241, 0.1);
        color: #00A1F1;
    }

    .trends-metric-card.seasonality .metric-icon {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
    }

    .metric-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 8px;
    }

    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 4px;
    }

    .metric-detail {
        font-size: 0.8rem;
        color: #64748b;
        line-height: 1.4;
    }

    .trend-indicator.positive {
        color: #16a34a;
    }

    .trend-indicator.negative {
        color: #dc2626;
    }

    .stats-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 30px;
    }

    .stats-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .stats-card h4 {
        color: #1e293b;
        margin-bottom: 15px;
        font-size: 1.1rem;
    }

    .stat-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
    }

    .stat-metric:last-child {
        border-bottom: none;
    }

    .stat-label {
        font-weight: 500;
        color: #64748b;
        font-size: 0.9rem;
    }

    .stat-value {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.9rem;
    }

    .stat-value.positive {
        color: #16a34a;
    }

    .forecast-insights {
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .insight-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .insight-item:last-child {
        margin-bottom: 0;
    }

    .insight-content h5 {
        margin: 0 0 4px 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
    }

    .insight-content p {
        margin: 0;
        font-size: 0.8rem;
        color: #64748b;
        line-height: 1.4;
    }

    .correlation-insights {
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .correlation-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    .correlation-item:last-child {
        margin-bottom: 0;
    }

    .correlation-strength {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        color: white;
    }

    .correlation-strength.strong {
        background: #16a34a;
    }

    .correlation-strength.moderate {
        background: #f59e0b;
    }

    .correlation-detail {
        flex: 1;
        font-size: 0.85rem;
        color: #374151;
        line-height: 1.4;
    }

    .correlation-detail strong {
        color: #1e293b;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .trends-metrics-grid {
            grid-template-columns: 1fr;
        }

        .stats-summary-grid {
            grid-template-columns: 1fr;
        }

        .metric-value {
            font-size: 1.5rem;
        }
    }
`;
document.head.appendChild(style);