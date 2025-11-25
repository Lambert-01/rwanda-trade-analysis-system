/**
 * Regional Analysis Page JavaScript
 * Handles comprehensive regional and continental analysis functionality
 */

class RegionalAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // Continent year selector
        const yearSelect = document.getElementById('continent-year-select');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.updateContinentalChart(e.target.value);
            });
        }
    }

    async loadData() {
        try {
            console.log('🌍 Loading regional data...');

            // Load regional data from backend API
            const response = await fetch('/api/analytics/regional');
            this.data = await response.json();

            console.log('🌍 Regional data loaded:', this.data);

            if (this.data) {
                console.log('✅ Regional data loaded successfully, rendering dashboard...');
                this.updateMetrics();
                this.renderCharts();
                this.renderInsights();
                this.hideLoading();
            } else {
                console.warn('⚠️ No regional data received from API');
                this.showError('No regional data available');
            }
        } catch (error) {
            console.error('❌ Error loading regional data:', error);
            this.showError('Failed to load regional data: ' + error.message);
        }
    }

    updateMetrics() {
        if (!this.data) return;

        // Update key metrics
        const totalTradeValue = document.getElementById('total-trade-value');
        if (totalTradeValue) {
            totalTradeValue.textContent = `$${this.data.total_trade_value?.toFixed(1) || 0}M`;
        }

        const regionalBlocksCount = document.getElementById('regional-blocks-count');
        if (regionalBlocksCount) {
            regionalBlocksCount.textContent = this.data.regional_trends?.length || 0;
        }

        const topContinentShare = document.getElementById('top-continent-share');
        if (topContinentShare && this.data.continental_distribution) {
            const africaData = this.data.continental_distribution.find(c => c.continent === 'Africa');
            topContinentShare.textContent = africaData ? `${africaData.share}%` : '0%';
        }

        // Update block statistics
        const comesaValue = document.getElementById('comesa-value');
        const eacValue = document.getElementById('eac-value');
        const sadcValue = document.getElementById('sadc-value');
        const euValue = document.getElementById('eu-value');

        if (comesaValue && this.data.regional_trends) {
            const comesa = this.data.regional_trends.find(block => block.regional_block === 'COMESA');
            if (comesa && comesa.periods.length > 0) {
                const latestValue = comesa.periods[comesa.periods.length - 1].value;
                comesaValue.textContent = `$${latestValue.toFixed(1)}M`;
            }
        }

        if (eacValue && this.data.eac_stats) {
            eacValue.textContent = `$${this.data.eac_stats.total_eac_trade?.toFixed(1) || 0}M`;
        }

        if (sadcValue && this.data.regional_trends) {
            const sadc = this.data.regional_trends.find(block => block.regional_block === 'SADC');
            if (sadc && sadc.periods.length > 0) {
                const latestValue = sadc.periods[sadc.periods.length - 1].value;
                sadcValue.textContent = `$${latestValue.toFixed(1)}M`;
            }
        }

        if (euValue && this.data.regional_trends) {
            const eu = this.data.regional_trends.find(block => block.regional_block === 'EU');
            if (eu && eu.periods.length > 0) {
                const latestValue = eu.periods[eu.periods.length - 1].value;
                euValue.textContent = `$${latestValue.toFixed(1)}M`;
            }
        }
    }

    renderCharts() {
        this.createRegionalBlocksChart();
        this.createContinentalDistributionChart();
        this.createRegionalTrendsChart();
        this.createRegionalPerformanceChart();
        this.createRiskDistributionChart();
    }

    renderInsights() {
        const insightsContainer = document.getElementById('regional-insights');
        if (!insightsContainer || !this.data.regional_insights) return;

        insightsContainer.innerHTML = '';

        this.data.regional_insights.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = `insight-item ${insight.type || 'info'}`;

            insightElement.innerHTML = `
                <div class="insight-icon">
                    <i class="${insight.icon || 'fas fa-info-circle'}"></i>
                </div>
                <h6>${insight.title}</h6>
                <p>${insight.message}</p>
            `;

            insightsContainer.appendChild(insightElement);
        });
    }

    createRegionalBlocksChart() {
        const ctx = document.getElementById('regional-blocks-chart');
        if (!ctx) {
            console.warn('⚠️ Regional blocks chart container not found');
            return;
        }

        try {
            const blocksData = this.getRegionalBlocksData();
            console.log('🌍 Regional blocks data for chart:', blocksData);

            if (!blocksData || blocksData.datasets.length === 0) {
                console.warn('⚠️ No regional blocks data available for chart');
                return;
            }

            if (this.charts.regionalBlocksChart) {
                this.charts.regionalBlocksChart.destroy();
            }

            console.log('📊 Creating regional blocks chart with data:', blocksData);
            this.charts.regionalBlocksChart = new Chart(ctx, {
                type: 'line',
                data: blocksData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12, weight: '600' }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: $${context.parsed.y.toFixed(1)}M`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: { weight: '600' },
                                maxTicksLimit: 10
                            }
                        },
                        y: {
                            grid: { color: '#e2e8f0' },
                            title: {
                                display: true,
                                text: 'Trade Volume (Millions USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(0) + 'M';
                                },
                                font: { weight: '600' }
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart'
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
            console.log('✅ Regional blocks chart created successfully');
        } catch (error) {
            console.error('❌ Error creating regional blocks chart:', error);
        }
    }

    getRegionalBlocksData() {
        if (!this.data || !this.data.regional_trends) {
            console.warn('⚠️ No regional trends data available');
            return { labels: [], datasets: [] };
        }

        console.log('🔍 Processing regional blocks data:', this.data.regional_trends);

        // Get all unique periods
        const allPeriods = new Set();
        this.data.regional_trends.forEach(block => {
            block.periods.forEach(period => {
                allPeriods.add(period.period);
            });
        });

        const labels = Array.from(allPeriods).sort();

        // Create datasets for each regional block
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];

        const datasets = this.data.regional_trends.map((block, index) => {
            const periodMap = {};
            block.periods.forEach(period => {
                periodMap[period.period] = period.value;
            });

            return {
                label: block.regional_block,
                data: labels.map(period => periodMap[period] || null),
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '20',
                borderWidth: 3,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            };
        });

        console.log('📊 Regional blocks chart data processed:', { labels, datasets });
        return { labels, datasets };
    }

    createContinentalDistributionChart() {
        const ctx = document.getElementById('continental-distribution-chart');
        if (!ctx) {
            console.warn('⚠️ Continental distribution chart container not found');
            return;
        }

        try {
            const continentalData = this.getContinentalDistributionData();
            console.log('🌍 Continental distribution data for chart:', continentalData);

            if (!continentalData || continentalData.labels.length === 0) {
                console.warn('⚠️ No continental distribution data available for chart');
                return;
            }

            if (this.charts.continentalDistributionChart) {
                this.charts.continentalDistributionChart.destroy();
            }

            console.log('📊 Creating continental distribution chart with data:', continentalData);
            this.charts.continentalDistributionChart = new Chart(ctx, {
                type: 'doughnut',
                data: continentalData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: { size: 12, weight: '600' }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${percentage}% ($${value.toFixed(1)}M)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1500,
                        easing: 'easeOutQuart'
                    },
                    cutout: '60%'
                }
            });
            console.log('✅ Continental distribution chart created successfully');
        } catch (error) {
            console.error('❌ Error creating continental distribution chart:', error);
        }
    }

    getContinentalDistributionData() {
        if (!this.data || !this.data.continental_distribution) {
            console.warn('⚠️ No continental distribution data available');
            return { labels: [], datasets: [] };
        }

        console.log('🔍 Processing continental distribution data:', this.data.continental_distribution);

        const labels = this.data.continental_distribution.map(item => item.continent);
        const values = this.data.continental_distribution.map(item => item.value);

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ];

        const datasets = [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            hoverBorderWidth: 3
        }];

        console.log('📊 Continental distribution chart data processed:', { labels, datasets });
        return { labels, datasets };
    }

    updateContinentalChart(period) {
        // This would update the chart based on selected period
        // For now, we'll just refresh the current chart
        this.createContinentalDistributionChart();
    }

    createRegionalTrendsChart() {
        const ctx = document.getElementById('regional-trends-chart');
        if (!ctx) {
            console.warn('⚠️ Regional trends chart container not found');
            return;
        }

        try {
            const trendsData = this.getRegionalTrendsData();
            console.log('📈 Regional trends data for chart:', trendsData);

            if (!trendsData || trendsData.datasets.length === 0) {
                console.warn('⚠️ No regional trends data available for chart');
                return;
            }

            if (this.charts.regionalTrendsChart) {
                this.charts.regionalTrendsChart.destroy();
            }

            console.log('📊 Creating regional trends chart with data:', trendsData);
            this.charts.regionalTrendsChart = new Chart(ctx, {
                type: 'line',
                data: trendsData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 11, weight: '600' }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: { weight: '600' },
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            grid: { color: '#e2e8f0' },
                            title: {
                                display: true,
                                text: 'Market Share (%)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                },
                                font: { weight: '600' }
                            }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
            console.log('✅ Regional trends chart created successfully');
        } catch (error) {
            console.error('❌ Error creating regional trends chart:', error);
        }
    }

    getRegionalTrendsData() {
        // This is a simplified version - in reality we'd need more detailed data
        // For now, we'll create mock trend data based on the regional blocks
        if (!this.data || !this.data.regional_trends) {
            console.warn('⚠️ No regional trends data available');
            return { labels: [], datasets: [] };
        }

        // Create quarterly periods for the last 8 quarters
        const periods = [];
        for (let year = 2023; year <= 2025; year++) {
            for (let quarter = 1; quarter <= 4; quarter++) {
                periods.push(`${year}Q${quarter}`);
            }
        }

        // Create datasets with mock trend data
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        const datasets = this.data.regional_trends.slice(0, 4).map((block, index) => {
            // Generate trend data (simplified)
            const data = periods.map((period, i) => {
                const baseValue = 20 + Math.random() * 30; // Base percentage
                const trend = Math.sin(i * 0.5) * 5; // Some variation
                return Math.max(5, Math.min(45, baseValue + trend));
            });

            return {
                label: block.regional_block,
                data: data,
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            };
        });

        console.log('📊 Regional trends chart data processed:', { labels: periods, datasets });
        return { labels: periods, datasets };
    }

    createRegionalPerformanceChart() {
        const ctx = document.getElementById('regional-performance-chart');
        if (!ctx) {
            console.warn('⚠️ Regional performance chart container not found');
            return;
        }

        try {
            const performanceData = this.getRegionalPerformanceData();
            console.log('📊 Regional performance data for chart:', performanceData);

            if (!performanceData || performanceData.labels.length === 0) {
                console.warn('⚠️ No regional performance data available for chart');
                return;
            }

            if (this.charts.regionalPerformanceChart) {
                this.charts.regionalPerformanceChart.destroy();
            }

            console.log('📊 Creating regional performance chart with data:', performanceData);
            this.charts.regionalPerformanceChart = new Chart(ctx, {
                type: 'bar',
                data: performanceData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: $${context.parsed.y.toFixed(1)}M`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: { weight: '600' },
                                maxRotation: 45
                            }
                        },
                        y: {
                            grid: { color: '#e2e8f0' },
                            title: {
                                display: true,
                                text: 'Trade Volume (Millions USD)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(0) + 'M';
                                },
                                font: { weight: '600' }
                            }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart',
                        delay: function(context) {
                            return context.dataIndex * 100;
                        }
                    }
                }
            });
            console.log('✅ Regional performance chart created successfully');
        } catch (error) {
            console.error('❌ Error creating regional performance chart:', error);
        }
    }

    getRegionalPerformanceData() {
        if (!this.data || !this.data.regional_trends) {
            console.warn('⚠️ No regional trends data available');
            return { labels: [], datasets: [] };
        }

        console.log('🔍 Processing regional performance data:', this.data.regional_trends);

        const labels = this.data.regional_trends.map(block => block.regional_block);
        const values = this.data.regional_trends.map(block => {
            if (block.periods && block.periods.length > 0) {
                return block.periods[block.periods.length - 1].value;
            }
            return 0;
        });

        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

        const datasets = [{
            data: values,
            backgroundColor: colors.slice(0, labels.length).map(color => color + 'CC'),
            borderColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
        }];

        console.log('📊 Regional performance chart data processed:', { labels, datasets });
        return { labels, datasets };
    }

    createRiskDistributionChart() {
        const ctx = document.getElementById('risk-distribution-chart');
        if (!ctx) {
            console.warn('⚠️ Risk distribution chart container not found');
            return;
        }

        try {
            const riskData = this.getRiskDistributionData();
            console.log('⚠️ Risk distribution data for chart:', riskData);

            if (!riskData || riskData.labels.length === 0) {
                console.warn('⚠️ No risk distribution data available for chart');
                return;
            }

            if (this.charts.riskDistributionChart) {
                this.charts.riskDistributionChart.destroy();
            }

            console.log('📊 Creating risk distribution chart with data:', riskData);
            this.charts.riskDistributionChart = new Chart(ctx, {
                type: 'pie',
                data: riskData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: { size: 11, weight: '600' }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value}%`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1200,
                        easing: 'easeOutQuart'
                    }
                }
            });
            console.log('✅ Risk distribution chart created successfully');
        } catch (error) {
            console.error('❌ Error creating risk distribution chart:', error);
        }
    }

    getRiskDistributionData() {
        // Mock risk distribution data based on regional analysis
        const labels = ['Geographic Concentration', 'Market Dependency', 'Diversification Level'];
        const values = [35, 45, 20]; // Percentages

        const colors = ['#dc2626', '#f59e0b', '#16a34a'];

        const datasets = [{
            data: values,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            hoverBorderWidth: 3
        }];

        console.log('📊 Risk distribution chart data processed:', { labels, datasets });
        return { labels, datasets };
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    showError(message) {
        console.error(message);
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        errorDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.regionalAnalyzer = new RegionalAnalyzer();
});

// Global functions for HTML onclick handlers
function loadRegionalAnalysis() {
    if (window.regionalAnalyzer) {
        window.regionalAnalyzer.loadData();
    }
}

function exportRegionalData() {
    if (!window.regionalAnalyzer || !window.regionalAnalyzer.data) {
        alert('No data available to export. Please load the regional analysis first.');
        return;
    }

    const regionalData = {
        metadata: {
            generated_at: window.regionalAnalyzer.data.generated_at,
            data_sources: window.regionalAnalyzer.data.data_sources,
            total_trade_value: window.regionalAnalyzer.data.total_trade_value
        },
        eac_analysis: {
            total_eac_trade: window.regionalAnalyzer.data.eac_stats?.total_eac_trade,
            eac_blocks_count: window.regionalAnalyzer.data.eac_stats?.eac_blocks_count,
            top_eac_partner: window.regionalAnalyzer.data.eac_stats?.top_eac_partner,
            eac_trade_data: window.regionalAnalyzer.data.eac_trade
        },
        continental_distribution: window.regionalAnalyzer.data.continental_distribution,
        regional_trends: window.regionalAnalyzer.data.regional_trends,
        regional_exports: window.regionalAnalyzer.data.regional_exports,
        insights: window.regionalAnalyzer.data.regional_insights,
        key_metrics: {
            total_trade_value: window.regionalAnalyzer.data.total_trade_value,
            regional_blocks_count: window.regionalAnalyzer.data.regional_trends?.length || 0,
            top_continent: window.regionalAnalyzer.data.continental_distribution?.[0]?.continent || 'Unknown',
            top_continent_share: window.regionalAnalyzer.data.continental_distribution?.[0]?.share || 0
        }
    };

    const dataStr = JSON.stringify(regionalData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `regional_analysis_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    // Show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
    successDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    successDiv.innerHTML = `
        <strong>Success:</strong> Regional analysis data exported successfully!
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}