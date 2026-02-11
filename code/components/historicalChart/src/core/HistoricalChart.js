/**
 * HistoricalChart - Main controller class
 * Combines TimelineChart's axis system with GanttChart's hierarchical lanes
 */
import * as d3 from 'd3';
import { getSystemTheme } from './theme.js';
import { AxisManager } from './AxisManager.js';
import { IndexAxisManager } from './IndexAxisManager.js';
import { ZoomManager } from './ZoomManager.js';
import { ScrollManager } from './ScrollManager.js';
import { TooltipManager } from './TooltipManager.js';
import { LayerManager } from './LayerManager.js';
import * as westernAxises from './axises/westernAxises.js';
import { isObjectValueChanged } from './utils/options.js'

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
   * @param {string} options.theme - CSS style string
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
      theme: 'light',
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
      .text(getSystemTheme(this.options.theme, this.options.accentScheme));

    // Create main chart div
    this.chartDiv = this.wrapper.append('div')
      .classed('historical-chart', true)
      .style('width', '100%')
      .style('height', '100%');

    // Create structure
    this._createAxisArea();
    this._createContentArea();
    this._createIndexAxis();
    
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
      this._createActiveAxis();
    }
  }

  isCreated() {
    return this.container !== null;
  }

  /**
   * Calculate body area height
   * Body height = total height (labels float over content)
   */
  _getBodyHeight() {
    const axisHeight = this.axisManager.getHeight();
    const indexAxisHeight = this.options.hasIndexAxis
      ? (this.indexAxisManager ? this.indexAxisManager.getHeight() : this.options.indexAxisHeight)
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
  _createOrUpdateLabelsSlot() {
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
    this._createOrUpdateLabelsSlot();
    
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
  _createIndexAxis() {
    // Create slot - just a mounting point, IndexAxisManager creates the actual DOM
    this.indexSlot = this.chartDiv.append('div')
      .classed('hc-index-slot', true);
    
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
   * Create active axis (vertical line at mouse position)
   */
  _createActiveAxis() {
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
      .on('mousemove.activeAxis', function(event) {
        const [x] = d3.pointer(event);
        self._onMouseMove(x);
      })
      .on('mouseenter.activeAxis', function() {
        self.activeAxis.attr('visibility', 'visible');
        if (self.tooltipManager) {
          self.tooltipManager.showAxisTooltip(true);
        }
      })
      .on('mouseleave.activeAxis', function() {
        self.activeAxis.attr('visibility', 'hidden');
        if (self.tooltipManager) {
          self.tooltipManager.showAxisTooltip(false);
        }
      });
  }

  /**
   * 销毁活跃轴（activeAxis）并清理相关事件监听
   */
  _destroyActiveAxis() {
    // 1. 移除 activeAxis 元素（如果存在）
    if (this.activeAxis) {
      this.activeAxis.remove(); // 从 DOM 中移除 g 元素及其子元素
      this.activeAxis = null;   // 清空引用，避免内存泄漏
    }

    // 2. 清理 board 上的鼠标事件监听（通过命名空间精准清理）
    if (this.board) {
      this.board
        .on('mousemove.activeAxis', null)  // 只删 activeAxis 命名空间的 mousemove
        .on('mouseenter.activeAxis', null) // 只删 activeAxis 命名空间的 mouseenter
        .on('mouseleave.activeAxis', null); // 只删 activeAxis 命名空间的 mouseleave
    }

    // 3. 隐藏轴提示框（可选：确保 tooltip 状态重置）
    if (this.tooltipManager) {
      this.tooltipManager.showAxisTooltip(false);
    }
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
    this._createOrUpdateLabelsSlot();

    // Update clip path
    this.bodySvg.select('#hc-body-clip rect')
      .attr('width', this.options.width)
      .attr('height', this.contentHeight || bodyHeight);

    // Update board for mouse events
    this.board
      .attr('width', this.options.width)
      .attr('height', this.contentHeight || bodyHeight);

    if (this.activeAxis) {
      this.activeAxis.attr('y2', this.axisManager.getHeight());
    }

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
    this.axisManager.update(xScale);
    this.layerManager.update(xScale, bodyHeight, this.contentHeight);

    this.dispatch.call('resize', this, width, height);
  }

  getContentHeight(forceUpdate = false) {
    let contentHeight = null;
    if (forceUpdate || !this.contentHeight) {
      contentHeight = this.layerManager.calculateContentHeight(
        this.zoomManager.getScale()
      );
    } else {
      contentHeight = this.contentHeight;
    }

    return contentHeight;
  }

  updateContentHeight(forceUpdate = false) {
    this.contentHeight = this.getContentHeight(forceUpdate);

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
   * @param {string} theme - LIGHT or DARK or custom CSS
   * @param {string} accentScheme - Accent color scheme
   */
  setStyle(theme, accentScheme) {
    this.options.theme = theme || 'light';
    this.options.accentScheme = accentScheme || 'default';
    this.wrapper.select('style').text(getSystemTheme(this.options.theme, this.options.accentScheme));
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

  getScale() {
    return this.zoomManager.getScale();
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

    if (this.axisManager) this.axisManager.destroy();
    if (this.indexAxisManager) this.indexAxisManager.destroy();
    if (this.scrollManager) this.scrollManager.destroy();
    if (this.tooltipManager) this.tooltipManager.destroy();
    if (this.layerManager) this.layerManager.destroy();
    
    this.axisManager = null;
    this.indexAxisManager = null;
    this.zoomManager = null;
    this.scrollManager = null;
    this.tooltipManager = null;
    this.layerManager = null;

    // Event dispatch
    // 没有清理
    this.dispatch = null;

    // Dom 没有清理
    this._destroyActiveAxis();
    this.container.innerHTML = '';
    this.container = null;
  }

    /**
   * Update chart options dynamically without recreating the chart
   * Options 的属性的传递链路的逻辑是，谁传递到下一层，谁负责将变更传递到下一层
   * @param {Object} options - Options to update (partial)
   */
  setOptions(options) {
    const oldOptions = { ...this.options };
    this.options = { ...this.options, ...options };

    // Dimensions & Labels
    const changeWidth = oldOptions.width !== this.options.width;
    const changeHeight = oldOptions.height !== this.options.height;
    const changeLabelWidth = oldOptions.labelWidth !== this.options.labelWidth;
    const changeLabelPosition = oldOptions.labelPosition !== this.options.labelPosition;
    if ( changeWidth || changeHeight || changeLabelWidth || changeLabelPosition) {
      if (changeWidth || changeHeight) {
        this.resize(this.options.width, this.options.height);
      } else {
        this._createOrUpdateLabelsSlot();
      }
    }

    // Update time domain or zoom limits
    if (
      this._hasDomainChanged(oldOptions.timeDomain, this.options.timeDomain) ||
      this._hasArrayChanged(oldOptions.zoomLimited, this.options.zoomLimited)
    ) {
      this.zoomManager.setOptions({
        timeDomain: this.options.timeDomain,
        zoomLimited: this.options.zoomLimited
      });

      // Update index axis
      if (this.indexAxisManager) {
        this.indexAxisManager.setOptions({
          timeDomain: this.options.timeDomain,
          zoomLimited: this.options.zoomLimited
        });
        this.indexAxisManager.updateFromZoom(this.getCurrentDomain());
      }
    }

    // Update axis area if axises changed
    if (isObjectValueChanged(oldOptions.axises, this.options.axises)) {
      this.axisManager.setOptions({ axises: this.options.axises });
      const xScale = this.getScale();
      this.axisManager.update(xScale, this.axisManager.getHeight());
    }

    // Round radius for all chart elements
    if (
      this.tooltipManager && 
      (oldOptions.roundRadius !== this.options.roundRadius)
    ) {
      this.tooltipManager.setOptions({
        roundRadius: this.options.roundRadius
      });
      // 传递到 Layer
    }

    // Index axis
    if (
      oldOptions.hasIndexAxis !== this.options.hasIndexAxis ||
      oldOptions.indexAxisHeight !== this.options.indexAxisHeight
    ) {
      if (this.options.hasIndexAxis && !this.indexAxisManager) {
        // Create index axis manager
        this._createIndexAxis();
        this.indexAxisManager.updateFromZoom(this.getCurrentDomain());
      } else if (!this.options.hasIndexAxis && this.indexAxisManager) {
        this.indexAxisManager.destroy();
        this.indexAxisManager = null;
      } else if (oldOptions.indexAxisHeight !== this.options.indexAxisHeight  && this.indexAxisManager) {
        this.indexAxisManager.resize(this.options.width, this.options.indexAxisHeight);
      }

      // Update content area height
      const bodyHeight = this._getBodyHeight();
      this.contentContainer.style('height', `${bodyHeight}px`);
      this.bodyContainer.style('height', `${bodyHeight}px`);
      if (this.labelsSlot) {
        this.labelsSlot.style('height', `${bodyHeight}px`);
      }
    }

    // Features
    if (oldOptions.hasActiveAxis !== this.options.hasActiveAxis) {
      if (this.options.hasActiveAxis) {
        this._createActiveAxis();
      } else {
        this._destroyActiveAxis();
      }
    }
    if (oldOptions.hasTooltip !== this.options.hasTooltip) {
      if (this.options.hasTooltip && !this.tooltipManager) {
        this._createTooltip();
      } else if (this.tooltipManager) {
        this.tooltipManager.setVisible(this.options.hasTooltip);
      }
    }

    // Style
    if (
      oldOptions.theme !== this.options.theme ||
      oldOptions.accentScheme !== this.options.accentScheme
    ) {
      this.setStyle(this.options.theme, this.options.accentScheme);
    }
    if (oldOptions.locale !== this.options.locale) {
      this.axisManager.setOptions({
        locale: this.options.locale
      })
      this.tooltipManager.setOptions({
        locale: this.options.locale
      })
      this.layerManager.setOptions({
        locale: this.options.locale
      })
    }
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

}
