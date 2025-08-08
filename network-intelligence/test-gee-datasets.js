/**
 * Test Google Earth Engine Datasets
 */

const { google } = require('googleapis')
require('dotenv').config({ path: '.env.local' })

async function testGEEDatasets() {
  console.log('🌍 Testing Google Earth Engine Datasets')
  console.log('=========================================')
  
  try {
    // Get access token
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
    
    console.log('✅ Access token obtained\n')
    
    // Test location: New York City
    const lat = 40.7128
    const lon = -74.0060
    
    console.log(`📍 Test location: NYC (${lat}, ${lon})\n`)
    
    // Test 1: Get a pixel value from an image at a point
    console.log('1. Testing point value extraction...')
    
    // Simplified expression - just get value at a point
    const pointExpression = {
      expression: `
        var point = ee.Geometry.Point([${lon}, ${lat}]);
        var image = ee.Image('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG/2023_01_01').select('avg_rad');
        var value = image.sample(point, 500).first().get('avg_rad');
        return value;
      `
    }
    
    // Note: The Earth Engine REST API uses a different format
    // We need to use the proper expression format
    const testExpression = {
      expression: {
        result: 'value',
        values: {
          value: {
            functionInvocationValue: {
              functionName: 'Feature.get',
              arguments: {
                object: {
                  functionInvocationValue: {
                    functionName: 'FeatureCollection.first',
                    arguments: {
                      collection: {
                        functionInvocationValue: {
                          functionName: 'Image.sample',
                          arguments: {
                            image: {
                              functionInvocationValue: {
                                functionName: 'Image.select',
                                arguments: {
                                  input: {
                                    functionInvocationValue: {
                                      functionName: 'Image.load',
                                      arguments: {
                                        id: { constantValue: 'NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG/2023_01_01' }
                                      }
                                    }
                                  },
                                  bandSelectors: { constantValue: ['avg_rad'] }
                                }
                              }
                            },
                            region: {
                              functionInvocationValue: {
                                functionName: 'Geometry.Point',
                                arguments: {
                                  coordinates: { constantValue: [lon, lat] }
                                }
                              }
                            },
                            scale: { constantValue: 500 }
                          }
                        }
                      }
                    }
                  }
                },
                property: { constantValue: 'avg_rad' }
              }
            }
          }
        }
      }
    }
    
    const response = await fetch(
      `https://earthengine.googleapis.com/v1/projects/${process.env.GEE_PROJECT_ID}/value:compute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testExpression)
      }
    )
    
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Nighttime lights value at NYC:', result.result)
      console.log('   (Higher values = more lights)\n')
    } else {
      const error = await response.text()
      console.log('❌ Error:', error.substring(0, 200))
    }
    
    // Test 2: Simple constant to verify API works
    console.log('2. Testing Earth Engine computation...')
    const simpleExpr = {
      expression: {
        result: 'sum',
        values: {
          sum: {
            functionInvocationValue: {
              functionName: 'Number.add',
              arguments: {
                left: { constantValue: 10 },
                right: { constantValue: 32 }
              }
            }
          }
        }
      }
    }
    
    const simpleResponse = await fetch(
      `https://earthengine.googleapis.com/v1/projects/${process.env.GEE_PROJECT_ID}/value:compute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simpleExpr)
      }
    )
    
    if (simpleResponse.ok) {
      const result = await simpleResponse.json()
      console.log('✅ Computation result (10 + 32):', result.result)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGEEDatasets().catch(console.error)