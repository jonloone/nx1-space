'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { ASSISTANT_CONFIG } from '@/lib/services/llm/synthetic-adapter';
import { useAssistantRuntime } from './useAssistantRuntime';

interface AssistantContextValue {
  context: any;
  updateContext: (context: any) => void;
  runtime: ReturnType<typeof useAssistantRuntime>;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

export const useAssistantContext = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within SimpleAssistantProvider');
  }
  return context;
};

interface SimpleAssistantProviderProps {
  children: React.ReactNode;
  context?: any;
  threadId?: string;
}

export const SimpleAssistantProvider: React.FC<SimpleAssistantProviderProps> = ({
  children,
  context: initialContext,
  threadId
}) => {
  const [context, setContext] = React.useState(initialContext || {});

  // Create runtime
  const runtime = useAssistantRuntime({
    api: '/api/assistant/chat',
    context,
    threadId
  });

  // Update system message when context changes
  React.useEffect(() => {
    if (context) {
      const systemPrompt = ASSISTANT_CONFIG.systemPromptTemplate(context);
      runtime.setSystemMessage(systemPrompt);
    }
  }, [context, runtime]);

  const value = useMemo(() => ({
    context,
    updateContext: setContext,
    runtime
  }), [context, runtime]);

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};