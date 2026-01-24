/**
 * IndexAxisManager - Index axis with brush for time range selection
 * Ported from TimelineChart with modular refactoring
 *
 * DOM Ownership: IndexAxisManager creates and manages its own DOM structure:
 * - indexContainer (div.hc-indexaxis-container)
 * - indexSvg (svg.hc-index-svg)
 * - indexGroup (g.indexAxis)
 */
import * as d3 from 'd3';
import { MS_PER_HOUR } from './utils/scales.js';

export class IndexAxisManager {
  /**
   * @param {Object} options
   * @param {number} options.width - Width of the index axis
   * @param {number} options.height - Height of the index axis
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {Array} options.zoomLimited - [minPixelsPerHour, maxPixelsPerHour]
   * @param {Function} options.onBrush - Callback when brush selection changes
   */
  constructor(options = {}) {
    this.options = {
      // Dimensions
      width: 960,
      height: 28,

      // Time axis
      timeDomain: [
        new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
        new Date(new Date().setFullYear(new Date().getFullYear() + 50))
      ],
      zoomLimited: [-1, -1],

      onBrush: () => {},
      ...options,
    }

    // DOM elements (owned by this manager)
    this.slot = null;           // External mounting point (not owned)
    this.indexContainer = null; // div.hc-indexaxis-container (owned)
    this.indexSvg = null;       // svg.hc-index-svg (owned)
    this.indexGroup = null;     // g.indexAxis (owned)

    this.indexScale = null;
    this.axisObject = null;
    this.brush = null;
    this.brushGroup = null;
    this.initialSelection = null;
  }

  /**
   * Create DOM structure and index axis elements
   * @param {d3.Selection} slot - Mounting point (div) to create DOM inside
   */
  create(slot) {
    this.destroy();

    if (!slot) return null;

    this.slot = slot;

    // Create container (div)
    this.indexContainer = this.slot.append('div')
      .classed('hc-indexaxis-container', true);

    // Create SVG
    this.indexSvg = this.indexContainer.append('svg')
      .classed('hc-index-svg', true)
      .attr('width', this.options.width)
      .attr('height', this.options.height);

    // Create root group
    this.indexGroup = this.indexSvg.append('g').classed('indexAxis', true);

    // Create axis
    this.indexScale = d3.scaleUtc()
      .domain(this.options.timeDomain)
      .range([0, this.options.width]);
    this.axisObject = d3.axisBottom(this.indexScale);
    this.indexGroup.append('g').classed('index', true).call(this.axisObject);

    // Create brush
    this.brush = d3.brushX()
      .extent([[0, 1], [this.options.width, this.options.height - 1]])
      .on('start', this._onBrushStart.bind(this))
      .on('brush end', this._onBrushEnd.bind(this));

    this.brushGroup = this.indexGroup.append('g').classed('brush', true);
    this.brushGroup
      .call(this.brush)
      .call(this.brush.move, this.options.timeDomain.map(this.indexScale));

    return this.indexGroup;
  }

  /**
   * Handle brush start event
   */
  _onBrushStart(event) {
    if (event.selection) {
      this.initialSelection = event.selection.slice();
    }
  }

  /**
   * Determine which side of the brush changed
   * @returns {number} -1: left changed, 1: right changed, 0: both changed
   * @private
   */
  _detectChangedSide(selection) {
    if (!this.initialSelection) return 0;

    const leftChanged = selection[0] !== this.initialSelection[0];
    const rightChanged = selection[1] !== this.initialSelection[1];

    if (leftChanged && !rightChanged) return -1;
    if (rightChanged && !leftChanged) return 1;
    return 0;
  }

  /**
   * Adjust domain to match desired hours, anchoring based on which side changed
   * @private
   */
  _adjustDomain(domain, desiredHours, changedSide) {
    const halfDuration = (desiredHours * MS_PER_HOUR) / 2;

    if (changedSide === -1) {
      // Left side changed - anchor right side
      return [new Date(domain[1].getTime() - desiredHours * MS_PER_HOUR), domain[1]];
    }

    if (changedSide === 1) {
      // Right side changed - anchor left side
      return [domain[0], new Date(domain[0].getTime() + desiredHours * MS_PER_HOUR)];
    }

    // Both sides changed - adjust from center
    const centerTime = (domain[0].getTime() + domain[1].getTime()) / 2;
    return [new Date(centerTime - halfDuration), new Date(centerTime + halfDuration)];
  }

  /**
   * Handle brush end event with zoom limit enforcement
   */
  _onBrushEnd(event) {
    const { selection, sourceEvent } = event;
    if (!selection) return;

    const changedSide = this._detectChangedSide(selection);
    this.initialSelection = selection.slice();

    // Convert to time domain
    let newDomain = selection.map(this.indexScale.invert);

    // Calculate and enforce zoom limits
    const totalHours = (newDomain[1] - newDomain[0]) / MS_PER_HOUR;
    const axisDensity = this.options.width / totalHours;

    const [minAllowed, maxAllowed] = this.options.zoomLimited;

    if (minAllowed !== -1 && axisDensity < minAllowed) {
      newDomain = this._adjustDomain(newDomain, this.options.width / minAllowed, changedSide);
    } else if (maxAllowed !== -1 && axisDensity > maxAllowed) {
      newDomain = this._adjustDomain(newDomain, this.options.width / maxAllowed, changedSide);
    }

    // Update brush selection if domain was adjusted
    const newSelection = newDomain.map(this.indexScale);
    if (newSelection[0] !== selection[0] || newSelection[1] !== selection[1]) {
      this.brushGroup.call(this.brush.move, newSelection);
    }

    // Notify callback if user initiated
    if (sourceEvent) {
      this.options.onBrush(newDomain);
    }
  }

  /**
   * Preserve current visible domain across scale changes
   * @private
   */
  _preserveDomain(fn) {
    const currentDomain = this.getCurrentDomain();
    fn();
    if (currentDomain && this.brushGroup) {
      this.brushGroup.call(
        this.brush.move,
        currentDomain.map(this.indexScale)
      );
    }
  }

  /**
   * Update brush selection from external source (e.g., zoom)
   * @param {Array} domain - [startDate, endDate]
   */
  updateFromZoom(domain) {
    if (!domain || this.indexGroup === null) return;

    const selection = domain.map(this.indexScale);
    if (selection[0] === 0 && selection[1] === this.options.width) {
      this.brushGroup.call(this.brush.clear);
    } else {
      this.brushGroup.call(this.brush.move, selection);
    }
  }

  /**
   * Get current visible domain
   */
  getCurrentDomain() {
    if (this.indexGroup === null) return null;

    const selection = d3.brushSelection(this.brushGroup.node());
    if (!selection) return this.options.timeDomain;
    return selection.map(this.indexScale.invert);
  }

  /**
   * Get height
   */
  getHeight() {
    return this.options.height;
  }

  /**
   * Resize the index axis
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;

    if (this.indexGroup === null) return;

    // Update SVG dimensions
    if (this.indexSvg) {
      this.indexSvg
        .attr('width', width)
        .attr('height', height);
    }

    this._preserveDomain(() => {
      // Update scale
      this.indexScale.range([0, this.options.width]);

      // Update brush extent
      this.brush.extent([[0, 1], [this.options.width, this.options.height - 1]]);
      this.brushGroup.call(this.brush);

      // Update axis
      this.indexGroup.select('.index').call(this.axisObject);
    });
  }
  
  destroy() {
    // Remove owned DOM elements
    if (this.indexContainer) {
      this.indexContainer.remove();
    }

    this.indexContainer = null;
    this.indexSvg = null;
    this.indexGroup = null;

    this.indexScale = null;
    this.axisObject = null;

    this.brush = null;
    this.brushGroup = null;
    // Keep slot reference for potential recreation
  }

  setOptions(options) {
    const affectsScale =
      options.timeDomain !== undefined;

    if (affectsScale && this.indexGroup) {
      this._preserveDomain(() => {
        this.options = { ...this.options, ...options };
        this.indexScale.domain(this.options.timeDomain);
        this.indexGroup.select('.index').call(this.axisObject);
      });
    } else {
      this.options = { ...this.options, ...options };
    }
  }

}
