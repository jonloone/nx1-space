import React from 'react';
import './ZoomIndicator.css';

interface ZoomIndicatorProps {
  zoom: number;
}

export const ZoomIndicator: React.FC<ZoomIndicatorProps> = ({ zoom }) => {
  const getZoomDescription = (z: number) => {
    if (z <= 4) return 'Continental View';
    if (z <= 7) return 'Country View';
    if (z <= 10) return 'State/Province View';
    if (z <= 13) return 'City View';
    if (z <= 16) return 'District View';
    if (z <= 19) return 'Street View';
    return 'Building Detail';
  };
  
  const getScaleText = (z: number) => {
    // Approximate scale at equator
    const metersPerPixel = 156543.03392 * Math.cos(0) / Math.pow(2, z);
    
    if (metersPerPixel > 10000) {
      return `~${Math.round(metersPerPixel / 1000)}km per pixel`;
    } else if (metersPerPixel > 100) {
      return `~${Math.round(metersPerPixel)}m per pixel`;
    } else {
      return `~${Math.round(metersPerPixel * 100)}cm per pixel`;
    }
  };
  
  return (
    <div className="zoom-indicator-container">
      <div className="zoom-description">{getZoomDescription(zoom)}</div>
      <div className="zoom-details">
        <span className="zoom-level">Zoom: {zoom.toFixed(1)}</span>
        <span className="zoom-scale">{getScaleText(zoom)}</span>
      </div>
    </div>
  );
};