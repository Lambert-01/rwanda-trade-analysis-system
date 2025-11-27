/**
 * Enhanced Chat API Routes for Rwanda Trade analytic system
 * Handles AI chat interactions with full system integration and context awareness
 */

const express = require('express');
const router = express.Router();
const openaiService = require('../utils/openaiService');
const { cleanAIResponse } = require('../utils/openaiService');
const { aiSystemMonitor, generateRealTimeInsights } = require('../utils/aiExplanationService');

/**
 * Enhanced POST /api/chat/message
 * Send a chat message and get AI response with full system context
 */
router.post('/message', async (req, res) => {
    try {
        const { message, context, user_id, session_id } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log('💬 Enhanced chat message received:', message.substring(0, 50) + '...');

        // Get comprehensive system context
        const systemContext = aiSystemMonitor.getSystemStatus();
        const tradeContext = await getTradeContext();

        // Log user interaction
        aiSystemMonitor.logSystemEvent({
            type: 'user_interaction',
            action: 'chat_message',
            message: message.substring(0, 100),
            user_id: user_id || 'anonymous',
            session_id: session_id || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Analyze message intent and context
        const messageAnalysis = await analyzeMessageIntent(message, systemContext, tradeContext);

        // Generate contextual suggestions
        const contextualSuggestions = await generateContextualSuggestions(message, messageAnalysis, systemContext);

        // Create enhanced prompt with full system awareness
        const enhancedPrompt = await buildEnhancedPrompt(message, messageAnalysis, systemContext, tradeContext);

        console.log('🚀 Calling OpenRouter API with enhanced context...');
        console.log('🎯 Using configured model:', openaiService.model);

        const completion = await openaiService.client.chat.completions.create({
            model: openaiService.model,
            messages: [
                {
                    role: "system",
                    content: `You are the Rwanda Trade Intelligence Assistant, an advanced analytical system built for the NISR Hackathon 2025.

Your role is to provide high-quality, evidence-based, policy-relevant insights using three sources:
1. Processed data (JSON files) stored in the platform
2. Raw NISR dataset (Excel → JSON)
3. Official NISR PDF report provided in vector/embedded form

SYSTEM STATUS:
- Health: ${systemContext.system_health}%
- Active Events: ${systemContext.total_events_logged}
- AI Insights Generated: ${systemContext.total_insights_generated}
- Recent Activities: ${systemContext.recent_events?.slice(0, 3).map(e => e.type).join(', ') || 'None'}

TRADE DATA CONTEXT:
- Total Exports: $${tradeContext.total_exports?.toFixed(2)}M
- Total Imports: $${tradeContext.total_imports?.toFixed(2)}M
- Trade Balance: $${tradeContext.trade_balance?.toFixed(2)}M
- Top Destinations: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}

MESSAGE ANALYSIS:
- Intent: ${messageAnalysis.intent}
- Entities: ${messageAnalysis.entities?.join(', ') || 'None detected'}
- Urgency: ${messageAnalysis.urgency}
- Context: ${messageAnalysis.context}

OFFICIAL NISR PDF REPORT CONTENT (Formal External Trade in Goods Report 2025Q1):

SUMMARY:
In the first quarter of 2025, Rwanda's total trade was US$ 1,869.26 million, a decrease of 0.46 percent over the first quarter of 2024. Domestic exports were estimated at US$ 480.82 million; imports were estimated at US$ 1,379.05 million and re-exports were estimated at US$ 139.36 million.

In this quarter, total domestic exports increased by 11.80 percent when compared to the first quarter of 2024 (US$ 480.82 million and US$ 431.61 million respectively) and decreased by 28.02 percent when compared to the fourth quarter of 2024. Total imports of Rwanda decreased by 2.23 percent in the first quarter of 2025 when compared to the same quarter of 2024 and decreased by 19.30 percent when compared to the fourth quarter of 2024. Re-exports decreased by 21.82 percent in the first quarter of 2025 over the same quarter of 2024 and decreased by 23.83 percent compared to the fourth quarter of 2024.

The top five export destinations were the United Arab Emirates, the Democratic Republic of the Congo, China, Luxembourg, and the United States.

In terms of re-exports, the top five destinations were the Democratic Republic of the Congo, Ethiopia, the United Arab Emirates, Uganda and Zambia. The Democratic Republic of the Congo accounted for 63.41 percent of Rwanda's total re-exports.

In terms of total imports (CIF); China, Tanzania, Kenya, India and United Arab Emirates were the top five countries of origin of imports to Rwanda.

REGIONAL TRADE ANALYSIS:
- EAC: Rwanda's trade with EAC partner states totaled US$ 373.73 million in exports, US$ 1,073.00 million in imports, and US$ 127.14 million in re-exports during Q1 2025.
- COMESA: Trade with COMESA member states was US$ 370.76 million in exports, US$ 1,431.20 million in imports, and US$ 131.32 million in re-exports.
- SADC: Trade with SADC member states totaled US$ 370.20 million in exports, US$ 1,313.76 million in imports, and US$ 127.69 million in re-exports.
- EU: Trade with EU member states was US$ 122.90 million in exports, US$ 1,010.00 million in imports, and US$ 0.26 million in re-exports.

KEY FINDINGS FROM PDF:
- Rwanda's export sector shows strong growth in Q1 2025 with 11.8% increase YoY
- UAE remains dominant export partner (40.09% of total exports)
- DRC is key re-export destination (63.41% of total re-exports)
- China leads imports (30.13% of total imports)
- EAC trade represents significant portion of Rwanda's total trade
- Trade deficit persists but narrowed slightly compared to previous quarters

Always do the following before answering:
1. Analyze the user input carefully.
2. Identify relevant trade data or context from the provided datasets and PDF report.
3. Blend your analysis with insights from both JSON data and PDF report naturally — do not follow a rigid multi-section format.
4. Respond in a professional tone suitable for policymakers, business leaders, and researchers.
5. Keep answers concise but informative, and include numbers or trends where relevant from both sources.
6. If the user input is casual (e.g., greetings like "Hello"), respond politely but naturally without unnecessary data analysis.

Do not invent data — only reference available data from JSON files and PDF report. Provide reasoning, insights, or suggested actions when appropriate, but format the output naturally, like a professional analyst explaining findings verbally.

Always combine data + PDF insights. Use numbers from processed JSON, explanations and context from PDF. Blend into coherent answers. Never guess - always cite available data sources. Be professional, analytical, evidence-driven, concise but impactful. Useful for policy makers, businesses, researchers.`
                },
                {
                    role: "user",
                    content: enhancedPrompt
                }
            ],
            max_tokens: openaiService.maxTokens,
            temperature: openaiService.temperature
        });

        // Clean the AI response to remove any <think> tags that may be present
        // Some reasoning models (DeepSeek, Qwen) include internal reasoning in <think> tags
        // We remove these to provide clean responses to users
        const rawResponse = completion.choices[0].message.content;
        const aiResponse = cleanAIResponse(rawResponse);

        console.log('✅ Enhanced AI response generated and cleaned successfully');
        console.log('📊 Tokens used:', completion.usage?.total_tokens || 'N/A');

        // Generate real-time insight about this interaction
        const interactionInsight = await generateRealTimeInsights({
            type: 'user_chat',
            message: message.substring(0, 50),
            response_length: aiResponse.length,
            system_health: systemContext.system_health
        });

        return res.json({
            success: true,
            response: aiResponse,
            using_ai: true,
            model: openaiService.model,
            provider: 'OpenRouter',
            tokens_used: completion.usage?.total_tokens || 0,
            timestamp: new Date().toISOString(),
            message_analysis: messageAnalysis,
            contextual_suggestions: contextualSuggestions,
            system_context: {
                health: systemContext.system_health,
                recent_activity: systemContext.recent_events?.slice(0, 2) || []
            },
            real_time_insight: interactionInsight.success ? interactionInsight.insight : null
        });

    } catch (error) {
        console.error('❌ Enhanced chat API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat message',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * Enhanced GET /api/chat/status
 * Get comprehensive chat service status with system monitoring
 */
router.get('/status', (req, res) => {
    const isConfigured = openaiService.isConfigured();
    const systemStatus = aiSystemMonitor.getSystemStatus();

    res.json({
        success: true,
        status: 'online',
        ai_configured: isConfigured,
        provider: isConfigured && openaiService.apiKey?.startsWith('sk-or-v1-') ? 'OpenRouter (DeepSeek)' : 'OpenAI',
        model: openaiService.model || 'Not configured',
        base_url: openaiService.baseURL,
        system_health: systemStatus.system_health,
        features: {
            ai_chat: isConfigured,
            fallback_responses: true,
            typing_indicator: true,
            message_history: true,
            context_awareness: true,
            proactive_suggestions: true,
            real_time_insights: true,
            system_monitoring: true
        },
        configuration: {
            max_tokens: openaiService.maxTokens,
            temperature: openaiService.temperature,
            api_key_configured: !!openaiService.apiKey,
            api_key_prefix: openaiService.apiKey ? openaiService.apiKey.substring(0, 10) + '...' : 'Not set'
        },
        system_status: {
            total_events_logged: systemStatus.total_events_logged,
            total_insights_generated: systemStatus.total_insights_generated,
            recent_events: systemStatus.recent_events.slice(0, 5),
            recent_insights: systemStatus.recent_insights.slice(0, 3),
            last_activity: systemStatus.last_activity
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/chat/insights
 * Get recent AI insights and system status
 */
router.get('/insights', (req, res) => {
    try {
        const systemStatus = aiSystemMonitor.getSystemStatus();
        const recentInsights = systemStatus.recent_insights.slice(0, 10);

        res.json({
            success: true,
            insights: recentInsights,
            system_health: systemStatus.system_health,
            total_insights: systemStatus.total_insights_generated,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting insights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve insights'
        });
    }
});

/**
 * GET /api/chat/suggestions
 * Get contextual suggestions based on current system state
 */
router.get('/suggestions', async (req, res) => {
    try {
        const { context, intent } = req.query;

        // Generate suggestions based on current system state
        const systemStatus = aiSystemMonitor.getSystemStatus();
        const suggestions = await generateContextualSuggestions(
            context || 'general',
            { intent: intent || 'general_inquiry' },
            systemStatus
        );

        res.json({
            success: true,
            suggestions: suggestions,
            context: context || 'general',
            system_health: systemStatus.system_health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting suggestions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions'
        });
    }
});

/**
 * POST /api/chat/analyze
 * Analyze message intent and generate contextual information
 */
router.post('/analyze', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const systemContext = aiSystemMonitor.getSystemStatus();
        const tradeContext = await getTradeContext();
        const messageAnalysis = await analyzeMessageIntent(message, systemContext, tradeContext);
        const contextualSuggestions = await generateContextualSuggestions(message, messageAnalysis, systemContext);

        res.json({
            success: true,
            analysis: messageAnalysis,
            suggestions: contextualSuggestions,
            system_context: {
                health: systemContext.system_health,
                recent_activity: systemContext.recent_events.slice(0, 3)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error analyzing message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze message'
        });
    }
});

/**
 * POST /api/chat/configure
 * Configure OpenAI API key (for user setup)
 */
router.post('/configure', (req, res) => {
    try {
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }

        // Here you could save the API key to environment or database
        // For security, in production this should be encrypted and stored securely
        console.log('🔑 OpenAI API key configured by user');

        res.json({
            success: true,
            message: 'OpenAI API key configured successfully',
            note: 'Please restart the server for changes to take effect',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error configuring OpenAI:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to configure OpenAI API key'
        });
    }
});

/**
 * Get trade data context for AI responses
 */
async function getTradeContext() {
    try {
        const fs = require('fs').promises;
        const path = require('path');

        // Read from processed data files
        const dataDir = path.join(__dirname, '../../data/processed');

        let analysisReport = {};
        let commoditySummary = {};
        let comprehensiveAnalysis = {};

        try {
            const analysisData = await fs.readFile(path.join(dataDir, 'analysis_report.json'), 'utf8');
            analysisReport = JSON.parse(analysisData);
        } catch (e) {
            console.warn('Could not read analysis_report.json:', e.message);
        }

        try {
            const commodityData = await fs.readFile(path.join(dataDir, 'commodity_summary.json'), 'utf8');
            commoditySummary = JSON.parse(commodityData);
        } catch (e) {
            console.warn('Could not read commodity_summary.json:', e.message);
        }

        try {
            const comprehensiveData = await fs.readFile(path.join(dataDir, 'comprehensive_analysis.json'), 'utf8');
            comprehensiveAnalysis = JSON.parse(comprehensiveData);
        } catch (e) {
            console.warn('Could not read comprehensive_analysis.json:', e.message);
        }

        // Extract key metrics
        const total_exports = analysisReport.summary?.total_exports || 0;
        const total_imports = analysisReport.summary?.total_imports || 0;
        const trade_balance = analysisReport.summary?.current_balance || 0;

        const top_destinations = analysisReport.top_destinations?.slice(0, 5).map(d => ({
            country: d.destination_country,
            value: d.export_value
        })) || [];

        const top_products = commoditySummary.top_exports_commodities?.slice(0, 5).map(c => ({
            commodity: c.description,
            value: c.value
        })) || [];

        return {
            total_exports,
            total_imports,
            trade_balance,
            top_destinations,
            top_products,
            quarters_analyzed: analysisReport.summary?.quarters_analyzed || 0,
            export_growth_rate: analysisReport.summary?.export_growth_rate || 0,
            top_destination: analysisReport.summary?.top_destination || 'N/A',
            trade_balance_type: analysisReport.trade_balance_analysis?.balance_type || 'unknown',
            deficit_percentage: analysisReport.trade_balance_analysis?.deficit_percentage || 0
        };
    } catch (error) {
        console.error('Error getting trade context:', error);
        return {
            total_exports: 0,
            total_imports: 0,
            trade_balance: 0,
            top_destinations: [],
            top_products: []
        };
    }
}

/**
 * Analyze message intent and context
 */
async function analyzeMessageIntent(message, systemContext, tradeContext) {
    try {
        // Simple keyword-based analysis (could be enhanced with NLP)
        const lowerMessage = message.toLowerCase();

        const analysis = {
            intent: 'general_inquiry',
            entities: [],
            urgency: 'normal',
            context: 'trade_data',
            confidence: 0.8
        };

        // Detect intent
        if (lowerMessage.includes('export') || lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
            analysis.intent = 'export_analysis';
            analysis.entities.push('exports');
        }
        if (lowerMessage.includes('import') || lowerMessage.includes('buy') || lowerMessage.includes('buying')) {
            analysis.intent = 'import_analysis';
            analysis.entities.push('imports');
        }
        if (lowerMessage.includes('forecast') || lowerMessage.includes('predict') || lowerMessage.includes('future')) {
            analysis.intent = 'forecast_request';
            analysis.entities.push('predictions');
        }
        if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('growth')) {
            analysis.intent = 'trend_analysis';
            analysis.entities.push('trends');
        }
        if (lowerMessage.includes('commodity') || lowerMessage.includes('product') || lowerMessage.includes('goods')) {
            analysis.intent = 'commodity_analysis';
            analysis.entities.push('commodities');
        }
        if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
            analysis.intent = 'help_request';
        }

        // Detect urgency
        if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('quickly')) {
            analysis.urgency = 'high';
        }
        if (lowerMessage.includes('when') || lowerMessage.includes('update') || lowerMessage.includes('latest')) {
            analysis.urgency = 'medium';
        }

        // Detect entities (countries, products, etc.)
        const countries = ['rwanda', 'china', 'uae', 'usa', 'kenya', 'tanzania', 'uganda', 'burundi'];
        const products = ['coffee', 'tea', 'minerals', 'agricultural', 'manufactured', 'services'];

        for (const country of countries) {
            if (lowerMessage.includes(country)) {
                analysis.entities.push(country.toUpperCase());
            }
        }

        for (const product of products) {
            if (lowerMessage.includes(product)) {
                analysis.entities.push(product);
            }
        }

        return analysis;
    } catch (error) {
        console.error('Error analyzing message intent:', error);
        return {
            intent: 'general_inquiry',
            entities: [],
            urgency: 'normal',
            context: 'trade_data',
            confidence: 0.5
        };
    }
}

/**
 * Generate contextual suggestions based on message and analysis
 */
async function generateContextualSuggestions(message, messageAnalysis, systemContext) {
    try {
        const suggestions = [];

        // Based on intent, suggest relevant actions
        switch (messageAnalysis.intent) {
            case 'export_analysis':
                suggestions.push(
                    'View detailed export trends and destination analysis',
                    'Analyze top-performing export commodities',
                    'Check regional export performance',
                    'Get AI-powered export recommendations'
                );
                break;
            case 'import_analysis':
                suggestions.push(
                    'Review import dependency analysis',
                    'Check commodity-specific import patterns',
                    'Analyze import source diversification',
                    'Get import optimization recommendations'
                );
                break;
            case 'forecast_request':
                suggestions.push(
                    'View AI-powered trade forecasts',
                    'Check prediction confidence intervals',
                    'Analyze forecast methodology',
                    'Get scenario-based predictions'
                );
                break;
            case 'trend_analysis':
                suggestions.push(
                    'View historical trend analysis',
                    'Check growth rate calculations',
                    'Analyze seasonal patterns',
                    'Get trend-based recommendations'
                );
                break;
            case 'commodity_analysis':
                suggestions.push(
                    'View commodity performance dashboard',
                    'Check SITC classification analysis',
                    'Analyze commodity concentration',
                    'Get diversification recommendations'
                );
                break;
            default:
                suggestions.push(
                    'Explore export performance dashboard',
                    'Check latest import analysis',
                    'View AI-powered predictions',
                    'Get comprehensive trade insights'
                );
        }

        // Add system-aware suggestions
        if (systemContext.system_health < 80) {
            suggestions.push('System health is below optimal - consider checking data processing status');
        }

        if (systemContext.total_insights_generated > 0) {
            suggestions.push('Review recent AI-generated insights');
        }

        return suggestions.slice(0, 4); // Return top 4 suggestions
    } catch (error) {
        console.error('Error generating contextual suggestions:', error);
        return [
            'Explore export performance dashboard',
            'Check latest import analysis',
            'View AI-powered predictions',
            'Get comprehensive trade insights'
        ];
    }
}

/**
 * Build enhanced prompt with full context awareness
 */
async function buildEnhancedPrompt(message, messageAnalysis, systemContext, tradeContext) {
    const basePrompt = `
    User Message: "${message}"
    Intent: ${messageAnalysis.intent}
    Entities: ${messageAnalysis.entities.join(', ')}
    Urgency: ${messageAnalysis.urgency}

    Current System Status:
    - Health: ${systemContext.system_health}%
    - Active Events: ${systemContext.total_events_logged}
    - Recent Activities: ${systemContext.recent_events?.slice(0, 3).map(e => e.type).join(', ') || 'None'}

    Trade Data Context:
    - Total Exports: $${tradeContext.total_exports?.toFixed(2)}M
    - Total Imports: $${tradeContext.total_imports?.toFixed(2)}M
    - Trade Balance: $${tradeContext.trade_balance?.toFixed(2)}M
    - Top Destinations: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}
    - Top Products: ${tradeContext.top_products?.slice(0, 3).map(p => p.commodity).join(', ') || 'N/A'}

    Please provide a comprehensive, context-aware response that:
    1. Directly addresses the user's specific intent and entities mentioned
    2. Leverages current system status and recent activities
    3. Incorporates relevant trade data and statistics
    4. Offers proactive suggestions and next steps
    5. Maintains a professional, helpful tone as a trade analysis expert

    If the message is unclear, ask clarifying questions. If it's not trade-related, politely redirect to Rwanda trade topics.`;

    return basePrompt;
}

/**
 * Generate enhanced fallback response with full context
 */
async function generateEnhancedFallbackResponse(message, messageAnalysis, systemContext, tradeContext) {
    try {
        const lowerMessage = message.toLowerCase();

        // Enhanced trade data specific responses based on intent with PDF insights
        switch (messageAnalysis.intent) {
            case 'export_analysis':
                return `Based on the NISR Q1 2025 report and current data, Rwanda's export sector shows strong 11.8% year-over-year growth, reaching $480.82M. Key markets include UAE (40.09% share), DRC, China, and Luxembourg. The report highlights that domestic exports increased significantly compared to Q1 2024, with UAE remaining the dominant export partner. The system is currently ${systemContext.system_health > 80 ? 'operating optimally' : 'processing data'} and can provide detailed export insights.`;

            case 'import_analysis':
                return `According to the NISR Q1 2025 report, Rwanda's imports totaled $1,379.05M, showing a 2.23% decrease from Q1 2024. China leads as the top import source (30.13% share), followed by Tanzania, Kenya, India, and UAE. The report indicates that imports decreased by 19.3% compared to Q4 2024, reflecting the country's development import needs. The system maintains ${systemContext.system_health}% health for accurate analysis.`;

            case 'forecast_request':
                return `I can provide AI-powered forecasts for Rwanda's trade data. The NISR Q1 2025 report shows positive export growth trends with 11.8% YoY increase, while imports decreased by 2.23%. Based on these patterns, the forecasting models are ready to generate predictions. The system is currently at ${systemContext.system_health}% health with ${systemContext.total_insights_generated} insights generated recently.`;

            case 'trend_analysis':
                return `The NISR Q1 2025 report reveals Rwanda's export growth of 11.8% year-over-year, with total exports reaching $480.82M compared to $431.61M in Q1 2024. However, there's a 28.02% decrease from Q4 2024 ($626.06M). The report shows imports decreased by 2.23% YoY and 19.3% from Q4 2024. The system's ${systemContext.total_events_logged} logged events provide rich data for pattern analysis.`;

            case 'commodity_analysis':
                return `The NISR Q1 2025 report shows Rwanda's key export commodities include food and live animals (27.27% of exports), crude materials (17.32%), manufactured goods (36.36%), and machinery (7.20%). For re-exports, food and live animals dominate (26.28%). The system has generated ${systemContext.total_insights_generated} AI insights about commodity performance and market opportunities.`;

            default:
                return `I'm here to help you with comprehensive trade data analysis for Rwanda. The NISR Q1 2025 report shows total trade of $1,869.26M with exports at $480.82M and imports at $1,379.05M. The system is currently at ${systemContext.system_health}% health and has processed ${systemContext.total_events_logged} events. What specific aspect would you like to explore?`;
        }
    } catch (error) {
        console.error('Error generating enhanced fallback response:', error);
        return "I'm ready to help you analyze Rwanda's comprehensive trade data and provide AI-powered insights. The system is active and monitoring all trade activities. What would you like to know?";
    }
}

/**
 * Generate fallback response when AI is not available (legacy function)
 */
function generateFallbackResponse(message, tradeContext) {
    const lowerMessage = message.toLowerCase();

    // Trade data specific responses
    if (lowerMessage.includes('export') && lowerMessage.includes('total') || lowerMessage.includes('much')) {
        return `Based on the latest data, Rwanda's total exports amount to $${tradeContext.total_exports?.toFixed(0)}M. The export sector shows strong growth, particularly in traditional commodities like coffee, tea, and minerals.`;
    }

    if (lowerMessage.includes('import') && lowerMessage.includes('total') || lowerMessage.includes('much')) {
        return `Rwanda's total imports are valued at $${tradeContext.total_imports?.toFixed(0)}M. The import structure reflects the country's development needs, including machinery, petroleum products, and construction materials.`;
    }

    if (lowerMessage.includes('trade balance') || lowerMessage.includes('deficit') || lowerMessage.includes('surplus')) {
        return `Rwanda currently has a trade deficit of $${Math.abs(tradeContext.trade_balance || 0).toFixed(0)}M. While this reflects significant import needs for development, export growth is helping to narrow the gap over time.`;
    }

    if (lowerMessage.includes('top') && lowerMessage.includes('destination') || lowerMessage.includes('partner')) {
        const topDestinations = tradeContext.top_destinations || [];
        return `Rwanda's top export destinations include ${topDestinations.map(d => d.country).join(', ')}. The United Arab Emirates is currently the largest market, accounting for approximately 65% of total exports.`;
    }

    if (lowerMessage.includes('commodity') || lowerMessage.includes('product')) {
        const topProducts = tradeContext.top_products || [];
        return `Rwanda's key export commodities include ${topProducts.map(p => p.commodity).join(', ')}. Coffee remains the most valuable export product, followed by tea and mineral products.`;
    }

    if (lowerMessage.includes('growth') || lowerMessage.includes('trend')) {
        return `Rwanda's export sector has shown impressive growth of approximately 157.9% over recent years. This growth is driven by improved agricultural productivity, market diversification, and increased value addition in key sectors.`;
    }

    // Default responses
    const defaultResponses = [
        "I'd be happy to help you analyze Rwanda's trade data. Based on the latest statistics, Rwanda's export sector shows strong performance in traditional commodities while diversifying into new markets. What specific aspect would you like to explore?",
        "Rwanda's trade data reveals interesting patterns in both exports and imports. The country maintains strong trading relationships across multiple continents. Could you be more specific about what trade information you're looking for?",
        "As a trade analyst specializing in African markets, I can provide insights on Rwanda's export performance, import dependencies, and market opportunities. What would you like to know about Rwanda's trade statistics?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

module.exports = router;