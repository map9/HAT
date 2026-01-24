/**
 * Layer - Base class for all visual layers
 * Provides lifecycle methods and unified interface
 */
export class Layer {
  /**
   * @param {string} id - Unique layer identifier
   * @param {Object} options - Layer-specific options
   */
  constructor(id, options = {}) {
    this.id = id;
    this.options = options;

    this.group = null; // SVG group element
    this.chart = null;
    this.visible = true;
  }

  /**
   * Create layer's SVG group
   * @param {HistoricalChart} chart - historical chart
   */
  create(chart) {
    this.chart = chart;

    this.destroy();
    this.group = this.chart.bodyGroup.append('g')
      .classed(`layer-${this.id}`, true)
      .attr('visibility', this.visible ? 'visible' : 'hidden');

    return this.group;
  }

  /**
   * calculate layer content height
   * @param {d3.scaleUtc} xScale - timeline scale
   * @returns {number} content height
   */
  calculateContentHeight(xScale) {
    // Override in subclass
    return 0;
  }

  /**
   * Render layer
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  render(xScale, bodyHeight, contentHeight) {
    // Override in subclass
  }

  /**
   * Update layer on zoom/pan (fast update without full re-render)
   * @param {d3.ScaleTime} xScale - New time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  update(xScale, bodyHeight, contentHeight) {
    // Override in subclass
  }

  /**
   * Resize layer
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    // Override in subclass
  }

  /**
   * Show layer
   */
  show() {
    this.visible = true;
    if (this.group) {
      this.group.attr('visibility', 'visible');
    }
  }

  /**
   * Hide layer
   */
  hide() {
    this.visible = false;
    if (this.group) {
      this.group.attr('visibility', 'hidden');
    }
  }

  /**
   * Clear all layers
   */
  clear() {
    if (this.group) {
      this.group.selectAll('*').remove();
    }
  }

  /**
   * Destroy layer and cleanup resources
   */
  destroy() {
    if (this.group) {
      this.group.remove();
      this.group = null;
    }
  }

  /**
   * Update layer options and trigger re-render if attached to chart
   * @param {Object} options - New options to merge
   * @param {boolean} [skipRender=false] - Skip re-render (useful when batch updating)
   * @return {boolean} 是否需要手动渲染
   * - false: 不需要重新渲染
   * - true: 需要
   */
  setOptions(options, skipRender = false) {
    this.options = { ...this.options, ...options };

    // Trigger re-render if layer is attached to chart and visible
    if (!skipRender && this.chart && this.visible) {
      this._triggerRender();
      return false;
    }

    return true;
  }

  /**
   * Trigger a re-render of this layer
   * Subclasses can override for custom behavior
   * @protected
   */
  _triggerRender() {
    if (!this.chart || !this.chart.isCreated()) return;

    const xScale = this.chart.getScale();
    const bodyHeight = this.chart.getContentHeight();
    const contentHeight = this.chart.getContentHeight() || bodyHeight;

    this.render(xScale, bodyHeight, contentHeight);
  }
}