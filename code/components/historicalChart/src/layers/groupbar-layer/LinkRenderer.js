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
   * @param {string} options.color - Link color
   * @param {string} options.headStyle - 'arrow' | 'square' | 'circle' | 'diamond'
   * @param {number} options.headSize - head size
   * @param {Function} options.onHover - Hover callback
   * @param {Function} options.onLeave - Leave callback
   */
  constructor(options = {}) {
    this.curve = options.curve ?? 'curveBumpX';
    this.headSize = options.headSize ?? 3;

    this.onHover = options.onHover ?? (() => {});
    this.onLeave = options.onLeave ?? (() => {});

    this.container = null;
    this.rowHeight = 0;
    this.markerId = `link-arrow-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Create renderer container and arrow marker
   * @param {d3.Selection} parentGroup - Parent SVG group
   */
  create(parentGroup) {
    // Get or create defs
    const svg = parentGroup.node().ownerSVGElement;
    let defs = d3.select(svg).select('defs');
    if (defs.empty()) {
      defs = d3.select(svg).insert('defs', ':first-child');
    }

    // Create arrow marker
    defs.append('marker')
      .attr('id', this.markerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', this.headSize)
      .attr('markerHeight', this.headSize)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', 'var(--item-path-color)');

    this.container = parentGroup.append('g').classed('links', true);
    return this.container;
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

    // Render paths
    merged.select('.link-path')
      .attr('d', d => this._getLinkPath(d))
      .attr('marker-end', `url(#${this.markerId})`)
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

    this.container.selectAll('.link-path')
      .data(enrichedLinks, d => `${d.startId}-${d.endId}`)
      .attr('d', d => this._getLinkPath(d));
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
}