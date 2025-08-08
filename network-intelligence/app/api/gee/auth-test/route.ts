/**
 * Simple auth test endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const credentials = {
      type: 'service_account',
      project_id: process.env.GEE_PROJECT_ID || '',
      private_key_id: process.env.GEE_PRIVATE_KEY_ID || '',
      private_key: process.env.GEE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
      client_email: process.env.GEE_SERVICE_ACCOUNT_EMAIL || '',
      client_id: process.env.GEE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/earthengine']
    })

    const authClient = await auth.getClient()
    const tokenResponse = await authClient.getAccessToken()
    
    return NextResponse.json({
      success: true,
      hasToken: !!tokenResponse.token,
      tokenLength: tokenResponse.token?.length || 0,
      projectId: process.env.GEE_PROJECT_ID,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}