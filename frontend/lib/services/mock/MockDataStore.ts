/**
 * MockDataStore - Central repository for all mock enterprise data
 * Provides consistent data relationships and state management
 */

export interface Pipeline {
  id: string;
  name: string;
  owner: string;
  schedule: string;
  status: 'running' | 'failed' | 'success' | 'paused';
  lastRun: Date;
  nextRun: Date;
  upstreamDeps: string[];
  downstreamDeps: string[];
  tables: string[];
  model?: SQLMeshModel;
}

export interface SQLMeshModel {
  name: string;
  kind: 'VIEW' | 'TABLE' | 'INCREMENTAL' | 'FULL';
  sql: string;
  schedule: string;
  partitionBy?: string;
  clusterBy?: string[];
  grainColumn?: string;
  dependencies: string[];
  columns: SchemaColumn[];
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  tags?: string[];
}

export interface DataLineage {
  nodeId: string;
  name: string;
  type: 'source' | 'transformation' | 'sink';
  upstream: string[];
  downstream: string[];
  schema: SchemaColumn[];
  quality: QualityMetrics;
  usage: UsageMetrics;
}

export interface QualityMetrics {
  score: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  uniqueness: number;
  validity: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  field: string;
  type: 'missing' | 'invalid' | 'duplicate' | 'outlier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  percentage: number;
  examples: any[];
}

export interface UsageMetrics {
  queryCount: number;
  uniqueUsers: number;
  avgLatency: number;
  lastAccessed: Date;
  topQueries: string[];
}

export interface AccessPolicy {
  id: string;
  resource: string;
  principal: string;
  permissions: string[];
  conditions?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'denied' | 'error';
  details?: any;
}

export interface DAG {
  id: string;
  name: string;
  schedule: string;
  owner: string;
  tasks: DAGTask[];
  runs: DAGRun[];
  nextRun: Date;
}

export interface DAGTask {
  id: string;
  name: string;
  operator: string;
  dependencies: string[];
  retries: number;
  timeout: number;
  params: Record<string, any>;
}

export interface DAGRun {
  id: string;
  dagId: string;
  executionDate: Date;
  startDate: Date;
  endDate?: Date;
  state: 'running' | 'success' | 'failed' | 'queued';
  tasks: TaskInstance[];
}

export interface TaskInstance {
  taskId: string;
  state: 'running' | 'success' | 'failed' | 'skipped' | 'queued';
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  tryNumber: number;
  logs?: string[];
}

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  unit?: string;
}

export interface Alert {
  id: string;
  name: string;
  query: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  status: 'ok' | 'warning' | 'critical';
  lastTriggered?: Date;
  message?: string;
}

class MockDataStore {
  private static instance: MockDataStore;
  
  // Core data collections
  private pipelines: Map<string, Pipeline> = new Map();
  private lineage: Map<string, DataLineage> = new Map();
  private policies: Map<string, AccessPolicy> = new Map();
  private auditLogs: AuditLog[] = [];
  private dags: Map<string, DAG> = new Map();
  private metrics: Metric[] = [];
  private alerts: Map<string, Alert> = new Map();
  
  private constructor() {
    this.initializeMockData();
  }
  
  static getInstance(): MockDataStore {
    if (!MockDataStore.instance) {
      MockDataStore.instance = new MockDataStore();
    }
    return MockDataStore.instance;
  }
  
  private initializeMockData() {
    // Initialize pipelines
    this.pipelines.set('customer_etl_pipeline_v3', {
      id: 'customer_etl_pipeline_v3',
      name: 'Customer Master ETL',
      owner: 'data-team',
      schedule: '0 */6 * * *',
      status: 'failed',
      lastRun: new Date('2024-01-26T14:23:00Z'),
      nextRun: new Date('2024-01-26T20:00:00Z'),
      upstreamDeps: ['salesforce_sync', 'postgres_replication'],
      downstreamDeps: ['customer_analytics', 'revenue_dashboard'],
      tables: ['customer.master_table', 'customer.address_lookup'],
      model: {
        name: 'customer_master',
        kind: 'INCREMENTAL',
        sql: `SELECT 
  c.customer_id,
  c.customer_email,
  c.first_name,
  c.last_name,
  a.address_line1,
  a.city,
  a.state,
  a.postal_code,
  c.created_at,
  c.updated_at
FROM raw.customers c
LEFT JOIN raw.addresses a ON c.customer_id = a.customer_id
WHERE c.updated_at >= @start_date`,
        schedule: '0 */6 * * *',
        partitionBy: 'DATE(updated_at)',
        clusterBy: ['state', 'city'],
        grainColumn: 'customer_id',
        dependencies: ['raw.customers', 'raw.addresses'],
        columns: [
          { name: 'customer_id', type: 'STRING', nullable: false },
          { name: 'customer_email', type: 'VARCHAR(50)', nullable: false },
          { name: 'first_name', type: 'STRING', nullable: false },
          { name: 'last_name', type: 'STRING', nullable: false },
          { name: 'address_line1', type: 'STRING', nullable: true },
          { name: 'city', type: 'STRING', nullable: true },
          { name: 'state', type: 'STRING', nullable: true },
          { name: 'postal_code', type: 'STRING', nullable: true },
          { name: 'created_at', type: 'TIMESTAMP', nullable: false },
          { name: 'updated_at', type: 'TIMESTAMP', nullable: false }
        ]
      }
    });
    
    // Initialize lineage
    this.lineage.set('customer.master_table', {
      nodeId: 'customer.master_table',
      name: 'Customer Master Table',
      type: 'sink',
      upstream: ['raw.customers', 'raw.addresses'],
      downstream: ['analytics.customer_360', 'reporting.revenue_by_customer'],
      schema: [
        { name: 'customer_id', type: 'STRING', nullable: false },
        { name: 'customer_email', type: 'VARCHAR(100)', nullable: false }, // Note: Changed from 50 to 100
        { name: 'first_name', type: 'STRING', nullable: false }
      ],
      quality: {
        score: 94,
        completeness: 98,
        accuracy: 92,
        consistency: 95,
        timeliness: 90,
        uniqueness: 99,
        validity: 91,
        issues: [
          {
            field: 'customer_email',
            type: 'invalid',
            severity: 'high',
            count: 234,
            percentage: 0.5,
            examples: ['test@', 'user@domain', '@example.com']
          }
        ]
      },
      usage: {
        queryCount: 1247,
        uniqueUsers: 42,
        avgLatency: 234,
        lastAccessed: new Date(),
        topQueries: [
          'SELECT * FROM customer.master_table WHERE state = ?',
          'SELECT COUNT(*) FROM customer.master_table WHERE created_at > ?'
        ]
      }
    });
    
    // Initialize DAGs
    this.dags.set('customer_etl_dag', {
      id: 'customer_etl_dag',
      name: 'Customer ETL DAG',
      schedule: '0 */6 * * *',
      owner: 'data-team',
      tasks: [
        {
          id: 'extract_salesforce',
          name: 'Extract Salesforce Data',
          operator: 'SalesforceOperator',
          dependencies: [],
          retries: 3,
          timeout: 3600,
          params: { object: 'Account', query: 'SELECT * FROM Account' }
        },
        {
          id: 'extract_postgres',
          name: 'Extract PostgreSQL Data',
          operator: 'PostgresOperator',
          dependencies: [],
          retries: 3,
          timeout: 1800,
          params: { sql: 'SELECT * FROM customers WHERE updated_at > {{ ds }}' }
        },
        {
          id: 'transform_data',
          name: 'Transform Customer Data',
          operator: 'SQLMeshOperator',
          dependencies: ['extract_salesforce', 'extract_postgres'],
          retries: 2,
          timeout: 7200,
          params: { model: 'customer_master' }
        },
        {
          id: 'quality_check',
          name: 'Data Quality Check',
          operator: 'DataQualityOperator',
          dependencies: ['transform_data'],
          retries: 1,
          timeout: 1800,
          params: { checks: ['completeness', 'validity', 'uniqueness'] }
        }
      ],
      runs: [],
      nextRun: new Date('2024-01-26T20:00:00Z')
    });
    
    // Initialize policies
    this.policies.set('customer_data_access', {
      id: 'customer_data_access',
      resource: 'customer.*',
      principal: 'role:data_analyst',
      permissions: ['SELECT'],
      conditions: 'WHERE country = "US"',
      createdAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-12-31')
    });
    
    // Initialize metrics
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      this.metrics.push({
        name: 'pipeline.customer_etl.records_processed',
        value: Math.floor(Math.random() * 10000) + 5000,
        timestamp: new Date(now - i * 60000),
        tags: { pipeline: 'customer_etl', env: 'production' }
      });
      
      this.metrics.push({
        name: 'pipeline.customer_etl.duration_ms',
        value: Math.floor(Math.random() * 5000) + 2000,
        timestamp: new Date(now - i * 60000),
        tags: { pipeline: 'customer_etl', env: 'production' },
        unit: 'milliseconds'
      });
    }
    
    // Initialize alerts
    this.alerts.set('high_error_rate', {
      id: 'high_error_rate',
      name: 'High Error Rate',
      query: 'avg(last_5m):sum:pipeline.errors{env:production} by {pipeline}',
      threshold: 5,
      operator: '>',
      status: 'critical',
      lastTriggered: new Date('2024-01-26T14:23:00Z'),
      message: 'Pipeline customer_etl_pipeline_v3 error rate is above threshold'
    });
  }
  
  // Pipeline operations
  getPipeline(id: string): Pipeline | undefined {
    return this.pipelines.get(id);
  }
  
  getAllPipelines(): Pipeline[] {
    return Array.from(this.pipelines.values());
  }
  
  updatePipelineStatus(id: string, status: Pipeline['status']) {
    const pipeline = this.pipelines.get(id);
    if (pipeline) {
      pipeline.status = status;
      pipeline.lastRun = new Date();
    }
  }
  
  // Lineage operations
  getLineage(nodeId: string): DataLineage | undefined {
    return this.lineage.get(nodeId);
  }
  
  getFullLineage(nodeId: string): DataLineage[] {
    const result: DataLineage[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const node = this.lineage.get(id);
      if (node) {
        result.push(node);
        node.upstream.forEach(traverse);
        node.downstream.forEach(traverse);
      }
    };
    
    traverse(nodeId);
    return result;
  }
  
  // Policy operations
  getPolicy(id: string): AccessPolicy | undefined {
    return this.policies.get(id);
  }
  
  checkAccess(resource: string, principal: string, action: string): boolean {
    for (const policy of this.policies.values()) {
      if (resource.match(policy.resource.replace('*', '.*')) &&
          principal === policy.principal &&
          policy.permissions.includes(action)) {
        return true;
      }
    }
    return false;
  }
  
  // Audit operations
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...log
    });
  }
  
  getAuditLogs(filters?: { user?: string; resource?: string; limit?: number }): AuditLog[] {
    let logs = [...this.auditLogs];
    
    if (filters?.user) {
      logs = logs.filter(l => l.user === filters.user);
    }
    if (filters?.resource) {
      logs = logs.filter(l => l.resource === filters.resource);
    }
    if (filters?.limit) {
      logs = logs.slice(-filters.limit);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // DAG operations
  getDAG(id: string): DAG | undefined {
    return this.dags.get(id);
  }
  
  getAllDAGs(): DAG[] {
    return Array.from(this.dags.values());
  }
  
  addDAGRun(dagId: string, run: DAGRun) {
    const dag = this.dags.get(dagId);
    if (dag) {
      dag.runs.push(run);
      // Keep only last 10 runs
      if (dag.runs.length > 10) {
        dag.runs.shift();
      }
    }
  }
  
  // Metrics operations
  addMetric(metric: Metric) {
    this.metrics.push(metric);
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }
  
  getMetrics(name: string, tags?: Record<string, string>, limit: number = 100): Metric[] {
    let metrics = this.metrics.filter(m => m.name === name);
    
    if (tags) {
      metrics = metrics.filter(m => {
        return Object.entries(tags).every(([k, v]) => m.tags[k] === v);
      });
    }
    
    return metrics.slice(-limit);
  }
  
  // Alert operations
  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }
  
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
  
  triggerAlert(id: string, message: string) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = 'critical';
      alert.lastTriggered = new Date();
      alert.message = message;
    }
  }
  
  resolveAlert(id: string) {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.status = 'ok';
      alert.message = undefined;
    }
  }
}

export const mockDataStore = MockDataStore.getInstance();