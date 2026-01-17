/**
 * HistoricalChart - Main exports
 */

// Main class
export { HistoricalChart } from './HistoricalChart.js';

// Managers
export { AxisManager } from './AxisManager.js';
export { IndexAxisManager } from './IndexAxisManager.js';
export { ZoomManager } from './ZoomManager.js';
export { ScrollManager } from './ScrollManager.js';
export { TooltipManager } from './TooltipManager.js';

// Renderers
export { LabelRenderer } from './LabelRenderer.js';
export { BarRenderer } from './BarRenderer.js';
export { GroupBarRenderer } from './GroupBarRenderer.js';

// Data structures
export { LaneNode } from './LaneNode.js';

// Axis configurations - Western (Gregorian) calendar
export * as westernAxises from './axises/westernAxises.js';

// Axis configurations - Chinese Lunar calendar (lunar-javascript, 1 CE - 9999 CE)
export * as lunarAxises from './axises/lunarAxises.js';
export { initLunar, isLunarLoaded } from './axises/lunarAxises.js';

// Axis configurations - Chinese calendar (ChineseCalendar, 722 BCE - 2200 CE)
export * as chineseCalendarAxises from './axises/chineseCalendarAxises.js';
export { initChineseCalendar, isChineseCalendarLoaded, getAxises as getChineseCalendarAxises } from './axises/chineseCalendarAxises.js';

// Styles
export { LIGHT, DARK } from './style.js';

// Utilities
export {
  assignRowsLanes,
  assignRowsNaive,
  assignRowsStackI,
  assignRowsStackII,
  getLayoutAlgorithm,
  getMaxRow
} from './utils/layout.js';

export {
  getHoursPerPixel,
  getPixelsPerHour,
  calculateScaleExtent,
  isBCE,
  formatDate,
  clampDomain,
  MS_PER_HOUR
} from './utils/scales.js';
