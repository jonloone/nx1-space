/**
 * GEE Connection Test API Endpoint
 * 
 * GET /api/gee/test - Test GEE connection and authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { geeRESTService } from '../../../../lib/services/googleEarthEngineRESTService'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing GEE connection...')
    
    const result = await geeRESTService.testConnection()
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
      credentials: {
        projectId: process.env.GEE_PROJECT_ID ? '✅ Set' : '❌ Missing',
        clientEmail: process.env.GEE_SERVICE_ACCOUNT_EMAIL ? '✅ Set' : '❌ Missing',
        privateKeyId: process.env.GEE_PRIVATE_KEY_ID ? '✅ Set' : '❌ Missing',
        privateKey: process.env.GEE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'
      }
    })

  } catch (error) {
    console.error('GEE API Test Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}