/**
 * Synthetic AI Provider Implementation
 * Handles communication with Synthetic's LLM API
 */

import { 
  LLMProvider, 
  CompletionOptions, 
  CompletionResponse, 
  StreamChunk,
  ModelInfo,
  ProviderCapabilities,
  LLMError,
  RateLimitError,
  AuthenticationError
} from '../../interfaces/LLMProvider';
import { LLM_CONFIG } from '../../config';
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

export class SyntheticProvider implements LLMProvider {
  readonly name = 'Synthetic';
  readonly version = '1.0.0';
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    functionCalling: false,
    imageInput: false,
    embeddings: false,
    fineTuning: false
  };

  private apiKey: string;
  private apiUrl: string;
  private initialized = false;

  constructor() {
    this.apiKey = LLM_CONFIG.synthetic.apiKey;
    this.apiUrl = LLM_CONFIG.synthetic.apiUrl;
    console.log('[Synthetic] Constructor - API Key present:', !!this.apiKey);
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      console.warn('[Synthetic] No API key configured, running in mock mode');
      // Allow mock mode for development
      this.initialized = true;
      return;
    }
    
    // Verify API key is valid
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      console.warn('[Synthetic] Health check failed, running in degraded mode');
    }
    
    this.initialized = true;
  }

  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Mock mode when no API key
    if (!this.apiKey) {
      return this.getMockResponse(options);
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'GeoCoreMap/1.0'
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? LLM_CONFIG.synthetic.temperature,
          max_tokens: options.maxTokens ?? LLM_CONFIG.synthetic.maxTokens,
          top_p: options.topP ?? LLM_CONFIG.synthetic.topP,
          stream: false,
          stop: options.stopSequences
        })
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        model: data.model,
        content: data.choices[0].message.content,
        finishReason: this.mapFinishReason(data.choices[0].finish_reason),
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined,
        metadata: {
          latency: Date.now() - startTime
        }
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Synthetic completion failed: ${error.message}`,
        'COMPLETION_FAILED',
        500,
        error
      );
    }
  }

  async *completeStream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Mock mode when no API key
    if (!this.apiKey) {
      yield* this.getMockStream(options);
      return;
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'GeoCoreMap/1.0'
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? LLM_CONFIG.synthetic.temperature,
        max_tokens: options.maxTokens ?? LLM_CONFIG.synthetic.maxTokens,
        top_p: options.topP ?? LLM_CONFIG.synthetic.topP,
        stream: true,
        stop: options.stopSequences
      })
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('No response body', 'STREAM_FAILED');
    }

    const decoder = new TextDecoder();

    let streamId = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              streamId = parsed.id;
              
              if (parsed.choices[0].delta?.content) {
                yield {
                  id: streamId,
                  delta: parsed.choices[0].delta.content,
                  finishReason: parsed.choices[0].finish_reason ? 
                    this.mapFinishReason(parsed.choices[0].finish_reason) : undefined
                };
              }
            } catch (e) {
              console.error('[Synthetic] Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // Synthetic doesn't provide a models endpoint, so we return our configured models
    const models = Object.entries(LLM_CONFIG.synthetic.models);
    
    return models.map(([key, id]) => ({
      id,
      name: this.getModelDisplayName(id),
      description: this.getModelDescription(key),
      contextLength: this.getModelContextLength(id),
      capabilities: this.getModelCapabilities(key)
    }));
  }

  async getModel(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find(m => m.id === modelId) || null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test with a minimal completion
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'GeoCoreMap/1.0'
        },
        body: JSON.stringify({
          model: LLM_CONFIG.synthetic.models.small,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
          temperature: 0
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  dispose(): void {
    // Cleanup if needed
    this.initialized = false;
  }

  // Helper methods
  private async handleError(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = errorData.error?.message || errorData.message || 'Unknown error';

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined);
      default:
        throw new LLMError(message, 'API_ERROR', response.status, errorData);
    }
  }

  private mapFinishReason(reason: string): CompletionResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'function_call':
        return 'function_call';
      default:
        return 'error';
    }
  }

  private getModelDisplayName(modelId: string): string {
    const names: Record<string, string> = {
      'mistral-7b-instruct': 'Mistral 7B',
      'dolphin-mixtral-8x7b': 'Dolphin Mixtral 8x7B',
      'llama-3-70b-instruct': 'Llama 3 70B',
      'airoboros-70b': 'Airoboros 70B'
    };
    return names[modelId] || modelId;
  }

  private getModelDescription(key: string): string {
    const descriptions: Record<string, string> = {
      small: 'Fast responses for simple queries',
      medium: 'Balanced performance for most tasks',
      large: 'Complex analysis and reasoning',
      coding: 'Specialized for code generation'
    };
    return descriptions[key] || 'General purpose model';
  }

  private getModelContextLength(modelId: string): number {
    const contexts: Record<string, number> = {
      'mistral-7b-instruct': 8192,
      'dolphin-mixtral-8x7b': 32768,
      'llama-3-70b-instruct': 8192,
      'airoboros-70b': 8192
    };
    return contexts[modelId] || 4096;
  }

  private getModelCapabilities(key: string): string[] {
    const capabilities: Record<string, string[]> = {
      small: ['chat', 'completion'],
      medium: ['chat', 'completion', 'analysis'],
      large: ['chat', 'completion', 'analysis', 'reasoning'],
      coding: ['chat', 'completion', 'code', 'debugging']
    };
    return capabilities[key] || ['chat'];
  }

  // Mock methods for development without API key
  private getMockResponse(options: CompletionOptions): CompletionResponse {
    const query = options.messages[options.messages.length - 1].content.toLowerCase();
    
    let content = 'This is a mock response. To use real AI responses, please configure your Synthetic API key.\n\n';
    
    if (query.includes('ground station')) {
      content += 'Ground stations are facilities equipped with antennas and communication equipment for transmitting and receiving data from satellites and spacecraft. They serve as critical infrastructure for space operations, providing command, control, and data relay capabilities.';
    } else if (query.includes('help')) {
      content += 'I can help you with:\n- Ground station analysis\n- Network performance metrics\n- Coverage optimization\n- Predictive maintenance\n- Real-time monitoring';
    } else {
      content += `I understand you're asking about: "${options.messages[options.messages.length - 1].content}"\n\nIn a production environment with a valid API key, I would provide detailed analysis and insights based on your query.`;
    }
    
    return {
      id: `mock-${Date.now()}`,
      model: options.model,
      content,
      finishReason: 'stop',
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150
      },
      metadata: {
        mock: true,
        latency: 100
      }
    };
  }

  private async *getMockStream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const response = this.getMockResponse(options);
    const words = response.content.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      yield {
        id: response.id,
        delta: words[i] + (i < words.length - 1 ? ' ' : ''),
        finishReason: i === words.length - 1 ? 'stop' : undefined
      };
      
      // Simulate streaming delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}