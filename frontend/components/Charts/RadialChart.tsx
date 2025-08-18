'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Arc, LineRadial } from '@visx/shape';
import { Text } from '@visx/text';
import { scaleLinear, scaleTime } from '@visx/scale';
import { curveLinearClosed, curveBasisOpen } from '@visx/curve';
import { Point } from '@visx/point';
import { GradientOrangeRed, GradientPinkRed, GradientTealBlue } from '@visx/gradient';

export interface SatellitePass {
  satelliteId: string;
  satelliteName: string;
  timestamp: Date;
  elevation: number; // 0-90 degrees
  azimuth: number; // 0-360 degrees
  signalStrength?: number; // 0-1
  doppler?: number; // kHz
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface RadialChartProps {
  width: number;
  height: number;
  data: SatellitePass[];
  currentTime?: Date;
  showGrid?: boolean;
  showLabels?: boolean;
  animated?: boolean;
}

const priorityColors = {
  critical: '#FF0040',
  high: '#FF8C00',
  medium: '#00C896',
  low: '#0066FF',
};

export const RadialChart: React.FC<RadialChartProps> = ({
  width,
  height,
  data,
  currentTime = new Date(),
  showGrid = true,
  showLabels = true,
  animated = true,
}) => {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;
  const radius = Math.min(innerWidth, innerHeight) / 2;

  // Scales
  const elevationScale = useMemo(
    () =>
      scaleLinear({
        domain: [90, 0], // 90 degrees at center, 0 at edge (horizon)
        range: [0, radius * 0.9],
      }),
    [radius]
  );

  const azimuthScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, 360],
        range: [0, 2 * Math.PI],
      }),
    []
  );

  // Convert polar to cartesian coordinates
  const polarToCartesian = (elevation: number, azimuth: number) => {
    const r = elevationScale(elevation);
    const theta = azimuthScale(azimuth) - Math.PI / 2; // Adjust so 0° is at top
    return {
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
    };
  };

  // Group passes by satellite
  const satellitePasses = useMemo(() => {
    const grouped = new Map<string, SatellitePass[]>();
    data.forEach((pass) => {
      if (!grouped.has(pass.satelliteId)) {
        grouped.set(pass.satelliteId, []);
      }
      grouped.get(pass.satelliteId)!.push(pass);
    });
    return Array.from(grouped.entries()).map(([id, passes]) => ({
      satelliteId: id,
      satelliteName: passes[0].satelliteName,
      passes: passes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      priority: passes[0].priority || 'low',
    }));
  }, [data]);

  // Generate elevation circles
  const elevationCircles = [0, 30, 60, 90];

  // Generate azimuth lines
  const azimuthLines = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg width={width} height={height}>
      <GradientOrangeRed id="radar-orange-red" />
      <GradientPinkRed id="radar-pink-red" />
      <GradientTealBlue id="radar-teal-blue" />

      <Group left={margin.left + centerX} top={margin.top + centerY}>
        {/* Background */}
        <circle
          r={radius}
          fill="rgba(0, 0, 0, 0.8)"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={1}
        />

        {/* Elevation circles (grid) */}
        {showGrid &&
          elevationCircles.map((elevation) => {
            const r = elevationScale(elevation);
            return (
              <g key={`elevation-${elevation}`}>
                <circle
                  r={r}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                {showLabels && elevation > 0 && (
                  <Text
                    x={0}
                    y={-r}
                    fill="rgba(255, 255, 255, 0.3)"
                    fontSize={10}
                    textAnchor="middle"
                    dy="-4"
                  >
                    {elevation}°
                  </Text>
                )}
              </g>
            );
          })}

        {/* Azimuth lines (grid) */}
        {showGrid &&
          azimuthLines.map((azimuth) => {
            const angle = azimuthScale(azimuth) - Math.PI / 2;
            const x2 = radius * 0.9 * Math.cos(angle);
            const y2 = radius * 0.9 * Math.sin(angle);
            return (
              <g key={`azimuth-${azimuth}`}>
                <line
                  x1={0}
                  y1={0}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth={0.5}
                />
                {showLabels && (
                  <Text
                    x={x2 * 1.1}
                    y={y2 * 1.1}
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize={12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {azimuth}°
                  </Text>
                )}
              </g>
            );
          })}

        {/* Cardinal directions */}
        {showLabels && (
          <>
            <Text
              x={0}
              y={-radius - 5}
              fill="rgba(255, 255, 255, 0.7)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
            >
              N
            </Text>
            <Text
              x={radius + 5}
              y={0}
              fill="rgba(255, 255, 255, 0.7)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              E
            </Text>
            <Text
              x={0}
              y={radius + 15}
              fill="rgba(255, 255, 255, 0.7)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
            >
              S
            </Text>
            <Text
              x={-radius - 5}
              y={0}
              fill="rgba(255, 255, 255, 0.7)"
              fontSize={14}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              W
            </Text>
          </>
        )}

        {/* Satellite passes */}
        {satellitePasses.map((satellite, i) => {
          const color = priorityColors[satellite.priority];
          const points = satellite.passes.map((pass) =>
            polarToCartesian(pass.elevation, pass.azimuth)
          );

          if (points.length === 0) return null;

          return (
            <g key={satellite.satelliteId}>
              {/* Pass trajectory */}
              {points.length > 1 && (
                <LineRadial
                  data={points}
                  x={(d) => d.x}
                  y={(d) => d.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  fill="none"
                  curve={curveBasisOpen}
                />
              )}

              {/* Current position (last point) */}
              {points.length > 0 && (
                <g
                  transform={`translate(${points[points.length - 1].x}, ${
                    points[points.length - 1].y
                  })`}
                >
                  {/* Pulsing animation for active satellites */}
                  {animated && (
                    <circle r={8} fill={color} opacity={0.3}>
                      <animate
                        attributeName="r"
                        values="8;16;8"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.3;0.1;0.3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* Satellite marker */}
                  <circle
                    r={4}
                    fill={color}
                    stroke="white"
                    strokeWidth={1}
                  />

                  {/* Satellite label */}
                  {showLabels && (
                    <Text
                      x={0}
                      y={-10}
                      fill="white"
                      fontSize={10}
                      textAnchor="middle"
                      style={{
                        textShadow: '0 0 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      {satellite.satelliteName}
                    </Text>
                  )}

                  {/* Signal strength indicator */}
                  {satellite.passes[satellite.passes.length - 1].signalStrength && (
                    <g>
                      <Arc
                        innerRadius={6}
                        outerRadius={10}
                        startAngle={0}
                        endAngle={
                          2 *
                          Math.PI *
                          satellite.passes[satellite.passes.length - 1].signalStrength!
                        }
                        fill={color}
                        opacity={0.8}
                      />
                    </g>
                  )}
                </g>
              )}

              {/* Pass history trail */}
              {points.slice(0, -1).map((point, idx) => (
                <circle
                  key={`${satellite.satelliteId}-trail-${idx}`}
                  cx={point.x}
                  cy={point.y}
                  r={1}
                  fill={color}
                  opacity={0.3 + (idx / points.length) * 0.3}
                />
              ))}
            </g>
          );
        })}

        {/* Center crosshair */}
        <g>
          <line
            x1={-5}
            y1={0}
            x2={5}
            y2={0}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={-5}
            x2={0}
            y2={5}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
          <circle
            r={2}
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
        </g>
      </Group>

      {/* Legend */}
      <Group left={margin.left} top={height - margin.bottom - 60}>
        <rect
          x={0}
          y={0}
          width={120}
          height={60}
          fill="rgba(0, 0, 0, 0.7)"
          stroke="rgba(255, 255, 255, 0.1)"
          rx={4}
        />
        <Text x={10} y={15} fill="white" fontSize={10} fontWeight="bold">
          Priority
        </Text>
        {Object.entries(priorityColors).slice(0, 4).map(([priority, color], i) => (
          <g key={priority} transform={`translate(10, ${25 + i * 10})`}>
            <circle r={3} fill={color} />
            <Text x={10} y={3} fill="rgba(255, 255, 255, 0.7)" fontSize={9}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </g>
        ))}
      </Group>

      {/* Timestamp */}
      {currentTime && (
        <Text
          x={width - margin.right}
          y={margin.top}
          fill="rgba(255, 255, 255, 0.5)"
          fontSize={10}
          textAnchor="end"
        >
          {currentTime.toLocaleTimeString()}
        </Text>
      )}
    </svg>
  );
};