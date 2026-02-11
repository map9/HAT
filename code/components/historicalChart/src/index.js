/**
 * HistoricalChart - Main exports
 */

// Main class
export { HistoricalChart } from './core/HistoricalChart.js';

// Panel wrapper
export { HistoricalChartPanel } from './HistoricalChartPanel.js';

// Managers
export { AxisManager } from './core/AxisManager.js';
export { IndexAxisManager } from './core/IndexAxisManager.js';
export { ZoomManager } from './core/ZoomManager.js';
export { ScrollManager } from './core/ScrollManager.js';
export { TooltipManager } from './core/TooltipManager.js';
export { LayerManager } from './core/LayerManager.js';

// Layers
export { Layer, GridLayer, GroupBarLayer } from './core/layers';

// Axis configurations - Western (Gregorian) calendar
export * as westernAxises from './core/axises/westernAxises.js';

// Axis configurations - Chinese Lunar calendar (lunar-javascript, 1 CE - 9999 CE)
export * as lunarAxises from './core/axises/lunarAxises.js';
export { initLunar, isLunarLoaded } from './core/axises/lunarAxises.js';

// Axis configurations - Chinese calendar (ChineseCalendar, 722 BCE - 2200 CE)
export * as chineseCalendarAxises from './core/axises/chineseCalendarAxises.js';
export { initChineseCalendar, isChineseCalendarLoaded, getAxises as getChineseCalendarAxises } from './core/axises/chineseCalendarAxises.js';

// Styles
export { getSystemTheme, getAccentSchemes } from './core/theme.js';

// Utilities
export {
  assignRowsLanes,
  assignRowsNaive,
  assignRowsStackI,
  assignRowsStackII,
  getLayoutAlgorithm,
  getMaxRow
} from './core/utils/layout.js';

export {
  getHoursPerPixel,
  getPixelsPerHour,
  calculateScaleExtent,
  isBCE,
  formatDate,
  clampDomain,
  MS_PER_HOUR
} from './core/utils/scales.js';