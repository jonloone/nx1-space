'use client';

import React from 'react';

export const StaticMapView: React.FC = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#1a1a2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px',
      fontFamily: 'monospace'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Map Component Test</h2>
        <p>If you see this, the component is loading properly</p>
        <p style={{ fontSize: '14px', marginTop: '20px' }}>
          Time: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};