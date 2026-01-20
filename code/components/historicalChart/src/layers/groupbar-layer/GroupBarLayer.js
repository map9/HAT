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
   * @param {string} options.mode - 'separate' | 'background'
   * @param {number} options.opacity - Group bar opacity (0-1)
   * @param {number} options.roundRadius - Corner radius
   * @param {number} options.yPadding - Vertical padding (same as bars)
   * @param {Function} options.colorFn - Color callback function
   * @param {boolean} options.visible - Initial visibility
   */
  constructor(id = 'groupBars', options = {}) {
    super(id, options);

    // Set defaults
    this.options = {
      // Rows
      rowHeight: 30,
      minRowHeight: 12,

      // Labels
      labelWidth: 160,
      labelPosition: 'left', // 'left' | 'right' | 'none'

      // Spacing
      xPadding: 2,
      yPadding: 2,
      roundRadius: 4,

      // Groups
      groups: null,
      mode: 'separate', // 'separate' | 'background'
      opacity: 0.3,
      groupYPadding: 5,

      // Color callback
      // colorFn(type, context) => string | null
      // type: 'bar' | 'point' | 'groupBar' | 'groupBackground'
      // context: { data, accessors } for 'bar'/'point', { node, mode } for group types
      colorFn: null,

      // Shape callback for points
      // shapeFn(type, context) => 'circle' | 'diamond' | 'triangle' | 'square' | 'star' | 'cross' | 'wye'
      // type: 'point'
      // context: { data, accessors }
      shapeFn: null,

      // Point options
      pointSizeRatio: 0.6,        // Point size relative to rowHeight (0-1)
      pointLabelPosition: 'none', // 'none' | 'right' | 'top'

      // Link options
      curve: 'curveBumpX',
      minLinkLength: 20,
      // linkStyleFn(link) => { stroke, strokeWidth, strokeDasharray, headStyle }
      // headStyle: 'arrow' | 'square' | 'circle' | 'diamond'
      linkStyleFn: null,

      visible: true,
      ...options
    };

    // State
    this.laneTree = null;
    this.currentData = null;
    this.currentAccessors = null;
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
   */
  create(chart) {
    const group = super.create(chart);

    // Bar renderer (for time range items)
    this.barRenderer = new BarRenderer({
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding,
      textPosition: 'center',
      colorFn: this.options.colorFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, d, event),
      onHover: (d, event) => this._onBarHover(d, event),
      onLeave: (d, event) => this._onBarLeave(d, event)
    });
    this.barRenderer.create(this.group);

    // Point renderer (for single time point items) - rendered above bars
    this.pointRenderer = new PointRenderer({
      sizeRatio: this.options.pointSizeRatio,
      labelPosition: this.options.pointLabelPosition,
      colorFn: this.options.colorFn,
      shapeFn: this.options.shapeFn,
      onClick: (d, event) => this.chart.dispatch.call('itemClick', this, d, event),
      onHover: (d, event) => this._onBarHover(d, event),
      onLeave: (d, event) => this._onBarLeave(d, event)
    });
    this.pointRenderer.create(this.group);

    // Link renderer (for single time link items) - rendered below bars
    this.linkRenderer = new LinkRenderer({
      curve: this.options.curve,
      styleFn: this.options.linkStyleFn,
      onHover: (link, event) => this._onLinkHover(link, event),
      onLeave: (link, event) => this._onLinkLeave(link, event)
    });
    this.linkRenderer.create(this.group);

    // Group bar renderer
    this.groupBarRenderer = new GroupBarRenderer({
      mode: this.options.mode,
      opacity: this.options.opacity,
      roundRadius: this.options.roundRadius,
      yPadding: this.options.yPadding,
      colorFn: this.options.colorFn
    });
    this.groupBarRenderer.create(this.group);

    // Label renderer
    this.labelRenderer = new LabelRenderer({
      position: this.options.labelPosition,
      width: this.options.labelWidth,
      padding: 6,
      onToggle: (node, expanded) => this._onGroupToggle(node, expanded)
    });
    if (this.chart.labelsGroup) {
      this.labelRenderer.create(this.chart.labelsGroup);
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
   */
  setLayerData(data, accessors = {}) {
    this.currentData = data;
    this.currentAccessors = {
      key: d => d.id,
      start: d => d.start,
      end: d => d.end,
      lane: d => d.lane || '',
      color: d => d.color,
      label: d => d.label || '',
      title: d => d.title || '',
      isPoint: () => false, // Default: all items are bars
      ...accessors
    };
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
      type: d => d.type || 'succession',
      ...accessors
    };
    this.enrichedLinks = null;
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
   * Handle bar hover
   */
  _onBarHover(data, event) {
    if (this.chart.tooltipManager && this.currentAccessors) {
      const title = this.currentAccessors.title
        ? this.currentAccessors.title(data)
        : `${data.label || data.name || ''}`;

      if (title) {
        const [x, y] = d3.pointer(event, this.chart.wrapper.node());
        this.chart.tooltipManager.showItemTooltip(title, x, y);
      }
    }

    this.chart.dispatch.call('itemHover', this, data, event);
  }

  /**
   * Handle bar leave
   */
  _onBarLeave() {
    if (this.chart.tooltipManager) {
      this.chart.tooltipManager.hideItemTooltip();
    }
  }

  /**
   * Handle link hover - highlight related items
   */
  _onLinkHover(link, event) {
    // Highlight related items using ItemHighlighter
    if (this.itemHighlighter) {
      this.itemHighlighter.highlight([link.startId, link.endId]);
    }

    // Show tooltip with link info
    if (this.chart.tooltipManager && link.label) {
      const [x, y] = d3.pointer(event, this.chart.wrapper.node());
      const tooltipContent = link.type
        ? `<strong>${link.label}</strong><br/><small>${link.type}</small>`
        : link.label;
      this.chart.tooltipManager.showItemTooltip(tooltipContent, x, y);
    }

    // Emit linkHover event
    this.chart.dispatch.call('linkHover', this, link, event);
  }

  /**
   * Handle link leave - clear highlights
   */
  _onLinkLeave() {
    // Clear item highlights
    if (this.itemHighlighter) {
      this.itemHighlighter.clear();
    }

    // Hide tooltip
    if (this.chart.tooltipManager) {
      this.chart.tooltipManager.hideItemTooltip();
    }
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
    if (this.options.groups && this.options.groups.length > 0) {
      this.laneTree = this._buildLaneTree(this.currentData, this.options.groups);
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
          //startPos,
          //endPos,
          //_original: link
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

    if (!this.enrichedData) {
      this._prepareData(xScale);
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
      this.labelRenderer.render(this.laneTree, this.options.rowHeight, {
        mode: this.options.mode
      });
    }

    this._prepareLinks(xScale);
    this.linkRenderer.render(this.enrichedLinks);
  }

  /**
   * Update group bar positions on zoom/pan
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    // Update bars
    this.barRenderer.update(xScale);

    // Update points
    this.pointRenderer.update(xScale);

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
   * Set rendering mode
   * @param {string} mode - 'separate' | 'background'
   */
  setMode(mode) {
    this.options.mode = mode;
  }

  /**
   * Get current mode
   * @returns {string} Current mode
   */
  getMode() {
    return this.options.mode;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear data references
    this.laneTree = null;
    this.currentData = null;
    this.currentAccessors = null;
    this.enrichedData = null;

    this.currentLinks = null;
    this.currentLinksAccessors = null;
    this.enrichedLinks = null;    

    super.destroy();
  }
}