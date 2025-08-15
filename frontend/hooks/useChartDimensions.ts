import { useState, useEffect, useRef, useCallback } from 'react';

interface Dimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  boundedWidth: number;
  boundedHeight: number;
}

interface UseChartDimensionsOptions {
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
  debounceMs?: number;
}

export const useChartDimensions = ({
  marginTop = 20,
  marginRight = 20,
  marginBottom = 40,
  marginLeft = 60,
  aspectRatio = 16 / 9,
  minHeight = 200,
  maxHeight = 600,
  debounceMs = 100,
}: UseChartDimensionsOptions = {}): [
  React.RefObject<HTMLDivElement>,
  Dimensions
] => {
  const ref = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
    margin: {
      top: marginTop,
      right: marginRight,
      bottom: marginBottom,
      left: marginLeft,
    },
    boundedWidth: 0,
    boundedHeight: 0,
  });

  const updateDimensions = useCallback(() => {
    if (!ref.current) return;

    const { width } = ref.current.getBoundingClientRect();
    let height = width / aspectRatio;
    
    // Apply height constraints
    height = Math.max(minHeight, Math.min(maxHeight, height));

    const newDimensions: Dimensions = {
      width,
      height,
      margin: {
        top: marginTop,
        right: marginRight,
        bottom: marginBottom,
        left: marginLeft,
      },
      boundedWidth: Math.max(0, width - marginLeft - marginRight),
      boundedHeight: Math.max(0, height - marginTop - marginBottom),
    };

    setDimensions(newDimensions);
  }, [aspectRatio, minHeight, maxHeight, marginTop, marginRight, marginBottom, marginLeft]);

  useEffect(() => {
    if (!ref.current) return;

    // Initial measurement
    updateDimensions();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  return [ref, dimensions];
};