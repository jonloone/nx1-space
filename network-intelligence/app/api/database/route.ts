/**
 * Database API Endpoint
 * 
 * Provides access to stored station data, training records, and pipeline history.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stationDatabase } from '../../../lib/database/station-database'

// GET /api/database - Query database records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stations'
    const operator = searchParams.get('operator')
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let result: any

    switch (type) {
      case 'stations':
        if (operator) {
          result = await stationDatabase.getStationsByOperator(operator)
        } else {
          result = await stationDatabase.getAllStationRecords()
        }
        
        // Apply date filtering if provided
        if (startDate) {
          const start = new Date(startDate)
          result = result.filter((r: any) => new Date(r.lastUpdated) >= start)
        }
        
        if (endDate) {
          const end = new Date(endDate)
          result = result.filter((r: any) => new Date(r.lastUpdated) <= end)
        }
        
        // Apply limit
        result = result.slice(0, limit)
        break

      case 'training':
        result = await stationDatabase.getTrainingHistory(limit)
        break

      case 'pipeline':
        const runType = searchParams.get('runType')
        if (runType) {
          result = await stationDatabase.getPipelineRunsByType(runType)
        } else {
          result = await stationDatabase.getPipelineHistory(limit)
        }
        break

      case 'metrics':
        result = await stationDatabase.getDataQualityMetrics()
        break

      case 'performance':
        result = await stationDatabase.getModelPerformanceTrends()
        break

      case 'insights':
        result = await stationDatabase.getOperationalInsights()
        break

      case 'stats':
        result = await stationDatabase.getDatabaseStats()
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type: ${type}. Supported types: stations, training, pipeline, metrics, performance, insights, stats`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      count: Array.isArray(result) ? result.length : 1,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database query failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST /api/database - Store or update records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, action, data } = body

    if (!type || !action) {
      return NextResponse.json({
        success: false,
        error: 'Missing type or action in request body'
      }, { status: 400 })
    }

    let result: any

    switch (type) {
      case 'station':
        if (action === 'validate') {
          const { stationId, status, errors = [] } = data
          result = await stationDatabase.updateStationValidation(stationId, status, errors)
        } else {
          return NextResponse.json({
            success: false,
            error: `Unknown action for station: ${action}`
          }, { status: 400 })
        }
        break

      case 'training':
        if (action === 'update-deployment') {
          const { recordId, status, rollbackAvailable = false } = data
          result = await stationDatabase.updateTrainingDeployment(recordId, status, rollbackAvailable)
        } else {
          return NextResponse.json({
            success: false,
            error: `Unknown action for training: ${action}`
          }, { status: 400 })
        }
        break

      case 'database':
        if (action === 'cleanup') {
          const { retentionDays = 90 } = data
          result = await stationDatabase.cleanupOldRecords(retentionDays)
        } else if (action === 'export') {
          result = await stationDatabase.exportData()
        } else if (action === 'import') {
          const { importData } = data
          result = await stationDatabase.importData(importData)
        } else {
          return NextResponse.json({
            success: false,
            error: `Unknown action for database: ${action}`
          }, { status: 400 })
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type: ${type}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database operation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET /api/database/[id] - Get specific record by ID
export async function GET_BY_ID(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'station'
    const id = params.id

    let result: any

    switch (type) {
      case 'station':
        result = await stationDatabase.getStationRecord(id)
        break

      case 'training':
        result = await stationDatabase.getTrainingRecord(id)
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type: ${type}`
        }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({
        success: false,
        error: `Record not found: ${id}`,
        type,
        id
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      type,
      id,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database record fetch failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}