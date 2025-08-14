'use client'

export interface WebGLCapabilities {
  hasWebGL: boolean
  hasWebGL2: boolean
  maxTextureSize: number
  maxVertexUniforms: number
  maxFragmentUniforms: number
  maxVertexAttributes: number
  maxVaryingVectors: number
  supportedExtensions: string[]
  renderer: string
  vendor: string
  version: string
  shadingLanguageVersion: string
  isVirtualized: boolean
  performanceLevel: 'high' | 'medium' | 'low' | 'unsupported'
}

export interface WebGLContextConfig {
  alpha: boolean
  antialias: boolean
  depth: boolean
  failIfMajorPerformanceCaveat: boolean
  powerPreference: 'default' | 'high-performance' | 'low-power'
  premultipliedAlpha: boolean
  preserveDrawingBuffer: boolean
  stencil: boolean
}

// Detect WebGL capabilities and environment characteristics
export function detectWebGLCapabilities(): WebGLCapabilities {
  const result: WebGLCapabilities = {
    hasWebGL: false,
    hasWebGL2: false,
    maxTextureSize: 0,
    maxVertexUniforms: 0,
    maxFragmentUniforms: 0,
    maxVertexAttributes: 0,
    maxVaryingVectors: 0,
    supportedExtensions: [],
    renderer: 'unknown',
    vendor: 'unknown',
    version: 'unknown',
    shadingLanguageVersion: 'unknown',
    isVirtualized: false,
    performanceLevel: 'unsupported'
  }

  if (typeof window === 'undefined') {
    return result // Server-side rendering
  }

  try {
    // Test WebGL 2.0 first
    const canvas = document.createElement('canvas')
    let gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    
    if (gl) {
      result.hasWebGL2 = true
      result.hasWebGL = true
    } else {
      // Fallback to WebGL 1.0
      gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
           canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false })
      
      if (gl) {
        result.hasWebGL = true
      }
    }

    if (gl) {
      // Get basic parameters
      result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      result.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
      result.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
      result.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
      result.maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS)
      
      // Get renderer info
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown'
        result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown'
      }
      
      result.version = gl.getParameter(gl.VERSION) || 'unknown'
      result.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'unknown'
      
      // Get supported extensions
      result.supportedExtensions = gl.getSupportedExtensions() || []
      
      // Detect if running in virtualized environment
      result.isVirtualized = detectVirtualizedEnvironment(result.renderer, result.vendor)
      
      // Determine performance level
      result.performanceLevel = determinePerformanceLevel(result)
    }

    // Cleanup
    canvas.remove()
    
  } catch (error) {
    console.warn('WebGL detection failed:', error)
  }

  return result
}

// Detect if running in a virtualized environment
function detectVirtualizedEnvironment(renderer: string, vendor: string): boolean {
  const virtualizedIndicators = [
    'llvmpipe',
    'swiftshader',
    'software',
    'mesa',
    'microsoft basic render driver',
    'vmware',
    'virtualbox',
    'parallels',
    'chromium'
  ]
  
  const rendererLower = renderer.toLowerCase()
  const vendorLower = vendor.toLowerCase()
  
  return virtualizedIndicators.some(indicator => 
    rendererLower.includes(indicator) || vendorLower.includes(indicator)
  )
}

// Determine performance level based on capabilities
function determinePerformanceLevel(capabilities: WebGLCapabilities): 'high' | 'medium' | 'low' | 'unsupported' {
  if (!capabilities.hasWebGL) {
    return 'unsupported'
  }
  
  // High performance: Dedicated GPU, large texture support, WebGL2
  if (capabilities.hasWebGL2 && 
      capabilities.maxTextureSize >= 16384 && 
      !capabilities.isVirtualized &&
      capabilities.supportedExtensions.includes('EXT_texture_filter_anisotropic')) {
    return 'high'
  }
  
  // Medium performance: Good texture support, may be integrated GPU
  if (capabilities.maxTextureSize >= 8192 && 
      capabilities.maxVertexUniforms >= 256) {
    return 'medium'
  }
  
  // Low performance: Basic WebGL support
  if (capabilities.maxTextureSize >= 2048) {
    return 'low'
  }
  
  return 'unsupported'
}

// Generate optimal WebGL context configurations based on capabilities
export function generateWebGLConfigurations(capabilities: WebGLCapabilities): WebGLContextConfig[] {
  const configs: WebGLContextConfig[] = []
  
  if (!capabilities.hasWebGL) {
    return configs
  }
  
  // High performance configuration (try first if supported)
  if (capabilities.performanceLevel === 'high' && !capabilities.isVirtualized) {
    configs.push({
      alpha: false,
      antialias: true,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: true
    })
  }
  
  // Balanced configuration (works for most cases)
  configs.push({
    alpha: false,
    antialias: capabilities.performanceLevel !== 'low',
    depth: true,
    failIfMajorPerformanceCaveat: true,
    powerPreference: 'default',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: true
  })
  
  // Low power configuration (for integrated GPUs and mobile)
  if (capabilities.isVirtualized || capabilities.performanceLevel === 'low') {
    configs.push({
      alpha: false,
      antialias: false,
      depth: true,
      failIfMajorPerformanceCaveat: true,
      powerPreference: 'low-power',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false
    })
  }
  
  // Minimal configuration (last resort)
  configs.push({
    alpha: true,
    antialias: false,
    depth: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'low-power',
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false
  })
  
  return configs
}

// Test WebGL context creation with a specific configuration
export async function testWebGLContext(config: WebGLContextConfig): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    const gl = canvas.getContext('webgl2', config) || 
               canvas.getContext('webgl', config) ||
               canvas.getContext('experimental-webgl', config)
    
    if (!gl) {
      return false
    }
    
    // Test basic WebGL operations
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    
    if (!vertexShader || !fragmentShader) {
      return false
    }
    
    // Simple shader test
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `)
    
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      void main() {
        gl_Color = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `)
    
    gl.compileShader(vertexShader)
    gl.compileShader(fragmentShader)
    
    const success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) &&
                   gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
    
    // Cleanup
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
    canvas.remove()
    
    return success
    
  } catch (error) {
    console.warn('WebGL context test failed:', error)
    return false
  }
}

// Find the best working WebGL configuration
export async function findOptimalWebGLConfig(capabilities?: WebGLCapabilities): Promise<WebGLContextConfig | null> {
  const caps = capabilities || detectWebGLCapabilities()
  const configs = generateWebGLConfigurations(caps)
  
  for (const config of configs) {
    const works = await testWebGLContext(config)
    if (works) {
      console.log('✅ Found working WebGL configuration:', config)
      return config
    }
  }
  
  console.warn('❌ No working WebGL configuration found')
  return null
}

// Comprehensive WebGL environment report
export function generateWebGLReport(capabilities?: WebGLCapabilities): string {
  const caps = capabilities || detectWebGLCapabilities()
  
  return `
WebGL Environment Report
========================
WebGL Support: ${caps.hasWebGL ? '✅' : '❌'}
WebGL2 Support: ${caps.hasWebGL2 ? '✅' : '❌'}
Performance Level: ${caps.performanceLevel}
Virtualized: ${caps.isVirtualized ? '⚠️  Yes' : '✅ No'}

Hardware Info:
- Renderer: ${caps.renderer}
- Vendor: ${caps.vendor}
- Version: ${caps.version}
- Shading Language: ${caps.shadingLanguageVersion}

Capabilities:
- Max Texture Size: ${caps.maxTextureSize}px
- Max Vertex Uniforms: ${caps.maxVertexUniforms}
- Max Fragment Uniforms: ${caps.maxFragmentUniforms}
- Max Vertex Attributes: ${caps.maxVertexAttributes}
- Max Varying Vectors: ${caps.maxVaryingVectors}

Extensions: ${caps.supportedExtensions.length} supported
${caps.supportedExtensions.slice(0, 10).map(ext => `- ${ext}`).join('\n')}
${caps.supportedExtensions.length > 10 ? `... and ${caps.supportedExtensions.length - 10} more` : ''}
  `.trim()
}