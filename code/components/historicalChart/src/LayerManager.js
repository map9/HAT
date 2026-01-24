/**
 * LayerManager - Manages visual layers and their z-order
 * Controls layer lifecycle, rendering order, and updates
 */
export class LayerManager {
  /**
   * Create LayerManager
   * @param {HistoricalChart} chart - historical chart
   */
  constructor(chart) {
    this.chart = chart
    this.layers = new Map(); // id -> { layer, zIndex }
    this.layerOrder = []; // ordered layer ids by zIndex
  }

  /**
   * Add a layer to the manager
   * @param {Layer} layer - Layer instance
   * @param {number} zIndex - Z-index for rendering order (lower = behind)
   * @param {Object} createOptions - Options to pass to layer.create()
   * @returns {Layer} The added layer
   */
  addLayer(layer, zIndex = 0, createOptions = {}) {
    // Create layer's SVG group with optional createOptions
    // createOptions allows passing dependencies like labelsSlot without tight coupling
    layer.create(this.chart, createOptions);

    // Store layer with zIndex
    this.layers.set(layer.id, { layer, zIndex });

    // Update rendering order
    this._updateLayerOrder();

    return layer;
  }

  /**
   * Remove a layer
   * @param {string} layerId - Layer ID to remove
   */
  removeLayer(layerId) {
    const item = this.layers.get(layerId);
    if (item) {
      item.layer.destroy();
      this.layers.delete(layerId);
      this._updateLayerOrder();
    }
  }

  /**
   * Get a layer by ID
   * @param {string} layerId - Layer ID
   * @returns {Layer|null} The layer instance or null
   */
  getLayer(layerId) {
    const item = this.layers.get(layerId);
    return item ? item.layer : null;
  }

  /**
   * Update z-index of a layer
   * @param {string} layerId - Layer ID
   * @param {number} zIndex - New z-index
   */
  setLayerZIndex(layerId, zIndex) {
    const item = this.layers.get(layerId);
    if (item) {
      item.zIndex = zIndex;
      this._updateLayerOrder();
    }
  }

  /**
   * Update layer order based on z-index
   * Reorders DOM elements to match z-index (SVG group order = visual z-order)
   * @private
   */
  _updateLayerOrder() {
    // Sort layers by zIndex (ascending)
    this.layerOrder = Array.from(this.layers.entries())
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
      .map(([id]) => id);

    const bodyGroupNode = this.chart.bodyGroup.node();

    // Ensure board stays at the bottom (for event capture)
    const board = this.chart.bodyGroup.select('.board');
    if (!board.empty()) {
      bodyGroupNode.insertBefore(board.node(), bodyGroupNode.firstChild);
    }

    // Reorder DOM nodes to match z-index
    // In SVG, later elements are rendered on top
    this.layerOrder.forEach(id => {
      const { layer } = this.layers.get(id);
      if (layer.group && layer.group.node()) {
        bodyGroupNode.appendChild(layer.group.node());
      }
    });
  }

  /**
   * calculate maximum layer content height
   * @param {d3.scaleUtc} xScale - timeline scale
   * @returns {number} maximum content height
   */
  calculateContentHeight(xScale) {
    let contentHeight = 0;
    this.layers.forEach(({ layer }) => {
      contentHeight = Math.max(contentHeight, layer.calculateContentHeight(xScale));
    });

    return contentHeight;
  }

  /**
   * Render all visible layers
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  render(xScale, bodyHeight, contentHeight) {
    if (!xScale) {
      console.warn('LayerManager.render: xScale is required');
      return;
    }
    this.layerOrder.forEach(id => {
      const { layer } = this.layers.get(id);
      if (layer.visible) {
        layer.render(xScale, bodyHeight, contentHeight);
      }
    });
  }

  /**
   * Update all visible layers (fast update on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  update(xScale, bodyHeight, contentHeight) {
    if (!xScale) {
      console.warn('LayerManager.update: xScale is required');
      return;
    }
    this.layerOrder.forEach(id => {
      const { layer } = this.layers.get(id);
      if (layer.visible) {
        layer.update(xScale, bodyHeight, contentHeight);
      }
    });
  }

  /**
   * Resize all layers
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.layers.forEach(({ layer }) => {
      layer.resize(width, height);
    });
  }

  /**
   * Clear all layers
   */
  clear() {
    this.layers.forEach(({ layer }) => {
      if (layer.group) {
        layer.group.selectAll('*').remove();
      }
    });
  }

  /**
   * Destroy all layers
   */
  destroy() {
    this.layers.forEach(({ layer }) => {
      layer.destroy();
    });
    this.layers.clear();
    this.layerOrder = [];
  }

  /**
   * Get all layer IDs in rendering order
   * @returns {Array<string>} Ordered layer IDs
   */
  getLayerOrder() {
    return [...this.layerOrder];
  }

  /**
   * Update options for all layers
   * @param {Object} options - Options to propagate to layers
   * @param {boolean} [skipRender=true] - Skip re-render (default true, let caller control render)
   * @returns {boolean} Whether any layer needs re-render
   */
  setOptions(options, skipRender = true) {
    let needsRender = false;

    this.layers.forEach(({ layer }) => {
      if (typeof layer.setOptions === 'function') {
        const layerNeedsRender = layer.setOptions(options, skipRender);
        needsRender = layerNeedsRender || needsRender;
      }
    });

    return needsRender;
  }

  /**
   * Update content height for all layers (notifies layers that manage their own SVG heights)
   * @param {number} contentHeight - New content height
   */
  updateContentHeight(contentHeight) {
    this.layers.forEach(({ layer }) => {
      if (typeof layer.updateContentHeight === 'function') {
        layer.updateContentHeight(contentHeight);
      }
    });
  }

}