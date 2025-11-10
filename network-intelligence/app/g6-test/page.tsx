/**
 * G6 Isolated Test Page
 *
 * Purpose: Test G6 v5 graph rendering in isolation without complex artifact/card logic
 * This helps identify if issues are with G6 itself or our integration
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Graph } from '@antv/g6'

export default function G6TestPage() {
  const networkContainerRef = useRef<HTMLDivElement>(null)
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  const [networkStatus, setNetworkStatus] = useState<string>('Initializing...')
  const [timelineStatus, setTimelineStatus] = useState<string>('Initializing...')

  // Test 1: Simple Network Graph
  useEffect(() => {
    console.log('🧪 TEST 1: Initializing network graph')

    if (!networkContainerRef.current) {
      console.error('🧪 Network container ref not ready')
      return
    }

    try {
      // Sample network data
      const networkData = {
        nodes: [
          { id: 'node1', data: { label: 'Center', type: 'subject' } },
          { id: 'node2', data: { label: 'Associate 1', type: 'associate' } },
          { id: 'node3', data: { label: 'Associate 2', type: 'associate' } },
          { id: 'node4', data: { label: 'Location', type: 'location' } },
        ],
        edges: [
          { source: 'node1', target: 'node2', data: { type: 'communication' } },
          { source: 'node1', target: 'node3', data: { type: 'meeting' } },
          { source: 'node1', target: 'node4', data: { type: 'visit' } },
        ]
      }

      console.log('🧪 Creating network graph with data:', networkData)

      const graph = new Graph({
        container: networkContainerRef.current,
        width: 600,
        height: 400,
        data: networkData,
        layout: {
          type: 'force',
          preventOverlap: true,
          nodeSpacing: 80,
          linkDistance: 150
        },
        node: {
          style: {
            size: 20,
            fill: '#5B8FF9',
            stroke: '#fff',
            lineWidth: 2
          },
          labelText: (d: any) => d.data?.label || d.id,
          labelPlacement: 'bottom'
        },
        edge: {
          style: {
            stroke: '#e2e2e2',
            lineWidth: 2
          }
        }
      })

      console.log('🧪 Network graph created, calling render()')
      graph.render()
      console.log('🧪 Network graph render() called')

      // Check for canvas
      setTimeout(() => {
        const canvas = networkContainerRef.current?.querySelector('canvas')
        if (canvas) {
          console.log('🧪 ✅ Network canvas found!', canvas.width, 'x', canvas.height)
          setNetworkStatus(`✅ SUCCESS: Canvas rendered (${canvas.width}x${canvas.height})`)
        } else {
          console.error('🧪 ❌ Network canvas NOT found')
          setNetworkStatus('❌ FAILED: No canvas element')
        }
      }, 500)

      return () => {
        console.log('🧪 Destroying network graph')
        graph.destroy()
      }
    } catch (error) {
      console.error('🧪 Network graph error:', error)
      setNetworkStatus(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  // Test 2: Timeline Graph (Dagre Layout)
  useEffect(() => {
    console.log('🧪 TEST 2: Initializing timeline graph')

    if (!timelineContainerRef.current) {
      console.error('🧪 Timeline container ref not ready')
      return
    }

    try {
      // Sample timeline data
      const timelineData = {
        nodes: [
          { id: 'event1', data: { label: 'Event 1\n09:00', time: '09:00' } },
          { id: 'event2', data: { label: 'Event 2\n10:30', time: '10:30' } },
          { id: 'event3', data: { label: 'Event 3\n12:00', time: '12:00' } },
          { id: 'event4', data: { label: 'Event 4\n14:15', time: '14:15' } },
        ],
        edges: [
          { source: 'event1', target: 'event2', data: { type: 'temporal' } },
          { source: 'event2', target: 'event3', data: { type: 'causal' } },
          { source: 'event3', target: 'event4', data: { type: 'temporal' } },
        ]
      }

      console.log('🧪 Creating timeline graph with data:', timelineData)

      const graph = new Graph({
        container: timelineContainerRef.current,
        width: 600,
        height: 400,
        data: timelineData,
        layout: {
          type: 'dagre',
          rankdir: 'TB', // Top to bottom
          ranksep: 70,
          nodesep: 50
        },
        node: {
          style: {
            size: 30,
            fill: '#9254de',
            stroke: '#fff',
            lineWidth: 2
          },
          labelText: (d: any) => d.data?.label || d.id,
          labelFill: '#000',
          labelFontSize: 10
        },
        edge: {
          style: {
            stroke: '#722ed1',
            lineWidth: 2,
            endArrow: true
          }
        }
      })

      console.log('🧪 Timeline graph created, calling render()')
      graph.render()
      console.log('🧪 Timeline graph render() called')

      // Check for canvas
      setTimeout(() => {
        const canvas = timelineContainerRef.current?.querySelector('canvas')
        if (canvas) {
          console.log('🧪 ✅ Timeline canvas found!', canvas.width, 'x', canvas.height)
          setTimelineStatus(`✅ SUCCESS: Canvas rendered (${canvas.width}x${canvas.height})`)
        } else {
          console.error('🧪 ❌ Timeline canvas NOT found')
          setTimelineStatus('❌ FAILED: No canvas element')
        }
      }, 500)

      return () => {
        console.log('🧪 Destroying timeline graph')
        graph.destroy()
      }
    } catch (error) {
      console.error('🧪 Timeline graph error:', error)
      setTimelineStatus(`❌ ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">G6 Isolated Test Page</h1>
          <p className="text-gray-600">
            Testing AntV G6 v5 graph rendering in isolation. Check browser console for detailed logs (look for 🧪 emoji).
          </p>
        </div>

        {/* Test 1: Network Graph */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Test 1: Network Graph (Force Layout)</h2>
            <div className={`text-sm px-3 py-2 rounded ${
              networkStatus.startsWith('✅') ? 'bg-green-100 text-green-800' :
              networkStatus.startsWith('❌') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {networkStatus}
            </div>
          </div>
          <div
            ref={networkContainerRef}
            className="border-2 border-dashed border-gray-300 rounded bg-gray-50"
            style={{ width: 600, height: 400 }}
          />
        </div>

        {/* Test 2: Timeline Graph */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Test 2: Timeline Graph (Dagre Layout)</h2>
            <div className={`text-sm px-3 py-2 rounded ${
              timelineStatus.startsWith('✅') ? 'bg-green-100 text-green-800' :
              timelineStatus.startsWith('❌') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {timelineStatus}
            </div>
          </div>
          <div
            ref={timelineContainerRef}
            className="border-2 border-dashed border-gray-300 rounded bg-gray-50"
            style={{ width: 600, height: 400 }}
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">What to Check:</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Do you see network nodes connected by lines in the first box?</li>
            <li>Do you see timeline events in a vertical flow in the second box?</li>
            <li>Check the browser console for 🧪 test logs</li>
            <li>Status indicators above each graph show success/failure</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
