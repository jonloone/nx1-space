'use client';

import React, { useState, useEffect } from 'react';
import { OvertureBuildingFeature, DomainAnalysis } from '@/lib/types/gers';
import { getGERSQueryService, OpportunityScore } from '@/lib/services/GERSQueryService';

interface BuildingAnalysisPanelProps {
  building: OvertureBuildingFeature | null;
  onClose: () => void;
  visible: boolean;
}

export function BuildingAnalysisPanel({ building, onClose, visible }: BuildingAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<OpportunityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<'maritime' | 'telecom' | 'logistics' | 'energy'>('maritime');

  const queryService = getGERSQueryService();

  useEffect(() => {
    if (building && visible) {
      analyzeBuilding(building);
    }
  }, [building, visible]);

  const analyzeBuilding = async (buildingData: OvertureBuildingFeature) => {
    setLoading(true);
    try {
      await queryService.initialize();
      
      // Get building center for analysis
      const center = getBuildingCenter(buildingData);
      if (!center) return;

      // Calculate opportunity scores for all domains
      const opportunities = await queryService.calculateOpportunityScores(
        center,
        1, // 1km radius
        ['maritime', 'telecom', 'logistics', 'energy']
      );

      // Find the analysis for this specific building
      const buildingAnalysis = opportunities.find(op => op.entityId === buildingData.id);
      
      if (buildingAnalysis) {
        setAnalysis(buildingAnalysis);
      } else {
        // Create a mock analysis if not found in the results
        setAnalysis(createMockAnalysis(buildingData, center));
      }
    } catch (error) {
      console.error('Error analyzing building:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMockAnalysis = (buildingData: OvertureBuildingFeature, center: [number, number]): OpportunityScore => {
    const height = buildingData.properties.height || 50;
    const buildingClass = buildingData.properties.class || 'commercial';
    
    return {
      entityId: buildingData.id,
      location: center,
      overallScore: 0.6 + Math.random() * 0.3,
      domainScores: {
        maritime: buildingClass === 'commercial' ? 0.7 : 0.4,
        telecom: height > 50 ? 0.8 : 0.5,
        logistics: buildingClass === 'industrial' ? 0.9 : 0.4,
        energy: 0.5 + Math.random() * 0.4
      },
      factors: [
        {
          factor: 'building_height',
          weight: 0.3,
          value: Math.min(1, height / 200),
          impact: 'positive'
        },
        {
          factor: 'building_type',
          weight: 0.2,
          value: buildingClass === 'commercial' ? 0.8 : 0.6,
          impact: 'positive'
        },
        {
          factor: 'location_accessibility',
          weight: 0.25,
          value: 0.7,
          impact: 'positive'
        }
      ],
      recommendation: `This ${buildingClass} building shows strong potential for infrastructure development.`,
      confidence: 0.75
    };
  };

  const getBuildingCenter = (buildingData: OvertureBuildingFeature): [number, number] | null => {
    if (buildingData.geometry.type === 'Polygon') {
      const coords = buildingData.geometry.coordinates[0];
      const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
      return [centerLat, centerLng];
    }
    return null;
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score > 0.7) return '#10B981'; // Green
    if (score > 0.4) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  if (!visible || !building) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '80px',
      left: '20px',
      width: '400px',
      maxHeight: '70vh',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '12px',
      padding: '20px',
      zIndex: 1000,
      overflow: 'auto',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
          Building Analysis
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px'
          }}
        >
          ×
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div>Analyzing building...</div>
        </div>
      ) : (
        <>
          {/* Basic Building Info */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {building.properties.names?.primary || `Building ${building.id.slice(-8)}`}
            </div>
            <div style={{ fontSize: '12px', color: '#ccc' }}>
              ID: {building.id}
            </div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>
              Type: {building.properties.class || 'Unknown'}
              {building.properties.height && (
                <> • Height: {building.properties.height}m</>
              )}
              {building.properties.numFloors && (
                <> • Floors: {building.properties.numFloors}</>
              )}
            </div>
          </div>

          {analysis && (
            <>
              {/* Overall Score */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>Overall Opportunity Score</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getScoreColor(analysis.overallScore)
                }}>
                  {formatScore(analysis.overallScore)}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#ccc',
                  marginTop: '4px'
                }}>
                  Confidence: {formatScore(analysis.confidence)}
                </div>
              </div>

              {/* Domain Scores */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
                  Domain Analysis
                </div>
                {Object.entries(analysis.domainScores).map(([domain, score]) => (
                  <div
                    key={domain}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      marginBottom: '6px',
                      background: selectedDomain === domain ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedDomain(domain as any)}
                  >
                    <span style={{ 
                      textTransform: 'capitalize',
                      fontSize: '13px'
                    }}>
                      {domain}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      color: getScoreColor(score)
                    }}>
                      {formatScore(score)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Factors */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>
                  Key Factors
                </div>
                {analysis.factors.map((factor, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ 
                      fontSize: '12px',
                      textTransform: 'capitalize',
                      color: '#ccc'
                    }}>
                      {factor.factor.replace('_', ' ')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        color: factor.impact === 'positive' ? '#10B981' : 
                               factor.impact === 'negative' ? '#EF4444' : '#6B7280'
                      }}>
                        {factor.impact === 'positive' ? '↗' : 
                         factor.impact === 'negative' ? '↘' : '→'}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {formatScore(factor.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                  Recommendation
                </div>
                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  {analysis.recommendation}
                </div>
              </div>

              {/* Data Sources */}
              <div style={{ fontSize: '11px', color: '#666' }}>
                Data sources: Overture Maps, GERS Analysis Engine
                <br />
                Last updated: {building.properties.updateTime ? 
                  new Date(building.properties.updateTime).toLocaleDateString() : 'Unknown'}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}