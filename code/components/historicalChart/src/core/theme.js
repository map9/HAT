/**
 * Theme styles for HistoricalChart
 */
import * as d3 from 'd3';

const accent_schemes = {
  'Greys': d3.schemeGreys[5],
  'Blues': d3.schemeBlues[5],
  'Greens': d3.schemeGreens[5],
  'Oranges': d3.schemeOranges[5],
  'Purples': d3.schemePurples[5],
  'Reds': d3.schemeReds[5],
  'BuGn': d3.schemeBuGn[5],
  'BuPu': d3.schemeBuPu[5],
  'GnBu': d3.schemeGnBu[5],
  'OrRd': d3.schemeOrRd[5],
  'PuBuGn': d3.schemePuBuGn[5],
  'PuBu': d3.schemePuBu[5],
  'PuRd': d3.schemePuRd[5],
  'RdPu': d3.schemeRdPu[5],
  'YlGnBu': d3.schemeYlGnBu[5],
  'YlGn': d3.schemeYlGn[5],
  'YlOrBr': d3.schemeYlOrBr[5],
  'YlOrRd': d3.schemeYlOrRd[5],
};

export const getAccentSchemes = () => {
  return Object.keys(accent_schemes);
}

export const getSystemTheme = (theme, accent) => {
  const colorScale = d3.scaleOrdinal(accent_schemes[accent] || d3.schemeGreys[5]);
  const colors = colorScale.domain([0, 5]).range().slice(0, 5);
  
  if (theme === 'dark') {
    colors.reverse();
    return _build_accent_colors(colors) + _dark_constants + _styles;
  } else {
    return _build_accent_colors(colors) + _light_constants + _styles;
  }
}

const _build_accent_colors = (colors) => {
  return `
    .historical-chart {
      --item-text-color: ${colors[0]};
      --group-item-fill-color: ${colors[1]};
      --bar-item-fill-color: ${colors[2]};
      --link-item-stroke-color: ${colors[3]};
      --point-item-fill-color: ${colors[4]};
    }`;
}

const _light_constants = `
  .historical-chart {
    /* Background & Shadow */
    --background-color: #ffffff;
    --panel-color: #fafafa;
    --shadow-color: rgba(0, 0, 0, 0.12);

    /* Axis & Grid */
    --yearly-tick-color: #2b2b2b;
    --yearly-label-color: #2b2b2b;
    --daily-tick-color: #a8adb3;
    --daily-label-color: #a8adb3;
    --primary-gridline-color: #6b7280;
    --second-gridline-color: #e1e4e8;

    /* Hover axis */
    --active-axis-color: #b23a2f;
    --tooltip-color: #b23a2f;

    /* Index Brush */
    --index-brushline-color: #6b7280;
    --index-brushfill-color: #9aa0a6;

    /* Labels */
    --label-text-color: #1f2933;
    --label-toggle-color: #6b7280;
    --label-toggle-hover-color: #000000;
  }
`;

const _dark_constants = `
  .historical-chart {
    /* Background & Shadow */
    --background-color: #14161a;
    --panel-color: #1f1f1f;
    --shadow-color: rgba(0, 0, 0, 0.7);

    /* Axis & Grid */
    --yearly-tick-color: #d1d5db;
    --yearly-label-color: #d1d5db;
    --daily-tick-color: #7b818a;
    --daily-label-color: #7b818a;
    --primary-gridline-color: #8b919a;
    --second-gridline-color: #2f3339;

    /* Hover axis */
    --active-axis-color: #e07a7a;
    --tooltip-color: #e07a7a;

    /* Index Brush */
    --index-brushline-color: #9aa0a6;
    --index-brushfill-color: #9aa0a6;

    /* Labels */
    --label-text-color: #e5e7eb;
    --label-toggle-color: #b6bcc6;
    --label-toggle-hover-color: #ffffff;
  }
`;

const _styles = `
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

  /* Axis slot - mounting point for AxisManager */
  .hc-axis-slot {
    display: contents; /* Let AxisManager's container participate directly in flex layout */
  }

  /* Axis container */
  .hc-axis-container {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: var(--background-color);
  }

  .hc-axis-svg {
    display: block;
  }

  /* Content area */
  .hc-content {
    position: relative;
    display: flex;
    flex: 1;
    overflow: hidden;
    border-top: 1px solid var(--second-gridline-color);
  }

  /* Labels slot - mounting point for LabelRenderer (positions the labels area) */
  .hc-labels-slot {
    position: absolute;
    top: 0;
    z-index: 10;
  }

  .hc-labels-slot.label-left {
    left: 0;
  }

  .hc-labels-slot.label-right {
    right: 0;
  }

  .hc-labels-slot.label-none {
    display: none;
  }

  /* Labels container - created by LabelRenderer inside slot */
  .hc-labels-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    background-color: var(--panel-color);
    box-shadow: -4px 0 16px var(--shadow-color), 4px 0 16px var(--shadow-color), 0 4px 16px var(--shadow-color);
  }

  .hc-labels-svg {
    display: block;
  }

  /* Body container */
  .hc-body-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* When labels on left: labels hides scrollbar, body shows it */
  .hc-labels-slot.label-left .hc-labels-container {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .hc-labels-slot.label-left .hc-labels-container::-webkit-scrollbar {
    display: none;
  }

  /* When labels on right: labels shows scrollbar (body is covered, doesn't matter) */
  /* No special rules needed - default behavior */

  .hc-body-svg {
    display: block;
  }

  /* Index slot - mounting point for IndexAxisManager */
  .hc-index-slot {
    display: contents; /* Let IndexAxisManager's container participate directly in flex layout */
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
  .historical-chart .hc-tooltip {
    position: absolute;
    font-size: 12px;
    visibility: hidden;
    background: #fff;
    border-radius: 5px;
    padding: 10px;
    box-shadow: 0 0 10px var(--shadow-color);
    max-width: 300px;
    z-index: 100;
    pointer-events: none;
    transition: opacity 0.15s ease-in-out;
  }

  .historical-chart .hc-tooltip.visible {
    opacity: 1;
  }
    
  /* Items */
  .historical-chart .bar-item rect {
    fill: var(--bar-item-fill-color);
    fill-opacity: 0.8;
    cursor: pointer;
  }

  .historical-chart .bar-item rect:hover {
    fill-opacity: 1;
  }

  .historical-chart .bar-item text {
    fill: var(--item-text-color);
    font-size: 10px;
    pointer-events: none;
  }

  /* Group Items */
  .historical-chart .group-item rect {
    fill: var(--group-item-fill-color);
    fill-opacity: 0.9;
    cursor: pointer;
  }

  .historical-chart .group-item rect:hover {
    fill-opacity: 1;
  }

  .historical-chart .group-item text {
    fill: var(--item-text-color);
    font-size: 11px;
    pointer-events: none;
  }

  /* Point Items */
  .historical-chart .point-item path {
    fill: var(--point-item-fill-color);
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
  .historical-chart .link-item path {
    fill: none;
    stroke: var(--link-item-stroke-color);
    stroke-width: 1.5;
    cursor: pointer;
  }

  .historical-chart .link-item path:hover {
    stroke-width: 2;
    filter: drop-shadow(0 0 2px var(--shadow-color));
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