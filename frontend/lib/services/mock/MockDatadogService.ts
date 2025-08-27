/**
 * MockDatadogService - Simulates Datadog monitoring and observability
 * Provides metrics, logs, APM, and alerting capabilities
 */

import { mockDataStore, Metric, Alert } from './MockDataStore';

export interface DatadogMetric {
  metric: string;
  points: Array<[number, number]>; // [timestamp, value]
  tags: string[];
  type: 'gauge' | 'rate' | 'count' | 'histogram';
  unit?: string;
  interval?: number;
}

export interface DatadogLog {
  id: string;
  timestamp: Date;
  service: string;
  source: string;
  status: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  attributes: Record<string, any>;
  host: string;
  tags: string[];
}

export interface DatadogTrace {
  traceId: string;
  spans: DatadogSpan[];
  service: string;
  resource: string;
  duration: number;
  error: boolean;
}

export interface DatadogSpan {
  spanId: string;
  parentId?: string;
  service: string;
  resource: string;
  operation: string;
  startTime: number;
  duration: number;
  error: boolean;
  meta: Record<string, string>;
  metrics: Record<string, number>;
}

export interface DatadogMonitor {
  id: string;
  name: string;
  type: 'metric' | 'log' | 'apm' | 'composite';
  query: string;
  message: string;
  tags: string[];
  options: {
    thresholds: {
      critical?: number;
      warning?: number;
      ok?: number;
    };
    notifyNoData: boolean;
    notifyAudit: boolean;
    renotifyInterval: number;
  };
  status: 'OK' | 'Alert' | 'Warn' | 'No Data';
  lastTriggered?: Date;
}

export interface DatadogDashboard {
  id: string;
  title: string;
  description: string;
  widgets: DatadogWidget[];
  templateVariables: Array<{
    name: string;
    prefix: string;
    available_values: string[];
  }>;
}

export interface DatadogWidget {
  id: string;
  type: 'timeseries' | 'heatmap' | 'toplist' | 'number' | 'log_stream';
  title: string;
  query: string | string[];
  layout: { x: number; y: number; width: number; height: number };
}

class MockDatadogService {
  private metrics: DatadogMetric[] = [];
  private logs: DatadogLog[] = [];
  private traces: DatadogTrace[] = [];
  private monitors: Map<string, DatadogMonitor> = new Map();
  private dashboards: Map<string, DatadogDashboard> = new Map();
  
  constructor() {
    this.initializeMockData();
    this.startMetricGeneration();
  }
  
  private initializeMockData() {
    // Initialize monitors
    this.monitors.set('mon-001', {
      id: 'mon-001',
      name: 'Pipeline Error Rate',
      type: 'metric',
      query: 'avg(last_5m):sum:pipeline.errors{env:production} by {pipeline}.as_rate() > 0.05',
      message: 'Pipeline {{pipeline.name}} error rate is {{value}} (threshold: 5%)',
      tags: ['team:data', 'severity:critical'],
      options: {
        thresholds: { critical: 0.05, warning: 0.02 },
        notifyNoData: true,
        notifyAudit: false,
        renotifyInterval: 30
      },
      status: 'Alert',
      lastTriggered: new Date('2024-01-26T14:23:00Z')
    });
    
    this.monitors.set('mon-002', {
      id: 'mon-002',
      name: 'Database Response Time',
      type: 'metric',
      query: 'avg(last_10m):avg:database.query.time{env:production} > 1000',
      message: 'Database response time is high: {{value}}ms',
      tags: ['team:platform', 'severity:warning'],
      options: {
        thresholds: { critical: 2000, warning: 1000 },
        notifyNoData: false,
        notifyAudit: false,
        renotifyInterval: 60
      },
      status: 'Warn',
      lastTriggered: new Date('2024-01-26T10:00:00Z')
    });
    
    // Initialize dashboard
    this.dashboards.set('dash-001', {
      id: 'dash-001',
      title: 'Data Pipeline Overview',
      description: 'Real-time monitoring of data pipeline health and performance',
      widgets: [
        {
          id: 'w1',
          type: 'timeseries',
          title: 'Pipeline Success Rate',
          query: 'avg:pipeline.success_rate{env:production} by {pipeline}',
          layout: { x: 0, y: 0, width: 6, height: 3 }
        },
        {
          id: 'w2',
          type: 'number',
          title: 'Active Pipelines',
          query: 'sum:pipeline.active{env:production}',
          layout: { x: 6, y: 0, width: 3, height: 3 }
        },
        {
          id: 'w3',
          type: 'heatmap',
          title: 'Error Distribution',
          query: 'sum:pipeline.errors{env:production} by {pipeline,error_type}',
          layout: { x: 9, y: 0, width: 3, height: 3 }
        },
        {
          id: 'w4',
          type: 'log_stream',
          title: 'Recent Errors',
          query: 'status:error service:etl',
          layout: { x: 0, y: 3, width: 12, height: 4 }
        }
      ],
      templateVariables: [
        {
          name: 'env',
          prefix: 'env',
          available_values: ['production', 'staging', 'development']
        },
        {
          name: 'pipeline',
          prefix: 'pipeline',
          available_values: ['customer_etl', 'product_sync', 'sales_aggregation']
        }
      ]
    });
    
    // Generate initial metrics
    this.generateHistoricalMetrics();
    
    // Generate initial logs
    this.generateRecentLogs();
    
    // Generate initial traces
    this.generateTraces();
  }
  
  private generateHistoricalMetrics() {
    const now = Date.now();
    const pipelines = ['customer_etl', 'product_sync', 'sales_aggregation'];
    
    pipelines.forEach(pipeline => {
      // Generate hourly metrics for last 24 hours
      for (let i = 0; i < 24; i++) {
        const timestamp = now - i * 3600000;
        
        // Success rate metric
        this.metrics.push({
          metric: 'pipeline.success_rate',
          points: [[timestamp, 85 + Math.random() * 15]],
          tags: [`pipeline:${pipeline}`, 'env:production'],
          type: 'gauge',
          unit: 'percent'
        });
        
        // Records processed
        this.metrics.push({
          metric: 'pipeline.records_processed',
          points: [[timestamp, Math.floor(Math.random() * 100000) + 50000]],
          tags: [`pipeline:${pipeline}`, 'env:production'],
          type: 'count'
        });
        
        // Processing time
        this.metrics.push({
          metric: 'pipeline.duration',
          points: [[timestamp, Math.floor(Math.random() * 3600) + 1800]],
          tags: [`pipeline:${pipeline}`, 'env:production'],
          type: 'gauge',
          unit: 'second'
        });
      }
    });
  }
  
  private generateRecentLogs() {
    const services = ['etl-orchestrator', 'data-transformer', 'quality-checker'];
    const sources = ['airflow', 'sqlmesh', 'custom'];
    
    for (let i = 0; i < 100; i++) {
      const timestamp = new Date(Date.now() - i * 60000); // Every minute
      const isError = Math.random() > 0.9;
      
      this.logs.push({
        id: `log-${i}`,
        timestamp,
        service: services[Math.floor(Math.random() * services.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        status: isError ? 'error' : Math.random() > 0.7 ? 'warning' : 'info',
        message: isError 
          ? `Schema validation failed for field customer_email`
          : `Processing batch ${Math.floor(Math.random() * 1000)}`,
        attributes: {
          pipeline: 'customer_etl',
          batch_size: Math.floor(Math.random() * 10000),
          duration_ms: Math.floor(Math.random() * 5000)
        },
        host: `worker-${Math.floor(Math.random() * 5) + 1}`,
        tags: ['env:production', 'team:data']
      });
    }
  }
  
  private generateTraces() {
    for (let i = 0; i < 20; i++) {
      const traceId = `trace-${Date.now()}-${i}`;
      const hasError = Math.random() > 0.8;
      
      const spans: DatadogSpan[] = [
        {
          spanId: `${traceId}-1`,
          service: 'api-gateway',
          resource: 'POST /api/pipeline/trigger',
          operation: 'http.request',
          startTime: Date.now() - 5000,
          duration: 50,
          error: false,
          meta: { 'http.method': 'POST', 'http.status_code': '200' },
          metrics: { '_sampling_priority_v1': 1 }
        },
        {
          spanId: `${traceId}-2`,
          parentId: `${traceId}-1`,
          service: 'pipeline-orchestrator',
          resource: 'customer_etl.execute',
          operation: 'pipeline.run',
          startTime: Date.now() - 4900,
          duration: 4000,
          error: hasError,
          meta: { 'pipeline.name': 'customer_etl' },
          metrics: { 'records.processed': 45000 }
        },
        {
          spanId: `${traceId}-3`,
          parentId: `${traceId}-2`,
          service: 'data-transformer',
          resource: 'transform.customer_data',
          operation: 'transform',
          startTime: Date.now() - 3000,
          duration: hasError ? 1500 : 2000,
          error: hasError,
          meta: hasError ? { 'error.message': 'Schema validation failed' } : {},
          metrics: { 'rows.transformed': hasError ? 0 : 45000 }
        }
      ];
      
      this.traces.push({
        traceId,
        spans,
        service: 'pipeline-orchestrator',
        resource: 'customer_etl',
        duration: 4050,
        error: hasError
      });
    }
  }
  
  /**
   * Query metrics
   */
  async queryMetrics(query: string, from: Date, to: Date): Promise<DatadogMetric[]> {
    await this.simulateLatency();
    
    // Simple query parsing (in real implementation would use proper parser)
    const metricName = query.match(/^([\w.]+)/)?.[1] || '';
    const tags = query.match(/{([^}]+)}/)?.[1].split(',') || [];
    
    return this.metrics.filter(m => {
      if (metricName && !m.metric.includes(metricName)) return false;
      if (tags.length && !tags.every(tag => m.tags.includes(tag))) return false;
      const timestamp = m.points[0]?.[0] || 0;
      return timestamp >= from.getTime() && timestamp <= to.getTime();
    });
  }
  
  /**
   * Search logs
   */
  async searchLogs(query: string, from: Date, to: Date, limit: number = 100): Promise<DatadogLog[]> {
    await this.simulateLatency();
    
    let results = this.logs.filter(log =>
      log.timestamp >= from && log.timestamp <= to
    );
    
    // Simple query filtering
    if (query.includes('status:error')) {
      results = results.filter(log => log.status === 'error');
    }
    if (query.includes('service:')) {
      const service = query.match(/service:(\w+)/)?.[1];
      if (service) {
        results = results.filter(log => log.service === service);
      }
    }
    
    return results.slice(0, limit);
  }
  
  /**
   * Get traces
   */
  async getTraces(filters?: {
    service?: string;
    resource?: string;
    hasError?: boolean;
    from?: Date;
    to?: Date;
  }): Promise<DatadogTrace[]> {
    await this.simulateLatency();
    
    let results = [...this.traces];
    
    if (filters?.service) {
      results = results.filter(t => t.service === filters.service);
    }
    if (filters?.resource) {
      results = results.filter(t => t.resource === filters.resource);
    }
    if (filters?.hasError !== undefined) {
      results = results.filter(t => t.error === filters.hasError);
    }
    
    return results;
  }
  
  /**
   * Get monitors
   */
  async getMonitors(filters?: {
    tags?: string[];
    status?: string;
  }): Promise<DatadogMonitor[]> {
    await this.simulateLatency();
    
    let monitors = Array.from(this.monitors.values());
    
    if (filters?.tags) {
      monitors = monitors.filter(m =>
        filters.tags!.some(tag => m.tags.includes(tag))
      );
    }
    if (filters?.status) {
      monitors = monitors.filter(m => m.status === filters.status);
    }
    
    return monitors;
  }
  
  /**
   * Create or update monitor
   */
  async saveMonitor(monitor: Partial<DatadogMonitor>): Promise<DatadogMonitor> {
    await this.simulateLatency();
    
    const id = monitor.id || `mon-${Date.now()}`;
    const fullMonitor: DatadogMonitor = {
      id,
      name: monitor.name || 'New Monitor',
      type: monitor.type || 'metric',
      query: monitor.query || '',
      message: monitor.message || '',
      tags: monitor.tags || [],
      options: monitor.options || {
        thresholds: {},
        notifyNoData: false,
        notifyAudit: false,
        renotifyInterval: 0
      },
      status: 'No Data',
      ...monitor
    };
    
    this.monitors.set(id, fullMonitor);
    return fullMonitor;
  }
  
  /**
   * Get dashboard
   */
  async getDashboard(dashboardId: string): Promise<DatadogDashboard | null> {
    await this.simulateLatency();
    return this.dashboards.get(dashboardId) || null;
  }
  
  /**
   * Get real-time metrics stream
   */
  streamMetrics(callback: (metric: DatadogMetric) => void): () => void {
    const interval = setInterval(() => {
      const pipelines = ['customer_etl', 'product_sync', 'sales_aggregation'];
      const pipeline = pipelines[Math.floor(Math.random() * pipelines.length)];
      
      callback({
        metric: 'pipeline.records_processed',
        points: [[Date.now(), Math.floor(Math.random() * 1000) + 100]],
        tags: [`pipeline:${pipeline}`, 'env:production'],
        type: 'count',
        interval: 10
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }
  
  /**
   * Get service map
   */
  async getServiceMap(): Promise<{
    services: Array<{
      name: string;
      type: string;
      requestsPerSecond: number;
      errorRate: number;
      latencyP95: number;
    }>;
    dependencies: Array<{
      source: string;
      target: string;
      callsPerMinute: number;
    }>;
  }> {
    await this.simulateLatency();
    
    return {
      services: [
        {
          name: 'api-gateway',
          type: 'web',
          requestsPerSecond: 125,
          errorRate: 0.02,
          latencyP95: 234
        },
        {
          name: 'pipeline-orchestrator',
          type: 'service',
          requestsPerSecond: 45,
          errorRate: 0.05,
          latencyP95: 1234
        },
        {
          name: 'data-transformer',
          type: 'service',
          requestsPerSecond: 234,
          errorRate: 0.08,
          latencyP95: 567
        },
        {
          name: 'snowflake',
          type: 'database',
          requestsPerSecond: 890,
          errorRate: 0.001,
          latencyP95: 45
        }
      ],
      dependencies: [
        { source: 'api-gateway', target: 'pipeline-orchestrator', callsPerMinute: 2700 },
        { source: 'pipeline-orchestrator', target: 'data-transformer', callsPerMinute: 14040 },
        { source: 'data-transformer', target: 'snowflake', callsPerMinute: 53400 }
      ]
    };
  }
  
  /**
   * Start generating real-time metrics
   */
  private startMetricGeneration() {
    setInterval(() => {
      // Add new metric point every 10 seconds
      const pipelines = ['customer_etl', 'product_sync', 'sales_aggregation'];
      pipelines.forEach(pipeline => {
        this.metrics.push({
          metric: 'pipeline.records_processed',
          points: [[Date.now(), Math.floor(Math.random() * 10000) + 5000]],
          tags: [`pipeline:${pipeline}`, 'env:production'],
          type: 'count'
        });
      });
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
    }, 10000);
  }
  
  private async simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  }
}

export const mockDatadogService = new MockDatadogService();