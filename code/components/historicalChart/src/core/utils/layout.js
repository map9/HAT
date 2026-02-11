/**
 * Layout algorithms for row assignment
 * Ported from GanttChart and TimelineChart dataProvider
 */
import * as d3 from 'd3';

/**
 * Assign rows to items using the same algorithm as GanttChart
 * Each item is placed in the first available row that doesn't overlap
 *
 * @param {Array} items - Array of data items (must have start/end times)
 * @param {Object} options - Options
 * @param {Function} options.start - Accessor for start time
 * @param {Function} options.end - Accessor for end time
 * @param {d3.ScaleTime} options.xScale - Time scale for xPadding conversion
 * @param {number} options.xPadding - Horizontal padding in pixels
 * @returns {Array} - Items with rowNo property added
 */
export function assignRowsLanes(items, options = {}) {
  const {
    start = d => d.start,
    end = d => d.end,
    xScale = null,
    xPadding = 2
  } = options;

  if (items.length === 0) return [];

  // Sort by start time (same as GanttChart)
  const sorted = [...items].sort((a, b) => start(a) - start(b));

  // Calculate padding in time units (same as GanttChart)
  const paddingInTime = xScale
    ? (xScale.invert(xPadding) - xScale.invert(0))
    : 0;

  // Track items in each row (same as GanttChart)
  const rows = [];

  const result = [];

  sorted.forEach(item => {
    const itemStart = +start(item);
    const itemEnd = +end(item);

    let assignedRow = 0;
    let foundSlot = false;

    while (!foundSlot) {
      if (!rows[assignedRow]) {
        rows[assignedRow] = [];
      }

      // Check overlap with all items in this row (same logic as GanttChart)
      const hasOverlap = rows[assignedRow].some(existing => {
        return itemStart < existing.end + paddingInTime &&
               itemEnd > existing.start - paddingInTime;
      });

      if (!hasOverlap) {
        const assignedItem = {
          ...item,
          start: itemStart,
          end: itemEnd,
          rowNo: assignedRow
        };
        rows[assignedRow].push(assignedItem);
        result.push(assignedItem);
        foundSlot = true;
      } else {
        assignedRow++;
      }
    }
  });

  return result;
}

/**
 * Assign rows using naive algorithm (each item on separate row)
 */
export function assignRowsNaive(items, options = {}) {
  return items.map((item, index) => ({
    ...item,
    rowNo: index
  }));
}

/**
 * Assign rows using StackI algorithm (simple stack, remove only top expired)
 */
export function assignRowsStackI(items, options = {}) {
  const { start = d => d.start, end = d => d.end } = options;

  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => start(a) - start(b));
  const stack = [];

  return sorted.map(item => {
    const itemStart = start(item);

    // Pop top if expired
    if (stack.length > 0 && end(stack[stack.length - 1]) <= itemStart) {
      stack.pop();
    }

    const rowNo = stack.length;
    stack.push(item);

    return { ...item, rowNo };
  });
}

/**
 * Assign rows using StackII algorithm (pop all expired events)
 */
export function assignRowsStackII(items, options = {}) {
  const { start = d => d.start, end = d => d.end } = options;

  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => start(a) - start(b));
  const stack = [];

  return sorted.map(item => {
    const itemStart = start(item);

    // Pop all expired items
    while (stack.length > 0 && end(stack[stack.length - 1]) <= itemStart) {
      stack.pop();
    }

    const rowNo = stack.length;
    stack.push(item);

    return { ...item, rowNo };
  });
}

/**
 * Get maximum row number from assigned items
 */
export function getMaxRow(items) {
  if (items.length === 0) return 0;
  return d3.max(items, d => d.rowNo) || 0;
}

/**
 * Layout algorithm factory
 * @param {string} algorithm - Algorithm name: 'Lanes', 'Naive', 'StackI', 'StackII'
 */
export function getLayoutAlgorithm(algorithm) {
  switch (algorithm) {
    case 'Naive':
      return assignRowsNaive;
    case 'StackI':
      return assignRowsStackI;
    case 'StackII':
      return assignRowsStackII;
    case 'Lanes':
    default:
      return assignRowsLanes;
  }
}
