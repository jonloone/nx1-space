'use client';

import dynamic from 'next/dynamic';
import { LoadingScreen } from '@/components/UI/LoadingScreen';

// Client-only map view
export const ClientMapView = dynamic(
  () => import('./MapView').then(mod => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingScreen />
      </div>
    )
  }
);

export default ClientMapView;