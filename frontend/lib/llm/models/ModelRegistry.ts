/**
 * Model Registry
 * Central registry for all LLM models and their selection logic
 */

import { LLM_CONFIG } from '../config';

export interface ModelCapability {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  responseTime: 'fast' | 'medium' | 'slow';
  strengths: string[];
  costPerKToken: {
    input: number;
    output: number;
  };
}

export interface QueryClassification {
  type: 'simple' | 'moderate' | 'complex' | 'code';
  confidence: number;
  suggestedModel: string;
  reasoning: string;
}

export class ModelRegistry {
  private static instance: ModelRegistry;
  private models: Map<string, ModelCapability> = new Map();

  private constructor() {
    this.registerModels();
  }

  static getInstance(): ModelRegistry {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }

  private registerModels() {
    // Register Synthetic models
    const syntheticModels: ModelCapability[] = [
      {
        id: LLM_CONFIG.synthetic.models.small,
        name: 'Mistral 7B Instruct',
        provider: 'synthetic',
        contextLength: 8192,
        responseTime: 'fast',
        strengths: ['simple queries', 'status checks', 'basic questions'],
        costPerKToken: { input: 0.0002, output: 0.0002 }
      },
      {
        id: LLM_CONFIG.synthetic.models.medium,
        name: 'Dolphin Mixtral 8x7B',
        provider: 'synthetic',
        contextLength: 32768,
        responseTime: 'medium',
        strengths: ['analysis', 'summarization', 'multi-step reasoning'],
        costPerKToken: { input: 0.0005, output: 0.0005 }
      },
      {
        id: LLM_CONFIG.synthetic.models.large,
        name: 'Llama 3 70B Instruct',
        provider: 'synthetic',
        contextLength: 8192,
        responseTime: 'slow',
        strengths: ['complex analysis', 'prediction', 'detailed explanations'],
        costPerKToken: { input: 0.001, output: 0.001 }
      },
      {
        id: LLM_CONFIG.synthetic.models.coding,
        name: 'Airoboros 70B',
        provider: 'synthetic',
        contextLength: 8192,
        responseTime: 'slow',
        strengths: ['code generation', 'technical documentation', 'API design'],
        costPerKToken: { input: 0.001, output: 0.001 }
      }
    ];

    syntheticModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  /**
   * Classify a query and suggest the best model
   */
  classifyQuery(query: string, context?: any): QueryClassification {
    const queryLower = query.toLowerCase();
    const queryLength = query.length;

    // Check for code-related queries
    if (this.isCodeQuery(queryLower)) {
      return {
        type: 'code',
        confidence: 0.9,
        suggestedModel: LLM_CONFIG.synthetic.models.coding,
        reasoning: 'Query involves code generation or technical implementation'
      };
    }

    // Check for simple queries
    if (this.isSimpleQuery(queryLower, queryLength)) {
      return {
        type: 'simple',
        confidence: 0.85,
        suggestedModel: LLM_CONFIG.synthetic.models.small,
        reasoning: 'Simple status or location query'
      };
    }

    // Check for complex queries
    if (this.isComplexQuery(queryLower)) {
      return {
        type: 'complex',
        confidence: 0.8,
        suggestedModel: LLM_CONFIG.synthetic.models.large,
        reasoning: 'Query requires complex analysis or prediction'
      };
    }

    // Default to moderate
    return {
      type: 'moderate',
      confidence: 0.7,
      suggestedModel: LLM_CONFIG.synthetic.models.medium,
      reasoning: 'Standard analysis or explanation query'
    };
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelCapability | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models for a provider
   */
  getModelsByProvider(provider: string): ModelCapability[] {
    return Array.from(this.models.values()).filter(m => m.provider === provider);
  }

  /**
   * Select best model based on requirements
   */
  selectModel(requirements: {
    maxResponseTime?: 'fast' | 'medium' | 'slow';
    minContextLength?: number;
    maxCost?: number;
    capabilities?: string[];
  }): string {
    let candidates = Array.from(this.models.values());

    // Filter by response time
    if (requirements.maxResponseTime) {
      const timeOrder = { fast: 1, medium: 2, slow: 3 };
      const maxTime = timeOrder[requirements.maxResponseTime];
      candidates = candidates.filter(m => timeOrder[m.responseTime] <= maxTime);
    }

    // Filter by context length
    if (requirements.minContextLength) {
      candidates = candidates.filter(m => m.contextLength >= requirements.minContextLength);
    }

    // Filter by cost
    if (requirements.maxCost) {
      candidates = candidates.filter(m => 
        m.costPerKToken.output <= requirements.maxCost
      );
    }

    // Filter by capabilities
    if (requirements.capabilities && requirements.capabilities.length > 0) {
      candidates = candidates.filter(m => 
        requirements.capabilities!.some(cap => 
          m.strengths.some(strength => strength.includes(cap))
        )
      );
    }

    // Return the most capable model from candidates
    if (candidates.length === 0) {
      return LLM_CONFIG.synthetic.defaultModel;
    }

    // Sort by context length (descending) and return the best
    candidates.sort((a, b) => b.contextLength - a.contextLength);
    return candidates[0].id;
  }

  /**
   * Estimate token usage for a query
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for a completion
   */
  calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = this.models.get(modelId);
    if (!model) return 0;

    const inputCost = (inputTokens / 1000) * model.costPerKToken.input;
    const outputCost = (outputTokens / 1000) * model.costPerKToken.output;
    
    return inputCost + outputCost;
  }

  // Helper methods
  private isCodeQuery(query: string): boolean {
    const codeKeywords = [
      'code', 'implement', 'function', 'api', 'endpoint', 'class',
      'method', 'algorithm', 'debug', 'error', 'bug', 'syntax'
    ];
    return codeKeywords.some(keyword => query.includes(keyword));
  }

  private isSimpleQuery(query: string, length: number): boolean {
    if (length > LLM_CONFIG.queryClassification.simple.maxLength) {
      return false;
    }
    
    const simpleKeywords = LLM_CONFIG.queryClassification.simple.keywords;
    return simpleKeywords.some(keyword => query.includes(keyword));
  }

  private isComplexQuery(query: string): boolean {
    const complexKeywords = LLM_CONFIG.queryClassification.complex.keywords;
    return complexKeywords.some(keyword => query.includes(keyword));
  }
}