import { CopilotKitServiceAdapter } from '@copilotkit/backend';

interface VultrAdapterParams {
  apiKey?: string;
  model?: string;
}

interface CopilotKitResponse {
  stream: ReadableStream;
  headers?: Record<string, string>;
}

/**
 * Custom adapter for Vultr's OpenAI-compatible API
 * Handles streaming responses without relying on OpenAI SDK's beta features
 */
export class VultrAdapter implements CopilotKitServiceAdapter {
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.vultrinference.com/v1';

  constructor(params?: VultrAdapterParams) {
    this.apiKey = params?.apiKey || process.env.VULTR_API_KEY || 'NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA';
    this.model = params?.model || 'mistral-nemo-instruct-2407';
  }

  async getResponse(forwardedProps: any): Promise<CopilotKitResponse> {
    // Log the raw request for debugging
    console.log('=== VULTR ADAPTER DEBUG ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Raw CopilotKit forwarded props:');
    console.log('Keys received:', Object.keys(forwardedProps));
    console.log('Full payload:', JSON.stringify(forwardedProps, null, 2));
    
    // Validate that we have messages
    if (!forwardedProps.messages || !Array.isArray(forwardedProps.messages) || forwardedProps.messages.length === 0) {
      console.error('No messages provided to VultrAdapter');
      // Return a default response if no messages
      const defaultMessage = {
        id: 'error-' + Date.now(),
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: this.model,
        choices: [{
          delta: { content: 'Please provide a message to continue.' },
          index: 0,
          finish_reason: 'stop'
        }]
      };
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(defaultMessage)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      
      return {
        stream,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      };
    }
    
    // Clean up the forwarded props - remove any fields that might cause issues
    const cleanProps = { ...forwardedProps };
    
    // List all fields we're removing
    const removedFields: string[] = [];
    
    // Remove empty or problematic fields
    if (cleanProps.tools !== undefined) {
      removedFields.push(`tools (length: ${cleanProps.tools?.length || 0})`);
      delete cleanProps.tools;
    }
    if (cleanProps.tool_choice !== undefined) {
      removedFields.push('tool_choice');
      delete cleanProps.tool_choice;
    }
    if (cleanProps.functions !== undefined) {
      removedFields.push('functions');
      delete cleanProps.functions;
    }
    if (cleanProps.function_call !== undefined) {
      removedFields.push('function_call');
      delete cleanProps.function_call;
    }
    if (cleanProps.response_format !== undefined) {
      removedFields.push('response_format');
      delete cleanProps.response_format;
    }
    if (cleanProps.user !== undefined) {
      removedFields.push('user');
      delete cleanProps.user;
    }
    if (cleanProps.n !== undefined && cleanProps.n === 1) {
      removedFields.push('n (default)');
      delete cleanProps.n;
    }
    if (cleanProps.presence_penalty !== undefined) {
      removedFields.push('presence_penalty');
      delete cleanProps.presence_penalty;
    }
    if (cleanProps.frequency_penalty !== undefined) {
      removedFields.push('frequency_penalty');
      delete cleanProps.frequency_penalty;
    }
    if (cleanProps.logit_bias !== undefined) {
      removedFields.push('logit_bias');
      delete cleanProps.logit_bias;
    }
    if (cleanProps.stop !== undefined) {
      removedFields.push('stop');
      delete cleanProps.stop;
    }
    
    console.log('Removed fields:', removedFields.length > 0 ? removedFields : 'None');
    console.log('Cleaned props keys:', Object.keys(cleanProps));

    // Ensure we have at least one message (add system message if needed)
    let messages = cleanProps.messages || [];
    if (messages.length === 0) {
      messages = [{
        role: 'system',
        content: 'You are a helpful assistant for the GeoCoreMap platform.'
      }];
    }
    
    // Prepare the request body - only include fields that Vultr accepts
    const requestBody: any = {
      model: this.model,
      messages: messages,
      stream: true,
    };

    // Only add optional fields if they exist and are valid
    if (cleanProps.temperature !== undefined) {
      requestBody.temperature = cleanProps.temperature;
    }
    if (cleanProps.max_tokens !== undefined) {
      requestBody.max_tokens = cleanProps.max_tokens;
    }
    if (cleanProps.top_p !== undefined) {
      requestBody.top_p = cleanProps.top_p;
    }
    
    // Don't include tools for now as Vultr might not support them
    // if (forwardedProps.tools && forwardedProps.tools.length > 0) {
    //   requestBody.tools = forwardedProps.tools;
    // }

    console.log('Final request to Vultr:');
    console.log('  Model:', requestBody.model);
    console.log('  Messages:', requestBody.messages?.length || 0, 'messages');
    console.log('  Stream:', requestBody.stream);
    console.log('  Other fields:', Object.keys(requestBody).filter(k => !['model', 'messages', 'stream'].includes(k)));
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));

    // Make the streaming request to Vultr
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      let errorBody = '';
      try {
        errorBody = await response.text();
        errorDetails = `: ${errorBody}`;
      } catch (e) {
        // Ignore if we can't read the error body
      }
      
      console.error('=== VULTR API ERROR ===');
      console.error('Status:', response.status, response.statusText);
      console.error('Error body:', errorBody);
      console.error('Request that failed:', JSON.stringify(requestBody, null, 2));
      console.error('=======================');
      
      throw new Error(`Vultr API error: ${response.status} ${response.statusText}${errorDetails}`);
    }

    // Convert the response body to a ReadableStream that CopilotKit expects
    const stream = this.createStreamFromSSE(response.body!);

    return {
      stream,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    };
  }

  /**
   * Converts Server-Sent Events (SSE) stream from Vultr to CopilotKit format
   */
  private createStreamFromSSE(body: ReadableStream<Uint8Array>): ReadableStream {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Send the [DONE] message that CopilotKit expects
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }

            // Decode and accumulate the chunk
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                // Skip [DONE] messages from Vultr
                if (data === '[DONE]') {
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }

                // Parse and reformat the chunk
                try {
                  const chunk = JSON.parse(data);
                  
                  // The chunk is already in the correct format from Vultr
                  // Just pass it through
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
                  );
                } catch (error) {
                  // Skip unparseable chunks (usually partial data)
                  // This is normal and expected during streaming
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
    });
  }

  /**
   * Formats Vultr chunks to match OpenAI's expected format
   */
  private formatChunk(chunk: any): any {
    // Vultr's response should already be in OpenAI format
    // But we ensure the structure is correct
    if (!chunk.choices) {
      return {
        choices: [{
          delta: {
            content: chunk.content || '',
            role: chunk.role || 'assistant',
          },
          index: 0,
          finish_reason: chunk.finish_reason || null,
        }],
        id: chunk.id || 'chatcmpl-' + Date.now(),
        object: 'chat.completion.chunk',
        created: chunk.created || Math.floor(Date.now() / 1000),
        model: chunk.model || this.model,
      };
    }
    
    // If already in correct format, return as-is
    return chunk;
  }
}