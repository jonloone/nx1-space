'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleLinear, scaleBand } from '@visx/scale';
import { scaleSequential } from 'd3-scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { HeatmapRect } from '@visx/heatmap';
import { interpolateViridis, interpolateInferno, interpolatePlasma, interpolateCool } from 'd3-scale-chromatic';
import { Text } from '@visx/text';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export interface HeatmapDataPoint {
  bin: string; // X-axis bin (e.g., time slot, frequency band)
  series: string; // Y-axis series (e.g., satellite, antenna)
  value: number; // Value to display (e.g., signal strength, BER)
  count?: number; // Optional count for the bin
  metadata?: any; // Additional metadata for tooltips
}

export interface HeatmapChartProps {
  width: number;
  height: number;
  data: HeatmapDataPoint[];
  xLabel?: string;
  yLabel?: string;
  colorScheme?: 'viridis' | 'inferno' | 'plasma' | 'cool';
  showValues?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
  minValue?: number;
  maxValue?: number;
  nullColor?: string;
}

const defaultMargin = { top: 40, right: 80, bottom: 60, left: 80 };

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  width,
  height,
  data,
  xLabel = 'Time',
  yLabel = 'Frequency',
  colorScheme = 'viridis',
  showValues = false,
  margin = defaultMargin,
  minValue,
  maxValue,
  nullColor = '#1a1a1a',
}) => {
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<HeatmapDataPoint>();

  // Dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Get unique bins and series
  const bins = useMemo(() => [...new Set(data.map(d => d.bin))], [data]);
  const series = useMemo(() => [...new Set(data.map(d => d.series))], [data]);

  // Create data map for fast lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    data.forEach(d => {
      map.set(`${d.bin}-${d.series}`, d);
    });
    return map;
  }, [data]);

  // Scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: bins,
        range: [0, innerWidth],
        padding: 0.05,
      }),
    [bins, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleBand<string>({
        domain: series,
        range: [0, innerHeight],
        padding: 0.05,
      }),
    [series, innerHeight]
  );

  // Color scale
  const colorScale = useMemo(() => {
    const interpolator = {
      viridis: interpolateViridis,
      inferno: interpolateInferno,
      plasma: interpolatePlasma,
      cool: interpolateCool,
    }[colorScheme];

    const min = minValue ?? Math.min(...data.map(d => d.value));
    const max = maxValue ?? Math.max(...data.map(d => d.value));

    return scaleSequential(interpolator)
      .domain([min, max]);
  }, [data, colorScheme, minValue, maxValue]);

  // Generate heatmap bins
  const heatmapBins = useMemo(() => {
    const result: {
      bin: string;
      bins: { bin: string; series: string; value: number | null; data?: HeatmapDataPoint }[];
    }[] = [];

    bins.forEach(bin => {
      const binData: { bin: string; series: string; value: number | null; data?: HeatmapDataPoint }[] = [];
      
      series.forEach(s => {
        const key = `${bin}-${s}`;
        const dataPoint = dataMap.get(key);
        binData.push({
          bin,
          series: s,
          value: dataPoint ? dataPoint.value : null,
          data: dataPoint,
        });
      });

      result.push({ bin, bins: binData });
    });

    return result;
  }, [bins, series, dataMap]);

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>, datum: any) => {
    const coords = localPoint(event.currentTarget.ownerSVGElement!, event);
    if (coords && datum.data) {
      showTooltip({
        tooltipLeft: coords.x,
        tooltipTop: coords.y,
        tooltipData: datum.data,
      });
    }
  };

  return (
    <>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="heatmap-legend" x1="0%" y1="0%" x2="100%" y2="0%">
            {Array.from({ length: 20 }, (_, i) => {
              const offset = (i / 19) * 100;
              const value = (i / 19) * (colorScale.domain()[1] - colorScale.domain()[0]) + colorScale.domain()[0];
              return (
                <stop
                  key={i}
                  offset={`${offset}%`}
                  stopColor={colorScale(value)}
                />
              );
            })}
          </linearGradient>
        </defs>

        <Group left={margin.left} top={margin.top}>
          {/* Heatmap */}
          <HeatmapRect
            data={heatmapBins}
            xScale={xScale}
            yScale={yScale}
            colorScale={colorScale}
            binWidth={xScale.bandwidth()}
            binHeight={yScale.bandwidth()}
            gap={0}
          >
            {heatmap =>
              heatmap.map(heatmapBins =>
                heatmapBins.map(bin => (
                  <rect
                    key={`heatmap-rect-${bin.bin}-${bin.series}`}
                    className="visx-heatmap-rect"
                    width={xScale.bandwidth()}
                    height={yScale.bandwidth()}
                    x={xScale(bin.bin)}
                    y={yScale(bin.series)}
                    fill={bin.value !== null ? colorScale(bin.value) : nullColor}
                    fillOpacity={bin.value !== null ? 1 : 0.3}
                    onMouseMove={(e) => handleMouseMove(e, bin)}
                    onMouseLeave={hideTooltip}
                    style={{ cursor: 'pointer' }}
                  />
                ))
              )
            }
          </HeatmapRect>

          {/* Show values on cells */}
          {showValues &&
            heatmapBins.map(bins =>
              bins.bins.map(bin => {
                if (bin.value === null) return null;
                const x = (xScale(bin.bin) ?? 0) + xScale.bandwidth() / 2;
                const y = (yScale(bin.series) ?? 0) + yScale.bandwidth() / 2;
                
                // Determine text color based on background brightness
                const bgColor = colorScale(bin.value);
                const brightness = getBrightness(bgColor);
                const textColor = brightness > 0.5 ? '#000' : '#fff';

                return (
                  <Text
                    key={`text-${bin.bin}-${bin.series}`}
                    x={x}
                    y={y}
                    fill={textColor}
                    fontSize={10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {bin.value.toFixed(1)}
                  </Text>
                );
              })
            )}

          {/* X Axis */}
          <AxisBottom
            scale={xScale}
            top={innerHeight}
            tickLabelProps={() => ({
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10,
              textAnchor: 'middle',
              angle: bins.length > 20 ? -45 : 0,
              dy: bins.length > 20 ? '0.5em' : '0.25em',
              dx: bins.length > 20 ? '-0.5em' : 0,
            })}
            stroke="rgba(255, 255, 255, 0.2)"
            tickStroke="rgba(255, 255, 255, 0.2)"
            tickFormat={(value) => {
              // Format time labels if they look like timestamps
              if (value.includes(':')) {
                return value.split(':')[0] + ':' + value.split(':')[1];
              }
              return value.length > 10 ? value.substring(0, 10) + '...' : value;
            }}
          />

          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
            tickLabelProps={() => ({
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10,
              textAnchor: 'end',
              dx: '-0.25em',
              dy: '0.25em',
            })}
            stroke="rgba(255, 255, 255, 0.2)"
            tickStroke="rgba(255, 255, 255, 0.2)"
            tickFormat={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
          />

          {/* Axis Labels */}
          {xLabel && (
            <Text
              x={innerWidth / 2}
              y={innerHeight + margin.bottom - 5}
              fill="rgba(255, 255, 255, 0.8)"
              fontSize={12}
              textAnchor="middle"
            >
              {xLabel}
            </Text>
          )}

          {yLabel && (
            <Text
              x={-innerHeight / 2}
              y={-margin.left + 15}
              fill="rgba(255, 255, 255, 0.8)"
              fontSize={12}
              textAnchor="middle"
              transform="rotate(-90)"
            >
              {yLabel}
            </Text>
          )}
        </Group>

        {/* Color Legend */}
        <Group left={width - margin.right + 10} top={margin.top}>
          <rect
            x={0}
            y={0}
            width={20}
            height={innerHeight}
            fill="url(#heatmap-legend)"
            transform={`rotate(180 10 ${innerHeight / 2})`}
          />
          
          {/* Legend ticks and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => {
            const value = colorScale.domain()[0] + tick * (colorScale.domain()[1] - colorScale.domain()[0]);
            const y = innerHeight * (1 - tick);
            
            return (
              <g key={tick}>
                <line
                  x1={20}
                  y1={y}
                  x2={25}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth={1}
                />
                <Text
                  x={28}
                  y={y}
                  fill="rgba(255, 255, 255, 0.7)"
                  fontSize={10}
                  dominantBaseline="middle"
                >
                  {value.toFixed(1)}
                </Text>
              </g>
            );
          })}
        </Group>

        {/* Title */}
        <Text
          x={width / 2}
          y={margin.top / 2}
          fill="rgba(255, 255, 255, 0.9)"
          fontSize={14}
          fontWeight="bold"
          textAnchor="middle"
        >
          Signal Quality Heatmap
        </Text>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '8px',
            color: 'white',
            fontSize: '12px',
          }}
        >
          <div>
            <strong>{tooltipData.series}</strong>
          </div>
          <div>{tooltipData.bin}</div>
          <div style={{ marginTop: '4px' }}>
            Value: <strong>{tooltipData.value.toFixed(2)}</strong>
          </div>
          {tooltipData.count && (
            <div>Count: {tooltipData.count}</div>
          )}
          {tooltipData.metadata && (
            <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.8 }}>
              {Object.entries(tooltipData.metadata).map(([key, value]) => (
                <div key={key}>
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          )}
        </TooltipWithBounds>
      )}
    </>
  );
};

// Helper function to calculate brightness of a color
function getBrightness(color: string): number {
  // Convert color to RGB (assuming hex format from d3)
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Calculate relative luminance
  return 0.299 * r + 0.587 * g + 0.114 * b;
}