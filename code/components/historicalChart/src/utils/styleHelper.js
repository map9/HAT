/**
 * Style helper utilities for applying D3 element styles
 * Extracts common style application logic from Renderers
 */

/**
 * Apply stroke styles to a D3 element
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object with stroke, strokeWidth, strokeDasharray
 */
export function applyStrokeStyle(element, style) {
  if (!style) return;

  if (style.stroke !== null && style.stroke !== undefined) {
    element.style('stroke', style.stroke);
  }
  if (style.strokeWidth !== null && style.strokeWidth !== undefined) {
    element.style('stroke-width', style.strokeWidth);
  }
  if (style.strokeDasharray !== null && style.strokeDasharray !== undefined) {
    element.style('stroke-dasharray', style.strokeDasharray);
  }
}

/**
 * Apply fill styles to a D3 element
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object with fill, fillOpacity
 */
export function applyFillStyle(element, style) {
  if (!style) return;

  if (style.fill !== null && style.fill !== undefined) {
    element.style('fill', style.fill);
  }
  if (style.fillOpacity !== null && style.fillOpacity !== undefined) {
    element.style('fill-opacity', style.fillOpacity);
  }
}

/**
 * Apply both stroke and fill styles to a D3 element
 * Common pattern for bars and shapes
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object
 * @param {boolean} hasStyleFn - Whether styleFn is provided (guards application)
 */
export function applyElementStyle(element, style, hasStyleFn = true) {
  if (!hasStyleFn || !style) return;

  applyStrokeStyle(element, style);
  applyFillStyle(element, style);
}