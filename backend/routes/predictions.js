const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const xlsx = require('xlsx');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (allowedTypes.includes(file.mimetype) ||
            file.originalname.endsWith('.xlsx') ||
            file.originalname.endsWith('.xls') ||
            file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'), false);
        }
    }
});

// Advanced prediction endpoint
router.post('/advanced', async (req, res) => {
    try {
        const {
            modelType,
            forecastHorizon,
            confidenceLevel,
            dataType,
            preprocessingOptions
        } = req.body;

        // Validate required parameters
        if (!modelType || !forecastHorizon || !dataType) {
            return res.status(400).json({
                error: 'Missing required parameters: modelType, forecastHorizon, dataType'
            });
        }

        if (forecastHorizon < 1 || forecastHorizon > 24) {
            return res.status(400).json({
                error: 'forecastHorizon must be between 1 and 24 quarters'
            });
        }

        // Validate input
        if (!modelType || !forecastHorizon || !dataType) {
            return res.status(400).json({
                error: 'Missing required parameters: modelType, forecastHorizon, dataType'
            });
        }

        // Simulate prediction process (in real implementation, this would call Python scripts)
        const predictionResult = await generatePrediction({
            modelType,
            forecastHorizon: parseInt(forecastHorizon),
            confidenceLevel: parseInt(confidenceLevel),
            dataType,
            preprocessingOptions
        });

        res.json({
            success: true,
            prediction: predictionResult,
            timestamp: new Date().toISOString(),
            model: modelType,
            confidence: confidenceLevel
        });

    } catch (error) {
        console.error('Advanced prediction error:', error);
        res.status(500).json({
            error: 'Prediction failed',
            message: error.message
        });
    }
});

// File upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;

        console.log(`📁 Processing uploaded file: ${fileName} (${fileSize} bytes)`);

        // Process the uploaded Excel/CSV file
        let workbook;
        try {
            if (fileName.endsWith('.csv')) {
                // For CSV files, read as text and convert to workbook
                const csvData = await fs.readFile(filePath, 'utf8');
                workbook = xlsx.read(csvData, { type: 'string' });
            } else {
                // For Excel files
                workbook = xlsx.readFile(filePath);
            }
        } catch (parseError) {
            console.error('Error parsing file:', parseError);
            // Clean up uploaded file
            await fs.unlink(filePath).catch(() => {});
            return res.status(400).json({
                error: 'Invalid file format',
                message: 'Unable to parse the uploaded file. Please ensure it\'s a valid Excel or CSV file.'
            });
        }

        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
            await fs.unlink(filePath).catch(() => {});
            return res.status(400).json({
                error: 'Empty file',
                message: 'The uploaded file appears to be empty or contains no data.'
            });
        }

        // Analyze the data structure
        const headers = jsonData[0] || [];
        const dataRows = jsonData.slice(1).filter(row => row.length > 0);

        // Detect data types and structure
        const columnAnalysis = analyzeColumns(headers, dataRows);

        // Calculate basic statistics
        const stats = calculateBasicStats(dataRows, headers);

        // Clean up uploaded file after processing
        await fs.unlink(filePath).catch(() => {});

        console.log(`✅ File processed successfully: ${dataRows.length} rows, ${headers.length} columns`);

        res.json({
            success: true,
            message: 'File uploaded and analyzed successfully',
            fileInfo: {
                name: fileName,
                size: formatFileSize(fileSize),
                type: fileName.split('.').pop().toLowerCase(),
                rows: dataRows.length,
                columns: headers,
                columnAnalysis: columnAnalysis,
                stats: stats,
                timeRange: detectTimeRange(dataRows, headers),
                missingValues: calculateMissingValues(dataRows),
                dataQuality: calculateDataQuality(dataRows, headers)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('File upload error:', error);

        // Clean up uploaded file if it exists
        if (req.file && req.file.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        res.status(500).json({
            error: 'File upload failed',
            message: error.message
        });
    }
});

// Preprocessing endpoint
router.post('/preprocess', async (req, res) => {
    try {
        const { data, options } = req.body;

        // Simulate preprocessing
        const processedData = {
            originalRows: data ? data.length : 150,
            processedRows: data ? data.length : 150,
            missingValuesHandled: 12,
            smoothingApplied: options?.smoothing || '6-period',
            featuresCreated: ['lag_1', 'lag_4', 'rolling_mean', 'rolling_std'],
            sitcFilter: options?.sitcCategory || 'all'
        };

        res.json({
            success: true,
            preprocessing: processedData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Preprocessing error:', error);
        res.status(500).json({
            error: 'Preprocessing failed',
            message: error.message
        });
    }
});

// EDA analysis endpoint
router.post('/eda', async (req, res) => {
    try {
        const { data, analysisType } = req.body;

        // Generate EDA insights
        const insights = generateEDAInsights(data, analysisType);

        res.json({
            success: true,
            insights: insights,
            charts: {
                timeSeries: generateTimeSeriesData(data),
                seasonal: generateSeasonalData(data),
                correlation: generateCorrelationData(data)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('EDA analysis error:', error);
        res.status(500).json({
            error: 'EDA analysis failed',
            message: error.message
        });
    }
});

// Model comparison endpoint
router.post('/compare-models', async (req, res) => {
    try {
        const { data, models, forecastHorizon } = req.body;

        // Compare multiple models
        const comparison = await compareModels(data, models, forecastHorizon);

        res.json({
            success: true,
            comparison: comparison,
            bestModel: comparison[0], // Best performing model
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Model comparison error:', error);
        res.status(500).json({
            error: 'Model comparison failed',
            message: error.message
        });
    }
});

// Get next quarter predictions (static endpoint)
router.get('/next', async (req, res) => {
    try {
        const quarters = req.query.quarters ? parseInt(req.query.quarters) : 4;

        // Generate mock prediction data
        const predictions = [];
        let baseValue = 458; // Starting from latest quarter

        for (let i = 0; i < quarters; i++) {
            const growth = (Math.random() - 0.3) * 0.15; // Random growth between -30% to +15%
            baseValue = baseValue * (1 + growth);
            predictions.push({
                quarter: `2025Q${i + 2}`,
                predicted_value: Math.round(baseValue),
                confidence_lower: Math.round(baseValue * 0.85),
                confidence_upper: Math.round(baseValue * 1.15),
                risk_level: growth < -0.1 ? 'high' : growth < 0 ? 'medium' : 'low'
            });
        }

        res.json({
            success: true,
            predictions: predictions,
            model: 'ensemble',
            confidence_level: 95,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Next predictions error:', error);
        res.status(500).json({
            error: 'Failed to generate predictions',
            message: error.message
        });
    }
});

// Export prediction results
router.post('/export', async (req, res) => {
    try {
        const { predictionData, format } = req.body;

        // Generate export file
        const exportData = generateExportData(predictionData, format);

        res.json({
            success: true,
            export: exportData,
            downloadUrl: `/api/predictions/download/${exportData.filename}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            error: 'Export failed',
            message: error.message
        });
    }
});

// Mock functions for simulation (replace with actual implementations)

async function generatePrediction(options) {
    // Simulate calling Python prediction script
    return new Promise((resolve) => {
        setTimeout(() => {
            const historical = [368, 454, 350, 353, 401, 509, 627, 626, 458];
            const forecast = [];
            const upperBound = [];
            const lowerBound = [];

            let lastValue = historical[historical.length - 1];
            for (let i = 0; i < options.forecastHorizon; i++) {
                lastValue = lastValue * (1 + (Math.random() - 0.3) * 0.1);
                forecast.push(Math.round(lastValue));

                const margin = lastValue * (1 - options.confidenceLevel/100) * 0.5;
                upperBound.push(Math.round(lastValue + margin));
                lowerBound.push(Math.round(lastValue - margin));
            }

            resolve({
                model: options.modelType,
                historical: historical,
                forecast: forecast,
                upperBound: upperBound,
                lowerBound: lowerBound,
                metrics: {
                    mape: 4.2,
                    rmse: 12.5,
                    r2: 0.91,
                    mae: 8.3,
                    accuracy: 95.8
                },
                trainingTime: 2.3,
                confidence: options.confidenceLevel
            });
        }, 2000);
    });
}

function generateEDAInsights(data, analysisType) {
    return [
        {
            type: 'trend',
            icon: 'fas fa-arrow-trend-up',
            title: 'Strong Q4 Seasonal Pattern',
            text: 'Exports show consistent 15-20% increase in Q4 across all years, indicating optimal timing for trade activities.'
        },
        {
            type: 'warning',
            icon: 'fas fa-exclamation-triangle',
            title: 'Trade Deficit Widening',
            text: 'Import growth (8.2% CAGR) outpacing export growth (6.1% CAGR) by 2.1 percentage points.'
        },
        {
            type: 'info',
            icon: 'fas fa-lightbulb',
            title: 'Commodity Concentration',
            text: 'Top 3 SITC categories represent 65% of total exports, suggesting potential diversification opportunities.'
        },
        {
            type: 'success',
            icon: 'fas fa-chart-line',
            title: 'Positive Momentum',
            text: 'Recent quarters show improving export performance with 12% QoQ growth in Q4 2024.'
        }
    ];
}

function generateTimeSeriesData(data) {
    return {
        labels: ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'],
        datasets: [{
            label: 'Exports',
            data: [368, 454, 350, 353, 401, 509, 627, 626, 458],
            borderColor: '#00A1F1',
            backgroundColor: 'rgba(0, 161, 241, 0.1)',
            tension: 0.4
        }]
    };
}

function generateSeasonalData(data) {
    return {
        labels: ['2023Q1', '2023Q2', '2023Q3', '2023Q4', '2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1'],
        datasets: [
            {
                label: 'Trend',
                data: [380, 420, 400, 440, 460, 500, 520, 540, 480],
                borderColor: '#1e40af',
                tension: 0.4
            },
            {
                label: 'Seasonal',
                data: [10, -15, 20, -15, 10, -15, 20, -15, 10],
                borderColor: '#16a34a',
                tension: 0.4
            }
        ]
    };
}

function generateCorrelationData(data) {
    return {
        matrix: {
            exports: { imports: 0.87, trade_balance: -0.45 },
            imports: { exports: 0.87, trade_balance: -0.78 },
            trade_balance: { exports: -0.45, imports: -0.78 }
        }
    };
}

async function compareModels(data, models, forecastHorizon) {
    // Simulate model comparison
    const modelResults = models.map(model => ({
        model: model,
        accuracy: 85 + Math.random() * 10,
        mape: 3 + Math.random() * 3,
        trainingTime: 1 + Math.random() * 3,
        forecast: Array.from({length: forecastHorizon}, () => Math.round(400 + Math.random() * 200))
    }));

    // Sort by accuracy
    return modelResults.sort((a, b) => b.accuracy - a.accuracy);
}

function generateExportData(predictionData, format) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trade_prediction_${timestamp}.${format}`;

    return {
        filename: filename,
        format: format,
        size: '45KB',
        url: `/downloads/${filename}`
    };
}

// Helper functions for file analysis
function analyzeColumns(headers, dataRows) {
    const analysis = {};

    headers.forEach((header, index) => {
        const columnData = dataRows.map(row => row[index]).filter(val => val !== null && val !== undefined && val !== '');
        const sampleValues = columnData.slice(0, 5);

        // Detect data type
        let dataType = 'string';
        if (columnData.every(val => typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val)))) {
            dataType = 'number';
        } else if (columnData.every(val => !isNaN(Date.parse(val)))) {
            dataType = 'date';
        }

        analysis[header] = {
            dataType: dataType,
            uniqueValues: new Set(columnData).size,
            nullCount: dataRows.length - columnData.length,
            sampleValues: sampleValues
        };
    });

    return analysis;
}

function calculateBasicStats(dataRows, headers) {
    const stats = {
        totalRows: dataRows.length,
        totalColumns: headers.length,
        completeness: 0,
        numericColumns: 0
    };

    let totalCells = 0;
    let filledCells = 0;

    headers.forEach((header, index) => {
        const columnData = dataRows.map(row => row[index]);
        const numericData = columnData.filter(val => typeof val === 'number' && !isNaN(val));

        if (numericData.length > 0) {
            stats.numericColumns++;
        }

        columnData.forEach(val => {
            totalCells++;
            if (val !== null && val !== undefined && val !== '') {
                filledCells++;
            }
        });
    });

    stats.completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

    return stats;
}

function detectTimeRange(dataRows, headers) {
    // Look for date columns and determine time range
    const dateColumns = headers.filter(header =>
        header.toLowerCase().includes('date') ||
        header.toLowerCase().includes('time') ||
        header.toLowerCase().includes('period') ||
        header.toLowerCase().includes('quarter')
    );

    if (dateColumns.length === 0) return 'Unknown';

    // Try to find min/max dates
    const dateIndex = headers.indexOf(dateColumns[0]);
    const dates = dataRows.map(row => row[dateIndex]).filter(date => date);

    if (dates.length === 0) return 'Unknown';

    // Simple date detection - could be enhanced
    const sortedDates = dates.sort();
    return `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
}

function calculateMissingValues(dataRows) {
    let missingCount = 0;
    let totalCells = 0;

    dataRows.forEach(row => {
        row.forEach(cell => {
            totalCells++;
            if (cell === null || cell === undefined || cell === '') {
                missingCount++;
            }
        });
    });

    return missingCount;
}

function calculateDataQuality(dataRows, headers) {
    const quality = {
        completeness: 0,
        consistency: 0,
        validity: 0
    };

    // Calculate completeness
    const totalCells = dataRows.length * headers.length;
    const filledCells = dataRows.reduce((sum, row) =>
        sum + row.filter(cell => cell !== null && cell !== undefined && cell !== '').length, 0);
    quality.completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

    // Simple consistency check (could be enhanced)
    quality.consistency = 95; // Placeholder

    // Simple validity check
    quality.validity = 92; // Placeholder

    return quality;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;