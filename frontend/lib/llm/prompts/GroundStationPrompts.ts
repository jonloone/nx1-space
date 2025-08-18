/**
 * Ground Station Domain Prompts
 * Specialized prompts for ground station operations
 */

export interface GroundStationContext {
  stations: any[];
  selectedStation?: any;
  timeRange?: { start: Date; end: Date };
  metrics?: Record<string, any>;
}

export class GroundStationPrompts {
  /**
   * System prompt for ground station domain
   */
  static getSystemPrompt(): string {
    return `You are a ground station operations specialist with expertise in:
- Network performance analysis and optimization
- Predictive maintenance and anomaly detection
- Capacity planning and resource allocation
- Regulatory compliance and spectrum management

When analyzing ground stations, consider:
1. Health Score: Overall operational status (0-100%)
2. Utilization: Current capacity usage
3. Network Connectivity: Link quality and redundancy
4. Performance Metrics: Latency, throughput, packet loss
5. Environmental Factors: Weather, interference, maintenance windows

Provide actionable insights and specific recommendations.`;
  }

  /**
   * Generate analysis prompt for a specific station
   */
  static getStationAnalysisPrompt(station: any): string {
    return `Analyze the following ground station:

Station: ${station.name || station.id}
Location: ${station.latitude}, ${station.longitude}
Health Score: ${(station.score * 100).toFixed(1)}%
Utilization: ${(station.utilization * 100).toFixed(1)}%
Type: ${station.type || 'Unknown'}
Status: ${station.status || 'Operational'}

Provide:
1. Current operational assessment
2. Key performance indicators
3. Potential issues or risks
4. Optimization recommendations
5. Maintenance priorities`;
  }

  /**
   * Generate network analysis prompt
   */
  static getNetworkAnalysisPrompt(stations: any[]): string {
    const totalStations = stations.length;
    const avgScore = stations.reduce((acc, s) => acc + s.score, 0) / totalStations;
    const avgUtilization = stations.reduce((acc, s) => acc + s.utilization, 0) / totalStations;
    
    const criticalStations = stations.filter(s => s.score < 0.7);
    const highUtilization = stations.filter(s => s.utilization > 0.8);

    return `Analyze the ground station network:

Network Overview:
- Total Stations: ${totalStations}
- Average Health Score: ${(avgScore * 100).toFixed(1)}%
- Average Utilization: ${(avgUtilization * 100).toFixed(1)}%
- Critical Stations (Score < 70%): ${criticalStations.length}
- High Utilization (> 80%): ${highUtilization.length}

Station Distribution:
${this.getGeographicDistribution(stations)}

Provide:
1. Network health assessment
2. Coverage analysis and gaps
3. Load balancing recommendations
4. Redundancy evaluation
5. Expansion priorities`;
  }

  /**
   * Generate predictive maintenance prompt
   */
  static getPredictiveMaintenancePrompt(station: any, historicalData?: any): string {
    return `Perform predictive maintenance analysis for ground station:

Station: ${station.name}
Current Health: ${(station.score * 100).toFixed(1)}%
Operating Hours: ${station.operatingHours || 'Unknown'}
Last Maintenance: ${station.lastMaintenance || 'Unknown'}

${historicalData ? `
Historical Trends:
- Average downtime: ${historicalData.avgDowntime || 'N/A'}
- Failure rate: ${historicalData.failureRate || 'N/A'}
- MTBF: ${historicalData.mtbf || 'N/A'}
` : ''}

Predict:
1. Remaining useful life of key components
2. Probability of failure in next 30/60/90 days
3. Recommended maintenance schedule
4. Critical components requiring attention
5. Cost-benefit analysis of preventive actions`;
  }

  /**
   * Generate optimization prompt
   */
  static getOptimizationPrompt(context: GroundStationContext): string {
    const { stations, metrics } = context;
    
    return `Optimize ground station network operations:

Current State:
- Active Stations: ${stations.filter(s => s.status === 'active').length}
- Total Capacity: ${metrics?.totalCapacity || 'Unknown'}
- Current Load: ${metrics?.currentLoad || 'Unknown'}
- Peak Load: ${metrics?.peakLoad || 'Unknown'}

Constraints:
- Minimum coverage requirements
- Maximum acceptable latency: 50ms
- Redundancy requirements: N+1
- Budget constraints

Optimize for:
1. Load distribution across stations
2. Energy efficiency
3. Coverage overlap minimization
4. Failover response time
5. Overall network resilience

Provide specific configuration changes and expected improvements.`;
  }

  /**
   * Helper method to analyze geographic distribution
   */
  private static getGeographicDistribution(stations: any[]): string {
    // Group by rough geographic regions
    const regions = {
      'North America': 0,
      'Europe': 0,
      'Asia': 0,
      'Other': 0
    };

    stations.forEach(station => {
      if (station.longitude >= -140 && station.longitude <= -50 && 
          station.latitude >= 25 && station.latitude <= 70) {
        regions['North America']++;
      } else if (station.longitude >= -10 && station.longitude <= 40 && 
                 station.latitude >= 35 && station.latitude <= 70) {
        regions['Europe']++;
      } else if (station.longitude >= 60 && station.longitude <= 150 && 
                 station.latitude >= -10 && station.latitude <= 60) {
        regions['Asia']++;
      } else {
        regions['Other']++;
      }
    });

    return Object.entries(regions)
      .map(([region, count]) => `- ${region}: ${count} stations`)
      .join('\n');
  }

  /**
   * Generate comparison prompt for multiple stations
   */
  static getComparisonPrompt(stations: any[]): string {
    const stationList = stations
      .slice(0, 5) // Limit to 5 for clarity
      .map(s => `- ${s.name}: Score ${(s.score * 100).toFixed(1)}%, Utilization ${(s.utilization * 100).toFixed(1)}%`)
      .join('\n');

    return `Compare the following ground stations:

${stationList}

Analyze:
1. Performance differences and their causes
2. Best practices from high-performing stations
3. Common issues across low-performing stations
4. Resource allocation efficiency
5. Recommendations for performance alignment`;
  }
}