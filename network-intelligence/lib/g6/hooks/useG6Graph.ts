/**
 * useG6Graph Hook
 *
 * React hook for managing G6 graph instance lifecycle
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Graph, type GraphData, type GraphOptions } from '@antv/g6'
import { NODE_STATE_STYLES, EDGE_STATE_STYLES } from '../config/styles'
import { FORCE_LAYOUT, type LayoutConfig } from '../config/layouts'

export interface UseG6GraphOptions {
  data: GraphData
  layout?: LayoutConfig
  width?: number
  height?: number
  fitView?: boolean
  animate?: boolean
  modes?: GraphOptions['modes']
  onNodeClick?: (node: any) => void
  onEdgeClick?: (edge: any) => void
  onCanvasClick?: () => void
}

export function useG6Graph(options: UseG6GraphOptions) {
  const {
    data,
    layout = FORCE_LAYOUT,
    width = 800,
    height = 600,
    fitView = true,
    animate = true,
    modes,
    onNodeClick,
    onEdgeClick,
    onCanvasClick
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<Graph | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize G6 graph
  useEffect(() => {
    console.log('🔴 useG6Graph effect running with data:', { nodes: data.nodes?.length, edges: data.edges?.length, width, height })

    if (!containerRef.current) {
      console.log('🔴 Container ref not ready yet')
      return
    }

    // Clean up existing graph
    if (graphRef.current) {
      console.log('🔴 Destroying existing graph')
      graphRef.current.destroy()
    }

    console.log('🔴 Creating new G6 graph instance')
    // Create new graph instance with initial data
    const graph = new Graph({
      container: containerRef.current,
      width,
      height,
      data,  // Pass data directly in constructor
      fitView,
      fitViewPadding: [40, 40, 40, 40],
      animate,
      layout,
      modes: modes || {
        default: [
          'drag-canvas',
          'zoom-canvas',
          'drag-node',
          {
            type: 'tooltip',
            formatText: (model: any) => {
              const originalData = model.originalData
              if (!originalData) return model.label

              if (model.type === 'node') {
                return `<div style="padding: 8px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${originalData.name}</div>
                  <div style="font-size: 11px; color: #6b7280;">
                    Type: ${originalData.type}
                    ${originalData.riskLevel ? `<br/>Risk: ${originalData.riskLevel}` : ''}
                  </div>
                </div>`
              } else {
                return `<div style="padding: 8px;">
                  <div style="font-size: 11px;">
                    ${originalData.type} - ${originalData.frequency}x
                  </div>
                </div>`
              }
            },
            offset: 10
          }
        ]
      },
      defaultNode: {
        size: 48,
        style: {
          cursor: 'pointer'
        }
      },
      defaultEdge: {
        style: {
          cursor: 'pointer'
        }
      },
      nodeStateStyles: NODE_STATE_STYLES,
      edgeStateStyles: EDGE_STATE_STYLES
    })

    // Event listeners
    graph.on('node:click', (evt) => {
      const { item } = evt
      if (item) {
        const model = item.getModel()
        onNodeClick?.(model)
      }
    })

    graph.on('edge:click', (evt) => {
      const { item } = evt
      if (item) {
        const model = item.getModel()
        onEdgeClick?.(model)
      }
    })

    graph.on('canvas:click', () => {
      onCanvasClick?.()
    })

    // Hover effects
    graph.on('node:mouseenter', (evt) => {
      const { item } = evt
      if (item) {
        graph.setItemState(item, 'hover', true)
      }
    })

    graph.on('node:mouseleave', (evt) => {
      const { item } = evt
      if (item) {
        graph.setItemState(item, 'hover', false)
      }
    })

    graph.on('edge:mouseenter', (evt) => {
      const { item } = evt
      if (item) {
        graph.setItemState(item, 'hover', true)
      }
    })

    graph.on('edge:mouseleave', (evt) => {
      const { item } = evt
      if (item) {
        graph.setItemState(item, 'hover', false)
      }
    })

    graphRef.current = graph
    setIsReady(true)
    console.log('🔴 G6 graph created successfully and ready')

    // Cleanup
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy()
        graphRef.current = null
        setIsReady(false)
      }
    }
  }, [width, height, data, layout]) // Recreate when any of these change

  // Public API
  const api = {
    graph: graphRef.current,
    containerRef,
    isReady,

    // Layout controls
    changeLayout: (newLayout: LayoutConfig) => {
      graphRef.current?.updateLayout(newLayout)
    },

    // View controls
    fitView: () => {
      graphRef.current?.fitView(40)
    },

    zoomIn: () => {
      const zoom = graphRef.current?.getZoom()
      if (zoom) {
        graphRef.current?.zoomTo(zoom * 1.2, { x: width / 2, y: height / 2 })
      }
    },

    zoomOut: () => {
      const zoom = graphRef.current?.getZoom()
      if (zoom) {
        graphRef.current?.zoomTo(zoom / 1.2, { x: width / 2, y: height / 2 })
      }
    },

    resetZoom: () => {
      graphRef.current?.zoomTo(1, { x: width / 2, y: height / 2 })
    },

    // Data manipulation (Note: in this implementation, graph recreates when data changes via deps)
    updateData: (newData: GraphData) => {
      // Graph will automatically recreate when data prop changes
      // This method is kept for API compatibility but isn't needed
      console.warn('updateData called but graph recreates automatically on data change')
    },

    addNode: (node: any) => {
      graphRef.current?.addItem('node', node)
    },

    removeNode: (nodeId: string) => {
      graphRef.current?.removeItem(nodeId)
    },

    // Selection
    selectNode: (nodeId: string) => {
      const node = graphRef.current?.findById(nodeId)
      if (node) {
        graphRef.current?.setItemState(node, 'selected', true)
      }
    },

    unselectNode: (nodeId: string) => {
      const node = graphRef.current?.findById(nodeId)
      if (node) {
        graphRef.current?.setItemState(node, 'selected', false)
      }
    },

    clearSelection: () => {
      const selectedNodes = graphRef.current?.findAllByState('node', 'selected')
      selectedNodes?.forEach(node => {
        graphRef.current?.setItemState(node, 'selected', false)
      })
    },

    // Focus
    focusNode: (nodeId: string) => {
      const node = graphRef.current?.findById(nodeId)
      if (node) {
        graphRef.current?.focusItem(node, true)
      }
    },

    // Export
    downloadImage: (name = 'graph') => {
      graphRef.current?.downloadFullImage(name, 'image/png', {
        backgroundColor: '#ffffff',
        padding: 20
      })
    },

    toDataURL: () => {
      return graphRef.current?.toDataURL()
    },

    // Highlight neighbors
    highlightNeighbors: (nodeId: string) => {
      const node = graphRef.current?.findById(nodeId)
      if (!node) return

      // Get all edges connected to this node
      const edges = graphRef.current?.getEdges().filter(edge => {
        const model = edge.getModel()
        return model.source === nodeId || model.target === nodeId
      })

      // Get all neighbor node IDs
      const neighborIds = new Set<string>()
      edges?.forEach(edge => {
        const model = edge.getModel()
        if (model.source === nodeId) neighborIds.add(model.target as string)
        if (model.target === nodeId) neighborIds.add(model.source as string)
      })

      // Set all nodes/edges to inactive except neighbors
      graphRef.current?.getNodes().forEach(n => {
        const id = n.getID()
        if (id === nodeId || neighborIds.has(id)) {
          graphRef.current?.setItemState(n, 'active', true)
          graphRef.current?.setItemState(n, 'inactive', false)
        } else {
          graphRef.current?.setItemState(n, 'active', false)
          graphRef.current?.setItemState(n, 'inactive', true)
        }
      })

      graphRef.current?.getEdges().forEach(e => {
        const model = e.getModel()
        if (model.source === nodeId || model.target === nodeId) {
          graphRef.current?.setItemState(e, 'active', true)
          graphRef.current?.setItemState(e, 'inactive', false)
        } else {
          graphRef.current?.setItemState(e, 'active', false)
          graphRef.current?.setItemState(e, 'inactive', true)
        }
      })
    },

    clearHighlight: () => {
      graphRef.current?.getNodes().forEach(node => {
        graphRef.current?.setItemState(node, 'active', true)
        graphRef.current?.setItemState(node, 'inactive', false)
      })

      graphRef.current?.getEdges().forEach(edge => {
        graphRef.current?.setItemState(edge, 'active', true)
        graphRef.current?.setItemState(edge, 'inactive', false)
      })
    }
  }

  return api
}
