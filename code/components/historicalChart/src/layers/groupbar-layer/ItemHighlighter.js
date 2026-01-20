/**
 * ItemHighlighter - Item highlighting utility for GroupBarLayer
 * Manages opacity changes to highlight specific items
 */
export class ItemHighlighter {
  /**
   * @param {d3.Selection} container - SVG group container
   * @param {Object} options - Highlighter options
   * @param {number} options.dimOpacity - Opacity for non-highlighted items (0-1)
   */
  constructor(container, options = {}) {
    this.container = container;
    this.dimOpacity = options.dimOpacity ?? 0.3;
    this.activeIds = new Set();
  }

  /**
   * Highlight items by IDs - dims all other items
   * @param {Array<string>} ids - Item IDs to highlight
   */
  highlight(ids) {
    this.activeIds = new Set(ids);
    this._updateOpacity();
  }

  /**
   * Clear all highlights - restore normal opacity
   */
  clear() {
    this.activeIds.clear();
    this._updateOpacity();
  }

  /**
   * Check if highlighting is active
   * @returns {boolean}
   */
  isActive() {
    return this.activeIds.size > 0;
  }

  /**
   * Get currently highlighted IDs
   * @returns {Array<string>}
   */
  getHighlightedIds() {
    return Array.from(this.activeIds);
  }

  _updateOpacity() {
    const hasActive = this.activeIds.size > 0;
    const dimOpacity = this.dimOpacity;
    const activeIds = this.activeIds;

    // Update bar items
    this.container.selectAll('.item')
      .style('opacity', function(d) {
        if (!hasActive) return null;
        const id = d?.id ?? d?.key;
        return activeIds.has(id) ? 1 : dimOpacity;
      });

    // Update point items
    this.container.selectAll('.point-item')
      .style('opacity', function(d) {
        if (!hasActive) return null;
        const id = d?.id ?? d?.key;
        return activeIds.has(id) ? 1 : dimOpacity;
      });

    // Update group items (group bars)
    this.container.selectAll('.group-item')
      .style('opacity', function() {
        if (!hasActive) return null;
        return dimOpacity;
      });

    // Update link items - highlight links that connect to activeIds
    this.container.selectAll('.link-group')
      .style('opacity', function(d) {
        if (!hasActive) return null;
        // Link is highlighted if both startId and endId are in activeIds
        const isHighlighted = activeIds.has(d?.startId) && activeIds.has(d?.endId);
        return isHighlighted ? 1 : dimOpacity;
      });
  }

  /**
   * Set dim opacity
   * @param {number} opacity - New opacity value (0-1)
   */
  setDimOpacity(opacity) {
    this.dimOpacity = opacity;
    if (this.activeIds.size > 0) {
      this._updateOpacity();
    }
  }
}
