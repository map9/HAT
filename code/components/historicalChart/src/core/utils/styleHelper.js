/**
 * Style helper utilities for applying D3 element styles
 * Extracts common style application logic from Renderers
 */

/**
 * Clear all stroke inline styles from a D3 element
 * @param {d3.Selection} element - D3 selection
 */
export function clearStrokeStyle(element) {
  element.style('stroke', null)
    .style('stroke-width', null)
    .style('stroke-dasharray', null);
}

/**
 * Clear all fill inline styles from a D3 element
 * @param {d3.Selection} element - D3 selection
 */
export function clearFillStyle(element) {
  element.style('fill', null)
    .style('fill-opacity', null);
}

/**
 * Apply stroke styles to a D3 element
 * Unconditionally sets all properties — null values remove inline style, letting CSS take over
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object with stroke, strokeWidth, strokeDasharray
 */
export function applyStrokeStyle(element, style) {
  if (!style) return;

  element.style('stroke', style.stroke ?? null);
  element.style('stroke-width', style.strokeWidth ?? null);
  element.style('stroke-dasharray', style.strokeDasharray ?? null);
}

/**
 * Apply fill styles to a D3 element
 * Unconditionally sets all properties — null values remove inline style, letting CSS take over
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object with fill, fillOpacity
 */
export function applyFillStyle(element, style) {
  if (!style) return;

  element.style('fill', style.fill ?? null);
  element.style('fill-opacity', style.fillOpacity ?? null);
}

/**
 * Apply both stroke and fill styles to a D3 element
 * When styleFn is absent or returns null, clears all inline styles to let CSS take over
 * @param {d3.Selection} element - D3 selection
 * @param {Object} style - Style object
 * @param {boolean} hasStyleFn - Whether styleFn is provided (guards application)
 */
export function applyElementStyle(element, style, hasStyleFn = true) {
  if (!hasStyleFn || !style) {
    clearStrokeStyle(element);
    clearFillStyle(element);
    return;
  }

  applyStrokeStyle(element, style);
  applyFillStyle(element, style);
}