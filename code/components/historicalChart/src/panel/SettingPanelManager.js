/**
 * SettingPanelManager - Right overlay drawer for chart display settings
 * Contains: axis config, layout config, style config, layer layout config, groupbar mode.
 * Slides in from right with backdrop.
 */
import * as d3 from 'd3';

export class SettingPanelManager {
  /**
   * @param {Object} options
   * @param {Object} options.settings - Initial setting values
   * @param {Array} options.axisTypeOptions - Available axis types [{value, label}]
   * @param {Array} options.accentSchemeOptions - Available accent schemes
   * @param {Array} options.localeOptions - Available locales [{value, label}]
   */
  constructor(options = {}) {
    this.options = { ...options };

    this.dispatch = d3.dispatch('settingChange');

    // State
    this._open = false;
    this._settings = {
      // Axis config
      axisType: 'western',
      startYear: 1850,
      endYear: 2020,
      zoomMin: -1,
      zoomMax: -1,
      hasIndexAxis: true,
      indexAxisHeight: 28,
      // Layout config
      labelWidth: 240,
      labelPosition: 'left',
      labelXPadding: 6,
      roundRadius: 4,
      // Style config
      theme: 'light',
      accentScheme: 'default',
      locale: 'zh-cn',
      hasActiveAxis: true,
      hasTooltip: true,
      // Layer layout config
      rowHeight: 25,
      xPadding: 2,
      yPadding: 2,
      // GroupBar mode
      groupBarMode: 'separate',
      groupYPadding: 5,
      ...(options.settings || {})
    };

    // DOM
    this.slot = null;
    this.overlay = null;
    this._controls = {};

    // Bound handler
    this._onKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * Create setting panel DOM inside slot
   * @param {d3.Selection} slot
   */
  create(slot) {
    this.slot = slot;

    this.overlay = slot.append('div')
      .classed('hcp-setting-overlay', true);

    // Backdrop
    this.overlay.append('div')
      .classed('hcp-setting-backdrop', true)
      .on('click', () => this.setVisible(false));

    // Panel
    const panel = this.overlay.append('div')
      .classed('hcp-setting-panel', true);

    // Header
    const header = panel.append('div')
      .classed('hcp-setting-header', true);

    header.append('h3')
      .classed('hcp-setting-title', true)
      .text('Settings');

    header.append('button')
      .classed('hcp-setting-close', true)
      .text('×')
      .on('click', () => this.setVisible(false));

    // Content
    const content = panel.append('div')
      .classed('hcp-setting-content', true);

    this._buildAxisSection(content);
    this._buildLayoutSection(content);
    this._buildStyleSection(content);
    this._buildLayerLayoutSection(content);
    this._buildGroupBarSection(content);

    // Keyboard handler
    document.addEventListener('keydown', this._onKeyDown);
  }

  // ==================== Section Builders ====================

  _buildAxisSection(content) {
    const section = this._createSection(content, '📅 Axis');

    const axisTypes = this.options.axisTypeOptions || [
      { value: 'western', label: 'Western (Gregorian)' },
      { value: 'lunar', label: 'Lunar (1-9999 CE)' },
      { value: 'chinese', label: 'Chinese Calendar (722 BCE-2200 CE)' },
      { value: 'dual', label: 'Dual (Western + Lunar)' },
    ];

    this._addSelect(section, 'axisType', 'Axis Type', axisTypes);

    const yearRow = section.append('div').classed('hcp-control-row', true);
    this._addNumber(yearRow, 'startYear', 'Start Year', { min: -722, max: 2200 });
    this._addNumber(yearRow, 'endYear', 'End Year', { min: -722, max: 2200 });

    const zoomRow = section.append('div').classed('hcp-control-row', true);
    this._addNumber(zoomRow, 'zoomMin', 'Min Zoom', { min: -1, step: 0.001 });
    this._addNumber(zoomRow, 'zoomMax', 'Max Zoom', { min: -1, step: 0.001 });

    const indexRow = section.append('div').classed('hcp-control-row', true);
    this._addSelect(indexRow, 'hasIndexAxis', 'Index Axis', [
      { value: 'true', label: 'Show' },
      { value: 'false', label: 'Hide' },
    ]);
    this._addRange(indexRow, 'indexAxisHeight', 'Height', { min: 18, max: 40, step: 2, unit: 'px' });
  }

  _buildLayoutSection(content) {
    const section = this._createSection(content, '📐 Layout');

    this._addRange(section, 'labelWidth', 'Label Width', { min: 80, max: 300, step: 10, unit: 'px' });

    const posRow = section.append('div').classed('hcp-control-row', true);
    this._addSelect(posRow, 'labelPosition', 'Label Position', [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'none', label: 'None' },
    ]);
    this._addRange(posRow, 'labelXPadding', 'Label Padding', { min: 0, max: 20, step: 1 });

    this._addRange(section, 'roundRadius', 'Round Radius', { min: 0, max: 15, step: 1, unit: 'px' });
  }

  _buildStyleSection(content) {
    const section = this._createSection(content, '🎨 Style');

    const themeRow = section.append('div').classed('hcp-control-row', true);
    this._addSelect(themeRow, 'theme', 'Theme', [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ]);

    const accentSchemes = (this.options.accentSchemeOptions || []).map(s => ({ value: s, label: s }));
    accentSchemes.unshift({ value: 'default', label: 'Default' });
    this._addSelect(themeRow, 'accentScheme', 'Accent', accentSchemes);

    const locales = this.options.localeOptions || [
      { value: 'zh-cn', label: '中文' },
      { value: 'en-us', label: 'English' },
      { value: 'ja-jp', label: '日本語' },
    ];
    this._addSelect(section, 'locale', 'Locale', locales);

    // Feature toggles
    const toggleGroup = section.append('div').classed('hcp-control-group', true);
    toggleGroup.append('label').classed('hcp-control-label', true).text('Features');

    this._addToggle(toggleGroup, 'hasActiveAxis', 'ActiveAxis');
    this._addToggle(toggleGroup, 'hasTooltip', 'Tooltip');
  }

  _buildLayerLayoutSection(content) {
    const section = this._createSection(content, '📐 Layer Layout');

    this._addRange(section, 'rowHeight', 'Row Height', { min: 15, max: 50, step: 1, unit: 'px' });

    const spacingRow = section.append('div').classed('hcp-control-row', true);
    this._addRange(spacingRow, 'xPadding', 'X Padding', { min: 0, max: 10, step: 0.5, unit: 'px' });
    this._addRange(spacingRow, 'yPadding', 'Y Padding', { min: 0, max: 10, step: 0.5, unit: 'px' });
  }

  _buildGroupBarSection(content) {
    const section = this._createSection(content, '📊 GroupBar');

    this._addSelect(section, 'groupBarMode', 'Mode', [
      { value: 'separate', label: 'Separate' },
      { value: 'background', label: 'Background' },
    ]);

    this._addRange(section, 'groupYPadding', 'Group Padding', { min: 0, max: 20, step: 1, unit: 'px' });
  }

  // ==================== Control Builders ====================

  _createSection(parent, title) {
    const section = parent.append('div')
      .classed('hcp-setting-section', true);

    section.append('h4')
      .classed('hcp-setting-section-title', true)
      .text(title);

    return section;
  }

  _addSelect(parent, key, label, options) {
    const group = parent.append('div').classed('hcp-control-group', true);
    group.append('label').classed('hcp-control-label', true).text(label);

    const select = group.append('select')
      .classed('hcp-control-select', true)
      .attr('data-key', key);

    options.forEach(opt => {
      select.append('option')
        .attr('value', opt.value)
        .text(opt.label);
    });

    // Set initial value
    const initialValue = String(this._settings[key]);
    select.property('value', initialValue);

    select.on('change', () => {
      let value = select.property('value');
      // Convert boolean strings
      if (value === 'true') value = true;
      else if (value === 'false') value = false;

      this._settings[key] = value;
      this.dispatch.call('settingChange', this, key, value);
    });

    this._controls[key] = select;
    return select;
  }

  _addNumber(parent, key, label, opts = {}) {
    const group = parent.append('div').classed('hcp-control-group', true);
    group.append('label').classed('hcp-control-label', true).text(label);

    const input = group.append('input')
      .classed('hcp-control-number', true)
      .attr('type', 'number')
      .attr('data-key', key)
      .attr('min', opts.min)
      .attr('max', opts.max)
      .attr('step', opts.step || 1)
      .property('value', this._settings[key]);

    input.on('change', () => {
      const value = parseFloat(input.property('value'));
      this._settings[key] = value;
      this.dispatch.call('settingChange', this, key, value);
    });

    this._controls[key] = input;
    return input;
  }

  _addRange(parent, key, label, opts = {}) {
    const group = parent.append('div').classed('hcp-control-group', true);

    const valueSpan = d3.create('span')
      .classed('hcp-range-value', true)
      .text(this._settings[key]);

    const labelEl = group.append('label')
      .classed('hcp-control-label', true);
    labelEl.text(`${label}: `);
    labelEl.node().appendChild(valueSpan.node());
    if (opts.unit) {
      labelEl.append('span').text(opts.unit);
    }

    const rangeRow = group.append('div').classed('hcp-range-row', true);

    const input = rangeRow.append('input')
      .classed('hcp-control-range', true)
      .attr('type', 'range')
      .attr('data-key', key)
      .attr('min', opts.min)
      .attr('max', opts.max)
      .attr('step', opts.step || 1)
      .property('value', this._settings[key]);

    input.on('input', () => {
      const value = parseFloat(input.property('value'));
      valueSpan.text(value);
      this._settings[key] = value;
      this.dispatch.call('settingChange', this, key, value);
    });

    this._controls[key] = input;
    this._controls[key + '_display'] = valueSpan;
    return input;
  }

  _addToggle(parent, key, label) {
    const btn = parent.append('button')
      .classed('hcp-toggle-btn', true)
      .classed('active', !!this._settings[key])
      .attr('data-key', key)
      .text(label);

    btn.on('click', () => {
      const newValue = !this._settings[key];
      this._settings[key] = newValue;
      btn.classed('active', newValue);
      this.dispatch.call('settingChange', this, key, newValue);
    });

    this._controls[key] = btn;
    return btn;
  }

  // ==================== Public API ====================

  /**
   * Open/close the settings panel
   */
  setVisible(visible) {
    this._open = visible;
    this.overlay.classed('open', visible);
  }

  isVisible() {
    return this._open;
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * Update settings programmatically (e.g., reset)
   * @param {Object} settings - Partial settings to update
   */
  setSettings(settings) {
    Object.keys(settings).forEach(key => {
      if (key in this._settings) {
        this._settings[key] = settings[key];

        const control = this._controls[key];
        if (!control) return;

        const tagName = control.node().tagName.toLowerCase();
        if (tagName === 'select' || tagName === 'input') {
          control.property('value', settings[key]);
        } else if (tagName === 'button') {
          control.classed('active', !!settings[key]);
        }

        // Update range display
        const display = this._controls[key + '_display'];
        if (display) {
          display.text(settings[key]);
        }
      }
    });
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    this.dispatch.on(event, callback);
    return this;
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && this._open) {
      this.setVisible(false);
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this._controls = {};
    this.slot = null;
  }
}
