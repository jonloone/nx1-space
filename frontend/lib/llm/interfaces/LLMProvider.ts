/**
 * Base LLM Provider Interface
 * Defines the contract for all LLM implementations
 */

import { z } from 'zod';

// Message types
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  name: z.string().optional(),
  functionCall: z.any().optional()
});

export type Message = z.infer<typeof MessageSchema>;

// Completion options
export const CompletionOptionsSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
  stopSequences: z.array(z.string()).optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export type CompletionOptions = z.infer<typeof CompletionOptionsSchema>;

// Completion response
export interface CompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

// Stream chunk for streaming responses
export interface StreamChunk {
  id: string;
  delta: string;
  finishReason?: CompletionResponse['finishReason'];
  usage?: CompletionResponse['usage'];
}

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  capabilities: string[];
  pricing?: {
    inputTokens: number;  // per 1k tokens
    outputTokens: number; // per 1k tokens
  };
}

// Provider capabilities
export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  imageInput: boolean;
  embeddings: boolean;
  fineTuning: boolean;
}

// Base LLM Provider interface
export interface LLMProvider {
  // Provider identification
  readonly name: string;
  readonly version: string;
  readonly capabilities: ProviderCapabilities;
  
  // Core methods
  initialize(): Promise<void>;
  
  // Completion methods
  complete(options: CompletionOptions): Promise<CompletionResponse>;
  completeStream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
  
  // Model management
  listModels(): Promise<ModelInfo[]>;
  getModel(modelId: string): Promise<ModelInfo | null>;
  
  // Health check
  healthCheck(): Promise<boolean>;
  
  // Cleanup
  dispose(): void;
}

// Error types
export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class RateLimitError extends LLMError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
  }
}

export class AuthenticationError extends LLMError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION', 401);
  }
}

export class ModelNotFoundError extends LLMError {
  constructor(modelId: string) {
    super(`Model not found: ${modelId}`, 'MODEL_NOT_FOUND', 404);
  }
}