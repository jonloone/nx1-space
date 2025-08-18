/**
 * LLM Configuration
 * Central configuration for all LLM providers and models
 */

export const LLM_CONFIG = {
  synthetic: {
    apiKey: process.env.SYNTHETIC_API_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_SYNTHETIC_API_URL || 'https://api.synthetic.ai/v1',
    models: {
      // Model selection based on query complexity
      small: 'mistral-7b-instruct',      // Fast responses, simple queries
      medium: 'dolphin-mixtral-8x7b',    // Balanced performance
      large: 'llama-3-70b-instruct',    // Complex analysis
      coding: 'airoboros-70b'            // Code generation
    },
    // Default settings
    defaultModel: 'dolphin-mixtral-8x7b',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    stream: true,
    // Timeout settings (ms)
    timeout: {
      small: 10000,    // 10 seconds
      medium: 30000,   // 30 seconds
      large: 60000,    // 60 seconds
      stream: 120000   // 2 minutes for streaming
    }
  },
  
  // Query classification thresholds
  queryClassification: {
    simple: {
      maxLength: 50,
      keywords: ['what', 'where', 'when', 'status', 'count', 'list']
    },
    moderate: {
      maxLength: 150,
      keywords: ['explain', 'analyze', 'compare', 'summarize', 'describe']
    },
    complex: {
      keywords: ['predict', 'forecast', 'optimize', 'recommend', 'design', 'plan']
    }
  },
  
  // Rate limiting
  rateLimits: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    concurrentRequests: 5
  },
  
  // Caching
  cache: {
    enabled: true,
    ttl: 3600000, // 1 hour in ms
    maxSize: 100  // Max cached responses
  }
};

// Validate configuration at startup
export function validateLLMConfig() {
  if (!process.env.SYNTHETIC_API_KEY) {
    console.warn('[LLM] WARNING: SYNTHETIC_API_KEY not set, LLM features will be disabled');
    return false;
  }
  return true;
}