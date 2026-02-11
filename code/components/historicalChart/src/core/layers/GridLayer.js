/**
 * GridLayer - Time Grid Layer
 */
import * as d3 from 'd3';
import { Layer } from './Layer.js';
import { AxisManager } from '../AxisManager.js';

export class GridLayer extends Layer {
  /**
   * @param {string} id - Layer ID
   * @param {Object} options
   * @param {Array} options.axises - Array of axis configurations
   * @param {string} options.locale - Locale for date formatting
   * @param {number} options.gap - Gap between elements
   * @param {boolean} options.visible - Initial visibility
   */
  constructor(id = 'grid', options = {}) {
    super(id, options);

    // Set defaults
    this.options = {
      axises: [],
      locale: 'en-us',
      gap: 1,
      ...options
    };

    // Calculate axis height
    this.axisManager = new AxisManager({
      axises: this.options.axises,
      locale: this.options.locale,
      gap: this.options.gap,
      type: 'grid'
    });
  }

  /**
   * Create layer's SVG group
   * @param {HistoricalChart} chart - historical chart
   */
  create(chart) {
    const group = super.create(chart);
    this.axisManager.create(group);
  }

  /**
   * Render layer
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  render(xScale, bodyHeight, contentHeight) {
    if (!this.group) return;

    this.axisManager.update(xScale, contentHeight);
  }

  /**
   * Update bar positions on zoom/pan (fast update)
   * @param {d3.ScaleTime} xScale - New time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  update(xScale, bodyHeight, contentHeight) {
    this.axisManager.update(xScale, contentHeight);
  }

  destroy() {
    this.axisManager.destroy();
    super.destroy();
  }

  /**
   * Update layer options with smart cache invalidation
   * Override from Layer base class
   * @param {Object} options - New options to merge
   * @param {boolean} [skipRender=false] - Skip re-render
   */
  setOptions(options, skipRender = false) {
    this.axisManager.setOptions(options);
    super.setOptions(options, skipRender);
  }

}