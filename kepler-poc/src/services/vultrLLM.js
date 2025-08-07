/**
 * Vultr LLM Service for Ground Station Intelligence
 * Phase 3 implementation - AI-powered insights
 */

class VultrLLMService {
  constructor(apiEndpoint = null, apiKey = null) {
    this.endpoint = apiEndpoint || process.env.REACT_APP_VULTR_LLM_ENDPOINT;
    this.apiKey = apiKey || process.env.REACT_APP_VULTR_API_KEY;
    this.cache = new Map(); // Simple cache for responses
  }

  /**
   * Generate insights based on current map context
   */
  async generateInsights(context) {
    // Check cache first
    const cacheKey = this.getCacheKey(context);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const prompt = this.buildPrompt(context);
      const response = await this.callVultrAPI(prompt);
      
      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Vultr LLM request failed:', error);
      return this.getFallbackInsight(context);
    }
  }

  /**
   * Build a context-aware prompt
   */
  buildPrompt(context) {
    const { visibleStations, avgScore, topStation, bounds, filters } = context;

    return `Analyze this ground station investment data and provide a brief insight:

Visible stations: ${visibleStations.count}
Average investment score: ${avgScore.toFixed(1)}/100
Investment distribution:
- Excellent: ${visibleStations.excellent} stations
- Good: ${visibleStations.good} stations  
- Moderate: ${visibleStations.moderate} stations
- Poor: ${visibleStations.poor} stations

Top station: ${topStation.name} (${topStation.operator}) with score ${topStation.score}
Location: ${topStation.country}

Current view: ${this.describeBounds(bounds)}
Active filters: ${this.describeFilters(filters)}

Provide a 2-3 sentence investment insight focusing on:
1. The overall opportunity in this region
2. Key factors driving the scores
3. Specific recommendation for next steps

Keep the response concise and actionable.`;
  }

  /**
   * Call Vultr API
   */
  async callVultrAPI(prompt) {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Vultr LLM not configured');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Vultr API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.text || data.completion || data.response;
  }

  /**
   * Fallback insights when LLM is unavailable
   */
  getFallbackInsight(context) {
    const { visibleStations, avgScore, topStation } = context;

    if (avgScore >= 70) {
      return `Strong investment opportunities detected with ${visibleStations.excellent + visibleStations.good} high-scoring stations visible. ${topStation.name} leads with a score of ${topStation.score}, indicating favorable market conditions and infrastructure. Consider detailed feasibility studies for stations scoring above 70.`;
    } else if (avgScore >= 60) {
      return `Mixed investment landscape with average score of ${avgScore.toFixed(1)}. While ${topStation.name} shows promise at ${topStation.score}, the region presents moderate opportunities requiring careful evaluation. Focus on stations with strong technical capabilities and market access.`;
    } else {
      return `Limited investment opportunities in current view with average score of ${avgScore.toFixed(1)}. The region may face challenges in market dynamics or infrastructure. Consider exploring alternative regions or wait for market conditions to improve.`;
    }
  }

  /**
   * Generate cache key from context
   */
  getCacheKey(context) {
    return JSON.stringify({
      count: context.visibleStations.count,
      avgScore: Math.round(context.avgScore),
      bounds: context.bounds?.map(b => Math.round(b * 100) / 100)
    });
  }

  /**
   * Describe geographic bounds in human-readable format
   */
  describeBounds(bounds) {
    if (!bounds) return 'Global view';
    
    const [minLng, minLat, maxLng, maxLat] = bounds;
    
    // Rough geographic descriptions
    if (minLat > 30 && maxLat < 50 && minLng > -10 && maxLng < 40) {
      return 'Europe/Middle East region';
    } else if (minLat > -35 && maxLat < 35 && minLng > 60 && maxLng < 150) {
      return 'Asia-Pacific region';
    } else if (minLat > 20 && maxLat < 50 && minLng > -130 && maxLng < -60) {
      return 'North America region';
    } else if (minLat > -60 && maxLat < 15 && minLng > -85 && maxLng < -30) {
      return 'South America region';
    }
    
    return 'Custom region';
  }

  /**
   * Describe active filters
   */
  describeFilters(filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return 'None';
    }

    const filterDescriptions = [];
    
    if (filters.scoreRange) {
      filterDescriptions.push(`Score ${filters.scoreRange[0]}-${filters.scoreRange[1]}`);
    }
    
    if (filters.operators && filters.operators.length > 0) {
      filterDescriptions.push(`Operators: ${filters.operators.join(', ')}`);
    }
    
    if (filters.recommendations && filters.recommendations.length > 0) {
      filterDescriptions.push(`Categories: ${filters.recommendations.join(', ')}`);
    }

    return filterDescriptions.join('; ') || 'None';
  }

  /**
   * Generate pattern analysis
   */
  async analyzePatterns(stations) {
    const patterns = {
      geographic: this.findGeographicPatterns(stations),
      operator: this.findOperatorPatterns(stations),
      technical: this.findTechnicalPatterns(stations)
    };

    const prompt = `Identify key investment patterns from:
${JSON.stringify(patterns, null, 2)}

Highlight 2-3 actionable insights.`;

    try {
      return await this.callVultrAPI(prompt);
    } catch (error) {
      return this.generatePatternSummary(patterns);
    }
  }

  findGeographicPatterns(stations) {
    // Group by country and calculate average scores
    const byCountry = {};
    stations.forEach(station => {
      if (!byCountry[station.country]) {
        byCountry[station.country] = { count: 0, totalScore: 0 };
      }
      byCountry[station.country].count++;
      byCountry[station.country].totalScore += station.overall_investment_score;
    });

    return Object.entries(byCountry)
      .map(([country, data]) => ({
        country,
        avgScore: data.totalScore / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }

  findOperatorPatterns(stations) {
    // Analyze by operator
    const byOperator = {};
    stations.forEach(station => {
      if (!byOperator[station.operator]) {
        byOperator[station.operator] = { count: 0, totalScore: 0 };
      }
      byOperator[station.operator].count++;
      byOperator[station.operator].totalScore += station.overall_investment_score;
    });

    return Object.entries(byOperator)
      .map(([operator, data]) => ({
        operator,
        avgScore: data.totalScore / data.count,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);
  }

  findTechnicalPatterns(stations) {
    // Analyze technical capabilities
    const capabilities = {
      largeDishes: stations.filter(s => s.primary_antenna_size_m >= 13).length,
      multiBand: stations.filter(s => s.frequency_bands?.includes(',') || s.frequency_bands?.includes('/')).length,
      highGT: stations.filter(s => s.estimated_g_t_db >= 35).length
    };

    return capabilities;
  }

  generatePatternSummary(patterns) {
    const topCountry = patterns.geographic[0];
    const topOperator = patterns.operator[0];
    
    return `Geographic concentration in ${topCountry.country} with average score ${topCountry.avgScore.toFixed(1)}. ${topOperator.operator} dominates with ${topOperator.count} stations. Technical analysis shows ${patterns.technical.largeDishes} large antenna installations suitable for high-capacity services.`;
  }
}

// Export as singleton
export default new VultrLLMService();