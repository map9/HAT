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
      visible: true,
      ...options
    };

    this.axises = options.axises || [];
    this.locale = options.locale || 'en-us';
    this.gap = options.gap ?? 1;

    // Calculate axis height
    this.axisManager = new AxisManager({
      axises: this.axises,
      locale: this.locale,
      gap: this.gap,
      type: 'grid'
    });
  }

  /**
   * Render layer
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} bodyHeight - Height of body area
   * @param {number} contentHeight - Height of content
   */
  render(xScale, bodyHeight, contentHeight) {
    if (!this.group) return;

    this.axisManager.create(this.group);
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

}