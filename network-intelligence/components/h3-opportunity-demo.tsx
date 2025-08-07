/**
 * H3 Opportunity Analysis Demo Component
 * Demonstrates how to use the H3 Grid Service for ground station opportunity analysis
 */

'use client';

import React, { useState, useCallback } from 'react';
import { generateGroundStationOpportunities, h3GridService } from '@/lib/services/h3GridService';
import type { H3HexagonOpportunity } from '@/lib/services/h3GridService';

interface DemoState {
  isLoading: boolean;
  opportunities: H3HexagonOpportunity[];
  summary: any;
  error: string | null;
  selectedRegion: string;
  maxOpportunities: number;
  minScore: number;
}

const H3OpportunityDemo: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    isLoading: false,
    opportunities: [],
    summary: null,
    error: null,
    selectedRegion: 'global',
    maxOpportunities: 25,
    minScore: 60
  });

  const analyzeOpportunities = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const focusRegions = state.selectedRegion === 'global' ? undefined : [
        {
          name: 'North America',
          bounds: { minLat: 25, maxLat: 60, minLon: -140, maxLon: -60 }
        },
        {
          name: 'Europe',
          bounds: { minLat: 35, maxLat: 70, minLon: -10, maxLon: 40 }
        },
        {
          name: 'Asia Pacific',
          bounds: { minLat: -10, maxLat: 50, minLon: 95, maxLon: 180 }
        }
      ];

      const analysis = generateGroundStationOpportunities({
        resolutions: [5, 6], // Medium and detailed view
        globalAnalysis: state.selectedRegion === 'global',
        focusRegions,
        maxOpportunities: state.maxOpportunities
      });

      // Filter by minimum score
      const filteredOpportunities = h3GridService.filterOpportunities(
        analysis.topOpportunities,
        { minScore: state.minScore }
      );

      setState(prev => ({
        ...prev,
        opportunities: filteredOpportunities.slice(0, 20),
        summary: analysis.summary,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error analyzing opportunities:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false
      }));
    }
  }, [state.selectedRegion, state.maxOpportunities, state.minScore]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very_high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          H3 Ground Station Opportunity Analysis
        </h1>
        <p className="text-gray-600 mb-6">
          Discover optimal locations for ground station deployment using H3 hexagonal grid analysis
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Region
            </label>
            <select
              value={state.selectedRegion}
              onChange={(e) => setState(prev => ({ ...prev, selectedRegion: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="global">Global Analysis</option>
              <option value="regional">Focus Regions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Opportunities
            </label>
            <input
              type="number"
              value={state.maxOpportunities}
              onChange={(e) => setState(prev => ({ ...prev, maxOpportunities: parseInt(e.target.value) || 25 }))}
              min="10"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Score
            </label>
            <input
              type="number"
              value={state.minScore}
              onChange={(e) => setState(prev => ({ ...prev, minScore: parseInt(e.target.value) || 60 }))}
              min="0"
              max="100"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={analyzeOpportunities}
          disabled={state.isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {state.isLoading ? 'Analyzing...' : 'Analyze Opportunities'}
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {state.error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {state.summary && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{state.summary.totalHexagons}</div>
              <div className="text-sm text-blue-800">Total Hexagons</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{state.summary.averageScore}</div>
              <div className="text-sm text-green-800">Average Score</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(state.summary.totalInvestmentPotential / 1000000)}M
              </div>
              <div className="text-sm text-purple-800">Investment Potential</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(state.summary.totalRevenuePotential / 1000000)}M
              </div>
              <div className="text-sm text-orange-800">Revenue Potential</div>
            </div>
          </div>
        </div>
      )}

      {/* Opportunities List */}
      {state.opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Top Ground Station Opportunities ({state.opportunities.length})
          </h2>
          <div className="space-y-4">
            {state.opportunities.map((opportunity, index) => (
              <div key={opportunity.h3Index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{index + 1} - Score: {opportunity.overallScore}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(opportunity.riskLevel)}`}>
                        {opportunity.riskLevel.replace('_', ' ')} risk
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Location</div>
                        <div className="font-medium">
                          {opportunity.centerLat.toFixed(3)}, {opportunity.centerLon.toFixed(3)}
                        </div>
                        <div className="text-gray-500">{opportunity.country || 'Unknown'}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600">Market & Competition</div>
                        <div className="font-medium">Market: {opportunity.marketScore}/100</div>
                        <div className="text-gray-500">Competition: {opportunity.competitionScore}/100</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600">Environment</div>
                        <div className="font-medium">Weather: {opportunity.weatherScore}/100</div>
                        <div className="text-gray-500">Terrain: {opportunity.terrainSuitability}/100</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600">Financial</div>
                        <div className="font-medium">ROI: {opportunity.estimatedROI}%</div>
                        <div className="text-gray-500">Payback: {opportunity.paybackYears}yr</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Investment Required</div>
                        <div className="text-xl font-bold text-blue-600">
                          {formatCurrency(opportunity.estimatedInvestment)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Annual Revenue Projection</div>
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(opportunity.projectedAnnualRevenue)}
                        </div>
                      </div>
                    </div>

                    {opportunity.nearestCompetitor.station && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Nearest Competitor: </span>
                        <span className="font-medium">
                          {opportunity.nearestCompetitor.station.name} 
                          ({opportunity.nearestCompetitor.distanceKm.toFixed(1)} km away)
                        </span>
                      </div>
                    )}

                    {opportunity.specialFactors.length > 0 && (
                      <div className="mt-3">
                        <div className="text-gray-600 text-sm mb-1">Special Factors:</div>
                        <div className="flex flex-wrap gap-1">
                          {opportunity.specialFactors.map((factor, i) => (
                            <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.isLoading && (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing ground station opportunities...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments as we process hexagonal grids and competition data
          </p>
        </div>
      )}
    </div>
  );
};

export default H3OpportunityDemo;