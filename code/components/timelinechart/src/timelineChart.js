/**
 * This is timeline Chart
 * refrence: 
 * 1. https://observablehq.com/@bennyschudel/zoomable-timeline
 */

import * as d3 from "d3";
import { LIGHT, DARK } from "./style";
import * as westernCalendarAxises from './westernCalendarAxises.js'

console.debug = console.debug;
//console.debug = function () {}

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Creates a timeline chart with various configurations.
 *
 * @param {Object} config - Configuration object for the timeline chart.
 * @param {number} [config.width=800] - Width of the chart.
 * @param {number} [config.height=600] - Height of the chart.
 * @param {Object} [config.margin={ left: 20, top: 20, right: 20, bottom: 20 }] - Margin around the chart.
 * @param {Array<Date>} [config.timeDomain=[new Date(new Date().setFullYear(new Date().getFullYear() - 50)), new Date(new Date().setFullYear(new Date().getFullYear() + 50))]] - Time domain for the chart.
 * @param {Array<Object>} [config.axises] - Array of axis configurations.
 * @param {boolean} [config.hasIndexAxis=true] - Whether to include an index axis.
 * @param {boolean} [config.vertical=false] - Whether the chart is vertical.
 * @param {string} [config.locale='en-us'] - Locale for date formatting.
 * @param {string} [config.style=LIGHT] - Style of the chart ('light' or 'dark').
 */
export class timelineChart {
  constructor({
    width = 800,
    height = 600,
    margin = { left: 20, top: 20, right: 20, bottom: 20 },
    timeDomain = [
      new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
      new Date(new Date().setFullYear(new Date().getFullYear() + 50))
    ],
    axises = [
      westernCalendarAxises.yearlyAxis,
      westernCalendarAxises.dailyAxis,
      westernCalendarAxises.yearlyGrid,
      westernCalendarAxises.dailyGrid
    ],
    hasIndexAxis = true,
    zoomLimited = [-1, -1],
    // vertical = false,
    local = 'en-us',
    style = LIGHT,
  }) {
    this.width = width;
    this.height = height;
    this.margin = margin;
    this.timeDomain = timeDomain;
    this.axises = axises;
    this.hasIndexAxis = hasIndexAxis;
    this.zoomLimited = zoomLimited;
    this.local = local;
    this.style = style;

    this.boundBox = {
      left: this.margin.left,
      top: this.margin.top,
      width: this.width - this.margin.left - this.margin.right,
      height: this.height - this.margin.top - this.margin.bottom,
    };
    this.axisHeight = 0;
    this.indexAxisHeight = 28;
    this.gap = 1;

    this.dispatch = d3.dispatch(
      "updateAxises", // 通知更新组件时间坐标轴
      "updateIndexAxis", // 通知更新组件索引时间坐标轴
      "initial", // 通知外部元素初始化
      "update", // 通知外部元素更新
      "resize", // 通知组件尺寸发生变化
      "updateTooltips" // 通知更新时间提示内容
    );

    this.axisObjects = {};
    this.axisNodes = {};
  }

  _createAxisObjects(axis) {
    return (axisNode, hoursPerPixel, scale, y1, y2) => {
      // 为 axis 增加显示 domain 的限制
      if (axis.domain) {
        if (scale.domain()[1] < axis.domain[0] || scale.domain()[0] > axis.domain[1]) {
          axisNode.attr("visibility", "hidden");
          return;
        }

        if (scale.domain()[0] < axis.domain[0] || scale.domain()[1] > axis.domain[1]) {
          const domain = [Math.max(scale.domain()[0], axis.domain[0]), Math.min(scale.domain()[1], axis.domain[1])];
          const range = domain.map(scale);
          scale = d3.scaleUtc().domain(domain).range(range);
        }
      }
      
      let interval = undefined;
      let format = undefined;
      //console.debug(`hoursPerPixel: ${hoursPerPixel}`);
      for (const [limit, config] of axis.map(hoursPerPixel, this.local)) {
        if (hoursPerPixel < limit) {
          [interval, format] = config;
          format = typeof format !== "function" ? d3.utcFormat(format) : format;
          break;
        }
      }
  
      axisNode.attr("visibility", interval === undefined ? "hidden": "visible");
      if(interval === undefined) return;
  
      let el = null;
      if (axis.isGrid) {
        el = axisNode
          .attr("transform", `translate(0, ${y1})`)
          .call(d3.axisTop(scale).ticks(interval).tickSizeOuter(0));
        el.selectAll("text").remove();
      } else {
        el = axisNode
          .attr("transform", `translate(0, ${y1})`)
          .call(d3.axisTop(scale).ticks(interval).tickFormat(format).tickSizeOuter(0));      
        el.selectAll("text")
          .attr("x", 3 * this.gap)
          .attr("y", axis.height - 2 * this.gap)
          .style("text-anchor", "start");
      }  
      el.select(".domain").remove();
      el.selectAll("line")
        .attr("y1", this.gap)
        .attr("y2", y2);
    };
  }

  _updateAxises(xScale) {
    const hoursPerPixel = Math.abs(xScale.invert(0) - xScale.invert(1)) / MS_PER_HOUR;

    let axisHeightTemp = 0;
    if (this.axises) {
      this.axises.forEach((axis) => {
        this.axisNodes[axis.name].call(
          this.axisObjects[axis.name], hoursPerPixel, xScale, axisHeightTemp,
          (axis.height == -1)
            ? this.boundBox.height - this.axisHeight - (this.hasIndexAxis? this.indexAxisHeight : 0) - this.gap :
            axis.height - this.gap);
        axisHeightTemp += (axis.height == -1)? 0 : axis.height;
      });
    }
    
    this.dispatch.call("update", this.eventNode, xScale);
  };

  create() {
    // create Root SVG Node
    this.svg = d3.create("svg").attr("width", this.width).attr("height", this.height).attr("viewBox", [0, 0, this.width, this.height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    this.svg.append("style").text(this.style);
    
    this.defs = this.svg.append("defs");
    // create main clip rect
    this.defs.append("clipPath")
      .attr("id", "chart-clip")
      .append("rect")
      .attr("width", this.boundBox.width)
      .attr("height", this.boundBox.height);

    // create Timeline Chart
    this.chartNode = this.svg.append("g")
      .attr("class", "timeline")
      .attr("transform", `translate(${this.boundBox.left},${this.boundBox.top})`)
      .attr("clip-path", "url(#chart-clip)")
      .attr("width", this.boundBox.width)
      .attr("height", this.boundBox.height);

    // sort aixes by isGrid
    this.axises.sort((a, b) => {
      if (a.isGrid && !b.isGrid) return 1;
      if (!a.isGrid && b.isGrid) return -1;
      return 0;
    });
    this.axisHeight = 0;
    // create axises series, include year/monthy, daily, and so on.
    for(const axis of this.axises){
      this.axisObjects[axis.name] = this._createAxisObjects(axis);
      this.axisHeight += (axis.height == -1)? 0 : axis.height;
    }
    this.axisNode = this.chartNode.append("g").classed("axises", true);
    this.axises.forEach((axis) => {
      this.axisNodes[axis.name] = this.axisNode.append("g").classed(axis.class, true);
    });

    // create active axis
    this.activeAxis = this.axisNode.append("g").classed("activeAxis", true);
    this.activeAxis.append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", this.boundBox.height - (this.hasIndexAxis? this.indexAxisHeight : 0));

    // create event series
    // create event clip rect
    const eventboardHeight = this.boundBox.height - this.axisHeight - (this.hasIndexAxis? this.indexAxisHeight : 0);
    this.defs.append("clipPath")
      .attr("id", "events-clip")
      .append("rect")
      .attr("width", this.boundBox.width)
      .attr("height", eventboardHeight);
    this.eventNode = this.chartNode.append("g")
      .attr("class", "events")
      .attr('transform', d => `translate(0, ${this.axisHeight})`)
      .attr("clip-path", "url(#event-clip)");
    this.eventNode.append("rect")
      .attr("class", "board")
      .attr("width", this.boundBox.width)
      .attr("height", eventboardHeight);

    // create a tooltip text with round red rectangle
    this.tooltip = this.chartNode.append("g").attr("class", "tooltip");
    this.tooltip.append("rect")
      .attr("width", 0)
      .attr("height", 0)
      .attr("rx", 3)
      .attr("ry", 3);
    this.tooltip.append("text").attr("x", 0).attr("y", 0);
    
    // create time scale
    this.xScale = d3.scaleUtc().domain(this.timeDomain).range([0, this.boundBox.width]);
    this.indexScale = this.xScale.copy();
    this.dispatch.call("initial", this.eventNode, 0, 0, this.boundBox.width, eventboardHeight, this.xScale);
    this._updateAxises(this.xScale);
    
    // Create Zoom Area Rect at the end
    // Calculate initialDensity based on initial scale
    this.scaleExtent = [1, Infinity];
    const initialDensity = (this.timeDomain[1] - this.timeDomain[0]) / this.boundBox.width / MS_PER_HOUR;
    // zoomLimited[0], zoomLimited[1] is pixel per hour
    if (this.zoomLimited[0] !== -1) this.scaleExtent[0] = initialDensity * this.zoomLimited[0];
    if (this.zoomLimited[1] !== -1) this.scaleExtent[1] = initialDensity * this.zoomLimited[1];

    const self = this;
    this.zoom = d3
      .zoom()
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [this.boundBox.width, eventboardHeight]])
      .extent([[0, 0], [this.boundBox.width, eventboardHeight]])
      .on("zoom end", zoomed);

    const initialTransform = d3.zoomIdentity
      .translate(this.xScale.range()[0], 0)
      .scale(this.scaleExtent[0])
      .translate(-this.xScale(this.timeDomain[0]), 0);
    this.eventNode
      .on("mousemove", onmousemove)
      .on("mouseover", onmouseover)
      .on("mouseout", onmouseout)
      .call(this.zoom.transform, initialTransform)
      .call(this.zoom);

    this.svg.on('mousewheel', (event) => {
      //console.debug(event);
    });

    this.dispatch.on("updateAxises", (value) => {
      const domain = (value == null ? this.indexScale.domain() : value).slice();

      let scaleRatio = (this.indexScale.domain()[1] - this.indexScale.domain()[0]) / (domain[1] - domain[0]);
      if (scaleRatio < this.scaleExtent[0]) scaleRatio = this.scaleExtent[0];
      if (scaleRatio > this.scaleExtent[1]) scaleRatio = this.scaleExtent[1];
      
      var transform = d3.zoomIdentity
        .translate(this.indexScale.range()[0], 0)
        .scale(scaleRatio)
        .translate(-this.indexScale(domain[0]), 0);
      this.eventNode.call(this.zoom.transform, transform);

      const xt = transform.rescaleX(this.xScale);
      this._updateAxises(xt);
    });

    if (this.hasIndexAxis) {
      // create Index Chart(brush)
      this.brush = d3.brushX()
        .extent([[0, 1],[this.boundBox.width, this.indexAxisHeight - 1]])
        .on("start", onbrushstart)
        .on("brush end", onbrushend);

      // create Index Axis
      this.indexAxisNode = this.chartNode.append("g")
        .attr("class", "indexAxis")
        .attr("transform", `translate(0,${this.boundBox.height - this.indexAxisHeight + 1})`);

      this.indexAxisObject = d3.axisBottom(this.indexScale);
      this.indexAxisNode.append("g").attr("class", "index").call(this.indexAxisObject);
      this.bIndexBox = this.indexAxisNode.append("g").attr("class", "brush");
      this.bIndexBox.call(this.brush).call(this.brush.move, this.timeDomain.map(this.indexScale));
      
      this.dispatch.on("updateIndexAxis", (value) => {
        if (value == null) return;
        
        const domain = value;
        const b = domain.map(this.indexScale);
        if (b[0] === 0 && b[1] === this.boundBox.width) {
          this.bIndexBox.call(this.brush.clear);
        } else {
          this.bIndexBox.call(this.brush.move, b);
        }
      });

      this.initialSelection = null;
      function onbrushstart(event) {
        if (event.selection) {
          self.initialSelection = event.selection.slice();
        }
      }

      function onbrushend(event) {
        const {selection, sourceEvent} = event;
        if (!selection) return;

        // 比较初始选区与结束选区
        let status = 0; // -1: 左侧变化，1: 右侧变化，0: 两侧都变化
        if (self.initialSelection) {
          if (selection[0] !== self.initialSelection[0] && selection[1] === self.initialSelection[1]) {
            status = -1;
          } else if (selection[1] !== self.initialSelection[1] && selection[0] === self.initialSelection[0]) {
            status = 1;
          } else if (selection[0] !== self.initialSelection[0] && selection[1] !== self.initialSelection[1]) {
            status = 0;
          }
        }
        self.initialSelection = selection.slice();

        // 根据 indexScale 得到新的时间域（轴的目标域）
        let newDomain = selection.map(self.indexScale.invert); // [t0, t1]，单位：Date对象

        const totalHours = (newDomain[1] - newDomain[0]) / MS_PER_HOUR;
        const scaleRange = self.xScale.range()[1] - self.xScale.range()[0];
        let axisDensity = scaleRange / totalHours; // 单位：像素/小时

        // zoomLimited 的含义：zoomLimited[0] 和 zoomLimited[1] 分别是允许的最小和最大 “像素/小时”
        const minAllowed = self.zoomLimited[0]; // 下限，若为 -1 则不限制
        const maxAllowed = self.zoomLimited[1]; // 上限，若为 -1 则不限制

        //console.debug(`axisDensity: ${axisDensity}, minAllowed: ${minAllowed}, maxAllowed: ${maxAllowed}.`);
        // 若 axisDensity 小于最小限制，说明当前域太宽（zoomed out），每小时显示的像素太少，
        // 此时希望强制 zoom in，使得每小时至少有 minAllowed 个像素
        if (minAllowed !== -1 && axisDensity < minAllowed) {
          // 反推所需的总小时数，使得 chartWidth / desiredHours == minAllowed
          const desiredHours = scaleRange / minAllowed;
          if (status === 0) {
            const centerTime = (newDomain[0].getTime() + newDomain[1].getTime()) / 2;
            newDomain[0] = new Date(centerTime - (desiredHours * MS_PER_HOUR) / 2);
            newDomain[1] = new Date(centerTime + (desiredHours * MS_PER_HOUR) / 2);
          } else if (status === -1) {
            newDomain[0] = new Date(newDomain[1].getTime() - desiredHours * MS_PER_HOUR);
          } else if (status === 1) {
            newDomain[1] = new Date(newDomain[0].getTime() + desiredHours * MS_PER_HOUR);
          }
        }

        // 若 axisDensity 大于最大限制，说明当前域太窄（zoomed in），每小时显示的像素太多，
        // 此时希望强制 zoom out，使得每小时不超过 maxAllowed 个像素
        if (maxAllowed !== -1 && axisDensity > maxAllowed) {
          const desiredHours = scaleRange / maxAllowed;
          if (status === 0) {
            const centerTime = (newDomain[0].getTime() + newDomain[1].getTime()) / 2;
            newDomain[0] = new Date(centerTime - (desiredHours * MS_PER_HOUR) / 2);
            newDomain[1] = new Date(centerTime + (desiredHours * MS_PER_HOUR) / 2);
          } else if (status === -1) {
            newDomain[0] = new Date(newDomain[1].getTime() - desiredHours * MS_PER_HOUR);
          } else if (status === 1) {
            newDomain[1] = new Date(newDomain[0].getTime() + desiredHours * MS_PER_HOUR);
          }
        }

        // 将调整后的时间域转换回 indexAxis 上的像素坐标
        const newSelection = newDomain.map(self.indexScale);
        
        // Update the brush selection if needed
        if (newSelection[0] !== selection[0] || newSelection[1] !== selection[1]) {
          self.bIndexBox.call(self.brush.move, newSelection);
          //self.dispatch.call("updateAxises", self.bIndexBox, newDomain);
        }

        // Now you can proceed with normal brush end logic
        // broadcast changes if they are originated here
        if (sourceEvent) self.dispatch.call("updateAxises", self.bIndexBox, newDomain);
      }

      // 由于indexAxis的设置，重新更新一下Axises
      const brushSelection = d3.brushSelection(self.bIndexBox.node());
      if (brushSelection) {
        const newBrushDomain = brushSelection.map(self.indexScale.invert);
        self.dispatch.call("updateAxises", self.bIndexBox, newBrushDomain);
      }
    }

    // When zooming, redraw the area and the x axis.
    function zoomed(event) {
      const {transform, sourceEvent} = event;

      let xt = transform.rescaleX(self.xScale);
      self._updateAxises(xt);

      const domain = transform.rescaleX(self.xScale).domain();
      // broadcast changes if they are originated here
      if (sourceEvent && self.hasIndexAxis) self.dispatch.call("updateIndexAxis", self.eventNode, domain);
    }

    function onmousemove(event) {
      let [x, y] = d3.pointer(event);

      self.activeAxis.attr("transform", `translate(${x},0)`);
      self.tooltip.attr("transform", `translate(${x + 2 * self.gap},${self.axisHeight})`);

      let transformedPoint = d3.zoomTransform(self.eventNode.node()).invertX(x);
      const date = self.xScale.invert(transformedPoint);

      const localDateString = date.getTime() < new Date("0001-01-01").getTime()
        ? date.toLocaleString(this.local, {era: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"})
        : date.toLocaleString(this.local, {year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric"});
      let localDateWrapper = { value: localDateString };
      self.dispatch.call("updateTooltips", self.tooltip, date, localDateWrapper);
      
      const text = self.tooltip.select("text");
      text.selectAll("tspan").remove();
      text.attr("y", 0);

      let bbox = null;
      localDateWrapper.value.split("\n").forEach((line, i) => {
        const tspan = text.append("tspan");
        tspan.attr("x", 2 * self.gap).attr("dy", i === 0 ? 0 : 15).text(line);

        const bboxT = tspan.node().getBBox();
        if (bbox === null) {
          bbox = bboxT;
        } else {
          if (bbox.height < bboxT.y - bbox.y + bboxT.height)
            bbox.height = bboxT.y - bbox.y + bboxT.height;
          if (bbox.width < bboxT.width)
            bbox.width = bboxT.width;
        }
      });

      self.tooltip.select("rect").attr("width", bbox.width + 6 * self.gap).attr("height", bbox.height + 2 * self.gap).attr("y", 2 * self.gap);
      text.attr("x", 3 * self.gap).attr("y", -bbox.y + 3 * self.gap);
    }

    function onmouseover(event) {
      self.activeAxis.attr("visibility", "visible");
      self.tooltip.attr("visibility", "visible");
    }

    function onmouseout(event) {
      self.activeAxis.attr("visibility", "hidden");
      self.tooltip.attr("visibility", "hidden");
    }

    return this.svg.node();
  }

  // Resize method to adjust width and height
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.boundBox.width = this.width - this.margin.left - this.margin.right;
    this.boundBox.height = this.height - this.margin.top - this.margin.bottom;

    // 获取当前的时间范围
    const xt = d3.zoomTransform(this.eventNode.node()).rescaleX(this.xScale);
    const currentDomain = this.xScale.range().map(xt.invert);

    // Update chart dimensions
    this.svg.attr("width", width).attr("height", height).attr("viewBox", [0, 0, width, height]);
    this.chartNode.select(".timeline").attr("width", this.boundBox.width).attr("height", this.boundBox.height);

    const eventboardHeight = this.boundBox.height - this.axisHeight - (this.hasIndexAxis? this.indexAxisHeight : 0);
    // 如果直接采取下面的方式，会导致clip的宽度和高度即使变化了，通过url(#clip)引用的元素的clip的宽度和高度没有变化
    //defs.select("#chart-clip").attr("width", this.boundBox.width).attr("height", this.boundBox.height);
    // 需要采取下面的方式，才能自动更新url(#chart-clip)引用的元素的clip的宽度和高度
    this.defs.select("#chart-clip rect").attr("width", this.boundBox.width).attr("height", this.boundBox.height);
    this.defs.select("#events-clip rect").attr("width", this.boundBox.width).attr("height", eventboardHeight);
    this.activeAxis.select("line").attr("y2", this.boundBox.height - (this.hasIndexAxis? this.indexAxisHeight : 0));
    this.eventNode.attr("transform", `translate(0,${this.axisHeight})`);
    this.eventNode.select(".board").attr("width", this.boundBox.width).attr("height", eventboardHeight);

    this.dispatch.call("resize", this.eventNode, 0, 0, this.boundBox.width, eventboardHeight);

    // Update the scale's range
    this.xScale.range([0, this.boundBox.width]);
    this.indexScale.range([0, this.boundBox.width]);

    // Calculate initialDensity based on initial scale
    const initialDensity = (this.timeDomain[1] - this.timeDomain[0]) / this.boundBox.width / MS_PER_HOUR;
    // zoomLimited[0], zoomLimited[1] is pixel per hour
    if (this.zoomLimited[0] !== -1) this.scaleExtent[0] = initialDensity * this.zoomLimited[0];
    if (this.zoomLimited[1] !== -1) this.scaleExtent[1] = initialDensity * this.zoomLimited[1];

    this.zoom.translateExtent([[0, 0], [this.boundBox.width, eventboardHeight]])
      .extent([[0, 0], [this.boundBox.width, eventboardHeight]])
      .scaleExtent(this.scaleExtent);

    // Adjust index axis position if present
    if (this.hasIndexAxis) {
      // Adjust Index Axis
      this.indexAxisNode.attr("transform", `translate(0,${this.boundBox.height - this.indexAxisHeight + 1})`);
      this.indexAxisNode.call(this.indexAxisObject);

      // Adjust Index Axis brush
      this.brush.extent([[0, 1],[this.boundBox.width, this.indexAxisHeight - 1]]);
      this.bIndexBox.call(this.brush);

      // Adjust Index brush selection
      this.bIndexBox.call(this.brush.move, currentDomain.map(this.indexScale));
      this.dispatch.call("updateAxises", this.bIndexBox, currentDomain);
    } else {
      // update axises
      this.dispatch.call("updateAxises", this.eventNode, currentDomain);
    }
  };

  // add new axis, but not update svg elements
  _addAxis(newAxis) {
    for(const axis of this.axises){
      if (axis.name === newAxis.name) {
        console.error(`Axis with name ${axis.name} already exists.`);
        return;
      }
    }

    // Add new axis and create axis objects
    let isAdd = false;
    if (newAxis.isGrid === false) {  
      for(const axis of this.axises) {
        if (axis.isGrid) {
          this.axises.splice(this.axises.indexOf(axis), 0, newAxis);
          if (this.svg != null)
            this.axisNodes[newAxis.name] = this.axisNode.insert("g", `.${axis.name}`).classed(newAxis.class, true);
          isAdd = true;
          break;
        }
      }
    }

    if (isAdd === false) {
      this.axises.push(newAxis);
      if (this.svg != null)
        this.axisNodes[newAxis.name] = this.axisNode.append("g").classed(newAxis.class, true);  
    }

    if (this.svg != null)
      this.axisObjects[newAxis.name] = this._createAxisObjects(newAxis, this.axisHeight);
    this.axisHeight += (newAxis.height == -1)? 0 : newAxis.height;
  }

  // add new axis
  addAxises(newAxises) {
    if (Array.isArray(newAxises)) {
      for(const newAxis of newAxises) {
        this._addAxis(newAxis);
      }  
    } else {
      this._addAxis(newAxises);
    }
    
    // Update all svg elements
    if (this.svg != null)
      this.resize(this.width, this.height);
  }

  on(events, func){
    this.dispatch.on(events, func);
  }

  getStyle() {
    return this.style;
  }

  setStyle(style) {
    this.style = style;
    if (this.svg != null) {
      this.svg.select("style").text(this.style);
    }
  }
}
