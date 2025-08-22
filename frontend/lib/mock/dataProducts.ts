// Mock data products following ODPS v3.1 specification

export interface DataProduct {
  openDataProductSpecVersion: string;
  product: {
    id: string;
    name: string;
    description: string;
    domain: string;
    status: 'draft' | 'published' | 'deprecated';
    version: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    dataProductOwner: {
      name: string;
      email: string;
    };
    tags: string[];
    industry?: string;
  };
  dataAccess: {
    interface: {
      api?: {
        type: string;
        specification: string;
        endpoint: string;
      };
      sql?: {
        type: string;
        dialect: string;
        view: string;
      };
      stream?: {
        type: string;
        topic: string;
      };
    };
    format: string[];
    accessUrl: string;
  };
  dataQuality: {
    sla: {
      availability: string;
      responseTime: string;
      updateFrequency: string;
    };
    qualityMetrics: {
      completeness: number;
      accuracy: number;
      consistency: number;
      timeliness: number;
    };
  };
  dataContract?: {
    schema: any;
    quality: {
      rules: string[];
      monitoring: string;
    };
    governance: {
      retention: string;
      privacy: string;
      compliance: string[];
    };
  };
  usage?: {
    consumers: number;
    avgQueriesPerDay: number;
    lastAccessed: string;
    rating: number;
  };
}

export const mockDataProducts: DataProduct[] = [
  {
    openDataProductSpecVersion: '3.1',
    product: {
      id: 'dp-cust360-001',
      name: 'Customer 360 View',
      description: 'Comprehensive customer profile with purchase history and engagement metrics',
      domain: 'Customer Intelligence',
      status: 'published',
      version: '2.1.0'
    },
    metadata: {
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-11-20T14:30:00Z',
      dataProductOwner: {
        name: 'Data Engineering Team',
        email: 'data-eng@company.com'
      },
      tags: ['customer', '360-view', 'analytics', 'marketing', 'sales'],
      industry: 'Retail'
    },
    dataAccess: {
      interface: {
        api: {
          type: 'REST',
          specification: 'OpenAPI 3.0',
          endpoint: '/api/v2/customer360'
        },
        sql: {
          type: 'SQL',
          dialect: 'PostgreSQL',
          view: 'analytics.customer_360_v2'
        },
        stream: {
          type: 'Kafka',
          topic: 'customer-360-updates'
        }
      },
      format: ['JSON', 'Parquet', 'CSV'],
      accessUrl: 'https://data.company.com/products/customer360'
    },
    dataQuality: {
      sla: {
        availability: '99.9%',
        responseTime: '<500ms',
        updateFrequency: '5 minutes'
      },
      qualityMetrics: {
        completeness: 0.98,
        accuracy: 0.995,
        consistency: 0.97,
        timeliness: 0.99
      }
    },
    dataContract: {
      schema: {},
      quality: {
        rules: ['No PII exposed', 'Email validation', 'Phone number formatting'],
        monitoring: 'automated'
      },
      governance: {
        retention: '2 years',
        privacy: 'PII encrypted',
        compliance: ['GDPR', 'CCPA', 'SOC2']
      }
    },
    usage: {
      consumers: 47,
      avgQueriesPerDay: 12500,
      lastAccessed: '2024-11-22T18:45:00Z',
      rating: 4.8
    }
  },
  {
    openDataProductSpecVersion: '3.1',
    product: {
      id: 'dp-sales-002',
      name: 'Sales Performance Metrics',
      description: 'Real-time sales metrics with regional breakdowns and trend analysis',
      domain: 'Sales Analytics',
      status: 'published',
      version: '1.5.0'
    },
    metadata: {
      createdAt: '2024-03-20T09:00:00Z',
      updatedAt: '2024-11-21T16:00:00Z',
      dataProductOwner: {
        name: 'Analytics Team',
        email: 'analytics@company.com'
      },
      tags: ['sales', 'revenue', 'performance', 'kpi', 'executive'],
      industry: 'Technology'
    },
    dataAccess: {
      interface: {
        api: {
          type: 'GraphQL',
          specification: 'GraphQL Schema',
          endpoint: '/graphql/sales'
        },
        sql: {
          type: 'SQL',
          dialect: 'Snowflake',
          view: 'analytics.sales_performance'
        }
      },
      format: ['JSON', 'Parquet'],
      accessUrl: 'https://data.company.com/products/sales-performance'
    },
    dataQuality: {
      sla: {
        availability: '99.5%',
        responseTime: '<2s',
        updateFrequency: '15 minutes'
      },
      qualityMetrics: {
        completeness: 0.94,
        accuracy: 0.98,
        consistency: 0.96,
        timeliness: 0.97
      }
    },
    usage: {
      consumers: 23,
      avgQueriesPerDay: 8700,
      lastAccessed: '2024-11-22T19:00:00Z',
      rating: 4.6
    }
  },
  {
    openDataProductSpecVersion: '3.1',
    product: {
      id: 'dp-inventory-003',
      name: 'Real-time Inventory Tracker',
      description: 'Live inventory levels across all warehouses with predictive analytics',
      domain: 'Supply Chain',
      status: 'published',
      version: '3.0.0'
    },
    metadata: {
      createdAt: '2023-11-01T08:00:00Z',
      updatedAt: '2024-11-22T10:00:00Z',
      dataProductOwner: {
        name: 'Supply Chain Team',
        email: 'supply-chain@company.com'
      },
      tags: ['inventory', 'warehouse', 'real-time', 'logistics'],
      industry: 'Manufacturing'
    },
    dataAccess: {
      interface: {
        api: {
          type: 'REST',
          specification: 'OpenAPI 3.0',
          endpoint: '/api/v1/inventory'
        },
        stream: {
          type: 'Kafka',
          topic: 'inventory-updates'
        }
      },
      format: ['JSON', 'Avro'],
      accessUrl: 'https://data.company.com/products/inventory'
    },
    dataQuality: {
      sla: {
        availability: '99.99%',
        responseTime: '<100ms',
        updateFrequency: 'real-time'
      },
      qualityMetrics: {
        completeness: 0.99,
        accuracy: 0.999,
        consistency: 0.98,
        timeliness: 1.0
      }
    },
    usage: {
      consumers: 89,
      avgQueriesPerDay: 45000,
      lastAccessed: '2024-11-22T19:30:00Z',
      rating: 4.9
    }
  },
  {
    openDataProductSpecVersion: '3.1',
    product: {
      id: 'dp-fraud-004',
      name: 'Fraud Detection Signals',
      description: 'ML-powered fraud detection signals with risk scoring',
      domain: 'Risk Management',
      status: 'published',
      version: '1.2.0'
    },
    metadata: {
      createdAt: '2024-06-15T11:00:00Z',
      updatedAt: '2024-11-20T09:00:00Z',
      dataProductOwner: {
        name: 'Risk Team',
        email: 'risk@company.com'
      },
      tags: ['fraud', 'risk', 'ml', 'security', 'compliance'],
      industry: 'Financial Services'
    },
    dataAccess: {
      interface: {
        api: {
          type: 'REST',
          specification: 'OpenAPI 3.0',
          endpoint: '/api/v1/fraud-signals'
        },
        stream: {
          type: 'Kinesis',
          topic: 'fraud-alerts'
        }
      },
      format: ['JSON'],
      accessUrl: 'https://data.company.com/products/fraud-signals'
    },
    dataQuality: {
      sla: {
        availability: '99.95%',
        responseTime: '<50ms',
        updateFrequency: 'real-time'
      },
      qualityMetrics: {
        completeness: 0.97,
        accuracy: 0.92,
        consistency: 0.95,
        timeliness: 1.0
      }
    },
    usage: {
      consumers: 15,
      avgQueriesPerDay: 125000,
      lastAccessed: '2024-11-22T19:45:00Z',
      rating: 4.7
    }
  },
  {
    openDataProductSpecVersion: '3.1',
    product: {
      id: 'dp-marketing-005',
      name: 'Campaign Performance Analytics',
      description: 'Multi-channel marketing campaign performance with attribution modeling',
      domain: 'Marketing',
      status: 'draft',
      version: '0.9.0'
    },
    metadata: {
      createdAt: '2024-10-01T14:00:00Z',
      updatedAt: '2024-11-22T11:00:00Z',
      dataProductOwner: {
        name: 'Marketing Analytics',
        email: 'marketing-analytics@company.com'
      },
      tags: ['marketing', 'campaigns', 'attribution', 'roi', 'conversion'],
      industry: 'E-commerce'
    },
    dataAccess: {
      interface: {
        api: {
          type: 'REST',
          specification: 'OpenAPI 3.0',
          endpoint: '/api/v1/campaign-analytics'
        },
        sql: {
          type: 'SQL',
          dialect: 'BigQuery',
          view: 'marketing.campaign_performance'
        }
      },
      format: ['JSON', 'CSV'],
      accessUrl: 'https://data.company.com/products/campaign-analytics'
    },
    dataQuality: {
      sla: {
        availability: '99%',
        responseTime: '<3s',
        updateFrequency: 'hourly'
      },
      qualityMetrics: {
        completeness: 0.88,
        accuracy: 0.94,
        consistency: 0.91,
        timeliness: 0.95
      }
    },
    usage: {
      consumers: 8,
      avgQueriesPerDay: 2300,
      lastAccessed: '2024-11-22T15:00:00Z',
      rating: 4.2
    }
  }
];

// Helper function to get product by ID
export function getDataProductById(id: string): DataProduct | undefined {
  return mockDataProducts.find(p => p.product.id === id);
}

// Helper function to get products by domain
export function getDataProductsByDomain(domain: string): DataProduct[] {
  return mockDataProducts.filter(p => p.product.domain === domain);
}

// Helper function to get products by status
export function getDataProductsByStatus(status: 'draft' | 'published' | 'deprecated'): DataProduct[] {
  return mockDataProducts.filter(p => p.product.status === status);
}

// Helper function to search products
export function searchDataProducts(query: string): DataProduct[] {
  const lowerQuery = query.toLowerCase();
  return mockDataProducts.filter(p => 
    p.product.name.toLowerCase().includes(lowerQuery) ||
    p.product.description.toLowerCase().includes(lowerQuery) ||
    p.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Generate ODPS template from query analysis
export function generateODPSTemplate(queryAnalysis: any): Partial<DataProduct> {
  return {
    openDataProductSpecVersion: '3.1',
    product: {
      id: `dp-${Math.random().toString(36).substr(2, 9)}`,
      name: queryAnalysis.suggestedName || 'New Data Product',
      description: queryAnalysis.businessPurpose || '',
      domain: queryAnalysis.domain || 'General',
      status: 'draft',
      version: '0.1.0'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataProductOwner: {
        name: queryAnalysis.team || 'Data Team',
        email: `${(queryAnalysis.team || 'data').toLowerCase().replace(/\s+/g, '-')}@company.com`
      },
      tags: queryAnalysis.tags || [],
      industry: queryAnalysis.industryContext
    },
    dataAccess: {
      interface: {},
      format: ['JSON', 'Parquet'],
      accessUrl: ''
    },
    dataQuality: {
      sla: {
        availability: '99.5%',
        responseTime: '<2s',
        updateFrequency: queryAnalysis.refreshRate || 'daily'
      },
      qualityMetrics: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        timeliness: 0
      }
    }
  };
}