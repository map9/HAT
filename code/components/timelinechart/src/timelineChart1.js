/**
 * This is timeline Chart
 * refrence: 
 * 1. https://observablehq.com/@bennyschudel/zoomable-timeline
 * 2. https://observablehq.com/@df23e92fd6fce069/zoomable-timeline-of-the-ai-incident-database
 * 3. https://observablehq.com/@terezaif/psf-board-timeline
 */

import * as d3 from "d3";
import {tooltipHelper} from "./tooltipHelper.js"

console.debug = console.log;
//console.debug = function () {}

const light_style = `
    svg {
      display:block;
      background-color: white;
    }

    .timeline-axis {
      --daily-gridline-color: rgb(194, 199, 200);
      --yearly-gridline-color: rgb(81, 93, 93);
      --yearly-tick-color: rgb(81, 93, 93);
      --yearly-label-color: rgb(60, 79, 81);
      --daily-tick-color: rgb(161, 173, 173);
      --daily-label-color: rgb(161, 173, 173);
      --active-axis-color: rgb(255, 0, 0);
    }

    .timeline-axis line {
      shape-rendering: geometricPrecision;
      stroke-width: 0.5;
    }

    .timeline-axis .yearly line {
      stroke: var(--yearly-tick-color);
      stroke-width: 1.2;
    }

    .timeline-axis .yearly text {
      fill: var(--yearly-label-color);
      pointer-events: none;
    }

    .timeline-axis .daily line {
      stroke: var(--daily-tick-color);
    }

    .timeline-axis .daily text {
      color: var(--daily-label-color);
      pointer-events: none;
    }

    .timeline-axis .grid line {
      stroke: var(--daily-gridline-color);
    }

    .timeline-axis .yearlyGrid line {
      stroke: var(--yearly-gridline-color);
    }

    .timeline-axis .activeAxis line {
      stroke: var(--active-axis-color);
    }

    .timeline-events {
      --event-rect-color: #04AA6D;
      --event-text-color: Indigo;
    }

    .timeline-events .eventboard {
      stroke: none;
      fill: none;
      pointer-events: all;
    }

    .timeline-events .event rect {
      fill: var(--event-rect-color);
      fill-opacity: 0.8;
    }

    .timeline-events .event text {
      fill: var(--event-text-color);
      fill-opacity: 0.8;
      pointer-events: none;
    }
  `;

  const dark_style = `
  svg {
    display:block;
    background-color: #15151b;
  }

  .timeline-axis {
    --daily-gridline-color: lightyellow;
    --yearly-gridline-color: white;
    --yearly-tick-color: white;
    --yearly-label-color: white;
    --daily-tick-color: ghostwhite;
    --daily-label-color: ghostwhite;
    --active-axis-color: pink;
  }

  .timeline-axis line {
    shape-rendering: geometricPrecision;
    stroke-width: 0.5;
  }

  .timeline-axis .yearly line {
    stroke: var(--yearly-tick-color);
    stroke-width: 1.2;
  }

  .timeline-axis .yearly text {
    fill: var(--yearly-label-color);
    pointer-events: none;
  }

  .timeline-axis .daily line {
    stroke: var(--daily-tick-color);
  }

  .timeline-axis .daily text {
    fill: var(--daily-label-color);
    pointer-events: none;
  }

  .timeline-axis .grid line {
    stroke: var(--daily-gridline-color);
  }

  .timeline-axis .yearlyGrid line {
    stroke: var(--yearly-gridline-color);
  }

  .timeline-axis .activeAxis line {
    stroke: var(--active-axis-color);
  }

  .timeline-events {
    --event-rect-color: #FF1791;
    --event-text-color: white;
  }

  .timeline-events .eventboard {
    stroke: none;
    fill: none;
    pointer-events: all;
  }

  .timeline-events .event rect {
    fill: var(--event-rect-color);
    fill-opacity: 0.8;
  }

  .timeline-events .event text {
    fill: var(--event-text-color);
    fill-opacity: 0.8;
    pointer-events: none;
  }
`;

export function timelineChart(
  databaseProvider,
  {
    width,
    height,
    margin = {left: 0, top: 0, right: 0, bottom: 0},
    timeDomain,
    layout,
    tooltip,
    style = light_style,
  }
) {
  const chartLeft = margin.left;
  const chartTop = margin.top;
  const chartWidth = width - chartLeft - margin.right;
  const chartHeight = height - chartTop - margin.bottom;
  const topAxisHeight = 38;
  const indexAxisHeight = 28;

  const MS_PER_HOUR = 60 * 60 * 1000;
  const MS_PER_DAY = 24 * MS_PER_HOUR;
  const MS_PER_YEAR = 365.24 * MS_PER_DAY; // include leap year

  let xAxises = {};
  let xAxisNodes = {};
  const parts = ["yearly", "daily", "grid", "yearlyGrid"];

  var local = "en-us"; //undefined;
  // https://observablehq.com/@mbostock/date-formatting
  const calculateTickandFormat = (part, density) => {
    let map = [];
    switch(part) {
      case "yearly":
        var year = (d) =>
          d.getTime() < new Date("0001-01-01").getTime()
            ? d.toLocaleString(local, {era: "short", year: "numeric"})
            : d.toLocaleString(local, {year: "numeric"});
            
        map = [
          [4, [d3.utcMonth, (d) => {
              const startOfTheYear = d.getUTCMonth() === 0 && d.getUTCDate() === 1;
              return startOfTheYear ? year(d) + ' - ' + d.toLocaleString(local, { month: "long" }): d.toLocaleString(local, { month: "long" });
            },
          ]],
          [64, [d3.utcYear, (d) => year(d)]],
          [128, [d3.utcYear.every(2), (d) => year(d)]],
          [Infinity, [d3.utcYear.every(Math.round(density / 256) * 5), (d) => year(d)]]
        ]
        break;
      case "daily":
        map = [
          [1, [d3.utcDay, (d) => d.toLocaleString(local, { day: "numeric" })]],
          [4, [d3.utcDay, ""]],
          [8, [d3.utcMonth, (d) => d.toLocaleString(local, { month: "long" })]],
          [16, [d3.utcMonth, (d) => d.toLocaleString(local, { month: "short" })]],
          [24, [d3.utcMonth, (d) => d.toLocaleString(local, { month: "narrow" })]],
          [32, [d3.utcMonth.every(3), "Q%q"]],
          [64, [d3.utcMonth.every(6), (d, i) => d.getMonth() < 5 ? "H1" : "H2"]],
          [512, [d3.utcYear, (d) => d.toLocaleString(local, { year: "2-digit" })]],
          [Infinity, [d3.utcYear.every(Math.round(density / 256)), (d) => d.toLocaleString(local, { year: "2-digit" })]]
        ];
        break;
      case "grid":
        map = [
          [0.025, [d3.utcHour.every(2), ""]],
          [0.05, [d3.utcHour.every(6), ""]],
          [0.1, [d3.utcHour.every(12), ""]],
          [1, [d3.utcDay, ""]],
          [24, [d3.utcMonth, ""]],
          [64, [d3.utcMonth.every(6), ""]]
        ];
        break;
      case "yearlyGrid":
        map = [
          [4, [d3.utcMonth, "%B"]],
          [64, [d3.utcYear, "%Y"]],
          [128, [d3.utcYear.every(2), "%Y"]],
          [Infinity, [d3.utcYear.every(Math.round(density / 256) * 5), "%Y"]]
        ];
        break;
      default:
        return []
    }

    for (const [limit, config] of map) {
      if (density < limit) {
        let [interval, format] = config;
        format = typeof format !== "function" ? d3.utcFormat(format) : format;
        return [interval, format];
      }
    }

    return [];
  }

  // yearly xAxis
  xAxises["yearly"] = (xAxisNode, density, xScale) => {
    let [interval, format] = calculateTickandFormat("yearly", density);

    const el = xAxisNode
      .attr("transform", `translate(0,10)`)
      .call(d3.axisTop(xScale).ticks(interval).tickFormat(format).tickSizeOuter(0));

    el.select(".domain").remove();
    el.selectAll("text")
      .attr("y", 3)
      .attr("x", 6)
      .style("font-size", "12px")
      .style("text-anchor", "start");

    el.selectAll("line").attr("y1", -7).attr("y2", 6);
  };

  // daily xAxises
  xAxises["daily"] = (xAxisNode, density, xScale) => {
    let [interval, format] = calculateTickandFormat("daily", density);

    const el = xAxisNode
      .attr("transform", `translate(0,${30})`)
      .call(d3.axisTop(xScale).ticks(interval).tickFormat(format).tickSizeOuter(0));
    
    el.select(".domain").remove();
    el.selectAll("text")
      .attr("y", 0)
      .attr("x", 6)
      .style("text-anchor", "start");

    el.selectAll("line").attr("y1", -7).attr("y2", 0);
  };

  // grid
  xAxises["grid"] = (xAxisNode, density, xScale) => {
    let [interval] = calculateTickandFormat("grid", density);

    xAxisNode.attr("visibility", interval === undefined ? "hidden": "visible");
    if(interval === undefined) return;
    
    const el = xAxisNode
      .attr("transform", `translate(0,${topAxisHeight})`)
      .call(d3.axisTop(xScale).ticks(interval).tickSizeOuter(0));

    el.select(".domain").remove();
    el.selectAll("text").remove();

    el.selectAll("line")
      .attr("y1", 0)
      .attr("y2", chartHeight - topAxisHeight - indexAxisHeight);
  };

  // yearlyGrid
  xAxises["yearlyGrid"] = (xAxisNode, density, xScale) => {
    let [interval, format] = calculateTickandFormat("yearlyGrid", density);

    const el = xAxisNode
      .attr("transform", `translate(0,${topAxisHeight})`)
      .call(d3.axisTop(xScale).ticks(interval).tickFormat(format).tickSizeOuter(0));

    el.select(".domain").remove();
    el.selectAll("text").remove();

    el.selectAll("line")
      .attr("y1", 0)
      .attr("y2", chartHeight - topAxisHeight - indexAxisHeight);
  };

  const initialAxises = (chartNode, xScale) => {
    // create x Axis series, include year/monthy, daily, and so on.
    const xAxisNode = chartNode.append("g")
      .classed("timeline-axis", true)
      .attr("clip-path", "url(#clip)");

    parts.forEach((part) => {
      xAxisNodes[part] = xAxisNode.append("g").classed(part, true);
    });

    // create active Axis
    let activeAxis = xAxisNode.append("g").attr("class", "activeAxis");
    activeAxis.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", chartHeight);

      updateAxises(xScale);

    return [xAxisNode, activeAxis];
  }

  const updateAxises = (xScale) => {
    const density = Math.abs(xScale.invert(0) - xScale.invert(1)) / MS_PER_HOUR; // in pixels per hour

    if (parts) {
      parts.forEach((part) => {
        xAxisNodes[part].call(xAxises[part], density, xScale);
      });
    }
  };

  const initialEvents = (eventData, chartNode, xScale, yScale) => {
    const eventNode = chartNode.append("g")
      .attr("class", "timeline-events")
      .attr('transform', d => `translate(0, ${topAxisHeight})`)
      .attr("clip-path", "url(#clip)");

    eventNode.append("rect")
      .attr("class", "eventboard")
      .attr("pointer-events", "all")
      .attr("width", chartWidth)
      .attr("height", chartHeight);
      
    const e = eventNode.selectAll("g.event")
      .data(eventData)
      .join('g')
      .attr('class', 'event')
      .attr('transform', d => `translate(${xScale(d.startYear)}, ${yScale(d.yIndex)})`)
      .style("cursor", "pointer");
      //.on('mouseenter', function(){d3.select(this).select('text').style('opacity', 1)})
      //.on('mouseleave', function(){d3.select(this).select('text').style('opacity', 0)});
    
    e.append('rect')
      .attr("width", d =>(d.startYear >= d.endYear? 3 : xScale(d.endYear) - xScale(d.startYear)))
      .attr('height', yScale.bandwidth());
      //.attr('fill', 'green')
      //.attr('fill-opacity', 0.5);

    e.append('text')
      .attr('x', -3)
      .attr('y', yScale.bandwidth() - 2)
      .text(d => d.event)
      .style('font-size', yScale.bandwidth() + 'px')
      .style('text-anchor', 'end');
    
    return eventNode;
  };
  
  const updateEvents = (eventNode, xScale, yScale) =>{
    eventNode.selectAll("g.event")
      .attr('transform', d => `translate(${xScale(d.startYear)}, ${yScale(d.yIndex)})`);

    eventNode.selectAll("g.event rect")
      .attr("width", d =>(d["startYear"] >= d["endYear"]? 3 : xScale(d["endYear"]) - xScale(d["startYear"])));
  }

  // create Root SVG Node
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("background", "white")
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  svg.append("style").text(style);

  // create Timeline Chart
  const chartNode = svg.append("g")
    .attr("class", "timeline-board")
    .attr("transform", `translate(${chartLeft},${chartTop})`)
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  // create Clip Rect
  chartNode.append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight);
  
  var tooltip = tooltip || new tooltipHelper();
  tooltip.setBoundBox({left: chartLeft, top: chartTop + topAxisHeight, right: chartWidth, bottom: chartHeight - topAxisHeight - indexAxisHeight});
  tooltip.setWidth(chartWidth * 0.4);

  layout = layout || 'Naive';
  var eventData = databaseProvider.getTimelineData(layout);

  // create xAxises
  var eventDataTimeDomain = databaseProvider.getTimelineDomain();
  if (timeDomain)
    eventDataTimeDomain = [Math.min(timeDomain[0], eventDataTimeDomain[0]), Math.max(timeDomain[1], eventDataTimeDomain[1])];
  else
    timeDomain = eventDataTimeDomain;

  const xScale = d3.scaleUtc().domain(eventDataTimeDomain).range([0, chartWidth]).nice();
  const [xAxisNode, activeAxis] = initialAxises(chartNode, xScale);
  // create events
  const yScale = d3.scaleBand()
    .domain(d3.range(0, d3.max(eventData, d => d.yIndex) + 1))
    .range([0, chartHeight - topAxisHeight - indexAxisHeight])
    .paddingInner(0.2);
  const eventNode = initialEvents(eventData, chartNode, xScale, yScale);

  const xIndexScale = xScale.copy();
  const xIndexAxis = d3.axisBottom(xIndexScale);

  const dispatch = d3.dispatch("timeWindow");

  // Create Zoom Area Rect at the end
  var domain = xIndexScale.domain();
  const zoom = d3
    .zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [chartWidth, chartHeight - topAxisHeight - indexAxisHeight]])
    .extent([[0, 0], [chartWidth, chartHeight - topAxisHeight - indexAxisHeight]])
    .on("zoom end", zoomed);
  
  var initialTransform = d3.zoomIdentity
    .translate(xIndexScale.range()[0], 0)
    .scale((xIndexScale.domain()[1] - xIndexScale.domain()[0]) / (timeDomain[1] - timeDomain[0]))
    .translate(-xIndexScale(timeDomain[0]), 0);
  eventNode
    .on("mousemove", onmousemove)
    .on("mouseover", onmouseover)
    .on("mouseout", onmouseout)
    .call(zoom.transform, initialTransform)
    .call(zoom);

  // 绑定在 eventNode 上的 zoom 没有双指上下移动的滚动缩放，只有双指拉框缩放。
  // 但是，将 mousewheel 绑定到 svg 结点上，eventNode 突然出现了双指上下移动的滚动缩放。
  // 而且，mousewheel 事件先出现在 eventNode 上，离开 eventNode 范围，才会有 svg 的 mousewheel 事件响应。
  svg.on('mousewheel', (event) => {
    //console.log(event);
  });
  
  // create Index Chart(brush)
  const brush = d3.brushX()
    .extent([[0, 1],[chartWidth, indexAxisHeight - 1]])
    .on("brush end", onbrushend);

  // create Index Axis
  const indexAxisNode = chartNode.append("g")
    .attr("class", "timeline-axis")
    .attr("transform", `translate(0,${chartHeight - indexAxisHeight + 1})`)
    .attr("clip-path", "url(#clip)");

  indexAxisNode.append("g").attr("class", "index").call(xIndexAxis);
  const bIndexBox = indexAxisNode.append("g").attr("class", "brush");
  bIndexBox.call(brush).call(brush.move, /*xScale.range()*/timeDomain.map(xIndexScale));

  // When zooming, redraw the area and the x axis.
  function zoomed(event) {
    //console.debug("zoomed.");
    const {transform, sourceEvent} = event;
    const xt = transform.rescaleX(xIndexScale);

    updateAxises(xt);
    updateEvents(eventNode, xt, yScale);

    domain = transform.rescaleX(xIndexScale).domain();
    // broadcast changes if they are originated here
    if (sourceEvent) dispatch.call("timeWindow", eventNode, domain);
  }

  dispatch.on("timeWindow.focus", function (value) {
    if (this === bIndexBox) return; // ignore our own message
    if (value == null) return;
    //console.debug("timeWindow.focus");

    domain = value;
    const b = domain.map(xIndexScale);
    if (b[0] === 0 && b[1] === chartWidth) {
      bIndexBox.call(brush.clear);
    } else {
      bIndexBox.call(brush.move, b);
    }
  });

  function onbrushend(event) {
    //console.debug("onbrushend");
    const {selection, sourceEvent} = event;
    domain = selection && selection.map(xIndexScale.invert);

    // broadcast changes if they are originated here
    if (sourceEvent) dispatch.call("timeWindow", bIndexBox, domain);
  }

  dispatch.on("timeWindow.details", function (value) {
    if (this === eventNode) return; // ignore our own message
    //console.debug("timeWindow.details.");

    domain = (value == null ? xIndexScale.domain() : value).slice();
    var transform = d3.zoomIdentity
      .translate(xIndexScale.range()[0], 0)
      .scale(Math.min(100, (xIndexScale.domain()[1] - xIndexScale.domain()[0]) / (domain[1] - domain[0])))
      .translate(-xIndexScale(domain[0]), 0);

    eventNode.call(zoom.transform, transform); // need to notify zoomrect element, otherwise, the zoomrect own a another transform.
    const xt = transform.rescaleX(xIndexScale);
    updateAxises(xt);
  });

  function onmousemove(event) {
    let point = d3.pointer(event);

    activeAxis.attr("transform", function (d) {
      return "translate(" + point[0] + ", 0)";
    });

    var [x, y] = d3.pointer(event);
    tooltip.setPosition([x, y]);
  }

  function onmouseover(event) {
    activeAxis.attr("visibility", "visible");
  }

  function onmouseout(event) {
    activeAxis.attr("visibility", "hidden");
  }

  eventNode.selectAll("g.event rect")
    .on("mouseout", eventMouseOut)
    .on("mouseover", eventMouseOver)
    .on("click", eventClick);
  
  function eventMouseOut(_, d) {
    tooltip.show(false);
    /*
    d3.select(this.parentNode)
        .select("rect")
        .attr("fill", (d) => d.color);
    */
  };

  function eventMouseOver(_, d) {
    tooltip.show();
    tooltip.html(getEventTooltipContent(d));
    /*
    d3.select(this.parentNode)
      .select("rect")
      .attr("fill", (d) => d.color.darker());
    */
  };

  function eventClick(_, d) {
    tooltip.html(getEventTooltipFullContent(d));

    // disable interactions
    eventNode.on("mousemove", null)
    eventNode.selectAll("g.event rect")
      .on("mouseout", null)
      .on("mouseover", null)
      .on("click", null);
    
    // re-enable interations upon closing
    /*
    var clickedOn = d3.select(this.parentNode)
      .select("rect")
      clickedOn.attr("fill", (d) => d.color);
    */

    d3.select("#close").on("click", function (_, d) {
      tooltip.show(false);
      eventNode.on("mousemove", onmousemove)
      eventNode.selectAll("g.event rect")
        .on("mouseout", eventMouseOut)
        .on("mouseover", eventMouseOver)
        .on("click", eventClick);
    });
  };

  function getEventTooltipContent(d) {
    const convert = (date) =>
      date.toLocaleDateString("US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })

      const formatDate = (d) => {
      const [begin, end] = [convert(d.startYear), convert(d.endYear)];
    
      return begin === end ? begin : `${begin} – ${end}`;
    }
    
    const formatOption = (option) =>
      option.toLowerCase().replace("?", "").replaceAll(" ", "_");

    const info = {
      "Occurred on": formatDate(d),
      //Location: d.location
    };
  
    
    const hr = '<hr style="padding:0; margin:5px;"/>';
  
    const arr = Object.entries(info).map(([key, value]) =>
      value ? `<b>${key}:</b> ${value}` : null
    );
  
    return arr.filter(Boolean).join("<br/>") + hr + d.event;
  }

  function getEventTooltipFullContent(d) {
    const close = "<button id='close' style='position:absolute; top:2px; right:2px; border:none; border-radius:50%; cursor:pointer; background-color:white'; font-weight:bold>×</button>";
    return getEventTooltipContent(d) + close;
  }

  return [svg.node(), tooltip.node()];
}
