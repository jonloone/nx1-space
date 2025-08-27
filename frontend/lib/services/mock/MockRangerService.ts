/**
 * MockRangerService - Simulates Apache Ranger for data access control
 * Provides policy management, access auditing, and permission checks
 */

import { mockDataStore } from './MockDataStore';

export interface RangerPolicy {
  id: string;
  name: string;
  service: 'hive' | 'hdfs' | 'kafka' | 'hbase' | 'snowflake';
  resources: {
    database?: string[];
    table?: string[];
    column?: string[];
    path?: string[];
    topic?: string[];
  };
  policyItems: PolicyItem[];
  conditions?: PolicyCondition[];
  isEnabled: boolean;
  isAuditEnabled: boolean;
  createdBy: string;
  createdTime: Date;
  updatedBy?: string;
  updatedTime?: Date;
}

export interface PolicyItem {
  users: string[];
  groups: string[];
  roles: string[];
  accesses: Access[];
  conditions?: PolicyCondition[];
  delegateAdmin: boolean;
}

export interface Access {
  type: 'select' | 'insert' | 'update' | 'delete' | 'create' | 'drop' | 'alter' | 'all';
  isAllowed: boolean;
}

export interface PolicyCondition {
  type: 'ip-range' | 'time-range' | 'tag-based' | 'expression';
  values: string[];
}

export interface AccessRequest {
  user: string;
  groups: string[];
  resource: string;
  accessType: string;
  context?: Record<string, any>;
}

export interface AccessResult {
  isAllowed: boolean;
  reason?: string;
  matchedPolicies: string[];
  deniedPolicies: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  user: string;
  resource: string;
  accessType: string;
  result: 'allowed' | 'denied';
  policyId?: string;
  clientIP?: string;
  resultReason?: string;
}

class MockRangerService {
  private policies: Map<string, RangerPolicy> = new Map();
  private auditEvents: AuditEvent[] = [];
  
  constructor() {
    this.initializeMockPolicies();
  }
  
  private initializeMockPolicies() {
    // Customer data access policy
    this.policies.set('policy-001', {
      id: 'policy-001',
      name: 'Customer Data Access - Production',
      service: 'snowflake',
      resources: {
        database: ['production'],
        table: ['customer', 'customer_*'],
        column: ['*']
      },
      policyItems: [
        {
          users: ['data_engineer', 'analyst_team'],
          groups: ['data_team'],
          roles: ['data_analyst'],
          accesses: [
            { type: 'select', isAllowed: true }
          ],
          delegateAdmin: false
        },
        {
          users: ['admin'],
          groups: ['admins'],
          roles: [],
          accesses: [
            { type: 'all', isAllowed: true }
          ],
          delegateAdmin: true
        }
      ],
      conditions: [
        {
          type: 'time-range',
          values: ['08:00-20:00']
        }
      ],
      isEnabled: true,
      isAuditEnabled: true,
      createdBy: 'admin',
      createdTime: new Date('2024-01-01')
    });
    
    // PII data masking policy
    this.policies.set('policy-002', {
      id: 'policy-002',
      name: 'PII Data Masking',
      service: 'snowflake',
      resources: {
        database: ['production'],
        table: ['*'],
        column: ['ssn', 'email', 'phone', 'credit_card']
      },
      policyItems: [
        {
          users: [],
          groups: ['hr_team', 'finance_team'],
          roles: ['pii_viewer'],
          accesses: [
            { type: 'select', isAllowed: true }
          ],
          conditions: [
            {
              type: 'tag-based',
              values: ['unmasked_access']
            }
          ],
          delegateAdmin: false
        }
      ],
      isEnabled: true,
      isAuditEnabled: true,
      createdBy: 'security_admin',
      createdTime: new Date('2024-01-01')
    });
    
    // Development environment policy
    this.policies.set('policy-003', {
      id: 'policy-003',
      name: 'Development Environment - Open Access',
      service: 'snowflake',
      resources: {
        database: ['development', 'staging'],
        table: ['*'],
        column: ['*']
      },
      policyItems: [
        {
          users: [],
          groups: ['all_users'],
          roles: [],
          accesses: [
            { type: 'select', isAllowed: true },
            { type: 'insert', isAllowed: true },
            { type: 'update', isAllowed: true }
          ],
          delegateAdmin: false
        }
      ],
      isEnabled: true,
      isAuditEnabled: false,
      createdBy: 'admin',
      createdTime: new Date('2024-01-01')
    });
    
    // Add some audit events
    this.generateMockAuditEvents();
  }
  
  private generateMockAuditEvents() {
    const resources = [
      'production.customer.master_table',
      'production.sales.transactions',
      'development.test.sample_data'
    ];
    
    const users = ['data_engineer', 'analyst_1', 'ml_engineer', 'admin'];
    const accessTypes = ['select', 'insert', 'update'];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i);
      
      this.auditEvents.push({
        id: `audit-${i}`,
        timestamp,
        user: users[Math.floor(Math.random() * users.length)],
        resource: resources[Math.floor(Math.random() * resources.length)],
        accessType: accessTypes[Math.floor(Math.random() * accessTypes.length)],
        result: Math.random() > 0.1 ? 'allowed' : 'denied',
        policyId: Math.random() > 0.5 ? 'policy-001' : 'policy-002',
        clientIP: `192.168.1.${Math.floor(Math.random() * 255)}`,
        resultReason: Math.random() > 0.9 ? 'Time restriction violated' : undefined
      });
    }
  }
  
  /**
   * Check access permission
   */
  async checkAccess(request: AccessRequest): Promise<AccessResult> {
    await this.simulateLatency();
    
    const matchedPolicies: string[] = [];
    const deniedPolicies: string[] = [];
    let isAllowed = false;
    let reason: string | undefined;
    
    // Check each policy
    for (const policy of this.policies.values()) {
      if (!policy.isEnabled) continue;
      
      // Check resource match
      const resourceMatch = this.matchResource(request.resource, policy.resources);
      if (!resourceMatch) continue;
      
      // Check policy items
      for (const item of policy.policyItems) {
        const userMatch = item.users.includes(request.user) ||
                         item.groups.some(g => request.groups.includes(g));
        
        if (userMatch) {
          const accessMatch = item.accesses.some(a =>
            a.type === request.accessType || a.type === 'all'
          );
          
          if (accessMatch) {
            // Check conditions
            if (policy.conditions) {
              const conditionsMet = this.checkConditions(policy.conditions, request.context);
              if (!conditionsMet) {
                deniedPolicies.push(policy.id);
                reason = 'Policy conditions not met';
                continue;
              }
            }
            
            if (item.accesses.find(a => a.type === request.accessType || a.type === 'all')?.isAllowed) {
              matchedPolicies.push(policy.id);
              isAllowed = true;
            } else {
              deniedPolicies.push(policy.id);
            }
          }
        }
      }
    }
    
    // Log audit event
    this.auditEvents.push({
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      user: request.user,
      resource: request.resource,
      accessType: request.accessType,
      result: isAllowed ? 'allowed' : 'denied',
      policyId: matchedPolicies[0],
      clientIP: request.context?.clientIP,
      resultReason: reason
    });
    
    // Also log to mockDataStore
    mockDataStore.addAuditLog({
      user: request.user,
      action: request.accessType,
      resource: request.resource,
      result: isAllowed ? 'success' : 'denied',
      details: { matchedPolicies, deniedPolicies }
    });
    
    return {
      isAllowed,
      reason: reason || (isAllowed ? 'Access granted' : 'No matching policy'),
      matchedPolicies,
      deniedPolicies
    };
  }
  
  /**
   * Get all policies
   */
  async getPolicies(filters?: {
    service?: string;
    resource?: string;
    user?: string;
  }): Promise<RangerPolicy[]> {
    await this.simulateLatency();
    
    let policies = Array.from(this.policies.values());
    
    if (filters?.service) {
      policies = policies.filter(p => p.service === filters.service);
    }
    
    if (filters?.resource) {
      policies = policies.filter(p =>
        this.matchResource(filters.resource!, p.resources)
      );
    }
    
    if (filters?.user) {
      policies = policies.filter(p =>
        p.policyItems.some(item => item.users.includes(filters.user!))
      );
    }
    
    return policies;
  }
  
  /**
   * Create or update a policy
   */
  async savePolicy(policy: RangerPolicy): Promise<RangerPolicy> {
    await this.simulateLatency();
    
    if (!policy.id) {
      policy.id = `policy-${Date.now()}`;
      policy.createdTime = new Date();
    } else {
      policy.updatedTime = new Date();
    }
    
    this.policies.set(policy.id, policy);
    return policy;
  }
  
  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<boolean> {
    await this.simulateLatency();
    return this.policies.delete(policyId);
  }
  
  /**
   * Get audit events
   */
  async getAuditEvents(filters?: {
    user?: string;
    resource?: string;
    startTime?: Date;
    endTime?: Date;
    result?: 'allowed' | 'denied';
  }): Promise<AuditEvent[]> {
    await this.simulateLatency();
    
    let events = [...this.auditEvents];
    
    if (filters?.user) {
      events = events.filter(e => e.user === filters.user);
    }
    
    if (filters?.resource) {
      events = events.filter(e => e.resource.includes(filters.resource!));
    }
    
    if (filters?.result) {
      events = events.filter(e => e.result === filters.result);
    }
    
    if (filters?.startTime) {
      events = events.filter(e => e.timestamp >= filters.startTime!);
    }
    
    if (filters?.endTime) {
      events = events.filter(e => e.timestamp <= filters.endTime!);
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Get access summary for a user
   */
  async getUserAccessSummary(user: string): Promise<{
    allowedResources: string[];
    deniedResources: string[];
    recentAccesses: AuditEvent[];
    policies: RangerPolicy[];
  }> {
    await this.simulateLatency();
    
    const userEvents = this.auditEvents.filter(e => e.user === user);
    const allowedResources = [...new Set(
      userEvents.filter(e => e.result === 'allowed').map(e => e.resource)
    )];
    const deniedResources = [...new Set(
      userEvents.filter(e => e.result === 'denied').map(e => e.resource)
    )];
    
    const userPolicies = Array.from(this.policies.values()).filter(p =>
      p.policyItems.some(item => item.users.includes(user))
    );
    
    return {
      allowedResources,
      deniedResources,
      recentAccesses: userEvents.slice(0, 10),
      policies: userPolicies
    };
  }
  
  private matchResource(requestResource: string, policyResources: any): boolean {
    // Simple wildcard matching
    const parts = requestResource.split('.');
    
    if (policyResources.database) {
      const dbMatch = policyResources.database.some((db: string) =>
        db === '*' || db === parts[0] || (db.endsWith('*') && parts[0].startsWith(db.slice(0, -1)))
      );
      if (!dbMatch) return false;
    }
    
    if (policyResources.table && parts.length > 1) {
      const tableMatch = policyResources.table.some((tbl: string) =>
        tbl === '*' || tbl === parts[1] || (tbl.endsWith('*') && parts[1].startsWith(tbl.slice(0, -1)))
      );
      if (!tableMatch) return false;
    }
    
    return true;
  }
  
  private checkConditions(conditions: PolicyCondition[], context?: Record<string, any>): boolean {
    for (const condition of conditions) {
      if (condition.type === 'time-range') {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const [start, end] = condition.values[0].split('-');
        if (currentTime < start || currentTime > end) {
          return false;
        }
      }
      
      if (condition.type === 'ip-range' && context?.clientIP) {
        // Simple IP check
        const allowed = condition.values.some(range =>
          context.clientIP.startsWith(range.replace('*', ''))
        );
        if (!allowed) return false;
      }
    }
    
    return true;
  }
  
  private async simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  }
}

export const mockRangerService = new MockRangerService();