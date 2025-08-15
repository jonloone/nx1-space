import { scaleLinear, scaleTime, scaleBand, scaleOrdinal } from '@visx/scale';
import { extent, max, min } from 'd3-array';
import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';

// Number formatters
export const formatters = {
  number: format(',.0f'),
  decimal: format(',.2f'),
  percent: format('.1%'),
  compact: format('.2s'),
  currency: format('$,.2f'),
};

// Time formatters
export const timeFormatters = {
  hour: timeFormat('%H:%M'),
  day: timeFormat('%b %d'),
  month: timeFormat('%b %Y'),
  year: timeFormat('%Y'),
  full: timeFormat('%b %d, %Y %H:%M'),
};

// Scale helpers
export const createScales = {
  linear: (data: number[], range: [number, number]) => {
    const [minVal, maxVal] = extent(data) as [number, number];
    return scaleLinear<number>({
      domain: [minVal * 0.9, maxVal * 1.1], // Add 10% padding
      range,
      nice: true,
    });
  },

  time: (data: Date[], range: [number, number]) => {
    const [minDate, maxDate] = extent(data) as [Date, Date];
    return scaleTime<number>({
      domain: [minDate, maxDate],
      range,
    });
  },

  band: (data: string[], range: [number, number], padding = 0.1) => {
    return scaleBand<string>({
      domain: data,
      range,
      padding,
    });
  },

  ordinal: (domain: string[], range: string[]) => {
    return scaleOrdinal<string, string>({
      domain,
      range,
    });
  },
};

// Chart dimensions helper
export const getChartDimensions = (
  width: number,
  height: number,
  margin = { top: 20, right: 20, bottom: 40, left: 60 }
) => ({
  width,
  height,
  margin,
  innerWidth: width - margin.left - margin.right,
  innerHeight: height - margin.top - margin.bottom,
  boundedWidth: width - margin.left - margin.right,
  boundedHeight: height - margin.top - margin.bottom,
});

// Tooltip position calculator
export const getTooltipPosition = (
  event: React.MouseEvent,
  containerBounds: DOMRect
) => {
  const x = event.clientX - containerBounds.left;
  const y = event.clientY - containerBounds.top;
  
  // Determine if tooltip should appear left or right
  const showLeft = x > containerBounds.width / 2;
  // Determine if tooltip should appear above or below
  const showAbove = y > containerBounds.height / 2;
  
  return {
    x: showLeft ? x - 10 : x + 10,
    y: showAbove ? y - 10 : y + 10,
    anchor: `${showAbove ? 'bottom' : 'top'}-${showLeft ? 'right' : 'left'}`,
  };
};

// Data extent calculator with padding
export const getDataExtent = (
  data: number[],
  padding = 0.1
): [number, number] => {
  const minVal = min(data) || 0;
  const maxVal = max(data) || 1;
  const range = maxVal - minVal;
  return [minVal - range * padding, maxVal + range * padding];
};

// Responsive text size calculator
export const getResponsiveTextSize = (width: number) => {
  if (width < 400) return { axis: 10, label: 8, title: 12 };
  if (width < 600) return { axis: 11, label: 9, title: 14 };
  return { axis: 12, label: 10, title: 16 };
};

// Grid line generator
export const generateGridLines = (
  scale: any,
  length: number,
  orientation: 'horizontal' | 'vertical'
) => {
  const ticks = scale.ticks ? scale.ticks() : scale.domain();
  return ticks.map((tick: any) => {
    const position = scale(tick);
    return {
      key: `grid-${tick}`,
      x1: orientation === 'vertical' ? position : 0,
      y1: orientation === 'vertical' ? 0 : position,
      x2: orientation === 'vertical' ? position : length,
      y2: orientation === 'vertical' ? length : position,
    };
  });
};

// Animation helpers
export const springConfig = {
  stiffness: 300,
  damping: 30,
};

export const easeConfig = {
  duration: 300,
  ease: 'easeInOut',
};