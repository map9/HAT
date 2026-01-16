/**
 * LaneNode - Represents a node in the hierarchical lane tree
 * Ported from GanttChart with enhancements
 */
export class LaneNode {
  constructor(key, level, field, parent = null) {
    this.key = key;              // Lane value (e.g., 'USA')
    this.level = level;          // Depth level (0-based)
    this.field = field;          // Field name (e.g., 'countryname')
    this.parent = parent;        // Parent node reference
    this.children = [];          // Child nodes
    this.items = [];             // Data items (only at leaf or collapsed nodes)
    this.expanded = true;        // Whether this node is expanded
    this.rowStart = 0;           // Starting row number
    this.rowEnd = 0;             // Ending row number
    this.rowCount = 0;           // Number of rows occupied
    this.groupBarRow = -1;       // Row number for group bar (if using separate row mode)
    this.timeStart = null;       // Earliest start time of all items in this group
    this.timeEnd = null;         // Latest end time of all items in this group
  }

  /**
   * Check if this is a leaf node (no children)
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Check if this node is collapsed
   */
  isCollapsed() {
    return !this.expanded;
  }

  /**
   * Get all visible descendant nodes (considering collapse state)
   */
  getVisibleNodes() {
    if (this.isCollapsed() || this.isLeaf()) {
      return [this];
    }
    return this.children.flatMap(child => child.getVisibleNodes());
  }

  /**
   * Get the full path from root to this node
   */
  getPath() {
    const path = [];
    let current = this;
    while (current && current.level >= 0) {
      path.unshift({
        key: current.key,
        field: current.field,
        level: current.level
      });
      current = current.parent;
    }
    return path;
  }

  /**
   * Toggle expansion state
   */
  toggle() {
    this.expanded = !this.expanded;
  }

  /**
   * Recursively collect all items under this node
   */
  getAllItems() {
    if (this.isLeaf() || this.isCollapsed()) {
      return this.items;
    }
    return this.children.flatMap(child => child.getAllItems());
  }

  /**
   * Calculate time range for this group based on all items
   * @param {Function} startAccessor - Function to get start time from item
   * @param {Function} endAccessor - Function to get end time from item
   */
  calculateTimeRange(startAccessor, endAccessor) {
    const allItems = this.getAllItems();

    if (allItems.length === 0) {
      this.timeStart = null;
      this.timeEnd = null;
      return;
    }

    // Find earliest start and latest end
    this.timeStart = allItems.reduce((min, item) => {
      const itemStart = startAccessor(item);
      return !min || itemStart < min ? itemStart : min;
    }, null);

    this.timeEnd = allItems.reduce((max, item) => {
      const itemEnd = endAccessor(item);
      return !max || itemEnd > max ? itemEnd : max;
    }, null);
  }

  /**
   * Check if this node should render a group bar
   * (nodes with children, regardless of expansion state)
   */
  shouldRenderGroupBar() {
    return this.level >= 0 && this.children.length > 0;
  }

  /**
   * Find a node by path (used for state restoration)
   * @param {Array} path - Array of keys from root to target
   */
  findByPath(path) {
    if (path.length === 0) return this;
    const [first, ...rest] = path;
    const child = this.children.find(c => c.key === first);
    if (!child) return null;
    return rest.length === 0 ? child : child.findByPath(rest);
  }

  /**
   * Get all expanded paths (for state preservation)
   */
  getExpandedPaths() {
    const paths = [];
    const traverse = (node, path) => {
      if (node.expanded && node.children.length > 0) {
        paths.push([...path, node.key]);
        node.children.forEach(child => traverse(child, [...path, node.key]));
      }
    };
    if (this.level >= 0) {
      traverse(this, []);
    } else {
      this.children.forEach(child => traverse(child, []));
    }
    return paths;
  }

  /**
   * Restore expanded state from paths
   * @param {Array} paths - Array of paths that should be expanded
   */
  restoreExpandedState(paths) {
    const pathSet = new Set(paths.map(p => p.join('/')));
    const traverse = (node, path) => {
      const currentPath = [...path, node.key].join('/');
      node.expanded = pathSet.has(currentPath);
      node.children.forEach(child => traverse(child, [...path, node.key]));
    };
    if (this.level >= 0) {
      traverse(this, []);
    } else {
      this.children.forEach(child => traverse(child, []));
    }
  }
}
