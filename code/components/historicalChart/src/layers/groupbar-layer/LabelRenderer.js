/**
 * LabelRenderer - Render hierarchical labels with expand/collapse
 * Ported from GanttChart
 *
 * DOM Ownership: LabelRenderer creates and manages its own DOM structure:
 * - labelsContainer (div.hc-labels-container)
 * - labelsSvg (svg.hc-labels-svg)
 * - labelsGroup (g.labels)
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
   * @param {Function} options.onContainerCreated - Callback when container is created (for scroll sync)
   */
  constructor(options = {}) {
    this.options = {
      position: 'left',
      width: 160,
      padding: 6,
      onToggle: (() => {}),
      onContainerCreated: (() => {}),
      ...options,
    };

    // DOM elements (owned by this renderer)
    this.slot = null;           // External mounting point (not owned)
    this.labelsContainer = null; // div.hc-labels-container (owned)
    this.labelsSvg = null;       // svg.hc-labels-svg (owned)
    this.labelsGroup = null;     // g.labels (owned)
  }

  /**
   * Create label DOM structure in the given slot
   * @param {d3.Selection} slot - Mounting point (div) to create DOM inside
   */
  create(slot) {
    this.destroy();

    if (!slot) return null;

    this.slot = slot;

    // Create container (div) - owns scrolling behavior
    this.labelsContainer = this.slot.append('div')
      .classed('hc-labels-container', true)
      .style('width', '100%')
      .style('height', '100%')
      .style('overflow-y', 'auto')
      .style('overflow-x', 'hidden');

    // Create SVG
    this.labelsSvg = this.labelsContainer.append('svg')
      .classed('hc-labels-svg', true)
      .attr('width', this.options.width);

    // Create group for labels
    this.labelsGroup = this.labelsSvg.append('g').classed('labels', true);

    // Notify that container is created (for scroll sync registration)
    this.options.onContainerCreated(this.labelsContainer.node());

    return this.labelsGroup;
  }

  /**
   * Get the labels container element (for scroll sync)
   * @returns {HTMLElement|null}
   */
  getContainer() {
    return this.labelsContainer ? this.labelsContainer.node() : null;
  }

  /**
   * Update SVG height when content height changes
   * @param {number} height - New content height
   */
  updateContentHeight(height) {
    if (this.labelsSvg) {
      this.labelsSvg.attr('height', height);
    }
  }

  /**
   * Render labels from lane tree
   * @param {LaneNode} laneTree - Root of lane tree
   * @param {number} rowHeight - Height of each row
   * @param {string} mode - 'separate' | 'background'
   */
  render(laneTree, rowHeight, mode = 'separate') {
    if (!this.labelsGroup || this.options.position === 'none') return;

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

    const g = this.labelsGroup.append('g')
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

    const g = this.labelsGroup.append('g')
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

      const labelGroup = this.labelsGroup.append('g')
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
    if (this.labelsGroup) {
      this.labelsGroup.selectAll('*').remove();
    }
  }

  /**
   * Destroy all owned DOM elements
   */
  destroy() {
    // Clear group content
    if (this.labelsGroup) {
      this.labelsGroup.remove();
      this.labelsGroup = null;
    }

    // Remove container (this also removes svg and group)
    if (this.labelsContainer) {
      this.labelsContainer.remove();
      this.labelsContainer = null;
    }

    this.labelsSvg = null;
    this.slot = null;
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
