/**
 * API Route for Assistant-UI Chat
 * Handles streaming chat completions with Synthetic AI
 */

import { NextRequest } from 'next/server';
import { syntheticClient, DEFAULT_MODEL, ASSISTANT_CONFIG } from '@/lib/services/llm/synthetic-adapter';

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

    console.log('[Assistant API] Processing request', {
      threadId,
      messageCount: messages.length,
      contextType: context?.type,
      model: DEFAULT_MODEL
    });

    try {
      // Use the OpenAI client for streaming
      const stream = await syntheticClient.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: allMessages,
        temperature: ASSISTANT_CONFIG.temperature,
        max_tokens: ASSISTANT_CONFIG.maxTokens,
        stream: true
      });

      // Create a streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content;
              if (delta) {
                const data = JSON.stringify(chunk);
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            console.error('[Assistant API] Stream error:', error);
            controller.error(error);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } catch (error: any) {
      // If Synthetic API fails, use mock response
      if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
        console.log('[Assistant API] Using mock response');
        
        const mockResponse = getMockResponse(messages[messages.length - 1].content);
        const encoder = new TextEncoder();
        
        const readable = new ReadableStream({
          async start(controller) {
            const words = mockResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = {
                id: 'mock-' + Date.now(),
                choices: [{
                  delta: { content: words[i] + (i < words.length - 1 ? ' ' : '') },
                  index: 0
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
    console.error('[Assistant API] Error:', error);

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
      provider: 'synthetic',
      model: DEFAULT_MODEL,
      streaming: true,
      tools: ['zoomToLocation', 'highlightStations', 'applyFilter']
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}