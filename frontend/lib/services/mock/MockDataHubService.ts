/**
 * MockDataHubService - Simulates DataHub lineage and metadata management
 * Provides data discovery, lineage visualization, and schema management
 */

import { mockDataStore } from './MockDataStore';

export interface DataAsset {
  urn: string;
  platform: 'snowflake' | 'postgres' | 'bigquery' | 's3' | 'kafka';
  name: string;
  type: 'dataset' | 'chart' | 'dashboard' | 'pipeline';
  owner: string;
  tags: string[];
  description?: string;
  created: Date;
  lastModified: Date;
  upstream: string[];
  downstream: string[];
  schema?: any;
  metrics?: {
    rowCount?: number;
    sizeBytes?: number;
    queryCount?: number;
  };
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  depth: number;
}

export interface LineageNode {
  id: string;
  label: string;
  type: string;
  platform: string;
  level: number;
  metadata: any;
}

export interface LineageEdge {
  source: string;
  target: string;
  type: 'consumes' | 'produces' | 'transforms';
}

export interface SchemaChange {
  field: string;
  changeType: 'added' | 'removed' | 'modified';
  oldType?: string;
  newType?: string;
  breakingChange: boolean;
  timestamp: Date;
}

class MockDataHubService {
  private assets: Map<string, DataAsset> = new Map();
  private changeLog: SchemaChange[] = [];
  
  constructor() {
    this.initializeMockAssets();
  }
  
  private initializeMockAssets() {
    // Convert MockDataStore data to DataHub assets
    const pipelines = mockDataStore.getAllPipelines();
    
    pipelines.forEach(pipeline => {
      const asset: DataAsset = {
        urn: `urn:li:dataset:(urn:li:dataPlatform:custom,${pipeline.id},PROD)`,
        platform: 'snowflake',
        name: pipeline.name,
        type: 'pipeline',
        owner: pipeline.owner,
        tags: ['production', 'etl', 'critical'],
        description: `ETL pipeline for ${pipeline.name}`,
        created: new Date('2024-01-01'),
        lastModified: pipeline.lastRun,
        upstream: pipeline.upstreamDeps,
        downstream: pipeline.downstreamDeps,
        metrics: {
          queryCount: 1247,
          rowCount: 45000
        }
      };
      this.assets.set(asset.urn, asset);
    });
    
    // Add some schema change events
    this.changeLog = [
      {
        field: 'customer_email',
        changeType: 'modified',
        oldType: 'VARCHAR(50)',
        newType: 'VARCHAR(100)',
        breakingChange: true,
        timestamp: new Date('2024-01-26T14:00:00Z')
      },
      {
        field: 'phone_number',
        changeType: 'added',
        newType: 'VARCHAR(20)',
        breakingChange: false,
        timestamp: new Date('2024-01-25T10:00:00Z')
      }
    ];
  }
  
  /**
   * Search for data assets
   */
  async searchAssets(query: string, filters?: {
    platform?: string;
    type?: string;
    tags?: string[];
  }): Promise<DataAsset[]> {
    await this.simulateLatency();
    
    let results = Array.from(this.assets.values());
    
    // Apply search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(asset =>
        asset.name.toLowerCase().includes(lowerQuery) ||
        asset.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply filters
    if (filters?.platform) {
      results = results.filter(a => a.platform === filters.platform);
    }
    if (filters?.type) {
      results = results.filter(a => a.type === filters.type);
    }
    if (filters?.tags?.length) {
      results = results.filter(a =>
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }
    
    return results;
  }
  
  /**
   * Get lineage graph for an asset
   */
  async getLineage(urn: string, depth: number = 2): Promise<LineageGraph> {
    await this.simulateLatency();
    
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string, level: number) => {
      if (visited.has(id) || level > depth) return;
      visited.add(id);
      
      const lineage = mockDataStore.getLineage(id);
      if (lineage) {
        nodes.push({
          id,
          label: lineage.name,
          type: lineage.type,
          platform: 'snowflake',
          level,
          metadata: lineage
        });
        
        // Add upstream
        lineage.upstream.forEach(upId => {
          edges.push({
            source: upId,
            target: id,
            type: 'produces'
          });
          traverse(upId, level - 1);
        });
        
        // Add downstream
        lineage.downstream.forEach(downId => {
          edges.push({
            source: id,
            target: downId,
            type: 'consumes'
          });
          traverse(downId, level + 1);
        });
      }
    };
    
    // Start from the requested asset
    traverse(urn.replace(/.*,(.+),.*/, '$1'), 0);
    
    return { nodes, edges, depth };
  }
  
  /**
   * Get schema for a dataset
   */
  async getSchema(urn: string): Promise<any> {
    await this.simulateLatency();
    
    const assetId = urn.replace(/.*,(.+),.*/, '$1');
    const lineage = mockDataStore.getLineage(assetId);
    
    if (lineage?.schema) {
      return {
        fields: lineage.schema,
        version: '1.0.0',
        lastModified: new Date(),
        compatibility: 'BACKWARD'
      };
    }
    
    return null;
  }
  
  /**
   * Get schema change history
   */
  async getSchemaChanges(urn: string, days: number = 30): Promise<SchemaChange[]> {
    await this.simulateLatency();
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.changeLog.filter(change =>
      change.timestamp > cutoff
    );
  }
  
  /**
   * Get impact analysis for schema change
   */
  async getImpactAnalysis(urn: string, change: SchemaChange): Promise<{
    affectedAssets: string[];
    breakingChanges: boolean;
    estimatedDowntime: number;
    recommendations: string[];
  }> {
    await this.simulateLatency();
    
    const assetId = urn.replace(/.*,(.+),.*/, '$1');
    const lineage = mockDataStore.getFullLineage(assetId);
    
    const downstreamAssets = lineage
      .filter(node => node.downstream.includes(assetId))
      .map(node => node.nodeId);
    
    return {
      affectedAssets: downstreamAssets,
      breakingChanges: change.breakingChange,
      estimatedDowntime: change.breakingChange ? 180 : 0, // minutes
      recommendations: [
        'Update transformation logic in customer_etl_pipeline',
        'Modify schema validation rules',
        'Test with sample data before deployment',
        'Notify downstream consumers'
      ]
    };
  }
  
  /**
   * Get data quality metrics
   */
  async getQualityMetrics(urn: string): Promise<any> {
    await this.simulateLatency();
    
    const assetId = urn.replace(/.*,(.+),.*/, '$1');
    const lineage = mockDataStore.getLineage(assetId);
    
    return lineage?.quality || {
      score: 85,
      completeness: 92,
      accuracy: 88,
      consistency: 90,
      timeliness: 78,
      uniqueness: 95,
      validity: 87
    };
  }
  
  /**
   * Get usage statistics
   */
  async getUsageStats(urn: string): Promise<any> {
    await this.simulateLatency();
    
    const assetId = urn.replace(/.*,(.+),.*/, '$1');
    const lineage = mockDataStore.getLineage(assetId);
    
    return lineage?.usage || {
      queryCount: 523,
      uniqueUsers: 12,
      avgLatency: 234,
      lastAccessed: new Date(),
      topQueries: []
    };
  }
  
  /**
   * Get asset recommendations
   */
  async getRecommendations(urn: string): Promise<{
    similar: DataAsset[];
    suggested: DataAsset[];
    deprecated: DataAsset[];
  }> {
    await this.simulateLatency();
    
    const allAssets = Array.from(this.assets.values());
    
    return {
      similar: allAssets.slice(0, 3),
      suggested: allAssets.slice(3, 6),
      deprecated: []
    };
  }
  
  private async simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }
}

export const mockDataHubService = new MockDataHubService();