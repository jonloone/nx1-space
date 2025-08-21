import { LensType } from '@/lib/store/foundryStore';

export type TemplateCategory = 'universal' | 'maritime' | 'telecom' | 'manufacturing' | 'energy' | 'defense';
export type DataRequirementType = 'required' | 'optional' | 'enhanced';

export interface DataRequirement {
  field: string;
  type: string;
  requirement: DataRequirementType;
  description: string;
  fallback?: any;
}

export interface TemplateWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'network' | 'timeline' | 'list' | 'detail';
  title: string;
  dataBinding: string[];
  position: { x: number; y: number; w: number; h: number };
  config?: Record<string, any>;
}

export interface TemplateLayout {
  id: string;
  name: string;
  widgets: TemplateWidget[];
  responsive: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail?: string;
  icon?: string;
  
  // Data requirements
  dataRequirements: DataRequirement[];
  
  // Lens configurations
  supportedLenses: LensType[];
  defaultLens: LensType;
  
  // Layouts for different lenses
  layouts: {
    [K in LensType]?: TemplateLayout;
  };
  
  // Data transformations
  transformations?: {
    [key: string]: (data: any) => any;
  };
  
  // Template-specific configuration
  config: {
    refreshInterval?: number;
    autoLoad?: boolean;
    cacheEnabled?: boolean;
    aiInsightsEnabled?: boolean;
  };
  
  // Metadata
  version: string;
  author?: string;
  lastUpdated: Date;
  popularity?: number;
}

export interface TemplateCompatibility {
  template: Template;
  compatibility: number; // 0-100 percentage
  missingRequired: DataRequirement[];
  missingOptional: DataRequirement[];
  availableEnhancements: DataRequirement[];
  recommendedLens: LensType;
  warnings: string[];
}

export class TemplateEngine {
  private templates: Map<string, Template> = new Map();
  private loadedTemplates: Map<string, any> = new Map();
  
  constructor() {
    this.initializeBuiltInTemplates();
  }
  
  private initializeBuiltInTemplates() {
    // Built-in templates will be registered here
    this.registerTemplate(this.createCustomer360Template());
    this.registerTemplate(this.createAssetTrackerTemplate());
    this.registerTemplate(this.createOperationalDashboardTemplate());
    this.registerTemplate(this.createBOMAnalyzerTemplate());
    this.registerTemplate(this.createRiskMonitorTemplate());
  }
  
  registerTemplate(template: Template) {
    this.templates.set(template.id, template);
  }
  
  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }
  
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }
  
  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }
  
  getTemplatesByLens(lens: LensType): Template[] {
    return this.getAllTemplates().filter(t => t.supportedLenses.includes(lens));
  }
  
  checkCompatibility(template: Template, availableData: Record<string, any>): TemplateCompatibility {
    const missingRequired: DataRequirement[] = [];
    const missingOptional: DataRequirement[] = [];
    const availableEnhancements: DataRequirement[] = [];
    const warnings: string[] = [];
    
    // Check each data requirement
    for (const req of template.dataRequirements) {
      const hasData = this.checkDataAvailability(req, availableData);
      
      if (!hasData) {
        if (req.requirement === 'required') {
          missingRequired.push(req);
        } else if (req.requirement === 'optional') {
          missingOptional.push(req);
        }
      } else if (req.requirement === 'enhanced') {
        availableEnhancements.push(req);
      }
    }
    
    // Calculate compatibility percentage
    const totalRequired = template.dataRequirements.filter(r => r.requirement === 'required').length;
    const foundRequired = totalRequired - missingRequired.length;
    const compatibility = totalRequired > 0 ? (foundRequired / totalRequired) * 100 : 100;
    
    // Determine recommended lens based on available data
    const recommendedLens = this.determineRecommendedLens(template, availableData);
    
    // Add warnings
    if (missingRequired.length > 0) {
      warnings.push(`Missing ${missingRequired.length} required data fields`);
    }
    if (compatibility < 50) {
      warnings.push('Low compatibility - template may not function properly');
    }
    
    return {
      template,
      compatibility,
      missingRequired,
      missingOptional,
      availableEnhancements,
      recommendedLens,
      warnings
    };
  }
  
  private checkDataAvailability(requirement: DataRequirement, data: Record<string, any>): boolean {
    // Check if the required field exists in the data
    const fields = requirement.field.split('.');
    let current = data;
    
    for (const field of fields) {
      if (current && typeof current === 'object' && field in current) {
        current = current[field];
      } else {
        return false;
      }
    }
    
    return true;
  }
  
  private determineRecommendedLens(template: Template, data: Record<string, any>): LensType {
    // Logic to determine the best lens based on available data
    if (data.coordinates || data.location || data.geometry) {
      return 'spatial';
    }
    if (data.relationships || data.connections || data.edges) {
      return 'network';
    }
    if (data.timestamp || data.timeseries || data.historical) {
      return 'temporal';
    }
    
    return template.defaultLens;
  }
  
  async loadTemplate(
    templateId: string, 
    data: Record<string, any>,
    lens?: LensType
  ): Promise<any> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Check compatibility
    const compatibility = this.checkCompatibility(template, data);
    if (compatibility.compatibility < 30) {
      throw new Error('Insufficient data for template');
    }
    
    // Determine which lens to use
    const targetLens = lens || compatibility.recommendedLens;
    
    // Get the layout for the target lens
    const layout = template.layouts[targetLens];
    if (!layout) {
      throw new Error(`Template does not support ${targetLens} lens`);
    }
    
    // Apply transformations
    const transformedData = this.applyTransformations(template, data);
    
    // Build the template instance
    const instance = {
      template,
      lens: targetLens,
      layout,
      data: transformedData,
      compatibility,
      widgets: this.instantiateWidgets(layout, transformedData)
    };
    
    // Cache the loaded template
    this.loadedTemplates.set(`${templateId}-${targetLens}`, instance);
    
    return instance;
  }
  
  private applyTransformations(template: Template, data: Record<string, any>): Record<string, any> {
    if (!template.transformations) {
      return data;
    }
    
    const transformed = { ...data };
    
    for (const [key, transformer] of Object.entries(template.transformations)) {
      if (key in data) {
        transformed[key] = transformer(data[key]);
      }
    }
    
    return transformed;
  }
  
  private instantiateWidgets(layout: TemplateLayout, data: Record<string, any>): any[] {
    return layout.widgets.map(widget => {
      const widgetData = this.extractWidgetData(widget, data);
      
      return {
        ...widget,
        data: widgetData,
        status: widgetData ? 'ready' : 'no-data'
      };
    });
  }
  
  private extractWidgetData(widget: TemplateWidget, data: Record<string, any>): any {
    const result: Record<string, any> = {};
    
    for (const binding of widget.dataBinding) {
      const value = this.getNestedValue(data, binding);
      if (value !== undefined) {
        result[binding] = value;
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  }
  
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  // Template creation methods
  private createCustomer360Template(): Template {
    return {
      id: 'customer-360',
      name: 'Customer 360',
      description: 'Complete view of customer relationships and interactions',
      category: 'universal',
      tags: ['customer', 'relationships', 'analytics'],
      
      dataRequirements: [
        {
          field: 'customer.id',
          type: 'string',
          requirement: 'required',
          description: 'Unique customer identifier'
        },
        {
          field: 'customer.name',
          type: 'string',
          requirement: 'required',
          description: 'Customer name'
        },
        {
          field: 'customer.location',
          type: 'object',
          requirement: 'optional',
          description: 'Customer location data'
        },
        {
          field: 'customer.transactions',
          type: 'array',
          requirement: 'optional',
          description: 'Transaction history'
        },
        {
          field: 'customer.relationships',
          type: 'array',
          requirement: 'enhanced',
          description: 'Related entities and connections'
        }
      ],
      
      supportedLenses: ['network', 'spatial', 'temporal', 'hybrid'],
      defaultLens: 'network',
      
      layouts: {
        network: {
          id: 'customer-360-network',
          name: 'Network View',
          responsive: true,
          widgets: [
            {
              id: 'customer-graph',
              type: 'network',
              title: 'Customer Relationships',
              dataBinding: ['customer.relationships', 'customer.id'],
              position: { x: 0, y: 0, w: 8, h: 6 }
            },
            {
              id: 'customer-details',
              type: 'detail',
              title: 'Customer Details',
              dataBinding: ['customer.name', 'customer.id', 'customer.status'],
              position: { x: 8, y: 0, w: 4, h: 3 }
            },
            {
              id: 'customer-metrics',
              type: 'metric',
              title: 'Key Metrics',
              dataBinding: ['customer.revenue', 'customer.transactions'],
              position: { x: 8, y: 3, w: 4, h: 3 }
            }
          ]
        },
        spatial: {
          id: 'customer-360-spatial',
          name: 'Geographic View',
          responsive: true,
          widgets: [
            {
              id: 'customer-map',
              type: 'map',
              title: 'Customer Locations',
              dataBinding: ['customer.location', 'customer.sites'],
              position: { x: 0, y: 0, w: 9, h: 6 }
            },
            {
              id: 'location-list',
              type: 'list',
              title: 'Sites',
              dataBinding: ['customer.sites'],
              position: { x: 9, y: 0, w: 3, h: 6 }
            }
          ]
        }
      },
      
      config: {
        refreshInterval: 30000,
        autoLoad: true,
        cacheEnabled: true,
        aiInsightsEnabled: true
      },
      
      version: '1.0.0',
      lastUpdated: new Date(),
      popularity: 95
    };
  }
  
  private createAssetTrackerTemplate(): Template {
    return {
      id: 'asset-tracker',
      name: 'Asset Tracker',
      description: 'Track and analyze physical assets across locations',
      category: 'universal',
      tags: ['assets', 'tracking', 'logistics'],
      
      dataRequirements: [
        {
          field: 'assets',
          type: 'array',
          requirement: 'required',
          description: 'List of assets to track'
        },
        {
          field: 'assets[].location',
          type: 'object',
          requirement: 'required',
          description: 'Asset location coordinates'
        },
        {
          field: 'assets[].status',
          type: 'string',
          requirement: 'optional',
          description: 'Current asset status'
        }
      ],
      
      supportedLenses: ['spatial', 'temporal', 'hybrid'],
      defaultLens: 'spatial',
      
      layouts: {
        spatial: {
          id: 'asset-tracker-spatial',
          name: 'Map View',
          responsive: true,
          widgets: [
            {
              id: 'asset-map',
              type: 'map',
              title: 'Asset Locations',
              dataBinding: ['assets'],
              position: { x: 0, y: 0, w: 12, h: 6 }
            }
          ]
        }
      },
      
      config: {
        refreshInterval: 10000,
        autoLoad: true,
        cacheEnabled: false,
        aiInsightsEnabled: true
      },
      
      version: '1.0.0',
      lastUpdated: new Date(),
      popularity: 88
    };
  }
  
  private createOperationalDashboardTemplate(): Template {
    return {
      id: 'operational-dashboard',
      name: 'Operational Dashboard',
      description: 'Real-time monitoring of operations and KPIs',
      category: 'universal',
      tags: ['operations', 'monitoring', 'kpi'],
      
      dataRequirements: [
        {
          field: 'metrics',
          type: 'object',
          requirement: 'required',
          description: 'Operational metrics'
        },
        {
          field: 'timeseries',
          type: 'array',
          requirement: 'optional',
          description: 'Time-series data'
        }
      ],
      
      supportedLenses: ['temporal', 'hybrid'],
      defaultLens: 'temporal',
      
      layouts: {
        temporal: {
          id: 'ops-dashboard-temporal',
          name: 'Time View',
          responsive: true,
          widgets: [
            {
              id: 'metrics-chart',
              type: 'chart',
              title: 'Performance Metrics',
              dataBinding: ['metrics', 'timeseries'],
              position: { x: 0, y: 0, w: 12, h: 6 }
            }
          ]
        }
      },
      
      config: {
        refreshInterval: 5000,
        autoLoad: true,
        cacheEnabled: false,
        aiInsightsEnabled: true
      },
      
      version: '1.0.0',
      lastUpdated: new Date(),
      popularity: 92
    };
  }
  
  private createBOMAnalyzerTemplate(): Template {
    return {
      id: 'bom-analyzer',
      name: 'BOM Analyzer',
      description: 'Bill of Materials analysis and cost optimization',
      category: 'manufacturing',
      tags: ['bom', 'manufacturing', 'supply-chain'],
      
      dataRequirements: [
        {
          field: 'bom',
          type: 'object',
          requirement: 'required',
          description: 'Bill of Materials structure'
        },
        {
          field: 'bom.components',
          type: 'array',
          requirement: 'required',
          description: 'Component list'
        },
        {
          field: 'bom.costs',
          type: 'object',
          requirement: 'optional',
          description: 'Cost breakdown'
        }
      ],
      
      supportedLenses: ['network', 'temporal'],
      defaultLens: 'network',
      
      layouts: {
        network: {
          id: 'bom-network',
          name: 'Component Tree',
          responsive: true,
          widgets: [
            {
              id: 'bom-tree',
              type: 'network',
              title: 'BOM Structure',
              dataBinding: ['bom', 'bom.components'],
              position: { x: 0, y: 0, w: 8, h: 6 }
            },
            {
              id: 'cost-breakdown',
              type: 'chart',
              title: 'Cost Analysis',
              dataBinding: ['bom.costs'],
              position: { x: 8, y: 0, w: 4, h: 6 }
            }
          ]
        }
      },
      
      config: {
        autoLoad: true,
        cacheEnabled: true,
        aiInsightsEnabled: true
      },
      
      version: '1.0.0',
      lastUpdated: new Date(),
      popularity: 76
    };
  }
  
  private createRiskMonitorTemplate(): Template {
    return {
      id: 'risk-monitor',
      name: 'Risk Monitor',
      description: 'Identify and assess potential risks and opportunities',
      category: 'universal',
      tags: ['risk', 'compliance', 'monitoring'],
      
      dataRequirements: [
        {
          field: 'risks',
          type: 'array',
          requirement: 'required',
          description: 'Risk items'
        },
        {
          field: 'risks[].severity',
          type: 'number',
          requirement: 'required',
          description: 'Risk severity level'
        },
        {
          field: 'risks[].location',
          type: 'object',
          requirement: 'optional',
          description: 'Risk location'
        }
      ],
      
      supportedLenses: ['spatial', 'temporal', 'hybrid'],
      defaultLens: 'hybrid',
      
      layouts: {
        hybrid: {
          id: 'risk-hybrid',
          name: 'Combined View',
          responsive: true,
          widgets: [
            {
              id: 'risk-map',
              type: 'map',
              title: 'Risk Locations',
              dataBinding: ['risks'],
              position: { x: 0, y: 0, w: 6, h: 6 }
            },
            {
              id: 'risk-timeline',
              type: 'timeline',
              title: 'Risk Timeline',
              dataBinding: ['risks'],
              position: { x: 6, y: 0, w: 6, h: 6 }
            }
          ]
        }
      },
      
      config: {
        refreshInterval: 15000,
        autoLoad: true,
        cacheEnabled: false,
        aiInsightsEnabled: true
      },
      
      version: '1.0.0',
      lastUpdated: new Date(),
      popularity: 84
    };
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine();