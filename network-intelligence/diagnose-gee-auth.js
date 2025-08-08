/**
 * Google Earth Engine Authentication Diagnostic Tool
 */

const { google } = require('googleapis')
require('dotenv').config({ path: '.env.local' })

async function diagnoseGEEAuth() {
  console.log('🔍 Google Earth Engine Authentication Diagnosis')
  console.log('===============================================')
  
  // Check environment variables
  console.log('\n1. Environment Variables:')
  console.log(`   Project ID: ${process.env.GEE_PROJECT_ID ? '✅' : '❌'} ${process.env.GEE_PROJECT_ID || 'MISSING'}`)
  console.log(`   Client Email: ${process.env.GEE_SERVICE_ACCOUNT_EMAIL ? '✅' : '❌'} ${process.env.GEE_SERVICE_ACCOUNT_EMAIL || 'MISSING'}`)
  console.log(`   Private Key ID: ${process.env.GEE_PRIVATE_KEY_ID ? '✅' : '❌'} ${process.env.GEE_PRIVATE_KEY_ID || 'MISSING'}`)
  console.log(`   Private Key: ${process.env.GEE_PRIVATE_KEY ? '✅' : '❌'} (Length: ${process.env.GEE_PRIVATE_KEY?.length || 0})`)
  
  if (!process.env.GEE_PRIVATE_KEY) {
    console.log('\n❌ CRITICAL: No private key found in environment')
    return
  }
  
  // Test private key format
  console.log('\n2. Private Key Analysis:')
  const privateKey = process.env.GEE_PRIVATE_KEY.replace(/\\n/g, '\n')
  console.log(`   Formatted length: ${privateKey.length}`)
  console.log(`   Starts with: ${privateKey.substring(0, 30)}...`)
  console.log(`   Ends with: ...${privateKey.substring(privateKey.length - 30)}`)
  console.log(`   Contains BEGIN: ${privateKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅' : '❌'}`)
  console.log(`   Contains END: ${privateKey.includes('-----END PRIVATE KEY-----') ? '✅' : '❌'}`)
  
  // Test Google Auth
  console.log('\n3. Google Auth Test:')
  try {
    const serviceAccountKey = {
      type: 'service_account',
      project_id: process.env.GEE_PROJECT_ID,
      private_key_id: process.env.GEE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GEE_SERVICE_ACCOUNT_EMAIL,
      client_id: '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    }
    
    console.log('   Creating auth client...')
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/earthengine']
    })
    
    console.log('   Getting auth client...')
    const authClient = await auth.getClient()
    
    console.log('   Requesting access token...')
    const accessToken = await authClient.getAccessToken()
    
    console.log(`   ✅ Access token obtained: ${!!accessToken.token}`)
    console.log(`   Token length: ${accessToken.token?.length || 0}`)
    
    if (accessToken.token) {
      console.log('\n4. Testing Earth Engine API access...')
      
      // Test simple API call
      const response = await fetch('https://earthengine.googleapis.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`   API Response Status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Earth Engine API accessible`)
        console.log(`   Projects found: ${data.projects?.length || 0}`)
      } else {
        const errorText = await response.text()
        console.log(`   ❌ Earth Engine API error: ${errorText}`)
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Auth failed: ${error.message}`)
    console.log(`   Error details:`, error)
  }
}

diagnoseGEEAuth().catch(console.error)