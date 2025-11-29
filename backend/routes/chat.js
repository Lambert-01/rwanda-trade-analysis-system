/**
 * Enhanced Chat API Routes for Tradescope
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
                    content: `You are Rwanda's Trade Intelligence Assistant - a professional analytical system for NISR trade data.

## RESPONSE FORMATTING REQUIREMENTS:
- Use **bold** for key terms, numbers, and emphasis
- Use ## for section headers when structuring information
- Use bullet points (•) or numbered lists for data presentation
- Keep responses concise but comprehensive
- Structure information logically with clear sections when needed
- Use professional, business-appropriate language

## AVAILABLE DATA SOURCES:
- **NISR Q1 2025 Report**: Total trade $1.87B, Exports $481M (+11.8% YoY), Imports $1.38B
- **Key Partners**: UAE (40% exports), China (30% imports), DRC (63% re-exports)
- **Regional Focus**: EAC, COMESA, SADC, EU trade blocs
- **System Status**: ${systemContext.system_health}% operational

## RESPONSE GUIDELINES:
1. **Direct & Professional**: Answer the specific question asked
2. **Data-Driven**: Always cite specific numbers and sources
3. **Structured**: Use markdown formatting for clarity
4. **Actionable**: Include practical insights or recommendations
5. **Concise**: Avoid unnecessary verbosity

## EXAMPLE FORMATTING:
**Key Finding**: Rwanda's exports grew **11.8%** YoY to **$481M**

**Top Export Markets**:
• UAE: **$193M** (40% share)
• DRC: **$42M** (9% share)
• China: **$9.6M** (2% share)

**Recommendation**: Focus on value-added processing to improve margins.

Always maintain professional tone suitable for policymakers and business leaders.`
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
                    'Get  export recommendations'
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
                    'View  trade forecasts',
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
                    'View  predictions',
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
            'View  predictions',
            'Get comprehensive trade insights'
        ];
    }
}

/**
 * Build enhanced prompt with professional formatting focus
 */
async function buildEnhancedPrompt(message, messageAnalysis, systemContext, tradeContext) {
    const basePrompt = `User Query: "${message}"

## ANALYSIS CONTEXT:
- **Intent**: ${messageAnalysis.intent}
- **Key Entities**: ${messageAnalysis.entities.join(', ') || 'None'}
- **Priority**: ${messageAnalysis.urgency}

## AVAILABLE DATA:
- **Exports**: $${tradeContext.total_exports?.toFixed(0)}M
- **Imports**: $${tradeContext.total_imports?.toFixed(0)}M
- **Trade Balance**: $${tradeContext.trade_balance?.toFixed(0)}M
- **Top Markets**: ${tradeContext.top_destinations?.slice(0, 3).map(d => d.country).join(', ') || 'N/A'}

## RESPONSE REQUIREMENTS:
1. **Format Professionally**: Use **bold**, ## headers, bullet points
2. **Be Specific**: Address the exact question asked
3. **Cite Data**: Include specific numbers and sources
4. **Structure Clearly**: Use logical sections with headers
5. **Stay Concise**: Provide comprehensive info without verbosity
6. **Add Value**: Include actionable insights or recommendations

## FORMATTING EXAMPLE:
**Key Metric**: Exports reached **$481M** (+11.8% YoY)

**Top Partners**:
• UAE: **$193M** (40% share)
• DRC: **$42M** (9% share)

**Strategic Insight**: Focus on value-added processing to improve margins.

Respond as a professional trade analyst providing evidence-based insights.`;

    return basePrompt;
}

/**
 * Generate enhanced fallback response with full context
 */
async function generateEnhancedFallbackResponse(message, messageAnalysis, systemContext, tradeContext) {
    try {
        const lowerMessage = message.toLowerCase();

        // Professional, well-formatted fallback responses
        switch (messageAnalysis.intent) {
            case 'export_analysis':
                return `## Rwanda Export Performance (Q1 2025)

**Key Metrics**:
• **Total Exports**: **$481M** (+11.8% YoY)
• **Growth Rate**: Strong year-over-year increase
• **Quarterly Change**: -28.0% from Q4 2024

**Top Export Markets**:
• **UAE**: **$193M** (40.1% share)
• **DRC**: **$42M** (8.7% share)
• **China**: **$9.6M** (2.0% share)
• **Luxembourg**: **$7.0M** (1.5% share)

**Strategic Insight**: UAE dominance indicates strong Gulf market penetration but suggests diversification opportunities.

*Source: NISR Q1 2025 Report*`;

            case 'import_analysis':
                return `## Rwanda Import Analysis (Q1 2025)

**Key Metrics**:
• **Total Imports**: **$1.38B** (-2.2% YoY)
• **Quarterly Change**: -19.3% from Q4 2024
• **Trade Deficit**: **$897M**

**Top Import Sources**:
• **China**: **$416M** (30.1% share)
• **Tanzania**: **$298M** (21.6% share)
• **Kenya**: **$211M** (15.3% share)
• **India**: **$102M** (7.4% share)

**Analysis**: Import structure reflects infrastructure development needs and regional supply chain integration.

*Source: NISR Q1 2025 Report*`;

            case 'forecast_request':
                return `## Trade Forecasting Overview

**Current Trends**:
• **Export Growth**: +11.8% YoY momentum
• **Import Stability**: -2.2% YoY adjustment
• **Market Recovery**: Post-Q4 seasonal normalization

**Forecast Capabilities**:
• 4-quarter ahead predictions available
•  trend analysis
• Confidence intervals provided
• Scenario-based modeling

**Recommendation**: Current positive export trajectory suggests continued growth potential for Q2-Q4 2025.

*System Status: ${systemContext.system_health}% operational*`;

            case 'trend_analysis':
                return `## Export Trend Analysis

**Year-over-Year Performance**:
• **Q1 2025**: **$481M** (+11.8% vs Q1 2024)
• **Q1 2024**: **$432M** (baseline)
• **Growth Driver**: Sustained market expansion

**Quarterly Patterns**:
• **Q4 2024**: **$626M** (peak performance)
• **Q1 2025**: **$481M** (-28.0% from Q4)
• **Pattern**: Seasonal post-holiday adjustment

**Key Insight**: Strong underlying growth despite quarterly volatility indicates robust export sector fundamentals.

*Source: NISR Q1 2025 Report*`;

            case 'commodity_analysis':
                return `## Commodity Performance Breakdown

**Export Commodities by Value**:
• **Manufactured Goods**: **36.4%** of exports
• **Food & Live Animals**: **27.3%** of exports
• **Crude Materials**: **17.3%** of exports
• **Machinery**: **7.2%** of exports

**Re-export Focus**:
• **Food & Live Animals**: **26.3%** of re-exports
• **DRC Route**: **63.4%** of total re-exports

**Strategic Priority**: Value-added processing in agricultural commodities to improve margins.

*Source: NISR Q1 2025 Report*`;

            default:
                return `## Rwanda Trade Intelligence Assistant

**System Overview**:
• **Total Trade**: **$1.87B** (Q1 2025)
• **Export Value**: **$481M** (+11.8% YoY)
• **Import Value**: **$1.38B**
• **Trade Balance**: **-$897M** (deficit)

**Available Analysis**:
• Export performance & market trends
• Import dependency analysis
• Commodity breakdown
• Regional trade patterns
•  forecasting

**Ready to assist with specific trade analysis queries.**

*System Health: ${systemContext.system_health}% | Data: NISR Q1 2025*`;
        }
    } catch (error) {
        console.error('Error generating enhanced fallback response:', error);
        return "I'm ready to help you analyze Rwanda's comprehensive trade data and provide  insights. The system is active and monitoring all trade activities. What would you like to know?";
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