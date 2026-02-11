/**
 * Panel styles for HistoricalChartPanel
 * Follows the same CSS-in-JS pattern as core/style.js
 */

export const getPanelStyles = (theme) => {
  if (theme === 'dark') {
    return _buildPanelColors(_darkColors) + _panelStyles;
  }
  return _buildPanelColors(_lightColors) + _panelStyles;
};

const _lightColors = {
  panelBg: '#ffffff',
  panelBorder: '#e0e0e0',
  panelText: '#333333',
  panelTextSecondary: '#666666',
  panelAccent: '#1976d2',
  toolbarBg: 'rgba(255, 255, 255, 0.95)',
  toolbarShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  btnBg: '#ffffff',
  btnHover: '#f0f0f0',
  btnBorder: '#ddd',
  btnActiveText: '#1976d2',
  btnActiveBg: '#e3f2fd',
  btnActiveBorder: '#1976d2',
  infoBg: '#fafafa',
  infoValueColor: '#1976d2',
  settingOverlay: 'rgba(0, 0, 0, 0.3)',
  settingPanelBg: '#ffffff',
  settingSectionBorder: '#1976d2',
  inputBorder: '#ddd',
  inputBg: '#ffffff',
  inputFocusBorder: '#1976d2',
  inputFocusShadow: 'rgba(25, 118, 210, 0.1)',
  rangeValueColor: '#1976d2',
};

const _darkColors = {
  panelBg: '#1a1a2e',
  panelBorder: '#2f3339',
  panelText: '#e5e7eb',
  panelTextSecondary: '#9ca3af',
  panelAccent: '#60a5fa',
  toolbarBg: 'rgba(26, 26, 46, 0.95)',
  toolbarShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  btnBg: '#2a2a3e',
  btnHover: '#3a3a4e',
  btnBorder: '#4a4a5e',
  btnActiveText: '#60a5fa',
  btnActiveBg: '#1e3a5f',
  btnActiveBorder: '#60a5fa',
  infoBg: '#1f1f2f',
  infoValueColor: '#60a5fa',
  settingOverlay: 'rgba(0, 0, 0, 0.6)',
  settingPanelBg: '#1a1a2e',
  settingSectionBorder: '#60a5fa',
  inputBorder: '#4a4a5e',
  inputBg: '#2a2a3e',
  inputFocusBorder: '#60a5fa',
  inputFocusShadow: 'rgba(96, 165, 250, 0.15)',
  rangeValueColor: '#60a5fa',
};

const _buildPanelColors = (c) => `
  .hcp-wrapper {
    --hcp-panel-bg: ${c.panelBg};
    --hcp-panel-border: ${c.panelBorder};
    --hcp-panel-text: ${c.panelText};
    --hcp-panel-text-secondary: ${c.panelTextSecondary};
    --hcp-panel-accent: ${c.panelAccent};
    --hcp-toolbar-bg: ${c.toolbarBg};
    --hcp-toolbar-shadow: ${c.toolbarShadow};
    --hcp-btn-bg: ${c.btnBg};
    --hcp-btn-hover: ${c.btnHover};
    --hcp-btn-border: ${c.btnBorder};
    --hcp-btn-active-text: ${c.btnActiveText};
    --hcp-btn-active-bg: ${c.btnActiveBg};
    --hcp-btn-active-border: ${c.btnActiveBorder};
    --hcp-info-bg: ${c.infoBg};
    --hcp-info-value-color: ${c.infoValueColor};
    --hcp-setting-overlay: ${c.settingOverlay};
    --hcp-setting-panel-bg: ${c.settingPanelBg};
    --hcp-setting-section-border: ${c.settingSectionBorder};
    --hcp-input-border: ${c.inputBorder};
    --hcp-input-bg: ${c.inputBg};
    --hcp-input-focus-border: ${c.inputFocusBorder};
    --hcp-input-focus-shadow: ${c.inputFocusShadow};
    --hcp-range-value-color: ${c.rangeValueColor};
  }
`;

const _panelStyles = `
  /* ============ Panel Wrapper ============ */
  .hcp-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .hcp-main {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ============ Toolbar ============ */
  .hcp-toolbar-zone {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50px;
    z-index: 100;
    pointer-events: none;
  }

  .hcp-toolbar {
    position: relative;
    width: 100%;
    background: var(--hcp-toolbar-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--hcp-panel-border);
    box-shadow: var(--hcp-toolbar-shadow);
    padding: 8px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: auto;
    transform: translateY(-100%);
    transition: transform 0.25s ease-out, opacity 0.25s ease-out;
    opacity: 0;
  }

  .hcp-toolbar.visible {
    transform: translateY(0);
    opacity: 1;
  }

  .hcp-toolbar-group {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .hcp-toolbar-separator {
    width: 1px;
    height: 20px;
    background: var(--hcp-panel-border);
    margin: 0 6px;
  }

  .hcp-toolbar-btn {
    padding: 5px 10px;
    border: 1px solid var(--hcp-btn-border);
    border-radius: 4px;
    background: var(--hcp-btn-bg);
    color: var(--hcp-panel-text);
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .hcp-toolbar-btn:hover {
    background: var(--hcp-btn-hover);
  }

  .hcp-toolbar-btn.active {
    background: var(--hcp-btn-active-bg);
    border-color: var(--hcp-btn-active-border);
    color: var(--hcp-btn-active-text);
  }

  .hcp-toolbar-btn .btn-icon {
    font-size: 14px;
  }

  /* ============ Chart Container ============ */
  .hcp-chart-container {
    flex: 1;
    overflow: hidden;
  }

  /* ============ Info Panel ============ */
  .hcp-info-panel {
    flex-shrink: 0;
    background: var(--hcp-info-bg);
    border-top: 1px solid var(--hcp-panel-border);
    padding: 8px 16px;
    display: flex;
    gap: 24px;
    font-size: 12px;
    max-height: 40px;
    overflow: hidden;
    transition: max-height 0.2s ease-out, padding 0.2s ease-out, opacity 0.2s ease-out;
  }

  .hcp-info-panel.hidden {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
    border-top: none;
  }

  .hcp-info-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hcp-info-label {
    color: var(--hcp-panel-text-secondary);
  }

  .hcp-info-value {
    color: var(--hcp-info-value-color);
    font-weight: 600;
  }

  /* ============ Setting Panel Overlay ============ */
  .hcp-setting-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    pointer-events: none;
    visibility: hidden;
  }

  .hcp-setting-overlay.open {
    pointer-events: auto;
    visibility: visible;
  }

  .hcp-setting-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--hcp-setting-overlay);
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }

  .hcp-setting-overlay.open .hcp-setting-backdrop {
    opacity: 1;
  }

  .hcp-setting-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 360px;
    max-width: 90%;
    background: var(--hcp-setting-panel-bg);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
  }

  .hcp-setting-overlay.open .hcp-setting-panel {
    transform: translateX(0);
  }

  .hcp-setting-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--hcp-panel-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .hcp-setting-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--hcp-panel-text);
  }

  .hcp-setting-close {
    padding: 4px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 20px;
    color: var(--hcp-panel-text-secondary);
    line-height: 1;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .hcp-setting-close:hover {
    background: var(--hcp-btn-hover);
    color: var(--hcp-panel-text);
  }

  .hcp-setting-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  /* ============ Setting Section ============ */
  .hcp-setting-section {
    margin-bottom: 20px;
  }

  .hcp-setting-section:last-child {
    margin-bottom: 0;
  }

  .hcp-setting-section-title {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--hcp-panel-text);
    padding-bottom: 6px;
    border-bottom: 2px solid var(--hcp-setting-section-border);
  }

  /* ============ Setting Controls ============ */
  .hcp-control-group {
    margin-bottom: 10px;
  }

  .hcp-control-group:last-child {
    margin-bottom: 0;
  }

  .hcp-control-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--hcp-panel-text-secondary);
    margin-bottom: 4px;
  }

  .hcp-control-row {
    display: flex;
    gap: 10px;
  }

  .hcp-control-row .hcp-control-group {
    flex: 1;
  }

  .hcp-control-select,
  .hcp-control-number {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--hcp-input-border);
    border-radius: 4px;
    font-size: 12px;
    background: var(--hcp-input-bg);
    color: var(--hcp-panel-text);
  }

  .hcp-control-select:focus,
  .hcp-control-number:focus {
    outline: none;
    border-color: var(--hcp-input-focus-border);
    box-shadow: 0 0 0 2px var(--hcp-input-focus-shadow);
  }

  .hcp-control-range {
    width: 100%;
    padding: 0;
    height: 6px;
    cursor: pointer;
  }

  .hcp-range-row {
    display: flex;
    align-items: center;
  }

  .hcp-range-row input {
    flex: 1;
  }

  .hcp-range-value {
    display: inline-block;
    margin-left: 8px;
    color: var(--hcp-range-value-color);
    font-weight: 600;
    font-size: 11px;
    min-width: 35px;
    text-align: right;
  }

  .hcp-control-info {
    font-size: 10px;
    color: var(--hcp-panel-text-secondary);
    margin-top: 3px;
    font-style: italic;
  }

  .hcp-control-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hcp-control-checkbox input[type="checkbox"] {
    cursor: pointer;
  }

  .hcp-control-checkbox label {
    margin: 0;
    cursor: pointer;
    font-weight: normal;
    font-size: 12px;
    color: var(--hcp-panel-text);
  }

  .hcp-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    font-size: 11px;
    border: 1px solid var(--hcp-btn-border);
    border-radius: 4px;
    background: var(--hcp-btn-bg);
    color: var(--hcp-panel-text);
    cursor: pointer;
    margin-right: 6px;
    transition: all 0.15s;
  }

  .hcp-toggle-btn.active {
    background: var(--hcp-btn-active-bg);
    border-color: var(--hcp-btn-active-border);
    color: var(--hcp-btn-active-text);
  }
`;
