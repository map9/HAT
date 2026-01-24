/**
 * ScrollManager - Synchronize scrolling between multiple areas
 * Handles bidirectional scroll sync between body and labels
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
    this._isSyncing = false; // Prevent circular sync
    this._boundOnBodyScroll = this._handleBodyScroll.bind(this);
    this._boundOnLabelsScroll = this._handleLabelsScroll.bind(this);
  }

  /**
   * Initialize scroll listeners
   */
  init() {
    if (this.bodyContainer) {
      this.bodyContainer.addEventListener('scroll', this._boundOnBodyScroll, { passive: true });
    }
    return this;
  }

  /**
   * Handle body scroll event - sync to labels
   */
  _handleBodyScroll(event) {
    if (this._isSyncing) return;

    const target = event.target;
    this.scrollTop = target.scrollTop;
    this.scrollLeft = target.scrollLeft;

    // Sync labels container
    if (this.labelsContainer) {
      this._isSyncing = true;
      this.labelsContainer.scrollTop = this.scrollTop;
      this._isSyncing = false;
    }

    // Notify callback
    this.onScroll(this.scrollTop, this.scrollLeft);
  }

  /**
   * Handle labels scroll event - sync to body
   */
  _handleLabelsScroll(event) {
    if (this._isSyncing) return;

    const target = event.target;
    this.scrollTop = target.scrollTop;

    // Sync body container
    if (this.bodyContainer) {
      this._isSyncing = true;
      this.bodyContainer.scrollTop = this.scrollTop;
      this._isSyncing = false;
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
    // Remove old listeners
    if (this.bodyContainer) {
      this.bodyContainer.removeEventListener('scroll', this._boundOnBodyScroll);
    }
    if (this.labelsContainer) {
      this.labelsContainer.removeEventListener('scroll', this._boundOnLabelsScroll);
    }

    this.bodyContainer = bodyContainer;
    this.labelsContainer = labelsContainer;

    // Add new listeners
    if (this.bodyContainer) {
      this.bodyContainer.addEventListener('scroll', this._boundOnBodyScroll, { passive: true });
    }
    if (this.labelsContainer) {
      this.labelsContainer.addEventListener('scroll', this._boundOnLabelsScroll, { passive: true });
    }
  }

  /**
   * Set labels container for scroll sync (called after LabelRenderer creates its DOM)
   * @param {HTMLElement} labelsContainer - The labels container element
   */
  setLabelsContainer(labelsContainer) {
    // Remove old listener if exists
    if (this.labelsContainer) {
      this.labelsContainer.removeEventListener('scroll', this._boundOnLabelsScroll);
    }

    this.labelsContainer = labelsContainer;

    // Add listener for bidirectional sync
    if (this.labelsContainer) {
      this.labelsContainer.addEventListener('scroll', this._boundOnLabelsScroll, { passive: true });
      // Sync current scroll position immediately
      if (this.scrollTop > 0) {
        this.labelsContainer.scrollTop = this.scrollTop;
      }
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.bodyContainer) {
      this.bodyContainer.removeEventListener('scroll', this._boundOnBodyScroll);
    }
    if (this.labelsContainer) {
      this.labelsContainer.removeEventListener('scroll', this._boundOnLabelsScroll);
    }
  }
}
