/* =====================================================================
  Rwanda trade analysis system - COMMODITIES.JS (ENHANCED VERSION)
   Advanced SITC Analysis with Beautiful Visualizations
   ===================================================================== */

class CommoditiesAnalyzer {
    constructor() {
        this.data = {
            exports: [],
            imports: [],
            reexports: []
        };
        this.charts = {};
        this.quarters = ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Enhanced Commodities Analyzer...');
        this.showLoading();
        await this.loadAllData();
        this.renderPage();
        this.hideLoading();
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
            }, 500);
        }
    }

    async loadAllData() {
        try {
            console.log('📊 Loading commodity data from dedicated JSON files...');
            
            // Load all three commodity files in parallel
            const [exportsRes, importsRes, reexportsRes] = await Promise.all([
                fetch('/data/processed/exportscommodity_data.json'),
                fetch('/data/processed/importscommodity_data.json'),
                fetch('/data/processed/reexportscommodity_data.json')
            ]);

            this.data.exports = await exportsRes.json();
            this.data.imports = await importsRes.json();
            this.data.reexports = await reexportsRes.json();

            console.log('✅ All commodity data loaded successfully');
            console.log('📦 Exports:', this.data.exports.length, 'SITC sections');
            console.log('📦 Imports:', this.data.imports.length, 'SITC sections');
            console.log('📦 Re-exports:', this.data.reexports.length, 'SITC sections');

        } catch (error) {
            console.error('❌ Error loading commodity data:', error);
            this.showError('Failed to load commodity data. Using fallback data.');
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        this.data = {
            exports: [],
            imports: [],
            reexports: []
        };
    }

    getQuarterlyValues(item) {
        // Extract quarterly values from the item (columns with quarter names like 2023Q1, 2024Q2, etc.)
        const values = [];
        const quarterKeys = Object.keys(item).filter(key =>
            key.match(/^\d{4}Q[1-4]$/) // Matches pattern like 2023Q1, 2024Q2, etc.
        );

        // Sort quarters chronologically
        quarterKeys.sort((a, b) => {
            const [aYear, aQ] = [parseInt(a.substring(0, 4)), parseInt(a.substring(5))];
            const [bYear, bQ] = [parseInt(b.substring(0, 4)), parseInt(b.substring(5))];
            return aYear === bYear ? aQ - bQ : aYear - bYear;
        });

        quarterKeys.forEach(key => {
            values.push(parseFloat(item[key]) || 0);
        });

        return values;
    }

    getLatestValue(item) {
        // Use the pre-calculated latest_value from the processed data
        return parseFloat(item['latest_value']) || 0;
    }

    getSharePercent(item) {
        return parseFloat(item['share_percentage']) || 0;
    }

    getGrowthRates(item) {
        // Use the calculated growth rates from the processed data
        return {
            qoq: parseFloat(item['qoq_growth']) || 0,  // Quarter-over-quarter
            yoy: parseFloat(item['yoy_growth']) || 0   // Year-over-year
        };
    }

    renderPage() {
        console.log('🎨 Rendering enhanced commodities page...');

        this.renderSummaryStats();
        this.renderTopPerformers();
        this.renderSITCComparison();
        this.renderAllCharts();
        this.renderDetailedBreakdown();
        this.setupFilters();

        console.log('✅ Commodities page rendered successfully');
    }

    renderSummaryStats() {
        // Calculate totals
        const exportTotal = this.data.exports.reduce((sum, item) => sum + this.getLatestValue(item), 0);
        const importTotal = this.data.imports.reduce((sum, item) => sum + this.getLatestValue(item), 0);
        const reexportTotal = this.data.reexports.reduce((sum, item) => sum + this.getLatestValue(item), 0);
        const tradeBalance = exportTotal - importTotal;
        
        // Find top performers
        const topExport = this.data.exports.reduce((max, item) => 
            this.getLatestValue(item) > this.getLatestValue(max) ? item : max, this.data.exports[0] || {});
        const topImport = this.data.imports.reduce((max, item) => 
            this.getLatestValue(item) > this.getLatestValue(max) ? item : max, this.data.imports[0] || {});

        this.updateElement('total-exports', `$${exportTotal.toFixed(2)}M`);
        this.updateElement('total-imports', `$${importTotal.toFixed(2)}M`);
        this.updateElement('total-reexports', `$${reexportTotal.toFixed(2)}M`);
        this.updateElement('trade-balance', `$${Math.abs(tradeBalance).toFixed(2)}M`);
        this.updateElement('balance-status', tradeBalance >= 0 ? 'Surplus' : 'Deficit');
        
        // Update balance card color
        const balanceCard = document.querySelector('.commodity-stats-card.balance');
        if (balanceCard) {
            balanceCard.classList.toggle('surplus', tradeBalance >= 0);
            balanceCard.classList.toggle('deficit', tradeBalance < 0);
        }

        this.updateElement('top-export-name', topExport.commodity_description || 'N/A');
        this.updateElement('top-export-value', `$${this.getLatestValue(topExport).toFixed(2)}M`);
        this.updateElement('top-import-name', topImport.commodity_description || 'N/A');
        this.updateElement('top-import-value', `$${this.getLatestValue(topImport).toFixed(2)}M`);

        this.updateElement('sitc-count', this.data.exports.length);
        this.updateElement('reexport-categories', this.data.reexports.filter(item => this.getLatestValue(item) > 0).length);
    }

    renderTopPerformers() {
        const container = document.getElementById('top-performers');
        if (!container) return;

        // Get top 3 by value for each category
        const topExports = [...this.data.exports]
            .sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a))
            .slice(0, 3);
        
        const topImports = [...this.data.imports]
            .sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a))
            .slice(0, 3);

        const topReexports = [...this.data.reexports]
            .filter(item => this.getLatestValue(item) > 0)
            .sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a))
            .slice(0, 3);

        let html = '<div class="row g-4">';

        // Exports
        html += this.renderTopPerformerCard('Exports', topExports, 'success', 'fa-arrow-trend-up');
        // Imports
        html += this.renderTopPerformerCard('Imports', topImports, 'primary', 'fa-arrow-trend-down');
        // Re-exports
        html += this.renderTopPerformerCard('Re-exports', topReexports, 'warning', 'fa-exchange-alt');

        html += '</div>';
        container.innerHTML = html;
    }

    renderTopPerformerCard(title, items, colorClass, icon) {
        let html = `
            <div class="col-lg-4 col-md-6">
                <div class="top-performer-card ${colorClass}">
                    <div class="card-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h3>${title} Leaders</h3>
                    <div class="performers-list">
        `;

        items.forEach((item, index) => {
            const value = this.getLatestValue(item);
            const share = this.getSharePercent(item);
            const growth = this.getGrowthRates(item);
            const medal = ['🥇', '🥈', '🥉'][index] || '🏅';

            html += `
                <div class="performer-item">
                    <div class="performer-rank">${medal}</div>
                    <div class="performer-info">
                        <div class="performer-name">
                            <strong>SITC ${item.sitc_section}:</strong> ${item.commodity_description}
                        </div>
                        <div class="performer-stats">
                            <span class="value">$${value.toFixed(2)}M</span>
                            <span class="share">${share.toFixed(1)}%</span>
                            <span class="growth ${growth.qoq >= 0 ? 'positive' : 'negative'}">
                                ${growth.qoq >= 0 ? '↑' : '↓'} ${Math.abs(growth.qoq).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    renderSITCComparison() {
        const container = document.getElementById('sitc-comparison');
        if (!container) return;

        let html = '<div class="comparison-grid">';

        // Create comparison for each SITC section
        const allSections = new Set([
            ...this.data.exports.map(item => item.sitc_section),
            ...this.data.imports.map(item => item.sitc_section)
        ]);

        [...allSections].sort().forEach(section => {
            const exportItem = this.data.exports.find(item => item.sitc_section === section);
            const importItem = this.data.imports.find(item => item.sitc_section === section);
            const reexportItem = this.data.reexports.find(item => item.sitc_section === section);

            const exportValue = exportItem ? this.getLatestValue(exportItem) : 0;
            const importValue = importItem ? this.getLatestValue(importItem) : 0;
            const reexportValue = reexportItem ? this.getLatestValue(reexportItem) : 0;
            const balance = exportValue - importValue;

            const name = exportItem?.commodity_description || importItem?.commodity_description || 'Unknown';

            html += `
                <div class="sitc-comparison-card">
                    <div class="sitc-header">
                        <span class="sitc-badge">SITC ${section}</span>
                        <h4>${name}</h4>
                    </div>
                    <div class="comparison-bars">
                        <div class="bar-group">
                            <label>Exports</label>
                            <div class="bar-container">
                                <div class="bar export" style="width: ${this.getBarWidth(exportValue, Math.max(exportValue, importValue))}%">
                                    <span class="bar-value">$${exportValue.toFixed(1)}M</span>
                                </div>
                            </div>
                        </div>
                        <div class="bar-group">
                            <label>Imports</label>
                            <div class="bar-container">
                                <div class="bar import" style="width: ${this.getBarWidth(importValue, Math.max(exportValue, importValue))}%">
                                    <span class="bar-value">$${importValue.toFixed(1)}M</span>
                                </div>
                            </div>
                        </div>
                        ${reexportValue > 0 ? `
                        <div class="bar-group">
                            <label>Re-exports</label>
                            <div class="bar-container">
                                <div class="bar reexport" style="width: ${this.getBarWidth(reexportValue, Math.max(exportValue, importValue))}%">
                                    <span class="bar-value">$${reexportValue.toFixed(1)}M</span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="balance-indicator ${balance >= 0 ? 'surplus' : 'deficit'}">
                        Balance: ${balance >= 0 ? '+' : ''}$${balance.toFixed(1)}M
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    getBarWidth(value, max) {
        if (max === 0) return 0;
        return Math.max((value / max) * 100, 5); // Minimum 5% for visibility
    }

    renderAllCharts() {
        console.log('📊 Rendering enhanced commodity charts...');

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });
        this.charts = {};

        // Render charts for each tab
        this.renderExportsCharts();
        this.renderImportsCharts();
        this.renderComparisonCharts();
    }

    renderExportsCharts() {
        this.renderExportsTrendChart();
        this.renderExportsDistributionChart();
        this.renderExportsGrowthChart();
    }

    renderImportsCharts() {
        this.renderImportsTrendChart();
        this.renderImportsDistributionChart();
        this.renderImportsGrowthChart();
    }

    renderComparisonCharts() {
        this.renderComparisonTrendChart();
        this.renderRadarChart();
        this.renderBalanceChart();
    }

    renderExportsTrendChart() {
        const canvas = document.getElementById('exports-trends-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Get top 5 exports
        const top5 = [...this.data.exports]
            .sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a))
            .slice(0, 5);

        const datasets = top5.map((item, index) => ({
            label: `${item.sitc_section}: ${item.commodity_description.substring(0, 30)}`,
            data: this.getQuarterlyValues(item),
            borderColor: this.getChartColor(index),
            backgroundColor: this.getChartColor(index, 0.1),
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        }));

        this.charts.exportsTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.quarters,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Export Commodities - Quarterly Trends',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value}M`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    renderImportsTrendChart() {
        const canvas = document.getElementById('imports-trends-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Get top 5 imports
        const top5 = [...this.data.imports]
            .sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a))
            .slice(0, 5);

        const datasets = top5.map((item, index) => ({
            label: `${item.sitc_section}: ${item.commodity_description.substring(0, 30)}`,
            data: this.getQuarterlyValues(item),
            borderColor: this.getChartColor(index + 5),
            backgroundColor: this.getChartColor(index + 5, 0.1),
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        }));

        this.charts.importsTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.quarters,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Import Commodities - Quarterly Trends',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value}M`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    renderComparisonTrendChart() {
        const canvas = document.getElementById('comparison-trends-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Calculate quarterly totals for exports and imports
        const exportTotals = this.quarters.map(quarter => {
            return this.data.exports.reduce((sum, item) => sum + (parseFloat(item[quarter]) || 0), 0);
        });

        const importTotals = this.quarters.map(quarter => {
            return this.data.imports.reduce((sum, item) => sum + (parseFloat(item[quarter]) || 0), 0);
        });

        this.charts.comparisonTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.quarters,
                datasets: [{
                    label: 'Total Exports',
                    data: exportTotals,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Total Imports',
                    data: importTotals,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Exports vs Imports - Overall Trends',
                        font: { size: 16, weight: 'bold' },
                        padding: 15
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value}M`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    renderExportsDistributionChart() {
        const canvas = document.getElementById('exports-distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        this.charts.exportsDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.data.exports.map(item => `SITC ${item.sitc_section}: ${item.commodity_description.substring(0, 25)}`),
                datasets: [{
                    data: this.data.exports.map(item => this.getLatestValue(item)),
                    backgroundColor: this.data.exports.map((_, i) => this.getChartColor(i)),
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Export Commodities Distribution (2025Q1)',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 10,
                            padding: 8,
                            font: { size: 9 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `$${value.toFixed(2)}M (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderImportsDistributionChart() {
        const canvas = document.getElementById('imports-distribution-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        this.charts.importsDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.data.imports.map(item => `SITC ${item.sitc_section}: ${item.commodity_description.substring(0, 25)}`),
                datasets: [{
                    data: this.data.imports.map(item => this.getLatestValue(item)),
                    backgroundColor: this.data.imports.map((_, i) => this.getChartColor(i + 5)),
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Import Commodities Distribution (2025Q1)',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 10,
                            padding: 8,
                            font: { size: 9 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `$${value.toFixed(2)}M (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderExportsGrowthChart() {
        const canvas = document.getElementById('exports-growth-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const exportGrowth = this.data.exports.map(item => ({
            sitc: item.sitc_section,
            name: item.commodity_description.substring(0, 20),
            growth: this.getGrowthRates(item).yoy
        })).sort((a, b) => b.growth - a.growth).slice(0, 8); // Top 8 for readability

        this.charts.exportsGrowth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: exportGrowth.map(item => `SITC ${item.sitc}: ${item.name}`),
                datasets: [{
                    label: 'Year-over-Year Growth Rate (%)',
                    data: exportGrowth.map(item => item.growth),
                    backgroundColor: exportGrowth.map(item =>
                        item.growth >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'
                    ),
                    borderColor: exportGrowth.map(item =>
                        item.growth >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Export Commodities - YoY Growth Rates',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Growth: ${context.parsed.x >= 0 ? '+' : ''}${context.parsed.x.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderImportsGrowthChart() {
        const canvas = document.getElementById('imports-growth-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const importGrowth = this.data.imports.map(item => ({
            sitc: item.sitc_section,
            name: item.commodity_description.substring(0, 20),
            growth: this.getGrowthRates(item).yoy
        })).sort((a, b) => b.growth - a.growth).slice(0, 8); // Top 8 for readability

        this.charts.importsGrowth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: importGrowth.map(item => `SITC ${item.sitc}: ${item.name}`),
                datasets: [{
                    label: 'Year-over-Year Growth Rate (%)',
                    data: importGrowth.map(item => item.growth),
                    backgroundColor: importGrowth.map(item =>
                        item.growth >= 0 ? 'rgba(0, 123, 255, 0.7)' : 'rgba(220, 53, 69, 0.7)'
                    ),
                    borderColor: importGrowth.map(item =>
                        item.growth >= 0 ? 'rgba(0, 123, 255, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Import Commodities - YoY Growth Rates',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Growth: ${context.parsed.x >= 0 ? '+' : ''}${context.parsed.x.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderBalanceChart() {
        const canvas = document.getElementById('balance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Calculate trade balance by quarter
        const balances = this.quarters.map(quarter => {
            const exports = this.data.exports.reduce((sum, item) => sum + (parseFloat(item[quarter]) || 0), 0);
            const imports = this.data.imports.reduce((sum, item) => sum + (parseFloat(item[quarter]) || 0), 0);
            return exports - imports;
        });

        this.charts.balance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.quarters,
                datasets: [{
                    label: 'Trade Balance',
                    data: balances,
                    borderColor: balances.map(balance =>
                        balance >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    backgroundColor: balances.map(balance =>
                        balance >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)'
                    ),
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: balances.map(balance =>
                        balance >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Quarterly Trade Balance',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `Balance: ${value >= 0 ? '+' : ''}$${value.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value}M`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    renderRadarChart() {
        const canvas = document.getElementById('radar-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Compare exports vs imports for all SITC sections
        const allSections = [...new Set([
            ...this.data.exports.map(item => item.sitc_section),
            ...this.data.imports.map(item => item.sitc_section)
        ])].sort();

        const exportValues = allSections.map(section => {
            const item = this.data.exports.find(e => e.sitc_section === section);
            return item ? this.getLatestValue(item) : 0;
        });

        const importValues = allSections.map(section => {
            const item = this.data.imports.find(i => i.sitc_section === section);
            return item ? this.getLatestValue(item) : 0;
        });

        const labels = allSections.map(section => {
            const item = this.data.exports.find(e => e.sitc_section === section) ||
                        this.data.imports.find(i => i.sitc_section === section);
            return `SITC ${section}`;
        });

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Exports',
                    data: exportValues,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(40, 167, 69, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(40, 167, 69, 1)'
                }, {
                    label: 'Imports',
                    data: importValues,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(0, 123, 255, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 123, 255, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Exports vs Imports - SITC Comparison',
                        font: { size: 14, weight: 'bold' },
                        padding: 10
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: $${context.parsed.r.toFixed(2)}M`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `$${value}M`
                        }
                    }
                }
            }
        });
    }

    renderDetailedBreakdown() {
        const container = document.getElementById('detailed-breakdown');
        if (!container) return;

        let html = `
            <div class="table-responsive">
                <table class="table table-hover detailed-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>SITC</th>
                            <th>Commodity Description</th>
                            <th>Type</th>
                            <th>Latest Value (2025Q1)</th>
                            <th>Share %</th>
                            <th>Q-o-Q Growth</th>
                            <th>Y-o-Y Growth</th>
                            <th>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Combine all data with type labels
        const allData = [
            ...this.data.exports.map(item => ({ ...item, type: 'Export', typeClass: 'export' })),
            ...this.data.imports.map(item => ({ ...item, type: 'Import', typeClass: 'import' })),
            ...this.data.reexports.filter(item => this.getLatestValue(item) > 0)
                .map(item => ({ ...item, type: 'Re-export', typeClass: 'reexport' }))
        ];

        // Sort by latest value
        allData.sort((a, b) => this.getLatestValue(b) - this.getLatestValue(a));

        allData.forEach((item, index) => {
            const value = this.getLatestValue(item);
            const share = this.getSharePercent(item);
            const growth = this.getGrowthRates(item);
            const values = this.getQuarterlyValues(item);
            const trend = this.getTrendIndicator(values);

            html += `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td><span class="badge bg-primary">SITC ${item.sitc_section}</span></td>
                    <td><strong>${item.commodity_description}</strong></td>
                    <td><span class="badge bg-${item.typeClass}">${item.type}</span></td>
                    <td><strong>$${value.toFixed(2)}M</strong></td>
                    <td>${share.toFixed(2)}%</td>
                    <td class="${growth.qoq >= 0 ? 'text-success' : 'text-danger'}">
                        <i class="fas fa-arrow-${growth.qoq >= 0 ? 'up' : 'down'}"></i>
                        ${growth.qoq >= 0 ? '+' : ''}${growth.qoq.toFixed(2)}%
                    </td>
                    <td class="${growth.yoy >= 0 ? 'text-success' : 'text-danger'}">
                        <i class="fas fa-arrow-${growth.yoy >= 0 ? 'up' : 'down'}"></i>
                        ${growth.yoy >= 0 ? '+' : ''}${growth.yoy.toFixed(2)}%
                    </td>
                    <td>${trend}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    getTrendIndicator(values) {
        if (values.length < 3) return '➡️';
        
        const recent = values.slice(-3);
        const increasing = recent[2] > recent[1] && recent[1] > recent[0];
        const decreasing = recent[2] < recent[1] && recent[1] < recent[0];
        
        if (increasing) return '📈 Rising';
        if (decreasing) return '📉 Falling';
        return '↔️ Stable';
    }

    getChartColor(index, alpha = 1) {
        const colors = [
            `rgba(255, 99, 132, ${alpha})`,
            `rgba(54, 162, 235, ${alpha})`,
            `rgba(255, 206, 86, ${alpha})`,
            `rgba(75, 192, 192, ${alpha})`,
            `rgba(153, 102, 255, ${alpha})`,
            `rgba(255, 159, 64, ${alpha})`,
            `rgba(199, 199, 199, ${alpha})`,
            `rgba(83, 102, 255, ${alpha})`,
            `rgba(255, 99, 255, ${alpha})`,
            `rgba(99, 255, 132, ${alpha})`,
            `rgba(255, 0, 127, ${alpha})`,
            `rgba(0, 255, 255, ${alpha})`
        ];
        return colors[index % colors.length];
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    setupFilters() {
        const applyBtn = document.getElementById('apply-filters');
        const resetBtn = document.getElementById('reset-filters');

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }
    }

    applyFilters() {
        const tradeType = document.getElementById('trade-type-filter')?.value || 'all';
        const sitcSection = document.getElementById('sitc-filter')?.value || 'all';
        const valueRange = document.getElementById('value-range-filter')?.value || 'all';
        const growthFilter = document.getElementById('growth-filter')?.value || 'all';

        console.log('🔍 Applying filters:', { tradeType, sitcSection, valueRange, growthFilter });

        // Filter data based on criteria
        const filteredData = this.applyDataFilters(tradeType, sitcSection, valueRange, growthFilter);

        // Update displays with filtered data
        this.updateFilteredDisplays(filteredData);

        // Show filter applied message
        this.showFilterMessage('Filters applied successfully!');
    }

    resetFilters() {
        // Reset all filter selects
        const filters = ['trade-type-filter', 'sitc-filter', 'value-range-filter', 'growth-filter'];
        filters.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = 'all';
        });

        // Re-render with full data
        this.renderSummaryStats();
        this.renderTopPerformers();
        this.renderSITCComparison();
        this.renderAllCharts();
        this.renderDetailedBreakdown();

        this.showFilterMessage('Filters reset!');
    }

    applyDataFilters(tradeType, sitcSection, valueRange, growthFilter) {
        let filteredExports = [...this.data.exports];
        let filteredImports = [...this.data.imports];
        let filteredReexports = [...this.data.reexports];

        // Apply trade type filter
        if (tradeType !== 'all') {
            if (tradeType === 'exports') {
                filteredImports = [];
                filteredReexports = [];
            } else if (tradeType === 'imports') {
                filteredExports = [];
                filteredReexports = [];
            } else if (tradeType === 'reexports') {
                filteredExports = [];
                filteredImports = [];
            }
        }

        // Apply SITC section filter
        if (sitcSection !== 'all') {
            filteredExports = filteredExports.filter(item => item.sitc_section === sitcSection);
            filteredImports = filteredImports.filter(item => item.sitc_section === sitcSection);
            filteredReexports = filteredReexports.filter(item => item.sitc_section === sitcSection);
        }

        // Apply value range filter
        if (valueRange !== 'all') {
            const [min, max] = this.parseValueRange(valueRange);
            filteredExports = filteredExports.filter(item => {
                const value = this.getLatestValue(item);
                return value >= min && (max === null || value <= max);
            });
            filteredImports = filteredImports.filter(item => {
                const value = this.getLatestValue(item);
                return value >= min && (max === null || value <= max);
            });
            filteredReexports = filteredReexports.filter(item => {
                const value = this.getLatestValue(item);
                return value >= min && (max === null || value <= max);
            });
        }

        // Apply growth filter
        if (growthFilter !== 'all') {
            const growthFilterFn = this.getGrowthFilterFunction(growthFilter);
            filteredExports = filteredExports.filter(growthFilterFn);
            filteredImports = filteredImports.filter(growthFilterFn);
            filteredReexports = filteredReexports.filter(growthFilterFn);
        }

        return {
            exports: filteredExports,
            imports: filteredImports,
            reexports: filteredReexports
        };
    }

    parseValueRange(range) {
        const ranges = {
            '0-1': [0, 1],
            '1-10': [1, 10],
            '10-50': [10, 50],
            '50-100': [50, 100],
            '100+': [100, null]
        };
        return ranges[range] || [0, null];
    }

    getGrowthFilterFunction(growthFilter) {
        return (item) => {
            const growth = this.getGrowthRates(item).yoy;
            switch (growthFilter) {
                case 'positive': return growth >= 0;
                case 'negative': return growth < 0;
                case 'high-growth': return growth > 10;
                case 'declining': return growth < -5;
                default: return true;
            }
        };
    }

    updateFilteredDisplays(filteredData) {
        // Temporarily replace data for rendering
        const originalData = { ...this.data };
        this.data = filteredData;

        // Re-render components with filtered data
        this.renderSummaryStats();
        this.renderTopPerformers();
        this.renderSITCComparison();
        this.renderAllCharts();
        this.renderDetailedBreakdown();

        // Restore original data
        this.data = originalData;
    }

    showFilterMessage(message) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        notification.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        console.error('❌', message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Enhanced Commodities page loaded');
    window.commoditiesAnalyzer = new CommoditiesAnalyzer();
});

// Export for global access
window.CommoditiesAnalyzer = CommoditiesAnalyzer;
