/**
 * Tests for Synthetic LLM Provider
 * Using TDD approach to ensure reliability
 */

import { SyntheticProvider } from '../providers/synthetic/SyntheticProvider';
import { AuthenticationError, RateLimitError } from '../interfaces/LLMProvider';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock TextEncoder/TextDecoder for Node environment
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn().mockImplementation((str) => new Uint8Array(Buffer.from(str)))
}));

global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn().mockImplementation((buffer) => Buffer.from(buffer).toString())
}));

// Mock ReadableStream for Node environment
global.ReadableStream = jest.fn().mockImplementation(function(underlyingSource) {
  this.getReader = jest.fn().mockReturnValue({
    read: jest.fn().mockImplementation(async () => {
      if (underlyingSource.start) {
        const chunks = [];
        const controller = {
          enqueue: (chunk) => chunks.push(chunk),
          close: () => {}
        };
        underlyingSource.start(controller);
        
        if (chunks.length > 0) {
          const chunk = chunks.shift();
          return { done: false, value: chunk };
        }
      }
      return { done: true };
    }),
    releaseLock: jest.fn()
  });
}) as any;

describe('SyntheticProvider', () => {
  let provider: SyntheticProvider;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  
  // Store original env vars
  const originalApiKey = process.env.SYNTHETIC_API_KEY;
  const originalApiUrl = process.env.NEXT_PUBLIC_SYNTHETIC_API_URL;

  beforeEach(() => {
    // Mock environment variables
    process.env.SYNTHETIC_API_KEY = 'test-api-key';
    process.env.NEXT_PUBLIC_SYNTHETIC_API_URL = 'https://api.synthetic.ai/v1';
    
    provider = new SyntheticProvider();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });
  
  afterEach(() => {
    // Restore original env vars
    process.env.SYNTHETIC_API_KEY = originalApiKey;
    process.env.NEXT_PUBLIC_SYNTHETIC_API_URL = originalApiUrl;
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid API key', async () => {
      // Mock successful health check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hi' } }] })
      } as Response);

      await expect(provider.initialize()).resolves.not.toThrow();
    });

    it('should throw AuthenticationError without API key', async () => {
      // Clear the API key before creating the provider
      delete process.env.SYNTHETIC_API_KEY;
      const noKeyProvider = new SyntheticProvider();
      
      await expect(noKeyProvider.initialize()).rejects.toThrow(AuthenticationError);
    });

    it('should throw error if health check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Server error' } })
      } as Response);

      await expect(provider.initialize()).rejects.toThrow('Failed to initialize');
    });
  });

  describe('complete', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hi' } }] })
      } as Response);
      await provider.initialize();
    });

    it('should complete a simple query successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        model: 'mistral-7b-instruct',
        choices: [{
          message: { content: 'Test response' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await provider.complete({
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(result.content).toBe('Test response');
      expect(result.finishReason).toBe('stop');
      expect(result.usage?.totalTokens).toBe(15);
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as Response);

      await expect(provider.complete({
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow(AuthenticationError);
    });

    it('should handle rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '60' }),
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      } as Response);

      await expect(provider.complete({
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      })).rejects.toThrow(RateLimitError);
    });
  });

  describe('completeStream', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hi' } }] })
      } as Response);
      await provider.initialize();
    });

    it('should stream responses successfully', async () => {
      const mockStreamData = [
        'data: {"id":"1","choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"id":"1","choices":[{"delta":{"content":" world"}}]}\n',
        'data: {"id":"1","choices":[{"delta":{},"finish_reason":"stop"}]}\n',
        'data: [DONE]\n'
      ];

      let dataIndex = 0;
      const mockReader = {
        read: jest.fn().mockImplementation(async () => {
          if (dataIndex < mockStreamData.length) {
            const chunk = mockStreamData[dataIndex++];
            return { 
              done: false, 
              value: new Uint8Array(Buffer.from(chunk))
            };
          }
          return { done: true };
        }),
        releaseLock: jest.fn()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      } as any);

      const chunks: string[] = [];
      const generator = provider.completeStream({
        model: 'mistral-7b-instruct',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      for await (const chunk of generator) {
        if (chunk.delta) {
          chunks.push(chunk.delta);
        }
      }

      expect(chunks.join('')).toBe('Hello world');
    });
  });

  describe('model management', () => {
    it('should list available models', async () => {
      const models = await provider.listModels();
      
      expect(models).toHaveLength(4);
      expect(models[0].id).toBe('mistral-7b-instruct');
      expect(models[0].capabilities).toContain('chat');
    });

    it('should get model info by ID', async () => {
      const model = await provider.getModel('dolphin-mixtral-8x7b');
      
      expect(model).not.toBeNull();
      expect(model?.name).toBe('Dolphin Mixtral 8x7B');
      expect(model?.contextLength).toBe(32768);
    });

    it('should return null for unknown model', async () => {
      const model = await provider.getModel('unknown-model');
      expect(model).toBeNull();
    });
  });

  describe('health check', () => {
    it('should return true when API is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Hi' } }] })
      } as Response);

      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when API is down', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await provider.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });
});