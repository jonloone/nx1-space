import React from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  padding: 0;
`;

const Section = styled.div`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #444;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatLabel = styled.span`
  color: #666;
  font-size: 14px;
`;

const StatValue = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;

const ProgressBar = styled.div`
  background: #e9ecef;
  border-radius: 4px;
  height: 8px;
  margin: 5px 0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.color || '#28a745'};
  width: ${props => props.width}%;
  transition: width 0.3s ease;
`;

const StationItem = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
  
  &:hover {
    background: #e9ecef;
  }
`;

const StationName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const StationDetails = styled.div`
  font-size: 13px;
  color: #666;
  display: flex;
  justify-content: space-between;
`;

const ColorLegend = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const ColorDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
  margin-right: 8px;
`;

const ExportButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background: #0056b3;
  }
`;

const StatsPanel = ({ data }) => {
  if (!data) {
    return (
      <Panel>
        <Section>
          <p>Loading ground station data...</p>
        </Section>
      </Panel>
    );
  }

  const { 
    totalStations, 
    avgScore, 
    excellentCount, 
    goodCount, 
    moderateCount, 
    poorCount,
    topStations,
    operatorBreakdown
  } = data;

  const getRecommendationColor = (recommendation) => {
    const colors = {
      excellent: '#28a745',
      good: '#ffc107',
      moderate: '#fd7e14',
      poor: '#dc3545'
    };
    return colors[recommendation] || '#6c757d';
  };

  const exportData = (format) => {
    // Implementation for data export
    console.log(`Exporting data as ${format}`);
    // Add actual export logic here
  };

  return (
    <Panel>
      <Section>
        <SectionTitle>Overview</SectionTitle>
        <StatCard>
          <StatLabel>Total Ground Stations</StatLabel>
          <StatValue>{totalStations}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Average Investment Score</StatLabel>
          <StatValue>{avgScore?.toFixed(1)}</StatValue>
        </StatCard>
      </Section>

      <Section>
        <SectionTitle>Investment Distribution</SectionTitle>
        
        <ColorLegend>
          <ColorDot color="#28a745" />
          <StatLabel>Excellent ({excellentCount})</StatLabel>
        </ColorLegend>
        <ProgressBar>
          <ProgressFill 
            width={(excellentCount / totalStations) * 100} 
            color="#28a745" 
          />
        </ProgressBar>

        <ColorLegend>
          <ColorDot color="#ffc107" />
          <StatLabel>Good ({goodCount})</StatLabel>
        </ColorLegend>
        <ProgressBar>
          <ProgressFill 
            width={(goodCount / totalStations) * 100} 
            color="#ffc107" 
          />
        </ProgressBar>

        <ColorLegend>
          <ColorDot color="#fd7e14" />
          <StatLabel>Moderate ({moderateCount})</StatLabel>
        </ColorLegend>
        <ProgressBar>
          <ProgressFill 
            width={(moderateCount / totalStations) * 100} 
            color="#fd7e14" 
          />
        </ProgressBar>

        <ColorLegend>
          <ColorDot color="#dc3545" />
          <StatLabel>Poor ({poorCount})</StatLabel>
        </ColorLegend>
        <ProgressBar>
          <ProgressFill 
            width={(poorCount / totalStations) * 100} 
            color="#dc3545" 
          />
        </ProgressBar>
      </Section>

      <Section>
        <SectionTitle>Top Investment Opportunities</SectionTitle>
        {topStations?.map((station, index) => (
          <StationItem key={station.station_id || index}>
            <StationName>{station.name}</StationName>
            <StationDetails>
              <span>{station.operator} • {station.country}</span>
              <span style={{ 
                color: getRecommendationColor(station.investment_recommendation),
                fontWeight: 600 
              }}>
                {station.overall_investment_score.toFixed(1)}
              </span>
            </StationDetails>
          </StationItem>
        ))}
      </Section>

      <Section>
        <SectionTitle>Operator Distribution</SectionTitle>
        {Object.entries(operatorBreakdown || {}).map(([operator, count]) => (
          <StatCard key={operator}>
            <StatLabel>{operator}</StatLabel>
            <StatValue>{count}</StatValue>
          </StatCard>
        ))}
      </Section>

      <ExportButton onClick={() => exportData('csv')}>
        Export Filtered Data
      </ExportButton>
    </Panel>
  );
};

export default StatsPanel;