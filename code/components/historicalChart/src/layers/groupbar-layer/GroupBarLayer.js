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
      // type: 'bar' | 'groupBar' | 'groupBackground'
      // context: { data, accessors } for 'bar', { node, mode } for group types
      colorFn: null,

      visible: true,
      ...options
    };

    // State
    this.laneTree = null;
    this.currentData = null;
    this.currentAccessors = null;
    this.enrichedData = null;

    // Managers
    this.barRenderer = null;
    this.groupBarRenderer = null;
    this.labelRenderer = null;
  }

  /**
   * Create layer's SVG group
   * @param {HistoricalChart} chart - historical chart
   */
  create(chart) {
    const group = super.create(chart);

    // Bar renderer
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

    return group;
  }

  /**
   * set layer data
   * @param {Array} data - Array of data items
   * @param {Object} accessors - Data accessors
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
      ...accessors
    };
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
        this.chart.tooltipManager.showEventTooltip(title, x, y);
      }
    }

    this.chart.dispatch.call('itemHover', this, data, event);
  }

  /**
   * Handle bar leave
   */
  _onBarLeave(data, event) {
    if (this.chart.tooltipManager) {
      this.chart.tooltipManager.hideEventTooltip();
    }
  }

  /**
   * calculate layer content height
   * @param {d3.scaleUtc} xScale - timeline scale
   * @returns {number} content height
   */
  calculateContentHeight(xScale) {
    // Calculate content height
    if (!this.enrichedData) {
      this._prepareData(xScale);
    }

    const maxRow = getMaxRow(this.enrichedData);
    const contentHeight = (maxRow + 1) * this.options.rowHeight;

    return contentHeight;
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

  /**
   * Render group bars from lane tree
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  render(xScale, bodyHeight, contentHeight) {
    if (!this.currentData || !this.currentAccessors)
      return;

    if (!this.enrichedData) {
      this._prepareData(xScale);
    }

    // Render bars
    if (this.enrichedData) {
      this.barRenderer.render(this.enrichedData, xScale, this.options.rowHeight, this.currentAccessors);
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
  }

  /**
   * Update group bar positions on zoom/pan
   * Note: Group bars need full re-render due to their dependency on tree structure
   * This is called from the update cycle but currently does nothing
   * @param {d3.ScaleTime} xScale - New time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  update(xScale, bodyHeight, contentHeight) {
    // Update bars
    this.barRenderer.update(xScale);

    // Update group bars (need full redraw for proper positioning)
    if (this.laneTree && this.currentAccessors) {
      this.groupBarRenderer.render(this.laneTree, xScale, this.options.rowHeight, this.currentAccessors);
    }
  }

  /**
   * Resize layer ???
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    // Re-render if data exists
    //if (this.currentData) {
    //  this._renderData();
    //}

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
}