/**
 * LinkRenderer - Render links between items using d3.link
 */
import * as d3 from 'd3';
import { applyStrokeStyle } from '../../utils/styleHelper.js';

// Curve types mapping
const CURVE_TYPES = {
  curveBumpX: d3.curveBumpX,
  curveBumpY: d3.curveBumpY,
  curveStep: d3.curveStep,
  curveStepBefore: d3.curveStepBefore,
  curveStepAfter: d3.curveStepAfter,
  curveLinear: d3.curveLinear
};


export class LinkRenderer {
  /**
   * @param {Object} options
   * @param {string} options.curve - Curve type: 'curveBumpX', 'curveStep', etc.
   * @param {Function} options.styleFn - - Style callback for links
   * - Link style function(type, link) => { stroke, strokeWidth, strokeDasharray, headMarker }
   * - type: 'link'
   * - link: link data
   * - Returned style object properties:
   * - stroke: string - Line color
   * - strokeWidth: number - Line width
   * - strokeDasharray: string - Dash pattern (e.g., '5,5', '10,5,2,5')
   * - headMarker: 'none' | 'circle' | 'arrow' | 'square' | 'diamond', defaults to 'none'
   * @param {number} options.headSize - head size
   * @param {Function} options.onClick - Click handler
   * @param {Function} options.onHover - Hover callback
   * @param {Function} options.onLeave - Leave callback
   */
  constructor(options = {}) {
    this.options = {
      curve: 'curveBumpX',
      headSize: 3,
      styleFn: null,

      onClick: null,
      onHover: null,
      onLeave: null,
      ...options
    };

    this.container = null;
    this.defs = null;
    this.markerIdPrefix = `link-marker-${Math.random().toString(36).slice(2, 9)}`;
    this.markers = new Map(); // Cache for created markers
  }

  /**
   * Create links container and markers
   * @param {d3.Selection} container - SVG group to append links to
   */
  create(container) {
    this.destroy();

    this.defs = this._createDefs(container);
    this.container = container.append('g').classed('links', true);
    return this.container;
  }

  _createDefs(container) {
    if (!container) return null;

    const svg = container.node().ownerSVGElement;
    let defs = d3.select(svg).select('defs');
    if (defs.empty()) {
      defs = d3.select(svg).insert('defs', ':first-child');
    }

    // Use namespaced group to avoid clearing other defs content (e.g., clipPath)
    const markersGroupId = `link-markers-${this.markerIdPrefix}`;
    let markerGroup = defs.select(`#${markersGroupId}`);
    if (markerGroup.empty()) {
      markerGroup = defs.append('g').attr('id', markersGroupId);
    } else {
      // Only clear our own marker group, not the entire defs
      markerGroup.selectAll('*').remove();
    }

    return markerGroup;
  }

  /**
   * Get or create a marker for the given style
   * @param {string} headMarker - 'arrow' | 'square' | 'circle' | 'diamond'
   * @param {string} color - Marker color (optional)
   * @returns {string} Marker ID
   */
  _getOrCreateMarker(headMarker = 'arrow', color = null) {
    const markerKey = `${headMarker}-${color || 'default'}`;

    if (this.markers.has(markerKey)) {
      return this.markers.get(markerKey);
    }

    const markerId = `${this.markerIdPrefix}-${markerKey}`;
    const fillColor = color || 'var(--item-path-color)';

    const marker = this.defs.append('marker')
      .attr('id', markerId)
      .attr('markerWidth', this.options.headSize)
      .attr('markerHeight', this.options.headSize)
      .attr('orient', 'auto');

    switch (headMarker) {
      case 'square':
        marker
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 5)
          .attr('refY', 5)
          .append('rect')
          .attr('x', 2)
          .attr('y', 2)
          .attr('width', 6)
          .attr('height', 6)
          .attr('fill', fillColor);
        break;

      case 'circle':
        marker
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 5)
          .attr('refY', 5)
          .append('circle')
          .attr('cx', 5)
          .attr('cy', 5)
          .attr('r', 3)
          .attr('fill', fillColor);
        break;

      case 'diamond':
        marker
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 5)
          .attr('refY', 5)
          .append('path')
          .attr('d', 'M 5 0 L 10 5 L 5 10 L 0 5 z')
          .attr('fill', fillColor);
        break;

      case 'arrow':
      default:
        marker
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 8)
          .attr('refY', 5)
          .append('path')
          .attr('d', 'M 0 0 L 10 5 L 0 10 z')
          .attr('fill', fillColor);
        break;
    }

    this.markers.set(markerKey, markerId);
    return markerId;
  }

  /**
   * Get style for a link
   * @param {Object} link - Link data
   * @returns {Object} Style object with stroke, strokeWidth, strokeDasharray, headMarker
   */
  _getStyle(link) {
    const defaultStyle = {
      stroke: null,
      strokeWidth: null,
      strokeDasharray: null,
      headMarker: 'none'
    };

    if (!this.options.styleFn) {
      return defaultStyle;
    }

    // Unified signature: styleFn(type, context) where context = { data, ... }
    const style = this.options.styleFn('link', { data: link }) || {};
    if (!style || typeof style !== 'object') {
      return defaultStyle;
    } else {
      return {
        stroke: style.stroke ?? defaultStyle.stroke,
        strokeWidth: style.strokeWidth ?? defaultStyle.strokeWidth,
        strokeDasharray: style.strokeDasharray ?? defaultStyle.strokeDasharray,
        headMarker: style.headMarker ?? defaultStyle.headMarker
      };
    }
  }

  /**
   * Apply style to a link path element
   * @param {d3.Selection} element - D3 selection of the path element
   * @param {Object} style - Style object from _getStyle
   */
  _applyStyle(element, style) {
    // Get or create marker for this style
    if (style.headMarker === 'none') {
      element.attr('marker-end', null);
    } else {
      const markerId = this._getOrCreateMarker(style.headMarker, style.stroke);
      element.attr('marker-end', `url(#${markerId})`);
    }

    // Apply stroke style
    if (this.options.styleFn) {
      applyStrokeStyle(element, style);
    }
  }

  /**
   * Render links
   * @param {Array} enrichedLinks - Links with calculated positions
   */
  render(enrichedLinks) {
    if (!this.container) return;

    const links = this.container
      .selectAll('.link-item')
      .data(enrichedLinks, d => `${d.startId}-${d.endId}`);

    links.exit().remove();

    const enter = links.enter()
      .append('g')
      .classed('link-item', true);

    enter.append('path')
    const merged = enter.merge(links);
    const self = this;

    // Render paths with styles
    merged.select('path')
      .attr('d', d => this._getLinkPath(d))
      .each(function(d) {
        const style = self._getStyle(d);
        self._applyStyle(d3.select(this), style);
      })
      .call(elem => {
        if (self.options.onClick) {
          elem.on('click', (e, d) => self.options.onClick(d, e));
        }
        if (self.options.onHover) {
          elem.on('mouseenter', (e, d) => self.options.onHover(d, e));
        }
        if (self.options.onLeave) {
          elem.on('mouseleave', (e, d) => self.options.onLeave(d, e));
        }
      });
  }

  /**
   * Update link positions (on zoom/pan)
   * @param {Array} enrichedLinks - Links with updated positions
   */
  update(enrichedLinks) {
    if (!this.container) return;
    const self = this;

    this.container.selectAll('path')
      .data(enrichedLinks, d => `${d.startId}-${d.endId}`)
      .attr('d', d => this._getLinkPath(d))
      .each(function(d) {
        const style = self._getStyle(d);
        self._applyStyle(d3.select(this), style);
      });
  }

  /**
   * Generate link path using d3.link
   * @param {Object} link - Link with startX, endX, startY, endY
   * @returns {string} SVG path d attribute
   */
  _getLinkPath(link) {
    const curveType = CURVE_TYPES[this.options.curve] || d3.curveBumpX;

    const linkGenerator = d3.link(curveType)
      .x(d => d.x)
      .y(d => d.y);

    return linkGenerator({
      source: { x: link.startX, y: link.startY },
      target: { x: link.endX, y: link.endY }
    });
  }

  /**
   * Clear all links (keep containers, clear content)
   */
  clear() {
    if (this.defs) {
      this.defs.selectAll('*').remove();
    }
    this.markers.clear();
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }

  /**
   * Destroy and remove all DOM elements
   */
  destroy() {
    this.markers.clear();

    if (this.defs) {
      this.defs.remove();
      this.defs = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Update render options by GroupBarLayer
   * @param {Object} options - New options to merge
   * @returns {boolean} Whether re-render is needed
   */
  setOptions(options) {
    // Detect which options actually changed
    const renderTriggerKeys = ['curve', 'headSize', 'styleFn'];
    const needsRender = renderTriggerKeys.some(
      key => options[key] !== undefined && options[key] !== this.options[key]
    );

    const isHeadSizeChanged = options.headSize && (options.headSize !== this.options.headSize);

    Object.assign(this.options, options);

    // Re-create defs if head size changed
    if (isHeadSizeChanged) {
      this.markers.clear();
      this.defs = this._createDefs(this.container);
    }

    return needsRender;
  }
}