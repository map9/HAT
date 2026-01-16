/**
 * ZoomManager - Handle zoom/pan with scroll coordination
 * Resolves conflict between timeline zoom (wheel) and body scroll (wheel)
 */
import * as d3 from 'd3';
import { calculateScaleExtent, MS_PER_HOUR } from './utils/scales.js';

export class ZoomManager {
  /**
   * @param {Object} options
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {number} options.width - Chart width
   * @param {number} options.height - Chart height (for zoom extent)
   * @param {Array} options.zoomLimited - [minPixelsPerHour, maxPixelsPerHour]
   * @param {d3.ScaleTime} options.xScale - Base time scale
   * @param {Function} options.onZoom - Callback when zoom changes
   */
  constructor(options = {}) {
    this.timeDomain = options.timeDomain;
    this.width = options.width || 800;
    this.height = options.height || 400;
    this.zoomLimited = options.zoomLimited || [-1, -1];
    this.xScale = options.xScale;
    this.onZoom = options.onZoom || (() => {});

    this.scaleExtent = calculateScaleExtent(this.timeDomain, this.width, this.zoomLimited);
    this.zoom = null;
    this.zoomTarget = null;
  }

  /**
   * Create and attach zoom behavior
   * @param {d3.Selection} target - Element to attach zoom to
   */
  create(target) {
    this.zoomTarget = target;

    this.zoom = d3.zoom()
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [this.width, this.height]])
      .extent([[0, 0], [this.width, this.height]])
      .filter(event => this._filterEvent(event))
      .on('zoom', this._onZoom.bind(this));

    // Apply initial transform
    const initialTransform = d3.zoomIdentity
      .translate(this.xScale.range()[0], 0)
      .scale(this.scaleExtent[0])
      .translate(-this.xScale(this.timeDomain[0]), 0);

    target
      .call(this.zoom.transform, initialTransform)
      .call(this.zoom);

    return this;
  }

  /**
   * Filter events to handle zoom/scroll coordination
   * - Ctrl/Meta + wheel = zoom
   * - Shift + wheel = horizontal pan
   * - Regular wheel = pass through (for vertical scroll)
   * - Mouse drag = pan
   */
  _filterEvent(event) {
    // Always allow touch events
    if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
      return true;
    }

    // For wheel events: only respond to Ctrl/Meta (zoom) or Shift (horizontal pan)
    if (event.type === 'wheel') {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        return true;
      }
      if (event.shiftKey) {
        event.preventDefault();
        return true;
      }
      // Regular wheel: don't handle (let body scroll)
      return false;
    }

    // Allow mouse drag (for panning)
    // Only filter mousedown - D3 zoom internally tracks drag state
    if (event.type === 'mousedown') {
      return event.button === 0; // Left button only
    }

    // Double-click to reset zoom
    if (event.type === 'dblclick') {
      return true;
    }

    return true;
  }

  /**
   * Handle zoom event
   */
  _onZoom(event) {
    const { transform, sourceEvent } = event;

    // Get transformed scale
    const xt = transform.rescaleX(this.xScale);

    // Notify callback
    this.onZoom(xt, transform, sourceEvent);
  }

  /**
   * Get current transform
   */
  getTransform() {
    return d3.zoomTransform(this.zoomTarget.node());
  }

  /**
   * Get current transformed scale
   */
  getScale() {
    return this.getTransform().rescaleX(this.xScale);
  }

  /**
   * Get current visible domain
   */
  getDomain() {
    return this.getScale().domain();
  }

  /**
   * Set zoom to show specific domain
   * @param {Array} domain - [startDate, endDate]
   */
  setDomain(domain) {
    let scaleRatio = (this.xScale.domain()[1] - this.xScale.domain()[0]) / (domain[1] - domain[0]);

    // Clamp to scale extent
    if (scaleRatio < this.scaleExtent[0]) scaleRatio = this.scaleExtent[0];
    if (scaleRatio > this.scaleExtent[1]) scaleRatio = this.scaleExtent[1];

    const transform = d3.zoomIdentity
      .translate(this.xScale.range()[0], 0)
      .scale(scaleRatio)
      .translate(-this.xScale(domain[0]), 0);

    this.zoomTarget.call(this.zoom.transform, transform);
  }

  /**
   * Reset zoom to initial state
   */
  reset() {
    this.setDomain(this.timeDomain);
  }

  /**
   * Resize zoom behavior
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    // Save current domain
    const currentDomain = this.getDomain();

    this.width = width;
    this.height = height;

    // Recalculate scale extent
    this.scaleExtent = calculateScaleExtent(this.timeDomain, width, this.zoomLimited);

    // Update zoom behavior
    this.zoom
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]]);

    // Restore domain
    this.setDomain(currentDomain);
  }

  /**
   * Programmatically zoom in
   * @param {number} factor - Zoom factor (> 1)
   */
  zoomIn(factor = 1.5) {
    const currentTransform = this.getTransform();
    const newK = Math.min(currentTransform.k * factor, this.scaleExtent[1]);
    this.zoomTarget.call(this.zoom.scaleTo, newK);
  }

  /**
   * Programmatically zoom out
   * @param {number} factor - Zoom factor (> 1)
   */
  zoomOut(factor = 1.5) {
    const currentTransform = this.getTransform();
    const newK = Math.max(currentTransform.k / factor, this.scaleExtent[0]);
    this.zoomTarget.call(this.zoom.scaleTo, newK);
  }

  /**
   * Pan by amount in pixels
   * @param {number} dx - Horizontal pan amount
   */
  pan(dx) {
    const currentTransform = this.getTransform();
    this.zoomTarget.call(this.zoom.translateBy, dx / currentTransform.k, 0);
  }
}
