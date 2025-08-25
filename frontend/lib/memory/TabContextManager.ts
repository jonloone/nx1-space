/**
 * Tab Context Manager using Mem0 for persistent memory storage
 * Handles tab state, AI conversations, and cross-session context preservation
 */

import { type TaskType } from '@/stores/workspaceStore';

// Mem0 client interface (will be replaced with actual SDK when available)
interface MemoryClient {
  add: (memory: Memory) => Promise<string>;
  search: (query: SearchQuery) => Promise<MemoryResult[]>;
  get: (id: string) => Promise<Memory | null>;
  update: (id: string, memory: Partial<Memory>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

interface Memory {
  messages: Array<{
    role: 'system' | 'assistant' | 'user';
    content: string;
  }>;
  metadata?: Record<string, any>;
}

interface SearchQuery {
  query: string;
  metadata_filter?: Record<string, any>;
  limit?: number;
  user_id?: string;
}

interface MemoryResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
  created_at: string;
}

export interface TabContext {
  tabId: string;
  taskType: string;
  currentData: any;
  paneConfiguration: PaneConfig[];
  aiHistory: AIMessage[];
  userDecisions: Decision[];
  timestamp: number;
  sessionId: string;
}

export interface PaneConfig {
  id: string;
  component: string;
  position: string;
  size: number;
  state: any;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: any;
}

export interface Decision {
  type: string;
  choice: string;
  timestamp: number;
  reasoning?: string;
}

export interface RelatedContext {
  tabId: string;
  relevance: number;
  context: TabContext;
  relationship: string;
}

// Mock Mem0 client for development (replace with actual SDK)
class MockMem0Client implements MemoryClient {
  private storage: Map<string, Memory> = new Map();
  private idCounter = 0;

  async add(memory: Memory): Promise<string> {
    const id = `mem_${++this.idCounter}`;
    this.storage.set(id, memory);
    
    // In real Mem0, this would create vector embeddings
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mem0_storage') || '{}';
      const data = JSON.parse(stored);
      data[id] = memory;
      localStorage.setItem('mem0_storage', JSON.stringify(data));
    }
    
    return id;
  }

  async search(query: SearchQuery): Promise<MemoryResult[]> {
    const results: MemoryResult[] = [];
    
    // Simple search implementation (Mem0 would use semantic search)
    this.storage.forEach((memory, id) => {
      const content = JSON.stringify(memory.messages);
      if (content.toLowerCase().includes(query.query.toLowerCase())) {
        // Check metadata filters
        if (query.metadata_filter) {
          const matches = Object.entries(query.metadata_filter).every(
            ([key, value]) => memory.metadata?.[key] === value
          );
          if (!matches) return;
        }
        
        results.push({
          id,
          content: memory.messages[memory.messages.length - 1].content,
          metadata: memory.metadata || {},
          score: 0.9, // Mock relevance score
          created_at: new Date().toISOString()
        });
      }
    });
    
    return results.slice(0, query.limit || 10);
  }

  async get(id: string): Promise<Memory | null> {
    return this.storage.get(id) || null;
  }

  async update(id: string, memory: Partial<Memory>): Promise<void> {
    const existing = this.storage.get(id);
    if (existing) {
      this.storage.set(id, { ...existing, ...memory });
    }
  }

  async delete(id: string): Promise<void> {
    this.storage.delete(id);
  }
}

export class TabContextManager {
  private mem0: MemoryClient;
  private userId: string;
  private sessionId: string;
  private contextCache: Map<string, TabContext> = new Map();

  constructor(userId: string, sessionId: string) {
    // In production, initialize with actual Mem0 client
    // this.mem0 = new Mem0Client({
    //   api_key: process.env.NEXT_PUBLIC_MEM0_API_KEY,
    //   org_id: "nexusone",
    //   project_id: "workspace"
    // });
    
    // For now, use mock implementation
    this.mem0 = new MockMem0Client();
    this.userId = userId;
    this.sessionId = sessionId;
  }

  /**
   * Save tab context to Mem0 for persistence
   */
  async saveTabContext(tabId: string, context: TabContext): Promise<void> {
    // Create memory representation
    const memory: Memory = {
      messages: [
        {
          role: 'system',
          content: `Tab context for ${context.taskType}`
        },
        {
          role: 'assistant',
          content: JSON.stringify({
            ...context,
            tabId,
            timestamp: Date.now()
          })
        }
      ],
      metadata: {
        tab_id: tabId,
        task_type: context.taskType,
        user_id: this.userId,
        session_id: this.sessionId,
        timestamp: Date.now()
      }
    };

    // Store in Mem0
    const memoryId = await this.mem0.add(memory);
    
    // Cache locally for fast access
    this.contextCache.set(tabId, context);
    
    // Store mapping for retrieval
    if (typeof window !== 'undefined') {
      const mappings = JSON.parse(localStorage.getItem('tab_memory_mappings') || '{}');
      mappings[tabId] = memoryId;
      localStorage.setItem('tab_memory_mappings', JSON.stringify(mappings));
    }
  }

  /**
   * Retrieve tab context from Mem0
   */
  async getTabContext(tabId: string): Promise<TabContext | null> {
    // Check cache first
    if (this.contextCache.has(tabId)) {
      return this.contextCache.get(tabId)!;
    }

    // Search in Mem0
    const memories = await this.mem0.search({
      query: `tab context ${tabId}`,
      metadata_filter: {
        tab_id: tabId,
        user_id: this.userId
      },
      limit: 1
    });

    if (memories.length > 0) {
      const context = JSON.parse(memories[0].content) as TabContext;
      this.contextCache.set(tabId, context);
      return context;
    }

    return null;
  }

  /**
   * Get related context across tabs using semantic search
   */
  async getRelatedContext(currentTask: string): Promise<RelatedContext[]> {
    // Mem0's semantic search finds related memories
    const related = await this.mem0.search({
      query: `Context related to ${currentTask} task workflow data pipeline`,
      metadata_filter: {
        user_id: this.userId
      },
      limit: 5
    });

    return related.map(memory => {
      const context = JSON.parse(memory.content) as TabContext;
      return {
        tabId: memory.metadata.tab_id,
        relevance: memory.score,
        context,
        relationship: this.determineRelationship(currentTask, context.taskType)
      };
    });
  }

  /**
   * Get AI conversation history across all tabs
   */
  async getGlobalAIHistory(): Promise<AIMessage[]> {
    const memories = await this.mem0.search({
      query: 'AI conversation history messages',
      metadata_filter: {
        user_id: this.userId
      },
      limit: 20
    });

    const allMessages: AIMessage[] = [];
    memories.forEach(memory => {
      try {
        const context = JSON.parse(memory.content) as TabContext;
        if (context.aiHistory) {
          allMessages.push(...context.aiHistory);
        }
      } catch (e) {
        // Skip if not a tab context
      }
    });

    // Sort by timestamp
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Find context by semantic similarity
   */
  async findSimilarContext(description: string): Promise<TabContext[]> {
    const similar = await this.mem0.search({
      query: description,
      metadata_filter: {
        user_id: this.userId
      },
      limit: 3
    });

    return similar
      .map(m => {
        try {
          return JSON.parse(m.content) as TabContext;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as TabContext[];
  }

  /**
   * Store decision made by user
   */
  async saveDecision(tabId: string, decision: Decision): Promise<void> {
    const context = await this.getTabContext(tabId);
    if (context) {
      context.userDecisions = context.userDecisions || [];
      context.userDecisions.push(decision);
      await this.saveTabContext(tabId, context);
    }
  }

  /**
   * Get all decisions related to a specific domain
   */
  async getDecisionHistory(domain: string): Promise<Decision[]> {
    const memories = await this.mem0.search({
      query: `decisions ${domain}`,
      metadata_filter: {
        user_id: this.userId
      },
      limit: 10
    });

    const decisions: Decision[] = [];
    memories.forEach(memory => {
      try {
        const context = JSON.parse(memory.content) as TabContext;
        if (context.userDecisions) {
          decisions.push(...context.userDecisions);
        }
      } catch (e) {
        // Skip invalid entries
      }
    });

    return decisions;
  }

  /**
   * Clear context for a specific tab
   */
  async clearTabContext(tabId: string): Promise<void> {
    this.contextCache.delete(tabId);
    
    if (typeof window !== 'undefined') {
      const mappings = JSON.parse(localStorage.getItem('tab_memory_mappings') || '{}');
      const memoryId = mappings[tabId];
      if (memoryId) {
        await this.mem0.delete(memoryId);
        delete mappings[tabId];
        localStorage.setItem('tab_memory_mappings', JSON.stringify(mappings));
      }
    }
  }

  /**
   * Determine relationship between task types
   */
  private determineRelationship(task1: string, task2: string): string {
    const relationships: Record<string, Record<string, string>> = {
      'build_pipeline': {
        'data_quality_assessment': 'quality validation',
        'performance_tuning': 'optimization',
        'real_time_monitoring': 'monitoring'
      },
      'data_quality_assessment': {
        'build_pipeline': 'quality source',
        'exploratory_analysis': 'investigation',
        'real_time_monitoring': 'quality tracking'
      },
      'performance_tuning': {
        'build_pipeline': 'pipeline optimization',
        'real_time_monitoring': 'performance tracking'
      }
    };

    return relationships[task1]?.[task2] || 'related';
  }

  /**
   * Export all context for backup or analysis
   */
  async exportAllContext(): Promise<TabContext[]> {
    const allMemories = await this.mem0.search({
      query: 'tab context',
      metadata_filter: {
        user_id: this.userId
      },
      limit: 100
    });

    return allMemories
      .map(m => {
        try {
          return JSON.parse(m.content) as TabContext;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as TabContext[];
  }
}