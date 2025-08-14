/**
 * ML Training Pipeline API Endpoint
 * 
 * Exposes the complete data integration and ML training pipeline via REST API.
 * Allows triggering automated training runs and monitoring progress.
 */

import { NextRequest, NextResponse } from 'next/server'
import { automatedDataPipeline } from '../../../../lib/pipelines/automated-data-pipeline'
import { trainingOrchestrator } from '../../../../lib/pipelines/training-orchestrator'
import { runCompleteIntegrationTest, runSmokeTest } from '../../../../lib/testing/data-integration-pipeline-test'

// POST /api/ml-training/pipeline - Start training pipeline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      mode = 'full', // 'full', 'data-only', 'training-only', 'test'
      stations = [],
      forceRefresh = false,
      skipValidation = false
    } = body

    console.log(`Starting ML training pipeline in ${mode} mode...`)

    let result: any

    switch (mode) {
      case 'data-only':
        // Run only data enrichment pipeline
        result = await automatedDataPipeline.run({
          forceRefresh,
          skipTraining: true,
          stations: stations.length > 0 ? stations : undefined
        })
        break

      case 'training-only':
        // Run only the training orchestrator (assumes data is already available)
        if (!skipValidation) {
          const health = await trainingOrchestrator.healthCheck()
          if (!health.orchestrator || !health.dataIntegration) {
            return NextResponse.json({
              success: false,
              error: 'Training orchestrator or data integration not healthy',
              health
            }, { status: 503 })
          }
        }
        
        result = await trainingOrchestrator.executeTraining()
        break

      case 'test':
        // Run integration tests
        result = await runCompleteIntegrationTest()
        break

      case 'smoke-test':
        // Run quick smoke test
        const smokeResult = await runSmokeTest()
        return NextResponse.json({
          success: smokeResult,
          message: smokeResult ? 'Smoke test passed' : 'Smoke test failed',
          timestamp: new Date().toISOString()
        })

      case 'full':
      default:
        // Run complete training orchestration
        result = await trainingOrchestrator.executeTraining()
        break
    }

    return NextResponse.json({
      success: true,
      mode,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('ML training pipeline failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET /api/ml-training/pipeline - Get pipeline status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const component = searchParams.get('component') || 'all'

    let result: any = {}

    if (component === 'all' || component === 'pipeline') {
      result.pipeline = {
        status: automatedDataPipeline.getStatus(),
        metrics: automatedDataPipeline.getMetrics(),
        config: automatedDataPipeline.getConfig()
      }
    }

    if (component === 'all' || component === 'orchestrator') {
      result.orchestrator = {
        status: trainingOrchestrator.getProgress(),
        history: trainingOrchestrator.getHistory(),
        config: trainingOrchestrator.getConfig()
      }
    }

    if (component === 'all' || component === 'health') {
      result.health = {
        pipeline: await automatedDataPipeline.healthCheck(),
        orchestrator: await trainingOrchestrator.healthCheck()
      }
    }

    return NextResponse.json({
      success: true,
      component,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to get pipeline status:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT /api/ml-training/pipeline - Update pipeline configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { component, config } = body

    if (!component || !config) {
      return NextResponse.json({
        success: false,
        error: 'Missing component or config in request body'
      }, { status: 400 })
    }

    switch (component) {
      case 'pipeline':
        automatedDataPipeline.updateConfig(config)
        break
      
      case 'orchestrator':
        trainingOrchestrator.updateConfig(config)
        break
      
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown component: ${component}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Configuration updated for ${component}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Failed to update pipeline config:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}