/**
 * Visualization_Developer - Deck.gl Visualization Expert
 * 
 * Implements Deck.gl visualizations
 * Ensures accurate geographic positioning
 * Handles real-time data updates
 */

import { BaseAgent, AgentCapability, AgentAnalysis } from '../types';
import { GroundStationAnalytics } from '@/lib/types/ground-station';

export interface VisualizationReport {
  stationId: string;
  layerConfigurations: {
    baseLayer: any;
    dataLayers: any[];
    overlayLayers: any[];
  };
  performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
    layerCount: number;
  };
  interactionCapabilities: {
    clickActions: string[];
    hoverTooltips: any;
    selectionHandlers: any;
    filterOptions: string[];
  };
  visualizationModes: {
    currentState: any;
    coverageAnalysis: any;
    financialPerformance: any;
    opportunityIdentification: any;
  };
  optimizationRecommendations: {
    performance: string[];
    usability: string[];
    accessibility: string[];
    scalability: string[];
  };
}

export class VisualizationDeveloper extends BaseAgent {
  agentId = 'Visualization_Developer';
  
  capabilities: AgentCapability[] = [
    {
      name: 'Deck.gl Layer Configuration',
      description: 'Creates optimized deck.gl layer configurations for different data types',
      inputTypes: ['StationData', 'CoverageData', 'FinancialData'],
      outputTypes: ['LayerConfiguration', 'RenderingSpecs']
    },
    {
      name: 'Geographic Positioning',
      description: 'Ensures accurate geographic positioning and coordinate system handling',
      inputTypes: ['LocationData', 'ProjectionSpecs'],
      outputTypes: ['PositionValidation', 'CoordinateTransformation']
    },
    {
      name: 'Real-time Data Updates',
      description: 'Implements efficient data update mechanisms for live visualizations',
      inputTypes: ['StreamingData', 'UpdateFrequency'],
      outputTypes: ['UpdateStrategy', 'PerformanceMetrics']
    },
    {
      name: 'Interactive UI Components',
      description: 'Creates interactive components for data exploration and analysis',
      inputTypes: ['UserRequirements', 'DataStructure'],
      outputTypes: ['InteractiveComponents', 'UISpecification']
    }
  ];

  async analyze(station: GroundStationAnalytics): Promise<AgentAnalysis> {
    const report = await this.generateVisualizationReport(station);
    const confidence = this.calculateVisualizationConfidence(station, report);
    const recommendations = this.generateVisualizationRecommendations(report);
    const warnings = this.identifyVisualizationWarnings(report);

    return this.createAnalysis(report, confidence, recommendations, warnings);
  }

  private async generateVisualizationReport(station: GroundStationAnalytics): Promise<VisualizationReport> {
    // Generate layer configurations
    const layerConfigurations = this.createLayerConfigurations(station);
    
    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(station);
    
    // Define interaction capabilities
    const interactionCapabilities = this.defineInteractionCapabilities(station);
    
    // Create visualization modes
    const visualizationModes = this.createVisualizationModes(station);
    
    // Generate optimization recommendations
    const optimizationRecommendations = this.generateOptimizationRecommendations(station);

    return {
      stationId: station.station_id,
      layerConfigurations,
      performanceMetrics,
      interactionCapabilities,
      visualizationModes,
      optimizationRecommendations
    };
  }

  private createLayerConfigurations(station: GroundStationAnalytics): {
    baseLayer: any;
    dataLayers: any[];
    overlayLayers: any[];
  } {
    // Base layer configuration
    const baseLayer = {
      type: 'TileLayer',
      id: 'base-map',
      data: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      minZoom: 0,
      maxZoom: 19,
      tileSize: 256,
      renderSubLayers: (props: any) => {
        const { bbox: { west, south, east, north }, z } = props.tile;
        return [{
          ...props,
          id: `${props.id}-background`,
          type: 'SolidPolygonLayer',
          data: [{
            polygon: [[west, south], [west, north], [east, north], [east, south]]
          }],
          getPolygon: (d: any) => d.polygon,
          getFillColor: [10, 10, 10, 255]
        }];
      }
    };

    // Data layers configuration
    const dataLayers = [
      // Station location layer
      {
        type: 'IconLayer',
        id: 'station-locations',
        data: [station],
        getPosition: (d: any) => [d.location.longitude, d.location.latitude],
        getIcon: this.getStationIcon,
        getSize: this.getStationSize,
        getColor: this.getStationColor,
        pickable: true,
        iconAtlas: '/icons/station-atlas.png',
        iconMapping: this.getIconMapping(),
        sizeScale: 1,
        sizeMinPixels: 20,
        sizeMaxPixels: 80
      },
      
      // Utilization column layer
      {
        type: 'ColumnLayer',
        id: 'utilization-columns',
        data: [station],
        getPosition: (d: any) => [d.location.longitude, d.location.latitude],
        diskResolution: 12,
        radius: 50000,
        extruded: true,
        getElevation: (d: any) => d.utilization_metrics.current_utilization * 2000,
        getFillColor: this.getUtilizationColor,
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 2,
        pickable: true
      },
      
      // Coverage heatmap layer
      {
        type: 'HeatmapLayer',
        id: 'coverage-heatmap',
        data: this.generateCoveragePoints(station),
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => d.coverageScore,
        radiusPixels: 100,
        intensity: 1,
        threshold: 0.03,
        colorRange: [
          [0, 0, 0, 0],
          [139, 0, 139, 100],
          [0, 0, 255, 150],
          [0, 255, 0, 200],
          [255, 255, 0, 255]
        ]
      },
      
      // Financial performance layer
      {
        type: 'ScatterplotLayer',
        id: 'financial-performance',
        data: [station],
        getPosition: (d: any) => [d.location.longitude, d.location.latitude],
        getRadius: (d: any) => Math.sqrt(d.business_metrics.monthly_revenue / 10000),
        getFillColor: this.getProfitabilityColor,
        getLineColor: [255, 255, 255, 200],
        getLineWidth: 2,
        stroked: true,
        filled: true,
        radiusMinPixels: 15,
        radiusMaxPixels: 100,
        pickable: true
      }
    ];

    // Overlay layers
    const overlayLayers = [
      // Station labels
      {
        type: 'TextLayer',
        id: 'station-labels',
        data: [station],
        getPosition: (d: any) => [d.location.longitude, d.location.latitude],
        getText: (d: any) => d.name,
        getSize: 16,
        getColor: [255, 255, 255, 255],
        getAngle: 0,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        getPixelOffset: [0, -60],
        billboard: true,
        pickable: false
      },
      
      // Opportunity indicators
      {
        type: 'TextLayer',
        id: 'opportunity-indicators',
        data: this.generateOpportunityIndicators(station),
        getPosition: (d: any) => d.position,
        getText: (d: any) => d.symbol,
        getSize: (d: any) => 20 + d.score * 15,
        getColor: this.getOpportunityColor,
        billboard: true,
        pickable: true
      }
    ];

    return {
      baseLayer,
      dataLayers,
      overlayLayers
    };
  }

  private getStationIcon = (d: any): string => {
    const typeMapping: { [key: string]: string } = {
      'Primary Teleport': 'primary-teleport',
      'Teleport': 'teleport',
      'Regional': 'regional',
      'O3b Gateway': 'meo-gateway'
    };
    return typeMapping[d.type] || 'default-station';
  };

  private getStationSize = (d: any): number => {
    const sizeMapping: { [key: string]: number } = {
      'Primary Teleport': 60,
      'Teleport': 45,
      'Regional': 30,
      'O3b Gateway': 50
    };
    return sizeMapping[d.type] || 40;
  };

  private getStationColor = (d: any): [number, number, number, number] => {
    // Color by operator
    if (d.operator === 'SES') return [0, 170, 255, 255]; // SES Blue
    if (d.operator === 'Intelsat') return [255, 140, 0, 255]; // Intelsat Orange
    return [128, 128, 128, 255]; // Default gray
  };

  private getUtilizationColor = (d: any): [number, number, number, number] => {
    const utilization = d.utilization_metrics.current_utilization;
    if (utilization < 40) return [255, 0, 0, 200]; // Red - underutilized
    if (utilization < 70) return [255, 255, 0, 200]; // Yellow - optimal
    if (utilization < 85) return [0, 255, 0, 200]; // Green - high utilization
    return [255, 165, 0, 200]; // Orange - critical
  };

  private getProfitabilityColor = (d: any): [number, number, number, number] => {
    const margin = d.business_metrics.profit_margin;
    if (margin > 30) return [0, 200, 0, 200]; // High margin - green
    if (margin > 10) return [255, 200, 0, 200]; // Medium margin - yellow
    if (margin > 0) return [255, 100, 0, 200]; // Low margin - orange
    return [255, 0, 0, 200]; // Loss - red
  };

  private getOpportunityColor = (d: any): [number, number, number, number] => {
    const colorMapping: { [key: string]: [number, number, number, number] } = {
      'expansion': [0, 255, 0, 255],
      'optimization': [255, 255, 0, 255],
      'marketing': [0, 150, 255, 255],
      'new_service': [255, 0, 255, 255]
    };
    return colorMapping[d.type] || [128, 128, 128, 255];
  };

  private getIconMapping(): { [key: string]: any } {
    return {
      'primary-teleport': { x: 0, y: 0, width: 64, height: 64 },
      'teleport': { x: 64, y: 0, width: 64, height: 64 },
      'regional': { x: 128, y: 0, width: 64, height: 64 },
      'meo-gateway': { x: 192, y: 0, width: 64, height: 64 },
      'default-station': { x: 256, y: 0, width: 64, height: 64 }
    };
  }

  private generateCoveragePoints(station: GroundStationAnalytics): any[] {
    const points = [];
    const centerLat = station.location.latitude;
    const centerLon = station.location.longitude;
    
    // Generate coverage grid around station
    const gridSize = 0.5; // degrees
    const range = 10; // degrees radius
    
    for (let lat = centerLat - range; lat <= centerLat + range; lat += gridSize) {
      for (let lon = centerLon - range; lon <= centerLon + range; lon += gridSize) {
        const distance = Math.sqrt(
          Math.pow(lat - centerLat, 2) + Math.pow(lon - centerLon, 2)
        );
        
        if (distance <= range) {
          const coverageScore = Math.max(0, 1 - (distance / range));
          points.push({
            position: [lon, lat],
            coverageScore: coverageScore * station.coverage_metrics.satellite_visibility_count / 20
          });
        }
      }
    }
    
    return points;
  }

  private generateOpportunityIndicators(station: GroundStationAnalytics): any[] {
    const indicators = [];
    const basePosition = [station.location.longitude, station.location.latitude];
    
    // Determine primary opportunity based on utilization and performance
    let opportunity = 'optimization';
    let score = 0.5;
    
    if (station.utilization_metrics.current_utilization > 75) {
      opportunity = 'expansion';
      score = 0.8;
    } else if (station.utilization_metrics.current_utilization < 50) {
      opportunity = 'marketing';
      score = 0.7;
    } else if (station.business_metrics.profit_margin < 20) {
      opportunity = 'optimization';
      score = 0.6;
    }
    
    const symbolMapping: { [key: string]: string } = {
      'expansion': '📈',
      'optimization': '⚙️',
      'marketing': '📢',
      'new_service': '🚀'
    };
    
    indicators.push({
      position: [basePosition[0] + 0.1, basePosition[1] + 0.1],
      type: opportunity,
      symbol: symbolMapping[opportunity],
      score: score
    });
    
    return indicators;
  }

  private calculatePerformanceMetrics(station: GroundStationAnalytics): {
    renderTime: number;
    memoryUsage: number;
    frameRate: number;
    layerCount: number;
  } {
    // Simulate performance metrics based on data complexity
    const dataComplexity = this.calculateDataComplexity(station);
    
    return {
      renderTime: 50 + dataComplexity * 10, // milliseconds
      memoryUsage: 25 + dataComplexity * 5, // MB
      frameRate: Math.max(30, 60 - dataComplexity * 2), // FPS
      layerCount: 6 + Math.floor(dataComplexity / 2)
    };
  }

  private calculateDataComplexity(station: GroundStationAnalytics): number {
    let complexity = 1; // Base complexity
    
    // Add complexity for services
    complexity += station.technical_specs.services_supported.length * 0.5;
    
    // Add complexity for frequency bands
    complexity += station.technical_specs.frequency_bands.length * 0.3;
    
    // Add complexity for utilization history
    complexity += station.utilization_metrics.monthly_utilization_history.length * 0.1;
    
    return Math.round(complexity * 10) / 10;
  }

  private defineInteractionCapabilities(station: GroundStationAnalytics): {
    clickActions: string[];
    hoverTooltips: any;
    selectionHandlers: any;
    filterOptions: string[];
  } {
    return {
      clickActions: [
        'Show Station Details',
        'Display Financial Metrics',
        'View Coverage Analysis',
        'Open Opportunity Report',
        'Compare with Benchmarks'
      ],
      hoverTooltips: {
        stationInfo: this.generateStationTooltip(station),
        quickMetrics: this.generateQuickMetrics(station),
        opportunityPreview: this.generateOpportunityPreview(station)
      },
      selectionHandlers: {
        singleSelection: 'highlightStation',
        multiSelection: 'compareStations',
        areaSelection: 'analyzeRegion'
      },
      filterOptions: [
        'Operator (SES/Intelsat)',
        'Station Type',
        'Utilization Range',
        'Profit Margin Range',
        'Country/Region',
        'Service Type',
        'Opportunity Type'
      ]
    };
  }

  private generateStationTooltip(station: GroundStationAnalytics): any {
    return {
      html: `
        <div class="station-tooltip">
          <h3>${station.name}</h3>
          <div class="operator">${station.operator}</div>
          <div class="location">${station.location.country}</div>
          
          <div class="metrics">
            <div>Utilization: ${station.utilization_metrics.current_utilization}%</div>
            <div>Revenue: $${(station.business_metrics.monthly_revenue / 1000000).toFixed(2)}M/month</div>
            <div>Margin: ${station.business_metrics.profit_margin.toFixed(1)}%</div>
            <div>Satellites: ${station.coverage_metrics.satellite_visibility_count}</div>
          </div>
          
          <div class="services">
            ${station.technical_specs.services_supported.map(s => 
              `<span class="service-tag">${s}</span>`
            ).join('')}
          </div>
        </div>
      `,
      style: {
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontSize: '12px',
        padding: '12px',
        borderRadius: '4px',
        maxWidth: '300px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
      }
    };
  }

  private generateQuickMetrics(station: GroundStationAnalytics): any {
    return {
      utilization: `${station.utilization_metrics.current_utilization}%`,
      revenue: `$${(station.business_metrics.monthly_revenue / 1000000).toFixed(1)}M`,
      margin: `${station.business_metrics.profit_margin.toFixed(1)}%`,
      health: `${station.health_score}/100`
    };
  }

  private generateOpportunityPreview(station: GroundStationAnalytics): string {
    const utilization = station.utilization_metrics.current_utilization;
    const margin = station.business_metrics.profit_margin;
    
    if (utilization > 75) {
      return `🔥 Expansion Opportunity: High utilization (${utilization}%)`;
    } else if (utilization < 50) {
      return `📈 Marketing Opportunity: Low utilization (${utilization}%)`;
    } else if (margin < 20) {
      return `⚡ Optimization Opportunity: Low margin (${margin.toFixed(1)}%)`;
    } else {
      return `✅ Performance: Optimal range`;
    }
  }

  private createVisualizationModes(station: GroundStationAnalytics): {
    currentState: any;
    coverageAnalysis: any;
    financialPerformance: any;
    opportunityIdentification: any;
  } {
    return {
      currentState: {
        title: 'Current Station Status',
        layers: ['station-locations', 'utilization-columns', 'station-labels'],
        colorScheme: 'utilization',
        interactivity: 'high',
        filters: ['operator', 'type', 'utilization']
      },
      coverageAnalysis: {
        title: 'Satellite Coverage Analysis',
        layers: ['coverage-heatmap', 'station-locations', 'satellite-tracks'],
        colorScheme: 'coverage',
        interactivity: 'medium',
        filters: ['frequency-band', 'satellite-operator', 'elevation-angle']
      },
      financialPerformance: {
        title: 'Financial Performance',
        layers: ['financial-performance', 'revenue-flows', 'station-labels'],
        colorScheme: 'profitability',
        interactivity: 'high',
        filters: ['revenue-range', 'margin-range', 'growth-rate']
      },
      opportunityIdentification: {
        title: 'Opportunity Analysis',
        layers: ['opportunity-indicators', 'station-locations', 'opportunity-magnitude'],
        colorScheme: 'opportunity',
        interactivity: 'high',
        filters: ['opportunity-type', 'potential-value', 'implementation-time']
      }
    };
  }

  private generateOptimizationRecommendations(station: GroundStationAnalytics): {
    performance: string[];
    usability: string[];
    accessibility: string[];
    scalability: string[];
  } {
    const complexity = this.calculateDataComplexity(station);
    
    return {
      performance: [
        complexity > 5 ? 'Implement data clustering for high-density areas' : 'Current performance is optimal',
        'Use WebGL-based rendering for smooth interactions',
        'Implement level-of-detail (LOD) for distant objects',
        'Cache frequently accessed data layers'
      ],
      usability: [
        'Add context-sensitive help tooltips',
        'Implement keyboard shortcuts for common actions',
        'Provide clear visual feedback for user interactions',
        'Add undo/redo functionality for filter changes'
      ],
      accessibility: [
        'Ensure sufficient color contrast for all elements',
        'Provide alternative text descriptions for visual elements',
        'Support keyboard navigation for all interactive elements',
        'Add screen reader compatibility'
      ],
      scalability: [
        'Design for 100+ concurrent stations',
        'Implement progressive data loading',
        'Use efficient data structures for large datasets',
        'Plan for real-time data streaming capabilities'
      ]
    };
  }

  private calculateVisualizationConfidence(
    station: GroundStationAnalytics,
    report: VisualizationReport
  ): number {
    let confidence = 0.8; // Base confidence for visualization
    
    // Increase confidence based on data completeness
    if (station.utilization_metrics.monthly_utilization_history.length >= 5) {
      confidence += 0.1;
    }
    
    // Increase confidence based on performance metrics
    if (report.performanceMetrics.frameRate >= 30) {
      confidence += 0.05;
    }
    
    // Decrease confidence for high complexity
    const complexity = this.calculateDataComplexity(station);
    if (complexity > 8) {
      confidence -= 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private generateVisualizationRecommendations(report: VisualizationReport): string[] {
    const recommendations = [];
    
    // Performance recommendations
    if (report.performanceMetrics.renderTime > 100) {
      recommendations.push('Optimize rendering performance - consider data aggregation');
    }
    
    if (report.performanceMetrics.memoryUsage > 50) {
      recommendations.push('Reduce memory usage through efficient data structures');
    }
    
    // Layer recommendations
    if (report.layerConfigurations.dataLayers.length > 8) {
      recommendations.push('Consider consolidating layers to improve performance');
    }
    
    // Interaction recommendations
    recommendations.push('Implement progressive disclosure for complex data');
    recommendations.push('Add animation transitions for smooth user experience');
    
    return recommendations;
  }

  private identifyVisualizationWarnings(report: VisualizationReport): string[] {
    const warnings = [];
    
    // Performance warnings
    if (report.performanceMetrics.frameRate < 30) {
      warnings.push('Low frame rate may impact user experience');
    }
    
    if (report.performanceMetrics.memoryUsage > 100) {
      warnings.push('High memory usage may cause browser performance issues');
    }
    
    // Layer complexity warnings
    if (report.layerConfigurations.dataLayers.length > 10) {
      warnings.push('High layer count may impact rendering performance');
    }
    
    return warnings;
  }
}