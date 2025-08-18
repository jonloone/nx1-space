'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useLocalRuntime } from '@assistant-ui/react/runtimes';
import { createSyntheticAdapter, ASSISTANT_CONFIG } from '@/lib/services/llm/synthetic-adapter';

interface AssistantContextValue {
  context: any;
  updateContext: (context: any) => void;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

export const useAssistantContext = () => {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistantContext must be used within AssistantProvider');
  }
  return context;
};

interface AssistantProviderProps {
  children: React.ReactNode;
  context?: any;
  threadId?: string;
}

export const AssistantProvider: React.FC<AssistantProviderProps> = ({
  children,
  context: initialContext,
  threadId
}) => {
  const [context, setContext] = React.useState(initialContext || {});

  // Create runtime with API endpoint
  const runtime = useLocalRuntime({
    api: '/api/assistant/chat',
    // Pass context in the request
    body: {
      context,
      threadId
    }
  });

  // Update system message when context changes
  React.useEffect(() => {
    if (runtime && context) {
      const systemPrompt = ASSISTANT_CONFIG.systemPromptTemplate(context);
      runtime.setSystemMessage(systemPrompt);
    }
  }, [runtime, context]);

  const value = useMemo(() => ({
    context,
    updateContext: setContext
  }), [context]);

  return (
    <AssistantContext.Provider value={value}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </AssistantContext.Provider>
  );
};