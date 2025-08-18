/**
 * Main LLM Service
 * Coordinates between providers, models, and the application
 */

import { LLMProvider, CompletionOptions, CompletionResponse, Message } from './interfaces/LLMProvider';
import { SyntheticProvider } from './providers/synthetic/SyntheticProvider';
import { ModelRegistry } from './models/ModelRegistry';
import { validateLLMConfig } from './config';

export interface LLMQuery {
  query: string;
  context?: {
    domain?: string;
    viewState?: any;
    selectedFeatures?: any[];
    previousMessages?: Message[];
  };
  options?: {
    stream?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export class LLMService {
  private static instance: LLMService;
  private providers: Map<string, LLMProvider> = new Map();
  private modelRegistry: ModelRegistry;
  private initialized = false;

  private constructor() {
    this.modelRegistry = ModelRegistry.getInstance();
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[LLMService] Initializing...');

    // Validate configuration
    if (!validateLLMConfig()) {
      console.warn('[LLMService] LLM features disabled due to missing configuration');
      return;
    }

    // Initialize providers
    try {
      const syntheticProvider = new SyntheticProvider();
      await syntheticProvider.initialize();
      this.providers.set('synthetic', syntheticProvider);
      
      this.initialized = true;
      console.log('[LLMService] Initialized successfully');
    } catch (error) {
      console.error('[LLMService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Process a user query
   */
  async query(request: LLMQuery): Promise<CompletionResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Classify the query
    const classification = this.modelRegistry.classifyQuery(request.query, request.context);
    console.log('[LLMService] Query classification:', classification);

    // Build messages with context
    const messages = this.buildMessages(request);

    // Get the provider (for now, just Synthetic)
    const provider = this.providers.get('synthetic');
    if (!provider) {
      throw new Error('No LLM provider available');
    }

    // Prepare completion options
    const completionOptions: CompletionOptions = {
      model: classification.suggestedModel,
      messages,
      temperature: request.options?.temperature,
      maxTokens: request.options?.maxTokens,
      stream: false // Handle streaming separately
    };

    // Execute completion
    const startTime = Date.now();
    const response = await provider.complete(completionOptions);
    const duration = Date.now() - startTime;

    console.log(`[LLMService] Completion took ${duration}ms`);

    return response;
  }

  /**
   * Stream a response for a user query
   */
  async *queryStream(request: LLMQuery): AsyncGenerator<string, void, unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Classify the query
    const classification = this.modelRegistry.classifyQuery(request.query, request.context);

    // Build messages with context
    const messages = this.buildMessages(request);

    // Get the provider
    const provider = this.providers.get('synthetic');
    if (!provider) {
      throw new Error('No LLM provider available');
    }

    // Stream the completion
    const stream = provider.completeStream({
      model: classification.suggestedModel,
      messages,
      temperature: request.options?.temperature,
      maxTokens: request.options?.maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      if (chunk.delta) {
        yield chunk.delta;
      }
    }
  }

  /**
   * Build messages array with system prompt and context
   */
  private buildMessages(request: LLMQuery): Message[] {
    const messages: Message[] = [];

    // System prompt based on domain
    messages.push({
      role: 'system',
      content: this.getSystemPrompt(request.context?.domain)
    });

    // Add previous messages if any
    if (request.context?.previousMessages) {
      messages.push(...request.context.previousMessages);
    }

    // Add context information
    if (request.context) {
      const contextMessage = this.buildContextMessage(request.context);
      if (contextMessage) {
        messages.push({
          role: 'system',
          content: contextMessage
        });
      }
    }

    // Add the user query
    messages.push({
      role: 'user',
      content: request.query
    });

    return messages;
  }

  /**
   * Get domain-specific system prompt
   */
  private getSystemPrompt(domain?: string): string {
    const basePrompt = `You are an intelligent assistant for the GeoCoreMap platform, specializing in geospatial data analysis and ground station operations. 
You have access to real-time data about ground stations, maritime vessels, and other geospatial entities.
Provide accurate, concise, and actionable information. When referencing locations, be specific with coordinates when available.`;

    const domainPrompts: Record<string, string> = {
      'ground-stations': `
Focus on ground station operations, including:
- Station status, health scores, and utilization metrics
- Network connectivity and performance
- Predictive maintenance insights
- Optimization recommendations`,
      
      'maritime': `
Focus on maritime operations, including:
- Vessel tracking and AIS data
- Route optimization
- Port operations
- Weather impact analysis`,
      
      'satellite': `
Focus on satellite operations, including:
- Orbital mechanics and coverage
- Communication windows
- Link budget analysis
- Constellation management`
    };

    return basePrompt + (domain ? domainPrompts[domain] || '' : '');
  }

  /**
   * Build context message from current application state
   */
  private buildContextMessage(context: any): string | null {
    const parts: string[] = [];

    if (context.viewState) {
      parts.push(`Current map view: 
- Center: ${context.viewState.latitude.toFixed(4)}, ${context.viewState.longitude.toFixed(4)}
- Zoom: ${context.viewState.zoom.toFixed(1)}`);
    }

    if (context.selectedFeatures && context.selectedFeatures.length > 0) {
      const features = context.selectedFeatures.map((f: any) => 
        `- ${f.name || f.id} (${f.type || 'unknown'})`
      ).join('\n');
      parts.push(`Selected features:\n${features}`);
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<any[]> {
    const models: any[] = [];
    
    for (const [name, provider] of this.providers) {
      const providerModels = await provider.listModels();
      models.push(...providerModels.map(m => ({ ...m, provider: name })));
    }
    
    return models;
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        results[name] = await provider.healthCheck();
      } catch {
        results[name] = false;
      }
    }
    
    return results;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    for (const provider of this.providers.values()) {
      provider.dispose();
    }
    this.providers.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();