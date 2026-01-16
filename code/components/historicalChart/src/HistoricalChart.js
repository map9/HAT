/**
 * HistoricalChart - Main controller class
 * Combines TimelineChart's axis system with GanttChart's hierarchical lanes
 */
import * as d3 from 'd3';
import { LIGHT, DARK } from './style.js';
import { LaneNode } from './LaneNode.js';
import { AxisManager } from './AxisManager.js';
import { IndexAxisManager } from './IndexAxisManager.js';
import { ZoomManager } from './ZoomManager.js';
import { ScrollManager } from './ScrollManager.js';
import { TooltipManager } from './TooltipManager.js';
import { LabelRenderer } from './LabelRenderer.js';
import { BarRenderer } from './BarRenderer.js';
import { GroupBarRenderer } from './GroupBarRenderer.js';
import { assignRowsLanes, getMaxRow } from './utils/layout.js';
import * as westernAxises from './westernAxises.js';

export class HistoricalChart {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Chart options
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

      // Time axis
      timeDomain: [
        new Date(new Date().setFullYear(new Date().getFullYear() - 50)),
        new Date(new Date().setFullYear(new Date().getFullYear() + 50))
      ],
      axises: [
        westernAxises.yearlyAxis,
        westernAxises.dailyAxis,
        //westernAxises.yearlyGrid,
        //westernAxises.dailyGrid
      ],
      hasIndexAxis: true,
      indexAxisHeight: 28,
      zoomLimited: [-1, -1],

      // Rows
      rowHeight: 30,
      minRowHeight: 12,

      // Spacing
      xPadding: 2,
      yPadding: 2,
      roundRadius: 4,

      // Groups
      groups: null,
      groupBarMode: 'separate', // 'separate' | 'background'
      groupBarOpacity: 0.3,
      groupYPadding: 5,

      // Scrolling
      scrollable: true,

      // Style
      style: LIGHT,
      locale: 'en-us',

      // Features
      activeAxis: true,
      tooltip: true,

      ...options
    };

    // State
    this.laneTree = null;
    this.currentData = null;
    this.currentAccessors = null;
    this.xScale = null;
    this.enrichedData = [];

    // Managers
    this.axisManager = null;
    this.indexAxisManager = null;
    this.zoomManager = null;
    this.scrollManager = null;
    this.tooltipManager = null;
    this.labelRenderer = null;
    this.barRenderer = null;
    this.groupBarRenderer = null;

    // Event dispatch
    this.dispatch = d3.dispatch(
      'initial',
      'update',
      'resize',
      'barClick',
      'barHover',
      'groupToggle',
      'domainChange'
    );

    // DOM references
    this.wrapper = null;
    this.axisContainer = null;
    this.contentContainer = null;
    this.labelsContainer = null;
    this.bodyContainer = null;
    this.indexContainer = null;

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
    if (this.options.tooltip) {
      this._createTooltip();
    }

    // Initialize managers
    this._initManagers();

    // Setup zoom
    this._setupZoom();

    // Setup active axis
    if (this.options.activeAxis) {
      this._setupActiveAxis();
    }
  }

  /**
   * Calculate body area width
   * Body width = total width - label width
   */
  _calculateBodyWidth() {
    const labelWidth = this.options.labelPosition === 'none' ? 0 : this.options.labelWidth;
    return this.options.width - labelWidth;
  }

  /**
   * Create axis area (top)
   */
  _createAxisArea() {
    this.axisContainer = this.chartDiv.append('div')
      .classed('hc-axis-container', true);

    const labelWidth = this.options.labelPosition === 'none' ? 0 : this.options.labelWidth;

    // Calculate axis height
    this.axisManager = new AxisManager({
      axises: this.options.axises,
      locale: this.options.locale,
      gap: 1
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

  /**
   * Create content area (labels + body)
   * Layout: [labels container] + [body container] = total width
   * - labels container width = labelWidth
   * - body container width = bodyWidth (= total width - labelWidth)
   */
  _createContentArea() {
    const axisHeight = this.axisManager.getHeight();
    const indexHeight = this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
    const contentHeight = this.options.height - axisHeight - indexHeight;

    this.contentContainer = this.chartDiv.append('div')
      .classed('hc-content', true)
      .style('height', `${contentHeight}px`);

    const labelWidth = this.options.labelPosition === 'none' ? 0 : this.options.labelWidth;
    const bodyWidth = this._calculateBodyWidth();
    const isLabelLeft = this.options.labelPosition === 'left';

    // Create labels container (left or right)
    if (this.options.labelPosition !== 'none') {
      this.labelsContainer = this.contentContainer.append('div')
        .classed('hc-labels-container', true)
        .style('width', `${labelWidth}px`)
        .style('height', `${contentHeight}px`)
        .style('overflow', 'hidden')
        .style('order', isLabelLeft ? 0 : 1);

      this.labelsSvg = this.labelsContainer.append('svg')
        .classed('hc-labels-svg', true)
        .attr('width', labelWidth);

      this.labelsGroup = this.labelsSvg.append('g');
    }

    // Body container
    this.bodyContainer = this.contentContainer.append('div')
      .classed('hc-body-container', true)
      .style('width', `${bodyWidth}px`)
      .style('height', `${contentHeight}px`)
      .style('overflow-y', this.options.scrollable ? 'auto' : 'hidden')
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
      .attr('height', contentHeight);

    this.bodyGroup = this.bodySvg.append('g')
      .attr('clip-path', 'url(#hc-body-clip)');

    // Create board for mouse events
    this.board = this.bodyGroup.append('rect')
      .classed('board', true)
      .attr('width', bodyWidth)
      .attr('height', contentHeight);
  }

  /**
   * Create index axis area (bottom)
   */
  _createIndexArea() {
    const labelWidth = this.options.labelPosition === 'none' ? 0 : this.options.labelWidth;

    this.indexContainer = this.chartDiv.append('div')
      .classed('hc-index-container', true);

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
      gap: 1
    });

    // Create axis tooltip in axis SVG
    this.tooltipManager.createAxisTooltip(this.axisGroup);

    // Create event tooltip in wrapper
    this.tooltipManager.createEventTooltip(this.wrapper.node());

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

    // Label renderer
    this.labelRenderer = new LabelRenderer({
      position: this.options.labelPosition,
      width: this.options.labelWidth,
      padding: 6,
      onToggle: (node, expanded) => this._onGroupToggle(node, expanded)
    });
    if (this.labelsGroup) {
      this.labelRenderer.create(this.labelsGroup);
    }

    // Bar renderer
    this.barRenderer = new BarRenderer({
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding,
      textPosition: 'center',
      onClick: (d, event) => this.dispatch.call('barClick', this, d, event),
      onHover: (d, event) => this._onBarHover(d, event),
      onLeave: (d, event) => this._onBarLeave(d, event)
    });
    this.barRenderer.create(this.bodyGroup);

    // Group bar renderer
    this.groupBarRenderer = new GroupBarRenderer({
      mode: this.options.groupBarMode,
      opacity: this.options.groupBarOpacity,
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding
    });
    this.groupBarRenderer.create(this.bodyGroup);

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
    const indexHeight = this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
    const contentHeight = this.options.height - axisHeight - indexHeight;

    this.zoomManager = new ZoomManager({
      timeDomain: this.options.timeDomain,
      width: bodyWidth,
      height: contentHeight,
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
        self._onMouseMove(x, event);
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
  _onMouseMove(x, event) {
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
  _onZoom(xScale, transform, sourceEvent) {
    // Update axis
    const indexHeight = this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
    const contentHeight = this.options.height - this.axisManager.getHeight() - indexHeight;
    this.axisManager.update(xScale, contentHeight);

    // Update bars
    this.barRenderer.update(xScale);

    // Update group bars (need full redraw for proper positioning)
    if (this.laneTree && this.currentAccessors) {
      this.groupBarRenderer.render(this.laneTree, xScale, this.options.rowHeight, this.currentAccessors);
    }

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
   * Handle group toggle
   */
  _onGroupToggle(node, expanded) {
    // Re-render with current data
    if (this.currentData && this.currentAccessors) {
      this._renderData();
    }

    this.dispatch.call('groupToggle', this, node, expanded);
  }

  /**
   * Handle bar hover
   */
  _onBarHover(data, event) {
    if (this.tooltipManager && this.currentAccessors) {
      const title = this.currentAccessors.title
        ? this.currentAccessors.title(data)
        : `${data.label || data.name || ''}`;

      if (title) {
        const [x, y] = d3.pointer(event, this.wrapper.node());
        this.tooltipManager.showEventTooltip(title, x, y);
      }
    }

    this.dispatch.call('barHover', this, data, event);
  }

  /**
   * Handle bar leave
   */
  _onBarLeave(data, event) {
    if (this.tooltipManager) {
      this.tooltipManager.hideEventTooltip();
    }
  }

  /**
   * Handle scroll
   */
  _onScroll(top, left) {
    // Sync is handled by ScrollManager
  }

  /**
   * Render chart with data
   * @param {Array} data - Array of data items
   * @param {Object} accessors - Data accessors
   */
  render(data, accessors = {}) {
    this.currentData = data;
    this.currentAccessors = {
      key: d => d.id,
      start: d => d.start,
      end: d => d.end,
      lane: d => d.lane || '',
      color: d => d.color,
      label: d => d.label || '',
      title: d => d.title || '',
      ...accessors
    };

    this._renderData();

    // Initial axis update
    const xScale = this.zoomManager.getScale();
    const indexHeight = this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
    const contentHeight = this.options.height - this.axisManager.getHeight() - indexHeight;
    this.axisManager.update(xScale, contentHeight);

    // Dispatch initial event
    const bodyWidth = this._calculateBodyWidth();
    this.dispatch.call('initial', this, { left: 0, top: 0, width: bodyWidth, height: contentHeight }, xScale);

    return this;
  }

  /**
   * Internal render data
   */
  _renderData() {
    const { start, end } = this.currentAccessors;

    // Build lane tree if groups are configured
    if (this.options.groups && this.options.groups.length > 0) {
      this.laneTree = this._buildLaneTree(this.currentData, this.options.groups);
      this._assignRowsToTree(this.laneTree);
      this.enrichedData = this._flattenTreeToRenderData(this.laneTree);
    } else {
      // Flat mode - use lanes algorithm
      this.enrichedData = assignRowsLanes(this.currentData, {
        start,
        end,
        xScale: this.xScale,
        xPadding: this.options.xPadding
      });
    }

    // Calculate content height
    const maxRow = getMaxRow(this.enrichedData);
    const contentHeight = (maxRow + 1) * this.options.rowHeight;

    // Update SVG heights
    this.bodySvg.attr('height', contentHeight);
    if (this.labelsSvg) {
      this.labelsSvg.attr('height', contentHeight);
    }

    // Update clip path height (critical for scrolling to work)
    this.bodySvg.select('#hc-body-clip rect')
      .attr('height', contentHeight);

    // Update board height for mouse events
    this.board.attr('height', contentHeight);

    // Render bars
    const xScale = this.zoomManager.getScale();
    this.barRenderer.render(this.enrichedData, xScale, this.options.rowHeight, this.currentAccessors);

    // Render group bars
    if (this.laneTree) {
      this.groupBarRenderer.render(this.laneTree, xScale, this.options.rowHeight, this.currentAccessors);
    }

    // Render labels
    if (this.laneTree && this.labelRenderer) {
      this.labelRenderer.render(this.laneTree, this.options.rowHeight, {
        groupBarMode: this.options.groupBarMode
      });
    }
  }

  /**
   * Build hierarchical lane tree
   */
  _buildLaneTree(data, groups) {
    const root = new LaneNode('root', -1, null);
    const oldTree = this.laneTree;

    // Helper to find existing node in old tree by complete path
    const findExistingNode = (parentNode, level, key) => {
      if (!oldTree) return null;

      // Build path from current parent node
      const currentPath = [];
      let node = parentNode;
      while (node && node.level >= 0) {
        currentPath.unshift(node.key);
        node = node.parent;
      }

      // Find node in old tree with matching path
      const findNode = (oldNode, pathIndex) => {
        // If we've matched the full path and reached target level
        if (pathIndex === currentPath.length && oldNode.level === level && oldNode.key === key) {
          return oldNode;
        }

        // If still building path, continue matching
        if (pathIndex < currentPath.length) {
          for (const child of oldNode.children) {
            if (child.key === currentPath[pathIndex]) {
              const found = findNode(child, pathIndex + 1);
              if (found) return found;
            }
          }
        } else {
          // Path matched, now look for target at next level
          for (const child of oldNode.children) {
            if (child.level === level && child.key === key) {
              return child;
            }
          }
        }

        return null;
      };

      return findNode(oldTree, 0);
    };

    const buildLevel = (parentNode, items, levelIndex) => {
      if (levelIndex >= groups.length) {
        // Leaf level - store items
        parentNode.items = items;
        return;
      }

      const group = groups[levelIndex];
      const grouped = d3.group(items, d => d[group.field]);

      grouped.forEach((groupItems, key) => {
        const childNode = new LaneNode(key, levelIndex, group.field, parentNode);

        // Preserve expanded state from existing tree if available
        const existingNode = findExistingNode(parentNode, levelIndex, key);
        childNode.expanded = existingNode ? existingNode.expanded : (group.expanded !== false);

        parentNode.children.push(childNode);

        // Always build child tree to preserve structure
        // This allows collapsed nodes to be re-expanded
        buildLevel(childNode, groupItems, levelIndex + 1);

        // If collapsed, also store items at this node for rendering
        if (!childNode.expanded) {
          childNode.items = groupItems;
        }
      });
    };

    buildLevel(root, data, 0);
    return root;
  }

  /**
   * Assign row numbers to tree nodes
   */
  _assignRowsToTree(root) {
    const { start, end } = this.currentAccessors;
    const useSeparateRow = this.options.groupBarMode === 'separate';
    let currentRow = 0;

    const traverse = (node) => {
      node.rowStart = currentRow;

      if (node.isCollapsed() || node.isLeaf()) {
        // Collapsed or leaf: assign group bar row + item rows
        if (useSeparateRow && node.shouldRenderGroupBar()) {
          node.groupBarRow = currentRow++;
        }

        // Assign rows to items
        const assigned = assignRowsLanes(node.getAllItems(), {
          start,
          end,
          xScale: this.xScale,
          xPadding: this.options.xPadding
        });

        const maxItemRow = getMaxRow(assigned);
        node.items = assigned;
        currentRow += maxItemRow + 1;
      } else {
        // Expanded parent: group bar + children
        if (useSeparateRow && node.shouldRenderGroupBar()) {
          node.groupBarRow = currentRow++;
        }

        node.children.forEach(child => traverse(child));
      }

      node.rowEnd = currentRow - 1;
    };

    root.children.forEach(child => traverse(child));
  }

  /**
   * Flatten tree to render data
   */
  _flattenTreeToRenderData(root) {
    const result = [];

    const traverse = (node) => {
      if (node.isCollapsed() || node.isLeaf()) {
        // Add items with adjusted row numbers
        node.items.forEach(item => {
          const baseRow = node.groupBarRow >= 0 ? node.groupBarRow + 1 : node.rowStart;
          result.push({
            ...item,
            rowNo: baseRow + item.rowNo
          });
        });
      } else {
        node.children.forEach(child => traverse(child));
      }
    };

    root.children.forEach(child => traverse(child));
    return result;
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
    const indexHeight = this.options.hasIndexAxis ? this.options.indexAxisHeight : 0;
    const contentHeight = height - axisHeight - indexHeight;

    // Update scale
    this.xScale.range([0, bodyWidth]);

    // Update containers
    this.axisSvg.attr('width', width);
    this.contentContainer.style('height', `${contentHeight}px`);
    this.bodyContainer.style('width', `${bodyWidth}px`);
    this.bodySvg.attr('width', bodyWidth);

    if (this.indexSvg) {
      this.indexSvg.attr('width', width);
    }

    // Update zoom
    this.zoomManager.resize(bodyWidth, contentHeight);

    // Update index axis
    if (this.indexAxisManager) {
      this.indexAxisManager.resize(bodyWidth);
    }

    // Re-render if data exists
    if (this.currentData) {
      this._renderData();
    }

    this.dispatch.call('resize', this, width, height);
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
    this.container.innerHTML = '';
  }
}
