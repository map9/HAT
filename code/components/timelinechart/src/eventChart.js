/**
 * This is timeline Chart
 * refrence: 
 * 1. https://observablehq.com/@df23e92fd6fce069/zoomable-timeline-of-the-ai-incident-database
 * 2. https://observablehq.com/@terezaif/psf-board-timeline
 */

import * as d3 from "d3";

console.debug = console.log;
//console.debug = function () {}

export class eventChart {
  constructor(parentNode, box = { left: 0, top: 0, width: 0, height: 0 }, xScale, tooltip, options = {}) {
    this.parentNode = parentNode;
    this.box = box;
    this.xScale = xScale;
    this.tooltip = tooltip;
    this.yScale = undefined;

    // Corner radius configuration
    this.options = {
      cornerRadius: undefined,      // Fixed corner radius value (px), overrides ratio if set
      cornerRadiusRatio: 0.2,      // Corner radius as ratio of rect height (0-1)
      maxCornerRadius: 5,          // Maximum corner radius (px)
      textPosition: 'left',        // Text position: 'left', 'center', 'right'
      textNameCallback: d => d.name, // Callback to get text content
      rectStyleCallback: null,     // Callback to set rect styles (fill, stroke, etc.)
      ...options
    };
  }

  /**
   * Calculate corner radius for rect elements
   * @returns {number} Corner radius in pixels
   */
  getCornerRadius() {
    const { cornerRadius, cornerRadiusRatio, maxCornerRadius } = this.options;

    // If fixed corner radius is set, use it directly
    if (cornerRadius !== undefined && cornerRadius !== null) {
      return cornerRadius;
    }

    // Calculate dynamic corner radius based on rect height
    if (this.yScale) {
      const bandwidth = this.yScale.bandwidth();
      const dynamicRadius = bandwidth * cornerRadiusRatio;
      return Math.min(dynamicRadius, maxCornerRadius);
    }

    // Fallback to 0 if yScale is not initialized
    return 0;
  }

  /**
   * Calculate text x position based on textPosition option
   * @param {Object} d - Data object
   * @returns {number} X position in pixels
   */
  getTextX(d) {
    const rectWidth = d.start_time >= d.end_time ? 3 : this.xScale(d.end_time) - this.xScale(d.start_time);

    switch (this.options.textPosition) {
      case 'left':
        return -3; // Position to the left of rect
      case 'center':
        return rectWidth / 2; // Center of rect
      case 'right':
        return rectWidth + 3; // Position to the right of rect
      default:
        return -3;
    }
  }

  /**
   * Get text anchor based on textPosition option
   * @returns {string} Text anchor value ('start', 'middle', 'end')
   */
  getTextAnchor() {
    switch (this.options.textPosition) {
      case 'left':
        return 'end';
      case 'center':
        return 'middle';
      case 'right':
        return 'start';
      default:
        return 'end';
    }
  }

  create(eventsData) {
    this.yScale = d3.scaleBand()
      .domain(d3.range(0, d3.max(eventsData, d => d.yIndex) + 1))
      .range([0, this.box.height])
      .paddingInner(0.2);

    const cornerRadius = this.getCornerRadius();

    const e = this.parentNode.selectAll("g.event")
      .data(eventsData)
      .join('g')
      .attr('class', 'event')
      .attr('transform', d => `translate(${this.xScale(d.start_time)}, ${this.yScale(d.yIndex)})`)
      .style("cursor", "pointer");
    const rects = e.append('rect')
      .attr("width", d => (d.start_time >= d.end_time ? 3 : this.xScale(d.end_time) - this.xScale(d.start_time)))
      .attr('height', this.yScale.bandwidth())
      .attr('rx', cornerRadius)
      .attr('ry', cornerRadius);

    // Apply custom styles if callback is provided
    if (this.options.rectStyleCallback) {
      rects.each((d, i, nodes) => {
        this.options.rectStyleCallback(d3.select(nodes[i]), d);
      });
    }
    e.append('text')
      .attr('x', d => this.getTextX(d))
      .attr('y', this.yScale.bandwidth() / 2)
      .attr('dy', '0.35em') // Offset for vertical centering
      .text(d => this.options.textNameCallback(d))
      .style('font-size', this.yScale.bandwidth() > 12 ? '12px' : this.yScale.bandwidth() + 'px')
      .style('text-anchor', this.getTextAnchor());

    this.setTooltip(this.tooltip);
  }
  
  update(xScale) {
    this.xScale = xScale;
    if (this.yScale) {
      const cornerRadius = this.getCornerRadius();

      this.parentNode.selectAll("g.event")
        .attr('transform', d => `translate(${xScale(d.start_time)}, ${this.yScale(d.yIndex)})`);

      const rects = this.parentNode.selectAll("g.event rect")
        .attr("width", d => (d["start_time"] >= d["end_time"] ? 3 : xScale(d["end_time"]) - xScale(d["start_time"])))
        .attr('height', this.yScale.bandwidth())
        .attr('rx', cornerRadius)
        .attr('ry', cornerRadius);

      // Apply custom styles if callback is provided
      if (this.options.rectStyleCallback) {
        rects.each((d, i, nodes) => {
          this.options.rectStyleCallback(d3.select(nodes[i]), d);
        });
      }
      this.parentNode.selectAll("g.event text")
        .attr('x', d => this.getTextX(d))
        .attr('y', this.yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .style('font-size', this.yScale.bandwidth() > 12 ? '12px' : this.yScale.bandwidth() + 'px')
        .style('text-anchor', this.getTextAnchor())
    }
  }

  resize(left, top, width, height) {
    this.box = { left: left, top: top, width: width, height: height };

    if (this.yScale) {
      this.yScale.range([0, height]);
    }
  }
  
  getBoundBox() {
    return this.box;
  }

  getTooltip() {
    return this.tooltip;
  }

  setTooltip(tooltip) {
    this.tooltip = tooltip;
    this.parentNode.selectAll("g.event rect")
      .on("mouseout", eventMouseOut)
      .on("mouseover", eventMouseOver)
      .on("click", eventClick);

    let self = this;
    function eventMouseOut(_, d) {
      self.tooltip.show(false);
    };

    function eventMouseOver(event, d) {
      const [x, y] = d3.pointer(event, self.parentNode.node());

      self.tooltip.setPosition([x, y]);
      self.tooltip.show();
      self.tooltip.html(getEventTooltipContent(d));
    };

    function eventClick(_, d) {
      self.tooltip.html(getEventTooltipFullContent(d));

      // disable interactions
      self.parentNode.selectAll("g.event rect")
        .on("mouseout", null)
        .on("mouseover", null)
        .on("click", null);

      // re-enable interations upon closing
      d3.select("#close").on("click", function (_, d) {
        self.tooltip.show(false);
        self.parentNode.selectAll("g.event rect")
          .on("mouseout", eventMouseOut)
          .on("mouseover", eventMouseOver)
          .on("click", eventClick);
      });
    };

    function getEventTooltipContent(d) {
      const convert = (date) => date.toLocaleDateString("US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      const formatDate = (d) => {
        const [begin, end] = [convert(d.start_time), convert(d.end_time)];

        return begin === end ? begin : `${begin} – ${end}`;
      };

      const formatOption = (option) => option.toLowerCase().replace("?", "").replaceAll(" ", "_");

      const info = {
        "Occurred on": formatDate(d),
        //Location: d.location
      };


      const hr = '<hr style="padding:0; margin:5px;"/>';

      const arr = Object.entries(info).map(([key, value]) => value ? `<b>${key}:</b> ${value}` : null);

      return arr.filter(Boolean).join("<br/>") + hr + d.name;
    }

    function getEventTooltipFullContent(d) {
      const close = "<button id='close' style='position:absolute; top:2px; right:2px; border:none; border-radius:50%; cursor:pointer; background-color:white'; font-weight:bold>×</button>";
      return getEventTooltipContent(d) + close;
    }
    
  }

  node() {
    if (this.parentNode) 
      return this.parentNode.node();
    else
      return undefined;
  }
}




