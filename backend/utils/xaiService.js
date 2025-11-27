/**
 * xAI Grok Service for Rwanda Trade analytic system
 * Provides AI-powered insights for analytics sections using xAI Grok 4.1 Fast
 */

const OpenAI = require('openai');

class AIService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-chat-v3-0324:free';
        this.maxTokens = parseInt(process.env.DEEPSEEK_MAX_TOKENS) || 1500;
        this.temperature = parseFloat(process.env.DEEPSEEK_TEMPERATURE) || 0.6;
        this.apiKeyValid = false;

        if (this.apiKey && this.apiKey.startsWith('sk-or-v1-')) {
            // OpenRouter configuration for DeepSeek
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            });
            console.log('🚀 DeepSeek AI service initialized');
            console.log('🎯 Model:', this.model);

            // Test API key validity on initialization
            this.testApiKey();
        } else {
            this.client = null;
            this.apiKeyValid = false;
            console.log('⚠️ No valid DeepSeek API key found - using fallback responses');
            console.log('💡 Add DEEPSEEK_API_KEY to your .env file to enable AI insights');
        }
    }

    /**
     * Check if AI service is properly configured
     */
    isConfigured() {
        return !!(this.apiKey && this.client && this.apiKeyValid);
    }

    /**
     * Test API key validity
     */
    async testApiKey() {
        try {
            console.log('🔑 Testing DeepSeek API key validity...');

            const testCompletion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: "Hello"
                    }
                ],
                max_tokens: 5
            });

            this.apiKeyValid = true;
            console.log('✅ DeepSeek API key is valid');
        } catch (error) {
            console.error('❌ DeepSeek API key test failed:', error.message);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 DeepSeek Authentication failed - API key is invalid or expired');
                console.log('💡 To fix this:');
                console.log('   1. Get a new API key from https://openrouter.ai/keys');
                console.log('   2. Set DEEPSEEK_API_KEY in your .env file');
                console.log('   3. Restart the server after updating .env');
                console.log('   4. Current key starts with:', this.apiKey.substring(0, 20) + '...');
            } else if (error.status === 429) {
                console.log('⚠️ Rate limit exceeded - too many requests');
            } else if (error.status === 403) {
                console.log('🚫 Access forbidden - check API key permissions');
            } else {
                console.log('❓ Unexpected error - check your internet connection and API key');
            }

            console.log('🔄 Switching to fallback mode');
            this.apiKeyValid = false;
            this.client = null;
        }
    }

    /**
     * Generate insights for specific analytics section
     */
    async generateSectionInsights(section, sectionData, pdfContext = '') {
        // Check if AI service is configured
        if (!this.isConfigured()) {
            console.log('🤖 DeepSeek AI not configured, using fallback insights');
            return {
                success: true,
                insights: this.getFallbackInsights(section),
                section: section,
                generated_at: new Date().toISOString(),
                using_fallback: true
            };
        }

        try {
            console.log('🤖 Generating DeepSeek AI insights for section:', section);

            const prompt = this.buildSectionInsightsPrompt(section, sectionData, pdfContext);

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert trade economist and data analyst specializing in African economies, particularly Rwanda. Provide clear, simple, and actionable insights based on trade data. Reference the provided report context and data to explain concepts in easy-to-understand terms. Focus on practical implications and what the data means for Rwanda's economic development."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            // Clean the AI response to remove any <think> tags that may be present
            const rawInsights = completion.choices[0].message.content;
            const insights = cleanAIResponse(rawInsights);
            console.log('✅ Section insights generated successfully');

            return {
                success: true,
                insights: insights,
                section: section,
                generated_at: new Date().toISOString(),
                using_ai: true
            };

        } catch (error) {
            console.error('❌ Error generating section insights:', error);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 DeepSeek Authentication failed - disabling AI features and using fallback');
                console.log('💡 Current API key starts with:', this.apiKey?.substring(0, 20) + '...');
                this.apiKeyValid = false;
                this.client = null;
            } else if (error.status === 429) {
                console.log('⚠️ Rate limit exceeded during insights generation');
            } else if (error.status === 403) {
                console.log('🚫 Access forbidden during insights generation');
            }

            return {
                success: false,
                error: error.message,
                fallback_insights: this.getFallbackInsights(section),
                using_fallback: true,
                debug_info: {
                    api_configured: this.isConfigured(),
                    api_key_valid: this.apiKeyValid,
                    model: this.model,
                    base_url: this.baseURL
                }
            };
        }
    }

    /**
     * Build prompt for section insights
     */
    buildSectionInsightsPrompt(section, sectionData, pdfContext) {
        const baseContext = `Based on the Rwanda Trade Report 2025Q1, analyze the following ${section} data and provide simple, clear insights that help users understand what this means for Rwanda's economy.

Key points from the report:
- Rwanda's total trade in Q1 2025 was US$1.69 billion, down 0.3% from Q4 2024
- Exports totaled US$458.44 million, down 26.8% from Q4 2024
- Imports totaled US$869.79 million, down 89.3% from Q4 2024
- Trade deficit of US$411.35 million in Q1 2025
- UAE remains top export destination with 66.6% share
- China leads imports with 30.1% share
- EAC region shows varying performance across countries

Section Data: ${JSON.stringify(sectionData, null, 2)}

Please provide 3-5 simple, actionable insights that:
1. Explain what the data shows in plain language
2. Reference specific numbers from the data
3. Connect to broader economic implications
4. Suggest what this means for policymakers or businesses
5. Use the report context to support your analysis

Make your insights fresh, practical, and easy to understand - avoid complex jargon.`;

        switch (section) {
            case 'time-series':
                return `${baseContext}

Focus on time series analysis: trends, seasonality, and forecasting. Explain what the slope, R-squared, and forecast values mean in practical terms. What do the stationary/non-stationary tests tell us about Rwanda's trade patterns?`;

            case 'forecasting':
                return `${baseContext}

Focus on trade forecasting: What do the next 4 quarters look like for exports and imports? Explain the forecast methodology and what the predicted values mean for planning. How reliable are these predictions?`;

            case 'growth':
                return `${baseContext}

Focus on growth analysis: Explain QoQ, YoY, and CAGR in simple terms. What do the growth rates tell us about Rwanda's trade performance? Which periods showed the strongest growth and why might that matter?`;

            case 'share':
                return `${baseContext}

Focus on market share analysis: Who are Rwanda's top trading partners? What does market concentration mean for economic risk? How diversified are Rwanda's export markets compared to import sources?`;

            case 'hhi':
                return `${baseContext}

Focus on concentration analysis (HHI): Explain what HHI means in simple terms. What does "highly concentrated market" mean for Rwanda's trade strategy? What are the risks and opportunities identified?`;

            case 'balance':
                return `${baseContext}

Focus on trade balance analysis: Explain the difference between exports and imports. What do deficit drivers tell us about Rwanda's economy? How might structural changes affect the trade balance?`;

            case 'correlation':
                return `${baseContext}

Focus on correlation analysis: What relationships exist between different trade variables? Explain correlation coefficients in practical terms. What do strong/weak relationships mean for policy decisions?`;

            default:
                return `${baseContext}

Provide general insights about this trade data section and its implications for Rwanda's economic development.`;
        }
    }

    /**
     * Get fallback insights when xAI fails
     */
    getFallbackInsights(section) {
        const fallbacks = {
            'time-series': [
                "Time series analysis shows Rwanda's trade patterns over time, revealing both seasonal variations and long-term trends.",
                "The data indicates periods of growth and contraction in both exports and imports, which is normal for developing economies.",
                "Forecasting helps predict future trade values, allowing better planning for businesses and policymakers.",
                "Understanding these patterns can help identify the best times for trade activities and policy interventions."
            ],
            'forecasting': [
                "Trade forecasting uses historical data to predict future export and import values for the next four quarters.",
                "These predictions help businesses plan inventory and investment decisions based on expected market conditions.",
                "The forecast considers seasonal patterns and trends to provide realistic expectations for trade performance.",
                "Policymakers can use these insights to prepare economic policies that support trade growth during predicted slowdowns."
            ],
            'growth': [
                "Growth analysis shows how Rwanda's trade values change from quarter to quarter and year to year.",
                "Quarter-over-quarter growth reveals short-term trends, while year-over-year shows longer-term performance.",
                "Compound Annual Growth Rate (CAGR) provides a smooth measure of overall growth over multiple periods.",
                "Understanding growth patterns helps identify successful strategies and areas needing improvement."
            ],
            'share': [
                "Market share analysis reveals which countries are most important for Rwanda's exports and imports.",
                "The UAE dominates Rwanda's exports, showing both opportunity and risk in this key market relationship.",
                "China leads imports, indicating Rwanda's integration into global supply chains through this major trading partner.",
                "Diversification across multiple markets can reduce economic risks and create more stable trade relationships."
            ],
            'hhi': [
                "The Herfindahl-Hirschman Index (HHI) measures how concentrated Rwanda's trade is among different partners.",
                "High concentration means Rwanda depends heavily on a few key markets, which can be risky but also efficient.",
                "Understanding concentration helps policymakers balance the benefits of specialization with the need for diversification.",
                "Risk assessment identifies potential vulnerabilities in Rwanda's trade network that could affect economic stability."
            ],
            'balance': [
                "Trade balance shows the difference between what Rwanda earns from exports and spends on imports.",
                "A deficit means Rwanda imports more than it exports, which is common for developing countries building infrastructure.",
                "Understanding deficit drivers helps identify which imports are most important and where domestic production might be possible.",
                "Structural analysis reveals long-term patterns that can inform economic development strategies."
            ],
            'correlation': [
                "Correlation analysis shows relationships between different aspects of Rwanda's trade data.",
                "Strong correlations indicate variables that tend to move together, helping predict economic outcomes.",
                "Understanding these relationships can improve forecasting and policy decision-making.",
                "Key relationships reveal important connections between trade variables that affect Rwanda's economy."
            ]
        };
        return fallbacks[section] || [
            "This analysis provides valuable insights into Rwanda's trade patterns and economic performance.",
            "The data helps identify trends, opportunities, and challenges in Rwanda's international trade relationships.",
            "Understanding these patterns supports better decision-making for economic development and trade policy."
        ];
    }
}

// Create singleton instance
const aiService = new AIService();

// Import cleanAIResponse function
const { cleanAIResponse } = require('./openaiService');

module.exports = aiService;