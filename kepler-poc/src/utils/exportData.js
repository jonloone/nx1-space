/**
 * Data export utilities for Ground Station Intelligence
 */

export const exportVisibleStations = (stations, format = 'csv') => {
  if (!stations || stations.length === 0) {
    console.warn('No stations to export');
    return;
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportAsCSV(stations);
      break;
    case 'json':
      exportAsJSON(stations);
      break;
    case 'report':
      exportAsReport(stations);
      break;
    default:
      console.error(`Unsupported format: ${format}`);
  }
};

const exportAsCSV = (data) => {
  // Define columns to export
  const columns = [
    'name',
    'operator',
    'country',
    'latitude',
    'longitude',
    'overall_investment_score',
    'investment_recommendation',
    'market_opportunity_score',
    'strategic_location_score',
    'competition_score',
    'infrastructure_score',
    'primary_antenna_size_m',
    'estimated_g_t_db',
    'estimated_eirp_dbw',
    'frequency_bands',
    'services_supported'
  ];

  // Create header row
  const headers = columns.join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col];
      // Escape values containing commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  // Combine into CSV string
  const csv = [headers, ...rows].join('\n');
  
  // Download file
  downloadFile(csv, 'ground_stations_export.csv', 'text/csv');
};

const exportAsJSON = (data) => {
  // Create structured JSON export
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalStations: data.length,
      source: 'Ground Station Intelligence POC',
      dataAttribution: {
        locations: 'Real commercial teleport locations',
        scores: 'BI-level investment analysis methodology'
      }
    },
    summary: {
      averageScore: data.reduce((sum, s) => sum + s.overall_investment_score, 0) / data.length,
      distribution: {
        excellent: data.filter(s => s.investment_recommendation === 'excellent').length,
        good: data.filter(s => s.investment_recommendation === 'good').length,
        moderate: data.filter(s => s.investment_recommendation === 'moderate').length,
        poor: data.filter(s => s.investment_recommendation === 'poor').length
      },
      topStation: data.reduce((max, s) => 
        s.overall_investment_score > max.overall_investment_score ? s : max, data[0])
    },
    stations: data
  };

  const json = JSON.stringify(exportData, null, 2);
  downloadFile(json, 'ground_stations_export.json', 'application/json');
};

const exportAsReport = (data) => {
  // Create HTML report
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Ground Station Investment Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #2c3e50; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; font-weight: bold; }
    .excellent { color: #28a745; font-weight: bold; }
    .good { color: #ffc107; font-weight: bold; }
    .moderate { color: #fd7e14; font-weight: bold; }
    .poor { color: #dc3545; font-weight: bold; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>Ground Station Investment Analysis Report</h1>
  
  <div class="summary">
    <h2>Executive Summary</h2>
    <p><strong>Total Stations Analyzed:</strong> ${data.length}</p>
    <p><strong>Average Investment Score:</strong> ${(data.reduce((sum, s) => sum + s.overall_investment_score, 0) / data.length).toFixed(1)}</p>
    <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
  </div>

  <h2>Investment Opportunities</h2>
  <table>
    <thead>
      <tr>
        <th>Station Name</th>
        <th>Operator</th>
        <th>Country</th>
        <th>Investment Score</th>
        <th>Recommendation</th>
        <th>Key Capabilities</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .sort((a, b) => b.overall_investment_score - a.overall_investment_score)
        .map(station => `
          <tr>
            <td>${station.name}</td>
            <td>${station.operator}</td>
            <td>${station.country}</td>
            <td>${station.overall_investment_score.toFixed(1)}</td>
            <td class="${station.investment_recommendation}">${station.investment_recommendation.toUpperCase()}</td>
            <td>${station.frequency_bands} • ${station.primary_antenna_size_m}m</td>
          </tr>
        `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This report uses real commercial ground station locations with BI-level investment analysis methodology.</p>
    <p>Data sources include operator public documentation and industry-standard technical calculations.</p>
  </div>
</body>
</html>
  `;

  downloadFile(html, 'ground_stations_report.html', 'text/html');
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Utility to filter stations by bounds
export const filterStationsByBounds = (stations, bounds) => {
  if (!bounds || !stations) return stations;
  
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  return stations.filter(station => {
    const lat = station.latitude;
    const lng = station.longitude;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  });
};

// Calculate statistics for a set of stations
export const calculateStats = (stations) => {
  if (!stations || stations.length === 0) {
    return {
      count: 0,
      avgScore: 0,
      topStations: []
    };
  }

  return {
    count: stations.length,
    avgScore: stations.reduce((sum, s) => sum + s.overall_investment_score, 0) / stations.length,
    topStations: stations
      .sort((a, b) => b.overall_investment_score - a.overall_investment_score)
      .slice(0, 5)
  };
};