/**
 * ToolbarManager - Auto-hide toolbar with zoom/pan/toggle controls
 * Shows on mouse proximity to chart top edge, hides when mouse leaves.
 */
import * as d3 from 'd3';

const PROXIMITY_THRESHOLD = 50; // px from top edge to trigger toolbar
const HIDE_DELAY = 400;         // ms delay before hiding toolbar

export class ToolbarManager {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.proximityTarget - Element to track mouse proximity on
   */
  constructor(options = {}) {
    this.options = { ...options };

    this.dispatch = d3.dispatch(
      'zoomIn', 'zoomOut', 'resetZoom',
      'panLeft', 'panRight',
      'expandAll', 'collapseAll',
      'toggleInfo', 'toggleSettings'
    );

    // State
    this.visible = false;
    this.infoPanelActive = true;
    this.settingsPanelActive = false;

    // DOM
    this.slot = null;
    this.toolbar = null;

    // Timer
    this._hideTimer = null;

    // Bound handlers for cleanup
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseLeave = this._handleMouseLeave.bind(this);
  }

  /**
   * Create toolbar DOM inside slot
   * @param {d3.Selection} slot - Slot element to mount into
   */
  create(slot) {
    this.slot = slot;

    // Toolbar zone - positioned absolutely at top
    this.zone = slot.append('div')
      .classed('hcp-toolbar-zone', true);

    this.toolbar = this.zone.append('div')
      .classed('hcp-toolbar', true);

    // Left group: zoom/pan controls
    const leftGroup = this.toolbar.append('div')
      .classed('hcp-toolbar-group', true);

    this._addButton(leftGroup, 'zoomIn', '+', 'Zoom In');
    this._addButton(leftGroup, 'zoomOut', '−', 'Zoom Out');
    this._addButton(leftGroup, 'resetZoom', '↺', 'Reset Zoom');

    leftGroup.append('div').classed('hcp-toolbar-separator', true);

    this._addButton(leftGroup, 'panLeft', '←', 'Pan Left');
    this._addButton(leftGroup, 'panRight', '→', 'Pan Right');

    leftGroup.append('div').classed('hcp-toolbar-separator', true);

    this._addButton(leftGroup, 'expandAll', '⇊', 'Expand All');
    this._addButton(leftGroup, 'collapseAll', '⇈', 'Collapse All');

    // Right group: toggle buttons
    const rightGroup = this.toolbar.append('div')
      .classed('hcp-toolbar-group', true);

    this.infoPanelBtn = this._addToggleButton(rightGroup, 'toggleInfo', 'ℹ', 'Info Panel', this.infoPanelActive);
    this.settingsBtn = this._addToggleButton(rightGroup, 'toggleSettings', '⚙', 'Settings', this.settingsPanelActive);
  }

  /**
   * Setup auto-show/hide on mouse proximity
   * @param {HTMLElement} target - Element to detect proximity on
   */
  setupProximity(target) {
    this._proximityTarget = target;
    target.addEventListener('mousemove', this._onMouseMove);
    target.addEventListener('mouseleave', this._onMouseLeave);
  }

  _handleMouseMove(event) {
    const rect = this._proximityTarget.getBoundingClientRect();
    const distFromTop = event.clientY - rect.top;

    if (distFromTop < PROXIMITY_THRESHOLD) {
      this._show();
    } else if (this.visible && !this._isMouseOverToolbar(event)) {
      this._scheduleHide();
    }
  }

  _handleMouseLeave() {
    this._scheduleHide();
  }

  _isMouseOverToolbar(event) {
    if (!this.toolbar) return false;
    const rect = this.toolbar.node().getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  _show() {
    clearTimeout(this._hideTimer);
    if (!this.visible) {
      this.visible = true;
      this.toolbar.classed('visible', true);
    }
  }

  _scheduleHide() {
    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => {
      this.visible = false;
      this.toolbar.classed('visible', false);
    }, HIDE_DELAY);
  }

  _addButton(parent, action, icon, title) {
    parent.append('button')
      .classed('hcp-toolbar-btn', true)
      .attr('title', title)
      .html(`<span class="btn-icon">${icon}</span>`)
      .on('click', () => this.dispatch.call(action, this));
  }

  _addToggleButton(parent, action, icon, title, active) {
    const btn = parent.append('button')
      .classed('hcp-toolbar-btn', true)
      .classed('active', active)
      .attr('title', title)
      .html(`<span class="btn-icon">${icon}</span>`)
      .on('click', () => {
        this.dispatch.call(action, this);
      });
    return btn;
  }

  /**
   * Update toggle button active state
   */
  setInfoPanelActive(active) {
    this.infoPanelActive = active;
    if (this.infoPanelBtn) {
      this.infoPanelBtn.classed('active', active);
    }
  }

  setSettingsPanelActive(active) {
    this.settingsPanelActive = active;
    if (this.settingsBtn) {
      this.settingsBtn.classed('active', active);
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    this.dispatch.on(event, callback);
    return this;
  }

  destroy() {
    clearTimeout(this._hideTimer);
    if (this._proximityTarget) {
      this._proximityTarget.removeEventListener('mousemove', this._onMouseMove);
      this._proximityTarget.removeEventListener('mouseleave', this._onMouseLeave);
      this._proximityTarget = null;
    }
    if (this.zone) {
      this.zone.remove();
      this.zone = null;
    }
    this.toolbar = null;
    this.slot = null;
  }
}
