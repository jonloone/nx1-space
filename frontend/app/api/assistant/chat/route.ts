/**
 * API Route for Assistant-UI Chat
 * Handles streaming chat completions with Vultr API
 */

import { NextRequest } from 'next/server';

// Vultr configuration
const VULTR_API_KEY = process.env.VULTR_API_KEY || 'NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA';
const VULTR_MODEL = 'mistral-nemo-instruct-2407';
const VULTR_BASE_URL = 'https://api.vultrinference.com/v1';

// Assistant configuration
const ASSISTANT_CONFIG = {
  temperature: 0.7,
  maxTokens: 2048,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, threadId } = body;

    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 });
    }

    // Build system message based on context
    const systemMessage = context 
      ? { role: 'system', content: ASSISTANT_CONFIG.systemPromptTemplate(context) }
      : { role: 'system', content: 'You are a helpful assistant for the GeoCoreMap platform.' };

    // Combine system message with user messages
    const allMessages = [systemMessage, ...messages];

    console.log('[Vultr Assistant API] Processing request', {
      threadId,
      messageCount: messages.length,
      contextType: context?.type,
      model: VULTR_MODEL
    });

    try {
      // Make streaming request to Vultr
      const response = await fetch(`${VULTR_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VULTR_API_KEY}`,
        },
        body: JSON.stringify({
          model: VULTR_MODEL,
          messages: allMessages,
          temperature: ASSISTANT_CONFIG.temperature,
          max_tokens: ASSISTANT_CONFIG.maxTokens,
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Vultr Assistant API] Error:', response.status, errorText);
        throw new Error(`Vultr API error: ${response.status} ${response.statusText}`);
      }

      // Pass through the SSE stream from Vultr
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
      
    } catch (error: any) {
      // If Vultr API fails, use mock response
      if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
        console.log('[Vultr Assistant API] Using mock response');
        
        const mockResponse = getMockResponse(messages[messages.length - 1].content);
        const encoder = new TextEncoder();
        
        const readable = new ReadableStream({
          async start(controller) {
            const words = mockResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = {
                id: 'mock-' + Date.now(),
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: VULTR_MODEL,
                choices: [{
                  delta: { content: words[i] + (i < words.length - 1 ? ' ' : '') },
                  index: 0,
                  finish_reason: null
                }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Mock-Mode': 'true'
          }
        });
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error('[Vultr Assistant API] Error:', error);

    // Handle specific error types
    if (error.message?.includes('API key')) {
      return new Response('API key not configured. Using mock responses.', { 
        status: 503,
        headers: { 'X-Mock-Mode': 'true' }
      });
    }

    if (error.message?.includes('rate limit')) {
      return new Response('Rate limit exceeded. Please try again later.', { 
        status: 429,
        headers: { 'Retry-After': '60' }
      });
    }

    // Generic error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Helper function for mock responses
function getMockResponse(query: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('utilization') && q.includes('low')) {
    return "The low utilization could be due to several factors: reduced satellite traffic in the region, maintenance windows, or capacity oversizing for future growth. I recommend analyzing traffic patterns over the past 30 days and checking for any scheduled maintenance events.";
  }
  
  if (q.includes('improve') && q.includes('score')) {
    return "To improve the health score: 1) Upgrade antenna firmware to reduce latency, 2) Implement redundant power systems for better reliability, 3) Optimize signal processing algorithms to improve SNR by 2-3 dB.";
  }
  
  if (q.includes('compare')) {
    return "Compared to nearby stations, this station shows average performance. While utilization is lower, signal quality metrics are superior due to newer equipment. Consider load balancing to improve overall network efficiency.";
  }
  
  return "Based on the current metrics, the station is operating within normal parameters. The signal quality is good with stable performance. Continue monitoring for any anomalies.";
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      provider: 'vultr',
      model: VULTR_MODEL,
      streaming: true,
      apiKey: VULTR_API_KEY ? 'configured' : 'missing'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}