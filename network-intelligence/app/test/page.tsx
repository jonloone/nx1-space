"use client";

import { getFallbackAnalyticsData } from '@/lib/data-loader';

export default function TestPage() {
  // Get data synchronously for testing
  const stations = getFallbackAnalyticsData();

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl mb-4">Test: Direct Data Access</h1>
      <p className="mb-4">Found {stations.length} ground stations</p>
      
      {stations.slice(0, 3).map(station => (
        <div key={station.station_id} className="bg-gray-800 p-4 rounded mb-2">
          <h3 className="font-bold">{station.name}</h3>
          <p>Location: {station.location.latitude}, {station.location.longitude}</p>
          <p>Utilization: {station.utilization_metrics.current_utilization}%</p>
          <p>Profit Margin: {station.business_metrics.profit_margin}%</p>
          <p>Revenue: ${station.business_metrics.monthly_revenue.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}