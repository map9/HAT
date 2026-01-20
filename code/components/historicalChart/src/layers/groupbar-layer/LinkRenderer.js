/**
 * LinkRenderer - Render links between items using d3.link
 */
import * as d3 from 'd3';

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
   * @param {Function} options.styleFn - Link style function(link) => { stroke, strokeWidth, strokeDasharray, headStyle }
   *   - stroke: string - Line color
   *   - strokeWidth: number - Line width
   *   - strokeDasharray: string - Dash pattern (e.g., '5,5', '10,5,2,5')
   *   - headStyle: 'arrow' | 'square' | 'circle' | 'diamond'
   * @param {number} options.headSize - head size
   * @param {Function} options.onHover - Hover callback
   * @param {Function} options.onLeave - Leave callback
   */
  constructor(options = {}) {
    this.curve = options.curve ?? 'curveBumpX';
    this.headSize = options.headSize ?? 3;
    this.styleFn = options.styleFn ?? null;

    this.onHover = options.onHover ?? (() => {});
    this.onLeave = options.onLeave ?? (() => {});

    this.container = null;
    this.rowHeight = 0;
    this.markerIdPrefix = `link-marker-${Math.random().toString(36).slice(2, 9)}`;
    this.markers = new Map(); // Cache for created markers
  }

  /**
   * Create renderer container and markers
   * @param {d3.Selection} parentGroup - Parent SVG group
   */
  create(parentGroup) {
    // Get or create defs
    const svg = parentGroup.node().ownerSVGElement;
    let defs = d3.select(svg).select('defs');
    if (defs.empty()) {
      defs = d3.select(svg).insert('defs', ':first-child');
    }

    this.defs = defs;
    this.container = parentGroup.append('g').classed('links', true);
    return this.container;
  }

  /**
   * Get or create a marker for the given style
   * @param {string} headStyle - 'arrow' | 'square' | 'circle' | 'diamond'
   * @param {string} color - Marker color (optional)
   * @returns {string} Marker ID
   */
  _getOrCreateMarker(headStyle = 'arrow', color = null) {
    const markerKey = `${headStyle}-${color || 'default'}`;

    if (this.markers.has(markerKey)) {
      return this.markers.get(markerKey);
    }

    const markerId = `${this.markerIdPrefix}-${markerKey}`;
    const fillColor = color || 'var(--item-path-color)';

    const marker = this.defs.append('marker')
      .attr('id', markerId)
      .attr('markerWidth', this.headSize)
      .attr('markerHeight', this.headSize)
      .attr('orient', 'auto');

    switch (headStyle) {
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
   * @returns {Object} Style object with stroke, strokeWidth, strokeDasharray, headStyle
   */
  _getLinkStyle(link) {
    const defaultStyle = {
      stroke: null,
      strokeWidth: null,
      strokeDasharray: null,
      headStyle: 'arrow'
    };

    if (!this.styleFn) {
      return defaultStyle;
    }

    const style = this.styleFn(link) || {};
    return {
      stroke: style.stroke ?? defaultStyle.stroke,
      strokeWidth: style.strokeWidth ?? defaultStyle.strokeWidth,
      strokeDasharray: style.strokeDasharray ?? defaultStyle.strokeDasharray,
      headStyle: style.headStyle ?? defaultStyle.headStyle
    };
  }

  /**
   * Apply style to a link path element
   * @param {d3.Selection} element - D3 selection of the path element
   * @param {Object} style - Style object from _getLinkStyle
   */
  _applyLinkStyle(element, style) {
    // Get or create marker for this style
    const markerId = this._getOrCreateMarker(style.headStyle, style.stroke);
    element.attr('marker-end', `url(#${markerId})`);

    // Apply stroke style only if styleFn is provided
    if (this.styleFn) {
      if (style.stroke !== null) {
        element.style('stroke', style.stroke);
      }
      if (style.strokeWidth !== null) {
        element.style('stroke-width', style.strokeWidth);
      }
      if (style.strokeDasharray !== null) {
        element.style('stroke-dasharray', style.strokeDasharray);
      }
    }
  }

  /**
   * Render links
   * @param {Array} enrichedLinks - Links with calculated positions
   */
  render(enrichedLinks) {
    if (!this.container) return;

    const links = this.container
      .selectAll('.link-group')
      .data(enrichedLinks, d => `${d.startId}-${d.endId}`);

    links.exit().remove();

    const enter = links.enter()
      .append('g')
      .classed('link-group', true);

    enter.append('path')
      .classed('link-path', true);

    const merged = enter.merge(links);
    const self = this;

    // Render paths with styles
    merged.select('.link-path')
      .attr('d', d => this._getLinkPath(d))
      .each(function(d) {
        const style = self._getLinkStyle(d);
        self._applyLinkStyle(d3.select(this), style);
      })
      .on('mouseenter', function(event, d) {
        self._highlightLink(this);
        self.onHover(d, event);
      })
      .on('mouseleave', function(event, d) {
        self._unhighlightLink(this);
        self.onLeave(d, event);
      });
  }

  /**
   * Update link positions (on zoom/pan)
   * @param {Array} enrichedLinks - Links with updated positions
   */
  update(enrichedLinks) {
    if (!this.container) return;
    const self = this;

    this.container.selectAll('.link-path')
      .data(enrichedLinks, d => `${d.startId}-${d.endId}`)
      .attr('d', d => this._getLinkPath(d))
      .each(function(d) {
        const style = self._getLinkStyle(d);
        self._applyLinkStyle(d3.select(this), style);
      });
  }

  /**
   * Generate link path using d3.link
   * @param {Object} link - Link with startX, endX, startY, endY
   * @returns {string} SVG path d attribute
   */
  _getLinkPath(link) {
    const curveType = CURVE_TYPES[this.curve] || d3.curveBumpX;

    const linkGenerator = d3.link(curveType)
      .x(d => d.x)
      .y(d => d.y);

    return linkGenerator({
      source: { x: link.startX, y: link.startY },
      target: { x: link.endX, y: link.endY }
    });
  }

  _highlightLink(element) {
    d3.select(element)
      .style('filter', 'drop-shadow(0 0 2px rgba(0,0,0,0.3))');
  }

  _unhighlightLink(element) {
    d3.select(element)
      .style('filter', null);
  }

  /**
   * Clear all links
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }

  /**
   * Set curve type
   * @param {string} curve - Curve type name
   */
  setCurve(curve) {
    this.curve = curve;
  }

  /**
   * Set style function
   * @param {Function} styleFn - Style function(link) => { stroke, strokeWidth, strokeDasharray, headStyle }
   */
  setStyleFn(styleFn) {
    this.styleFn = styleFn;
  }
}