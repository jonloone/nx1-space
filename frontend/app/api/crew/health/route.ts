import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check CrewAI backend health
    const apiResponse = await fetch('http://localhost:8000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`CrewAI API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    
    return NextResponse.json({
      ...data,
      proxy_status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        proxy_status: 'error',
        error: 'Failed to connect to CrewAI backend',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}