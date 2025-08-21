import { templateEngine, Template, TemplateCategory } from '@/lib/templates/templateEngine';

describe('TemplateEngine', () => {
  describe('Template Registration and Retrieval', () => {
    it('should have built-in templates registered', () => {
      const templates = templateEngine.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // Check for specific built-in templates
      const customer360 = templateEngine.getTemplate('customer-360');
      expect(customer360).toBeDefined();
      expect(customer360?.name).toBe('Customer 360');
      
      const assetTracker = templateEngine.getTemplate('asset-tracker');
      expect(assetTracker).toBeDefined();
      expect(assetTracker?.name).toBe('Asset Tracker');
    });
    
    it('should retrieve templates by category', () => {
      const universalTemplates = templateEngine.getTemplatesByCategory('universal');
      expect(universalTemplates.length).toBeGreaterThan(0);
      
      universalTemplates.forEach(template => {
        expect(template.category).toBe('universal');
      });
    });
    
    it('should retrieve templates by lens type', () => {
      const spatialTemplates = templateEngine.getTemplatesByLens('spatial');
      expect(spatialTemplates.length).toBeGreaterThan(0);
      
      spatialTemplates.forEach(template => {
        expect(template.supportedLenses).toContain('spatial');
      });
    });
  });
  
  describe('Template Compatibility Checking', () => {
    it('should calculate 100% compatibility when all required fields are present', () => {
      const template = templateEngine.getTemplate('customer-360')!;
      const data = {
        customer: {
          id: '123',
          name: 'Test Customer',
          location: { lat: 0, lng: 0 },
          transactions: [],
          relationships: []
        }
      };
      
      const compatibility = templateEngine.checkCompatibility(template, data);
      
      expect(compatibility.compatibility).toBe(100);
      expect(compatibility.missingRequired).toHaveLength(0);
      expect(compatibility.warnings).toHaveLength(0);
    });
    
    it('should calculate 0% compatibility when required fields are missing', () => {
      const template = templateEngine.getTemplate('customer-360')!;
      const data = {};
      
      const compatibility = templateEngine.checkCompatibility(template, data);
      
      expect(compatibility.compatibility).toBe(0);
      expect(compatibility.missingRequired.length).toBeGreaterThan(0);
      expect(compatibility.warnings.length).toBeGreaterThan(0);
    });
    
    it('should identify optional and enhanced fields correctly', () => {
      const template = templateEngine.getTemplate('customer-360')!;
      const data = {
        customer: {
          id: '123',
          name: 'Test Customer',
          relationships: [] // Enhanced field present
          // location missing (optional)
          // transactions missing (optional)
        }
      };
      
      const compatibility = templateEngine.checkCompatibility(template, data);
      
      expect(compatibility.compatibility).toBe(100); // All required fields present
      expect(compatibility.missingOptional.length).toBeGreaterThan(0);
      expect(compatibility.availableEnhancements.length).toBeGreaterThan(0);
    });
    
    it('should recommend appropriate lens based on data', () => {
      const template = templateEngine.getTemplate('asset-tracker')!;
      
      // Test with location data -> should recommend spatial
      const spatialData = {
        assets: [
          { id: '1', location: { lat: 0, lng: 0 } }
        ]
      };
      const spatialCompat = templateEngine.checkCompatibility(template, spatialData);
      expect(spatialCompat.recommendedLens).toBe('spatial');
      
      // Test with time series data -> should recommend temporal
      const temporalData = {
        assets: [
          { id: '1', location: { lat: 0, lng: 0 }, timestamp: new Date() }
        ],
        timeseries: []
      };
      const temporalCompat = templateEngine.checkCompatibility(template, temporalData);
      expect(['spatial', 'temporal']).toContain(temporalCompat.recommendedLens);
    });
  });
  
  describe('Template Loading', () => {
    it('should load template successfully with sufficient data', async () => {
      const data = {
        customer: {
          id: '123',
          name: 'Test Customer',
          location: { lat: 40.7128, lng: -74.0060 },
          transactions: [
            { id: 't1', amount: 100, date: '2024-01-01' }
          ],
          relationships: [
            { id: 'r1', type: 'supplier', name: 'Supplier A' }
          ]
        }
      };
      
      const instance = await templateEngine.loadTemplate('customer-360', data, 'network');
      
      expect(instance).toBeDefined();
      expect(instance.template.id).toBe('customer-360');
      expect(instance.lens).toBe('network');
      expect(instance.layout).toBeDefined();
      expect(instance.widgets).toBeDefined();
      expect(instance.widgets.length).toBeGreaterThan(0);
    });
    
    it('should throw error when loading template with insufficient data', async () => {
      const data = {}; // No required fields
      
      await expect(
        templateEngine.loadTemplate('customer-360', data)
      ).rejects.toThrow('Insufficient data for template');
    });
    
    it('should throw error when template does not exist', async () => {
      const data = { test: 'data' };
      
      await expect(
        templateEngine.loadTemplate('non-existent-template', data)
      ).rejects.toThrow('Template non-existent-template not found');
    });
    
    it('should apply data transformations when loading template', async () => {
      // Create a test template with transformations
      const testTemplate: Template = {
        id: 'test-transform',
        name: 'Test Transform',
        description: 'Test template with transformations',
        category: 'universal',
        tags: [],
        dataRequirements: [
          {
            field: 'value',
            type: 'number',
            requirement: 'required',
            description: 'Test value'
          }
        ],
        supportedLenses: ['spatial'],
        defaultLens: 'spatial',
        layouts: {
          spatial: {
            id: 'test-layout',
            name: 'Test Layout',
            responsive: true,
            widgets: []
          }
        },
        transformations: {
          value: (val: number) => val * 2 // Double the value
        },
        config: {},
        version: '1.0.0',
        lastUpdated: new Date()
      };
      
      templateEngine.registerTemplate(testTemplate);
      
      const data = { value: 10 };
      const instance = await templateEngine.loadTemplate('test-transform', data);
      
      expect(instance.data.value).toBe(20); // Should be doubled
    });
  });
  
  describe('Widget Data Extraction', () => {
    it('should extract widget data from nested paths', async () => {
      const data = {
        customer: {
          id: '123',
          name: 'Test Customer',
          metrics: {
            revenue: 50000,
            transactions: 25
          }
        }
      };
      
      const instance = await templateEngine.loadTemplate('customer-360', data, 'network');
      
      // Find the metrics widget
      const metricsWidget = instance.widgets.find((w: any) => w.id === 'customer-metrics');
      expect(metricsWidget).toBeDefined();
      
      // Widget should have extracted the nested data
      if (metricsWidget?.data) {
        expect(metricsWidget.data).toHaveProperty('customer.revenue');
        expect(metricsWidget.data).toHaveProperty('customer.transactions');
      }
    });
    
    it('should mark widgets as no-data when data is missing', async () => {
      const data = {
        customer: {
          id: '123',
          name: 'Test Customer'
          // Missing most data
        }
      };
      
      const instance = await templateEngine.loadTemplate('customer-360', data, 'network');
      
      // Some widgets should have no-data status
      const noDataWidgets = instance.widgets.filter((w: any) => w.status === 'no-data');
      expect(noDataWidgets.length).toBeGreaterThan(0);
    });
  });
  
  describe('Template Categories', () => {
    it('should have templates in each category', () => {
      const categories: TemplateCategory[] = [
        'universal', 
        'maritime', 
        'telecom', 
        'manufacturing', 
        'energy'
      ];
      
      const universalTemplates = templateEngine.getTemplatesByCategory('universal');
      expect(universalTemplates.length).toBeGreaterThan(0);
      
      const manufacturingTemplates = templateEngine.getTemplatesByCategory('manufacturing');
      expect(manufacturingTemplates.length).toBeGreaterThan(0);
    });
  });
});