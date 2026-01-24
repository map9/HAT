/**
 * HistoricalChart - Main controller class
 * Combines TimelineChart's axis system with GanttChart's hierarchical lanes
 */
import * as d3 from 'd3';
import { getSystemTheme } from './style.js';
import { AxisManager } from './AxisManager.js';
import { IndexAxisManager } from './IndexAxisManager.js';
import { ZoomManager } from './ZoomManager.js';
import { ScrollManager } from './ScrollManager.js';
import { TooltipManager } from './TooltipManager.js';
import { LayerManager } from './LayerManager.js';
import * as westernAxises from './axises/westernAxises.js';

export class HistoricalChart {
  /**
   * @param {Object} options - Chart options
   * @param {number} options.width - Chart width
   * @param {number} options.height - Chart height
   * @param {Array} options.timeDomain - [startDate, endDate]
   * @param {Array} options.zoomLimited - [minZoomLevel, maxZoomLevel]
   * @param {Array} options.axises - Array of axis configurations
   * @param {number} options.labelWidth - Label area width
   * @param {string} options.labelPosition - 'left' | 'right' | 'none'
   * @param {number} options.roundRadius - Round radius for all chart elements
   * @param {boolean} options.hasIndexAxis - Whether to show index axis
   * @param {number} options.indexAxisHeight - Height of index axis
   * @param {boolean} options.hasActiveAxis - Whether to show active axis
   * @param {boolean} options.hasTooltip - Whether to enable tooltips
   * @param {string} options.style - CSS style string
   * @param {string} options.accentScheme - Accent color scheme
   * @param {string} options.locale - Locale for date formatting
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      // Dimensions
      width: 960,
      height: 500,

      // Time axis
      timeDomain: [
        new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
        new Date(new Date().setFullYear(new Date().getFullYear() + 50))
      ],
      zoomLimited: [-1, -1],
      axises: [
        westernAxises.yearlyAxis,
        westernAxises.dailyAxis,
      ],

      // Labels
      labelWidth: 160,
      labelPosition: 'left', // 'left' | 'right' | 'none'

      // Round radius for all chart elements
      roundRadius: 4,

      // Index axis
      hasIndexAxis: true,
      indexAxisHeight: 28,

      // Features
      hasActiveAxis: true,
      hasTooltip: true,

      // Style
      style: 'light',
      accentScheme: 'default',
      locale: 'en-us',

      ...options
    };

    this.container = null;

    // Managers
    this.axisManager = null;
    this.indexAxisManager = null;
    this.zoomManager = null;
    this.scrollManager = null;
    this.tooltipManager = null;
    this.layerManager = null;

    // Event dispatch
    this.dispatch = null;
  
    // DOM references
    this.wrapper = null;
    this.axisSlot = null;     // Mounting point for AxisManager (AxisManager owns its DOM)
    this.axisGroup = null;    // Reference to AxisManager's group (for activeAxis)
    this.contentContainer = null;
    this.labelsSlot = null;   // Mounting point for LabelRenderer (LabelRenderer owns its DOM)
    this.bodyContainer = null;
    this.indexSlot = null;    // Mounting point for IndexAxisManager (to be refactored)

    this.contentHeight = null;
  }

  /**
   * @param {string|HTMLElement} container - Container selector or element
   * Create the chart structure
   */
  Create(container) {
    this.destroy();

    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.container.innerHTML = '';

    // Create event dispatcher
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

    // Create wrapper
    this.wrapper = d3.select(this.container)
      .append('div')
      .classed('historical-chart-wrapper', true)
      .style('width', `${this.options.width}px`)
      .style('height', `${this.options.height}px`);

    // Add styles
    this.wrapper
      .append('style')
      .text(getSystemTheme(this.options.style, this.options.accentScheme));

    // Create main chart div
    this.chartDiv = this.wrapper.append('div')
      .classed('historical-chart', true)
      .style('width', '100%')
      .style('height', '100%');

    // Create structure
    this._createAxisArea();
    this._createContentArea();
    if (this.options.hasIndexAxis) {
      this._createIndexSlot();
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
   * Calculate body area height
   * Body height = total height (labels float over content)
   */
  _getBodyHeight() {
    const axisHeight = this.axisManager.getHeight();
    const indexAxisHeight = this.indexAxisManager
      ? this.indexAxisManager.getHeight()
      : 0;
    return this.options.height - axisHeight - indexAxisHeight;
  }

  /**
   * Create axis slot (mounting point for AxisManager to build its own DOM)
   * AxisManager is responsible for creating its own container/svg/group
   */
  _createAxisArea() {
    // Create slot - just a mounting point, AxisManager creates the actual DOM
    this.axisSlot = this.chartDiv.append('div')
      .classed('hc-axis-slot', true);

    // Create AxisManager - it will build its own DOM structure
    this.axisManager = new AxisManager({
      axises: this.options.axises,
      locale: this.options.locale,
      width: this.options.width,
      gap: 1,
      type: 'mark'
    });

    // AxisManager creates container/svg/group inside the slot
    this.axisManager.create(this.axisSlot);

    // Get the axis group for adding activeAxis later
    this.axisGroup = this.axisManager.getGroup();
  }

  /**
   * Create labels slot (mounting point for LabelRenderer to build its own DOM)
   * LabelRenderer is responsible for creating its own container/svg/group
   */
  _createLabelsSlot() {
    const bodyHeight = this._getBodyHeight();
    const labelWidth = this.options.labelWidth;
    const labelPosition = this.options.labelPosition;

    if (this.labelsSlot) {
      // Update existing slot
      this.labelsSlot
        .style('width', `${labelWidth}px`)
        .style('height', `${bodyHeight}px`)
        .classed('label-left', labelPosition === 'left')
        .classed('label-right', labelPosition === 'right')
        .classed('label-none', labelPosition === 'none');
    } else {
      // Create slot - just a mounting point, LabelRenderer creates the actual DOM
      this.labelsSlot = this.contentContainer.append('div')
        .classed('hc-labels-slot', true)
        .classed('label-left', labelPosition === 'left')
        .classed('label-right', labelPosition === 'right')
        .classed('label-none', labelPosition === 'none')
        .style('width', `${labelWidth}px`)
        .style('height', `${bodyHeight}px`);
    }
  }
  
  /**
   * Create content area (labels + body)
   * Layout: [labels container] + [body container] = total width
   * - labels container width = labelWidth
   * - body container width = bodyWidth (= total width - labelWidth)
   */
  _createContentArea() {
    const bodyWidth = this.options.width;
    const bodyHeight = this._getBodyHeight();

    this.contentContainer = this.chartDiv.append('div')
      .classed('hc-content', true)
      .style('height', `${bodyHeight}px`);

    // Create labels slot (mounting point for LabelRenderer)
    this._createLabelsSlot();
    
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
   * Create index axis slot (mounting point for IndexAxisManager to build its own DOM)
   * IndexAxisManager is responsible for creating its own container/svg/group
   */
  _createIndexSlot() {
    // Create slot - just a mounting point, IndexAxisManager creates the actual DOM
    this.indexSlot = this.chartDiv.append('div')
      .classed('hc-index-slot', true);
  }

  /**
   * Create tooltip element
   */
  _createTooltip() {
    this.tooltipManager = new TooltipManager({
      roundRadius: this.options.roundRadius,
      gap: 1,
      locale: this.options.locale,
    });

    this.tooltipManager.create(this.chartDiv.node(), this.axisGroup);
  }

  /**
   * Initialize managers
   */
  _initManagers() {
    // Index axis manager
    if (this.options.hasIndexAxis) {
      this.indexAxisManager = new IndexAxisManager({
        timeDomain: this.options.timeDomain,
        width: this.options.width,
        height: this.options.indexAxisHeight,
        zoomLimited: this.options.zoomLimited,
        onBrush: (domain) => this._onBrushChange(domain)
      });
      this.indexAxisManager.create(this.indexSlot);
    }

    // Layer manager and layers
    this.layerManager = new LayerManager(this);

    // Scroll manager - labelsContainer will be set later by LabelRenderer via setLabelsContainer()
    this.scrollManager = new ScrollManager({
      bodyContainer: this.bodyContainer.node(),
      labelsContainer: null,  // Will be set by LabelRenderer after it creates its DOM
      onScroll: (top, left) => this._onScroll(top, left)
    });
    this.scrollManager.init();
  }

  /**
   * Setup zoom behavior
   */
  _setupZoom() {
    this.zoomManager = new ZoomManager({
      timeDomain: this.options.timeDomain,
      width: this.options.width,
      height: this._getBodyHeight(),
      zoomLimited: this.options.zoomLimited,
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
    const bodyHeight = this._getBodyHeight();
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
    this.zoomManager.zoomToDomain(domain);
  }

  /**
   * Handle scroll (sync is handled by ScrollManager)
   */
  _onScroll() {
    // Reserved for future scroll event handling
  }

  /**
   * Register labels container for scroll sync (called by LabelRenderer after DOM creation)
   * @param {HTMLElement} container - The labels container element
   */
  registerLabelsContainer(container) {
    if (this.scrollManager) {
      this.scrollManager.setLabelsContainer(container);
    }
  }

  /**
   * Render chart
   */
  render() {
    const xScale = this.zoomManager.getScale();
    const bodyHeight = this._getBodyHeight();
    this.updateContentHeight();

    // Render all layers
    this.layerManager.render(xScale, bodyHeight, this.contentHeight);

    // Initial axis update
    this.axisManager.update(xScale, this.axisManager.getHeight());

    // Dispatch initial event
    this.dispatch.call('render', this, { left: 0, top: 0, width: this.options.width, height: bodyHeight }, xScale);

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
    const bodyHeight = this._getBodyHeight();

    // Update containers
    // AxisManager handles its own resize
    this.axisManager.resize(width);
    this.contentContainer.style('height', `${bodyHeight}px`);

    // Update body container dimensions
    this.bodyContainer
      .style('width', `${this.options.width}px`)
      .style('height', `${bodyHeight}px`);
    this.bodySvg.attr('width', this.options.width);

    // Update labels slot dimensions (LabelRenderer manages its own DOM inside the slot)
    if (this.labelsSlot) {
      const labelWidth = this.options.labelWidth;
      const labelPosition = this.options.labelPosition;

      this.labelsSlot
        .style('width', `${labelWidth}px`)
        .style('height', `${bodyHeight}px`)
        .classed('label-left', labelPosition === 'left')
        .classed('label-right', labelPosition === 'right')
        .classed('label-none', labelPosition === 'none');
    }

    // Update clip path
    this.bodySvg.select('#hc-body-clip rect')
      .attr('width', this.options.width)
      .attr('height', this.contentHeight || bodyHeight);

    // Update board for mouse events
    this.board
      .attr('width', this.options.width)
      .attr('height', this.contentHeight || bodyHeight);

    this.activeAxis.attr('y2', this.axisManager.getHeight());

    // Update zoom
    this.zoomManager.resize(this.options.width, bodyHeight);

    // Update index axis
    if (this.indexAxisManager) {
      this.indexAxisManager.resize(this.options.width, this.options.indexAxisHeight);
    }

    // Update layers
    this.layerManager.resize(this.options.width, bodyHeight);

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

    // LabelRenderer manages its own SVG height - notify via layerManager
    if (this.layerManager) {
      this.layerManager.updateContentHeight(this.contentHeight);
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
   * @param {string} accentScheme - Accent color scheme
   */
  setStyle(style, accentScheme) {
    this.options.style = style || 'light';
    this.options.accentScheme = accentScheme || 'default';
    this.wrapper.select('style').text(getSystemTheme(this.options.style, this.options.accentScheme));
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
  getCurrentDomain() {
    return this.zoomManager.getCurrentDomain();
  }

  /**
   * Set visible domain
   * @param {Array} domain - [startDate, endDate]
   */
  zoomToDomain(domain) {
    this.zoomManager.zoomToDomain(domain);
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
    if (this.container === null) return;

    if (this.scrollManager) this.scrollManager.destroy();
    if (this.layerManager) this.layerManager.destroy();
    if (this.axisManager) this.axisManager.destroy();
    if (this.indexAxisManager) this.indexAxisManager.destroy();
    if (this.tooltipManager) this.tooltipManager.destroy();

    this.container.innerHTML = '';
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

    // Track if render is needed
    let needsRender = false;

    // Apply changes based on type
    if (changes.timeDomain || changes.axises || changes.zoomLimited || changes.roundRadius) {
      this._applyTimeAxisChanges(oldOptions, changes);
      needsRender = true;
    }

    if (changes.hasIndexAxis !== undefined) {
      this._applyIndexAxisChanges(changes.hasIndexAxis);
    }

    if (changes.width || changes.height || changes.labelWidth || changes.labelPosition || changes.axises) {
      if (changes.labelPosition !== undefined) this._createLabelsSlot();
      this._applyDimensionChanges(oldOptions);
      needsRender = true;
    }

    if (changes.style) {
      this.setStyle(this.options.style);
    }

    // Propagate layer-related options to LayerManager
    const layerOptions = this._extractLayerOptions(changes);
    if (Object.keys(layerOptions).length > 0 && this.layerManager) {
      const layerNeedsRender = this.layerManager.setOptions(layerOptions, true);
      needsRender = layerNeedsRender || needsRender;
    }

    // Render if needed and not already rendered
    if (needsRender && !changes.timeDomain && !changes.axises && !changes.zoomLimited && !changes.roundRadius) {
      this.render();
    }
  }

  /**
   * Extract layer-related options from changes
   * @private
   */
  _extractLayerOptions(changes) {
    const layerKeys = [
      'roundRadius', 'rowHeight', 'mode',
      'barStyleFn', 'pointStyleFn', 'linkStyleFn',
      'barTextPosition', 'pointTextPosition',
      'xPadding', 'yPadding', 'groupYPadding',
      'pointSizeRatio', 'curve', 'headSize', 'minLinkLength'
    ];

    const result = {};
    layerKeys.forEach(key => {
      if (changes[key] !== undefined) {
        result[key] = this.options[key];
      }
    });
    return result;
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

    // Layer-related options
    const layerKeys = [
      'rowHeight', 'mode', 'barStyleFn', 'pointStyleFn', 'linkStyleFn',
      'barTextPosition', 'pointTextPosition', 'xPadding', 'yPadding',
      'groupYPadding', 'pointSizeRatio', 'curve', 'headSize', 'minLinkLength'
    ];
    layerKeys.forEach(key => {
      if (oldOptions[key] !== newOptions[key]) {
        changes[key] = newOptions[key];
      }
    });

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
    const currentDomain = this.getCurrentDomain();

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
    if (hasIndexAxis && !this.indexAxisManager) {
      // Create index axis slot and manager
      this._createIndexSlot();
      this.indexAxisManager = new IndexAxisManager({
        timeDomain: this.options.timeDomain,
        width: this.options.width,
        height: this.options.indexAxisHeight,
        zoomLimited: this.options.zoomLimited,
        onBrush: (domain) => this._onBrushChange(domain)
      });
      this.indexAxisManager.create(this.indexSlot);
      // Sync with current zoom
      this.indexAxisManager.updateFromZoom(this.getCurrentDomain());
    } else if (!hasIndexAxis && this.indexAxisManager) {
      // Remove index axis
      this.indexAxisManager.destroy();
      this.indexAxisManager = null;
      if (this.indexSlot) {
        this.indexSlot.remove();
        this.indexSlot = null;
      }
    }

    // Update content area height
    const bodyHeight = this._getBodyHeight();
    this.contentContainer.style('height', `${bodyHeight}px`);
    this.bodyContainer.style('height', `${bodyHeight}px`);
    if (this.labelsSlot) {
      this.labelsSlot.style('height', `${bodyHeight}px`);
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
}
