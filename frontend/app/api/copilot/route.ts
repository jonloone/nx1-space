import { NextRequest } from 'next/server';
import { CopilotRuntime } from '@copilotkit/backend';
import { VultrAdapter } from '@/lib/adapters/vultr-adapter';

export async function POST(req: NextRequest) {
  try {
    const copilotKit = new CopilotRuntime();
    
    // Use our custom VultrAdapter
    const adapter = new VultrAdapter({
      apiKey: process.env.VULTR_API_KEY || 'NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA',
      model: 'mistral-nemo-instruct-2407',
    });
    
    return copilotKit.response(req, adapter);
  } catch (error) {
    console.error('Copilot API Error:', error);
    // Return a fallback response if there's an error
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}