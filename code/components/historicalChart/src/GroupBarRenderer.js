/**
 * GroupBarRenderer - Render group bars (separate or background mode)
 * Ported from GanttChart
 */
import * as d3 from 'd3';

// Default group colors by level
const DEFAULT_GROUP_COLORS = ['#7c4dff', '#0288d1', '#00897b', '#f57c00', '#c62828'];

export class GroupBarRenderer {
  /**
   * @param {Object} options
   * @param {string} options.mode - 'separate' | 'background'
   * @param {number} options.opacity - Group bar opacity (0-1)
   * @param {number} options.roundRadius - Corner radius
   * @param {number} options.yPadding - Vertical padding (same as bars)
   * @param {Function} options.colorFn - Function to get color for a node
   */
  constructor(options = {}) {
    this.mode = options.mode || 'separate';
    this.opacity = options.opacity ?? 0.3;
    this.roundRadius = options.roundRadius ?? 4;
    this.yPadding = options.yPadding ?? 2;
    this.colorFn = options.colorFn || null;

    this.container = null;
  }

  /**
   * Create group bar container
   * @param {d3.Selection} container - SVG group to append to
   */
  create(container) {
    this.container = container.append('g').classed('group-bars', true);
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
    if (this.mode === 'separate') {
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
    nodes.forEach(node => {
      if (node.groupBarRow < 0) return;

      const x = xScale(node.timeStart);
      const width = Math.max(1, xScale(node.timeEnd) - x);
      const y = node.groupBarRow * rowHeight + this.yPadding;
      const height = rowHeight - 2 * this.yPadding;
      const color = this._getColor(node, 'groupBar');

      const g = this.container.append('g')
        .classed('group-bar', true)
        .attr('data-level', node.level)
        .attr('data-key', node.key);

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', this.roundRadius)
        .attr('ry', this.roundRadius)
        .attr('fill', color)
        .attr('fill-opacity', this.opacity)
        .attr('stroke', color)
        .attr('stroke-width', 1.5);
    });
  }

  /**
   * Render group bars in background mode
   * Uses roundRadius * 2 for consistency with GanttChart
   */
  _renderBackground(nodes, xScale, rowHeight) {
    // Sort by level (render higher levels first for proper layering)
    const sorted = [...nodes].sort((a, b) => a.level - b.level);

    sorted.forEach(node => {
      const x = xScale(node.timeStart);
      const width = Math.max(1, xScale(node.timeEnd) - x);
      const y = node.rowStart * rowHeight;
      const height = (node.rowEnd - node.rowStart + 1) * rowHeight;
      const color = this._getColor(node, 'groupBackground');

      const g = this.container.append('g')
        .classed('group-bar', true)
        .classed('background', true)
        .attr('data-level', node.level)
        .attr('data-key', node.key);

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', this.roundRadius * 2)
        .attr('ry', this.roundRadius * 2)
        .attr('fill', color)
        .attr('fill-opacity', this.opacity)
        .style('pointer-events', 'none'); // Don't block bar interactions
    });
  }

  /**
   * Get color for a node
   * @param {LaneNode} node - The lane node
   * @param {string} type - 'groupBar' or 'groupBackground'
   */
  _getColor(node, type = 'groupBar') {
    if (this.colorFn) {
      const color = this.colorFn(type, { node, mode: this.mode });
      if (color != null) {
        return color;
      }
    }
    return DEFAULT_GROUP_COLORS[node.level % DEFAULT_GROUP_COLORS.length];
  }

  /**
   * Update group bar positions (on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    if (!this.container) return;

    this.container.selectAll('.group-bar rect')
      .attr('x', function() {
        const g = d3.select(this.parentNode);
        const key = g.attr('data-key');
        // Need to recalculate from node - simplified approach
        return d3.select(this).attr('x'); // Keep current position
      });

    // For proper update, we'd need to store node references
    // This simplified version just keeps positions
  }

  /**
   * Update with full redraw (needed when tree changes)
   */
  updateFull(laneTree, xScale, rowHeight, accessors) {
    this.render(laneTree, xScale, rowHeight, accessors);
  }

  /**
   * Set mode
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Clear all group bars
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }
}
