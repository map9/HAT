/**
 * PointRenderer - Render point items (single time point events)
 * Supports multiple shapes: circle, diamond, triangle, square
 */
import * as d3 from 'd3';

// D3 symbol types mapping
const SYMBOL_TYPES = {
  circle: d3.symbolCircle,
  diamond: d3.symbolDiamond2,
  square: d3.symbolSquare2,
  star: d3.symbolStar,
  cross: d3.symbolCross,
  wye: d3.symbolWye,
};

// Default shape
const DEFAULT_SHAPE = 'circle';

export class PointRenderer {
  /**
   * @param {Object} options
   * @param {number} options.sizeRatio - Point size relative to rowHeight (0-1)
   * @param {string} options.labelPosition - 'none' | 'right' | 'top'
   * @param {Function} options.colorFn - Color callback function
   * @param {Function} options.shapeFn - Shape callback function
   * @param {Function} options.onClick - Click handler
   * @param {Function} options.onHover - Hover handler
   * @param {Function} options.onLeave - Leave handler
   */
  constructor(options = {}) {
    this.sizeRatio = options.sizeRatio ?? 0.6;
    this.labelPosition = options.labelPosition ?? 'none';
    this.colorFn = options.colorFn ?? null;
    this.shapeFn = options.shapeFn ?? null;

    this.onClick = options.onClick ?? (() => {});
    this.onHover = options.onHover ?? (() => {});
    this.onLeave = options.onLeave ?? (() => {});

    this.container = null;
    this.xScale = null;
    this.rowHeight = 0;
    this.accessors = null;
  }

  /**
   * Create point container
   * @param {d3.Selection} container - SVG group to append points to
   */
  create(container) {
    // Points should be rendered above bars, so we create a separate group
    this.container = container.append('g').classed('points', true);
    return this.container;
  }

  /**
   * Get shape symbol type
   * @param {Object} d - Data item
   * @returns {d3.Symbol} D3 symbol type
   */
  _getShape(d) {
    let shapeName = DEFAULT_SHAPE;

    if (this.shapeFn) {
      const result = this.shapeFn('point', { data: d, accessors: this.accessors });
      if (result && SYMBOL_TYPES[result]) {
        shapeName = result;
      }
    }

    return SYMBOL_TYPES[shapeName] || SYMBOL_TYPES[DEFAULT_SHAPE];
  }

  /**
   * Get color for a point
   * @param {Object} d - Data item
   * @returns {string|null} Color string or null for default
   */
  _getColor(d) {
    const defaultColorAccessor = this.accessors?.color ?? (item => item.color);

    if (this.colorFn) {
      const color = this.colorFn('point', { data: d, accessors: this.accessors });
      if (color != null) {
        return color;
      }
    }

    return defaultColorAccessor(d);
  }

  /**
   * Render points from enriched data
   * @param {Array} data - Array of point items with rowNo property
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} rowHeight - Height of each row
   * @param {Object} accessors - Data accessors
   */
  render(data, xScale, rowHeight, accessors = {}) {
    if (!this.container) return;

    this.xScale = xScale;
    this.rowHeight = rowHeight;

    const defaultColorAccessor = accessors.color ?? (d => d.color);

    this.accessors = {
      key: accessors.key ?? (d => d.id),
      start: accessors.start ?? (d => d.start),
      label: accessors.label ?? (d => d.label ?? ''),
      color: this.colorFn
        ? (d => this.colorFn('point', { data: d, accessors }) ?? defaultColorAccessor(d))
        : defaultColorAccessor,
      title: accessors.title ?? (d => d.title ?? '')
    };

    const { key, start } = this.accessors;

    // Calculate point size based on rowHeight
    const pointRadius = (rowHeight * this.sizeRatio) / 2;
    const symbolSize = Math.PI * pointRadius * pointRadius; // Area for d3.symbol

    const points = this.container
      .selectAll('.point-item')
      .data(data, key);

    points.exit().remove();

    const enter = points.enter()
      .append('g')
      .classed('point-item', true);

    enter.append('path');

    if (this.labelPosition !== 'none') {
      enter.append('text');
    }

    const merged = enter.merge(points);

    // Render paths with shapes
    merged.select('path')
      .attr('transform', d => {
        const x = xScale(start(d));
        const y = d.rowNo * rowHeight + rowHeight / 2;
        return `translate(${x}, ${y})`;
      })
      .attr('d', d => {
        const symbolType = this._getShape(d);
        return d3.symbol().type(symbolType).size(symbolSize)();
      })
      .style('fill', d => this._getColor(d) ?? null)
      .on('click', (event, d) => this.onClick(d, event))
      .on('mouseenter', (event, d) => this.onHover(d, event))
      .on('mouseleave', (event, d) => this.onLeave(d, event));

    // Render labels if enabled
    if (this.labelPosition !== 'none') {
      merged.select('text')
        .attr('y', d => d.rowNo * rowHeight + rowHeight / 2)
        .attr('dy', this.labelPosition === 'top' ? -pointRadius - 4 : '0.35em')
        .text(d => this.accessors.label(d))
        .each(function(d) {
          d.__pointTextWidth = this.getComputedTextLength();
        });

      // Position text based on labelPosition
      this._updateTextPositions(xScale, pointRadius);
    }
  }

  /**
   * Update text positions
   */
  _updateTextPositions(xScale, pointRadius) {
    const { start } = this.accessors;
    const labelPosition = this.labelPosition;

    this.container.selectAll('.point-item text')
      .each(function(d) {
        const x = xScale(start(d));
        const text = d3.select(this);

        if (labelPosition === 'right') {
          text
            .attr('x', x + pointRadius + 4)
            .attr('text-anchor', 'start');
        } else if (labelPosition === 'top') {
          text
            .attr('x', x)
            .attr('text-anchor', 'middle');
        }
      });
  }

  /**
   * Update point positions (on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    if (!this.container || !this.accessors) return;

    this.xScale = xScale;
    const { start } = this.accessors;
    const rowHeight = this.rowHeight;
    const pointRadius = (rowHeight * this.sizeRatio) / 2;

    // Update path positions
    this.container.selectAll('.point-item path')
      .attr('transform', d => {
        const x = xScale(start(d));
        const y = d.rowNo * rowHeight + rowHeight / 2;
        return `translate(${x}, ${y})`;
      });

    // Update text positions if labels are enabled
    if (this.labelPosition !== 'none') {
      this._updateTextPositions(xScale, pointRadius);
    }
  }

  /**
   * Clear all points
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }

  /**
   * Set label position
   */
  setLabelPosition(position) {
    this.labelPosition = position;
  }

  /**
   * Set size ratio
   */
  setSizeRatio(ratio) {
    this.sizeRatio = ratio;
  }
}
