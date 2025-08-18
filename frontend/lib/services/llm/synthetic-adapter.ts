/**
 * Synthetic AI Adapter for Assistant-UI
 * Configures OpenAI-compatible client for Synthetic's API
 */

import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI-compatible client for Synthetic
export const syntheticClient = new OpenAI({
  apiKey: process.env.SYNTHETIC_API_KEY || 'syn_b54d0d084c4101d2af736aa190540851',
  baseURL: 'https://api.synthetic.new/v1',
  defaultHeaders: {
    'User-Agent': 'GeoCoreMap/1.0'
  }
});

// Create AI SDK provider for Synthetic
export const synthetic = createOpenAI({
  apiKey: process.env.SYNTHETIC_API_KEY || 'syn_b54d0d084c4101d2af736aa190540851',
  baseURL: 'https://api.synthetic.new/v1',
  compatibility: 'compatible' // For OpenAI compatibility mode
});

// Model configuration with Synthetic's HuggingFace models
export const SYNTHETIC_MODELS = {
  small: 'hf:mistralai/Mistral-7B-Instruct-v0.3',
  medium: 'hf:NousResearch/Hermes-3-Llama-3.1-8B',
  large: 'hf:Qwen/Qwen2.5-72B-Instruct',
  coding: 'hf:Qwen/Qwen2.5-Coder-32B-Instruct'
} as const;

// Default model for chat
export const DEFAULT_MODEL = SYNTHETIC_MODELS.small;

// Assistant configuration
export const ASSISTANT_CONFIG = {
  model: DEFAULT_MODEL,
  temperature: 0.7,
  maxTokens: 2048,
  streaming: true,
  // System prompt template
  systemPromptTemplate: (context: any) => {
    const basePrompt = `You are an intelligent assistant for the GeoCoreMap platform, specializing in geospatial data analysis and ground station operations.
You have access to real-time data about ground stations, maritime vessels, and other geospatial entities.
Provide accurate, concise, and actionable information. When referencing locations, be specific with coordinates when available.
Keep responses focused and under 3-4 sentences unless the user asks for more detail.`;

    if (context?.type === 'station' && context?.station) {
      return `${basePrompt}

Current context: Ground Station "${context.station.name}"
- Health Score: ${(context.station.score * 100).toFixed(1)}%
- Utilization: ${(context.station.utilization * 100).toFixed(1)}%
- Status: ${context.station.status || 'Operational'}
- Location: [${context.station.latitude?.toFixed(4)}, ${context.station.longitude?.toFixed(4)}]

Focus on analyzing this specific station's performance and providing actionable insights.`;
    }

    if (context?.type === 'opportunity' && context?.hexagon) {
      return `${basePrompt}

Current context: Opportunity Analysis for Hexagon
- ID: ${context.hexagon.id}
- Population: ${context.hexagon.population?.toLocaleString() || 'Unknown'}
- Coverage Score: ${(context.hexagon.coverageScore * 100).toFixed(1)}%
- Opportunity Score: ${(context.hexagon.opportunityScore * 100).toFixed(1)}%

Focus on evaluating deployment opportunities and ROI potential.`;
    }

    if (context?.type === 'maritime' && context?.vessel) {
      return `${basePrompt}

Current context: Maritime Vessel "${context.vessel.name}"
- Type: ${context.vessel.type}
- Speed: ${context.vessel.speed?.toFixed(1)} knots
- Course: ${context.vessel.course}°
- Location: [${context.vessel.latitude?.toFixed(4)}, ${context.vessel.longitude?.toFixed(4)}]

Focus on maritime coverage and connectivity analysis.`;
    }

    return basePrompt;
  }
};

// Create adapter for Assistant-UI runtime
export function createSyntheticAdapter() {
  return {
    async *streamText({ messages, model = DEFAULT_MODEL, ...options }: any) {
      try {
        const stream = await syntheticClient.chat.completions.create({
          model,
          messages,
          stream: true,
          temperature: options.temperature ?? ASSISTANT_CONFIG.temperature,
          max_tokens: options.maxTokens ?? ASSISTANT_CONFIG.maxTokens,
          ...options
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            yield { text: delta };
          }
        }
      } catch (error) {
        console.error('[Synthetic Adapter] Stream error:', error);
        throw error;
      }
    },

    async generateText({ messages, model = DEFAULT_MODEL, ...options }: any) {
      try {
        const completion = await syntheticClient.chat.completions.create({
          model,
          messages,
          stream: false,
          temperature: options.temperature ?? ASSISTANT_CONFIG.temperature,
          max_tokens: options.maxTokens ?? ASSISTANT_CONFIG.maxTokens,
          ...options
        });

        return {
          text: completion.choices[0]?.message?.content || '',
          usage: completion.usage
        };
      } catch (error) {
        console.error('[Synthetic Adapter] Generation error:', error);
        throw error;
      }
    }
  };
}