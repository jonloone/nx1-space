'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent, max } from 'd3-array';
import { curveMonotoneX } from '@visx/curve';
import { Tooltip, useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { Line } from '@visx/shape';
import { formatters, timeFormatters } from '@/utils/chartHelpers';
import { colorScales } from '@/utils/colorScales';

export interface LineChartDataPoint {
  x: Date | number;
  y: number;
}

export interface LineChartSeries {
  id: string;
  data: LineChartDataPoint[];
  color?: string;
  name?: string;
}

interface LineChartProps {
  width: number;
  height: number;
  data: LineChartSeries | LineChartSeries[];
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  curve?: typeof curveMonotoneX;
  formatX?: (value: any) => string;
  formatY?: (value: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  width,
  height,
  data,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  xLabel,
  yLabel,
  showGrid = true,
  showTooltip = true,
  animate = true,
  curve = curveMonotoneX,
  formatX,
  formatY = formatters.decimal,
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip: showTooltipFunc,
    hideTooltip,
  } = useTooltip<{ series: string; x: any; y: number }>();

  // Normalize data to always be an array of series
  const series = useMemo(() => {
    return Array.isArray(data) ? data : [data];
  }, [data]);

  // Calculate dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Flatten all data points to determine scales
  const allData = useMemo(() => {
    return series.flatMap(s => s.data);
  }, [series]);

  // Create scales
  const xScale = useMemo(() => {
    const domain = extent(allData, d => d.x) as [any, any];
    const isTimeScale = domain[0] instanceof Date;
    
    if (isTimeScale) {
      return scaleTime({
        domain,
        range: [0, innerWidth],
      });
    } else {
      return scaleLinear({
        domain,
        range: [0, innerWidth],
        nice: true,
      });
    }
  }, [allData, innerWidth]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, max(allData, d => d.y) as number * 1.1],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [allData, innerHeight]);

  // Format functions
  const xFormatter = formatX || (
    allData[0]?.x instanceof Date ? timeFormatters.day : formatters.decimal
  );

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    if (!showTooltip) return;
    
    const point = localPoint(event.currentTarget, event);
    if (!point) return;

    const x = xScale.invert(point.x - margin.left);
    
    // Find closest data point
    let closestPoint: any = null;
    let closestSeries = '';
    let minDistance = Infinity;

    series.forEach(s => {
      s.data.forEach(d => {
        const distance = Math.abs(xScale(d.x) - (point.x - margin.left));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = d;
          closestSeries = s.name || s.id;
        }
      });
    });

    if (closestPoint) {
      showTooltipFunc({
        tooltipData: {
          series: closestSeries,
          x: closestPoint.x,
          y: closestPoint.y,
        },
        tooltipLeft: xScale(closestPoint.x) + margin.left,
        tooltipTop: yScale(closestPoint.y) + margin.top,
      });
    }
  };

  return (
    <>
      <svg width={width} height={height} onMouseMove={handleMouseMove} onMouseLeave={hideTooltip}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          {showGrid && (
            <>
              <GridRows
                scale={yScale}
                width={innerWidth}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="2,2"
              />
              <GridColumns
                scale={xScale}
                height={innerHeight}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="2,2"
              />
            </>
          )}

          {/* Lines */}
          {series.map((s, i) => {
            const lineColor = s.color || colorScales.categorical.default[i % colorScales.categorical.default.length];
            
            return (
              <LinePath
                key={s.id}
                data={s.data}
                x={(d) => xScale(d.x)}
                y={(d) => yScale(d.y)}
                stroke={lineColor}
                strokeWidth={2}
                curve={curve}
                strokeOpacity={animate ? 0 : 1}
              >
                {({ path }) => (
                  <motion.path
                    d={path(s.data) || ''}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={2}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: animate ? 1 : 0, ease: 'easeInOut' }}
                  />
                )}
              </LinePath>
            );
          })}

          {/* Axes */}
          <AxisLeft
            scale={yScale}
            stroke="rgba(255, 255, 255, 0.3)"
            tickStroke="rgba(255, 255, 255, 0.3)"
            tickLabelProps={() => ({
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10,
              textAnchor: 'end',
              dy: '0.33em',
            })}
            tickFormat={(value) => formatY(value as number)}
            label={yLabel}
            labelProps={{
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 12,
              textAnchor: 'middle',
            }}
          />
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="rgba(255, 255, 255, 0.3)"
            tickStroke="rgba(255, 255, 255, 0.3)"
            tickLabelProps={() => ({
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 10,
              textAnchor: 'middle',
            })}
            tickFormat={(value) => xFormatter(value)}
            label={xLabel}
            labelProps={{
              fill: 'rgba(255, 255, 255, 0.7)',
              fontSize: 12,
              textAnchor: 'middle',
            }}
          />

          {/* Tooltip indicator */}
          {tooltipOpen && tooltipData && (
            <>
              <Line
                from={{ x: xScale(tooltipData.x), y: 0 }}
                to={{ x: xScale(tooltipData.x), y: innerHeight }}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="2,2"
              />
              <circle
                cx={xScale(tooltipData.x)}
                cy={yScale(tooltipData.y)}
                r={4}
                fill="white"
                stroke="black"
                strokeWidth={2}
                pointerEvents="none"
              />
            </>
          )}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          <div>
            <strong>{tooltipData.series}</strong>
          </div>
          <div>{xFormatter(tooltipData.x)}</div>
          <div>{formatY(tooltipData.y)}</div>
        </Tooltip>
      )}
    </>
  );
};

// Add motion import
import { motion } from 'framer-motion';