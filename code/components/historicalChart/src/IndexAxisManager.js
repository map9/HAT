/**
 * IndexAxisManager - Index axis with brush for time range selection
 * Ported from TimelineChart with modular refactoring
 */
import * as d3 from 'd3';
import { MS_PER_HOUR } from './utils/scales.js';

export class IndexAxisManager {
  /**
   * @param {Object} options
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {number} options.width - Width of the index axis
   * @param {number} options.height - Height of the index axis
   * @param {Array} options.zoomLimited - [minPixelsPerHour, maxPixelsPerHour]
   * @param {Function} options.onBrush - Callback when brush selection changes
   */
  constructor(options = {}) {
    this.timeDomain = options.timeDomain;
    this.width = options.width || 800;
    this.height = options.height || 28;
    this.zoomLimited = options.zoomLimited || [-1, -1];
    this.onBrush = options.onBrush || (() => {});

    this.indexScale = d3.scaleUtc()
      .domain(this.timeDomain)
      .range([0, this.width]);

    this.brush = null;
    this.brushGroup = null;
    this.initialSelection = null;
  }

  /**
   * Create index axis elements
   * @param {d3.Selection} container - Container to append index axis to
   */
  create(container) {
    this.container = container.append('g').classed('indexAxis', true);

    // Create axis
    this.axisObject = d3.axisBottom(this.indexScale);
    this.container.append('g').classed('index', true).call(this.axisObject);

    // Create brush
    this.brush = d3.brushX()
      .extent([[0, 1], [this.width, this.height - 1]])
      .on('start', this._onBrushStart.bind(this))
      .on('brush end', this._onBrushEnd.bind(this));

    this.brushGroup = this.container.append('g').classed('brush', true);
    this.brushGroup
      .call(this.brush)
      .call(this.brush.move, this.timeDomain.map(this.indexScale));

    return this.container;
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
   * Handle brush end event with zoom limit enforcement
   */
  _onBrushEnd(event) {
    const { selection, sourceEvent } = event;
    if (!selection) return;

    // Determine which side changed
    let status = 0; // -1: left changed, 1: right changed, 0: both changed
    if (this.initialSelection) {
      if (selection[0] !== this.initialSelection[0] && selection[1] === this.initialSelection[1]) {
        status = -1;
      } else if (selection[1] !== this.initialSelection[1] && selection[0] === this.initialSelection[0]) {
        status = 1;
      }
    }
    this.initialSelection = selection.slice();

    // Convert to time domain
    let newDomain = selection.map(this.indexScale.invert);

    // Calculate axis density
    const totalHours = (newDomain[1] - newDomain[0]) / MS_PER_HOUR;
    let axisDensity = this.width / totalHours; // pixels per hour

    const minAllowed = this.zoomLimited[0];
    const maxAllowed = this.zoomLimited[1];

    // Enforce minimum zoom (too zoomed out)
    if (minAllowed !== -1 && axisDensity < minAllowed) {
      const desiredHours = this.width / minAllowed;
      newDomain = this._adjustDomain(newDomain, desiredHours, status);
    }

    // Enforce maximum zoom (too zoomed in)
    if (maxAllowed !== -1 && axisDensity > maxAllowed) {
      const desiredHours = this.width / maxAllowed;
      newDomain = this._adjustDomain(newDomain, desiredHours, status);
    }

    // Update brush selection if needed
    const newSelection = newDomain.map(this.indexScale);
    if (newSelection[0] !== selection[0] || newSelection[1] !== selection[1]) {
      this.brushGroup.call(this.brush.move, newSelection);
    }

    // Notify callback if user initiated
    if (sourceEvent) {
      this.onBrush(newDomain);
    }
  }

  /**
   * Adjust domain to match desired hours
   */
  _adjustDomain(domain, desiredHours, status) {
    if (status === 0) {
      // Both sides changed - adjust from center
      const centerTime = (domain[0].getTime() + domain[1].getTime()) / 2;
      return [
        new Date(centerTime - (desiredHours * MS_PER_HOUR) / 2),
        new Date(centerTime + (desiredHours * MS_PER_HOUR) / 2)
      ];
    } else if (status === -1) {
      // Left side changed - fix right side
      return [
        new Date(domain[1].getTime() - desiredHours * MS_PER_HOUR),
        domain[1]
      ];
    } else {
      // Right side changed - fix left side
      return [
        domain[0],
        new Date(domain[0].getTime() + desiredHours * MS_PER_HOUR)
      ];
    }
  }

  /**
   * Update brush selection from external source (e.g., zoom)
   * @param {Array} domain - [startDate, endDate]
   */
  updateFromZoom(domain) {
    if (!domain) return;

    const selection = domain.map(this.indexScale);
    if (selection[0] === 0 && selection[1] === this.width) {
      this.brushGroup.call(this.brush.clear);
    } else {
      this.brushGroup.call(this.brush.move, selection);
    }
  }

  /**
   * Resize the index axis
   * @param {number} width - New width
   */
  resize(width) {
    this.width = width;
    this.indexScale.range([0, width]);

    // Update brush extent
    this.brush.extent([[0, 1], [width, this.height - 1]]);
    this.brushGroup.call(this.brush);

    // Update axis
    this.container.select('.index').call(this.axisObject);
  }

  /**
   * Get current visible domain
   */
  getDomain() {
    const selection = d3.brushSelection(this.brushGroup.node());
    if (!selection) return this.timeDomain;
    return selection.map(this.indexScale.invert);
  }

  /**
   * Get height
   */
  getHeight() {
    return this.height;
  }
}
