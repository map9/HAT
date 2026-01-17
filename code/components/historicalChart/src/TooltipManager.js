/**
 * TooltipManager - Dual tooltip system
 * 1. Axis tooltip (SVG-based) - shows time at mouse position
 * 2. Event tooltip (HTML-based) - shows event details
 */
import * as d3 from 'd3';
import { isBCE } from './utils/scales.js';

export class TooltipManager {
  /**
   * @param {Object} options
   * @param {string} options.locale - Locale for date formatting
   * @param {number} options.gap - Gap between elements
   */
  constructor(options = {}) {
    this.locale = options.locale || 'en-us';
    this.gap = options.gap ?? 1;
    this.roundRadius = options.roundRadius ?? 4;

    this.axisTooltip = null;
    this.eventTooltip = null;
    this.boundBox = null;
  }

  /**
   * Create axis tooltip (SVG)
   * @param {d3.Selection} container - SVG group to append to
   */
  createAxisTooltip(container) {
    this.axisTooltip = container.append('g').classed('axis-tooltip', true);
    this.axisTooltip.attr('visibility', 'hidden');

    this.axisTooltip.append('rect')
      .attr('width', 0)
      .attr('height', 0)
      .attr('rx', this.roundRadius)
      .attr('ry', this.roundRadius);

    this.axisTooltip.append('text')
      .attr('x', 0)
      .attr('y', 0);

    return this.axisTooltip;
  }

  /**
   * Create event tooltip (HTML)
   * @param {HTMLElement} container - DOM element to append to
   */
  createEventTooltip(container) {
    this.eventTooltip = d3.select(container)
      .append('div')
      .classed('hc-tooltip', true);

    return this.eventTooltip;
  }

  /**
   * Set bounding box for tooltip positioning
   * @param {Object} box - {left, top, right, bottom}
   */
  setBoundBox(box) {
    this.boundBox = box;
  }

  /**
   * Show/hide axis tooltip
   * @param {boolean} visible
   */
  showAxisTooltip(visible) {
    this.axisTooltip.attr('visibility', visible ? 'visible' : 'hidden');
  }

  /**
   * Update axis tooltip position and content
   * @param {Date} date - Date at cursor position
   * @param {number} x - X position in chart coordinates
   * @param {number} y - Y position for tooltip
   * @param {Object} customContent - Optional custom content {value: string}
   */
  updateAxisTooltip(date, x, y, customContent = null) {
    if (!this.axisTooltip) return;

    this.axisTooltip.attr('transform', `translate(${x + 2 * this.gap}, ${y})`);

    // Format date
    let dateString;
    if (customContent && customContent.value) {
      dateString = customContent.value;
    } else {
      dateString = this._formatDate(date);
    }

    const text = this.axisTooltip.select('text');
    text.selectAll('tspan').remove();
    text.attr('y', 0);

    // Handle multi-line content
    let bbox = { x: 0, y: 0, width: 0, height: 0 };
    dateString.split('\n').forEach((line, i) => {
      const tspan = text.append('tspan');
      tspan
        .attr('x', 2 * this.gap)
        .attr('dy', i === 0 ? 0 : 15)
        .text(line);

      try {
        const bboxT = tspan.node().getBBox();
        // Check if getBBox returned valid values
        if (bboxT && typeof bboxT.width === 'number' && !isNaN(bboxT.width)) {
          if (bbox.width === 0 && bbox.height === 0) {
            bbox = { x: bboxT.x, y: bboxT.y, width: bboxT.width, height: bboxT.height };
          } else {
            if (bbox.height < bboxT.y - bbox.y + bboxT.height) {
              bbox.height = bboxT.y - bbox.y + bboxT.height;
            }
            if (bbox.width < bboxT.width) {
              bbox.width = bboxT.width;
            }
          }
        }
      } catch (e) {
        // getBBox can throw in some browsers when element is not rendered
      }
    });

    // If bbox is still empty, estimate size based on text length
    if (bbox.width === 0) {
      bbox.width = dateString.length * 7; // Approximate character width
      bbox.height = 14; // Approximate line height
    }

    // Update background rect
    const rectWidth = bbox.width + 6 * this.gap;
    const rectHeight = bbox.height + 2 * this.gap;
    const textY = -bbox.y + 3 * this.gap;

    this.axisTooltip.select('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('y', 2 * this.gap);

    text.attr('x', 3 * this.gap).attr('y', textY);
  }

  /**
   * Format date for tooltip display
   */
  _formatDate(date) {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    };

    if (isBCE(date)) {
      return date.toLocaleString(this.locale, { era: 'short', ...options });
    }

    return date.toLocaleString(this.locale, options);
  }

  /**
   * Show event tooltip
   * @param {string} html - HTML content
   * @param {number} x - X position (relative to container)
   * @param {number} y - Y position (relative to container)
   */
  showEventTooltip(html, x, y) {
    if (!this.eventTooltip || !this.boundBox) return;

    this.eventTooltip.html(html);

    // Smart positioning to avoid going off-screen
    const box = this.boundBox;
    const offset = 10;

    if (x > (box.right - box.left) / 2) {
      // Right half - position to left of cursor
      this.eventTooltip
        .style('left', 'auto')
        .style('right', `${box.right - x + offset}px`);
    } else {
      // Left half - position to right of cursor
      this.eventTooltip
        .style('right', 'auto')
        .style('left', `${x + box.left + offset}px`);
    }

    if (y > (box.bottom - box.top) / 2) {
      // Bottom half - position above cursor
      this.eventTooltip
        .style('top', 'auto')
        .style('bottom', `${box.bottom - y + offset}px`);
    } else {
      // Top half - position below cursor
      this.eventTooltip
        .style('bottom', 'auto')
        .style('top', `${y + box.top + offset}px`);
    }

    this.eventTooltip.style('visibility', 'visible');
  }

  /**
   * Hide event tooltip
   */
  hideEventTooltip() {
    if (!this.eventTooltip) return;
    this.eventTooltip.style('visibility', 'hidden');
  }

  /**
   * Update event tooltip position (for tracking mouse)
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  updateEventTooltipPosition(x, y) {
    if (!this.eventTooltip || !this.boundBox) return;

    const box = this.boundBox;
    const offset = 10;

    if (x > (box.right - box.left) / 2) {
      this.eventTooltip
        .style('left', 'auto')
        .style('right', `${box.right - x + offset}px`);
    } else {
      this.eventTooltip
        .style('right', 'auto')
        .style('left', `${x + box.left + offset}px`);
    }

    if (y > (box.bottom - box.top) / 2) {
      this.eventTooltip
        .style('top', 'auto')
        .style('bottom', `${box.bottom - y + offset}px`);
    } else {
      this.eventTooltip
        .style('bottom', 'auto')
        .style('top', `${y + box.top + offset}px`);
    }
  }

  /**
   * Set locale
   * @param {string} locale
   */
  setLocale(locale) {
    this.locale = locale;
  }
}
