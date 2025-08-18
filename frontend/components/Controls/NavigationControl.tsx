import React, { useState } from 'react';
import './NavigationControl.css';

interface NavigationControlProps {
  viewState: any;
  onNavigate: (target: any) => void;
}

// Predefined zoom levels for quick access
const ZOOM_PRESETS = [
  { level: 4, name: 'Country', icon: '🗺️' },
  { level: 8, name: 'State', icon: '🏛️' },
  { level: 11, name: 'City', icon: '🌆' },
  { level: 14, name: 'District', icon: '🏘️' },
  { level: 17, name: 'Street', icon: '🛣️' },
  { level: 20, name: 'Building', icon: '🏢' }
];

// Predefined locations for quick navigation
const QUICK_LOCATIONS = [
  { name: 'Los Angeles', coords: [-118.2437, 34.0522], zoom: 11 },
  { name: 'New York', coords: [-74.006, 40.7128], zoom: 11 },
  { name: 'Houston', coords: [-95.3698, 29.7604], zoom: 11 },
  { name: 'Washington DC', coords: [-77.0369, 38.9072], zoom: 11 },
  { name: 'London', coords: [-0.1276, 51.5074], zoom: 11 },
  { name: 'Singapore', coords: [103.8198, 1.3521], zoom: 11 }
];

export const NavigationControl: React.FC<NavigationControlProps | {}> = (props) => {
  // Support both prop-based and store-based usage
  const hasProps = 'viewState' in props && 'onNavigate' in props;
  const viewState = hasProps ? (props as NavigationControlProps).viewState : { zoom: 10, bearing: 0, pitch: 0 };
  const onNavigate = hasProps ? (props as NavigationControlProps).onNavigate : () => {};
  const [showPresets, setShowPresets] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  
  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(22, viewState.zoom + 1);
    onNavigate({ zoom: newZoom });
  };
  
  const zoomOut = () => {
    const newZoom = Math.max(2, viewState.zoom - 1);
    onNavigate({ zoom: newZoom });
  };
  
  const zoomToLevel = (level: number) => {
    onNavigate({ zoom: level });
    setShowPresets(false);
  };
  
  // Compass control
  const resetNorth = () => {
    onNavigate({ bearing: 0, pitch: 0 });
  };
  
  // Quick location navigation
  const goToLocation = (location: typeof QUICK_LOCATIONS[0]) => {
    onNavigate({
      longitude: location.coords[0],
      latitude: location.coords[1],
      zoom: location.zoom
    });
    setShowLocations(false);
  };
  
  // Pitch control for 2.5D view
  const togglePitch = () => {
    const newPitch = viewState.pitch === 0 ? 45 : 0;
    onNavigate({ pitch: newPitch });
  };
  
  const isNorthUp = Math.abs(viewState.bearing) < 1;
  const is2D = viewState.pitch === 0;
  
  return (
    <div className="navigation-control-container">
      {/* Main Navigation Control */}
      <div className="nav-control-group">
        {/* Zoom Controls */}
        <div className="zoom-control">
          <button 
            className="nav-btn zoom-in"
            onClick={zoomIn}
            disabled={viewState.zoom >= 22}
            title="Zoom In (Scroll Up)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
          
          <button 
            className="nav-btn zoom-indicator"
            onClick={() => setShowPresets(!showPresets)}
            title="Zoom Presets"
          >
            <span className="zoom-value">{Math.round(viewState.zoom)}</span>
          </button>
          
          <button 
            className="nav-btn zoom-out"
            onClick={zoomOut}
            disabled={viewState.zoom <= 2}
            title="Zoom Out (Scroll Down)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 8h10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
        
        {/* Compass */}
        <button 
          className={`nav-btn compass ${!isNorthUp ? 'rotated' : ''}`}
          onClick={resetNorth}
          style={{ transform: `rotate(${-viewState.bearing}deg)` }}
          title="Reset North"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
            <path d="M12 4l3 8h-6z" fill="currentColor"/>
            <text x="12" y="9" textAnchor="middle" fontSize="6" fill="currentColor">N</text>
          </svg>
        </button>
        
        {/* 2D/2.5D Toggle */}
        <button 
          className={`nav-btn pitch-toggle ${!is2D ? 'active' : ''}`}
          onClick={togglePitch}
          title={is2D ? 'Enable 2.5D View' : 'Back to 2D'}
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            {is2D ? (
              <rect x="4" y="8" width="12" height="8" stroke="currentColor" fill="none" strokeWidth="1.5"/>
            ) : (
              <path d="M4 12 L10 6 L16 12 L16 16 L10 10 L4 16 Z" stroke="currentColor" fill="none" strokeWidth="1.5"/>
            )}
          </svg>
        </button>
        
        {/* Quick Locations */}
        <button 
          className="nav-btn locations"
          onClick={() => setShowLocations(!showLocations)}
          title="Quick Locations"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="2" fill="currentColor"/>
            <path d="M10 2 v6 m0 4 v6 M2 10 h6 m4 0 h6" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          </svg>
        </button>
      </div>
      
      {/* Zoom Presets Dropdown */}
      {showPresets && (
        <div className="nav-dropdown zoom-presets">
          {ZOOM_PRESETS.map(preset => (
            <button
              key={preset.level}
              className={`preset-btn ${Math.abs(viewState.zoom - preset.level) < 0.5 ? 'active' : ''}`}
              onClick={() => zoomToLevel(preset.level)}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-name">{preset.name}</span>
              <span className="preset-level">z{preset.level}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Quick Locations Dropdown */}
      {showLocations && (
        <div className="nav-dropdown location-list">
          {QUICK_LOCATIONS.map(location => (
            <button
              key={location.name}
              className="location-btn"
              onClick={() => goToLocation(location)}
            >
              <span className="location-name">{location.name}</span>
              <span className="location-coords">
                {location.coords[1].toFixed(2)}°, {location.coords[0].toFixed(2)}°
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};