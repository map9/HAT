// primary -dark-1~n -light-1~n
// secondary -dark-1~n -light-1~n
//   success / warning / error / info
// neutral
//   dark-1~n / light-1~n

const light_style = `
  svg {
    --background-color: white;
  }

  .timeline {
    --primary-gridline-color: rgb(81, 93, 93);
    --second-gridline-color: rgb(194, 199, 200);
    --yearly-tick-color: rgb(81, 93, 93);
    --yearly-label-color: rgb(60, 79, 81);
    --daily-tick-color: rgb(161, 173, 173);
    --daily-label-color: rgb(161, 173, 173);
    --active-axis-color: rgb(255, 0, 0);
    --tooltip-color: rgb(255, 0, 0);
    --event-rect-color: #04AA6D;
    --event-text-color: Indigo;
    --index-brushline-color: #888;
    --index-brushfill-color: #777;
  }
`;

const dark_style = `
  svg {
    --background-color: #15151b;
  }

  .timeline {
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
    --index-brushline-color: #888;
    --index-brushfill-color: #777;
  }
`;

const svg_style = `
  svg {
    display:block;
    background-color: var(--background-color);
  }

  .timeline .axises line {
    shape-rendering: geometricPrecision;
    stroke-width: 0.5;
  }

  .timeline .axises .yearly line {
    stroke: var(--yearly-tick-color);
    stroke-width: 1.2;
  }

  .timeline .axises .yearly text {
    fill: var(--yearly-label-color);
    font-size: 12px;
    pointer-events: none;
  }

  .timeline .axises .daily line {
    stroke: var(--daily-tick-color);
  }

  .timeline .axises .daily text {
    color: var(--daily-label-color);
    pointer-events: none;
  }

  .timeline .axises .daily-grid line {
    stroke: var(--second-gridline-color);
  }

  .timeline .axises .yearly-grid line {
    stroke: var(--primary-gridline-color);
  }

  .timeline .axises .activeAxis line {
    stroke: var(--active-axis-color);
  }

  .timeline .indexAxis .index line {
    stroke: var(--yearly-tick-color);
  }
  
  .timeline .indexAxis .index text {
    stroke: var(--yearly-label-color);
  }

  .timeline .indexAxis .brush .selection {
    stroke: var(--index-brushline-color);
    stroke-width: 1.5;
    fill: var(--index-brushfill-color);
    fill-opacity: 0.3;
  }

  .timeline .tooltip rect {
    stroke: var(--tooltip-color);
    fill: var(--tooltip-color);
    fill-opacity: 0.2;
  }

  .timeline .tooltip text {
    text-anchor: start;
    fill: var(--tooltip-color);
    font-size: 12px;
    pointer-events: none;
  }

  .timeline .events .board {
    stroke: none;
    fill: none;
    pointer-events: all;
  }

  .timeline .events rect {
    fill: var(--event-rect-color);
    fill-opacity: 0.8;
  }

  .timeline .events text {
    fill: var(--event-text-color);
    fill-opacity: 0.8;
    pointer-events: none;
  }
`;

export const LIGHT = light_style + svg_style;
export const DARK = dark_style + svg_style;
