/**
 * API Route for LLM Chat
 * Handles chat requests and streaming responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm/LLMService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context, options } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if streaming is requested
    if (options?.stream) {
      // Create a TransformStream for streaming response
      const encoder = new TextEncoder();
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();

      // Start streaming in background
      (async () => {
        try {
          for await (const chunk of llmService.queryStream({ query, context, options })) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      // Return streaming response
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await llmService.query({ query, context, options });
      
      return NextResponse.json({
        success: true,
        response: {
          id: response.id,
          content: response.content,
          model: response.model,
          usage: response.usage,
          metadata: response.metadata
        }
      });
    }
  } catch (error: any) {
    console.error('[API] LLM chat error:', error);
    
    // Handle specific error types
    if (error.code === 'AUTHENTICATION') {
      return NextResponse.json(
        { error: 'Authentication failed', code: error.code },
        { status: 401 }
      );
    } else if (error.code === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: error.code, retryAfter: error.retryAfter },
        { status: 429 }
      );
    } else if (error.code === 'MODEL_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Model not found', code: error.code },
        { status: 404 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const health = await llmService.healthCheck();
    const models = await llmService.getAvailableModels();
    
    return NextResponse.json({
      status: 'ok',
      providers: health,
      models: models.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider
      }))
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}