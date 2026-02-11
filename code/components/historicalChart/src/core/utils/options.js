/**
 * Options utilities for HistoricalChart
 */

// 递归Object判断值是否有变化（内部辅助函数）
export function isObjectValueChanged(val1, val2) {
  // 类型不同 → 有变化
  if (typeof val1 !== typeof val2) return true;
  
  // 非对象类型，值不一致 → 有变化
  if (typeof val1 !== 'object' || val1 === null || val2 === null) {
    return val1 !== val2;
  }

  // 嵌套对象，递归校验
  for (const key of Object.keys(val1)) {
    if (!val2.hasOwnProperty(key)) return true; // 嵌套key缺失
    if (isObjectValueChanged(val1[key], val2[key])) return true; // 嵌套值变化
  }
  return false;
}

/**
 * 对比两个配置内容，返回变化的 key 集合
 * 规则：
 * 1. partialOptions key → 不加入 Set
 * 2. partialOptions key 对应的值（含嵌套）有变化 → 加入 Set
 * 3. 返回变化了的 key 的 Set
 * @param {Object} fullOptions - 原完整的配置
 * @param {Object} partialOptions - 新的部分配置
 * @returns {Object} 变化的 key 集合
 */
export function getChangedKeys(fullOptions, partialOptions) {
  const changedKeys = new Set();

  for (const firstKey of Object.keys(fullOptions)) {
    if (!partialOptions.hasOwnProperty(firstKey)) {
      continue;
    }

    const fullVal = fullOptions[firstKey];
    const partialVal = partialOptions[firstKey];
    if (isObjectValueChanged(fullVal, partialVal)) {
      changedKeys.add(firstKey);
    }
  }

  return changedKeys;
}