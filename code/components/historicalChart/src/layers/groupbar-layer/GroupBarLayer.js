/**
 * GroupBarLayer - Render group bars (separate or background mode)
 * Migrated from GroupBarRenderer to Layer architecture
 */
import * as d3 from 'd3';
import { Layer } from '../Layer.js';
import { LaneNode } from './LaneNode.js';
import { BarRenderer } from './BarRenderer.js';
import { GroupBarRenderer } from './GroupBarRenderer.js';
import { LabelRenderer } from './LabelRenderer.js';
import { PointRenderer } from './PointRenderer.js';
import { LinkRenderer } from './LinkRenderer.js';
import { ItemHighlighter } from './ItemHighlighter.js';
import { assignRowsLanes, getMaxRow } from '../../utils/layout.js';

export class GroupBarLayer extends Layer {
  /**
   * @param {string} id - Layer ID
   * @param {Object} options - Layer options
   * @param {number} options.rowHeight - Height of each row
   * @param {number} options.minRowHeight - Minimum row height
   * @param {number} options.labelWidth - Label area width
   * @param {string} options.labelPosition - 'left' | 'right' | 'none'
   * @param {number} options.labelXPadding - Padding between label and left or right edge
   * @param {number} options.xPadding - Horizontal padding between bars
   * @param {number} options.yPadding - Vertical padding for bars, include row height
   * @param {number} options.roundRadius - Corner radius for bars and group bars and tooltips
   * @param {string} options.mode - 'separate' | 'background'
   * @param {number} options.groupYPadding - Vertical padding for groups in background mode
   * @param {string} options.barTextPosition - 'none' | 'left' | 'center' | 'right'
   * @param {Function} options.barStyleFn - Style callback for bars
   * - barStyleFn(type, context) => { stroke, strokeWidth, strokeDasharray, fill, fillOpacity }
   * - type: 'bar' | 'separate' | 'background'
   * - context: { data, accessors } for 'bar', node for 'separate' | 'background'
   * @param {number} options.pointSizeRatio - Point size relative to rowHeight (0-1)
   * @param {string} options.pointTextPosition - 'none' | 'right' | 'top'
   * @param {Function} options.pointStyleFn - Style callback for points
   * - pointStyleFn(context) => { stroke, strokeWidth, fill, fillOpacity, marker }
   * - context: { data, accessors }
   * @param {string} options.curve - d3 curve type for links
   * @param {number} options.minLinkLength - Minimum link length to display
   * @param {number} options.headSize - Size of link head markers
   * @param {Function} options.linkStyleFn - Style callback for links
   * - linkStyleFn(link) => { stroke, strokeWidth, strokeDasharray, headMarker }
   * - headMarker: 'none' | 'circle' | 'arrow' | 'square' | 'diamond', defaults to 'none'
   */
  constructor(id = 'groupBars', options = {}) {
    super(id, options);

    // Set defaults
    this.options = {
      // Rows
      rowHeight: 30,            // Height of each row
      minRowHeight: 12,         // Minimum row height

      // Labels
      labelWidth: 160,          // Label area width
      labelPosition: 'left',    // 'left' | 'right' | 'none'
      labelXPadding: 6,         // Padding between label and left or right edge

      // Spacing
      xPadding: 2,              // Horizontal padding between bars
      yPadding: 2,              // Vertical padding for bars, include row height
      roundRadius: 4,           // Corner radius for bars and group bars and tooltips

      // Groups
      mode: 'separate',         // 'separate' | 'background'
      groupYPadding: 5,         // Vertical padding for groups in background mode

      // Bars
      barTextPosition: 'center',  // 'none' | 'left' | 'center' | 'right'
      barStyleFn: null,

      // Points
      pointSizeRatio: 0.6,      // Point size relative to rowHeight (0-1)
      pointTextPosition: 'none',// 'none' | 'right' | 'top'
      pointStyleFn: null,

      // Links
      curve: 'curveBumpX',      // d3 curve type for links
      minLinkLength: 20,        // Minimum link length to display
      headSize: 5,
      linkStyleFn: null,

      ...options
    };

    // State
    this.currentData = null;
    this.currentAccessors = null;
    this.groups = null,

    this.laneTree = null;
    this.enrichedData = null;

    this.currentLinks = null;
    this.currentLinksAccessors = null;
    this.enrichedLinks = null;    

    // Managers
    this.barRenderer = null;
    this.pointRenderer = null;
    this.linkRenderer = null;
    this.groupBarRenderer = null;
    this.labelRenderer = null;
    this.itemHighlighter = null;
  }

  /**
   * Create layer's SVG group
   * @param {HistoricalChart} chart - historical chart
   * @param {Object} createOptions - Options for layer creation
   * @param {d3.Selection} createOptions.labelsSlot - Mounting point for LabelRenderer (dependency injection)
   */
  create(chart, createOptions = {}) {
    const group = super.create(chart);

    // Store injected dependencies (prefer createOptions over direct chart access)
    this.labelsSlot = createOptions.labelsSlot || chart.labelsSlot;

    // Group bar renderer
    this.groupBarRenderer = new GroupBarRenderer({
      mode: this.options.mode,
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding,
      styleFn: this.options.barStyleFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, { type: 'group', data: d }, event),
      onHover: (d, event) => this._onItemHover({ type: 'group', data: d }, event),
      onLeave: (d, event) => this._onItemLeave({ type: 'group', data: d }, event)
    });
    this.groupBarRenderer.create(this.group);

    // Bar renderer (for time range items)
    this.barRenderer = new BarRenderer({
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding,
      textPosition: this.options.barTextPosition,
      styleFn: this.options.barStyleFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, { type: 'bar', data: d }, event),
      onHover: (d, event) => this._onItemHover({ type: 'bar', data: d }, event),
      onLeave: (d, event) => this._onItemLeave({ type: 'bar', data: d }, event)
    });
    this.barRenderer.create(this.group);

    // Point renderer (for single time point items) - rendered above bars
    this.pointRenderer = new PointRenderer({
      sizeRatio: this.options.pointSizeRatio,
      textPosition: this.options.pointTextPosition,
      styleFn: this.options.pointStyleFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, { type: 'point', data: d }, event),
      onHover: (d, event) => this._onItemHover({ type: 'point', data: d }, event),
      onLeave: (d, event) => this._onItemLeave({ type: 'point', data: d }, event)
    });
    this.pointRenderer.create(this.group);

    // Link renderer (for single time link items) - rendered below bars
    this.linkRenderer = new LinkRenderer({
      curve: this.options.curve,
      headSize: this.options.headSize,
      styleFn: this.options.linkStyleFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, { type: 'link', data: d }, event),
      onHover: (d, event) => this._onItemHover({ type: 'link', data: d }, event),
      onLeave: (d, event) => this._onItemLeave({ type: 'link', data: d }, event)
    });
    this.linkRenderer.create(this.group);

    // Label renderer - creates its own DOM inside labelsSlot
    this.labelRenderer = new LabelRenderer({
      position: this.options.labelPosition,
      width: this.options.labelWidth,
      padding: this.options.labelXPadding,
      onToggle: (node, expanded) => this._onGroupToggle(node, expanded),
      onContainerCreated: (container) => {
        // Register the labels container for scroll sync
        if (this.chart && this.chart.registerLabelsContainer) {
          this.chart.registerLabelsContainer(container);
        }
      }
    });
    if (this.labelsSlot) {
      this.labelRenderer.create(this.labelsSlot);
    }

    // Item highlighter for link hover
    this.itemHighlighter = new ItemHighlighter(this.group);

    return group;
  }

  /**
   * set layer data
   * @param {Array} data - Array of data items
   * @param {Object} accessors - Data accessors
   * @param {Function} accessors.isPoint - Optional accessor to determine if item is a point (returns true/false)
   * @param {Array} groups - Group definitions for hierarchical lanes
   */
  setLayerData(data, accessors = {}, groups = null) {
    this.currentData = data;
    this.currentAccessors = {
      key: d => d.id,
      start: d => d.start,
      end: d => d.end,
      lane: d => d.lane || '',
      label: d => d.label || '',
      title: d => d.title || '',
      isPoint: () => false, // Default: all items are bars
      ...accessors
    };
    this.laneTree = null;
    this.enrichedData = null;
    this.groups = groups;

    this._triggerRender();
  }

  /**
   * Set link data
   * @param {Array} links - Array of link definitions
   * @param {Object} accessors - Optional accessors for link properties
   */
  setLinkData(links, accessors = {}) {
    this.currentLinks = links;
    this.currentLinksAccessors = {
      startId: d => d.startId,
      endId: d => d.endId,
      start: d => d.start,
      end: d => d.end,
      label: d => d.label || '',
      type: d => d.type || 'unknown',
      ...accessors
    };
    this.enrichedLinks = null;

    this._triggerRender();
  }

  /**
   * Handle group toggle
   */
  _onGroupToggle(node, expanded) {
    // Re-render with current data
    if (this.currentData && this.currentAccessors) {
      this.enrichedData = null;
      const xScale = this.chart.zoomManager.getScale();
      this.render(xScale);
    }

    this.chart.dispatch.call('groupToggle', this, node, expanded);
  }

  /**
   * Handle item hover
   */
  _onItemHover(context, event) {
    const { type, data } = context;

    let title = null;
    if (type === 'bar' || type === 'point') {
      if (this.chart.tooltipManager && this.currentAccessors) {
        title = this.currentAccessors.title
          ? this.currentAccessors.title(data)
          : `${data.label || data.name || ''}`;
      }
    } else if (type === 'link') {
      // Highlight related items using ItemHighlighter
      if (this.itemHighlighter) {
        this.itemHighlighter.highlight([data.startId, data.endId]);
      }
      title = data.type
        ? `<strong>${data.label}</strong><br/><small>${data.type}</small>`
        : data.label;
    }

    if (title) {
      const [x, y] = d3.pointer(event, this.chart.wrapper.node());
      this.chart.tooltipManager.showItemTooltip(title, x, y);
    }

    this.chart.dispatch.call('itemHover', this, data, event);
  }

  /**
   * Handle item leave
   */
  _onItemLeave(context, event) {
    const { type, data } = context;

    if (type === 'bar' || type === 'point' || type === 'link') {
      if (this.chart.tooltipManager) {
        this.chart.tooltipManager.hideItemTooltip();
      }
    }
    
    if (type === 'link') {
      // Clear item highlights
      if (this.itemHighlighter) {
        this.itemHighlighter.clear();
      }
    }

    this.chart.dispatch.call('itemLeave', this, data, event);
  }

  /**
   * calculate layer content height
   * @param {d3.scaleUtc} xScale - timeline scale
   * @returns {number} content height
   */
  calculateContentHeight(xScale) {
    if (!this.enrichedData) {
      this._prepareData(xScale);
    }

    const maxRow = getMaxRow(this.enrichedData);
    return (maxRow + 1) * this.options.rowHeight;
  }

  _prepareData(xScale) {
    // Perpare data
    const { start, end } = this.currentAccessors;

    // Build lane tree if groups are configured
    if (this.groups && this.groups.length > 0) {
      this.laneTree = this._buildLaneTree(this.currentData, this.groups);
      this._assignRowsToTree(this.laneTree, xScale);
      this.enrichedData = this._flattenTreeToRenderData(this.laneTree);
    } else {
      // Flat mode - use lanes algorithm
      this.enrichedData = assignRowsLanes(this.currentData, {
        start,
        end,
        xScale: xScale,
        xPadding: this.options.xPadding
      });
    }
  }

  /**
   * Find existing node in old tree by matching the path from root
   * @private
   */
  _findExistingNode(oldTree, parentNode, level, key) {
    if (!oldTree) return null;

    // Build path from current parent node to root
    const pathToRoot = [];
    let node = parentNode;
    while (node && node.level >= 0) {
      pathToRoot.unshift(node.key);
      node = node.parent;
    }

    // Traverse old tree following the same path
    let currentNode = oldTree;
    for (const pathKey of pathToRoot) {
      const child = currentNode.children.find(c => c.key === pathKey);
      if (!child) return null;
      currentNode = child;
    }

    // Find the target node among children
    return currentNode.children.find(c => c.level === level && c.key === key) || null;
  }

  /**
   * Build hierarchical lane tree
   */
  _buildLaneTree(data, groups) {
    const root = new LaneNode('root', -1, null);
    const oldTree = this.laneTree;

    const buildLevel = (parentNode, items, levelIndex) => {
      if (levelIndex >= groups.length) {
        parentNode.items = items;
        return;
      }

      const group = groups[levelIndex];
      const grouped = d3.group(items, d => d[group.field]);

      grouped.forEach((groupItems, key) => {
        const childNode = new LaneNode(key, levelIndex, group.field, parentNode);

        // Preserve expanded state from existing tree if available
        const existingNode = this._findExistingNode(oldTree, parentNode, levelIndex, key);
        childNode.expanded = existingNode ? existingNode.expanded : (group.expanded !== false);

        parentNode.children.push(childNode);

        // Build child tree to preserve structure for re-expansion
        buildLevel(childNode, groupItems, levelIndex + 1);

        // Store items at collapsed nodes for rendering
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
  _assignRowsToTree(root, xScale) {
    const { start, end } = this.currentAccessors;
    const useSeparateRow = this.options.mode === 'separate';
    const useBackground = this.options.mode === 'background';
    const groupYPadding = this.options.groupYPadding || 0;
    const rowHeight = this.options.rowHeight;

    // Calculate how many padding rows needed for groupYPadding
    //const paddingRows = useBackground ? Math.ceil(groupYPadding / rowHeight) : 0;
    const paddingRows = useBackground ? groupYPadding / rowHeight : 0;

    let currentRow = 0;

    const traverse = (node) => {
      // Add padding rows at group start (for all groups in background mode)
      if (useBackground && node.level >= 0) {
        currentRow += paddingRows;
      }

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
          xScale: xScale,
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

      // Add padding rows at group end (for all groups in background mode)
      if (useBackground && node.level >= 0) {
        currentRow += paddingRows;
      }
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

  _prepareLinks(xScale) {
    if (!this.currentLinks || !this.enrichedData || !this.currentAccessors) {
      this.enrichedLinks = [];
      return;
    }

    const rowHeight = this.options.rowHeight;
    const { startId, endId, start, end, label, type } = this.currentLinksAccessors;

    this.enrichedLinks = this.currentLinks
      .map(link => {
        const startIdVal = startId(link);
        const endIdVal = endId(link);

        const startItem = this.enrichedData.find(d => this.currentAccessors.key(d) === startIdVal)
        const endItem = this.enrichedData.find(d => this.currentAccessors.key(d) === endIdVal)

        if (!startItem || !endItem) {
          // Silently skip missing references
          return null;
        }

        // Calculate X positions
        let startX, endX;

        const linkStartDate = start(link);
        const linkEndDate = end(link);

        if (linkStartDate) {
          startX = xScale(linkStartDate);
        } else {
          startX = xScale(this.currentAccessors.end(startItem));
        }

        if (linkEndDate) {
          endX = xScale(linkEndDate);
        } else {
          endX = xScale(this.currentAccessors.start(endItem));
        }
        
        const startY = startItem.rowNo * rowHeight + rowHeight / 2;
        const endY = endItem.rowNo * rowHeight + rowHeight / 2;

        // Check minimum display length
        if (
          Math.abs(endX - startX) < this.options.minLinkLength &&
          Math.abs(endY - startY) < this.options.minLinkLength
        ) {
          return null;
        }

        return {
          startId: startIdVal,
          endId: endIdVal,
          startX,
          endX,
          startY: startY,
          endY: endY,
          label: label(link),
          type: type(link),
        };
      })
      .filter(link => link !== null);
  }

  /**
   * Render group bars from lane tree
   * @param {d3.ScaleTime} xScale - Time scale
   */
  render(xScale) {
    if (!this.currentData || !this.currentAccessors)
      return;

    let needUpdateContentHeight = false;
    if (!this.enrichedData) {
      this._prepareData(xScale);
      needUpdateContentHeight = true;
    }

    // Separate bars and points
    const { isPoint } = this.currentAccessors;
    const barData = this.enrichedData.filter(d => !isPoint(d));
    const pointData = this.enrichedData.filter(d => isPoint(d));

    // Render bars (time range items)
    if (barData.length > 0) {
      this.barRenderer.render(barData, xScale, this.options.rowHeight, this.currentAccessors);
    } else {
      this.barRenderer.clear();
    }

    // Render points (single time point items) - rendered after bars so they appear on top
    if (pointData.length > 0) {
      this.pointRenderer.render(pointData, xScale, this.options.rowHeight, this.currentAccessors);
    } else {
      this.pointRenderer.clear();
    }

    // Render group bars
    if (this.laneTree) {
      this.groupBarRenderer.render(this.laneTree, xScale, this.options.rowHeight, this.currentAccessors);
    }

    // Render labels
    if (this.laneTree && this.labelRenderer) {
      this.labelRenderer.render(this.laneTree, this.options.rowHeight, this.options.mode);
    }

    this._prepareLinks(xScale);
    this.linkRenderer.render(this.enrichedLinks);

    if (needUpdateContentHeight) this.chart.updateContentHeight(true);
  }

  /**
   * Update group bar positions on zoom/pan
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    // Update bars
    this.barRenderer.update(xScale);

    // Update points
    this.pointRenderer.update(xScale, this.options.rowHeight);

    // Update group bars (need full redraw for proper positioning)
    if (this.laneTree && this.currentAccessors) {
      this.groupBarRenderer.render(this.laneTree, xScale, this.options.rowHeight, this.currentAccessors);
    }

    this._prepareLinks(xScale);
    this.linkRenderer.render(this.enrichedLinks);
  }

  /**
   * Resize layer (placeholder for future implementation)
   */
  resize() {
    // Currently no resize logic needed for GroupBarLayer
  }

  /**
   * Update content height (notifies LabelRenderer to update its SVG height)
   * @param {number} contentHeight - New content height
   */
  updateContentHeight(contentHeight) {
    if (this.labelRenderer) {
      this.labelRenderer.updateContentHeight(contentHeight);
    }
  }

  /**
   * Update layer options with smart cache invalidation
   * Override from Layer base class
   * @param {Object} options - New options to merge
   * @param {boolean} [skipRender=false] - Skip re-render
   * @returns {boolean} Whether re-render is needed
   */
  setOptions(options, skipRender = false) {
    // Detect if structural changes require cache invalidation
    const needsFullRebuild =
      options.mode !== undefined ||
      options.rowHeight !== undefined ||
      options.xPadding !== undefined ||
      options.groupYPadding !== undefined;

    // Update sub-renderer options if needed
    const barOptions = {};
    const groupBarOptions = {};
    const linkOptions = {};
    const pointOptions = {};
    const labelOptions = {};

    // groupBarRenderer and barRenderer options
    if (options.mode && options.mode !== this.options.mode) {
      groupBarOptions.mode = options.mode;
      labelOptions.mode = options.mode;
    }
    if (options.roundRadius && options.roundRadius !== this.options.roundRadius) {
      groupBarOptions.roundRadius = options.roundRadius;
      barOptions.roundRadius = options.roundRadius;
      labelOptions.roundRadius = options.roundRadius;
    }
    if (options.yPadding && options.yPadding !== this.options.yPadding) {
      groupBarOptions.yPadding = options.yPadding;
      barOptions.yPadding = options.yPadding;
    }
    if (options.barTextPosition && options.barTextPosition !== this.options.barTextPosition) {
      barOptions.textPosition = options.barTextPosition;
    }
    if (options.barStyleFn && options.barStyleFn !== this.options.barStyleFn) {
      groupBarOptions.styleFn = options.barStyleFn;
      barOptions.styleFn = options.barStyleFn;
    }

    // linkRenderer options
    if (options.curve && options.curve !== this.options.curve) {
      linkOptions.curve = options.curve;
    }
    if (options.headSize && options.headSize !== this.options.headSize) {
      linkOptions.headSize = options.headSize;
    }
    if (options.linkStyleFn && options.linkStyleFn !== this.options.linkStyleFn) {
      linkOptions.styleFn = options.linkStyleFn;
    }

    // pointRenderer options
    if (options.pointSizeRatio && options.pointSizeRatio !== this.options.pointSizeRatio) {
      pointOptions.sizeRatio = options.pointSizeRatio;
    }
    if (options.pointTextPosition && options.pointTextPosition !== this.options.pointTextPosition) {
      pointOptions.textPosition = options.pointTextPosition;
    }
    if (options.pointStyleFn && options.pointStyleFn !== this.options.pointStyleFn) {
      pointOptions.styleFn = options.pointStyleFn;
    }

    // labelRenderer options
    if (options.labelPosition && options.labelPosition !== this.options.labelPosition) {
      labelOptions.position = options.labelPosition;
    }
    if (options.labelWidth && options.labelWidth !== this.options.labelWidth) {
      labelOptions.width = options.labelWidth;
    }
    if (options.labelXPadding && options.labelXPadding !== this.options.labelXPadding) {
      labelOptions.padding = options.labelXPadding;
    }

    // all sub-renderer message options (these don't require re-render)
    if (options.onClick && options.onClick !== this.options.onClick) {
      linkOptions.onClick = options.onClick;
      pointOptions.onClick = options.onClick;
    }
    if (options.onHover && options.onHover !== this.options.onHover) {
      linkOptions.onHover = options.onHover;
      pointOptions.onHover = options.onHover;
    }
    if (options.onLeave && options.onLeave !== this.options.onLeave) {
      linkOptions.onLeave = options.onLeave;
      pointOptions.onLeave = options.onLeave;
    }
    if (options.onLabelToggle && options.onLabelToggle !== this.options.onLabelToggle) {
      labelOptions.onToggle = options.onLabelToggle;
    }

    // Clear cached data if structural changes
    if (needsFullRebuild) {
      this.laneTree = null;
      this.enrichedData = null;
      this.enrichedLinks = null;
    }

    // Propagate options to sub-renderers and collect render flags
    let needsRender = needsFullRebuild;

    if (Object.keys(groupBarOptions).length > 0 && this.groupBarRenderer) {
      needsRender = this.groupBarRenderer.setOptions(groupBarOptions) || needsRender;
    }
    if (Object.keys(barOptions).length > 0 && this.barRenderer) {
      needsRender = this.barRenderer.setOptions(barOptions) || needsRender;
    }
    if (Object.keys(linkOptions).length > 0 && this.linkRenderer) {
      needsRender = this.linkRenderer.setOptions(linkOptions) || needsRender;
    }
    if (Object.keys(pointOptions).length > 0 && this.pointRenderer) {
      needsRender = this.pointRenderer.setOptions(pointOptions) || needsRender;
    }
    if (Object.keys(labelOptions).length > 0 && this.labelRenderer) {
      needsRender = this.labelRenderer.setOptions(labelOptions) || needsRender;
    }

    if (needsRender === false) {
      super.setOptions(options, true); // 只要 skipRender = false，默认重新渲染
      return false;
    } else {
      return super.setOptions(options, skipRender);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear data references
    this.laneTree = null;
    this.enrichedData = null;
    this.enrichedLinks = null;

    if (this.barRenderer) this.barRenderer.destroy();
    if (this.pointRenderer) this.pointRenderer.destroy();
    if (this.linkRenderer) this.linkRenderer.destroy();
    if (this.groupBarRenderer) this.groupBarRenderer.destroy();
    if (this.labelRenderer) this.labelRenderer.destroy();
    
    this.barRenderer = null;
    this.pointRenderer = null;
    this.linkRenderer = null;
    this.groupBarRenderer = null;
    this.labelRenderer = null;
    this.itemHighlighter = null;

    super.destroy();
  }
}