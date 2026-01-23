/**
 * LabelRenderer - Render hierarchical labels with expand/collapse
 * Ported from GanttChart
 */
import * as d3 from 'd3';

// Style constants
const LABEL_STYLE = {
  LINE_HEIGHT: 16,
  DY_OFFSET: '0.35em',
  ICON_SIZE: 10,
};

export class LabelRenderer {
  /**
   * @param {Object} options
   * @param {string} options.position - 'left' | 'right' | 'none'
   * @param {number} options.width - Label area width
   * @param {number} options.padding - Padding between label and left or right edge
   * @param {Function} options.onToggle - Callback when group is toggled
   */
  constructor(options = {}) {
    this.options = {
      position: 'left',
      width: 160,
      padding: 6,
      onToggle: (() => {}),
      ...options,
    };

    this.container = null;
  }

  /**
   * Create label container
   * @param {d3.Selection} container - SVG to append labels to
   */
  create(container) {
    this.destroy();
    
    this.container = container.append('g').classed('labels', true);
    return this.container;
  }

  /**
   * Render labels from lane tree
   * @param {LaneNode} laneTree - Root of lane tree
   * @param {number} rowHeight - Height of each row
   * @param {string} mode - 'separate' | 'background'
   */
  render(laneTree, rowHeight, mode = 'separate') {
    if (!this.container || this.options.position === 'none') return;

    // Clear existing labels
    this.clear();

    // Use different render strategies based on mode
    if (mode === 'background') {
      this._renderBackgroundModeLabels(laneTree, rowHeight);
    } else {
      this._renderSeparateModeLabels(laneTree, rowHeight);
    }
  }

  /**
   * Traverse lane tree and call visitor for each node
   * @param {LaneNode} root - Root node
   * @param {Function} visitor - Callback (node) => shouldTraverseChildren
   * @private
   */
  _traverseTree(root, visitor) {
    const traverse = (node) => {
      if (node.level < 0) {
        node.children.forEach(child => traverse(child));
        return;
      }

      const shouldTraverseChildren = visitor(node);
      if (shouldTraverseChildren && node.expanded) {
        node.children.forEach(child => traverse(child));
      }
    };

    root.children.forEach(child => traverse(child));
  }

  _getNodeLabelClass(node) {
    return `level-${node.level > 3 ? 3 : node.level}`;
  }

  /**
   * Render labels for 'separate' mode
   * - Group bar labels with toggle icons on their own rows
   * - Leaf labels on item rows
   */
  _renderSeparateModeLabels(root, rowHeight) {
    this._traverseTree(root, (node) => {
      const hasChildren = node.children.length > 0;

      if (hasChildren && node.groupBarRow >= 0) {
        this._renderGroupBarLabel(node, rowHeight);
      }

      if (node.isLeaf()) {
        this._renderLeafLabel(node, rowHeight);
      }

      return hasChildren;
    });
  }

  /**
   * Render labels for 'background' mode
   * - Vertically stacked path labels for groups
   * - Leaf labels on item rows
   */
  _renderBackgroundModeLabels(root, rowHeight) {
    this._traverseTree(root, (node) => {
      const hasChildren = node.children.length > 0;

      if (hasChildren) {
        const hasLeafChildren = node.children.some(child => child.isLeaf());
        const shouldRenderLabel = (node.level === 0 && node.isCollapsed()) || hasLeafChildren;

        if (shouldRenderLabel) {
          this._renderBackgroundGroupLabels(node, rowHeight);
        }
        return true;
      }

      this._renderLeafLabel(node, rowHeight);
      return false;
    });
  }

  /**
   * Render a group bar label with toggle icon (for separate mode)
   */
  _renderGroupBarLabel(node, rowHeight) {
    const y = node.groupBarRow * rowHeight + rowHeight / 2;
    const isLeft = this.options.position === 'left';
    const anchor = isLeft ? 'end' : 'start';
    const labelText = `${node.key} (${node.getAllItems().length})`;

    // Position icon near the edge, text further in
    const iconX = isLeft
      ? this.options.width - this.options.padding
      : this.options.padding;
    const textX = isLeft
      ? iconX - LABEL_STYLE.ICON_SIZE - this.options.padding
      : iconX + LABEL_STYLE.ICON_SIZE + this.options.padding;

    const g = this.container.append('g')
      .classed('group-item-labels', true)
      .attr('data-level', node.level)
      .attr('data-key', node.key);

    // Toggle icon
    this._createToggleIcon(g, node, iconX, y);

    // Group name
    g.append('text')
      .classed(`group-item-label ${this._getNodeLabelClass(node)}`, true)
      .attr('x', textX)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .text(labelText);
  }

  /**
   * Render a leaf node label
   */
  _renderLeafLabel(node, rowHeight) {
    const y = (node.rowStart + node.rowEnd) / 2 * rowHeight + rowHeight / 2;
    const isLeft = this.options.position === 'left';
    const anchor = isLeft ? 'end' : 'start';

    const x = isLeft
      ? this.options.width - this.options.padding
      : this.options.padding;

    const g = this.container.append('g')
      .classed(`item-label ${this._getNodeLabelClass(node)}`, true)
      .attr('data-level', node.level)
      .attr('data-key', node.key);

    g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .text(node.key);
  }

  /**
   * Render background mode group labels (vertically stacked path)
   * Like GanttChart's renderBackgroundGroupLabelsUnified
   */
  _renderBackgroundGroupLabels(node, rowHeight) {
    const path = this._getNodePath(node);
    if (path.length === 0) return;

    const centerY = (node.rowStart + node.rowEnd) / 2 * rowHeight + rowHeight / 2;
    const totalHeight = path.length * LABEL_STYLE.LINE_HEIGHT;
    const startY = centerY - totalHeight / 2 + LABEL_STYLE.LINE_HEIGHT / 2;

    const isLeft = this.options.position === 'left';
    const anchor = isLeft ? 'end' : 'start';

    // In background mode, split label area into two halves:
    // - Icon near the center (half width)
    // - Text on the outer side
    const iconX = isLeft
      ? this.options.width / 2 + this.options.padding
      : this.options.width / 2 - this.options.padding;
    const textX = isLeft
      ? iconX - LABEL_STYLE.ICON_SIZE - this.options.padding
      : iconX + LABEL_STYLE.ICON_SIZE + this.options.padding;

    path.forEach((pathNode, index) => {
      const y = startY + index * LABEL_STYLE.LINE_HEIGHT;
      const labelText = `${pathNode.key} (${pathNode.getAllItems().length})`;

      const labelGroup = this.container.append('g')
        .classed('group-item-labels outer-group', true)
        .attr('data-level', pathNode.level)
        .attr('data-key', pathNode.key);

      // Toggle icon for non-leaf nodes
      if (!pathNode.isLeaf()) {
        this._createToggleIcon(labelGroup, pathNode, iconX, y);
      }

      labelGroup.append('text')
        .classed(`group-item-label ${this._getNodeLabelClass(node)}`, true)
        .attr('x', textX)
        .attr('y', y)
        .attr('dy', LABEL_STYLE.DY_OFFSET)
        .attr('text-anchor', anchor)
        .text(labelText);
    });
  }

  /**
   * Get path from root to node (excluding root)
   */
  _getNodePath(node) {
    const path = [];
    let current = node;
    while (current && current.level >= 0) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  /**
   * Create toggle icon with hover effects
   */
  _createToggleIcon(g, node, x, y) {
    const anchor = this.options.position === 'left' ? 'end' : 'start';
    const self = this;

    return g.append('text')
      .classed(`group-item-toggle-icon ${this._getNodeLabelClass(node)}`, true)
      .attr('x', x)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .text(node.expanded ? '\u25BC' : '\u25B6') // ▼ or ▶
      .style('cursor', 'pointer')
      .style('user-select', 'none')
      .style('pointer-events', 'all')
      .on('click', function(event) {
        event.stopPropagation();
        node.toggle();
        self.options.onToggle(node, node.expanded);
      });
  }

  /**
   * Clear all labels
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }
  
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Update render options by GroupBarLayer
   * @param {Object} options - New options to merge
   * @returns {boolean} Whether re-render is needed
   */
  setOptions(options) {
    // Detect which options actually changed
    const renderTriggerKeys = ['position', 'width', 'padding'];
    const needsRender = renderTriggerKeys.some(
      key => options[key] !== undefined && options[key] !== this.options[key]
    );

    Object.assign(this.options, options);
    return needsRender;
  }

}
