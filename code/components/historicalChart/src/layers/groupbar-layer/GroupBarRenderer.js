/**
 * GroupBarRenderer - Render group bars (separate or background mode)
 * Ported from GanttChart
 */
import * as d3 from 'd3';

export class GroupBarRenderer {
  /**
   * @param {Object} options
   * @param {string} options.mode - 'separate' | 'background'
   * @param {number} options.roundRadius - Corner radius
   * @param {number} options.yPadding - Vertical padding (same as bars)
   * @param {Function} options.styleFn - Style callback for groupBars
   * - styleFn(type, node) => { stroke, strokeWidth, strokeDasharray, fill, fillOpacity }
   * - type: 'separate' | 'background'
   * - node: groupbar node
   * - type: 'link'
   * - link: link data
   * - Returned style object properties:
   * - stroke: string - Border color
   * - strokeWidth: number - Border width
   * - strokeDasharray: string - Dash pattern (e.g., '5,5', '10,5,2,5')
   * - fill: string - Fill color
   * - fillOpacity: number - Fill opacity (0 to 1)
   * @param {Function} options.onClick - Click handler
   * @param {Function} options.onHover - Hover handler
   * @param {Function} options.onLeave - Leave handler
   */
  constructor(options = {}) {
    this.options = {
      mode: 'separate',
      roundRadius: 4,
      yPadding: 2,
      styleFn: null,
      onClick: null,
      onHover: null,
      onLeave: null,
      ...options
    };

    this.container = null;
  }

  /**
   * Create group bar container
   * @param {d3.Selection} container - SVG group to append to
   */
  create(container) {
    this.destroy();
    
    this.container = container.append('g').classed('group-items', true);
    return this.container;
  }

  /**
   * Render group bars from lane tree
   * @param {LaneNode} laneTree - Root of lane tree
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} rowHeight - Height of each row
   * @param {Object} accessors - Data accessors {start, end}
   */
  render(laneTree, xScale, rowHeight, accessors = {}) {
    if (!this.container) return;

    const { start = d => d.start, end = d => d.end } = accessors;

    // Clear existing bars
    this.container.selectAll('*').remove();

    // Collect nodes that should have group bars
    const nodesToRender = this._collectGroupNodes(laneTree, start, end);

    // Render based on mode
    if (this.options.mode === 'separate') {
      this._renderSeparate(nodesToRender, xScale, rowHeight);
    } else {
      this._renderBackground(nodesToRender, xScale, rowHeight);
    }
  }

  /**
   * Collect nodes that should render group bars
   */
  _collectGroupNodes(root, start, end) {
    const nodes = [];

    const traverse = (node) => {
      if (node.shouldRenderGroupBar()) {
        // Calculate time range for this group
        node.calculateTimeRange(start, end);
        if (node.timeStart && node.timeEnd) {
          nodes.push(node);
        }
      }

      if (node.expanded && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    };

    if (root.children) {
      root.children.forEach(child => traverse(child));
    }

    return nodes;
  }

  /**
   * Render group bars in separate row mode
   * Uses yPadding for consistency with GanttChart
   */
  _renderSeparate(nodes, xScale, rowHeight) {
    const self = this;
    nodes.forEach(node => {
      if (node.groupBarRow < 0) return;

      const x = xScale(node.timeStart);
      const width = Math.max(1, xScale(node.timeEnd) - x);
      const y = node.groupBarRow * rowHeight + self.options.yPadding;
      const height = rowHeight - 2 * self.options.yPadding;
      const style = self._getStyle(node);

      const g = self.container.append('g')
        .classed('group-item', true)
        .attr('data-level', node.level)
        .attr('data-key', node.key);

      const element = g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', self.options.roundRadius)
        .attr('ry', self.options.roundRadius)
        .call(elem => {
          if (self.options.onClick) {
            elem.on('click', (e) => self.options.onClick(node, e));
          }
          if (self.options.onHover) {
            elem.on('mouseenter', (e) => self.options.onHover(node, e));
          }
          if (self.options.onLeave) {
            elem.on('mouseleave', (e) => self.options.onLeave(node, e));
          }
        });

      self._applyStyle(element, style);
    });
  }

  /**
   * Render group bars in background mode
   * Uses roundRadius * 2 for consistency with GanttChart
   */
  _renderBackground(nodes, xScale, rowHeight) {
    // Sort by level (render higher levels first for proper layering)
    const sorted = [...nodes].sort((a, b) => a.level - b.level);

    const self = this;
    sorted.forEach(node => {
      const x = xScale(node.timeStart);
      const width = Math.max(1, xScale(node.timeEnd) - x);
      const y = node.rowStart * rowHeight;
      const height = (node.rowEnd - node.rowStart + 1) * rowHeight;
      const style = self._getStyle(node);

      const g = this.container.append('g')
        .classed('group-item', true)
        .classed('background', true)
        .attr('data-level', node.level)
        .attr('data-key', node.key);

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', self.options.roundRadius * 2)
        .attr('ry', self.options.roundRadius * 2)
        .call(elem => {
          if (self.options.onClick) {
            elem.on('click', (e) => self.options.onClick(node, e));
          }
          if (self.options.onHover) {
            elem.on('mouseenter', (e) => self.options.onHover(node, e));
          }
          if (self.options.onLeave) {
            elem.on('mouseleave', (e) => self.options.onLeave(node, e));
          }
        });

      self._applyStyle(element, style);
    });
  }

  /**
   * Get style for a group bar
   * @param {Object} node - groupbar node
   * @returns {Object} Style object with stroke, strokeWidth, strokeDasharray, fill, fillOpacity
   */
  _getStyle(node) {
    if (!this.options.styleFn) {
      return null;
    }

    const style = this.options.styleFn(this.mode, node) || {};
    if (!style || typeof style !== 'object') {
      return null;
    } else {
      return {
        stroke: style.stroke ?? null,
        strokeWidth: style.strokeWidth ?? null,
        strokeDasharray: style.strokeDasharray ?? null,
        fill: style.fill ?? null,
        fillOpacity: style.fillOpacity ?? null
      };
    }
  }

  /**
   * Apply style to a bar element
   * @param {d3.Selection} element - D3 selection of the bar element
   * @param {Object} style - Style object from _getStyle
   */
  _applyStyle(element, style) {
    // Apply stroke style only if styleFn is provided
    if (this.options.styleFn && style) {
      if (style.stroke !== null) {
        element.style('stroke', style.stroke);
      }
      if (style.strokeWidth !== null) {
        element.style('stroke-width', style.strokeWidth);
      }
      if (style.strokeDasharray !== null) {
        element.style('stroke-dasharray', style.strokeDasharray);
      }
      if (style.fill !== null) {
        element.style('fill', style.fill);
      }
      if (style.fillOpacity !== null) {
        element.style('fill-opacity', style.fillOpacity);
      }
    }
  }

  /**
   * Update group bar positions (on zoom/pan)
   * need to fixed
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    if (!this.container) return;

  }

  /**
   * Clear all group bars
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }
  
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Update render options by GroupbarLayer and need to re-render by caller
   * @param {Object} options - New options to merge
   */
  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

}
