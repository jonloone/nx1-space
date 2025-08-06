"use client";

import { useEffect, useState } from 'react';
import { loadGroundStationAnalytics, getFallbackAnalyticsData } from '@/lib/data-loader';
import { GroundStationAnalytics } from '@/lib/types/ground-station';
import { GroundStationPopup } from '@/components/ground-station-popup';

export default function DebugPage() {
  const [stations, setStations] = useState<GroundStationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<GroundStationAnalytics | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    console.log('Debug: Loading ground station analytics...');
    loadGroundStationAnalytics()
      .then(data => {
        console.log('Debug: Loaded stations:', data.length);
        console.log('Debug: First station:', data[0]);
        setStations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Debug: Error loading stations:', err);
        // Fallback to direct data
        try {
          const fallbackData = getFallbackAnalyticsData();
          console.log('Debug: Using fallback data:', fallbackData.length);
          setStations(fallbackData);
          setLoading(false);
        } catch (fallbackErr) {
          console.error('Debug: Fallback also failed:', fallbackErr);
          setError(err.message);
          setLoading(false);
        }
      });
  }, []);

  const handleStationClick = (station: GroundStationAnalytics) => {
    console.log('Debug: Station clicked:', station.name);
    setSelectedStation(station);
    setIsPopupOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl mb-4">Debug: Loading Ground Stations...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl mb-4 text-red-500">Debug: Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl mb-4">Debug: Ground Station Popup Test</h1>
      <p className="mb-4">Loaded {stations.length} ground stations</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stations.slice(0, 6).map(station => (
          <div 
            key={station.station_id} 
            className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => handleStationClick(station)}
          >
            <h3 className="font-bold text-lg mb-2">{station.name}</h3>
            <p className="text-sm text-gray-400">Operator: {station.operator}</p>
            <p className="text-sm text-gray-400">Location: {station.location.country}</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Utilization:</span>
                <span className="text-sm font-medium">{station.utilization_metrics.current_utilization}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profit Margin:</span>
                <span className="text-sm font-medium">{station.business_metrics.profit_margin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue:</span>
                <span className="text-sm font-medium">${(station.business_metrics.monthly_revenue / 1000).toFixed(0)}K</span>
              </div>
            </div>
            <p className="text-xs text-blue-400 mt-2">Click for detailed analysis</p>
          </div>
        ))}
      </div>

      {/* Ground Station Deep Dive Popup */}
      <GroundStationPopup 
        station={selectedStation}
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedStation(null);
        }}
      />
    </div>
  );
}