/**
 * LabelRenderer - Render hierarchical labels with expand/collapse
 * Ported from GanttChart
 */
import * as d3 from 'd3';

// Style constants
const LABEL_STYLE = {
  BASE_FONT_SIZE: 13,
  MIN_FONT_SIZE: 8,
  LINE_HEIGHT: 16,
  DY_OFFSET: '0.35em',
  OPACITY_DECAY: 0.15,
  MIN_OPACITY: 0.4,
  BG_MIN_OPACITY: 0.6,
  ICON_SIZE: 10,
  ICON_HOVER_SIZE: 11
};

export class LabelRenderer {
  /**
   * @param {Object} options
   * @param {string} options.position - 'left' | 'right' | 'none'
   * @param {number} options.width - Label area width
   * @param {number} options.padding - Padding between label and icon
   * @param {Function} options.onToggle - Callback when group is toggled
   */
  constructor(options = {}) {
    this.position = options.position ?? 'left';
    this.width = options.width ?? 160;
    this.padding = options.padding ?? 6;
    this.onToggle = options.onToggle || (() => {});

    this.container = null;
  }

  /**
   * Create label container
   * @param {d3.Selection} container - SVG to append labels to
   */
  create(container) {
    this.container = container.append('g').classed('labels', true);
    return this.container;
  }

  /**
   * Render labels from lane tree
   * @param {LaneNode} laneTree - Root of lane tree
   * @param {number} rowHeight - Height of each row
   * @param {Object} options - Additional options
   */
  render(laneTree, rowHeight, options = {}) {
    if (!this.container || this.position === 'none') return;

    const { groupBarMode = 'separate' } = options;

    // Clear existing labels
    this.container.selectAll('*').remove();

    // Use different render strategies based on mode
    if (groupBarMode === 'background') {
      this._renderBackgroundModeLabels(laneTree, rowHeight);
    } else {
      this._renderSeparateModeLabels(laneTree, rowHeight);
    }
  }

  /**
   * Render labels for 'separate' mode
   * - Group bar labels with toggle icons on their own rows
   * - Leaf labels on item rows
   */
  _renderSeparateModeLabels(root, rowHeight) {
    const renderNode = (node) => {
      if (node.level < 0) {
        node.children.forEach(child => renderNode(child));
        return;
      }

      const hasChildren = node.children.length > 0;

      // Render group bar label (for nodes with children that have groupBarRow)
      if (hasChildren && node.groupBarRow >= 0) {
        this._renderGroupBarLabel(node, rowHeight);
      }

      // Render leaf label
      if (node.isLeaf()) {
        this._renderLeafLabel(node, rowHeight);
      }

      // Traverse children if expanded
      if (node.expanded && hasChildren) {
        node.children.forEach(child => renderNode(child));
      }
    };

    root.children.forEach(child => renderNode(child));
  }

  /**
   * Render labels for 'background' mode
   * - Vertically stacked path labels for groups
   * - Leaf labels on item rows
   */
  _renderBackgroundModeLabels(root, rowHeight) {
    const renderNode = (node) => {
      if (node.level < 0) {
        node.children.forEach(child => renderNode(child));
        return;
      }

      const hasChildren = node.children.length > 0;

      // In background mode, render parent group labels as vertically stacked path
      if (hasChildren) {
        // Check if this node or any ancestor has leaf children
        const hasLeafChildren = node.children.some(child => child.isLeaf());
        const shouldRenderLabel = (node.level === 0 && node.isCollapsed()) || hasLeafChildren;

        if (shouldRenderLabel) {
          this._renderBackgroundGroupLabels(node, rowHeight);
        }

        if (node.expanded) {
          node.children.forEach(child => renderNode(child));
        }
        return;
      }

      // Render leaf labels
      this._renderLeafLabel(node, rowHeight);
    };

    root.children.forEach(child => renderNode(child));
  }

  /**
   * Render a group bar label with toggle icon (for separate mode)
   */
  _renderGroupBarLabel(node, rowHeight) {
    const y = node.groupBarRow * rowHeight + rowHeight / 2;
    const isLeft = this.position === 'left';
    const anchor = isLeft ? 'end' : 'start';
    const style = this._getLabelStyle(node.level);
    const labelText = `${node.key} (${node.getAllItems().length})`;

    // Position icon near the edge, text further in
    const iconX = isLeft
      ? this.width - this.padding
      : this.padding;
    const textX = isLeft
      ? iconX - LABEL_STYLE.ICON_SIZE - this.padding
      : iconX + LABEL_STYLE.ICON_SIZE + this.padding;

    const g = this.container.append('g')
      .classed('group-bar-label-group', true)
      .attr('data-level', node.level)
      .attr('data-key', node.key);

    // Toggle icon
    this._createToggleIcon(g, node, iconX, y, LABEL_STYLE.BASE_FONT_SIZE);

    // Group name
    g.append('text')
      .classed('group-bar-name', true)
      .attr('x', textX)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .style('font-size', `${style.fontSize}px`)
      .style('font-weight', style.fontWeight)
      .style('fill', '#333')
      .style('opacity', style.opacity)
      .text(labelText);
  }

  /**
   * Render a leaf node label
   */
  _renderLeafLabel(node, rowHeight) {
    const y = (node.rowStart + node.rowEnd) / 2 * rowHeight + rowHeight / 2;
    const isLeft = this.position === 'left';
    const anchor = isLeft ? 'end' : 'start';
    const style = this._getLabelStyle(node.level);

    const x = isLeft
      ? this.width - this.padding
      : this.padding;

    const g = this.container.append('g')
      .classed('lane-label', true)
      .attr('data-level', node.level)
      .attr('data-key', node.key);

    g.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .style('font-size', `${style.fontSize}px`)
      .style('font-weight', style.fontWeight)
      .style('fill', '#333')
      .style('opacity', style.opacity)
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

    const isLeft = this.position === 'left';
    const anchor = isLeft ? 'end' : 'start';

    // In background mode, split label area into two halves:
    // - Icon near the center (half width)
    // - Text on the outer side
    const iconX = isLeft
      ? this.width / 2 + this.padding
      : this.width / 2 - this.padding;
    const textX = isLeft
      ? iconX - LABEL_STYLE.ICON_SIZE - this.padding
      : iconX + LABEL_STYLE.ICON_SIZE + this.padding;

    path.forEach((pathNode, index) => {
      const y = startY + index * LABEL_STYLE.LINE_HEIGHT;
      const style = this._getLabelStyle(pathNode.level, true);
      const labelText = `${pathNode.key} (${pathNode.getAllItems().length})`;

      const labelGroup = this.container.append('g')
        .classed('lane-label-group outer-group', true)
        .attr('data-level', pathNode.level)
        .attr('data-key', pathNode.key);

      // Toggle icon for non-leaf nodes
      if (!pathNode.isLeaf()) {
        this._createToggleIcon(labelGroup, pathNode, iconX, y, style.fontSize);
      }

      labelGroup.append('text')
        .classed('lane-label', true)
        .attr('x', textX)
        .attr('y', y)
        .attr('dy', LABEL_STYLE.DY_OFFSET)
        .attr('text-anchor', anchor)
        .style('font-size', `${style.fontSize}px`)
        .style('font-weight', style.fontWeight)
        .style('fill', '#333')
        .style('opacity', style.opacity)
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
  _createToggleIcon(g, node, x, y, fontSize) {
    const iconFontSize = Math.max(LABEL_STYLE.MIN_FONT_SIZE - 1, fontSize - 2);
    const hoverFontSize = Math.max(LABEL_STYLE.MIN_FONT_SIZE, fontSize - 1);
    const anchor = this.position === 'left' ? 'end' : 'start';
    const self = this;

    return g.append('text')
      .classed('lane-toggle-icon', true)
      .attr('x', x)
      .attr('y', y)
      .attr('dy', LABEL_STYLE.DY_OFFSET)
      .attr('text-anchor', anchor)
      .text(node.expanded ? '\u25BC' : '\u25B6') // ▼ or ▶
      .style('font-size', `${iconFontSize}px`)
      .style('cursor', 'pointer')
      .style('user-select', 'none')
      .style('pointer-events', 'all')
      .on('mouseenter', function() {
        d3.select(this).style('font-size', `${hoverFontSize}px`);
      })
      .on('mouseleave', function() {
        d3.select(this).style('font-size', `${iconFontSize}px`);
      })
      .on('click', function(event) {
        event.stopPropagation();
        node.toggle();
        self.onToggle(node, node.expanded);
      });
  }

  /**
   * Calculate label style based on level
   */
  _getLabelStyle(level, useBackgroundOpacity = false) {
    const minOpacity = useBackgroundOpacity ? LABEL_STYLE.BG_MIN_OPACITY : LABEL_STYLE.MIN_OPACITY;
    return {
      fontSize: Math.max(LABEL_STYLE.MIN_FONT_SIZE, LABEL_STYLE.BASE_FONT_SIZE - level),
      fontWeight: level === 0 ? 'bold' : 'normal',
      opacity: Math.max(minOpacity, 1 - level * LABEL_STYLE.OPACITY_DECAY)
    };
  }

  /**
   * Get width
   */
  getWidth() {
    return this.position === 'none' ? 0 : this.width;
  }

  /**
   * Update position setting
   */
  setPosition(position) {
    this.position = position;
  }
}
