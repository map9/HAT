/**
 * HistoricalChartPanel - Wrapper component combining HistoricalChart with
 * auto-hide toolbar, info panel, and settings drawer.
 *
 * Structure:
 *   .hcp-wrapper
 *     <style>  (panel CSS)
 *     .hcp-main
 *       .hcp-toolbar-zone    (ToolbarManager)
 *       .hcp-chart-container (HistoricalChart)
 *       .hcp-info-panel      (InfoPanelManager)
 *       .hcp-setting-overlay (SettingPanelManager)
 */
import * as d3 from 'd3';
import { HistoricalChart } from './core/HistoricalChart.js';
import { getAccentSchemes } from './core/theme.js';
import { getPixelsPerHour } from './core/utils/scales.js';
import { getPanelStyles } from './panelStyle.js';
import { ToolbarManager } from './panel/ToolbarManager.js';
import { InfoPanelManager } from './panel/InfoPanelManager.js';
import { SettingPanelManager } from './panel/SettingPanelManager.js';

export class HistoricalChartPanel {
  /**
   * @param {Object} options - Same options as HistoricalChart, plus panel options
   * @param {Object} [options.panelOptions] - Panel-specific options
   * @param {boolean} [options.panelOptions.showInfoPanel=true]
   * @param {Array} [options.panelOptions.axisTypeOptions]
   * @param {Array} [options.panelOptions.localeOptions]
   * @param {Function} [options.panelOptions.onAxisTypeChange] - callback(axisType) => axises array
   */
  constructor(options = {}) {
    this.panelOptions = {
      showInfoPanel: true,
      axisTypeOptions: null,
      localeOptions: null,
      onAxisTypeChange: null,
      ...(options.panelOptions || {})
    };

    // Separate panel options from chart options
    const { panelOptions: _, ...chartOptions } = options;
    this.chartOptions = chartOptions;

    // Managers
    this.chart = null;
    this.toolbarManager = null;
    this.infoPanelManager = null;
    this.settingPanelManager = null;

    // DOM
    this.container = null;
    this.wrapper = null;
    this.main = null;
    this.chartSlot = null;
    this.styleTag = null;
  }

  /**
   * Create the panel and chart
   * @param {string|HTMLElement} container - Container selector or element
   */
  create(container) {
    this.destroy();

    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.container.innerHTML = '';

    // Wrapper
    this.wrapper = d3.select(this.container)
      .append('div')
      .classed('hcp-wrapper', true);

    // Inject panel styles
    const theme = this.chartOptions.style || 'light';
    this.styleTag = this.wrapper.append('style')
      .text(getPanelStyles(theme));

    // Main layout
    this.main = this.wrapper.append('div')
      .classed('hcp-main', true);

    // Chart container (occupies main area)
    this.chartSlot = this.main.append('div')
      .classed('hcp-chart-container', true);

    // Create HistoricalChart inside chart slot
    this._createChart();

    // Create toolbar
    this._createToolbar();

    // Create info panel
    this._createInfoPanel();

    // Create setting panel
    this._createSettingPanel();

    // Wire up chart events to info panel
    this._wireEvents();

    // Resize chart after all panels are in the DOM so flex layout is settled
    requestAnimationFrame(() => {
      const el = this.chartSlot.node();
      if (el && this.chart) {
        this.chart.resize(el.offsetWidth, el.offsetHeight);
      }
    });
  }

  _createChart() {
    const el = this.chartSlot.node();
    const width = el.offsetWidth || this.chartOptions.width || 960;
    const height = el.offsetHeight || this.chartOptions.height || 600;

    this.chart = new HistoricalChart({
      ...this.chartOptions,
      width,
      height,
    });

    this.chart.Create(el);
  }

  _createToolbar() {
    this.toolbarManager = new ToolbarManager();
    this.toolbarManager.create(this.main);
    this.toolbarManager.setupProximity(this.main.node());

    // Wire toolbar actions to chart
    this.toolbarManager.on('zoomIn', () => this.chart.zoomIn(1.5));
    this.toolbarManager.on('zoomOut', () => this.chart.zoomOut(1.5));
    this.toolbarManager.on('resetZoom', () => this.chart.resetZoom());
    this.toolbarManager.on('panLeft', () => this.chart.pan(100));
    this.toolbarManager.on('panRight', () => this.chart.pan(-100));

    this.toolbarManager.on('expandAll', () => {
      this._toggleAllGroups(true);
    });
    this.toolbarManager.on('collapseAll', () => {
      this._toggleAllGroups(false);
    });

    this.toolbarManager.on('toggleInfo', () => {
      const visible = !this.infoPanelManager.isVisible();
      this.infoPanelManager.setVisible(visible);
      this.toolbarManager.setInfoPanelActive(visible);
      // Resize chart to fill available space
      this._resizeChartToFit();
    });

    this.toolbarManager.on('toggleSettings', () => {
      const visible = !this.settingPanelManager.isVisible();
      if (visible) {
        // Refresh settings from current chart/layer state before opening
        this.settingPanelManager.setSettings(this._getCurrentSettings());
      }
      this.settingPanelManager.setVisible(visible);
      this.toolbarManager.setSettingsPanelActive(visible);
    });
  }

  _createInfoPanel() {
    this.infoPanelManager = new InfoPanelManager();
    this.infoPanelManager.create(this.main);

    if (!this.panelOptions.showInfoPanel) {
      this.infoPanelManager.setVisible(false);
      this.toolbarManager.setInfoPanelActive(false);
    }
  }

  _createSettingPanel() {
    this.settingPanelManager = new SettingPanelManager({
      settings: this._getCurrentSettings(),
      axisTypeOptions: this.panelOptions.axisTypeOptions,
      accentSchemeOptions: getAccentSchemes(),
      localeOptions: this.panelOptions.localeOptions,
    });
    this.settingPanelManager.create(this.main);

    // Wire setting changes to chart
    this.settingPanelManager.on('settingChange', (key, value) => {
      this._applySettingChange(key, value);
    });
  }

  _wireEvents() {
    // Update info panel on domain change
    this.chart.on('domainChange', (domain) => {
      this.infoPanelManager.updateInfo({ domain });
    });

    // Update zoom info on updates
    this.chart.on('update', (xScale) => {
      const zoom = getPixelsPerHour(xScale);
      this.infoPanelManager.updateInfo({ zoom });
    });
  }

  /**
   * Gather current chart settings for SettingPanel initialization/refresh.
   * Reads from actual chart.options and layer options (if layers exist).
   */
  _getCurrentSettings() {
    const opts = this.chart ? this.chart.options : this.chartOptions;
    const layerOpts = this._getLayerOptions();

    return {
      // Chart-level (from chart.options)
      axisType: 'western', // default, caller can override
      startYear: opts.timeDomain ? opts.timeDomain[0].getFullYear() : 1850,
      endYear: opts.timeDomain ? opts.timeDomain[1].getFullYear() : 2020,
      zoomMin: opts.zoomLimited ? opts.zoomLimited[0] : -1,
      zoomMax: opts.zoomLimited ? opts.zoomLimited[1] : -1,
      hasIndexAxis: opts.hasIndexAxis !== false,
      indexAxisHeight: opts.indexAxisHeight || 28,
      labelWidth: opts.labelWidth || 240,
      labelPosition: opts.labelPosition || 'left',
      roundRadius: opts.roundRadius || 4,
      theme: opts.style || 'light',
      accentScheme: opts.accentScheme || 'default',
      locale: opts.locale || 'zh-cn',
      hasActiveAxis: opts.hasActiveAxis !== false,
      hasTooltip: opts.hasTooltip !== false,

      // Layer-level (from actual layer options, with defaults for initial create)
      rowHeight: layerOpts.rowHeight ?? 25,
      xPadding: layerOpts.xPadding ?? 2,
      yPadding: layerOpts.yPadding ?? 2,
      labelXPadding: layerOpts.labelXPadding ?? 6,
      groupBarMode: layerOpts.groupBarMode ?? 'separate',
      groupYPadding: layerOpts.groupYPadding ?? 5,
    };
  }

  /**
   * Aggregate options from all layers via LayerManager
   * @returns {Object} Merged layer options (later layers override earlier ones)
   */
  _getLayerOptions() {
    if (!this.chart || !this.chart.layerManager) return {};
    const result = {};
    this.chart.layerManager.layers.forEach(({ layer }) => {
      Object.assign(result, layer.options);
    });
    return result;
  }

  /**
   * Apply a setting change from SettingPanel to the chart and layers.
   * Chart-level keys → chart.setOptions(), layer-level keys → layerManager.setOptions().
   * Some keys (roundRadius, labelWidth, labelPosition, locale) go to both.
   */
  _applySettingChange(key, value) {
    if (key === 'startYear' || key === 'endYear') {
      const settings = this.settingPanelManager.getSettings();
      const startDate = this._getDate(settings.startYear, 1, 1);
      const endDate = this._getDate(settings.endYear, 12, 31);
      this.chart.setOptions({ timeDomain: [startDate, endDate] });
    } else if (key === 'zoomMin' || key === 'zoomMax') {
      const settings = this.settingPanelManager.getSettings();
      this.chart.setOptions({
        zoomLimited: [settings.zoomMin, settings.zoomMax]
      });
    } else if (
      key === 'theme' ||
      key === 'accentScheme' ||
      key === 'hasIndexAxis' ||
      key === 'indexAxisHeight' ||
      key === 'hasActiveAxis' ||
      key === 'hasTooltip'
    ) {
      this.chart.setOptions({ [key]: value });
      if (key === 'theme') {
        this.styleTag.text(getPanelStyles(value));
      }
    } else if (key === 'axisType') {
      if (this.panelOptions.onAxisTypeChange) {
        const axises = this.panelOptions.onAxisTypeChange(value);
        if (axises) {
          this.chart.setOptions({ axises });
          if (this.chart.layerManager) {
            this.chart.layerManager.setOptions({ axises }, false);
          }
        }
      }
    } else if (
      key === 'locale' ||
      key === 'labelWidth' ||
      key === 'labelPosition' ||
      key === 'roundRadius'
    ) {
      this.chart.setOptions({ [key]: value });
      
      if (this.chart.layerManager) {
        this.chart.layerManager.setOptions({ [key]: value }, false);
      }
    } else {
      if (this.chart.layerManager) {
        this.chart.layerManager.setOptions({ [key]: value }, false);
      }
    }
  }

  _getDate(year, month, day) {
    const date = new Date(2000, 0, 1);
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  _toggleAllGroups(expand) {
    if (!this.chart || !this.chart.layerManager) return;
    const layer = this.chart.layerManager.getLayer('groupBar');
    if (layer && typeof layer.toggleAll === 'function') {
      layer.toggleAll(expand);
    }
  }

  _resizeChartToFit() {
    if (!this.chart) return;
    const panel = this.infoPanelManager?.panel?.node();
    if (panel) {
      // Wait for the CSS transition to finish before reading layout
      const onEnd = () => {
        panel.removeEventListener('transitionend', onEnd);
        const el = this.chartSlot.node();
        if (el && this.chart) {
          this.chart.resize(el.offsetWidth, el.offsetHeight);
        }
      };
      panel.addEventListener('transitionend', onEnd);
    } else {
      requestAnimationFrame(() => {
        const el = this.chartSlot.node();
        this.chart.resize(el.offsetWidth, el.offsetHeight);
      });
    }
  }
  // ==================== Public API ====================

  /**
   * Get the underlying HistoricalChart instance
   */
  getChart() {
    return this.chart;
  }

  /**
   * Proxy: render chart
   */
  render() {
    if (this.chart) this.chart.render();
    return this;
  }

  /**
   * Proxy: resize
   */
  resize(width, height) {
    if (!this.wrapper) return;
    // The wrapper auto-fills its container, so just tell chart to resize
    if (this.chart) {
      const el = this.chartSlot.node();
      this.chart.resize(
        width || el.offsetWidth,
        height || el.offsetHeight
      );
    }
  }

  /**
   * Proxy: set chart options
   */
  setOptions(options) {
    if (this.chart) this.chart.setOptions(options);

    // Sync theme with panel styles
    if (options.theme) {
      this.styleTag.text(getPanelStyles(options.theme));
    }
  }

  /**
   * Proxy: get layer manager
   */
  get layerManager() {
    return this.chart ? this.chart.layerManager : null;
  }

  /**
   * Register event listener (proxied to chart)
   * @param {string} event - Event name
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.chart) {
      this.chart.on(event, callback);
    }
    return this;
  }

  /**
   * Update info panel data count
   */
  setDataCount(count) {
    if (this.infoPanelManager) {
      this.infoPanelManager.setDataCount(count);
    }
  }

  /**
   * Update settings panel values programmatically
   */
  setSettings(settings) {
    if (this.settingPanelManager) {
      this.settingPanelManager.setSettings(settings);
    }
  }

  /**
   * Destroy everything
   */
  destroy() {
    if (this.toolbarManager) {
      this.toolbarManager.destroy();
      this.toolbarManager = null;
    }
    if (this.infoPanelManager) {
      this.infoPanelManager.destroy();
      this.infoPanelManager = null;
    }
    if (this.settingPanelManager) {
      this.settingPanelManager.destroy();
      this.settingPanelManager = null;
    }
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.wrapper = null;
    this.main = null;
    this.chartSlot = null;
    this.styleTag = null;
  }
}
