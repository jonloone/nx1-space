/**
 * React hook for tab context management with Mem0
 * Provides seamless context persistence and retrieval
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedContextSystem } from '@/lib/memory/UnifiedContextSystem';
import { type TabContext, type AIMessage, type Decision } from '@/lib/memory/TabContextManager';
import { debounce } from '@/lib/utils/debounce';

interface UseTabContextOptions {
  tabId: string;
  taskType: string;
  autoSave?: boolean;
  saveInterval?: number;
}

interface UseTabContextReturn {
  context: TabContext | null;
  loading: boolean;
  error: string | null;
  
  // Context operations
  saveContext: (context: Partial<TabContext>) => Promise<void>;
  updatePaneConfig: (panes: any[]) => void;
  addAIMessage: (message: AIMessage) => void;
  addDecision: (decision: Decision) => void;
  
  // Related context
  relatedContexts: TabContext[];
  recommendations: string[];
  
  // AI operations
  sendAIMessage: (message: string) => Promise<{ response: string; actions?: any[] }>;
  getAIHistory: () => AIMessage[];
}

// Global context system instance (singleton)
let contextSystemInstance: UnifiedContextSystem | null = null;

function getContextSystem(): UnifiedContextSystem {
  if (!contextSystemInstance) {
    // In production, get user ID from auth
    const userId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId') || 'default-user'
      : 'default-user';
    
    const sessionId = typeof window !== 'undefined'
      ? sessionStorage.getItem('sessionId') || `session-${Date.now()}`
      : `session-${Date.now()}`;
    
    if (typeof window !== 'undefined' && !sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    contextSystemInstance = new UnifiedContextSystem(userId, sessionId);
  }
  return contextSystemInstance;
}

export function useTabContext({
  tabId,
  taskType,
  autoSave = true,
  saveInterval = 5000
}: UseTabContextOptions): UseTabContextReturn {
  const [context, setContext] = useState<TabContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedContexts, setRelatedContexts] = useState<TabContext[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  const contextSystem = useRef<UnifiedContextSystem>(getContextSystem());
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const previousTabRef = useRef<string | null>(null);

  // Load context when tab mounts or changes
  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle tab switch
        const newContext = await contextSystem.current.handleTabSwitch(
          previousTabRef.current,
          tabId
        );

        if (newContext) {
          setContext(newContext);
          
          // Load related contexts
          const related = await contextSystem.current.mem0.getRelatedContext(taskType);
          setRelatedContexts(related.map(r => r.context));
          
          // Get recommendations
          const recs = await contextSystem.current.getRecommendations(tabId);
          setRecommendations(recs);
        } else {
          // Create new context
          const newCtx: TabContext = {
            tabId,
            taskType,
            currentData: {},
            paneConfiguration: [],
            aiHistory: [],
            userDecisions: [],
            timestamp: Date.now(),
            sessionId: sessionStorage.getItem('sessionId') || ''
          };
          setContext(newCtx);
        }

        previousTabRef.current = tabId;
      } catch (err) {
        console.error('Failed to load tab context:', err);
        setError(err instanceof Error ? err.message : 'Failed to load context');
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [tabId, taskType]);

  // Auto-save context periodically
  useEffect(() => {
    if (!autoSave || !context) return;

    const saveContextPeriodically = async () => {
      try {
        await contextSystem.current.mem0.saveTabContext(tabId, context);
      } catch (err) {
        console.error('Failed to auto-save context:', err);
      }
    };

    const interval = setInterval(saveContextPeriodically, saveInterval);
    return () => clearInterval(interval);
  }, [autoSave, saveInterval, context, tabId]);

  // Save context on unmount
  useEffect(() => {
    return () => {
      if (context) {
        // Save context when tab is closed/switched
        contextSystem.current.mem0.saveTabContext(tabId, context).catch(err => {
          console.error('Failed to save context on unmount:', err);
        });
      }
    };
  }, [context, tabId]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (ctx: TabContext) => {
      try {
        await contextSystem.current.mem0.saveTabContext(tabId, ctx);
      } catch (err) {
        console.error('Failed to save context:', err);
      }
    }, 1000),
    [tabId]
  );

  // Save context manually
  const saveContext = useCallback(async (updates: Partial<TabContext>) => {
    if (!context) return;

    const updatedContext = {
      ...context,
      ...updates,
      timestamp: Date.now()
    };

    setContext(updatedContext);
    
    // Save to Mem0
    if (autoSave) {
      debouncedSave(updatedContext);
    } else {
      await contextSystem.current.mem0.saveTabContext(tabId, updatedContext);
    }
  }, [context, tabId, autoSave, debouncedSave]);

  // Update pane configuration
  const updatePaneConfig = useCallback((panes: any[]) => {
    if (!context) return;
    
    const updatedContext = {
      ...context,
      paneConfiguration: panes,
      timestamp: Date.now()
    };
    
    setContext(updatedContext);
    debouncedSave(updatedContext);
  }, [context, debouncedSave]);

  // Add AI message to history
  const addAIMessage = useCallback((message: AIMessage) => {
    if (!context) return;
    
    const updatedContext = {
      ...context,
      aiHistory: [...(context.aiHistory || []), message],
      timestamp: Date.now()
    };
    
    setContext(updatedContext);
    debouncedSave(updatedContext);
  }, [context, debouncedSave]);

  // Add user decision
  const addDecision = useCallback((decision: Decision) => {
    if (!context) return;
    
    const updatedContext = {
      ...context,
      userDecisions: [...(context.userDecisions || []), decision],
      timestamp: Date.now()
    };
    
    setContext(updatedContext);
    debouncedSave(updatedContext);
    
    // Also save to context system for cross-tab awareness
    contextSystem.current.saveDecision(tabId, decision.choice, decision.reasoning);
  }, [context, tabId, debouncedSave]);

  // Send AI message with full context
  const sendAIMessage = useCallback(async (message: string) => {
    const response = await contextSystem.current.processAIMessage(
      message,
      tabId,
      taskType
    );
    
    // Add to history
    addAIMessage({ role: 'user', content: message, timestamp: Date.now() });
    addAIMessage({ role: 'assistant', content: response.response, timestamp: Date.now() });
    
    return response;
  }, [tabId, taskType, addAIMessage]);

  // Get AI history
  const getAIHistory = useCallback(() => {
    return context?.aiHistory || [];
  }, [context]);

  return {
    context,
    loading,
    error,
    saveContext,
    updatePaneConfig,
    addAIMessage,
    addDecision,
    relatedContexts,
    recommendations,
    sendAIMessage,
    getAIHistory
  };
}

// Additional hook for global AI history
export function useGlobalAIHistory() {
  const [history, setHistory] = useState<AIMessage[]>([]);
  const contextSystem = useRef<UnifiedContextSystem>(getContextSystem());

  useEffect(() => {
    const loadHistory = async () => {
      const globalHistory = await contextSystem.current.mem0.getGlobalAIHistory();
      setHistory(globalHistory);
    };
    
    loadHistory();
  }, []);

  return history;
}

// Hook for decision history
export function useDecisionHistory(domain?: string) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const contextSystem = useRef<UnifiedContextSystem>(getContextSystem());

  useEffect(() => {
    const loadDecisions = async () => {
      const history = await contextSystem.current.mem0.getDecisionHistory(domain || 'all');
      setDecisions(history);
    };
    
    loadDecisions();
  }, [domain]);

  return decisions;
}