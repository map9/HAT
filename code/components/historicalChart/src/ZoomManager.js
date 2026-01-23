/**
 * ZoomManager - Handle zoom/pan with scroll coordination
 * Resolves conflict between timeline zoom (wheel) and body scroll (wheel)
 */
import * as d3 from 'd3';
import { calculateScaleExtent, MS_PER_HOUR } from './utils/scales.js';

export class ZoomManager {
  /**
   * @param {Object} options
   * @param {number} options.width - Chart width
   * @param {number} options.height - Chart height (for zoom extent)
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {Array} options.zoomLimited - [minPixelsPerHour, maxPixelsPerHour]
   * @param {Function} options.onZoom - Callback when zoom changes
   */
  constructor(options = {}) {
    this.options = {
      width: 960,
      height: 500,

      timeDomain: [
        new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
        new Date(new Date().setFullYear(new Date().getFullYear() + 50))
      ],
      zoomLimited: [-1, -1],

      onZoom: () => {},
      ...options
    }
    
    this.xScale = null;
    this.scaleExtent = null;
    this.zoom = null;
    this.zoomTarget = null;
  }

  /**
   * Create and attach zoom behavior
   * @param {d3.Selection} target - Element to attach zoom to
   */
  create(target) {
    if (!target || target.empty()) {
      return null;
    }

    this.zoomTarget = target;

    // Initialize scale
    this.xScale = d3.scaleUtc()
      .domain(this.options.timeDomain)
      .range([0, this.options.width]);

    this.scaleExtent = calculateScaleExtent(
      this.options.timeDomain,
      this.options.width,
      this.options.zoomLimited);

    this.zoom = d3.zoom()
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [this.options.width, this.options.height]])
      .extent([[0, 0], [this.options.width, this.options.height]])
      .filter(event => this._filterEvent(event))
      .on('zoom', this._onZoom.bind(this));

    // Apply initial transform
    const initialTransform = d3.zoomIdentity
      .translate(this.xScale.range()[0], 0)
      .scale(this.scaleExtent[0])
      .translate(-this.xScale(this.options.timeDomain[0]), 0);

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
    this.options.onZoom(xt, transform, sourceEvent);
  }

  /**
   * Get current transform
   */
  getTransform() {
    if (this.zoomTarget === null) {
      return null;
    }

    return d3.zoomTransform(this.zoomTarget.node());
  }

  /**
   * Get current transformed scale
   */
  getScale() {
    if (this.zoomTarget === null) {
      return null;
    }

    return this.getTransform().rescaleX(this.xScale);
  }

  /**
   * Get current visible domain
   */
  getCurrentDomain() {
    if (this.zoomTarget === null) {
      return null;
    }

    return this.getScale().domain();
  }

  /**
   * Resize zoom extent
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.options.width = width || this.options.width;
    this.options.height = height || this.options.height;

    if (this.zoomTarget === null)
      return;

    // Save current domain
    const currentDomain = this.getCurrentDomain();

    // Update scale
    this.xScale.range([0, this.options.width]);

    // Recalculate scale extent
    this.scaleExtent = calculateScaleExtent(this.options.timeDomain, this.options.width, this.options.zoomLimited);

    // Update zoom behavior
    this.zoom
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [this.options.width, this.options.height]])
      .extent([[0, 0], [this.options.width, this.options.height]]);

    // Restore domain
    this.zoomToDomain(currentDomain);
  }

  /**
   * zoom to specific domain
   * @param {Array} domain - [startDate, endDate]
   */
  zoomToDomain(domain) {
    if (this.zoomTarget === null)
      return;

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
    if (this.zoomTarget === null)
      return;

    this.zoomToDomain(this.options.timeDomain);
  }

  /**
   * Programmatically zoom in
   * @param {number} factor - Zoom factor (> 1)
   */
  zoomIn(factor = 1.5) {
    if (this.zoomTarget === null)
      return;

    const currentTransform = this.getTransform();
    const newK = Math.min(currentTransform.k * factor, this.scaleExtent[1]);
    this.zoomTarget.call(this.zoom.scaleTo, newK);
  }

  /**
   * Programmatically zoom out
   * @param {number} factor - Zoom factor (> 1)
   */
  zoomOut(factor = 1.5) {
    if (this.zoomTarget === null)
      return;

    const currentTransform = this.getTransform();
    const newK = Math.max(currentTransform.k / factor, this.scaleExtent[0]);
    this.zoomTarget.call(this.zoom.scaleTo, newK);
  }

  /**
   * Pan by amount in pixels
   * @param {number} dx - Horizontal pan amount
   */
  pan(dx) {
    if (this.zoomTarget === null)
      return;

    const currentTransform = this.getTransform();
    this.zoomTarget.call(this.zoom.translateBy, dx / currentTransform.k, 0);
  }

  /**
   * Update time domain dynamically
   * @param {Array} timeDomain - [startDate, endDate]
   * @param {Array} [zoomLimited] - Optional new zoom limits [minPixelsPerHour, maxPixelsPerHour]
   */
  setTimeDomain(timeDomain, zoomLimited) {
    const visible = this.getCurrentDomain();
    this.options.timeDomain = timeDomain || this.options.timeDomain;
    this.options.zoomLimited = zoomLimited || this.options.zoomLimited;

    if (this.zoomTarget === null) {
      return;
    }

    // 更新 options
    this.options.timeDomain = timeDomain || this.options.timeDomain;
    this.options.zoomLimited = zoomLimited || this.options.zoomLimited;

    // 更新 base scale
    this.xScale.domain(timeDomain);

    // 重新计算 zoom 约束
    this.scaleExtent = calculateScaleExtent(
      timeDomain,
      this.options.width,
      this.options.zoomLimited
    );

    this.zoom
      .scaleExtent(this.scaleExtent)
      .translateExtent([[0, 0], [this.options.width, this.options.height]])
      .extent([[0, 0], [this.options.width, this.options.height]]);

    let targetDomain;

    // 1. 完全不相交 → 直接 reset 到新 domain
    if (visible[1] <= timeDomain[0] || visible[0] >= timeDomain[1]) {
      targetDomain = timeDomain;
    }
    // 2. 有交集 → 裁剪保留
    else {
      targetDomain = [
        new Date(Math.max(visible[0].getTime(), timeDomain[0].getTime())),
        new Date(Math.min(visible[1].getTime(), timeDomain[1].getTime()))
      ];
    }

    // 3. 应用
    this.zoomToDomain(targetDomain);
  }


  setOptions(options = {}) {
    if (options.timeDomain || options.zoomLimited) {
      this.setTimeDomain(
        options.timeDomain || this.options.timeDomain,
        options.zoomLimited || this.options.zoomLimited
      );
    }
    
    if (options.width || options.height) {
      this.resize(
        options.width || this.options.width,
        options.height || this.options.height
      );
    }
    
    this.options = {
      ...this.options,
      ...options
    };
  }
}
