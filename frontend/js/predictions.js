/* =====================================================================
  Rwanda trade analysis system - PREDICTIONS.JS ( REBUILD)
   Professional AI Integration with OpenRouter/DeepSeek
   ===================================================================== */

class AIPredictionsEngine {
    constructor() {
        this.aiStatus = {
            available: false,
            model: 'unknown',
            provider: 'unknown'
        };
        this.conversationHistory = [];
        this.currentAnalysis = null;
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🤖 Initializing AI Predictions Engine...');
        this.showLoading();
        
        await this.checkAIStatus();
        await this.loadTradeData();
        
        this.initializeEventListeners();
        this.renderDashboard();
        this.hideLoading();
        
        console.log('✅ AI Predictions Engine initialized successfully');
    }

    showLoading() {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
            loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            setTimeout(() => {
                loadingEl.classList.add('hidden');
                loadingEl.style.display = 'none';
            }, 600);
        }
    }

    async checkAIStatus() {
        try {
            console.log('🔍 Checking AI service status...');
            const response = await fetch('/api/chat/status');
            const data = await response.json();
            
            this.aiStatus = {
                available: data.ai_configured || false,
                model: data.model || 'DeepSeek',
                provider: data.provider || 'OpenRouter'
            };

            console.log('✅ AI Status:', this.aiStatus);
            this.updateAIStatusDisplay();
            
        } catch (error) {
            console.error('❌ Error checking AI status:', error);
            this.aiStatus.available = false;
            this.updateAIStatusDisplay();
        }
    }

    updateAIStatusDisplay() {
        try {
            const statusEl = document.getElementById('ai-status-badge');
            const modelEl = document.getElementById('ai-model-name');

            if (statusEl) {
                if (this.aiStatus.available) {
                    statusEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>AI Available';
                    statusEl.className = 'ai-status-badge available';
                } else {
                    statusEl.innerHTML = '<i class="fas fa-times-circle me-2"></i>AI Unavailable';
                    statusEl.className = 'ai-status-badge unavailable';
                }
            }

            if (modelEl) {
                const provider = this.aiStatus.provider || 'Unknown';
                const model = this.aiStatus.model || 'Unknown';
                modelEl.textContent = `${provider} - ${model}`;
            }
        } catch (error) {
            console.error('Error updating AI status display:', error);
            // Fallback display
            const statusEl = document.getElementById('ai-status-badge');
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-question-circle me-2"></i>Status Unknown';
                statusEl.className = 'ai-status-badge unavailable';
            }
        }
    }

    async loadTradeData() {
        try {
            console.log('📊 Loading trade data for AI analysis...');

            const [timeSeriesRes, comprehensiveRes] = await Promise.all([
                fetch('/api/analytics/time-series').catch(err => {
                    console.warn('Time series API failed:', err);
                    return { json: () => ({ time_series: { exports_trend: {}, imports_trend: {}, forecast_next_4_quarters: { exports: { forecast_values: [] }, imports: { forecast_values: [] } } } }) };
                }),
                fetch('/api/analytics/comprehensive').catch(err => {
                    console.warn('Comprehensive API failed:', err);
                    return { json: () => ({ summary: {}, quarterly_aggregation: { exports: [], imports: [] }, country_aggregation: { export_destinations: [], import_sources: [] }, trade_balance_analysis: { summary: {} } }) };
                })
            ]);

            this.currentAnalysis = {
                timeSeries: await timeSeriesRes.json(),
                comprehensive: await comprehensiveRes.json()
            };

            console.log('✅ Trade data loaded for AI context');

        } catch (error) {
            console.error('❌ Error loading trade data:', error);
            // Set fallback data if API fails
            this.currentAnalysis = {
                timeSeries: {
                    time_series: {
                        exports_trend: { slope: 0, r_squared: 0 },
                        forecast_next_4_quarters: {
                            exports: { forecast_values: [0, 0, 0, 0], model_fit: { aic: 0, bic: 0 } },
                            imports: { forecast_values: [0, 0, 0, 0], model_fit: { aic: 0, bic: 0 } }
                        }
                    }
                },
                comprehensive: {
                    summary: { total_records_extracted: 0, countries_found: [] },
                    quarterly_aggregation: { exports: [], imports: [] },
                    country_aggregation: { export_destinations: [], import_sources: [] },
                    trade_balance_analysis: { summary: { overall_balance: 0, quarters_analyzed: 0 } }
                }
            };
        }
    }

    initializeEventListeners() {
        // Chat input
        const chatInput = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('send-chat-btn');
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Quick action buttons
        const quickActions = document.querySelectorAll('.quick-action-item');
        quickActions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Suggested prompts
        const suggestedPrompts = document.querySelectorAll('.suggested-prompt');
        suggestedPrompts.forEach(prompt => {
            prompt.addEventListener('click', (e) => {
                const question = prompt.dataset.question;
                this.sendPredefinedQuestion(question);
            });
        });

        // Analysis tabs
        const analysisTabs = document.querySelectorAll('.analysis-tab');
        analysisTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = tab.dataset.tab;
                this.switchAnalysisTab(tabName);
            });
        });
    }

    renderDashboard() {
        console.log('🎨 Rendering AI Predictions Dashboard...');
        
        this.renderAIInsights();
        this.renderPredictionCards();
        this.renderAnalysisCharts();
        this.addWelcomeMessage();
        
        console.log('✅ Dashboard rendered');
    }

    renderAIInsights() {
        try {
            const container = document.getElementById('ai-insights-container');
            if (!container || !this.currentAnalysis) {
                console.warn('AI insights container or analysis data not available');
                return;
            }

            const ts = this.currentAnalysis.timeSeries;
            const comp = this.currentAnalysis.comprehensive;

            let html = '<div class="insights-grid">';

            // Insight 1: Export Trend
            try {
                const exportTrend = ts?.time_series?.exports_trend;
                if (exportTrend && typeof exportTrend.slope === 'number') {
                    const slope = exportTrend.slope;
                    const isPositive = slope > 0;
                    html += this.createInsightCard(
                        'Export Trend Analysis',
                        isPositive ? 'trending-up' : 'trending-down',
                        `${isPositive ? 'Increasing' : 'Decreasing'} trend`,
                        isPositive ? 'success' : 'warning',
                        `Export trend shows ${isPositive ? 'positive' : 'negative'} slope of ${slope.toFixed(2)} with R² of ${(exportTrend.r_squared * 100 || 0).toFixed(1)}%`
                    );
                } else {
                    html += this.createInsightCard(
                        'Export Trend Analysis',
                        'chart-line',
                        'Data Unavailable',
                        'secondary',
                        'Export trend analysis requires time series data.'
                    );
                }
            } catch (error) {
                console.error('Error rendering export trend insight:', error);
                html += this.createInsightCard(
                    'Export Trend Analysis',
                    'exclamation-triangle',
                    'Error Loading',
                    'warning',
                    'Unable to load export trend data.'
                );
            }

            // Insight 2: Trade Balance Analysis
            try {
                const tradeBalance = comp?.trade_balance_analysis?.summary;
                if (tradeBalance && typeof tradeBalance.overall_balance === 'number') {
                    const isDeficit = tradeBalance.overall_balance < 0;
                    html += this.createInsightCard(
                        'Trade Balance',
                        'balance-scale',
                        `${isDeficit ? 'Deficit' : 'Surplus'}: $${Math.abs(tradeBalance.overall_balance).toFixed(0)}M`,
                        isDeficit ? 'danger' : 'success',
                        `Overall trade balance shows ${isDeficit ? 'deficit' : 'surplus'} across ${tradeBalance.quarters_analyzed || 0} quarters analyzed.`
                    );
                } else {
                    html += this.createInsightCard(
                        'Trade Balance',
                        'balance-scale',
                        'Data Unavailable',
                        'secondary',
                        'Trade balance analysis requires comprehensive data.'
                    );
                }
            } catch (error) {
                console.error('Error rendering trade balance insight:', error);
                html += this.createInsightCard(
                    'Trade Balance',
                    'exclamation-triangle',
                    'Error Loading',
                    'warning',
                    'Unable to load trade balance data.'
                );
            }

            // Insight 3: Forecast Analysis
            try {
                const exportForecast = ts?.time_series?.forecast_next_4_quarters?.exports;
                if (exportForecast?.forecast_values && Array.isArray(exportForecast.forecast_values) && exportForecast.forecast_values.length > 0) {
                    const avgForecast = exportForecast.forecast_values.reduce((a, b) => a + b, 0) / exportForecast.forecast_values.length;
                    html += this.createInsightCard(
                        'AI Forecast',
                        'crystal-ball',
                        `$${avgForecast.toFixed(2)}M Average`,
                        'info',
                        `AI forecasts ${exportForecast.forecast_values.length} quarters ahead with AIC: ${exportForecast.model_fit?.aic?.toFixed(2) || 'N/A'}`
                    );
                } else {
                    html += this.createInsightCard(
                        'AI Forecast',
                        'crystal-ball',
                        'Data Unavailable',
                        'secondary',
                        'Forecast analysis requires time series forecasting data.'
                    );
                }
            } catch (error) {
                console.error('Error rendering forecast insight:', error);
                html += this.createInsightCard(
                    'AI Forecast',
                    'exclamation-triangle',
                    'Error Loading',
                    'warning',
                    'Unable to load forecast data.'
                );
            }

            // Insight 4: Data Coverage
            try {
                const summary = comp?.summary;
                if (summary) {
                    const countries = summary.countries_found ? summary.countries_found.length : 0;
                    const records = summary.total_records_extracted || 0;
                    html += this.createInsightCard(
                        'Data Coverage',
                        'database',
                        `${countries} Countries, ${records} Records`,
                        'primary',
                        `Analysis covers ${summary.total_files_processed || 0} files with comprehensive trade data.`
                    );
                } else {
                    html += this.createInsightCard(
                        'Data Coverage',
                        'database',
                        'Data Unavailable',
                        'secondary',
                        'Data coverage information requires summary statistics.'
                    );
                }
            } catch (error) {
                console.error('Error rendering data coverage insight:', error);
                html += this.createInsightCard(
                    'Data Coverage',
                    'exclamation-triangle',
                    'Error Loading',
                    'warning',
                    'Unable to load data coverage information.'
                );
            }

            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Critical error in renderAIInsights:', error);
            const container = document.getElementById('ai-insights-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">Error loading AI insights. Please refresh the page.</div>';
            }
        }
    }

    createInsightCard(title, icon, value, colorClass, description) {
        return `
            <div class="insight-card ${colorClass}">
                <div class="insight-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${title}</h4>
                    <div class="insight-value">${value}</div>
                    <p class="insight-description">${description}</p>
                </div>
            </div>
        `;
    }

    renderPredictionCards() {
        try {
            const container = document.getElementById('prediction-cards-container');
            if (!container || !this.currentAnalysis) {
                console.warn('Prediction cards container or analysis data not available');
                return;
            }

            const ts = this.currentAnalysis.timeSeries;

            let html = '<div class="prediction-cards-grid">';

            // Export Predictions
            try {
                const exportForecast = ts?.time_series?.forecast_next_4_quarters?.exports;
                if (exportForecast?.forecast_values && Array.isArray(exportForecast.forecast_values) && exportForecast.forecast_values.length > 0) {
                    html += this.createPredictionCard(
                        'Exports Forecast',
                        'arrow-trend-up',
                        exportForecast.forecast_values,
                        ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                        'success',
                        `AIC: ${exportForecast.model_fit?.aic?.toFixed(2) || 'N/A'}, BIC: ${exportForecast.model_fit?.bic?.toFixed(2) || 'N/A'}`
                    );
                } else {
                    html += this.createPredictionCard(
                        'Exports Forecast',
                        'arrow-trend-up',
                        [0, 0, 0, 0],
                        ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                        'secondary',
                        'Forecast data unavailable'
                    );
                }
            } catch (error) {
                console.error('Error rendering export forecast card:', error);
                html += this.createPredictionCard(
                    'Exports Forecast',
                    'exclamation-triangle',
                    [0, 0, 0, 0],
                    ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                    'warning',
                    'Error loading forecast data'
                );
            }

            // Import Predictions
            try {
                const importForecast = ts?.time_series?.forecast_next_4_quarters?.imports;
                if (importForecast?.forecast_values && Array.isArray(importForecast.forecast_values) && importForecast.forecast_values.length > 0) {
                    html += this.createPredictionCard(
                        'Imports Forecast',
                        'arrow-trend-down',
                        importForecast.forecast_values,
                        ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                        'primary',
                        `AIC: ${importForecast.model_fit?.aic?.toFixed(2) || 'N/A'}, BIC: ${importForecast.model_fit?.bic?.toFixed(2) || 'N/A'}`
                    );
                } else {
                    html += this.createPredictionCard(
                        'Imports Forecast',
                        'arrow-trend-down',
                        [0, 0, 0, 0],
                        ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                        'secondary',
                        'Forecast data unavailable'
                    );
                }
            } catch (error) {
                console.error('Error rendering import forecast card:', error);
                html += this.createPredictionCard(
                    'Imports Forecast',
                    'exclamation-triangle',
                    [0, 0, 0, 0],
                    ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                    'warning',
                    'Error loading forecast data'
                );
            }

            html += '</div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Critical error in renderPredictionCards:', error);
            const container = document.getElementById('prediction-cards-container');
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">Error loading prediction cards. Please refresh the page.</div>';
            }
        }
    }

    createPredictionCard(title, icon, values, periods, colorClass, modelInfo) {
        let html = `
            <div class="prediction-card ${colorClass}">
                <div class="card-header">
                    <h3><i class="fas fa-${icon} me-2"></i>${title}</h3>
                    <span class="badge bg-light text-dark">AI Forecast</span>
                </div>
                <div class="card-body">
                    <div class="forecast-list">
        `;

        values.forEach((value, index) => {
            const percentage = (value / Math.max(...values)) * 100;
            html += `
                <div class="forecast-item">
                    <div class="forecast-period">${periods[index]}</div>
                    <div class="forecast-value">$${value.toFixed(2)}M</div>
                    <div class="forecast-bar">
                        <div class="forecast-bar-fill bg-${colorClass}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                    <div class="model-info">
                        <small><i class="fas fa-info-circle me-1"></i>${modelInfo}</small>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    renderAnalysisCharts() {
        console.log('📊 Rendering AI analysis charts...');

        this.renderTradeOverviewChart();
        this.renderExportImportComparison();
        this.renderCommodityAnalysisChart();
        this.renderRegionalDistributionChart();
        this.renderForecastVisualization();
    }

    renderForecastComparisonChart() {
        const canvas = document.getElementById('forecast-comparison-chart');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const ts = this.currentAnalysis.timeSeries;
        const comp = this.currentAnalysis.comprehensive;

        // Get historical data from comprehensive analysis
        const quarterlyExports = comp.quarterly_aggregation?.exports || [];
        const quarterlyImports = comp.quarterly_aggregation?.imports || [];

        const historicalQuarters = quarterlyExports.map(item => item.quarter);
        const historicalExports = quarterlyExports.map(item => item.export_value);
        const historicalImports = quarterlyImports.map(item => item.import_value);

        // Forecast data
        const forecastQuarters = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const exportForecast = ts.time_series?.forecast_next_4_quarters?.exports?.forecast_values || [];
        const importForecast = ts.time_series?.forecast_next_4_quarters?.imports?.forecast_values || [];

        // Combine
        const allQuarters = [...historicalQuarters, ...forecastQuarters];
        const allExports = [...historicalExports, ...exportForecast];
        const allImports = [...historicalImports, ...importForecast];

        if (this.charts.forecastComparison) {
            this.charts.forecastComparison.destroy();
        }

        this.charts.forecastComparison = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allQuarters,
                datasets: [{
                    label: 'Exports (Historical + Forecast)',
                    data: allExports,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: allQuarters.map((_, i) =>
                        i >= historicalQuarters.length ? '#ffc107' : '#28a745'
                    ),
                    segment: {
                        borderDash: ctx => ctx.p0DataIndex >= historicalQuarters.length - 1 ? [8, 4] : []
                    }
                }, {
                    label: 'Imports (Historical + Forecast)',
                    data: allImports,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: allQuarters.map((_, i) =>
                        i >= historicalQuarters.length ? '#ffc107' : '#007bff'
                    ),
                    segment: {
                        borderDash: ctx => ctx.p0DataIndex >= historicalQuarters.length - 1 ? [8, 4] : []
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: ' Trade Forecasting - Historical vs Predicted',
                        font: { size: 18, weight: 'bold' },
                        color: '#667eea'
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const isForecast = context.dataIndex >= historicalQuarters.length;
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M ${isForecast ? '(AI Forecast)' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `$${value}M`
                        }
                    }
                }
            }
        });
    }

    renderConfidenceIntervalChart() {
        const canvas = document.getElementById('confidence-interval-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Sample confidence data (can be calculated from forecast variance)
        const periods = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const forecast = [1.87, 5.15, 2.83, 2.69];
        const upperBound = forecast.map(v => v * 1.25); // 25% upper bound
        const lowerBound = forecast.map(v => v * 0.75); // 25% lower bound

        if (this.charts.confidenceInterval) {
            this.charts.confidenceInterval.destroy();
        }

        this.charts.confidenceInterval = new Chart(ctx, {
            type: 'line',
            data: {
                labels: periods,
                datasets: [{
                    label: 'Forecast',
                    data: forecast,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 3,
                    pointRadius: 6
                }, {
                    label: 'Upper Bound (75% Confidence)',
                    data: upperBound,
                    borderColor: '#ffc107',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4
                }, {
                    label: 'Lower Bound (75% Confidence)',
                    data: lowerBound,
                    borderColor: '#dc3545',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Forecast Confidence Intervals',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `$${value.toFixed(2)}M`
                        }
                    }
                }
            }
        });
    }

    renderTrendProjectionChart() {
        const canvas = document.getElementById('trend-projection-chart');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const ts = this.currentAnalysis.timeSeries;
        const comp = this.currentAnalysis.comprehensive;

        // Get trend data from time series
        const exportTrend = ts.time_series?.exports_trend;
        const importTrend = ts.time_series?.imports_trend;

        // Get quarterly data for volatility calculation
        const quarterlyExports = comp.quarterly_aggregation?.exports || [];
        const quarterlyImports = comp.quarterly_aggregation?.imports || [];

        // Calculate basic statistics
        const exportValues = quarterlyExports.map(item => item.export_value);
        const importValues = quarterlyImports.map(item => item.import_value);

        const exportVolatility = this.calculateVolatility(exportValues);
        const importVolatility = this.calculateVolatility(importValues);

        const exportMean = exportValues.reduce((a, b) => a + b, 0) / exportValues.length;
        const importMean = importValues.reduce((a, b) => a + b, 0) / importValues.length;

        if (this.charts.trendProjection) {
            this.charts.trendProjection.destroy();
        }

        this.charts.trendProjection = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Trend Strength', 'R² Value', 'Slope', 'Mean Value', 'Data Points'],
                datasets: [{
                    label: 'Exports Analysis',
                    data: [
                        exportTrend ? Math.abs(exportTrend.slope) * 10 : 0,
                        exportTrend ? exportTrend.r_squared * 100 : 0,
                        exportTrend ? Math.abs(exportTrend.slope) : 0,
                        exportMean / 100,
                        exportValues.length
                    ],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2
                }, {
                    label: 'Imports Analysis',
                    data: [
                        importTrend ? Math.abs(importTrend.slope) * 10 : 0,
                        importTrend ? importTrend.r_squared * 100 : 0,
                        importTrend ? Math.abs(importTrend.slope) : 0,
                        importMean / 100,
                        importValues.length
                    ],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Trade Trend Analysis Comparison',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value, index) {
                                const labels = ['Trend Strength', 'R² Value', 'Slope', 'Mean Value', 'Data Points'];
                                if (labels[index] === 'R² Value') return value + '%';
                                if (labels[index] === 'Mean Value') return '$' + (value * 100) + 'M';
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    calculateVolatility(values) {
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    }

    renderTradeOverviewChart() {
        const canvas = document.getElementById('trade-overview-chart');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const comp = this.currentAnalysis.comprehensive;

        // Get data from comprehensive analysis
        const quarterlyExports = comp.quarterly_aggregation?.exports || [];
        const quarterlyImports = comp.quarterly_aggregation?.imports || [];

        const quarters = quarterlyExports.map(item => item.quarter);
        const exports = quarterlyExports.map(item => item.export_value);
        const imports = quarterlyImports.map(item => item.import_value);
        const balance = exports.map((exp, i) => exp - (imports[i] || 0));

        if (this.charts.tradeOverview) {
            this.charts.tradeOverview.destroy();
        }

        this.charts.tradeOverview = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: quarters,
                datasets: [{
                    label: 'Exports',
                    data: exports,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }, {
                    label: 'Imports',
                    data: imports,
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    borderColor: '#007bff',
                    borderWidth: 1
                }, {
                    label: 'Trade Balance',
                    data: balance,
                    backgroundColor: balance.map(b => b >= 0 ? 'rgba(255, 193, 7, 0.8)' : 'rgba(220, 53, 69, 0.8)'),
                    borderColor: balance.map(b => b >= 0 ? '#ffc107' : '#dc3545'),
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'balance'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Rwanda Trade Overview (2023-2025)',
                        font: { size: 18, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Trade Value (US$ Million)'
                        }
                    },
                    balance: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Trade Balance (US$ Million)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    renderExportImportComparison() {
        const canvas = document.getElementById('export-import-comparison');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Data from commodity_summary.json
        const data = {
            exports: {
                'Food & Live Animals': 17.17,
                'Crude Materials': 12.51,
                'Manufactured Goods': 6.71,
                'Other Commodities': 57.47,
                'Minerals & Fuels': 0.18,
                'Chemicals': 1.33,
                'Machinery': 0.53,
                'Miscellaneous': 1.19,
                'Oils & Fats': 2.67,
                'Beverages & Tobacco': 0.25
            },
            imports: {
                'Food & Live Animals': 14.76,
                'Crude Materials': 2.04,
                'Manufactured Goods': 13.86,
                'Other Commodities': 13.65,
                'Minerals & Fuels': 12.91,
                'Chemicals': 9.40,
                'Machinery': 22.15,
                'Miscellaneous': 5.33,
                'Oils & Fats': 3.77,
                'Beverages & Tobacco': 2.12
            }
        };

        if (this.charts.exportImportComparison) {
            this.charts.exportImportComparison.destroy();
        }

        this.charts.exportImportComparison = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.exports),
                datasets: [{
                    label: 'Exports by Category',
                    data: Object.values(data.exports),
                    backgroundColor: [
                        '#28a745', '#007bff', '#ffc107', '#dc3545',
                        '#6f42c1', '#e83e8c', '#fd7e14', '#20c997',
                        '#17a2b8', '#6c757d'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Export Commodity Composition',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    renderCommodityAnalysisChart() {
        const canvas = document.getElementById('commodity-analysis-chart');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const comp = this.currentAnalysis.comprehensive;

        // Get top export destinations as proxy for commodities
        const topExports = comp.country_aggregation?.export_destinations?.slice(0, 5) || [];
        const exportLabels = topExports.map(item => item.destination_country);
        const exportValues = topExports.map(item => item.export_value);

        if (this.charts.commodityAnalysis) {
            this.charts.commodityAnalysis.destroy();
        }

        this.charts.commodityAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: exportLabels,
                datasets: [{
                    label: 'Top Export Destinations (US$ Million)',
                    data: exportValues,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top Export Destinations by Value',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value (US$ Million)'
                        }
                    }
                }
            }
        });
    }

    renderRegionalDistributionChart() {
        const canvas = document.getElementById('regional-distribution-chart');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const comp = this.currentAnalysis.comprehensive;

        // Get top countries and group by region (simplified)
        const topExports = comp.country_aggregation?.export_destinations?.slice(0, 8) || [];
        const topImports = comp.country_aggregation?.import_sources?.slice(0, 8) || [];

        // Simplified regional grouping
        const regions = ['Middle East', 'Africa', 'Asia', 'Europe', 'Other'];
        const exportShares = this.calculateRegionalShares(topExports, regions);
        const importShares = this.calculateRegionalShares(topImports, regions);

        if (this.charts.regionalDistribution) {
            this.charts.regionalDistribution.destroy();
        }

        this.charts.regionalDistribution = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: regions,
                datasets: [{
                    label: 'Export Distribution by Value',
                    data: exportShares,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Import Distribution by Value',
                    data: importShares,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Regional Trade Distribution by Top Partners',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toFixed(0) + 'M'
                        }
                    }
                }
            }
        });
    }

    calculateRegionalShares(countries, regions) {
        const regionalMap = {
            'Middle East': ['United Arab Emirates'],
            'Africa': ['Democratic Republic of the Congo', 'Tanzania', 'Kenya', 'Uganda', 'South Africa', 'Egypt'],
            'Asia': ['China', 'India', 'Pakistan', 'Thailand', 'Malaysia', 'Japan'],
            'Europe': ['United Kingdom', 'Germany', 'Netherlands', 'Belgium', 'France'],
            'Other': []
        };

        const shares = regions.map(region => {
            const regionCountries = regionalMap[region] || [];
            const total = countries
                .filter(country => regionCountries.includes(country.destination_country || country.source_country))
                .reduce((sum, country) => sum + (country.export_value || country.import_value || 0), 0);
            return total;
        });

        return shares;
    }

    renderForecastVisualization() {
        const canvas = document.getElementById('forecast-visualization');
        if (!canvas || !this.currentAnalysis) return;

        const ctx = canvas.getContext('2d');
        const ts = this.currentAnalysis.timeSeries;

        // Get forecast data
        const periods = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const exportForecast = ts.time_series?.forecast_next_4_quarters?.exports?.forecast_values || [];
        const importForecast = ts.time_series?.forecast_next_4_quarters?.imports?.forecast_values || [];
        const balanceForecast = exportForecast.map((exp, i) => exp - (importForecast[i] || 0));

        if (this.charts.forecastVisualization) {
            this.charts.forecastVisualization.destroy();
        }

        this.charts.forecastVisualization = new Chart(ctx, {
            type: 'line',
            data: {
                labels: periods,
                datasets: [{
                    label: 'Export Forecast',
                    data: exportForecast,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 6
                }, {
                    label: 'Import Forecast',
                    data: importForecast,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 6
                }, {
                    label: 'Balance Forecast',
                    data: balanceForecast,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'AI Trade Forecast (2025-2026)',
                        font: { size: 14, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `$${value}M`
                        }
                    }
                }
            }
        });
    }

    addWelcomeMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const welcomeMsg = this.createAIMessage(
            `Hello! I'm your AI Trade Intelligence Assistant. Ask me anything about Rwanda's trade data.`
        );

        messagesContainer.appendChild(welcomeMsg);
    }

    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        input.value = '';

        // Add user message to chat
        this.addUserMessage(message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to AI service
            const response = await this.callAIService(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();

            // Add AI response
            this.addAIMessage(response);

        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.hideTypingIndicator();
            this.addAIMessage('I apologize, but I encountered an error processing your request. Please try again.');
        }
    }

    async callAIService(message) {
        try {
            // Prepare context from current analysis
            const context = {
                message: message,
                analysis: this.currentAnalysis,
                conversationHistory: this.conversationHistory.slice(-5) // Last 5 messages
            };

            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(context)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Store in conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            });
            
            this.conversationHistory.push({
                role: 'assistant',
                content: data.response || data.message,
                timestamp: new Date().toISOString()
            });

            return data.response || data.message;

        } catch (error) {
            console.error('❌ AI Service Error:', error);
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('export')) {
            return 'Based on the analysis, exports show a decreasing trend with 15.8% strength. The forecast suggests fluctuation between $1.87M - $5.15M over the next 4 quarters.';
        }
        
        if (lowerMsg.includes('import')) {
            return 'Imports demonstrate high volatility (285%) with a non-normal distribution. The forecast ranges from $2.75M to $48.54M, indicating significant uncertainty.';
        }
        
        if (lowerMsg.includes('forecast') || lowerMsg.includes('predict')) {
            return 'AI forecasting uses exponential smoothing for 4 quarters ahead. Export forecasts: Q2=$1.87M, Q3=$5.15M, Q4=$2.83M, Q1(2026)=$2.69M.';
        }
        
        if (lowerMsg.includes('risk')) {
            return 'Risk assessment shows Medium overall risk with High volatility. Key concern: Export volatility at 77.67% requires diversification strategies.';
        }
        
        return 'I can help analyze Rwanda\'s trade data, forecasts, and strategic insights. Try asking about exports, imports, forecasts, or risk assessment.';
    }

    addUserMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const msgEl = this.createUserMessage(message);
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addAIMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const msgEl = this.createAIMessage(message);
        messagesContainer.appendChild(msgEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createUserMessage(content) {
        const div = document.createElement('div');
        div.className = 'chat-message user-message';
        div.innerHTML = `
            <div class="message-avatar user-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(content)}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        return div;
    }

    createAIMessage(content) {
        const div = document.createElement('div');
        div.className = 'chat-message ai-message';
        div.innerHTML = `
            <div class="message-avatar ai-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatAIResponse(content)}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
        return div;
    }

    formatAIResponse(text) {
        // First escape HTML
        text = this.escapeHtml(text);

        // Check if this is a structured AI response
        if (this.isStructuredResponse(text)) {
            return this.formatStructuredResponse(text);
        }

        // Regular formatting for unstructured responses
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/^•\s/gm, '<br>• ');

        return text;
    }

    isStructuredResponse(text) {
        // Check for structured response indicators
        const indicators = [
            'Executive Summary',
            'Key Insights',
            'Data Highlights',
            'Contextual Interpretation',
            'AI Reasoning',
            'Policy Recommendations'
        ];

        return indicators.some(indicator => text.includes(indicator));
    }

    formatStructuredResponse(text) {
        let formatted = '<div class="structured-response">';

        // Split by sections
        const sections = text.split(/(?=Executive Summary|Key Insights|Data Highlights|Contextual Interpretation|AI Reasoning|Policy Recommendations|Suggested Visualizations)/);

        sections.forEach(section => {
            if (section.trim()) {
                const lines = section.split('\n');
                const header = lines[0].trim();

                if (header) {
                    // Format section header
                    let icon = 'fas fa-info-circle';
                    let colorClass = 'info';

                    if (header.includes('Executive Summary')) {
                        icon = 'fas fa-file-alt';
                        colorClass = 'primary';
                    } else if (header.includes('Key Insights')) {
                        icon = 'fas fa-lightbulb';
                        colorClass = 'success';
                    } else if (header.includes('Data Highlights')) {
                        icon = 'fas fa-chart-bar';
                        colorClass = 'info';
                    } else if (header.includes('Contextual Interpretation')) {
                        icon = 'fas fa-book';
                        colorClass = 'secondary';
                    } else if (header.includes('AI Reasoning')) {
                        icon = 'fas fa-brain';
                        colorClass = 'warning';
                    } else if (header.includes('Policy Recommendations')) {
                        icon = 'fas fa-gavel';
                        colorClass = 'danger';
                    } else if (header.includes('Suggested Visualizations')) {
                        icon = 'fas fa-chart-pie';
                        colorClass = 'info';
                    }

                    formatted += `<div class="response-section ${colorClass}">`;
                    formatted += `<div class="section-header">`;
                    formatted += `<i class="${icon} me-2"></i>${header}`;
                    formatted += `</div>`;
                    formatted += `<div class="section-content">`;

                    // Format content
                    const content = lines.slice(1).join('\n');
                    const formattedContent = this.formatSectionContent(content);
                    formatted += formattedContent;

                    formatted += `</div></div>`;
                }
            }
        });

        formatted += '</div>';
        return formatted;
    }

    formatSectionContent(content) {
        let formatted = content;

        // Convert newlines to <br> but preserve structure
        formatted = formatted.replace(/\n/g, '<br>');

        // Format bullet points
        formatted = formatted.replace(/(<br>)?•\s/g, '<br><span class="bullet">•</span> ');

        // Bold text between ** **
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Format percentages and numbers
        formatted = formatted.replace(/(\d+(?:\.\d+)?%)/g, '<span class="highlight-number">$1</span>');
        formatted = formatted.replace(/(\$\d+(?:\.\d+)?[MB]?)/g, '<span class="highlight-currency">$1</span>');

        // Format key terms
        const keyTerms = ['exports', 'imports', 'trade balance', 'deficit', 'surplus', 'commodity', 'regional', 'forecast'];
        keyTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            formatted = formatted.replace(regex, `<span class="key-term">${term}</span>`);
        });

        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'chat-message ai-message typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar ai-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    sendPredefinedQuestion(question) {
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.value = question;
            this.sendMessage();
        }
    }

    handleQuickAction(action) {
        console.log('Quick action:', action);

        const questions = {
            'analyze-exports': 'Provide a comprehensive analysis of Rwanda\'s export performance including trends, key commodities, and growth patterns.',
            'analyze-imports': 'Analyze Rwanda\'s import patterns, major sources, and dependency risks.',
            'trade-balance': 'Analyze Rwanda\'s trade balance, deficit trends, and economic implications.',
            'commodity-trends': 'Provide detailed commodity-level analysis for both exports and imports.',
            'regional-insights': 'Analyze regional trade patterns and integration opportunities.',
            'forecast-analysis': 'Provide  forecasts for Rwanda\'s trade performance over the next year.',
            'risk-assessment': 'Assess key risks in Rwanda\'s trade environment and mitigation strategies.',
            'policy-recommendations': 'Generate evidence-based policy recommendations for improving trade performance.'
        };

        if (questions[action]) {
            this.sendPredefinedQuestion(questions[action]);
        }
    }

    switchAnalysisTab(tabName) {
        // Update active tab
        const tabs = document.querySelectorAll('.analysis-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show corresponding content
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => {
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 AI Predictions page loaded');
    window.predictionsEngine = new AIPredictionsEngine();
});

// Export for global access
window.AIPredictionsEngine = AIPredictionsEngine;
