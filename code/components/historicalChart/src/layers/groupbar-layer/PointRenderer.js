/**
 * PointRenderer - Render point items (single time point events)
 * Supports multiple shapes: circle, diamond, triangle, square
 */
import * as d3 from 'd3';
import { applyStrokeStyle, applyFillStyle } from '../../utils/styleHelper.js';

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
   * @param {string} options.textPosition - 'none' | 'top' | 'center' | 'right'
   * @param {Function} options.styleFn - Style callback for points
   * - styleFn(type, context) => { stroke, strokeWidth, fill, fillOpacity, marker }
   * - type: 'point'
   * - marker: 'circle' | 'diamond' | 'square' | 'star' | 'cross' | 'wye', default to 'circle' if invalid
   * - context: { data, accessors }
   * @param {Function} options.onClick - Click handler
   * @param {Function} options.onHover - Hover handler
   * @param {Function} options.onLeave - Leave handler
   */
  constructor(options = {}) {
    this.options = {
      sizeRatio: 0.6,
      textPosition: 'none',
      styleFn: null,
      onClick: null,
      onHover: null,
      onLeave: null,
      ...options
    };

    this.container = null;
    this.accessors = null;
  }

  /**
   * Create point container
   * @param {d3.Selection} container - SVG group to append points to
   */
  create(container) {
    this.destroy();

    this.container = container.append('g').classed('points', true);
    return this.container;
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

    this.rowHeight = rowHeight;

    const defaultColorAccessor = accessors.color ?? (d => d.color);

    this.accessors = {
      key: accessors.key ?? (d => d.id),
      start: accessors.start ?? (d => d.start),
      label: accessors.label ?? (d => d.label ?? ''),
      title: accessors.title ?? (d => d.title ?? '')
    };

    const { key, start } = this.accessors;

    // Calculate point size based on rowHeight
    const pointRadius = (rowHeight * this.options.sizeRatio) / 2;
    const symbolSize = Math.PI * pointRadius * pointRadius; // Area for d3.symbol

    const points = this.container
      .selectAll('.point-item')
      .data(data, key);

    points.exit().remove();

    const enter = points.enter()
      .append('g')
      .classed('point-item', true);

    enter.append('path');

    if (this.options.textPosition !== 'none') {
      enter.append('text');
    }

    const merged = enter.merge(points);

    // Render paths with shapes
    const self = this;
    merged.select('path')
      .attr('transform', d => {
        const x = xScale(start(d));
        const y = d.rowNo * rowHeight + rowHeight / 2;
        return `translate(${x}, ${y})`;
      })
      .each(function (d) {
        const style = self._getStyle(d, accessors);
        self._applyStyle(d3.select(this), style, symbolSize);
      })
      .call(elem => {
        if (self.options.onClick) {
          elem.on('click', (e, d) => self.options.onClick(d, e));
        }
        if (self.options.onHover) {
          elem.on('mouseenter', (e, d) => self.options.onHover(d, e));
        }
        if (self.options.onLeave) {
          elem.on('mouseleave', (e, d) => self.options.onLeave(d, e));
        }
      });


    // Render labels if enabled
    if (this.options.textPosition !== 'none') {
      merged.select('text')
        .attr('y', d => d.rowNo * rowHeight + rowHeight / 2)
        .attr('dy', this.options.textPosition === 'top' ? -pointRadius - 4 : '0.35em')
        .text(d => this.accessors.label(d))

      // Position text based on textPosition
      this._updateTextPositions(xScale, pointRadius);
    }
  }

  /**
   * Get style for a point
   * @param {Object} data - point data
   * @param {Object} accessors - Data accessors
   * @returns {Object} Style object with stroke, strokeWidth, fill, fillOpacity, marker
   */
  _getStyle(data, accessors) {
    if (!this.options.styleFn) {
      return null;
    }

    const style = this.options.styleFn('point', { data: data, accessors }) || {};
    if (!style || typeof style !== 'object') {
      return null;
    } else {
      return {
        stroke: style.stroke ?? null,
        strokeWidth: style.strokeWidth ?? null,
        fill: style.fill ?? null,
        fillOpacity: style.fillOpacity ?? null,
        marker: style.marker ?? DEFAULT_SHAPE,
      };
    }
  }

  /**
   * Apply style to a point element
   * @param {d3.Selection} element - D3 selection of the point element
   * @param {Object} style - Style object from _getStyle
   */
  _applyStyle(element, style, symbolSize) {
    // Apply shape
    element.attr('d', () => {
      const symbolType = this._getShape(style);
      return d3.symbol().type(symbolType).size(symbolSize)();
    });

    // Apply stroke and fill styles
    if (this.options.styleFn && style) {
      applyStrokeStyle(element, style);
      applyFillStyle(element, style);
    }
  }
  
  /**
   * Get shape symbol type
   * @param {Object} style - Style object from _getStyle
   * @returns {d3.Symbol} D3 symbol type
   */
  _getShape(style) {
    let shapeName = DEFAULT_SHAPE;

    if (this.options.styleFn && style) {
      if (style.marker && SYMBOL_TYPES[style.marker]) {
        shapeName = style.marker;
      }
    }

    return SYMBOL_TYPES[shapeName] || SYMBOL_TYPES[DEFAULT_SHAPE];
  }

  /**
   * Update text positions
   */
  _updateTextPositions(xScale, pointRadius) {
    const { start } = this.accessors;
    const textPosition = this.options.textPosition;

    this.container.selectAll('.point-item text')
      .each(function(d) {
        const x = xScale(start(d));
        const text = d3.select(this);

        if (textPosition === 'top' || textPosition === 'center') {
          text
            .attr('x', x)
            .attr('text-anchor', 'middle');
        } else {  // textPosition === 'right'
          text
            .attr('x', x + pointRadius + 4)
            .attr('text-anchor', 'start');
        }
      });
  }

  /**
   * Update point positions (on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   * @param {number} rowHeight - Height of each row
   */
  update(xScale, rowHeight) {
    if (!this.container || !this.accessors) return;

    const { start } = this.accessors;
    const pointRadius = (rowHeight * this.options.sizeRatio) / 2;

    // Update path positions
    this.container.selectAll('.point-item path')
      .attr('transform', d => {
        const x = xScale(start(d));
        const y = d.rowNo * rowHeight + rowHeight / 2;
        return `translate(${x}, ${y})`;
      });

    // Update text positions if labels are enabled
    if (this.options.textPosition !== 'none') {
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

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Update render options by GroupBarLayer
   * @param {Object} options - New options to merge
   * @returns {boolean} Whether re-render is needed
   */
  setOptions(options) {
    // Detect which options actually changed
    const renderTriggerKeys = ['sizeRatio', 'textPosition', 'styleFn'];
    const needsRender = renderTriggerKeys.some(
      key => options[key] !== undefined && options[key] !== this.options[key]
    );

    Object.assign(this.options, options);
    return needsRender;
  }
}
