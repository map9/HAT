/**
 * Theme styles for HistoricalChart
 * Extended from TimelineChart with additional styles for GanttChart features
 */

const light_colors = `
  .historical-chart {
    --background-color: white;
    --primary-gridline-color: rgb(81, 93, 93);
    --second-gridline-color: rgb(194, 199, 200);
    --yearly-tick-color: rgb(81, 93, 93);
    --yearly-label-color: rgb(60, 79, 81);
    --daily-tick-color: rgb(161, 173, 173);
    --daily-label-color: rgb(161, 173, 173);
    --active-axis-color: rgb(255, 0, 0);
    --tooltip-color: rgb(255, 0, 0);
    --event-rect-color: #4682b4;
    --event-text-color: #333;
    --index-brushline-color: #444;
    --index-brushfill-color: #777;
    --label-text-color: #333;
    --label-toggle-color: #666;
    --label-toggle-hover-color: #333;
    --lane-boundary-color: #e0e0e0;
    --group-bar-color-0: #7c4dff;
    --group-bar-color-1: #0288d1;
    --group-bar-color-2: #00897b;
    --group-bar-color-3: #f57c00;
    --group-bar-color-4: #c62828;
  }
`;

const dark_colors = `
  .historical-chart {
    --background-color: #15151b;
    --primary-gridline-color: white;
    --second-gridline-color: lightyellow;
    --yearly-tick-color: white;
    --yearly-label-color: white;
    --daily-tick-color: ghostwhite;
    --daily-label-color: ghostwhite;
    --active-axis-color: pink;
    --tooltip-color: pink;
    --event-rect-color: #FF1791;
    --event-text-color: white;
    --index-brushline-color: #444;
    --index-brushfill-color: #777;
    --label-text-color: #e0e0e0;
    --label-toggle-color: #aaa;
    --label-toggle-hover-color: #fff;
    --lane-boundary-color: #444;
    --group-bar-color-0: #9c7cff;
    --group-bar-color-1: #42a5f5;
    --group-bar-color-2: #26a69a;
    --group-bar-color-3: #ffa726;
    --group-bar-color-4: #ef5350;
  }
`;

const base_styles = `
  /* Container styles */
  .historical-chart-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .historical-chart {
    display: flex;
    flex-direction: column;
    background-color: var(--background-color);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  /* Axis container */
  .hc-axis-container {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: var(--background-color);
    padding-bottom: 2px;
  }

  .hc-axis-svg {
    display: block;
  }

  /* Content area */
  .hc-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Labels container */
  .hc-labels-container {
    flex-shrink: 0;
    position: sticky;
    left: 0;
    z-index: 10;
    background-color: var(--background-color);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .hc-labels-svg {
    display: block;
  }

  /* Body container */
  .hc-body-container {
    flex: 1;
    border-top: 1px solid var(--second-gridline-color);
    border-bottom: 1px solid var(--second-gridline-color);
    border-right: 1px solid var(--second-gridline-color);
    overflow: auto;
  }

  .hc-body-svg {
    display: block;
  }

  /* Index axis container */
  .hc-index-container {
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    z-index: 20;
    background-color: var(--background-color);
  }

  .hc-index-svg {
    display: block;
  }

  /* Axis styles */
  .historical-chart .axises line {
    shape-rendering: geometricPrecision;
    stroke-width: 0.5;
  }

  .historical-chart .axises .yearly line {
    stroke: var(--yearly-tick-color);
    stroke-width: 1.2;
  }

  .historical-chart .axises .yearly text {
    fill: var(--yearly-label-color);
    font-size: 12px;
    pointer-events: none;
  }

  .historical-chart .axises .daily line {
    stroke: var(--daily-tick-color);
  }

  .historical-chart .axises .daily text {
    fill: var(--daily-label-color);
    font-size: 11px;
    pointer-events: none;
  }

  .historical-chart .axises .daily-grid line {
    stroke: var(--second-gridline-color);
  }

  .historical-chart .axises .yearly-grid line {
    stroke: var(--primary-gridline-color);
  }

  /* Active axis */
  .historical-chart .activeAxis line {
    stroke: var(--active-axis-color);
    stroke-width: 1;
  }

  /* Index axis */
  .historical-chart .indexAxis .index line {
    stroke: var(--yearly-tick-color);
  }

  .historical-chart .indexAxis .index text {
    fill: var(--yearly-label-color);
    font-size: 10px;
  }

  .historical-chart .indexAxis .brush .selection {
    stroke: var(--index-brushline-color);
    stroke-width: 1.0;
    fill: var(--index-brushfill-color);
    fill-opacity: 0.3;
  }

  /* Tooltip */
  .historical-chart .axis-tooltip rect {
    stroke: var(--tooltip-color);
    fill: var(--tooltip-color);
    fill-opacity: 0.2;
  }

  .historical-chart .axis-tooltip text {
    text-anchor: start;
    fill: var(--tooltip-color);
    font-size: 12px;
    pointer-events: none;
  }

  /* Event tooltip (HTML) */
  .hc-event-tooltip {
    position: absolute;
    font-size: 12px;
    visibility: hidden;
    background: white;
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    max-width: 300px;
    z-index: 100;
    pointer-events: none;
  }

  /* Bars */
  .historical-chart .bars rect {
    fill: var(--event-rect-color);
    fill-opacity: 0.8;
    cursor: pointer;
  }

  .historical-chart .bars rect:hover {
    fill-opacity: 1;
  }

  .historical-chart .bars text {
    fill: var(--event-text-color);
    font-size: 11px;
    pointer-events: none;
  }

  /* Group bars */
  .historical-chart .group-bars rect {
    pointer-events: none;
  }

  /* Labels */
  .historical-chart .labels text {
    fill: var(--label-text-color);
    font-size: 13px;
  }

  .historical-chart .labels .lane-toggle-icon {
    fill: var(--label-toggle-color);
    cursor: pointer;
    user-select: none;
  }

  .historical-chart .labels .lane-toggle-icon:hover {
    fill: var(--label-toggle-hover-color);
  }

  /* Lane boundaries */
  .historical-chart .lane-boundaries line {
    stroke: var(--lane-boundary-color);
    stroke-dasharray: 2, 2;
  }

  /* Board (event area background) */
  .historical-chart .board {
    stroke: none;
    fill: none;
    pointer-events: all;
  }
`;

export const LIGHT = light_colors + base_styles;
export const DARK = dark_colors + base_styles;
