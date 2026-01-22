/**
 * HistoricalChart - Main controller class
 * Combines TimelineChart's axis system with GanttChart's hierarchical lanes
 */
import * as d3 from 'd3';
import { LIGHT } from './style.js';
import { AxisManager } from './AxisManager.js';
import { IndexAxisManager } from './IndexAxisManager.js';
import { ZoomManager } from './ZoomManager.js';
import { ScrollManager } from './ScrollManager.js';
import { TooltipManager } from './TooltipManager.js';
import { LayerManager } from './LayerManager.js';
import * as westernAxises from './axises/westernAxises.js';

export class HistoricalChart {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Chart options
   * @param {number} options.width - Chart width
   * @param {number} options.height - Chart height
   * @param {number} options.labelWidth - Label area width
   * @param {string} options.labelPosition - 'left' | 'right' | 'none'
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {Array} options.axises - Array of axis configurations
   * @param {boolean} options.hasIndexAxis - Whether to show index axis
   * @param {number} options.indexAxisHeight - Height of index axis
   * @param {Array} options.zoomLimited - [minZoomLevel, maxZoomLevel]
   * @param {string} options.style - CSS style string
   * @param {string} options.locale - Locale for date formatting
   * @param {boolean} options.hasActiveAxis - Whether to show active axis
   * @param {boolean} options.hasTooltip - Whether to enable tooltips
   * 
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    // Default options
    this.options = {
      // Dimensions
      width: 960,
      height: 500,

      // Labels
      labelWidth: 160,
      labelPosition: 'left', // 'left' | 'right' | 'none'
      roundRadius: 4,

      // Time axis
      timeDomain: [
        new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
        new Date(new Date().setFullYear(new Date().getFullYear() + 50))
      ],
      axises: [
        westernAxises.yearlyAxis,
        westernAxises.dailyAxis,
      ],
      hasIndexAxis: true,
      indexAxisHeight: 28,
      zoomLimited: [-1, -1],

      // Style
      style: LIGHT,
      locale: 'en-us',

      // Features
      hasActiveAxis: true,
      hasTooltip: true,

      ...options
    };

    // State
    this.xScale = null;

    // Managers
    this.axisManager = null;
    this.indexAxisManager = null;
    this.zoomManager = null;
    this.scrollManager = null;
    this.tooltipManager = null;
    this.layerManager = null;

    // Event dispatch
    this.dispatch = d3.dispatch(
      'render',
      'update',
      'resize',
      'domainChange',
      'itemClick',
      'itemHover',
      'itemLeave',
      'groupToggle',
    );

    // DOM references
    this.wrapper = null;
    this.axisContainer = null;
    this.contentContainer = null;
    this.labelsContainer = null;
    this.bodyContainer = null;
    this.indexContainer = null;

    // height
    this.contentHeight = null;

    this._init();
  }

  /**
   * Initialize the chart structure
   */
  _init() {
    // Clear container
    this.container.innerHTML = '';

    // Create wrapper
    this.wrapper = d3.select(this.container)
      .append('div')
      .classed('historical-chart-wrapper', true)
      .style('width', `${this.options.width}px`)
      .style('height', `${this.options.height}px`);

    // Add styles
    this.wrapper.append('style').text(this.options.style);

    // Create main chart div
    this.chartDiv = this.wrapper.append('div')
      .classed('historical-chart', true)
      .style('width', '100%')
      .style('height', '100%');

    // Initialize scale
    const bodyWidth = this._calculateBodyWidth();
    this.xScale = d3.scaleUtc()
      .domain(this.options.timeDomain)
      .range([0, bodyWidth]);

    // Create structure
    this._createAxisArea();
    this._createContentArea();
    if (this.options.hasIndexAxis) {
      this._createIndexArea();
    }

    // Create tooltip
    if (this.options.hasTooltip) {
      this._createTooltip();
    }

    // Initialize managers
    this._initManagers();

    // Setup zoom
    this._setupZoom();

    // Setup active axis
    if (this.options.hasActiveAxis) {
      this._setupActiveAxis();
    }
  }

  /**
   * Calculate body area width
   * Body width = total width - label width
   */
  _calculateBodyWidth() {
    const labelWidth = this._getLabelWidth();
    return this.options.width - labelWidth;
  }

  /**
   * Get effective label width based on position setting
   */
  _getLabelWidth() {
    return this.options.labelPosition === 'none' ? 0 : this.options.labelWidth;
  }

  /**
   * Get index axis height (0 if disabled)
   */
  _getIndexHeight() {
    return this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
  }

  /**
   * Create axis area (top)
   */
  _createAxisArea() {
    this.axisContainer = this.chartDiv.append('div')
      .classed('hc-axis-container', true);

    const labelWidth = this._getLabelWidth();

    // Calculate axis height
    this.axisManager = new AxisManager({
      axises: this.options.axises,
      locale: this.options.locale,
      gap: 1,
      type: 'mark'
    });
    const axisHeight = this.axisManager.calculateHeight();

    this.axisSvg = this.axisContainer.append('svg')
      .classed('hc-axis-svg', true)
      .attr('width', this.options.width)
      .attr('height', axisHeight);

    // Offset for labels: axis aligns with body area
    const offsetX = this.options.labelPosition === 'left' ? labelWidth : 0;

    this.axisGroup = this.axisSvg.append('g')
      .attr('transform', `translate(${offsetX}, 0)`);

    // Create axis elements
    this.axisManager.create(this.axisGroup);
  }

  _createLabelsArea() {
    const axisHeight = this.axisManager.getHeight();
    const bodyHeight = this.options.height - axisHeight - this._getIndexHeight();
    const labelWidth = this._getLabelWidth();
    const isLabelLeft = this.options.labelPosition === 'left';

    if (this.options.labelPosition !== 'none') {
      if (this.labelsContainer) {
        this.labelsContainer.style('width', `${labelWidth}px`);
        this.labelsContainer.style('height', `${bodyHeight}px`)
        this.labelsContainer.style('order', isLabelLeft ? 0 : 1);

        this.labelsSvg.attr('width', labelWidth);
      } else {
        this.labelsContainer = this.contentContainer.append('div')
          .classed('hc-labels-container', true)
          .style('width', `${labelWidth}px`)
          .style('height', `${bodyHeight}px`)
          .style('overflow', 'hidden')
          .style('order', isLabelLeft ? 0 : 1);

        this.labelsSvg = this.labelsContainer.append('svg')
          .classed('hc-labels-svg', true)
          .attr('width', labelWidth);

        this.labelsGroup = this.labelsSvg.append('g');
      }
    } else {
      if (this.labelsContainer) {
        this.labelsContainer.remove();
        this.labelsContainer = null;
        this.labelsGroup = null;
        this.labelsSvg = null;
      }
    }
  }
  
  /**
   * Create content area (labels + body)
   * Layout: [labels container] + [body container] = total width
   * - labels container width = labelWidth
   * - body container width = bodyWidth (= total width - labelWidth)
   */
  _createContentArea() {
    const axisHeight = this.axisManager.getHeight();
    const bodyHeight = this.options.height - axisHeight - this._getIndexHeight();

    this.contentContainer = this.chartDiv.append('div')
      .classed('hc-content', true)
      .style('height', `${bodyHeight}px`);
    const bodyWidth = this._calculateBodyWidth();

    // Create labels container (left or right)
    this._createLabelsArea();
    
    // Body container
    this.bodyContainer = this.contentContainer.append('div')
      .classed('hc-body-container', true)
      .style('width', `${bodyWidth}px`)
      .style('height', `${bodyHeight}px`)
      .style('overflow-y', 'auto')
      .style('overflow-x', 'hidden');

    this.bodySvg = this.bodyContainer.append('svg')
      .classed('hc-body-svg', true)
      .attr('width', bodyWidth);

    // Create defs for clip path
    const defs = this.bodySvg.append('defs');
    defs.append('clipPath')
      .attr('id', 'hc-body-clip')
      .append('rect')
      .attr('width', bodyWidth)
      .attr('height', bodyHeight);

    this.bodyGroup = this.bodySvg.append('g')
      .attr('clip-path', 'url(#hc-body-clip)');

    // Create board for mouse events
    this.board = this.bodyGroup.append('rect')
      .classed('board', true)
      .attr('width', bodyWidth)
      .attr('height', bodyHeight);
  }

  /**
   * Create index axis area (bottom)
   */
  _createIndexArea() {
    const labelWidth = this._getLabelWidth();

    this.indexContainer = this.chartDiv.append('div')
      .classed('hc-indexaxis-container', true);

    this.indexSvg = this.indexContainer.append('svg')
      .classed('hc-index-svg', true)
      .attr('width', this.options.width)
      .attr('height', this.options.indexAxisHeight);

    // Index axis aligns with body area
    const offsetX = this.options.labelPosition === 'left' ? labelWidth : 0;

    this.indexGroup = this.indexSvg.append('g')
      .attr('transform', `translate(${offsetX}, 0)`);
  }

  /**
   * Create tooltip element
   */
  _createTooltip() {
    this.tooltipManager = new TooltipManager({
      locale: this.options.locale,
      gap: 1,
      roundRadius: this.options.roundRadius,
    });

    // Create axis tooltip in axis SVG
    this.tooltipManager.createAxisTooltip(this.axisGroup);

    // Create event tooltip in wrapper
    this.tooltipManager.createItemTooltip(this.chartDiv.node());

    // Set bound box
    this.tooltipManager.setBoundBox({
      left: 0,
      top: 0,
      right: this.options.width,
      bottom: this.options.height
    });
  }

  /**
   * Initialize managers
   */
  _initManagers() {
    const bodyWidth = this._calculateBodyWidth();

    // Index axis manager
    if (this.options.hasIndexAxis) {
      this.indexAxisManager = new IndexAxisManager({
        timeDomain: this.options.timeDomain,
        width: bodyWidth,
        height: this.options.indexAxisHeight,
        zoomLimited: this.options.zoomLimited,
        onBrush: (domain) => this._onBrushChange(domain)
      });
      this.indexAxisManager.create(this.indexGroup);
    }

    // Layer manager and layers
    this.layerManager = new LayerManager(this);

    // Scroll manager
    this.scrollManager = new ScrollManager({
      bodyContainer: this.bodyContainer.node(),
      labelsContainer: this.labelsContainer ? this.labelsContainer.node() : null,
      onScroll: (top, left) => this._onScroll(top, left)
    });
    this.scrollManager.init();
  }

  /**
   * Setup zoom behavior
   */
  _setupZoom() {
    const bodyWidth = this._calculateBodyWidth();
    const axisHeight = this.axisManager.getHeight();
    const bodyHeight = this.options.height - axisHeight - this._getIndexHeight();

    this.zoomManager = new ZoomManager({
      timeDomain: this.options.timeDomain,
      width: bodyWidth,
      height: bodyHeight,
      zoomLimited: this.options.zoomLimited,
      xScale: this.xScale,
      onZoom: (xScale, transform, sourceEvent) => this._onZoom(xScale, transform, sourceEvent)
    });

    // Attach zoom to board
    this.zoomManager.create(this.board);
  }

  /**
   * Setup active axis (vertical line at mouse position)
   */
  _setupActiveAxis() {
    const axisHeight = this.axisManager.getHeight();

    this.activeAxis = this.axisGroup.append('g')
      .classed('activeAxis', true)
      .attr('visibility', 'hidden');

    this.activeAxis.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', axisHeight);

    // Mouse events on board
    const self = this;
    this.board
      .on('mousemove', function(event) {
        const [x] = d3.pointer(event);
        self._onMouseMove(x);
      })
      .on('mouseenter', function() {
        self.activeAxis.attr('visibility', 'visible');
        if (self.tooltipManager) {
          self.tooltipManager.showAxisTooltip(true);
        }
      })
      .on('mouseleave', function() {
        self.activeAxis.attr('visibility', 'hidden');
        if (self.tooltipManager) {
          self.tooltipManager.showAxisTooltip(false);
        }
      });
  }

  /**
   * Handle mouse move
   */
  _onMouseMove(x) {
    // Update active axis position
    this.activeAxis.attr('transform', `translate(${x}, 0)`);

    // Get date at cursor position
    const xt = this.zoomManager.getScale();
    const date = xt.invert(x);

    // Update axis tooltip (position at top of axis area, not bottom)
    if (this.tooltipManager) {
      this.tooltipManager.updateAxisTooltip(date, x, 0);
    }
  }

  /**
   * Handle zoom event
   */
  _onZoom(xScale, _transform, sourceEvent) {
    // Update axis
    const bodyHeight = this.options.height - this.axisManager.getHeight() - this._getIndexHeight();
    this.axisManager.update(xScale, this.axisManager.getHeight());

    // Update layers
    this.layerManager.update(xScale, bodyHeight, this.contentHeight);

    // Update index axis if user-initiated
    if (sourceEvent && this.indexAxisManager) {
      const domain = xScale.domain();
      this.indexAxisManager.updateFromZoom(domain);
    }

    // Dispatch update event
    this.dispatch.call('update', this, xScale);
    this.dispatch.call('domainChange', this, xScale.domain());
  }

  /**
   * Handle brush change from index axis
   */
  _onBrushChange(domain) {
    this.zoomManager.setDomain(domain);
  }

  /**
   * Handle scroll (sync is handled by ScrollManager)
   */
  _onScroll() {
    // Reserved for future scroll event handling
  }

  /**
   * Render chart
   */
  render() {
    const xScale = this.zoomManager.getScale();
    const bodyHeight = this.options.height - this.axisManager.getHeight() - this._getIndexHeight();
    this.updateContentHeight();

    // Render all layers
    this.layerManager.render(xScale, bodyHeight, this.contentHeight);

    // Initial axis update
    this.axisManager.update(xScale, this.axisManager.getHeight());

    // Dispatch initial event
    const bodyWidth = this._calculateBodyWidth();
    this.dispatch.call('render', this, { left: 0, top: 0, width: bodyWidth, height: bodyHeight }, xScale);

    return this;
  }

  /**
   * Resize chart
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;

    // Update wrapper
    this.wrapper
      .style('width', `${width}px`)
      .style('height', `${height}px`);

    // Recalculate dimensions
    const bodyWidth = this._calculateBodyWidth();
    const axisHeight = this.axisManager.getHeight();
    const bodyHeight = height - axisHeight - this._getIndexHeight();

    // Update scale
    this.xScale.range([0, bodyWidth]);

    // Update containers
    this.axisSvg.attr('width', width);
    this.contentContainer.style('height', `${bodyHeight}px`);

    // Update body container dimensions
    this.bodyContainer
      .style('width', `${bodyWidth}px`)
      .style('height', `${bodyHeight}px`);
    this.bodySvg.attr('width', bodyWidth);

    // Update labels container height / width / order
    if (this.labelsContainer) {
      const labelWidth = this._getLabelWidth();
      const isLabelLeft = this.options.labelPosition === 'left';

      this.labelsContainer.style('width', `${labelWidth}px`);
      this.labelsContainer.style('height', `${bodyHeight}px`)
      this.labelsContainer.style('order', isLabelLeft ? 0 : 1);

      this.labelsSvg.attr('width', labelWidth);
    }

    // Update clip path
    this.bodySvg.select('#hc-body-clip rect')
      .attr('width', bodyWidth)
      .attr('height', this.contentHeight || bodyHeight);

    // Update board for mouse events
    this.board
      .attr('width', bodyWidth)
      .attr('height', this.contentHeight || bodyHeight);

    if (this.indexSvg) {
      this.indexSvg
        .attr('width', width)
        .attr('height', this.options.indexAxisHeight);
    }
    this.activeAxis.attr('y2', axisHeight);

    // Update zoom
    this.zoomManager.resize(bodyWidth, bodyHeight);

    // Update index axis
    if (this.indexAxisManager) {
      this.indexAxisManager.resize(bodyWidth, this.options.indexAxisHeight);
    }

    // Update layers
    this.layerManager.resize(bodyWidth, bodyHeight);

    // Re-render with current scale
    const xScale = this.zoomManager.getScale();
    this.axisManager.update(xScale, axisHeight);
    this.layerManager.update(xScale, bodyHeight, this.contentHeight);

    this.dispatch.call('resize', this, width, height);
  }

  updateContentHeight(forceUpdate = false) {
    if (forceUpdate || !this.contentHeight) {
      this.contentHeight = this.layerManager.calculateContentHeight(
        this.zoomManager.getScale()
      );
    }

    // Update SVG heights
    this.bodySvg.attr('height', this.contentHeight);
    if (this.labelsSvg) {
      this.labelsSvg.attr('height', this.contentHeight);
    }

    // Update clip path height (critical for scrolling to work)
    this.bodySvg.select('#hc-body-clip rect')
      .attr('height', this.contentHeight);

    // Update board height for mouse events
    this.board.attr('height', this.contentHeight);
  }

  /**
   * Set style/theme
   * @param {string} style - LIGHT or DARK or custom CSS
   */
  setStyle(style) {
    this.options.style = style;
    this.wrapper.select('style').text(style);
  }

  /**
   * Update chart options dynamically without recreating the chart
   * @param {Object} options - Options to update (partial)
   */
  setOptions(options) {
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...options };

    // Detect what changed
    const changes = this._detectChanges(oldOptions, this.options);

    // No changes
    if (Object.keys(changes).length === 0) return;

    // Apply changes based on type
    if (changes.timeDomain || changes.axises || changes.zoomLimited || changes.roundRadius) {
      this._applyTimeAxisChanges(oldOptions, changes);
    }

    if (changes.hasIndexAxis !== undefined) {
      this._applyIndexAxisChanges(changes.hasIndexAxis);
    }

    if (changes.width || changes.height || changes.labelWidth || changes.labelPosition || changes.axises) {
      if (changes.labelPosition !== undefined) this._createLabelsArea();
      this._applyDimensionChanges(oldOptions);
    }

    if (changes.style) {
      this.setStyle(this.options.style);
    }
  }

  /**
   * Detect which options have changed
   * @private
   */
  _detectChanges(oldOptions, newOptions) {
    const changes = {};

    // Dimensions
    if (oldOptions.width !== newOptions.width) changes.width = newOptions.width;
    if (oldOptions.height !== newOptions.height) changes.height = newOptions.height;
    if (oldOptions.labelWidth !== newOptions.labelWidth) changes.labelWidth = newOptions.labelWidth;
    if (oldOptions.labelPosition !== newOptions.labelPosition) changes.labelPosition = newOptions.labelPosition;
    if (oldOptions.roundRadius !== newOptions.roundRadius) changes.roundRadius = newOptions.roundRadius;

    // Time axis related
    if (this._hasDomainChanged(oldOptions.timeDomain, newOptions.timeDomain)) {
      changes.timeDomain = newOptions.timeDomain;
    }
    if (oldOptions.axises !== newOptions.axises) {
      changes.axises = newOptions.axises;
    }
    if (this._hasArrayChanged(oldOptions.zoomLimited, newOptions.zoomLimited)) {
      changes.zoomLimited = newOptions.zoomLimited;
    }

    // Index axis
    if (oldOptions.hasIndexAxis !== newOptions.hasIndexAxis) {
      changes.hasIndexAxis = newOptions.hasIndexAxis;
    }
    if (oldOptions.indexAxisHeight !== newOptions.indexAxisHeight) {
      changes.indexAxisHeight = newOptions.indexAxisHeight;
    }

    // Style
    if (oldOptions.style !== newOptions.style) changes.style = newOptions.style;

    return changes;
  }

  /**
   * Check if time domain has changed
   * @private
   */
  _hasDomainChanged(oldDomain, newDomain) {
    if (!oldDomain || !newDomain) return oldDomain !== newDomain;
    return oldDomain[0].getTime() !== newDomain[0].getTime() ||
           oldDomain[1].getTime() !== newDomain[1].getTime();
  }

  /**
   * Check if array has changed
   * @private
   */
  _hasArrayChanged(oldArr, newArr) {
    if (!oldArr || !newArr) return oldArr !== newArr;
    if (oldArr.length !== newArr.length) return true;
    return oldArr.some((v, i) => v !== newArr[i]);
  }

  /**
   * Apply time axis changes (timeDomain, axises, zoomLimited)
   * @private
   */
  _applyTimeAxisChanges(oldOptions, changes) {
    // Save current visible domain for restoration
    const currentDomain = this.getDomain();

    // Update zoom manager
    if (changes.timeDomain || changes.zoomLimited) {
      this.zoomManager.setTimeDomain(
        this.options.timeDomain,
        changes.zoomLimited ? this.options.zoomLimited : undefined
      );
    }

    // Rebuild axis area if axises changed
    if (changes.axises) {
      this.axisManager.setAxises(changes.axises);
    }

    // Update index axis
    if (this.indexAxisManager && (changes.timeDomain || changes.zoomLimited)) {
      this.indexAxisManager.setOptions({
        timeDomain: this.options.timeDomain,
        zoomLimited: this.options.zoomLimited
      });
    }

    if (this.tooltipManager && changes.roundRadius) {
      this.tooltipManager.setOptions({
        roundRadius: this.options.roundRadius
      });
    }

    // Re-render layers
    this.render();
  }

  /**
   * Apply index axis visibility changes
   * @private
   */
  _applyIndexAxisChanges(hasIndexAxis) {
    if (hasIndexAxis && !this.indexContainer) {
      // Create index axis
      this._createIndexArea();
      const bodyWidth = this._calculateBodyWidth();
      this.indexAxisManager = new IndexAxisManager({
        timeDomain: this.options.timeDomain,
        width: bodyWidth,
        height: this.options.indexAxisHeight,
        zoomLimited: this.options.zoomLimited,
        onBrush: (domain) => this._onBrushChange(domain)
      });
      this.indexAxisManager.create(this.indexGroup);
      // Sync with current zoom
      this.indexAxisManager.updateFromZoom(this.getDomain());
    } else if (!hasIndexAxis && this.indexContainer) {
      // Remove index axis
      this.indexContainer.remove();
      this.indexContainer = null;
      this.indexAxisManager = null;
    }

    // Update content area height
    const axisHeight = this.axisManager.getHeight();
    const bodyHeight = this.options.height - axisHeight - this._getIndexHeight();
    this.contentContainer.style('height', `${bodyHeight}px`);
    this.bodyContainer.style('height', `${bodyHeight}px`);
    if (this.labelsContainer) {
      this.labelsContainer.style('height', `${bodyHeight}px`);
    }
  }

  /**
   * Apply dimension changes (width, height, labelWidth, labelPosition)
   * @private
   */
  _applyDimensionChanges(oldOptions) {
    // Use existing resize method for dimension changes
    this.resize(this.options.width, this.options.height);
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    this.dispatch.on(event, callback);
    return this;
  }

  /**
   * Get current visible domain
   */
  getDomain() {
    return this.zoomManager.getDomain();
  }

  /**
   * Set visible domain
   * @param {Array} domain - [startDate, endDate]
   */
  setDomain(domain) {
    this.zoomManager.setDomain(domain);
  }

  /**
   * Reset zoom to initial state
   */
  resetZoom() {
    this.zoomManager.reset();
    if (this.indexAxisManager) {
      this.indexAxisManager.updateFromZoom(this.zoomManager.getDomain());
    }
  }

  /**
   * Programmatically zoom in
   * @param {number} factor - Zoom factor (> 1), default 1.5
   */
  zoomIn(factor = 1.5) {
    this.zoomManager.zoomIn(factor);
    // Sync index axis (zoomManager.zoomIn triggers _onZoom but sourceEvent is null)
    if (this.indexAxisManager) {
      this.indexAxisManager.updateFromZoom(this.zoomManager.getDomain());
    }
  }

  /**
   * Programmatically zoom out
   * @param {number} factor - Zoom factor (> 1), default 1.5
   */
  zoomOut(factor = 1.5) {
    this.zoomManager.zoomOut(factor);
    // Sync index axis
    if (this.indexAxisManager) {
      this.indexAxisManager.updateFromZoom(this.zoomManager.getDomain());
    }
  }

  /**
   * Pan by amount in pixels
   * @param {number} dx - Horizontal pan amount
   */
  pan(dx) {
    this.zoomManager.pan(dx);
    // Sync index axis
    if (this.indexAxisManager) {
      this.indexAxisManager.updateFromZoom(this.zoomManager.getDomain());
    }
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    this.scrollManager.destroy();
    this.layerManager.destroy();

    this.container.innerHTML = '';
  }
}
