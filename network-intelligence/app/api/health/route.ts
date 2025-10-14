import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker/Kubernetes
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'network-intelligence',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
