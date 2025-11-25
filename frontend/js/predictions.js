/* =====================================================================
  Rwanda trade analysis system - PREDICTIONS.JS (AI-POWERED REBUILD)
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
                available: data.ai_available || false,
                model: data.model_name || 'DeepSeek',
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
        const statusEl = document.getElementById('ai-status-badge');
        const modelEl = document.getElementById('ai-model-name');
        
        if (statusEl) {
            if (this.aiStatus.available) {
                statusEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>AI Available';
                statusEl.className = 'ai-status-badge available';
            } else {
                statusEl.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>AI Unavailable';
                statusEl.className = 'ai-status-badge unavailable';
            }
        }
        
        if (modelEl) {
            modelEl.textContent = `${this.aiStatus.provider} - ${this.aiStatus.model}`;
        }
    }

    async loadTradeData() {
        try {
            console.log('📊 Loading trade data for AI analysis...');
            
            const [timeSeriesRes, comprehensiveRes] = await Promise.all([
                fetch('/data/processed/enhanced_time_series_analysis_20251009_181029.json'),
                fetch('/data/processed/comprehensive_trade_analysis_20251009_181031.json')
            ]);

            this.currentAnalysis = {
                timeSeries: await timeSeriesRes.json(),
                comprehensive: await comprehensiveRes.json()
            };

            console.log('✅ Trade data loaded for AI context');
            
        } catch (error) {
            console.error('❌ Error loading trade data:', error);
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
        const quickActions = document.querySelectorAll('.quick-action-btn');
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
        const container = document.getElementById('ai-insights-container');
        if (!container || !this.currentAnalysis) return;

        const ts = this.currentAnalysis.timeSeries;
        const comp = this.currentAnalysis.comprehensive;

        let html = '<div class="insights-grid">';

        // Insight 1: Export Trend
        const exportTrend = ts.exports_analysis?.statistical_analysis?.trend_analysis;
        if (exportTrend) {
            html += this.createInsightCard(
                'Export Trend Analysis',
                'trending-up',
                `Exports are ${exportTrend.trend_direction} with ${(exportTrend.trend_strength * 100).toFixed(1)}% strength`,
                exportTrend.significant === 'True' ? 'success' : 'warning',
                'AI detected a ' + exportTrend.trend_direction + ' pattern in export performance.'
            );
        }

        // Insight 2: Risk Assessment
        const riskAssessment = comp.key_insights?.risk_assessment;
        if (riskAssessment) {
            html += this.createInsightCard(
                'Risk Assessment',
                'shield-alt',
                `${riskAssessment.overall_risk_level} Risk Level`,
                riskAssessment.overall_risk_level === 'High' ? 'danger' : 'warning',
                riskAssessment.risk_factors[0] || 'Analyzing risk factors...'
            );
        }

        // Insight 3: Forecast Confidence
        const exportForecast = ts.exports_analysis?.forecasts?.exponential_smoothing;
        if (exportForecast) {
            const avgForecast = exportForecast.forecast_values.reduce((a, b) => a + b, 0) / 
                               exportForecast.forecast_values.length;
            html += this.createInsightCard(
                'Forecast Prediction',
                'crystal-ball',
                `$${avgForecast.toFixed(2)}M Average`,
                'info',
                `AI forecasts ${exportForecast.forecast_values.length} quarters ahead with exponential smoothing.`
            );
        }

        // Insight 4: Recommendations
        const recommendations = comp.recommendations || [];
        if (recommendations.length > 0) {
            const highPriority = recommendations.filter(r => r.priority === 'high').length;
            html += this.createInsightCard(
                'AI Recommendations',
                'lightbulb',
                `${recommendations.length} Strategic Insights`,
                'primary',
                `${highPriority} high-priority recommendations identified.`
            );
        }

        html += '</div>';
        container.innerHTML = html;
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
        const container = document.getElementById('prediction-cards-container');
        if (!container || !this.currentAnalysis) return;

        const ts = this.currentAnalysis.timeSeries;
        
        let html = '<div class="prediction-cards-grid">';

        // Export Predictions
        const exportForecast = ts.exports_analysis?.forecasts?.exponential_smoothing;
        if (exportForecast) {
            html += this.createPredictionCard(
                'Exports Forecast',
                'arrow-trend-up',
                exportForecast.forecast_values,
                ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                'success',
                `AIC: ${exportForecast.model_fit.aic.toFixed(2)}, BIC: ${exportForecast.model_fit.bic.toFixed(2)}`
            );
        }

        // Import Predictions
        const importForecast = ts.imports_analysis?.forecasts?.exponential_smoothing;
        if (importForecast) {
            html += this.createPredictionCard(
                'Imports Forecast',
                'arrow-trend-down',
                importForecast.forecast_values,
                ['2025Q2', '2025Q3', '2025Q4', '2026Q1'],
                'primary',
                `AIC: ${importForecast.model_fit.aic.toFixed(2)}, BIC: ${importForecast.model_fit.bic.toFixed(2)}`
            );
        }

        html += '</div>';
        container.innerHTML = html;
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

        // Historical data
        const historicalQuarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const historicalExports = [402.14, 484.74, 388.11, 399.11, 431.61, 537.64, 667.00, 677.45, 480.82];
        const historicalImports = [1476.51, 1571.09, 1581.81, 1486.93, 1410.52, 1568.97, 1751.57, 1629.39, 1379.05];

        // Forecast data
        const forecastQuarters = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const exportForecast = ts.exports_analysis?.forecasts?.exponential_smoothing?.forecast_values || [];
        const importForecast = ts.imports_analysis?.forecasts?.exponential_smoothing?.forecast_values || [];

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
                        text: 'AI-Powered Trade Forecasting - Historical vs Predicted',
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

        // Volatility comparison
        const exportVol = ts.exports_analysis?.statistical_analysis?.volatility_analysis;
        const importVol = ts.imports_analysis?.statistical_analysis?.volatility_analysis;

        if (this.charts.trendProjection) {
            this.charts.trendProjection.destroy();
        }

        this.charts.trendProjection = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Volatility', 'Mean Return', 'Max Return', 'Min Return (abs)', 'Positive Periods'],
                datasets: [{
                    label: 'Exports Risk Profile',
                    data: [
                        exportVol.volatility / 10,
                        exportVol.mean_return,
                        exportVol.max_return / 10,
                        Math.abs(exportVol.min_return),
                        exportVol.positive_returns * 10
                    ],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2
                }, {
                    label: 'Imports Risk Profile',
                    data: [
                        importVol.volatility / 10,
                        importVol.mean_return / 10,
                        importVol.max_return / 50,
                        Math.abs(importVol.min_return),
                        importVol.positive_returns * 10
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
                        text: 'Risk & Return Profile Comparison',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderTradeOverviewChart() {
        const canvas = document.getElementById('trade-overview-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Sample data - in real implementation, this would come from processed data
        const quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        const exports = [402.14, 484.74, 388.11, 399.11, 431.61, 537.64, 667.00, 677.45, 480.82];
        const imports = [1476.51, 1571.09, 1581.81, 1486.93, 1410.52, 1568.97, 1751.57, 1629.39, 1379.05];
        const balance = exports.map((exp, i) => exp - imports[i]);

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
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Top 5 export and import commodities
        const exportCommodities = ['Other Commodities', 'Food & Animals', 'Crude Materials', 'Manufactured Goods', 'Oils & Fats'];
        const exportValues = [438.15, 103.12, 58.76, 34.87, 23.40];
        const importCommodities = ['Machinery', 'Other Commodities', 'Food & Animals', 'Manufactured Goods', 'Minerals & Fuels'];
        const importValues = [238.86, 396.16, 234.57, 215.13, 190.53];

        if (this.charts.commodityAnalysis) {
            this.charts.commodityAnalysis.destroy();
        }

        this.charts.commodityAnalysis = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: exportCommodities,
                datasets: [{
                    label: 'Top Export Commodities (US$ Million)',
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
                        text: 'Top Export Commodities Q1 2025',
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
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Regional distribution data
        const regions = ['Africa', 'Europe', 'Asia', 'Americas', 'Oceania'];
        const exportShares = [75.5, 11.15, 67.52, 0.65, 0.09];
        const importShares = [34.65, 11.66, 51.10, 2.12, 0.47];

        if (this.charts.regionalDistribution) {
            this.charts.regionalDistribution.destroy();
        }

        this.charts.regionalDistribution = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: regions,
                datasets: [{
                    label: 'Export Regional Distribution (%)',
                    data: exportShares,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Import Regional Distribution (%)',
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
                        text: 'Regional Trade Distribution',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    }

    renderForecastVisualization() {
        const canvas = document.getElementById('forecast-visualization');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Forecast data
        const periods = ['2025Q2', '2025Q3', '2025Q4', '2026Q1'];
        const exportForecast = [2.41, 2.41, 2.41, 2.41];
        const importForecast = [27.22, 27.22, 27.22, 27.22];
        const balanceForecast = [-24.81, -24.81, -24.81, -24.81];

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
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}M`;
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
            `🇷🇼 **Rwanda Trade Intelligence Assistant** 🤖\n\n` +
            `Hello! I am an advanced analytical system built for the NISR Hackathon 2025.\n\n` +
            `**My Capabilities:**\n` +
            `• **Evidence-Based Analysis**: Using processed JSON data and raw NISR Excel datasets\n` +
            `• **Structured Intelligence**: Providing Executive Summaries, Key Insights, and Policy Recommendations\n` +
            `• **Comprehensive Coverage**: Exports, Imports, Commodities, Regional Trade, Forecasts\n` +
            `• **Policy-Relevant Insights**: Actionable recommendations for decision-makers\n\n` +
            `**Available Data Sources:**\n` +
            `• Processed trade data (analysis_report.json, commodity_summary.json, etc.)\n` +
            `• Raw NISR Excel datasets (2025Q1 Trade Report)\n` +
            `• Official NISR PDF reports and contextual information\n\n` +
            `Ask me any question about Rwanda's trade environment and receive structured, evidence-based analysis!`
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
            'forecast-analysis': 'Provide AI-powered forecasts for Rwanda\'s trade performance over the next year.',
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
