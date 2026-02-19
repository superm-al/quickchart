import { createCanvas } from 'canvas';

interface ColorStop {
  offset: number;
  color: string;
}

export function getGradientFunctions(width: number, height: number) {
  const getGradientFill = (
    colorOptions: ColorStop[],
    linearGradient: [number, number, number, number] = [0, 0, width, 0],
  ) => {
    return function colorFunction() {
      const ctx = createCanvas(20, 20).getContext('2d');
      const gradientFill = ctx.createLinearGradient(...linearGradient);
      colorOptions.forEach((options) => {
        gradientFill.addColorStop(options.offset, options.color);
      });
      return gradientFill;
    };
  };

  const getGradientFillHelper = (
    direction: 'horizontal' | 'vertical' | 'both',
    colors: string[],
    dimensions: { width?: number; height?: number } = {},
  ) => {
    const colorOptions: ColorStop[] = colors.map((color, idx) => ({
      color,
      offset: idx / (colors.length - 1 || 1),
    }));

    let linearGradient: [number, number, number, number] = [
      0,
      0,
      dimensions.width || width,
      0,
    ];
    if (direction === 'vertical') {
      linearGradient = [0, 0, 0, dimensions.height || height];
    } else if (direction === 'both') {
      linearGradient = [0, 0, dimensions.width || width, dimensions.height || height];
    }
    return getGradientFill(colorOptions, linearGradient);
  };

  return { getGradientFill, getGradientFillHelper };
}

export function patternDraw(
  shapeType: string,
  backgroundColor: string,
  patternColor: string,
  requestedSize: number,
) {
  return function doPatternDraw() {
    const size = Math.min(200, requestedSize) || 20;
    const pattern = require('patternomaly');
    // patternomaly requires a document global
    (globalThis as Record<string, unknown>).document = {
      createElement: () => createCanvas(size, size),
    };
    return pattern.draw(shapeType, backgroundColor, patternColor, size);
  };
}
