/**
 * InfoPanelManager - Bottom status bar showing chart info
 * Displays data count, visible domain, zoom level.
 */
import * as d3 from 'd3';

export class InfoPanelManager {
  constructor(options = {}) {
    this.options = { ...options };

    // State
    this.visible = true;

    // DOM references
    this.slot = null;
    this.panel = null;
    this._values = {};
  }

  /**
   * Create info panel DOM inside slot
   * @param {d3.Selection} slot - Slot element to mount into
   */
  create(slot) {
    this.slot = slot;

    this.panel = slot.append('div')
      .classed('hcp-info-panel', true);

    this._values.dataCount = this._addInfoItem(this.panel, 'Data:', '0');
    this._values.domain = this._addInfoItem(this.panel, 'Range:', '-');
    this._values.zoom = this._addInfoItem(this.panel, 'Zoom:', '-');
  }

  _addInfoItem(parent, label, defaultValue) {
    const item = parent.append('div')
      .classed('hcp-info-item', true);

    item.append('span')
      .classed('hcp-info-label', true)
      .text(label);

    const value = item.append('span')
      .classed('hcp-info-value', true)
      .text(defaultValue);

    return value;
  }

  /**
   * Update displayed info values
   * @param {Object} info
   * @param {number} [info.dataCount]
   * @param {Array<Date>} [info.domain]
   * @param {number} [info.zoom] - pixels per hour
   */
  updateInfo(info) {
    if (info.dataCount !== undefined) {
      this._values.dataCount.text(info.dataCount);
    }
    if (info.domain) {
      this._values.domain.text(
        `${info.domain[0].getFullYear()} - ${info.domain[1].getFullYear()}`
      );
    }
    if (info.zoom !== undefined) {
      this._values.zoom.text(info.zoom.toFixed(4));
    }
  }

  /**
   * Set data count separately (convenience)
   */
  setDataCount(count) {
    this._values.dataCount.text(count);
  }

  /**
   * Toggle visibility
   */
  setVisible(visible) {
    this.visible = visible;
    this.panel.classed('hidden', !visible);
  }

  isVisible() {
    return this.visible;
  }

  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this._values = {};
    this.slot = null;
  }
}
