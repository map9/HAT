/**
 * TooltipManager - Dual tooltip system
 * 1. Axis tooltip (SVG-based) - shows time at mouse position
 * 2. Event tooltip (HTML-based) - shows event details
 */
import * as d3 from 'd3';
import { isBCE } from './utils/scales.js';

const TOOLTIP_OFFSET = 10;
const TOOLTIP_SHOW_DELAY = 150;   // Delay before showing tooltip (ms)
const TOOLTIP_HIDE_DELAY = 100;   // Delay before hiding tooltip (ms)

export class TooltipManager {
  /**
   * @param {Object} options
   * @param {string} options.locale - Locale for date formatting
   * @param {number} options.gap - Gap between elements
   */
  constructor(options = {}) {
    this.options = {
      locale: 'en-us',
      gap: 1,
      roundRadius: 4,
      ...options
    }

    this.axisTooltip = null;
    this.itemTooltip = null;
    this.boundBox = null;

    // Timers for delayed show/hide
    this._axisShowTimer = null;
    this._axisHideTimer = null;
    this._eventShowTimer = null;
    this._eventHideTimer = null;
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
      .attr('rx', this.options.roundRadius)
      .attr('ry', this.options.roundRadius);

    this.axisTooltip.append('text')
      .attr('x', 0)
      .attr('y', 0);

    return this.axisTooltip;
  }

  /**
   * Create item tooltip (HTML)
   * @param {HTMLElement} container - DOM element to append to
   */
  createItemTooltip(container) {
    this.itemTooltip = d3.select(container)
      .append('div')
      .classed('hc-tooltip', true);

    return this.itemTooltip;
  }

  /**
   * Set bounding box for tooltip positioning
   * @param {Object} box - {left, top, right, bottom}
   */
  setBoundBox(box) {
    this.boundBox = box;
  }

  /**
   * Show/hide axis tooltip with delay
   * @param {boolean} visible
   */
  showAxisTooltip(visible) {
    if (!this.axisTooltip) return;

    if (visible) {
      // Clear any pending hide timer
      clearTimeout(this._axisHideTimer);
      this._axisHideTimer = null;

      // Delay show
      if (!this._axisShowTimer) {
        this._axisShowTimer = setTimeout(() => {
          this.axisTooltip.attr('visibility', 'visible');
          this._axisShowTimer = null;
        }, TOOLTIP_SHOW_DELAY);
      }
    } else {
      // Clear any pending show timer
      clearTimeout(this._axisShowTimer);
      this._axisShowTimer = null;

      // Delay hide
      if (!this._axisHideTimer) {
        this._axisHideTimer = setTimeout(() => {
          this.axisTooltip.attr('visibility', 'hidden');
          this._axisHideTimer = null;
        }, TOOLTIP_HIDE_DELAY);
      }
    }
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

    this.axisTooltip.attr('transform', `translate(${x + 2 * this.options.gap}, ${y})`);

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
        .attr('x', 2 * this.options.gap)
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
    const rectWidth = bbox.width + 6 * this.options.gap;
    const rectHeight = bbox.height + 2 * this.options.gap;
    const textY = -bbox.y + 3 * this.options.gap;

    this.axisTooltip.select('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('y', 2 * this.options.gap);

    text.attr('x', 3 * this.options.gap).attr('y', textY);
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
      return date.toLocaleString(this.options.locale, { era: 'short', ...options });
    }

    return date.toLocaleString(this.options.locale, options);
  }

  /**
   * Position item tooltip based on cursor position
   * Uses smart positioning to keep tooltip within bounds
   * @param {number} x - X position (relative to container)
   * @param {number} y - Y position (relative to container)
   * @private
   */
  _positionItemTooltip(x, y) {
    if (!this.itemTooltip || !this.boundBox) return;

    const box = this.boundBox;
    const boxWidth = box.right - box.left;
    const boxHeight = box.bottom - box.top;

    // Horizontal positioning: place tooltip on opposite side of cursor
    if (x > boxWidth / 2) {
      this.itemTooltip
        .style('left', 'auto')
        .style('right', `${box.right - x + TOOLTIP_OFFSET}px`);
    } else {
      this.itemTooltip
        .style('right', 'auto')
        .style('left', `${x + box.left + TOOLTIP_OFFSET}px`);
    }

    // Vertical positioning: place tooltip on opposite side of cursor
    if (y > boxHeight / 2) {
      this.itemTooltip
        .style('top', 'auto')
        .style('bottom', `${box.bottom - y + TOOLTIP_OFFSET}px`);
    } else {
      this.itemTooltip
        .style('bottom', 'auto')
        .style('top', `${y + box.top + TOOLTIP_OFFSET}px`);
    }
  }

  /**
   * Show item tooltip with delay
   * @param {string} html - HTML content
   * @param {number} x - X position (relative to container)
   * @param {number} y - Y position (relative to container)
   */
  showItemTooltip(html, x, y) {
    if (!this.itemTooltip || !this.boundBox) return;

    // Clear any pending hide timer
    clearTimeout(this._eventHideTimer);
    this._eventHideTimer = null;

    // Update content and position immediately (so it's ready when shown)
    this.itemTooltip.html(html);
    this._positionItemTooltip(x, y);

    // Delay show
    if (!this._eventShowTimer) {
      this._eventShowTimer = setTimeout(() => {
        this.itemTooltip.style('visibility', 'visible');
        this._eventShowTimer = null;
      }, this.showDelay);
    }
  }

  /**
   * Hide event tooltip with delay
   */
  hideItemTooltip() {
    if (!this.itemTooltip) return;

    // Clear any pending show timer
    clearTimeout(this._eventShowTimer);
    this._eventShowTimer = null;

    // Delay hide
    if (!this._eventHideTimer) {
      this._eventHideTimer = setTimeout(() => {
        this.itemTooltip.style('visibility', 'hidden');
        this._eventHideTimer = null;
      }, this.hideDelay);
    }
  }

  /**
   * Update event tooltip position (for tracking mouse)
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  updateItemTooltipPosition(x, y) {
    this._positionItemTooltip(x, y);
  }

  /**
   * Set locale
   * @param {string} locale
   */
  setOptions(options) {
    this.options.roundRadius = options.roundRadius ?? this.options.roundRadius;
    this.options.locale = options.locale ?? this.options.locale;
    this.options.gap = options.gap ?? this.options.gap;

    // Update axis tooltip styling if exists
    if (this.axisTooltip && options.roundRadius !== undefined) {
      this.axisTooltip.select('rect')
        .attr('rx', this.options.roundRadius)
        .attr('ry', this.options.roundRadius);
    }
  }
}
