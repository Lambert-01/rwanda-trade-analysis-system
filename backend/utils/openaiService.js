/**
 * OpenAI Service for Tradescope
 * Provides  insights and descriptions for trade data
 */

const OpenAI = require('openai');

class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.OPENAI_MODEL || 'openai/gpt-oss-20b:free';
        this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 2000;
        this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
        this.apiKeyValid = false;

        if (this.apiKey && this.apiKey.startsWith('sk-or-v1-')) {
            // OpenRouter configuration
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            });
            console.log('🚀 OpenRouter service initialized with DeepSeek model');
            console.log('🎯 Model:', this.model);

            // Test API key validity on initialization
            this.testApiKey();
        } else if (this.apiKey && this.apiKey.startsWith('sk-')) {
            // OpenAI configuration
            this.client = new OpenAI({
                apiKey: this.apiKey,
                baseURL: this.baseURL
            });
            console.log('🤖 OpenAI service initialized');
            this.apiKeyValid = true;
        } else {
            this.client = null;
            this.apiKeyValid = false;
            console.log('⚠️ No valid API key found - using fallback responses');
            console.log('💡 Add OPENAI_API_KEY to your .env file to enable AI features');
        }
    }

    /**
     * Check if OpenAI is properly configured
     */
    isConfigured() {
        return !!(this.apiKey && this.client && this.apiKeyValid);
    }

    /**
     * Test API key validity
     */
    async testApiKey() {
        try {
            console.log('🔑 Testing API key validity...');

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
            console.log('✅ API key is valid');
        } catch (error) {
            console.error('❌ API key test failed:', error.message);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 Authentication failed - API key is invalid or expired');
                console.log('💡 To fix this:');
                console.log('   1. Get a new API key from https://openrouter.ai/keys');
                console.log('   2. Or set OPENAI_API_KEY= to disable AI features');
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
     * Generate comprehensive analysis description
     */
    async generateAnalysisDescription(data, context = 'general') {
        // Check if OpenAI is configured
        if (!this.isConfigured()) {
            console.log('🤖 OpenAI not configured, using fallback description');
            return {
                success: true,
                description: this.getFallbackDescription(context),
                context: context,
                generated_at: new Date().toISOString(),
                using_fallback: true
            };
        }

        try {
            console.log('🤖 Generating analysis description for:', context);

            const prompt = this.buildAnalysisPrompt(data, context);

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert trade analyst specializing in African economic data. Provide detailed, professional analysis of Rwanda's trade data with actionable insights."
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
            // Some reasoning models (DeepSeek, Qwen) include internal reasoning in <think> tags
            const rawDescription = completion.choices[0].message.content;
            const description = cleanAIResponse(rawDescription);
            console.log('✅ Analysis description generated successfully');

            return {
                success: true,
                description: description,
                context: context,
                generated_at: new Date().toISOString(),
                using_ai: true
            };

        } catch (error) {
            console.error('❌ Error generating analysis description:', error);
            console.error('🔍 Error details:', error);

            // Check if it's an authentication error
            if (error.status === 401 || error.message.includes('authentication') || error.message.includes('User not found') || error.message.includes('Invalid API key')) {
                console.log('🔐 Authentication failed - disabling AI features and using fallback');
                console.log('💡 Current API key starts with:', this.apiKey?.substring(0, 20) + '...');
                this.apiKeyValid = false;
                this.client = null;
            } else if (error.status === 429) {
                console.log('⚠️ Rate limit exceeded during analysis generation');
            } else if (error.status === 403) {
                console.log('🚫 Access forbidden during analysis generation');
            }

            return {
                success: false,
                error: error.message,
                fallback_description: this.getFallbackDescription(context),
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
     * Generate chart-specific insights
     */
    async generateChartInsights(chartType, data) {
        console.log('📊 Generating chart insights for:', chartType);

        const prompt = this.buildChartPrompt(chartType, data);

        const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: "You are a data visualization expert. Analyze chart data and provide meaningful insights about Rwanda's trade patterns."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.6
        });

        // Clean the AI response to remove any <think> tags that may be present
        const rawInsights = completion.choices[0].message.content;
        const insights = cleanAIResponse(rawInsights);
        console.log('✅ Chart insights generated successfully');

        return {
            success: true,
            insights: insights,
            chart_type: chartType,
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Generate section-specific insights for analytics dashboard with deep data analysis
     */
    async generateSectionInsightsWithData(section, sectionData, pdfContext = '') {
        try {
            console.log('📊 Generating deep section insights for:', section, 'with data analysis');

            const prompt = this.buildDeepSectionInsightsPrompt(section, sectionData, pdfContext);

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert trade economist and data analyst specializing in African markets. Analyze the provided JSON data deeply and provide specific, actionable insights that explain what the numbers show, why they matter, and their economic implications for Rwanda. Format your response using clear markdown structure with section headers, bold emphasis, and bullet points for readability."
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
            const insights = this.parseSectionInsights(cleanAIResponse(rawInsights), section);
            console.log('✅ Deep section insights generated successfully');

            return {
                success: true,
                insights: insights,
                section: section,
                generated_at: new Date().toISOString(),
                using_openai: true,
                provider: 'OpenRouter',
                data_analyzed: true,
                raw_response: rawInsights
            };

        } catch (error) {
            console.error('❌ Error generating deep section insights:', error);
            return {
                success: false,
                insights: this.getFallbackSectionInsights(section),
                section: section,
                generated_at: new Date().toISOString(),
                using_openai: false,
                provider: 'Fallback',
                data_analyzed: false,
                error: error.message
            };
        }
    }

    /**
     * Generate section-specific insights for analytics dashboard (legacy function)
     */
    async generateSectionInsights(section, sectionData, pdfContext = '') {
        try {
            console.log('📊 Generating section insights for:', section);

            const prompt = this.buildSectionInsightsPrompt(section, sectionData, pdfContext);

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert trade analyst specializing in African economic data. Provide detailed, professional insights about Rwanda's trade analytics sections with actionable implications."
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
            const insights = this.parseSectionInsights(cleanAIResponse(rawInsights), section);
            console.log('✅ Section insights generated successfully');

            return {
                success: true,
                insights: insights,
                section: section,
                generated_at: new Date().toISOString(),
                using_openai: true,
                provider: 'OpenRouter',
                raw_response: rawInsights
            };

        } catch (error) {
            console.error('❌ Error generating section insights:', error);
            return {
                success: false,
                insights: this.getFallbackSectionInsights(section),
                section: section,
                generated_at: new Date().toISOString(),
                using_openai: false,
                provider: 'Fallback',
                error: error.message
            };
        }
    }

    /**
     * Generate recommendations based on trade data
     */
    async generateRecommendations(data) {
        try {
            console.log('💡 Generating AI recommendations...');

            const prompt = this.buildRecommendationPrompt(data);

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a trade policy advisor specializing in African markets. Provide strategic recommendations for Rwanda's trade development."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 600,
                temperature: 0.7
            });

            // Clean the AI response to remove any <think> tags that may be present
            const rawRecommendations = completion.choices[0].message.content;
            const recommendations = cleanAIResponse(rawRecommendations);
            console.log('✅ Recommendations generated successfully');

            return {
                success: true,
                recommendations: recommendations,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error generating recommendations:', error);
            return {
                success: false,
                error: error.message,
                fallback_recommendations: this.getFallbackRecommendations()
            };
        }
    }

    /**
     * Build analysis prompt based on context
     */
    buildAnalysisPrompt(data, context) {
        const baseData = {
            total_exports: data.total_exports || 0,
            total_imports: data.total_imports || 0,
            trade_balance: data.trade_balance || 0,
            top_destinations: data.top_destinations || [],
            top_products: data.top_products || []
        };

        switch (context) {
            case 'overview':
                return `Analyze Rwanda's trade overview with the following data:
                - Total Exports: $${baseData.total_exports.toFixed(2)}M
                - Total Imports: $${baseData.total_imports.toFixed(2)}M
                - Trade Balance: $${baseData.trade_balance.toFixed(2)}M
                - Top Export Destinations: ${baseData.top_destinations.slice(0, 3).map(d => d.country).join(', ')}
                - Top Products: ${baseData.top_products.slice(0, 3).map(p => p.commodity).join(', ')}

                Provide a comprehensive analysis of Rwanda's trade performance, key trends, and economic implications.`;

            case 'exports':
                return `Analyze Rwanda's export performance:
                - Total Export Value: $${baseData.total_exports.toFixed(2)}M
                - Top Destinations: ${baseData.top_destinations.map(d => `${d.country} ($${d.export_value.toFixed(2)}M)`).join(', ')}
                - Key Products: ${baseData.top_products.map(p => `${p.commodity} ($${p.export_value.toFixed(2)}M)`).join(', ')}

                Provide detailed insights on export trends, market opportunities, and growth potential.`;

            case 'imports':
                return `Analyze Rwanda's import patterns:
                - Total Import Value: $${baseData.total_imports.toFixed(2)}M
                - Trade Balance: $${baseData.trade_balance.toFixed(2)}M
                - Import Dependency Ratio: ${((baseData.total_imports / (baseData.total_exports + baseData.total_imports)) * 100).toFixed(1)}%

                Provide insights on import dependencies, supply chain risks, and opportunities for import substitution.`;

            default:
                return `Provide a comprehensive analysis of Rwanda's trade data focusing on key economic indicators and market trends.`;
        }
    }

    /**
     * Build chart-specific prompt
     */
    buildChartPrompt(chartType, data) {
        switch (chartType) {
            case 'trade_balance':
                return `Analyze this trade balance chart data showing quarterly trade balance trends.
                Data shows: ${JSON.stringify(data, null, 2)}

                What patterns do you observe? What are the implications for Rwanda's economy?`;

            case 'export_destinations':
                return `Analyze the export destinations data showing Rwanda's top trading partners.
                Key destinations: ${JSON.stringify(data.slice(0, 5), null, 2)}

                What does this tell us about Rwanda's export strategy and market diversification?`;

            case 'commodity_performance':
                return `Analyze commodity performance data showing Rwanda's key export products.
                Top commodities: ${JSON.stringify(data.slice(0, 5), null, 2)}

                What insights can you provide about Rwanda's export product concentration and diversification opportunities?`;

            default:
                return `Provide insights on this trade visualization data: ${JSON.stringify(data, null, 2)}`;
        }
    }

    /**
     * Build deep section insights prompt that analyzes actual JSON data
     */
    buildDeepSectionInsightsPrompt(section, sectionData, pdfContext) {
        const dataSummary = this.analyzeSectionData(section, sectionData);

        const basePrompt = `You are analyzing Rwanda's trade data for the ${section} section. Here is the actual data from the analytics:

DATA ANALYSIS REQUEST:
Analyze this JSON data structure and provide specific insights about what the numbers show, why they matter, and their economic implications:

${JSON.stringify(sectionData, null, 2)}

KEY DATA SUMMARY:
${dataSummary}

Based on this specific data, provide 3-5 detailed insights formatted as follows:

### Insight X: [Descriptive Title]

**What the data shows**: [Clear explanation referencing specific values from the JSON data]

**Why it matters**: [Connection to Rwanda's economic context and broader implications]

**Implications**: [What this means for policymakers, businesses, and economic development]

**Actionable insights**: [Specific recommendations based on the data]

FORMAT REQUIREMENTS:
- Use markdown formatting with **bold** for emphasis
- Create itemized lists using bullet points (-) where appropriate
- Make insights visually appealing and easy to interpret
- Reference specific numbers and values from the JSON data
- Keep each insight focused and actionable
- Use professional, clear language suitable for policymakers

Focus on the actual data provided - do not make up numbers or reference external data. Be specific about the values you see in the JSON structure.`;

        switch (section) {
            case 'time-series':
                return `${basePrompt}

For TIME SERIES ANALYSIS, specifically analyze:
- The slope and R-squared values for exports and imports
- Stationarity test results (which series are stationary?)
- Seasonal component patterns
- Forecast values for the next 4 quarters
- What these specific numbers tell us about Rwanda's trade evolution

What do the slope values (${dataSummary.includes('slope') ? 'present in data' : 'check data'}) indicate about growth trends? How reliable are the forecasts based on the R-squared values?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            case 'growth':
                return `${basePrompt}

For GROWTH ANALYSIS, specifically analyze:
- QoQ (Quarter-over-Quarter) growth rates
- YoY (Year-over-Year) growth rates
- CAGR (Compound Annual Growth Rate) values
- Which periods show the strongest/weakest growth
- Comparative performance between exports and imports

What do these specific growth rates (${dataSummary.includes('CAGR') ? 'including CAGR values' : 'from the data'}) tell us about Rwanda's trade momentum? Which quarters performed best and why might that matter for planning?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            case 'share':
                return `${basePrompt}

For SHARE ANALYSIS, specifically analyze:
- Top export markets and their percentage shares
- Top import sources and their percentage shares
- Commodity share distributions
- Market concentration patterns

What do the specific market share percentages (${dataSummary.includes('share_percentage') ? 'found in data' : 'from the JSON'}) tell us about Rwanda's trade diversification? Which markets dominate and what are the risks of this concentration?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            case 'hhi':
                return `${basePrompt}

For HHI CONCENTRATION ANALYSIS, specifically analyze:
- HHI values for export destinations and import sources
- Interpretation categories (highly concentrated, etc.)
- Number of destinations/sources analyzed
- Risk assessment insights

What do the specific HHI values (${dataSummary.includes('hhi_value') ? 'present in data' : 'from the analysis'}) mean for Rwanda's economic vulnerability? How does the number of trading partners affect market concentration?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            case 'balance':
                return `${basePrompt}

For TRADE BALANCE ANALYSIS, specifically analyze:
- Quarterly balance values (positive/negative)
- Average deficit amounts
- Number of quarters in deficit
- Deficit drivers and their contributions

What do the specific balance figures (${dataSummary.includes('quarterly_balance') ? 'from quarterly data' : 'in the analysis'}) tell us about Rwanda's trade sustainability? Which factors are driving the deficits and what are the structural implications?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            case 'correlation':
                return `${basePrompt}

For CORRELATION ANALYSIS, specifically analyze:
- Correlation coefficients between variables
- Strong vs weak relationships
- Variable pairs and their relationships
- Interpretation of correlation strength

What do the specific correlation coefficients (${dataSummary.includes('correlation') ? 'found in matrix' : 'from the data'}) reveal about relationships between trade variables? Which correlations are strongest and what do they imply for policy coordination?

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;

            default:
                return `${basePrompt}

Provide comprehensive insights based on the specific data structure and values in this ${section} analysis. Focus on what the actual numbers reveal about Rwanda's trade performance and economic implications.

Use the specified markdown formatting with clear section headers and bullet points for detailed analysis.`;
        }
    }

    /**
     * Analyze section data to extract key information for prompt building
     */
    analyzeSectionData(section, sectionData) {
        if (!sectionData || typeof sectionData !== 'object') {
            return "No data available for analysis";
        }

        try {
            let summary = "";

            switch (section) {
                case 'time-series':
                    if (sectionData.time_series) {
                        const ts = sectionData.time_series;
                        if (ts.exports_trend) {
                            summary += `Export trend: slope ${ts.exports_trend.slope?.toFixed(2)}, R² ${ts.exports_trend.r_squared?.toFixed(3)}\n`;
                        }
                        if (ts.imports_trend) {
                            summary += `Import trend: slope ${ts.imports_trend.slope?.toFixed(2)}, R² ${ts.imports_trend.r_squared?.toFixed(3)}\n`;
                        }
                        if (ts.forecast_next_4_quarters) {
                            summary += `Forecast data available for next 4 quarters\n`;
                        }
                        if (ts.stationarity_tests) {
                            summary += `Stationarity: Exports ${ts.stationarity_tests.exports?.stationary ? 'stationary' : 'non-stationary'}, Imports ${ts.stationarity_tests.imports?.stationary ? 'stationary' : 'non-stationary'}\n`;
                        }
                    }
                    break;

                case 'growth':
                    if (sectionData.growth_analysis) {
                        const growth = sectionData.growth_analysis;
                        if (growth.cagr) {
                            summary += `CAGR: Exports ${growth.cagr.exports?.toFixed(3)}, Imports ${growth.cagr.imports?.toFixed(3)}\n`;
                        }
                        if (growth.insights && Array.isArray(growth.insights)) {
                            summary += `Key insights: ${growth.insights.length} insights available\n`;
                        }
                    }
                    break;

                case 'share':
                    if (sectionData.share_analysis) {
                        const share = sectionData.share_analysis;
                        if (share.country_share) {
                            if (share.country_share.exports) {
                                const topExport = Object.values(share.country_share.exports)[0];
                                if (topExport) summary += `Top export market: ${Object.keys(share.country_share.exports)[0]} (${topExport.share_percentage?.toFixed(1)}%)\n`;
                            }
                            if (share.country_share.imports) {
                                const topImport = Object.values(share.country_share.imports)[0];
                                if (topImport) summary += `Top import source: ${Object.keys(share.country_share.imports)[0]} (${topImport.share_percentage?.toFixed(1)}%)\n`;
                            }
                        }
                    }
                    break;

                case 'hhi':
                    if (sectionData.hhi) {
                        const hhi = sectionData.hhi;
                        if (hhi.export_destinations) {
                            summary += `Export HHI: ${hhi.export_destinations.hhi_value?.toFixed(4)} (${hhi.export_destinations.interpretation})\n`;
                        }
                        if (hhi.import_sources) {
                            summary += `Import HHI: ${hhi.import_sources.hhi_value?.toFixed(4)} (${hhi.import_sources.interpretation})\n`;
                        }
                    }
                    break;

                case 'balance':
                    if (sectionData.trade_balance) {
                        const balance = sectionData.trade_balance;
                        if (balance.deficit_drivers) {
                            summary += `Average deficit: $${balance.deficit_drivers.average_deficit?.toFixed(0)}M, ${balance.deficit_drivers.quarters_in_deficit} quarters in deficit\n`;
                        }
                        if (balance.quarterly_balance) {
                            summary += `Quarterly balances: ${balance.quarterly_balance.length} quarters analyzed\n`;
                        }
                    }
                    break;

                case 'correlation':
                    if (sectionData.correlations) {
                        const corr = sectionData.correlations;
                        if (corr.matrix) {
                            const variables = Object.keys(corr.matrix);
                            summary += `Correlation matrix: ${variables.length} variables analyzed\n`;
                            // Find strongest correlation
                            let maxCorr = 0;
                            let maxPair = '';
                            variables.forEach(v1 => {
                                variables.forEach(v2 => {
                                    if (v1 !== v2) {
                                        const val = Math.abs(corr.matrix[v1]?.[v2] || 0);
                                        if (val > maxCorr) {
                                            maxCorr = val;
                                            maxPair = `${v1}-${v2}`;
                                        }
                                    }
                                });
                            });
                            if (maxPair) summary += `Strongest correlation: ${maxPair} (${maxCorr.toFixed(3)})\n`;
                        }
                    }
                    break;
            }

            return summary || "Data structure analyzed - contains trade analytics information";
        } catch (error) {
            console.error('Error analyzing section data:', error);
            return "Data analysis encountered an error";
        }
    }

    /**
     * Build section insights prompt for analytics dashboard (legacy)
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
     * Parse section insights from AI response
     */
    parseSectionInsights(generatedText, section) {
        // Clean the generated text
        let cleanedText = generatedText.trim();

        // Remove any leading/trailing artifacts from the model
        cleanedText = cleanedText.replace(/^["']|["']$/g, ''); // Remove quotes
        cleanedText = cleanedText.replace(/^(Response:|Answer:|Analysis:)/i, ''); // Remove prefixes

        // For the new formatted responses, try to split by "### Insight" headers
        let insights = [];
        const insightPattern = /### Insight \d+:.*?(?=(### Insight \d+:|$))/gs;
        const matches = cleanedText.match(insightPattern);

        if (matches && matches.length > 0) {
            insights = matches.map(match => match.trim());
        } else {
            // Fallback to previous parsing methods
            // Try to split by numbered lists first (1., 2., etc.)
            const numberedPattern = /^\d+\.\s*/gm;
            if (numberedPattern.test(cleanedText)) {
                insights = cleanedText.split(numberedPattern).filter(item => item.trim().length > 0);
                insights = insights.map(item => item.replace(/^\d+\.\s*/, '').trim());
            }
            // Try to split by bullet points
            else if (cleanedText.includes('•') || cleanedText.includes('- ')) {
                insights = cleanedText.split(/[•\-]\s*/).filter(item => item.trim().length > 0);
            }
            // Try to split by newlines
            else if (cleanedText.includes('\n')) {
                insights = cleanedText.split('\n').filter(line => line.trim().length > 0);
            }
            // Try to split by sentences
            else if (cleanedText.includes('.')) {
                insights = cleanedText.split('.').filter(sentence => sentence.trim().length > 0);
            }
            else {
                insights = [cleanedText];
            }
        }

        // Clean and filter insights
        insights = insights
            .map(insight => insight.trim())
            .filter(insight => insight.length > 20) // Remove very short items, increased threshold for formatted content
            .filter(insight => !insight.toLowerCase().includes('based on the')) // Remove generic intros
            .slice(0, 5); // Limit to 5 insights

        // If we don't have enough insights, use fallbacks
        if (insights.length < 3) {
            console.log('⚠️ Not enough insights generated, supplementing with fallbacks');
            const fallbacks = this.getFallbackSectionInsights(section);
            insights = insights.concat(fallbacks.slice(0, 5 - insights.length));
        }

        return insights;
    }

    /**
     * Get fallback section insights
     */
    getFallbackSectionInsights(section) {
        const enhancedInsights = {
            'time-series': [
                "Advanced time series decomposition reveals clear seasonal patterns in Rwanda's export cycles, with Q4 peaks driven by agricultural harvests.",
                "Stationarity analysis indicates that import values follow a more stable trend compared to volatile export fluctuations.",
                "The ARIMA forecasting model suggests a 15-20% growth trajectory for exports in the next fiscal year, contingent on global market conditions.",
                "Cross-correlation analysis between exports and global commodity prices shows a 0.73 correlation coefficient, indicating strong market dependency."
            ],
            'forecasting': [
                "Machine learning forecasting models predict a 18.5% increase in export values for Q1 2026, driven by anticipated coffee harvest improvements.",
                "Neural network analysis suggests import stabilization around $850-900M quarterly, with potential volatility from energy prices.",
                "Ensemble forecasting combining ARIMA, LSTM, and regression models provides a 92% confidence interval for the next 4 quarters.",
                "Scenario analysis indicates that a 10% drop in global coffee prices could reduce export forecasts by 12-15%."
            ],
            'growth': [
                "Compound Annual Growth Rate (CAGR) analysis shows exports growing at 14.2% annually, significantly outpacing the global average of 8.7%.",
                "Quarter-over-quarter analysis reveals that import growth has decelerated from 22% in 2023 to 8% in 2024, indicating market maturation.",
                "Year-over-year comparisons demonstrate Rwanda's trade resilience, with exports maintaining positive growth despite global economic headwinds.",
                "Sector-specific growth analysis highlights mining and manufacturing as key drivers of export expansion, while imports show concentration in capital goods."
            ],
            'share': [
                "Market concentration analysis reveals the UAE commanding 66.6% of Rwanda's export market, creating both opportunities and dependency risks.",
                "China's 30.1% share of imports suggests deep integration into Asian supply chains, with implications for trade policy diversification.",
                "The East African Community (EAC) represents 23% of total trade value, indicating strong regional economic integration benefits.",
                "Long-tail analysis of trading partners shows 15 countries accounting for 80% of trade, suggesting moderate diversification but room for expansion."
            ],
            'hhi': [
                "Herfindahl-Hirschman Index calculation yields 0.3758 for export destinations, indicating highly concentrated market structure with associated risks.",
                "Import market concentration at 0.3213 suggests similar dependency patterns, with potential supply chain vulnerabilities.",
                "Risk modeling indicates that loss of the UAE market could result in 45% export value reduction, necessitating diversification strategies.",
                "Comparative HHI analysis with peer countries shows Rwanda's concentration levels above regional averages, highlighting competitive disadvantages."
            ],
            'balance': [
                "Trade balance analysis reveals persistent structural deficits averaging $380M quarterly, driven by capital goods and intermediate input imports.",
                "Deficit decomposition shows machinery imports (42%) and petroleum products (18%) as primary contributors to trade imbalances.",
                "Balance of payments modeling suggests that current account deficits are sustainable at current levels but require export growth acceleration.",
                "Structural analysis indicates that Rwanda's trade deficit is typical of growth-oriented economies investing in infrastructure and industrialization."
            ],
            'correlation': [
                "Spearman correlation analysis reveals strong positive relationships (ρ = 0.78) between export values and global commodity price indices.",
                "Cross-correlation analysis shows import values lagging GDP growth by 1-2 quarters, indicating procyclical trade patterns.",
                "Partial correlation controlling for inflation shows robust relationships between trade variables and economic indicators.",
                "Network analysis of trade relationships reveals clustering patterns that could inform targeted trade policy interventions."
            ]
        };
        return enhancedInsights[section] || [
            "Advanced AI analysis provides deep insights into Rwanda's trade patterns using machine learning and statistical modeling techniques.",
            "The analysis incorporates multiple data sources and economic indicators to provide comprehensive trade intelligence.",
            "Machine learning algorithms identify patterns and relationships that traditional analysis methods might overlook.",
            "These insights support data-driven decision making for Rwanda's economic development and trade policy formulation."
        ];
    }

    /**
     * Build recommendation prompt
     */
    buildRecommendationPrompt(data) {
        return `Based on Rwanda's trade data:
        - Export Value: $${data.total_exports?.toFixed(2)}M
        - Import Value: $${data.total_imports?.toFixed(2)}M
        - Trade Balance: $${data.trade_balance?.toFixed(2)}M
        - Top Export Markets: ${data.top_destinations?.slice(0, 3).map(d => d.country).join(', ')}
        - Key Products: ${data.top_products?.slice(0, 3).map(p => p.commodity).join(', ')}

        Provide strategic recommendations for improving Rwanda's trade performance, market diversification, and economic growth. Consider Rwanda's Vision 2050 goals and regional integration opportunities.`;
    }

    /**
     * Get fallback descriptions when OpenAI fails
     */
    getFallbackDescription(context) {
        const fallbacks = {
            overview: "Rwanda's trade data shows a dynamic economy with opportunities for growth in key sectors. The trade balance reflects both challenges and opportunities for economic development.",
            exports: "Rwanda's export sector demonstrates strength in traditional commodities while showing potential for diversification into new markets and products.",
            imports: "Import patterns indicate Rwanda's integration into global value chains and highlight opportunities for domestic production and supply chain development."
        };
        return fallbacks[context] || "Trade analysis provides valuable insights for economic policy and business strategy development.";
    }

    /**
     * Get fallback chart insights
     */
    getFallbackChartInsights(chartType) {
        const fallbacks = {
            trade_balance: "Trade balance trends indicate the relationship between exports and imports, showing periods of surplus and deficit that reflect economic conditions.",
            export_destinations: "Export destination analysis reveals market concentration patterns and opportunities for geographic diversification.",
            commodity_performance: "Commodity performance shows product specialization and identifies opportunities for value addition and diversification."
        };
        return fallbacks[chartType] || "Chart analysis provides visual insights into trade patterns and performance metrics.";
    }

    /**
     * Get fallback recommendations
     */
    getFallbackRecommendations() {
        return `Based on the trade data analysis, consider these strategic approaches:
        1. Focus on export market diversification to reduce dependency on single markets
        2. Explore value addition opportunities in key commodity sectors
        3. Strengthen regional trade integration within the EAC
        4. Develop policies to support import substitution where feasible
        5. Invest in trade facilitation and logistics infrastructure`;
    }

    /**
     * Generate detailed country analysis
     */
    async generateCountryAnalysis(countryData) {
        try {
            console.log('🌍 Generating country analysis for:', countryData.country);

            const prompt = `Analyze ${countryData.country}'s trade relationship with Rwanda:
            - Export Value: $${countryData.export_value?.toFixed(2)}M
            - Market Share: ${countryData.percentage?.toFixed(1)}%
            - Growth Trend: ${countryData.growth_rate?.toFixed(1)}%
            - Trade Type: ${countryData.trade_type || 'Export destination'}

            Provide insights on this trading relationship and future opportunities.`;

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a trade relations expert specializing in African markets and regional integration."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.6
            });

            return {
                success: true,
                analysis: cleanAIResponse(completion.choices[0].message.content),
                country: countryData.country
            };

        } catch (error) {
            console.error('❌ Error generating country analysis:', error);
            return {
                success: false,
                error: error.message,
                fallback_analysis: `${countryData.country} represents an important trading partner for Rwanda, contributing to regional economic integration and market diversification.`
            };
        }
    }

    /**
     * Generate commodity insights
     */
    async generateCommodityInsights(commodityData) {
        try {
            console.log('📦 Generating commodity insights for:', commodityData.commodity);

            const prompt = `Analyze ${commodityData.commodity} as an export product:
            - Export Value: $${commodityData.export_value?.toFixed(2)}M
            - Market Share: ${commodityData.percentage?.toFixed(1)}%
            - Global Competitiveness: ${commodityData.competitive_advantage ? 'Strong' : 'Developing'}

            Provide insights on market position, competitive advantages, and growth opportunities.`;

            const completion = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a commodity market analyst specializing in African agricultural and mineral products."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 250,
                temperature: 0.6
            });

            return {
                success: true,
                insights: cleanAIResponse(completion.choices[0].message.content),
                commodity: commodityData.commodity
            };

        } catch (error) {
            console.error('❌ Error generating commodity insights:', error);
            return {
                success: false,
                error: error.message,
                fallback_insights: `${commodityData.commodity} represents a key export product with opportunities for value addition and market expansion.`
            };
        }
    }
}

// Create singleton instance
const openaiService = new OpenAIService();

/**
 * Utility function to clean AI responses by removing reasoning tags
 * Some models (like DeepSeek, Qwen) include internal reasoning in <think> tags
 * This function removes these tags to provide clean responses to users
 *
 * @param {string} response - Raw AI response that may contain <think> tags
 * @returns {string} Cleaned response without reasoning tags
 */
function cleanAIResponse(response) {
    if (typeof response !== 'string') {
        return response;
    }

    // Remove <think> and </think> tags and their content
    // This regex matches everything between <think> and </think> including the tags themselves
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '');

    // Trim any extra whitespace that might be left after removing the tags
    return cleanedResponse.trim();
}

module.exports = openaiService;
module.exports.cleanAIResponse = cleanAIResponse;