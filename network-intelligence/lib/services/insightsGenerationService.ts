/**
 * Automated Insights Generation Service
 * Analyzes station data and generates actionable insights using AI
 */

export interface Insight {
  id: string
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  priority: number // 1-10
  actionable: boolean
  suggestedAction?: string
  data?: any
  timestamp: Date
}

export interface StationMetrics {
  id: string
  name: string
  operator: string
  utilization: number
  revenue: number
  margin: number
  status: string
  trend?: number
}

export class InsightsGenerationService {
  /**
   * Generate comprehensive insights from station data
   */
  async generateInsights(stations: StationMetrics[]): Promise<Insight[]> {
    const insights: Insight[] = []

    // 1. Identify underutilized stations (opportunities)
    insights.push(...this.findUnderutilizedStations(stations))

    // 2. Detect high-performing stations (best practices)
    insights.push(...this.identifyBestPractices(stations))

    // 3. Find stations at risk
    insights.push(...this.detectRisks(stations))

    // 4. Identify trends across the network
    insights.push(...this.analyzeTrends(stations))

    // 5. Detect anomalies
    insights.push(...this.detectAnomalies(stations))

    // 6. Generate operator-specific insights
    insights.push(...this.analyzeByOperator(stations))

    // Sort by priority (highest first)
    return insights.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Find underutilized stations with growth potential
   */
  private findUnderutilizedStations(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []
    const avgUtilization = stations.reduce((acc, s) => acc + s.utilization, 0) / stations.length

    stations.forEach(station => {
      if (station.utilization < 50 && station.status === 'active') {
        const potential = (avgUtilization - station.utilization) * station.revenue / station.utilization

        insights.push({
          id: `underutil-${station.id}`,
          type: 'opportunity',
          title: `Underutilized Station: ${station.name}`,
          description: `${station.name} is operating at ${station.utilization.toFixed(1)}% utilization, well below the network average of ${avgUtilization.toFixed(1)}%. This represents a significant growth opportunity.`,
          impact: potential > 5 ? 'high' : potential > 2 ? 'medium' : 'low',
          priority: Math.min(10, Math.floor(potential)),
          actionable: true,
          suggestedAction: `Increase capacity sales or optimize resource allocation. Potential revenue increase: $${potential.toFixed(1)}M`,
          data: { station: station.name, utilization: station.utilization, potential },
          timestamp: new Date()
        })
      }
    })

    return insights
  }

  /**
   * Identify best-performing stations
   */
  private identifyBestPractices(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []
    const topPerformers = stations
      .filter(s => s.utilization > 80 && s.margin > 20)
      .sort((a, b) => (b.utilization * b.margin) - (a.utilization * a.margin))
      .slice(0, 3)

    if (topPerformers.length > 0) {
      insights.push({
        id: 'best-practices',
        type: 'recommendation',
        title: 'High-Performance Stations Identified',
        description: `${topPerformers.map(s => s.name).join(', ')} are operating at optimal efficiency with high utilization (>80%) and strong margins (>20%). Their operational practices should be studied and replicated.`,
        impact: 'high',
        priority: 8,
        actionable: true,
        suggestedAction: 'Conduct case studies on these stations and implement best practices network-wide',
        data: { topPerformers: topPerformers.map(s => s.name) },
        timestamp: new Date()
      })
    }

    return insights
  }

  /**
   * Detect stations at risk
   */
  private detectRisks(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []

    stations.forEach(station => {
      // Low margin risk
      if (station.margin < 5 && station.revenue > 1) {
        insights.push({
          id: `risk-margin-${station.id}`,
          type: 'risk',
          title: `Low Margin Alert: ${station.name}`,
          description: `${station.name} is operating at a ${station.margin.toFixed(1)}% margin, below sustainable levels. This station may become unprofitable if costs increase or revenue decreases.`,
          impact: station.margin < 0 ? 'critical' : 'high',
          priority: station.margin < 0 ? 10 : 7,
          actionable: true,
          suggestedAction: 'Review operational costs and pricing strategy. Consider consolidation or efficiency improvements.',
          data: { station: station.name, margin: station.margin },
          timestamp: new Date()
        })
      }

      // Declining trend risk
      if (station.trend !== undefined && station.trend < -0.5) {
        insights.push({
          id: `risk-trend-${station.id}`,
          type: 'risk',
          title: `Declining Performance: ${station.name}`,
          description: `${station.name} shows a declining trend in utilization. Early intervention may prevent further deterioration.`,
          impact: 'medium',
          priority: 6,
          actionable: true,
          suggestedAction: 'Investigate root causes: customer churn, technical issues, or market competition',
          data: { station: station.name, trend: station.trend },
          timestamp: new Date()
        })
      }
    })

    return insights
  }

  /**
   * Analyze trends across the network
   */
  private analyzeTrends(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []

    // Calculate overall network metrics
    const avgUtilization = stations.reduce((acc, s) => acc + s.utilization, 0) / stations.length
    const totalRevenue = stations.reduce((acc, s) => acc + s.revenue, 0)
    const avgMargin = stations.reduce((acc, s) => acc + s.margin, 0) / stations.length

    // Network health insight
    const healthScore = (avgUtilization + avgMargin) / 2
    insights.push({
      id: 'network-health',
      type: 'trend',
      title: 'Network Health Score',
      description: `Overall network health score: ${healthScore.toFixed(1)}/100. Average utilization: ${avgUtilization.toFixed(1)}%, Average margin: ${avgMargin.toFixed(1)}%, Total revenue: $${totalRevenue.toFixed(1)}M.`,
      impact: healthScore > 60 ? 'low' : healthScore > 40 ? 'medium' : 'high',
      priority: 5,
      actionable: false,
      data: { avgUtilization, avgMargin, totalRevenue, healthScore },
      timestamp: new Date()
    })

    return insights
  }

  /**
   * Detect anomalies in the data
   */
  private detectAnomalies(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []

    // Detect outliers in utilization
    const utilisations = stations.map(s => s.utilization)
    const mean = utilisations.reduce((a, b) => a + b, 0) / utilisations.length
    const stdDev = Math.sqrt(
      utilisations.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / utilisations.length
    )

    stations.forEach(station => {
      const zScore = Math.abs((station.utilization - mean) / stdDev)
      if (zScore > 2) {
        insights.push({
          id: `anomaly-${station.id}`,
          type: 'anomaly',
          title: `Unusual Utilization Pattern: ${station.name}`,
          description: `${station.name} shows utilization (${station.utilization.toFixed(1)}%) that significantly deviates from the network average. This may indicate data quality issues or exceptional circumstances.`,
          impact: 'medium',
          priority: 4,
          actionable: true,
          suggestedAction: 'Verify data accuracy and investigate cause of deviation',
          data: { station: station.name, utilization: station.utilization, zScore },
          timestamp: new Date()
        })
      }
    })

    return insights
  }

  /**
   * Analyze performance by operator
   */
  private analyzeByOperator(stations: StationMetrics[]): Insight[] {
    const insights: Insight[] = []

    // Group by operator
    const operatorMap = new Map<string, StationMetrics[]>()
    stations.forEach(station => {
      if (!operatorMap.has(station.operator)) {
        operatorMap.set(station.operator, [])
      }
      operatorMap.get(station.operator)!.push(station)
    })

    // Compare operators
    const operatorStats = Array.from(operatorMap.entries()).map(([operator, stations]) => ({
      operator,
      avgUtilization: stations.reduce((acc, s) => acc + s.utilization, 0) / stations.length,
      avgRevenue: stations.reduce((acc, s) => acc + s.revenue, 0) / stations.length,
      totalRevenue: stations.reduce((acc, s) => acc + s.revenue, 0),
      count: stations.length
    }))

    const topOperator = operatorStats.reduce((max, op) =>
      op.avgUtilization > max.avgUtilization ? op : max
    )

    insights.push({
      id: 'operator-leader',
      type: 'trend',
      title: `Operator Performance Leader: ${topOperator.operator}`,
      description: `${topOperator.operator} leads in average utilization (${topOperator.avgUtilization.toFixed(1)}%) with ${topOperator.count} stations generating $${topOperator.totalRevenue.toFixed(1)}M in revenue.`,
      impact: 'low',
      priority: 3,
      actionable: false,
      data: { operator: topOperator.operator, stats: topOperator },
      timestamp: new Date()
    })

    return insights
  }

  /**
   * Generate station-specific analysis
   */
  async analyzeStation(station: StationMetrics, allStations: StationMetrics[]): Promise<any> {
    const avgUtilization = allStations.reduce((acc, s) => acc + s.utilization, 0) / allStations.length
    const avgRevenue = allStations.reduce((acc, s) => acc + s.revenue, 0) / allStations.length
    const avgMargin = allStations.reduce((acc, s) => acc + s.margin, 0) / allStations.length

    return {
      summary: `${station.name} operates at ${station.utilization.toFixed(1)}% utilization, generating $${station.revenue.toFixed(1)}M revenue with ${station.margin.toFixed(1)}% margin.`,
      performance: {
        score: this.calculatePerformanceScore(station, { avgUtilization, avgRevenue, avgMargin }),
        strengths: this.identifyStrengths(station, { avgUtilization, avgRevenue, avgMargin }),
        weaknesses: this.identifyWeaknesses(station, { avgUtilization, avgRevenue, avgMargin })
      },
      opportunities: this.identifyStationOpportunities(station),
      risks: this.identifyStationRisks(station),
      recommendations: this.generateStationRecommendations(station, { avgUtilization, avgRevenue, avgMargin })
    }
  }

  private calculatePerformanceScore(station: StationMetrics, benchmarks: any): number {
    const utilizationScore = (station.utilization / benchmarks.avgUtilization) * 40
    const revenueScore = (station.revenue / benchmarks.avgRevenue) * 30
    const marginScore = (station.margin / benchmarks.avgMargin) * 30
    return Math.min(100, Math.max(0, utilizationScore + revenueScore + marginScore))
  }

  private identifyStrengths(station: StationMetrics, benchmarks: any): string[] {
    const strengths: string[] = []
    if (station.utilization > benchmarks.avgUtilization * 1.1) {
      strengths.push('Above-average utilization')
    }
    if (station.margin > benchmarks.avgMargin * 1.1) {
      strengths.push('Strong profit margins')
    }
    if (station.revenue > benchmarks.avgRevenue * 1.2) {
      strengths.push('High revenue generation')
    }
    return strengths.length > 0 ? strengths : ['Stable operations']
  }

  private identifyWeaknesses(station: StationMetrics, benchmarks: any): string[] {
    const weaknesses: string[] = []
    if (station.utilization < benchmarks.avgUtilization * 0.8) {
      weaknesses.push('Below-average utilization')
    }
    if (station.margin < benchmarks.avgMargin * 0.8) {
      weaknesses.push('Low profit margins')
    }
    if (station.revenue < benchmarks.avgRevenue * 0.7) {
      weaknesses.push('Limited revenue generation')
    }
    return weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified']
  }

  private identifyStationOpportunities(station: StationMetrics): any {
    const opportunities: any = {
      shortTerm: [],
      longTerm: [],
      estimatedRevenue: '$0M'
    }

    if (station.utilization < 70) {
      opportunities.shortTerm.push('Increase capacity sales to existing customers')
      opportunities.shortTerm.push('Target new customer segments')
    }

    if (station.margin < 15) {
      opportunities.shortTerm.push('Optimize operational costs')
      opportunities.longTerm.push('Renegotiate vendor contracts')
    }

    opportunities.longTerm.push('Invest in infrastructure upgrades')
    opportunities.longTerm.push('Explore adjacent market opportunities')

    const revenueGap = station.utilization < 80 ? (80 - station.utilization) * 0.05 * station.revenue : 0
    opportunities.estimatedRevenue = `$${revenueGap.toFixed(1)}M additional revenue potential`

    return opportunities
  }

  private identifyStationRisks(station: StationMetrics): any {
    const risks: string[] = []
    let level: 'low' | 'medium' | 'high' = 'low'

    if (station.margin < 5) {
      risks.push('Thin profit margins vulnerable to cost increases')
      level = 'high'
    }

    if (station.utilization < 40) {
      risks.push('Low utilization indicates weak demand')
      level = level === 'high' ? 'high' : 'medium'
    }

    if (station.trend && station.trend < -0.3) {
      risks.push('Declining performance trend')
      level = level === 'high' ? 'high' : 'medium'
    }

    return {
      level,
      factors: risks.length > 0 ? risks : ['No significant risks identified'],
      mitigationStrategies: this.generateMitigationStrategies(risks)
    }
  }

  private generateMitigationStrategies(risks: string[]): string[] {
    const strategies: string[] = []

    if (risks.some(r => r.includes('margin'))) {
      strategies.push('Implement cost reduction initiatives')
      strategies.push('Review pricing strategy')
    }

    if (risks.some(r => r.includes('utilization'))) {
      strategies.push('Increase sales and marketing efforts')
      strategies.push('Explore new customer segments')
    }

    if (risks.some(r => r.includes('declining'))) {
      strategies.push('Conduct root cause analysis')
      strategies.push('Implement customer retention program')
    }

    return strategies.length > 0 ? strategies : ['Continue monitoring performance metrics']
  }

  private generateStationRecommendations(station: StationMetrics, benchmarks: any): any {
    const recommendations: string[] = []

    if (station.utilization < benchmarks.avgUtilization) {
      recommendations.push('Focus on increasing utilization through targeted sales efforts')
    }

    if (station.margin < benchmarks.avgMargin) {
      recommendations.push('Review and optimize operational costs')
    }

    if (station.utilization > 85) {
      recommendations.push('Consider capacity expansion to meet growing demand')
    }

    return {
      priority: recommendations.length > 0 ? recommendations : ['Maintain current operational excellence'],
      timeline: '3-6 months for short-term initiatives, 12-18 months for strategic changes'
    }
  }
}

// Singleton instance
let serviceInstance: InsightsGenerationService | null = null

export function getInsightsService(): InsightsGenerationService {
  if (!serviceInstance) {
    serviceInstance = new InsightsGenerationService()
  }
  return serviceInstance
}
