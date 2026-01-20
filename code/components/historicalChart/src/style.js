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
    --item-rect-color: #4682b4;
    --item-text-color: #333;
    --item-path-color: #15151b;
    --index-brushline-color: #444;
    --index-brushfill-color: #777;
    --label-text-color: #333;
    --label-toggle-color: #333;
    --label-toggle-hover-color: #000;
    --lane-boundary-color: #e0e0e0;
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
    --item-rect-color: #FF1791;
    --item-text-color: white;
    --item-path-color: white;
    --index-brushline-color: #444;
    --index-brushfill-color: #777;
    --label-text-color: #e0e0e0;
    --label-toggle-color: #e0e0e0;
    --label-toggle-hover-color: #fff;
    --lane-boundary-color: #444;
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
  .hc-indexaxis-container {
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
    font-size: 10px;
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
  .hc-tooltip {
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
    transition: opacity 0.15s ease-in-out;
  }

  .hc-tooltip.visible {
    opacity: 1;
  }
    
  /* Items */
  .historical-chart .item rect {
    fill: var(--item-rect-color);
    fill-opacity: 0.8;
    cursor: pointer;
  }

  .historical-chart .item rect:hover {
    fill-opacity: 1;
  }

  .historical-chart .item text {
    fill: var(--item-text-color);
    font-size: 10px;
    pointer-events: none;
  }

  /* Group Items */
  .historical-chart .group-item rect {
    pointer-events: none;
  }

  /* Point Items */
  .historical-chart .point-item path {
    fill: var(--item-rect-color);
    fill-opacity: 0.9;
    stroke: var(--background-color);
    stroke-width: 1;
    cursor: pointer;
  }

  .historical-chart .point-item path:hover {
    fill-opacity: 1;
    stroke-width: 2;
  }

  .historical-chart .point-item text {
    fill: var(--item-text-color);
    font-size: 10px;
    pointer-events: none;
  }

  /* Link Items */
  .historical-chart .link-path {
    fill: none;
    stroke: var(--item-path-color);
    stroke-width: 1.5;
    cursor: pointer;
  }

  .historical-chart .link-path:hover {
    stroke-width: 2;
  }

  /* Labels */
  .historical-chart .labels text {
    fill: var(--label-text-color);
    font-weight: normal;
    font-size: 12px;
  }

  .historical-chart .labels .level-0 {
    fill: var(--label-text-color);
    font-weight: bold;
    opacity: 1;
    font-size: 13px;
  }

  .historical-chart .labels .level-1 {
    fill: var(--label-text-color);
    opacity: 0.85;
    font-size: 12px;
  }

  .historical-chart .labels .level-2 {
    fill: var(--label-text-color);
    opacity: 0.70;
    font-size: 11px;
  }

  .historical-chart .labels .level-3 {
    fill: var(--label-text-color);
    opacity: 0.55;
    font-size: 10px;
  }

  .historical-chart .labels .group-item-toggle-icon {
    fill: var(--label-toggle-color);
    cursor: pointer;
    user-select: none;
  }

  .historical-chart .labels .group-item-toggle-icon:hover {
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
