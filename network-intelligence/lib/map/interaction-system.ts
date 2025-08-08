/**
 * Advanced Interaction System
 * 
 * Sophisticated hover, click, and selection interactions for hexagon-based
 * global coverage maps with contextual information and smooth animations.
 */

import { H3Cell } from './h3-coverage-system';
import { OpportunityScore, OpportunityAnalysisSystem } from './opportunity-analysis-system';

export interface InteractionState {
  hoveredCell: H3Cell | null;
  selectedCells: H3Cell[];
  highlightedRegion: string | null;
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    cell: H3Cell | null;
  };
  selectionMode: 'single' | 'multiple' | 'region';
  dragState: {
    isDragging: boolean;
    startCell: H3Cell | null;
    currentCells: H3Cell[];
  };
}

export interface InteractionOptions {
  enableHover: boolean;
  enableSelection: boolean;
  enableContextMenu: boolean;
  enableTooltips: boolean;
  enableRegionSelection: boolean;
  hoverDelay: number;
  tooltipDelay: number;
  maxSelections: number;
  animationDuration: number;
}

export interface CellContext {
  cell: H3Cell;
  opportunityScore?: OpportunityScore;
  marketData?: MarketData;
  competitionData?: CompetitionData;
  neighbors: H3Cell[];
  regionInfo: RegionInfo;
  recommendations: string[];
}

export interface MarketData {
  population: number;
  gdpPerCapita: number;
  marketSize: number;
  growthRate: number;
  penetrationRate: number;
  averageRevenue: number;
  competitorCount: number;
}

export interface CompetitionData {
  providers: CompetitorInfo[];
  marketShare: Record<string, number>;
  pricingTiers: PricingTier[];
  serviceGaps: string[];
  differentiationOpportunities: string[];
}

export interface CompetitorInfo {
  name: string;
  marketShare: number;
  serviceTypes: string[];
  coverage: number;
  pricing: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PricingTier {
  name: string;
  pricePerMbps: number;
  features: string[];
  targetSegment: string;
}

export interface RegionInfo {
  name: string;
  timeZone: string;
  primaryLanguages: string[];
  currency: string;
  regulatoryFramework: string;
  licenseRequirements: string[];
  taxImplications: string;
  culturalConsiderations: string[];
}

export interface TooltipData {
  primary: string;
  secondary: string;
  metrics: Array<{
    label: string;
    value: string;
    format: 'number' | 'percentage' | 'currency' | 'text';
    trend?: 'up' | 'down' | 'stable';
    color?: string;
  }>;
  actions: Array<{
    label: string;
    icon: string;
    action: string;
    enabled: boolean;
  }>;
}

export class InteractionSystem {
  private state: InteractionState;
  private opportunityAnalysis: OpportunityAnalysisSystem;
  private hoverTimeout: number | null = null;
  private tooltipTimeout: number | null = null;
  private contextCache = new Map<string, CellContext>();
  
  constructor(
    private options: InteractionOptions = {
      enableHover: true,
      enableSelection: true,
      enableContextMenu: true,
      enableTooltips: true,
      enableRegionSelection: true,
      hoverDelay: 150,
      tooltipDelay: 300,
      maxSelections: 50,
      animationDuration: 250
    }
  ) {
    this.state = this.createInitialState();
    this.opportunityAnalysis = new OpportunityAnalysisSystem();
  }

  /**
   * Handle cell hover events
   */
  public handleCellHover(cell: H3Cell | null, event?: MouseEvent): void {
    if (!this.options.enableHover) return;

    // Clear existing hover timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    if (cell) {
      // Set hover with delay
      this.hoverTimeout = window.setTimeout(() => {
        this.setState({
          hoveredCell: cell
        });
        
        // Pre-load context data
        this.preloadCellContext(cell);
      }, this.options.hoverDelay);
    } else {
      this.setState({
        hoveredCell: null
      });
    }
  }

  /**
   * Handle cell selection events
   */
  public handleCellSelection(cell: H3Cell, event?: MouseEvent): void {
    if (!this.options.enableSelection) return;

    const { selectionMode, selectedCells } = this.state;
    let newSelectedCells = [...selectedCells];

    switch (selectionMode) {
      case 'single':
        newSelectedCells = [cell];
        break;

      case 'multiple':
        const isSelected = selectedCells.some(c => c.id === cell.id);
        if (event?.ctrlKey || event?.metaKey) {
          if (isSelected) {
            newSelectedCells = selectedCells.filter(c => c.id !== cell.id);
          } else if (selectedCells.length < this.options.maxSelections) {
            newSelectedCells.push(cell);
          }
        } else {
          newSelectedCells = [cell];
        }
        break;

      case 'region':
        if (event?.shiftKey && selectedCells.length > 0) {
          // Select region between last selected and current cell
          const regionCells = this.selectCellsBetween(selectedCells[selectedCells.length - 1], cell);
          newSelectedCells = [...new Set([...selectedCells, ...regionCells])];
        } else {
          newSelectedCells = [cell];
        }
        break;
    }

    this.setState({
      selectedCells: newSelectedCells.slice(0, this.options.maxSelections)
    });
  }

  /**
   * Handle right-click context menu
   */
  public handleContextMenu(cell: H3Cell, event: MouseEvent): void {
    if (!this.options.enableContextMenu) return;

    event.preventDefault();
    
    this.setState({
      contextMenu: {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        cell
      }
    });

    // Auto-hide context menu after delay
    setTimeout(() => {
      this.hideContextMenu();
    }, 5000);
  }

  /**
   * Generate comprehensive tooltip data
   */
  public generateTooltipData(cell: H3Cell): TooltipData {
    const context = this.getCellContext(cell);
    const opportunityScore = context.opportunityScore;
    
    const primary = `Hexagon ${cell.id.slice(0, 8)}...`;
    const secondary = `${context.regionInfo.name} • Resolution ${cell.resolution}`;
    
    const metrics = [
      {
        label: 'Type',
        value: cell.isLand ? 'Land' : 'Ocean',
        format: 'text' as const,
        color: cell.isLand ? '#22c55e' : '#3b82f6'
      },
      {
        label: 'Area',
        value: `${cell.area.toFixed(0)} km²`,
        format: 'text' as const
      },
      {
        label: 'Center',
        value: `${cell.center[1].toFixed(3)}°, ${cell.center[0].toFixed(3)}°`,
        format: 'text' as const
      }
    ];

    if (opportunityScore && cell.isLand) {
      metrics.push(
        {
          label: 'Opportunity Score',
          value: opportunityScore.overall.toString(),
          format: 'number' as const,
          color: this.getScoreColor(opportunityScore.overall),
          trend: opportunityScore.overall > 70 ? 'up' : opportunityScore.overall > 40 ? 'stable' : 'down'
        },
        {
          label: 'Market Potential',
          value: opportunityScore.marketPotential.toFixed(1),
          format: 'currency' as const,
          trend: 'up'
        },
        {
          label: 'ROI Estimate',
          value: opportunityScore.roi.toString(),
          format: 'percentage' as const,
          trend: opportunityScore.roi > 15 ? 'up' : 'stable'
        }
      );
    }

    if (context.marketData) {
      metrics.push(
        {
          label: 'Population',
          value: context.marketData.population.toLocaleString(),
          format: 'number' as const
        },
        {
          label: 'GDP per Capita',
          value: context.marketData.gdpPerCapita.toLocaleString(),
          format: 'currency' as const
        }
      );
    }

    const actions = [
      {
        label: 'Select Cell',
        icon: 'target',
        action: 'select',
        enabled: !this.state.selectedCells.some(c => c.id === cell.id)
      },
      {
        label: 'View Details',
        icon: 'info',
        action: 'details',
        enabled: true
      },
      {
        label: 'Analyze Region',
        icon: 'map',
        action: 'analyze',
        enabled: cell.isLand
      },
      {
        label: 'Export Data',
        icon: 'download',
        action: 'export',
        enabled: true
      }
    ];

    return {
      primary,
      secondary,
      metrics,
      actions
    };
  }

  /**
   * Get comprehensive context for a cell
   */
  public getCellContext(cell: H3Cell): CellContext {
    const cacheKey = `${cell.id}_${Date.now() - (Date.now() % 300000)}`; // 5-minute cache
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    const context = this.generateCellContext(cell);
    this.contextCache.set(cacheKey, context);
    
    return context;
  }

  /**
   * Generate detailed cell context
   */
  private generateCellContext(cell: H3Cell): CellContext {
    const opportunityScore = cell.isLand ? 
      this.opportunityAnalysis.calculateOpportunityScore(cell) : undefined;
    
    const marketData = this.generateMarketData(cell);
    const competitionData = this.generateCompetitionData(cell);
    const neighbors = this.getNeighborCells(cell);
    const regionInfo = this.getRegionInfo(cell);
    const recommendations = opportunityScore?.recommendations || [];

    return {
      cell,
      opportunityScore,
      marketData,
      competitionData,
      neighbors,
      regionInfo,
      recommendations
    };
  }

  /**
   * Generate synthetic market data for demonstration
   */
  private generateMarketData(cell: H3Cell): MarketData {
    const lat = cell.center[1];
    const lng = cell.center[0];
    
    // Base values with geographic variation
    const populationDensity = this.getPopulationDensity(lat, lng);
    const economicLevel = this.getEconomicLevel(lat, lng);
    
    return {
      population: Math.round(populationDensity * cell.area * 10),
      gdpPerCapita: Math.round(economicLevel * 65000),
      marketSize: Math.round(populationDensity * economicLevel * 100),
      growthRate: 2 + Math.random() * 8,
      penetrationRate: 20 + Math.random() * 60,
      averageRevenue: Math.round(economicLevel * 500),
      competitorCount: Math.floor(economicLevel * 5) + 1
    };
  }

  /**
   * Generate synthetic competition data
   */
  private generateCompetitionData(cell: H3Cell): CompetitionData {
    const economicLevel = this.getEconomicLevel(cell.center[1], cell.center[0]);
    const competitorCount = Math.floor(economicLevel * 3) + 1;
    
    const providers: CompetitorInfo[] = [];
    const marketShareTotal = 100;
    let remainingShare = marketShareTotal;
    
    const providerNames = ['GlobalSat', 'SkyConnect', 'OrbitNet', 'SpaceLink', 'CosmosCom'];
    
    for (let i = 0; i < competitorCount && i < providerNames.length; i++) {
      const share = i === competitorCount - 1 ? remainingShare : 
        Math.floor(Math.random() * (remainingShare / (competitorCount - i)));
      remainingShare -= share;
      
      providers.push({
        name: providerNames[i],
        marketShare: share,
        serviceTypes: ['Broadband', 'IoT', 'Voice'].slice(0, Math.floor(Math.random() * 3) + 1),
        coverage: 60 + Math.random() * 40,
        pricing: ['Budget', 'Mid-tier', 'Premium'][Math.floor(Math.random() * 3)],
        strengths: ['Network coverage', 'Price competitive', 'Service quality', 'Customer support'].slice(0, 2),
        weaknesses: ['Limited coverage', 'High pricing', 'Service gaps', 'Legacy technology'].slice(0, 2)
      });
    }

    const marketShare: Record<string, number> = {};
    providers.forEach(p => {
      marketShare[p.name] = p.marketShare;
    });

    return {
      providers,
      marketShare,
      pricingTiers: [
        {
          name: 'Basic',
          pricePerMbps: 5 + Math.random() * 10,
          features: ['Standard bandwidth', 'Best effort'],
          targetSegment: 'Consumer'
        },
        {
          name: 'Professional',
          pricePerMbps: 15 + Math.random() * 20,
          features: ['Guaranteed bandwidth', 'SLA', 'Priority support'],
          targetSegment: 'Enterprise'
        },
        {
          name: 'Premium',
          pricePerMbps: 40 + Math.random() * 30,
          features: ['Dedicated bandwidth', '99.9% SLA', '24/7 support', 'Custom solutions'],
          targetSegment: 'Critical applications'
        }
      ],
      serviceGaps: ['Rural coverage', 'High-speed options', 'IoT connectivity'],
      differentiationOpportunities: ['5G integration', 'Edge computing', 'Maritime services', 'Emergency communications']
    };
  }

  /**
   * Helper methods
   */
  private createInitialState(): InteractionState {
    return {
      hoveredCell: null,
      selectedCells: [],
      highlightedRegion: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        cell: null
      },
      selectionMode: 'single',
      dragState: {
        isDragging: false,
        startCell: null,
        currentCells: []
      }
    };
  }

  private setState(updates: Partial<InteractionState>): void {
    this.state = { ...this.state, ...updates };
  }

  private preloadCellContext(cell: H3Cell): void {
    // Pre-load context in background
    setTimeout(() => {
      this.getCellContext(cell);
    }, 0);
  }

  private selectCellsBetween(cell1: H3Cell, cell2: H3Cell): H3Cell[] {
    // Simplified region selection - in practice, would use H3 algorithms
    const lat1 = cell1.center[1], lng1 = cell1.center[0];
    const lat2 = cell2.center[1], lng2 = cell2.center[0];
    
    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLng = Math.min(lng1, lng2);
    const maxLng = Math.max(lng1, lng2);
    
    // Return cells in bounding box (simplified)
    return [cell1, cell2]; // In practice, would calculate actual cells in region
  }

  private getNeighborCells(cell: H3Cell): H3Cell[] {
    // Return empty array - would be populated by H3 neighbor calculation
    return [];
  }

  private getRegionInfo(cell: H3Cell): RegionInfo {
    const lat = cell.center[1];
    const lng = cell.center[0];
    
    // Simplified region detection
    if (lng >= -130 && lng <= -60 && lat >= 25 && lat <= 70) {
      return {
        name: 'North America',
        timeZone: 'UTC-5 to UTC-8',
        primaryLanguages: ['English', 'Spanish', 'French'],
        currency: 'USD',
        regulatoryFramework: 'FCC/CRTC',
        licenseRequirements: ['Satellite operator license', 'Spectrum allocation'],
        taxImplications: 'Federal and state/provincial taxes apply',
        culturalConsiderations: ['Privacy regulations', 'Net neutrality', 'Accessibility requirements']
      };
    }
    
    // Default region
    return {
      name: 'International Waters',
      timeZone: 'UTC',
      primaryLanguages: ['English'],
      currency: 'USD',
      regulatoryFramework: 'ITU',
      licenseRequirements: ['ITU coordination', 'Flag state approval'],
      taxImplications: 'Maritime tax implications',
      culturalConsiderations: ['International regulations', 'UNCLOS compliance']
    };
  }

  private getPopulationDensity(lat: number, lng: number): number {
    // Simplified population density calculation
    return 0.1 + Math.random() * 0.9;
  }

  private getEconomicLevel(lat: number, lng: number): number {
    // Simplified economic level calculation
    if ((lng >= -130 && lng <= -60 && lat >= 25 && lat <= 70) ||
        (lng >= -15 && lng <= 45 && lat >= 35 && lat <= 65)) {
      return 0.7 + Math.random() * 0.3;
    }
    return 0.3 + Math.random() * 0.4;
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return '#ef4444'; // Red (critical)
    if (score >= 65) return '#f97316'; // Orange (high)
    if (score >= 45) return '#eab308'; // Yellow (medium)
    return '#22c55e'; // Green (low)
  }

  /**
   * Public API methods
   */
  public getState(): InteractionState {
    return { ...this.state };
  }

  public setSelectionMode(mode: 'single' | 'multiple' | 'region'): void {
    this.setState({ selectionMode: mode });
  }

  public clearSelections(): void {
    this.setState({ selectedCells: [] });
  }

  public hideContextMenu(): void {
    this.setState({
      contextMenu: { ...this.state.contextMenu, visible: false }
    });
  }

  public executeAction(action: string, cell: H3Cell): void {
    switch (action) {
      case 'select':
        this.handleCellSelection(cell);
        break;
      case 'details':
        // Emit event or callback for detail view
        break;
      case 'analyze':
        // Emit event or callback for region analysis
        break;
      case 'export':
        // Emit event or callback for data export
        break;
    }
  }

  public destroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    this.contextCache.clear();
  }
}