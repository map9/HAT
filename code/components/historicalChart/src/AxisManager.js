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
   * @param {string} options.type - Filter type: 'mark' | 'grid' | 'both'
   */
  constructor(options = {}) {
    this.options = {
      axises: [],
      locale: 'en-us',
      gap: 1,
      type: 'both',
      ...options
    }

    this.axisObjects = {};
    this.axisNodes = {};
    this.totalHeight = 0;
  }

  /**
   * Filter axes based on type setting
   * @param {Array} axises - Array of axis configurations
   * @returns {Array} Filtered axes
   * @private
   */
  _filterAxises(axises) {
    if (this.options.type === 'both') return axises;

    const wantGrid = this.options.type === 'grid';
    return axises.filter(axis => axis.isGrid === wantGrid);
  }

  /**
   * Calculate total height of all non-grid axes
   */
  calculateHeight() {
    this.totalHeight = 0;
    const filteredAxises = this._filterAxises(this.options.axises);
    for (const axis of filteredAxises) {
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
    this.options.axises.sort((a, b) => {
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

      for (const [limit, config] of axis.map(hoursPerPixel, self.options.locale)) {
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
          .attr('x', 3 * self.options.gap)
          .attr('y', axis.height - 2 * self.options.gap)
          .style('text-anchor', 'start');
      }

      el.select('.domain').remove();
      el.selectAll('line')
        .attr('y1', self.options.gap)
        .attr('y2', y2);
    };
  }

  /**
   * Create all axis elements in the container
   * @param {d3.Selection} container - SVG group to append axes to
   */
  create(container) {
    this.destroy();
    
    this.sortAxises();
    this.calculateHeight();

    const filteredAxises = this._filterAxises(this.options.axises);
    // Create axis objects
    for (const axis of filteredAxises) {
      this.axisObjects[axis.name] = this.createAxisObject(axis);
    }

    // Create axis nodes
    this.axisContainer = container.append('g').classed('axises', true);
    for (const axis of filteredAxises) {
      this.axisNodes[axis.name] = this.axisContainer.append('g').classed(axis.class, true);
    }

    return this.axisContainer;
  }

  /**
   * Update all axes with new scale
   * @param {d3.ScaleTime} xScale - Current time scale
   * @param {number} bodyHeight - Height of body area
   */
  update(xScale, bodyHeight = 0) {
    const hoursPerPixel = getHoursPerPixel(xScale);

    let axisHeightTemp = 0;
    const filteredAxises = this._filterAxises(this.options.axises);
    for (const axis of filteredAxises) {
      const y2 = axis.height === -1
        ? bodyHeight + this.totalHeight - axisHeightTemp
        : axis.height - this.options.gap;

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
   * Add new aixses dynamically
   * @param {Array} axises - New aixs configurations to add
   */
  addAxises(axises) {
    if (!axises || axises.length === 0) return;
    
    const filteredAxises = this._filterAxises(axises);
    for (const axis of filteredAxises) {
      if (!this.axisObjects[axis.name]) {
        this.options.axises.push(axis);
        this.axisObjects[axis.name] = this.createAxisObject(axis);
        this.axisNodes[axis.name] = this.axisContainer.append('g').classed(axis.class, true);
      }
    }

    this.sortAxises();
    this.calculateHeight();
  }

  /**
   * Remove aixses dynamically
   * @param {Array} axises - Axis configurations to remove (matched by name)
   */
  removeAxises(axises) {
    const namesToRemove = new Set(axises.map(axis => axis.name));

    for (const name of namesToRemove) {
      if (this.axisObjects[name]) {
        // Remove DOM node
        if (this.axisNodes[name]) {
          this.axisNodes[name].remove();
          delete this.axisNodes[name];
        }

        // Remove axis object
        delete this.axisObjects[name];

        // Remove from axises array
        const index = this.options.axises.findIndex(axis => axis.name === name);
        if (index !== -1) {
          this.options.axises.splice(index, 1);
        }
      }
    }

    this.calculateHeight();
  }

  /**
   * set aixses
   * @param {Array} axises - Axis configurations to set
   */
  setAxises(axises) {
    this.removeAxises(this.options.axises);
    this.addAxises(axises);
  }

  destroy() {
    this.axisObjects = {};
    this.axisNodes = {};
    this.totalHeight = 0;
    if (this.axisContainer) {
      this.axisContainer.remove();
      this.axisContainer = null;
    }
  }

  setOptions(options) {
    if (options.locale !== undefined) this.options.locale = options.locale;
    if (options.gap !== undefined) this.options.gap = options.gap;

    if (options.axises !== undefined) {
      this.setAxises(options.axises);
    }
  }

}
