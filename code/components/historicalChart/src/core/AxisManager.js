/**
 * AxisManager - Multi-level time axis management
 * Ported from TimelineChart with modular refactoring
 *
 * DOM Ownership: AxisManager creates and manages its own DOM structure:
 * - axisContainer (div.hc-axis-container)
 * - axisSvg (svg.hc-axis-svg)
 * - axisGroup (g) - for external elements like activeAxis
 * - axisesGroup (g.axises) - for axis rendering
 */
import * as d3 from 'd3';
import { getHoursPerPixel } from './utils/scales.js';

export class AxisManager {
  /**
   * @param {Object} options
   * @param {Array} options.axises - Array of axis configurations
   * @param {string} options.type - Filter type: 'mark' | 'grid' | 'both'
   * @param {number} options.gap - Gap between elements
   * @param {string} options.locale - Locale for date formatting
   * @param {number} options.width - Initial width
   */
  constructor(options = {}) {
    this.options = {
      axises: [],
      type: 'both',
      gap: 1,
      width: 960,
      locale: 'en-us',
      ...options
    }

    // DOM elements (owned by this manager)
    this.slot = null;           // External mounting point (not owned) - Slot mode
    this.parentGroup = null;    // External mounting point (not owned) - Group mode
    this.axisContainer = null;  // div.hc-axis-container (owned)
    this.axisSvg = null;        // svg.hc-axis-svg (owned)
    this.axisGroup = null;      // g - root group for all content (owned)
    this.axisesGroup = null;    // g.axises - for axis rendering (owned)

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

    const renderAxises = this._filterAxises(this.options.axises);

    for (const axis of renderAxises) {
      if (!axis.isGrid) {
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

    // Sync DOM order
    if (this.axisesGroup) {
      for (const axis of this.options.axises) {
        const node = this.axisNodes[axis.name];
        if (node) {
          node.raise();
        }
      }
    }
  }

  /**
   * Create axis rendering function for a specific axis
   * @param {Object} axis - Axis configuration
   */
  createAxisObject(axis) {
    const self = this;

    return (axisNode, hoursPerPixel, scale, y1, y2) => {
      // domain clipping
      if (axis.domain) {
        const [d0, d1] = scale.domain();
        if (d1 < axis.domain[0] || d0 > axis.domain[1]) {
          axisNode.attr('visibility', 'hidden');
          return;
        }

        if (d0 < axis.domain[0] || d1 > axis.domain[1]) {
          const domain = [
            Math.max(d0, axis.domain[0]),
            Math.min(d1, axis.domain[1])
          ];
          const range = domain.map(scale);
          scale = d3.scaleUtc().domain(domain).range(range);
        }
      }

      let interval;
      let format;

      for (const [limit, config] of axis.map(hoursPerPixel, self.options.locale)) {
        if (hoursPerPixel < limit) {
          [interval, format] = config;
          format = typeof format === 'function'
            ? format
            : d3.utcFormat(format);
          break;
        }
      }

      axisNode.attr('visibility', interval ? 'visible' : 'hidden');
      if (!interval) return;

      let el;
      if (axis.isGrid) {
        el = axisNode
          .attr('transform', `translate(0, ${y1})`)
          .call(d3.axisTop(scale).ticks(interval).tickSizeOuter(0));
        el.selectAll('text').remove();
      } else {
        el = axisNode
          .attr('transform', `translate(0, ${y1})`)
          .call(
            d3.axisTop(scale)
              .ticks(interval)
              .tickFormat(format)
              .tickSizeOuter(0)
          );

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
   * Create DOM structure and all axis elements
   * Supports two modes:
   * - Slot mode: Pass a div selection, creates full DOM structure (container/svg/group)
   * - Group mode: Pass an svg g selection, renders directly into it (for GridLayer)
   * @param {d3.Selection} slotOrGroup - Mounting point (div for slot mode, svg g for group mode)
   */
  create(slotOrGroup) {
    this.destroy();

    if (!slotOrGroup) return null;

    // Detect mode based on element type
    const nodeName = slotOrGroup.node().nodeName.toLowerCase();
    const isGroupMode = nodeName === 'g';

    // Calculate height first
    this.calculateHeight();

    if (isGroupMode) {
      // Group mode: render directly into the svg g element (for GridLayer)
      this.slot = null;
      this.parentGroup = slotOrGroup;  // Save parent group for recreation in setAxises()
      this.axisContainer = null;
      this.axisSvg = null;
      this.axisGroup = slotOrGroup;
      this.axisesGroup = this.axisGroup.append('g').classed('axises', true);
    } else {
      // Slot mode: create full DOM structure (for HistoricalChart)
      this.slot = slotOrGroup;

      // Create container (div)
      this.axisContainer = this.slot.append('div')
        .classed('hc-axis-container', true);

      // Create SVG
      this.axisSvg = this.axisContainer.append('svg')
        .classed('hc-axis-svg', true)
        .attr('width', this.options.width)
        .attr('height', this.totalHeight);

      // Create root group (for external elements like activeAxis)
      this.axisGroup = this.axisSvg.append('g');

      // Create axes group
      this.axisesGroup = this.axisGroup.append('g').classed('axises', true);
    }

    for (const axis of this.options.axises) {
      this.axisObjects[axis.name] = this.createAxisObject(axis);
      this.axisNodes[axis.name] = this.axisesGroup
        .append('g')
        .classed(axis.class, true);
    }

    this.sortAxises();

    return this.axisGroup;
  }

  /**
   * Get the root group for external elements (e.g., activeAxis)
   * @returns {d3.Selection|null}
   */
  getGroup() {
    return this.axisGroup;
  }

  /**
   * Update width
   * @param {number} width - New width
   */
  resize(width) {
    this.options.width = width;
    if (this.axisSvg) {
      this.axisSvg.attr('width', width);
    }
  }

  /**
   * Update all axes with new scale
   * @param {d3.ScaleTime} xScale - Current time scale
   * @param {number} bodyHeight - Height of body area
   */
  update(xScale, bodyHeight = 0) {
    if (!this.axisesGroup || !xScale) return;
    
    const hoursPerPixel = getHoursPerPixel(xScale);

    let axisHeightTemp = 0;
    const renderAxises = this._filterAxises(this.options.axises);
    for (const axis of renderAxises) {
      const y2 = axis.isGrid
        ? bodyHeight + this.totalHeight - axisHeightTemp
        : axis.height - this.options.gap;

      this.axisNodes[axis.name].call(
        this.axisObjects[axis.name],
        hoursPerPixel,
        xScale,
        axisHeightTemp,
        y2
      );

      if (!axis.isGrid) {
        axisHeightTemp += axis.height;
      }
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

    for (const axis of axises) {
      // 先检查 options.axises 中是否已有同名 axis
      if (this.options.axises.some(a => a.name === axis.name)) continue;

      // 添加到配置数组
      this.options.axises.push(axis);

      // 只有在 create 后才创建 axisObject 和 axisNode
      if (this.axisesGroup) {
        this.axisObjects[axis.name] = this.createAxisObject(axis);
        this.axisNodes[axis.name] = this.axisesGroup
          .append('g')
          .classed(axis.class, true);
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
    const names = new Set(axises.map(a => a.name));

    this.options.axises = this.options.axises.filter(axis => {
      if (names.has(axis.name)) {
        this.axisNodes[axis.name]?.remove();
        delete this.axisNodes[axis.name];
        delete this.axisObjects[axis.name];
        return false;
      }
      return true;
    });

    this.calculateHeight();
  }

  /**
   * set aixses
   * @param {Array} axises - Axis configurations to set
   */
  setAxises(axises) {
    // Save parent references before destroy (supports both Slot and Group modes)
    const slot = this.slot;
    const parentGroup = this.parentGroup;

    this.destroy();

    this.options.axises = axises.slice();

    // Recreate based on mode
    if (slot) {
      this.create(slot);
    } else if (parentGroup) {
      this.create(parentGroup);
    }
  }

  destroy() {
    this.axisObjects = {};
    this.axisNodes = {};
    this.totalHeight = 0;

    // Remove owned DOM elements based on mode
    if (this.axisContainer) {
      // Slot mode: remove entire container
      this.axisContainer.remove();
    } else if (this.axisesGroup) {
      // Group mode: only remove axisesGroup we created
      this.axisesGroup.remove();
    }

    this.axisContainer = null;
    this.axisSvg = null;
    this.axisGroup = null;
    this.axisesGroup = null;
    // Keep slot and parentGroup references for potential recreation
  }

  setOptions(options) {
    if (options.locale) this.options.locale = options.locale;
    if (options.gap) this.options.gap = options.gap;

    if (options.axises) {
      this.setAxises(options.axises);
    }
  }

}
