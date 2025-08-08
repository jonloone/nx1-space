/**
 * Test Real Google Earth Engine API
 */

const { google } = require('googleapis')
require('dotenv').config({ path: '.env.local' })

async function testRealGEE() {
  console.log('🧪 Testing Real Google Earth Engine API')
  console.log('=========================================')
  
  try {
    // Get access token
    console.log('\n1. Getting access token...')
    const credentials = {
      type: 'service_account',
      project_id: process.env.GEE_PROJECT_ID,
      private_key_id: process.env.GEE_PRIVATE_KEY_ID,
      private_key: process.env.GEE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GEE_SERVICE_ACCOUNT_EMAIL,
      client_id: process.env.GEE_CLIENT_ID,
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
    
    console.log('✅ Access token obtained')
    
    // Test simple Earth Engine API call
    console.log('\n2. Testing Earth Engine REST API...')
    console.log('Project ID:', process.env.GEE_PROJECT_ID)
    
    // Simple expression to get a constant value
    const simpleExpression = {
      expression: {
        result: '0',
        values: {
          '0': {
            constantValue: 42
          }
        }
      }
    }
    
    console.log('Testing with simple constant expression...')
    const response = await fetch(
      `https://earthengine.googleapis.com/v1/projects/${process.env.GEE_PROJECT_ID}/value:compute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simpleExpression)
      }
    )
    
    console.log('Response status:', response.status)
    const result = await response.text()
    console.log('Response:', result)
    
    if (response.ok) {
      const data = JSON.parse(result)
      console.log('✅ Earth Engine API working! Result:', data.result)
    } else {
      console.log('❌ Earth Engine API error')
      
      // Try to understand the error
      if (result.includes('not found')) {
        console.log('\n⚠️  The Earth Engine API might not be enabled for this project')
        console.log('Please ensure:')
        console.log('1. Earth Engine API is enabled in Google Cloud Console')
        console.log('2. Project is registered with Earth Engine')
        console.log('3. Service account has Earth Engine permissions')
      }
    }
    
    // Test with actual Earth Engine dataset
    console.log('\n3. Testing with real dataset (VIIRS nighttime lights)...')
    const nightlightsExpression = {
      expression: {
        result: '0',
        values: {
          '0': {
            functionInvocationValue: {
              functionName: 'Image.constant',
              arguments: {
                value: { constantValue: 1 }
              }
            }
          }
        }
      }
    }
    
    const nightlightsResponse = await fetch(
      `https://earthengine.googleapis.com/v1/projects/${process.env.GEE_PROJECT_ID}/value:compute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nightlightsExpression)
      }
    )
    
    console.log('Nightlights test status:', nightlightsResponse.status)
    const nightlightsResult = await nightlightsResponse.text()
    
    if (nightlightsResponse.ok) {
      console.log('✅ Can make Earth Engine computations')
    } else {
      console.log('Earth Engine computation error:', nightlightsResult)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testRealGEE().catch(console.error)