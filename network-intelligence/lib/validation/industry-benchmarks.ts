/**
 * Industry Benchmarks and Validation Framework
 * 
 * Validates ground station metrics against industry standards and
 * provides confidence scoring for opportunity analysis results
 * 
 * Based on methodology paper requirements for validation and benchmarking
 */

export interface IndustryBenchmark {
  metric: string;
  unit: string;
  ranges: {
    minimum: number;
    typical: number;
    maximum: number;
    excellent: number;
  };
  context: string;
  source: string;
}

export interface ValidationResult {
  metric: string;
  value: number;
  status: 'valid' | 'warning' | 'error' | 'excellent';
  message: string;
  benchmarkRange: {
    min: number;
    max: number;
    typical: number;
  };
  confidenceScore: number; // 0-100
}

export interface StationValidationReport {
  stationId: string;
  stationName: string;
  overallConfidence: number;
  validationResults: ValidationResult[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
  benchmarkCompliance: number; // Percentage of metrics within acceptable ranges
}

export class IndustryBenchmarkValidator {
  private readonly BENCHMARKS: Record<string, IndustryBenchmark> = {
    utilization: {
      metric: 'Station Utilization',
      unit: 'percentage',
      ranges: {
        minimum: 30,
        typical: 65,
        maximum: 95,
        excellent: 80
      },
      context: 'Operational utilization rates for commercial ground stations',
      source: 'SES/Intelsat operational data, NSR Market Research 2024'
    },
    
    profitMargin: {
      metric: 'Profit Margin',
      unit: 'percentage',
      ranges: {
        minimum: 15,
        typical: 30,
        maximum: 50,
        excellent: 40
      },
      context: 'EBITDA margins for satellite ground segment operators',
      source: 'Euroconsult Satellite Ground Segment Report 2024'
    },
    
    revenuePerGbps: {
      metric: 'Revenue per Gbps',
      unit: 'USD per month',
      ranges: {
        minimum: 8000,
        typical: 12000,
        maximum: 20000,
        excellent: 16000
      },
      context: 'Monthly revenue per Gbps capacity across service types',
      source: 'NSR Satellite Operator Financial Analysis 2024'
    },
    
    slaCompliance: {
      metric: 'SLA Compliance Rate',
      unit: 'percentage',
      ranges: {
        minimum: 95.0,
        typical: 99.5,
        maximum: 99.99,
        excellent: 99.8
      },
      context: 'Service level agreement compliance for commercial services',
      source: 'ITU-R Satellite Service Quality Standards'
    },
    
    annualROI: {
      metric: 'Annual ROI',
      unit: 'percentage',
      ranges: {
        minimum: 8,
        typical: 18,
        maximum: 35,
        excellent: 25
      },
      context: 'Return on investment for ground station infrastructure',
      source: 'Satellite Industry Association Financial Benchmarks 2024'
    },
    
    capacityEfficiency: {
      metric: 'Capacity Efficiency',
      unit: 'percentage',
      ranges: {
        minimum: 70,
        typical: 85,
        maximum: 95,
        excellent: 90
      },
      context: 'Actual vs theoretical capacity utilization efficiency',
      source: 'ESOA Ground Segment Efficiency Study 2024'
    },
    
    operationalCostRatio: {
      metric: 'Operational Cost Ratio',
      unit: 'percentage',
      ranges: {
        minimum: 30, // Lower is better
        typical: 45,
        maximum: 70,
        excellent: 35
      },
      context: 'Operational costs as percentage of revenue',
      source: 'Satellite Operator OPEX Analysis 2024'
    },
    
    churnRate: {
      metric: 'Customer Churn Rate',
      unit: 'percentage per year',
      ranges: {
        minimum: 2, // Lower is better
        typical: 8,
        maximum: 20,
        excellent: 5
      },
      context: 'Annual customer turnover rate',
      source: 'Satellite Service Customer Retention Study 2024'
    },
    
    interferenceImpact: {
      metric: 'Interference Capacity Loss',
      unit: 'percentage',
      ranges: {
        minimum: 0, // Lower is better
        typical: 5,
        maximum: 15,
        excellent: 2
      },
      context: 'Capacity reduction due to interference sources',
      source: 'ITU-R Interference Impact Studies'
    },
    
    slewTimeEfficiency: {
      metric: 'Slew Time Efficiency',
      unit: 'percentage',
      ranges: {
        minimum: 75,
        typical: 85,
        maximum: 95,
        excellent: 90
      },
      context: 'Operational time vs total time including antenna movements',
      source: 'Ground Station Operational Efficiency Analysis 2024'
    }
  };

  /**
   * Validate a single metric against industry benchmarks
   */
  validateMetric(
    metric: string, 
    value: number
  ): ValidationResult {
    const benchmark = this.BENCHMARKS[metric];
    
    if (!benchmark) {
      return {
        metric,
        value,
        status: 'error',
        message: `No benchmark available for metric: ${metric}`,
        benchmarkRange: { min: 0, max: 100, typical: 50 },
        confidenceScore: 0
      };
    }

    let status: 'valid' | 'warning' | 'error' | 'excellent';
    let message: string;
    let confidenceScore: number;

    // Determine status based on value vs benchmarks
    if (value >= benchmark.ranges.excellent && value <= benchmark.ranges.maximum) {
      status = 'excellent';
      message = `Excellent performance: ${value} ${benchmark.unit} exceeds industry excellence threshold`;
      confidenceScore = 95;
    } else if (value >= benchmark.ranges.typical && value <= benchmark.ranges.maximum) {
      status = 'valid';
      message = `Good performance: ${value} ${benchmark.unit} within typical industry range`;
      confidenceScore = 85;
    } else if (value >= benchmark.ranges.minimum && value < benchmark.ranges.typical) {
      status = 'warning';
      message = `Below average: ${value} ${benchmark.unit} below typical performance`;
      confidenceScore = 65;
    } else if (value < benchmark.ranges.minimum) {
      status = 'error';
      message = `Poor performance: ${value} ${benchmark.unit} below industry minimum`;
      confidenceScore = 30;
    } else {
      // Value exceeds maximum - may indicate data quality issues
      status = 'warning';
      message = `Unusually high: ${value} ${benchmark.unit} exceeds typical maximum`;
      confidenceScore = 50;
    }

    // Special handling for "lower is better" metrics
    if (metric === 'operationalCostRatio' || metric === 'churnRate' || metric === 'interferenceImpact') {
      if (value <= benchmark.ranges.excellent) {
        status = 'excellent';
        message = `Excellent performance: ${value} ${benchmark.unit} (lower is better)`;
        confidenceScore = 95;
      } else if (value <= benchmark.ranges.typical) {
        status = 'valid';
        message = `Good performance: ${value} ${benchmark.unit} within acceptable range`;
        confidenceScore = 85;
      } else if (value <= benchmark.ranges.maximum) {
        status = 'warning';
        message = `Above average: ${value} ${benchmark.unit} higher than typical`;
        confidenceScore = 65;
      } else {
        status = 'error';
        message = `Poor performance: ${value} ${benchmark.unit} exceeds industry maximum`;
        confidenceScore = 30;
      }
    }

    return {
      metric,
      value,
      status,
      message,
      benchmarkRange: {
        min: benchmark.ranges.minimum,
        max: benchmark.ranges.maximum,
        typical: benchmark.ranges.typical
      },
      confidenceScore
    };
  }

  /**
   * Validate a complete ground station against all relevant benchmarks
   */
  validateStation(stationData: {
    stationId: string;
    stationName: string;
    utilization: number;
    profitMargin: number;
    revenuePerGbps: number;
    slaCompliance: number;
    annualROI: number;
    capacityEfficiency?: number;
    operationalCostRatio?: number;
    churnRate?: number;
    interferenceImpact?: number;
    slewTimeEfficiency?: number;
    [key: string]: any;
  }): StationValidationReport {
    const validationResults: ValidationResult[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // Core metrics - always validate
    const coreMetrics = [
      { key: 'utilization', value: stationData.utilization },
      { key: 'profitMargin', value: stationData.profitMargin },
      { key: 'revenuePerGbps', value: stationData.revenuePerGbps },
      { key: 'slaCompliance', value: stationData.slaCompliance },
      { key: 'annualROI', value: stationData.annualROI }
    ];

    // Optional metrics - validate if available
    const optionalMetrics = [
      { key: 'capacityEfficiency', value: stationData.capacityEfficiency },
      { key: 'operationalCostRatio', value: stationData.operationalCostRatio },
      { key: 'churnRate', value: stationData.churnRate },
      { key: 'interferenceImpact', value: stationData.interferenceImpact },
      { key: 'slewTimeEfficiency', value: stationData.slewTimeEfficiency }
    ];

    // Validate all metrics
    [...coreMetrics, ...optionalMetrics].forEach(({ key, value }) => {
      if (value !== undefined && value !== null) {
        const result = this.validateMetric(key, value);
        validationResults.push(result);

        if (result.status === 'warning') {
          warnings.push(result.message);
        } else if (result.status === 'error') {
          errors.push(result.message);
        }
      }
    });

    // Generate recommendations based on validation results
    recommendations.push(...this.generateRecommendations(validationResults, stationData));

    // Calculate overall confidence and compliance
    const totalConfidence = validationResults.reduce((sum, r) => sum + r.confidenceScore, 0);
    const overallConfidence = validationResults.length > 0 ? totalConfidence / validationResults.length : 0;
    
    const compliantMetrics = validationResults.filter(r => r.status === 'valid' || r.status === 'excellent').length;
    const benchmarkCompliance = validationResults.length > 0 ? (compliantMetrics / validationResults.length) * 100 : 0;

    return {
      stationId: stationData.stationId,
      stationName: stationData.stationName,
      overallConfidence,
      validationResults,
      warnings,
      errors,
      recommendations,
      benchmarkCompliance
    };
  }

  /**
   * Generate specific recommendations based on validation results
   */
  private generateRecommendations(
    validationResults: ValidationResult[],
    stationData: any
  ): string[] {
    const recommendations: string[] = [];

    validationResults.forEach(result => {
      if (result.status === 'error' || result.status === 'warning') {
        switch (result.metric) {
          case 'utilization':
            if (result.value < 50) {
              recommendations.push('Consider market development initiatives to increase demand');
              recommendations.push('Evaluate service pricing and competitive positioning');
            } else if (result.value > 90) {
              recommendations.push('Plan capacity expansion to meet growing demand');
              recommendations.push('Implement demand management and load balancing');
            }
            break;

          case 'profitMargin':
            if (result.value < 20) {
              recommendations.push('Review operational costs and identify efficiency improvements');
              recommendations.push('Implement service-specific pricing to optimize margins');
            }
            break;

          case 'slaCompliance':
            if (result.value < 99) {
              recommendations.push('Implement redundancy and backup systems');
              recommendations.push('Review maintenance schedules and procedures');
            }
            break;

          case 'interferenceImpact':
            if (result.value > 10) {
              recommendations.push('Install interference mitigation equipment');
              recommendations.push('Coordinate with adjacent satellite operators');
            }
            break;

          case 'slewTimeEfficiency':
            if (result.value < 80) {
              recommendations.push('Optimize antenna scheduling algorithms');
              recommendations.push('Implement predictive maintenance for mechanical systems');
            }
            break;

          case 'operationalCostRatio':
            if (result.value > 50) {
              recommendations.push('Automate routine operational tasks');
              recommendations.push('Consolidate operations across multiple facilities');
            }
            break;
        }
      }
    });

    return recommendations;
  }

  /**
   * Get all available benchmarks
   */
  getAllBenchmarks(): Record<string, IndustryBenchmark> {
    return { ...this.BENCHMARKS };
  }

  /**
   * Get benchmark for specific metric
   */
  getBenchmark(metric: string): IndustryBenchmark | null {
    return this.BENCHMARKS[metric] || null;
  }

  /**
   * Validate portfolio of stations and provide comparative analysis
   */
  validatePortfolio(stations: any[]): {
    totalStations: number;
    averageConfidence: number;
    averageCompliance: number;
    bestPerforming: StationValidationReport[];
    needsImprovement: StationValidationReport[];
    portfolioInsights: string[];
  } {
    const reports = stations.map(station => this.validateStation(station));
    
    const averageConfidence = reports.reduce((sum, r) => sum + r.overallConfidence, 0) / reports.length;
    const averageCompliance = reports.reduce((sum, r) => sum + r.benchmarkCompliance, 0) / reports.length;
    
    const bestPerforming = reports
      .filter(r => r.overallConfidence > 80)
      .sort((a, b) => b.overallConfidence - a.overallConfidence)
      .slice(0, 5);
    
    const needsImprovement = reports
      .filter(r => r.overallConfidence < 70)
      .sort((a, b) => a.overallConfidence - b.overallConfidence)
      .slice(0, 5);

    const portfolioInsights = this.generatePortfolioInsights(reports);

    return {
      totalStations: stations.length,
      averageConfidence,
      averageCompliance,
      bestPerforming,
      needsImprovement,
      portfolioInsights
    };
  }

  /**
   * Generate portfolio-level insights
   */
  private generatePortfolioInsights(reports: StationValidationReport[]): string[] {
    const insights: string[] = [];
    
    // Analyze common issues
    const errorCount = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const warningCount = reports.reduce((sum, r) => sum + r.warnings.length, 0);
    
    if (errorCount > reports.length * 0.3) {
      insights.push('Multiple stations showing critical performance issues requiring immediate attention');
    }
    
    if (warningCount > reports.length * 0.5) {
      insights.push('Portfolio-wide optimization opportunities exist across multiple performance metrics');
    }

    // Analyze confidence distribution
    const highConfidence = reports.filter(r => r.overallConfidence > 80).length;
    const lowConfidence = reports.filter(r => r.overallConfidence < 60).length;
    
    if (highConfidence / reports.length < 0.5) {
      insights.push('Less than half of stations meet industry performance standards');
    }
    
    if (lowConfidence / reports.length > 0.2) {
      insights.push('Significant data quality or operational issues detected across portfolio');
    }

    return insights;
  }
}

// Export singleton instance
export const industryValidator = new IndustryBenchmarkValidator();

// Export validation utilities
export function validateGroundStationMetrics(stationData: any): StationValidationReport {
  return industryValidator.validateStation(stationData);
}

export function getIndustryBenchmark(metric: string): IndustryBenchmark | null {
  return industryValidator.getBenchmark(metric);
}