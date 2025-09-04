'use client';

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { AreaClosed, Line } from '@visx/shape';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { extent, max } from 'd3-array';
import { curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { motion } from 'framer-motion';
// Simple formatters instead of importing from utils
const formatters = {
  decimal: (value: number) => value.toFixed(2),
  currency: (value: number) => `$${value.toFixed(2)}`,
  percent: (value: number) => `${value.toFixed(1)}%`,
};

const timeFormatters = {
  day: (date: Date) => date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  hour: (date: Date) => date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
  full: (date: Date) => date.toLocaleString(),
};

export interface AreaChartDataPoint {
  x: Date | number;
  y: number;
}

interface AreaChartProps {
  width: number;
  height: number;
  data: AreaChartDataPoint[];
  margin?: { top: number; right: number; bottom: number; left: number };
  xLabel?: string;
  yLabel?: string;
  showGrid?: boolean;
  animate?: boolean;
  curve?: typeof curveMonotoneX;
  formatX?: (value: any) => string;
  formatY?: (value: number) => string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showLine?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  width,
  height,
  data,
  margin = { top: 20, right: 20, bottom: 40, left: 60 },
  xLabel,
  yLabel,
  showGrid = true,
  animate = true,
  curve = curveMonotoneX,
  formatX,
  formatY = formatters.decimal,
  color = '#0066FF',
  gradientFrom = '#0066FF',
  gradientTo = 'rgba(0, 102, 255, 0.1)',
  showLine = true,
}) => {
  // Calculate dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create scales
  const xScale = useMemo(() => {
    const domain = extent(data, d => d.x) as [any, any];
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
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, (max(data, d => d.y) as number) * 1.1],
      range: [innerHeight, 0],
      nice: true,
    });
  }, [data, innerHeight]);

  // Format functions
  const xFormatter = formatX || (
    data[0]?.x instanceof Date ? timeFormatters.day : formatters.decimal
  );

  const gradientId = `area-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height}>
      <defs>
        <LinearGradient
          id={gradientId}
          from={gradientFrom}
          to={gradientTo}
          fromOpacity={0.8}
          toOpacity={0.1}
          vertical={true}
        />
      </defs>
      
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

        {/* Area */}
        <AreaClosed
          data={data}
          x={(d) => xScale(d.x)}
          y={(d) => yScale(d.y)}
          yScale={yScale}
          curve={curve}
          fill={`url(#${gradientId})`}
        >
          {({ path }) => (
            <motion.path
              d={path(data) || ''}
              fill={`url(#${gradientId})`}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ 
                duration: animate ? 0.8 : 0, 
                ease: 'easeOut',
                scaleY: { duration: animate ? 1 : 0 }
              }}
              style={{ transformOrigin: 'bottom' }}
            />
          )}
        </AreaClosed>

        {/* Line on top of area */}
        {showLine && (
          <Line
            data={data}
            x={(d) => xScale(d.x)}
            y={(d) => yScale(d.y)}
            stroke={color}
            strokeWidth={2}
            curve={curve}
          >
            {({ path }) => (
              <motion.path
                d={path(data) || ''}
                fill="none"
                stroke={color}
                strokeWidth={2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  duration: animate ? 1.2 : 0, 
                  ease: 'easeInOut',
                  delay: animate ? 0.3 : 0
                }}
              />
            )}
          </Line>
        )}

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
      </Group>
    </svg>
  );
};