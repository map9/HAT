/**
 * AxisManager - Multi-level time axis management
 * Ported from TimelineChart with modular refactoring
 */
import * as d3 from 'd3';
import { getHoursPerPixel } from './utils/scales.js';

export class AxisManager {
  /**
   * @param {Object} options
   * @param {Array} options.axises - Array of axis configurations
   * @param {string} options.locale - Locale for date formatting
   * @param {number} options.gap - Gap between elements
   */
  constructor(options = {}) {
    this.axises = options.axises || [];
    this.locale = options.locale || 'en-us';
    this.gap = options.gap ?? 1;

    this.axisObjects = {};
    this.axisNodes = {};
    this.totalHeight = 0;
  }

  /**
   * Calculate total height of all non-grid axes
   */
  calculateHeight() {
    this.totalHeight = 0;
    for (const axis of this.axises) {
      if (axis.height !== -1) {
        this.totalHeight += axis.height;
      }
    }
    return this.totalHeight;
  }

  /**
   * Sort axes: non-grid first, then grid (for proper layering)
   */
  sortAxises() {
    this.axises.sort((a, b) => {
      if (a.isGrid && !b.isGrid) return 1;
      if (!a.isGrid && b.isGrid) return -1;
      return 0;
    });
  }

  /**
   * Create axis rendering function for a specific axis
   * @param {Object} axis - Axis configuration
   */
  createAxisObject(axis) {
    const self = this;

    return (axisNode, hoursPerPixel, scale, y1, y2) => {
      // Handle domain limitation
      if (axis.domain) {
        if (scale.domain()[1] < axis.domain[0] || scale.domain()[0] > axis.domain[1]) {
          axisNode.attr('visibility', 'hidden');
          return;
        }

        if (scale.domain()[0] < axis.domain[0] || scale.domain()[1] > axis.domain[1]) {
          const domain = [
            Math.max(scale.domain()[0], axis.domain[0]),
            Math.min(scale.domain()[1], axis.domain[1])
          ];
          const range = domain.map(scale);
          scale = d3.scaleUtc().domain(domain).range(range);
        }
      }

      // Find appropriate interval and format based on hoursPerPixel
      let interval = undefined;
      let format = undefined;

      for (const [limit, config] of axis.map(hoursPerPixel, self.locale)) {
        if (hoursPerPixel < limit) {
          [interval, format] = config;
          format = typeof format !== 'function' ? d3.utcFormat(format) : format;
          break;
        }
      }

      axisNode.attr('visibility', interval === undefined ? 'hidden' : 'visible');
      if (interval === undefined) return;

      let el = null;
      if (axis.isGrid) {
        el = axisNode
          .attr('transform', `translate(0, ${y1})`)
          .call(d3.axisTop(scale).ticks(interval).tickSizeOuter(0));
        el.selectAll('text').remove();
      } else {
        el = axisNode
          .attr('transform', `translate(0, ${y1})`)
          .call(d3.axisTop(scale).ticks(interval).tickFormat(format).tickSizeOuter(0));
        el.selectAll('text')
          .attr('x', 3 * self.gap)
          .attr('y', axis.height - 2 * self.gap)
          .style('text-anchor', 'start');
      }

      el.select('.domain').remove();
      el.selectAll('line')
        .attr('y1', self.gap)
        .attr('y2', y2);
    };
  }

  /**
   * Create all axis elements in the container
   * @param {d3.Selection} container - SVG group to append axes to
   */
  create(container) {
    this.sortAxises();
    this.calculateHeight();

    // Create axis objects
    for (const axis of this.axises) {
      this.axisObjects[axis.name] = this.createAxisObject(axis);
    }

    // Create axis nodes
    this.axisContainer = container.append('g').classed('axises', true);
    for (const axis of this.axises) {
      this.axisNodes[axis.name] = this.axisContainer.append('g').classed(axis.class, true);
    }

    return this.axisContainer;
  }

  /**
   * Update all axes with new scale
   * @param {d3.ScaleTime} xScale - Current time scale
   * @param {number} bodyHeight - Height of body area (for grid extension)
   */
  update(xScale, bodyHeight = 0) {
    const hoursPerPixel = getHoursPerPixel(xScale);

    let axisHeightTemp = 0;
    for (const axis of this.axises) {
      const y2 = axis.height === -1
        ? bodyHeight + this.totalHeight - axisHeightTemp
        : axis.height - this.gap;

      this.axisNodes[axis.name].call(
        this.axisObjects[axis.name],
        hoursPerPixel,
        xScale,
        axisHeightTemp,
        y2
      );

      axisHeightTemp += axis.height === -1 ? 0 : axis.height;
    }
  }

  /**
   * Get total axis height
   */
  getHeight() {
    return this.totalHeight;
  }

  /**
   * Add new axes dynamically
   * @param {Array} newAxises - New axis configurations to add
   */
  addAxises(newAxises) {
    for (const axis of newAxises) {
      if (!this.axisObjects[axis.name]) {
        this.axises.push(axis);
        this.axisObjects[axis.name] = this.createAxisObject(axis);
        this.axisNodes[axis.name] = this.axisContainer.append('g').classed(axis.class, true);
      }
    }
    this.sortAxises();
    this.calculateHeight();
  }
}
