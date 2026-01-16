/**
 * Scale utilities for HistoricalChart
 */

export const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Calculate hours per pixel from a time scale
 * @param {d3.ScaleTime} scale - D3 time scale
 * @returns {number} - Hours per pixel
 */
export function getHoursPerPixel(scale) {
  return Math.abs(scale.invert(0) - scale.invert(1)) / MS_PER_HOUR;
}

/**
 * Calculate pixels per hour from a time scale
 * @param {d3.ScaleTime} scale - D3 time scale
 * @returns {number} - Pixels per hour
 */
export function getPixelsPerHour(scale) {
  const domain = scale.domain();
  const range = scale.range();
  const totalHours = (domain[1] - domain[0]) / MS_PER_HOUR;
  const totalPixels = Math.abs(range[1] - range[0]);
  return totalPixels / totalHours;
}

/**
 * Calculate scale extent from zoom limits
 * @param {Array} timeDomain - [startDate, endDate]
 * @param {number} width - Chart width in pixels
 * @param {Array} zoomLimited - [minPixelsPerHour, maxPixelsPerHour], -1 means no limit
 * @returns {Array} - [minScale, maxScale] for d3.zoom().scaleExtent()
 */
export function calculateScaleExtent(timeDomain, width, zoomLimited) {
  const initialDensity = (timeDomain[1] - timeDomain[0]) / width / MS_PER_HOUR;
  const scaleExtent = [1, Infinity];

  if (zoomLimited[0] !== -1) {
    scaleExtent[0] = initialDensity * zoomLimited[0];
  }
  if (zoomLimited[1] !== -1) {
    scaleExtent[1] = initialDensity * zoomLimited[1];
  }

  return scaleExtent;
}

/**
 * Check if a date is BCE (before common era)
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export function isBCE(date) {
  return date.getTime() < new Date('0001-01-01').getTime();
}

/**
 * Format date with locale support and BCE handling
 * @param {Date} date - Date to format
 * @param {string} locale - Locale string (e.g., 'zh-cn', 'en-us')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, locale, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (isBCE(date)) {
    return date.toLocaleString(locale, { era: 'short', ...mergedOptions });
  }

  return date.toLocaleString(locale, mergedOptions);
}

/**
 * Clamp a domain to valid bounds
 * @param {Array} domain - [start, end]
 * @param {Array} bounds - [minStart, maxEnd]
 * @returns {Array} - Clamped domain
 */
export function clampDomain(domain, bounds) {
  return [
    Math.max(domain[0], bounds[0]),
    Math.min(domain[1], bounds[1])
  ];
}
