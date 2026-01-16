/**
 * BarRenderer - Render data bars
 * Combines features from TimelineChart eventChart and GanttChart
 */
import * as d3 from 'd3';

export class BarRenderer {
  /**
   * @param {Object} options
   * @param {number} options.roundRadius - Corner radius
   * @param {number} options.yPadding - Vertical padding
   * @param {string} options.textPosition - 'left' | 'center' | 'right' | 'none'
   * @param {Function} options.onClick - Click handler
   * @param {Function} options.onHover - Hover handler
   * @param {Function} options.onLeave - Leave handler
   */
  constructor(options = {}) {
    this.roundRadius = options.roundRadius ?? 4;
    this.yPadding = options.yPadding ?? 2;
    this.textPosition = options.textPosition ?? 'center';

    this.onClick = options.onClick ?? (() => {});
    this.onHover = options.onHover ?? (() => {});
    this.onLeave = options.onLeave ?? (() => {});

    this.container = null;
    this.xScale = null;
    this.rowHeight = 0;
    this.accessors = null;
  }

  /**
   * Create bar container
   * @param {d3.Selection} container - SVG group to append bars to
   */
  create(container) {
    this.container = container.append('g').classed('bars', true);
    return this.container;
  }

  /**
   * Render bars from enriched data
   * @param {Array} data - Array of items with rowNo property
   * @param {d3.ScaleTime} xScale - Time scale
   * @param {number} rowHeight - Height of each row
   * @param {Object} accessors - Data accessors
   */
  render(data, xScale, rowHeight, accessors = {}) {
    if (!this.container) return;

    this.xScale = xScale;
    this.rowHeight = rowHeight;

    this.accessors = {
      key: accessors.key ?? (d => d.id),
      start: accessors.start ?? (d => d.start),
      end: accessors.end ?? (d => d.end),
      label: accessors.label ?? (d => d.label ?? ''),
      color: accessors.color ?? (d => d.color),
      title: accessors.title ?? (d => d.title ?? '')
    };

    const { key } = this.accessors;
    const barHeight = rowHeight - 2 * this.yPadding;

    const bars = this.container
      .selectAll('.bar')
      .data(data, key);

    bars.exit().remove();

    const enter = bars.enter()
      .append('g')
      .classed('bar', true);

    enter.append('rect');
    enter.append('text');

    const merged = enter.merge(bars);

    // ===== Rect：只负责几何与交互 =====
    merged.select('rect')
      .attr('y', d => d.rowNo * rowHeight + this.yPadding)
      .attr('height', barHeight)
      .attr('rx', this.roundRadius)
      .attr('ry', this.roundRadius)
      .style('fill', d => this.accessors.color(d) ?? null)
      .on('click', (event, d) => this.onClick(d, event))
      .on('mouseenter', (event, d) => this.onHover(d, event))
      .on('mouseleave', (event, d) => this.onLeave(d, event));

    // ===== Text：只在 render 阶段测量 =====
    if (this.textPosition !== 'none') {
      merged.select('text')
        .attr('y', d => d.rowNo * rowHeight + rowHeight / 2)
        .attr('dy', '0.35em')
        .text(d => this.accessors.label(d))
        .each(function (d) {
          // 缓存文本宽度（一次性）
          d.__textWidth = this.getComputedTextLength();
          d.__textHidden = false;
        });
    } else {
      merged.select('text')
        .style('display', 'none');
    }

    // 初次定位
    this.update(xScale);
  }

  /**
   * Update bar positions (on zoom/pan)
   * @param {d3.ScaleTime} xScale - New time scale
   */
  update(xScale) {
    if (!this.container || !this.accessors) return;

    this.xScale = xScale;
    const { start, end } = this.accessors;

    // ===== Rect：仅更新几何 =====
    this.container.selectAll('.bar rect')
      .attr('x', d => xScale(start(d)))
      .attr('width', d => Math.max(1, xScale(end(d)) - xScale(start(d))));

    if (this.textPosition === 'none') return;

    const self = this;

    // ===== Text：只做位置判断，不再测量 =====
    this.container.selectAll('.bar text')
      .each(function (d) {
        const barX = xScale(start(d));
        const barWidth = xScale(end(d)) - xScale(start(d));
        const textWidth = d.__textWidth ?? 0;

        const text = d3.select(this);

        switch (self.textPosition) {
          case 'left':
            text
              .attr('x', barX - 5)
              .attr('text-anchor', 'end')
              .style('visibility', 'visible');
            break;

          case 'right':
            text
              .attr('x', barX + barWidth + 5)
              .attr('text-anchor', 'start')
              .style('visibility', 'visible');
            break;

          case 'center':
          default: {
            text
              .attr('x', barX + barWidth / 2)
              .attr('text-anchor', 'middle');

            // 滞回逻辑，防止抖动
            const HIDE_MARGIN = 6;
            const SHOW_MARGIN = 14;

            if (!d.__textHidden && barWidth < textWidth + HIDE_MARGIN) {
              d.__textHidden = true;
            } else if (d.__textHidden && barWidth > textWidth + SHOW_MARGIN) {
              d.__textHidden = false;
            }

            text.style(
              'visibility',
              d.__textHidden ? 'hidden' : 'visible'
            );
            break;
          }
        }
      });
  }

  /**
   * Clear all bars
   */
  clear() {
    if (this.container) {
      this.container.selectAll('*').remove();
    }
  }

  /**
   * Set text position
   */
  setTextPosition(position) {
    this.textPosition = position;
  }
}