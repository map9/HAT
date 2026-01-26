/**
 * 解析中国古代完整时间字符串
 * 1. 闰月 → 月份数字为负数 例：闰四月=-4、闰正月=-1
 * 2. 无年份/月份/日期 → 全部返回 null
 * 3. 公元前年份=负数，公元后=正数，模糊值(???年)=null
 * 4. 兼容：初一/初十/二十/廿一/廿九/卅日 全中文日期
 * @param timeStr 待解析时间字符串
 * @returns { year: number | null, month: number | null, day: number | null }
 */
export function parseTimeString(timeStr: string | null | undefined): {
  year: number | null;
  month: number | null;
  day: number | null;
} {
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  // 空值/无意义内容 直接返回全null
  if (!timeStr || ["", "???", "未知", "无"].includes(String(timeStr).trim())) {
    return { year, month, day };
  }

  const normalizedTimeStr = String(timeStr).trim();

  // ===================== 1. 年份解析 =====================
  const bcPattern = /前(\d+)年/;
  const adPattern = /(?<!前)(\d+)年/;
  const bcMatch = normalizedTimeStr.match(bcPattern);
  if (bcMatch && bcMatch[1]) {
    year = -parseInt(bcMatch[1], 10);
  } else {
    const adMatch = normalizedTimeStr.match(adPattern);
    if (adMatch && adMatch[1]) {
      year = parseInt(adMatch[1], 10);
    }
  }

  // ===================== 2. 月份解析 =====================
  const monthMap: Record<string, number> = {
    正月: 1, 一月: 1,
    二月: 2, 三月: 3, 四月: 4, 五月: 5, 六月: 6,
    七月: 7, 八月: 8, 九月: 9, 十月: 10,
    十一月: 11, 冬月: 11,
    十二月: 12, 腊月: 12
  };

  // 正则匹配顺序：先闰月 → 再长月份 → 再短月份
  const leapMonthPattern = /闰(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月)/;
  const longMonthPattern = /(十一月|十二月|冬月|腊月)/;
  const shortMonthPattern = /(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月)/;

  const leapMonthMatch = normalizedTimeStr.match(leapMonthPattern);
  const longMonthMatch = normalizedTimeStr.match(longMonthPattern);
  const normalMonthMatch = normalizedTimeStr.match(shortMonthPattern);

  if (leapMonthMatch && leapMonthMatch[1]) {
    const monthCn = leapMonthMatch[1];
    month = -monthMap[monthCn]; // 闰月为负数
  } else if (longMonthMatch && longMonthMatch[1]) {
    const monthCn = longMonthMatch[1];
    month = monthMap[monthCn];
  } else if (normalMonthMatch && normalMonthMatch[1]) {
    const monthCn = normalMonthMatch[1];
    month = monthMap[monthCn];
  }

  // ===================== 3. 日期解析 =====================
  const numMap: Record<string, number> = {
    初: 0, 十: 10, 廿: 20, 卅: 30,
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
    六: 6, 七: 7, 八: 8, 九: 9
  };

  // 日期格式：初一~初十、十一~十九、二十/廿~廿九、三十/卅
  // 支持：初X、十X、廿X、卅、二十X、三十
  // 规则1：匹配带月份的日期（月份后跟日期）
  const dayPattern = /(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月|闰.+?月)(初[一二三四五六七八九十]|二十[一二三四五六七八九]?|三十|十[一二三四五六七八九]?|廿[一二三四五六七八九]?|卅)日?/;

  // 检查是否只包含年份+月份（用于排除纯月份字符串的日期解析）
  const isOnlyYearMonth = /^(前?\d+年)?(闰)?(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月)$/.test(normalizedTimeStr);

  const dayMatch = normalizedTimeStr.match(dayPattern);
  if (dayMatch && dayMatch[0] && dayMatch[1]) {
    // 截取日期部分，剔除前面的月份
    let dayCn = dayMatch[0].split(dayMatch[1])[1]?.replace('日', '').trim() || '';
    day = parseDayChars(dayCn, numMap);
  } else if (!isOnlyYearMonth) {
    // 规则2：匹配纯日期（仅当不是纯年份+月份时才解析）
    const pureDayPattern = /(初[一二三四五六七八九十]|二十[一二三四五六七八九]?|三十|十[一二三四五六七八九]?|廿[一二三四五六七八九]?|卅)日?/;
    const pureDayMatch = normalizedTimeStr.match(pureDayPattern);
    if (pureDayMatch && pureDayMatch[0]) {
      let dayCn = pureDayMatch[0].replace('日', '').trim();
      day = parseDayChars(dayCn, numMap);
    }
  }

  function parseDayChars(dayCn: string, numMap: Record<string, number>): number {
    // 特殊处理 "二十X" 和 "三十"
    if (dayCn.startsWith('二十')) {
      const suffix = dayCn.slice(2);
      return 20 + (suffix ? (numMap[suffix] || 0) : 0);
    }
    if (dayCn.startsWith('三十')) {
      return 30;
    }

    let result = 0;
    for (const char of dayCn) {
      result += numMap[char] || 0;
    }
    // 初一 → 1, 初 alone → 1, 十 alone → 10
    if (result === 0) {
      result = 1;
    }
    return result;
  }

  return { year, month, day };
}

/**
 * 处理中国古代起讫时间字符串，提取起始和终止时间
 * @param timeRangeStr 待解析时间区间字符串
 * @returns [起始时间, 终止时间]
 */
export function parseTimeRangeString(
  timeRangeStr: string | null | undefined
): [{
  year: number | null;
  month: number | null;
  day: number | null;
} | null, {
  year: number | null;
  month: number | null;
  day: number | null;
} | null] {
  if (typeof timeRangeStr !== 'string') {
    return [null, null];
  }

  const parts = timeRangeStr.split('-').map(part => part.trim());
  if (parts.length === 2) {
    const startStr = parts[0];
    const endStr = parts[1];

    const startTime = parseTimeString(startStr);
    const endTime = parseTimeString(endStr);

    // 补全终止时间的年份（如果缺失）
    if (endTime.year === null && startTime.year !== null) {
      endTime.year = startTime.year;
    }
    // 补全终止时间的月份（如果有日期但无月份）
    if (endTime.month === null && endTime.day !== null && startTime.month !== null) {
      endTime.month = startTime.month;
    }

    return [startTime, endTime];
  } else if (parts.length === 1 && parts[0].length > 0) {
    const startTime = parseTimeString(parts[0]);
    return [startTime, startTime];
  } else {
    return [null, null];
  }
}