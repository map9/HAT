/**
 * BarRenderer - Render data bars
 * Combines features from TimelineChart eventChart and GanttChart
 */
import * as d3 from 'd3';
import { applyElementStyle } from '../../utils/styleHelper.js';

// Hysteresis margins for text visibility to prevent flickering
const TEXT_HIDE_MARGIN = 6;
const TEXT_SHOW_MARGIN = 14;

export class BarRenderer {
  /**
   * @param {Object} options
   * @param {number} options.roundRadius - Corner radius
   * @param {number} options.yPadding - Vertical padding
   * @param {string} options.textPosition -  'none' | 'left' | 'center' | 'right'
   * @param {Function} options.styleFn - Style callback for bars
   * - styleFn(type, context) => { stroke, strokeWidth, strokeDasharray, fill, fillOpacity }
   * - type: 'bar'
   * - context: { data, accessors }
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
    // Set defaults
    this.options = {
      roundRadius: 4,
      yPadding: 2,
      textPosition: 'center',
      barStyleFn: null,
      
      onClick: null,
      onHover: null,
      onLeave: null,

      ...options
    };

    this.container = null;
    this.accessors = null;
  }

  /**
   * Create bar container
   * @param {d3.Selection} container - SVG group to append bars to
   */
  create(container) {
    this.destroy();
    
    this.container = container.append('g').classed('items', true);
    return this.container;
  }

  /**
   * Render bars from enriched data
   * @param {Array} data - Array of items with rowNo property
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} rowHeight - Height of each row
   * @param {Object} accessors - Data accessors
   */
  render(data, xScale, rowHeight, accessors) {
    if (!this.container) return;

    this.accessors = accessors;

    const { key, start, end } = this.accessors;
    const barHeight = rowHeight - 2 * this.options.yPadding;

    const bars = this.container
      .selectAll('.bar-item')
      .data(data, key);

    bars.exit().remove();

    const enter = bars.enter()
      .append('g')
      .classed('bar-item', true);

    enter.append('rect');
    enter.append('text');

    const merged = enter.merge(bars);

    const self = this;
    merged.select('rect')
      .attr('x', d => xScale(start(d)))
      .attr('y', d => d.rowNo * rowHeight + self.options.yPadding)
      .attr('width', d => Math.max(1, xScale(end(d)) - xScale(start(d))))
      .attr('height', barHeight)
      .attr('rx', self.options.roundRadius)
      .attr('ry', self.options.roundRadius)
      .each(function (d) {
        const style = self._getStyle(d, accessors);
        self._applyStyle(d3.select(this), style);
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

    if (this.options.textPosition !== 'none') {
      merged.select('text')
        .attr('y', d => d.rowNo * rowHeight + rowHeight / 2)
        .attr('dy', '0.35em')
        .text(d => this.accessors.label(d))
        .each(function (d) {
          // 缓存文本宽度（一次性）
          d.__textWidth = this.getComputedTextLength();
          d.__textHidden = false;
        });

      this._updateTextPositions(xScale);
    } else {
      merged.select('text')
        .style('display', 'none');
    }
  }

  /**
   * Get style for a bar
   * @param {Object} data - bar data
   * @param {Object} accessors - Data accessors
   * @returns {Object} Style object with stroke, strokeWidth, strokeDasharray, fill, fillOpacity
   */
  _getStyle(data, accessors) {
    if (!this.options.styleFn) {
      return null;
    }

    const style = this.options.styleFn('bar', { data: data, accessors }) || {};
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
    applyElementStyle(element, style, !!this.options.styleFn);
  }

  /**
   * Update text positions
   */
  _updateTextPositions(xScale) {
    const { start, end } = this.accessors;
    const textPosition = this.options.textPosition;

    this.container.selectAll('.bar-item text')
      .each(function (d) {
        const barX = xScale(start(d));
        const barWidth = xScale(end(d)) - xScale(start(d));
        const textWidth = d.__textWidth ?? 0;

        const text = d3.select(this);

        switch (textPosition) {
          case 'left':
            text
              .attr('x', barX - 5)
              .attr('text-anchor', 'end')
              .style('visibility', 'visible');
            break;

          case 'right':
            text
              .attr('x', barX + barWidth + 5)
              .attr('text-anchor', 'start')
              .style('visibility', 'visible');
            break;

          case 'center':
          default: {
            text
              .attr('x', barX + barWidth / 2)
              .attr('text-anchor', 'middle');

            // Hysteresis logic to prevent flickering during zoom
            if (!d.__textHidden && barWidth < textWidth + TEXT_HIDE_MARGIN) {
              d.__textHidden = true;
            } else if (d.__textHidden && barWidth > textWidth + TEXT_SHOW_MARGIN) {
              d.__textHidden = false;
            }

            text.style('visibility', d.__textHidden ? 'hidden' : 'visible');
            break;
          }
        }
      });
  }

  /**
   * Update bar positions (on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    if (!this.container || !this.accessors) return;

    const { start, end } = this.accessors;

    this.container.selectAll('.bar-item rect')
      .attr('x', d => xScale(start(d)))
      .attr('width', d => Math.max(1, xScale(end(d)) - xScale(start(d))));

    if (this.options.textPosition !== 'none') {
      this._updateTextPositions(xScale);
    }
  }

  /**
   * Clear all bars
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
    const renderTriggerKeys = ['roundRadius', 'yPadding', 'textPosition', 'styleFn'];
    const needsRender = renderTriggerKeys.some(
      key => options[key] !== undefined && options[key] !== this.options[key]
    );

    Object.assign(this.options, options);
    return needsRender;
  }

}