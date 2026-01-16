/**
 * ScrollManager - Synchronize scrolling between multiple areas
 * Handles body scroll and syncs with labels
 */
export class ScrollManager {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.bodyContainer - Scrollable body container
   * @param {HTMLElement} options.labelsContainer - Labels container to sync
   * @param {Function} options.onScroll - Callback on scroll
   */
  constructor(options = {}) {
    this.bodyContainer = options.bodyContainer || null;
    this.labelsContainer = options.labelsContainer || null;
    this.onScroll = options.onScroll || (() => {});

    this.scrollTop = 0;
    this.scrollLeft = 0;
    this._boundOnScroll = this._handleScroll.bind(this);
  }

  /**
   * Initialize scroll listeners
   */
  init() {
    if (this.bodyContainer) {
      this.bodyContainer.addEventListener('scroll', this._boundOnScroll, { passive: true });
    }
    return this;
  }

  /**
   * Handle scroll event
   */
  _handleScroll(event) {
    const target = event.target;
    this.scrollTop = target.scrollTop;
    this.scrollLeft = target.scrollLeft;

    // Sync labels container
    if (this.labelsContainer) {
      this.labelsContainer.scrollTop = this.scrollTop;
    }

    // Notify callback
    this.onScroll(this.scrollTop, this.scrollLeft);
  }

  /**
   * Programmatically scroll to position
   * @param {number} top - Scroll top
   * @param {number} left - Scroll left (optional)
   */
  scrollTo(top, left = null) {
    if (this.bodyContainer) {
      this.bodyContainer.scrollTop = top;
      if (left !== null) {
        this.bodyContainer.scrollLeft = left;
      }
    }
  }

  /**
   * Scroll to make a specific row visible
   * @param {number} rowNo - Row number
   * @param {number} rowHeight - Height of each row
   */
  scrollToRow(rowNo, rowHeight) {
    const targetTop = rowNo * rowHeight;
    this.scrollTo(targetTop);
  }

  /**
   * Get current scroll position
   */
  getScrollPosition() {
    return {
      top: this.scrollTop,
      left: this.scrollLeft
    };
  }

  /**
   * Check if a row is visible
   * @param {number} rowNo - Row number
   * @param {number} rowHeight - Height of each row
   * @param {number} viewportHeight - Height of visible area
   */
  isRowVisible(rowNo, rowHeight, viewportHeight) {
    const rowTop = rowNo * rowHeight;
    const rowBottom = rowTop + rowHeight;
    return rowBottom > this.scrollTop && rowTop < this.scrollTop + viewportHeight;
  }

  /**
   * Update container references
   */
  setContainers(bodyContainer, labelsContainer) {
    // Remove old listener
    if (this.bodyContainer) {
      this.bodyContainer.removeEventListener('scroll', this._boundOnScroll);
    }

    this.bodyContainer = bodyContainer;
    this.labelsContainer = labelsContainer;

    // Add new listener
    if (this.bodyContainer) {
      this.bodyContainer.addEventListener('scroll', this._boundOnScroll, { passive: true });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.bodyContainer) {
      this.bodyContainer.removeEventListener('scroll', this._boundOnScroll);
    }
  }
}
