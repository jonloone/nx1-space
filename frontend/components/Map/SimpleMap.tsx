import React, { useEffect, useRef } from 'react';

export const SimpleMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    console.log('[SimpleMap] Component mounted');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[SimpleMap] Canvas not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[SimpleMap] Could not get 2d context');
      return;
    }
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Draw a simple test pattern
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1a1f2e';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw center marker
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Map Canvas Working', canvas.width / 2, 50);
    
    console.log('[SimpleMap] Canvas rendered successfully');
  }, []);
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        Simple Canvas Test
      </div>
    </div>
  );
};

export default SimpleMap;