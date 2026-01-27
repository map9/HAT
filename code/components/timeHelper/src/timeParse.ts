/**
 * 日历类型
 * - lunar: 农历（中文月日）
 * - gregorian: 公历（阿拉伯数字月日）
 * - era: 帝王年号干支纪年
 * - unknown: 无法判断（仅有年份或无月日信息）
 */
export type CalendarType = 'lunar' | 'gregorian' | 'era' | 'unknown';

/**
 * 年号验证函数类型
 */
export type EraValidator = (eraName: string) => boolean;

/**
 * 解析选项
 */
export interface ParseOptions {
  eraValidator?: EraValidator;
}

/**
 * 解析后的时间对象
 */
export interface ParsedTime {
  year: number | null;
  month: number | null;
  day: number | null;
  calendarType: CalendarType;
  // 年号纪年专用字段（仅当 calendarType === 'era' 时有值）
  eraName?: string;       // 帝王+年号，如 "明太祖洪武"、"梁简文帝大宝"
  eraYear?: number;       // 年数，如 1、2、8
  ganzhiYear?: string;    // 干支年，如 "戊申"
  ganzhiMonth?: string;   // 干支月，如 "辛巳"
  ganzhiDay?: string;     // 干支日，如 "乙亥"、"戊戌"
}

/**
 * 月日解析结果（内部使用）
 */
interface MonthDayResult {
  month: number | null;
  day: number | null;
  isLeapMonth: boolean;
}

// ===================== 干支常量 =====================

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 生成所有60个干支组合
const GANZHI_LIST: string[] = [];
for (let i = 0; i < 60; i++) {
  GANZHI_LIST.push(TIANGAN[i % 10] + DIZHI[i % 12]);
}

// 干支正则模式（供外部使用）
const GANZHI_PATTERN = `(${GANZHI_LIST.join('|')})`;

// ===================== 中文数字映射 =====================

const CN_NUM_MAP: Record<string, number> = {
  零: 0, 〇: 0,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15,
  十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
  廿: 20, 廿一: 21, 廿二: 22, 廿三: 23, 廿四: 24, 廿五: 25,
  廿六: 26, 廿七: 27, 廿八: 28, 廿九: 29, 三十: 30, 卅: 30
};

/**
 * 解析中文数字（用于年号年数）
 * 支持：元、一、二...十、十一...二十...三十等
 */
function parseChineseNumber(str: string): number | null {
  if (str === '元') return 1;
  if (CN_NUM_MAP[str] !== undefined) return CN_NUM_MAP[str];

  // 处理复杂中文数字如 "二十一"
  const match = str.match(/^(二十|廿|三十|卅|十)?([一二三四五六七八九])?$/);
  if (match) {
    let result = 0;
    if (match[1]) {
      if (match[1] === '二十' || match[1] === '廿') result = 20;
      else if (match[1] === '三十' || match[1] === '卅') result = 30;
      else if (match[1] === '十') result = 10;
    }
    if (match[2]) {
      result += CN_NUM_MAP[match[2]] || 0;
    }
    if (result > 0) return result;
  }

  return null;
}

// ===================== 农历（中文）月日解析 =====================

const LUNAR_MONTH_MAP: Record<string, number> = {
  正月: 1, 一月: 1,
  二月: 2, 三月: 3, 四月: 4, 五月: 5, 六月: 6,
  七月: 7, 八月: 8, 九月: 9, 十月: 10,
  十一月: 11, 冬月: 11,
  十二月: 12, 腊月: 12
};

const DAY_NUM_MAP: Record<string, number> = {
  初: 0, 十: 10, 廿: 20, 卅: 30,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9
};

/**
 * 解析中文日期字符（初一、十五、廿三、卅等）
 */
function parseLunarDayChars(dayCn: string): number {
  // 特殊处理 "二十X" 和 "三十"
  if (dayCn.startsWith('二十')) {
    const suffix = dayCn.slice(2);
    return 20 + (suffix ? (DAY_NUM_MAP[suffix] || 0) : 0);
  }
  if (dayCn.startsWith('三十')) {
    return 30;
  }

  let result = 0;
  for (const char of dayCn) {
    result += DAY_NUM_MAP[char] || 0;
  }
  // 初一 → 1, 初 alone → 1, 十 alone → 10
  if (result === 0) {
    result = 1;
  }
  return result;
}

/**
 * 解析农历（中文）月份和日期
 * @returns MonthDayResult 或 null（无匹配）
 */
function parseLunarMonthDay(str: string): MonthDayResult | null {
  let month: number | null = null;
  let day: number | null = null;
  let isLeapMonth = false;

  // 月份解析：先闰月 → 再长月份 → 再短月份
  const leapMonthPattern = /闰(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月)/;
  const longMonthPattern = /(十一月|十二月|冬月|腊月)/;
  const shortMonthPattern = /(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月)/;

  const leapMonthMatch = str.match(leapMonthPattern);
  const longMonthMatch = str.match(longMonthPattern);
  const normalMonthMatch = str.match(shortMonthPattern);

  if (leapMonthMatch && leapMonthMatch[1]) {
    month = LUNAR_MONTH_MAP[leapMonthMatch[1]];
    isLeapMonth = true;
  } else if (longMonthMatch && longMonthMatch[1]) {
    month = LUNAR_MONTH_MAP[longMonthMatch[1]];
  } else if (normalMonthMatch && normalMonthMatch[1]) {
    month = LUNAR_MONTH_MAP[normalMonthMatch[1]];
  }

  // 日期解析
  const dayPattern = /(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月|闰.+?月)(初[一二三四五六七八九十]|二十[一二三四五六七八九]?|三十|十[一二三四五六七八九]?|廿[一二三四五六七八九]?|卅)日?/;
  const isOnlyYearMonth = /^(前?\d+年)?(闰)?(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月)$/.test(str);

  const dayMatch = str.match(dayPattern);
  if (dayMatch && dayMatch[0] && dayMatch[1]) {
    let dayCn = dayMatch[0].split(dayMatch[1])[1]?.replace('日', '').trim() || '';
    day = parseLunarDayChars(dayCn);
  } else if (!isOnlyYearMonth) {
    const pureDayPattern = /(初[一二三四五六七八九十]|二十[一二三四五六七八九]?|三十|十[一二三四五六七八九]?|廿[一二三四五六七八九]?|卅)日?/;
    const pureDayMatch = str.match(pureDayPattern);
    if (pureDayMatch && pureDayMatch[0]) {
      let dayCn = pureDayMatch[0].replace('日', '').trim();
      day = parseLunarDayChars(dayCn);
    }
  }

  if (month === null && day === null) {
    return null;
  }

  return { month: isLeapMonth && month !== null ? -month : month, day, isLeapMonth };
}

// ===================== 公历（阿拉伯数字）月日解析 =====================

/**
 * 解析公历（阿拉伯数字）月份和日期
 * 格式：3月、03月、29日、29号
 * @returns MonthDayResult 或 null（无匹配）
 */
function parseGregorianMonthDay(str: string): MonthDayResult | null {
  let month: number | null = null;
  let day: number | null = null;

  // 月份解析：匹配 "3月" 或 "03月"
  const monthPattern = /(\d{1,2})月/;
  const monthMatch = str.match(monthPattern);
  if (monthMatch && monthMatch[1]) {
    const m = parseInt(monthMatch[1], 10);
    if (m >= 1 && m <= 12) {
      month = m;
    }
  }

  // 日期解析：匹配 "29日" 或 "29号"
  const dayPattern = /(\d{1,2})[日号]/;
  const dayMatch = str.match(dayPattern);
  if (dayMatch && dayMatch[1]) {
    const d = parseInt(dayMatch[1], 10);
    if (d >= 1 && d <= 31) {
      day = d;
    }
  }

  if (month === null && day === null) {
    return null;
  }

  return { month, day, isLeapMonth: false };
}

// ===================== 年号纪年解析 =====================

/**
 * 年号纪年解析结果
 */
interface EraParseResult {
  eraName: string;        // 帝王+年号
  eraYear: number;        // 年数
  ganzhiYear?: string;    // 干支年
  ganzhiMonth?: string;   // 干支月
  ganzhiDay?: string;     // 干支日
  month?: number;         // 中文数字月
  day?: number;           // 中文数字日
}

/**
 * 检查是否为年号纪年格式
 * 特征：包含"X年"或"元年"，且"年"前不是纯阿拉伯数字
 */
function hasEraMarkers(str: string): boolean {
  // 匹配：元年、X年（X为中文数字或干支）
  // 排除：纯阿拉伯数字年（如 618年、1949年）
  const eraYearPattern = /(元年|[一二三四五六七八九十廿卅]+年)/;
  return eraYearPattern.test(str);
}

/**
 * 解析年号纪年字符串
 *
 * 格式：[君主谥号|庙号]+[年号]+[年数]+[干支年]+[干支月]+[中文数字月]+[干支日]+[中文数字日]
 *
 * 示例：
 * - 明太祖洪武元年戊申
 * - 元世祖至元八年辛巳月乙亥日
 * - 梁简文帝大宝二年三月十七日
 * - 梁简文帝大宝二年三月戊戌日
 * - 梁简文帝大宝二年三月十七戊戌
 */
function parseEraTime(str: string, validator?: EraValidator): EraParseResult | null {
  // 匹配年号格式：帝王名+年号+(元|中文数字)年
  // 例如：明太祖洪武元年、梁简文帝大宝二年、元世祖至元八年
  const eraPattern = /^(.+?)(元|[一二三四五六七八九十廿卅]+)年/;
  const eraMatch = str.match(eraPattern);

  if (!eraMatch) {
    return null;
  }

  const eraName = eraMatch[1];  // 帝王+年号
  const yearCn = eraMatch[2];   // 元 或 中文数字

  // 如果提供了验证器，验证年号
  if (validator && !validator(eraName)) {
    return null;
  }

  const eraYear = parseChineseNumber(yearCn);
  if (eraYear === null) {
    return null;
  }

  const result: EraParseResult = {
    eraName,
    eraYear
  };

  // 剩余部分（去掉帝王+年号+X年）
  const remaining = str.slice(eraMatch[0].length);

  // 解析干支年（紧跟在"年"后面的干支，但不能后跟"月"）
  const ganzhiYearMatch = remaining.match(new RegExp(`^(${GANZHI_LIST.join('|')})(?!月)`));
  let afterGanzhiYear = remaining;
  if (ganzhiYearMatch) {
    result.ganzhiYear = ganzhiYearMatch[1];
    afterGanzhiYear = remaining.slice(ganzhiYearMatch[0].length);
  }

  // 解析月份部分
  // 可能的格式：干支月、中文数字月、或两者组合

  // 检测干支月（X月 或 X，其中X是干支）
  const ganzhiMonthWithSuffix = afterGanzhiYear.match(new RegExp(`(${GANZHI_LIST.join('|')})月`));
  let afterMonth = afterGanzhiYear;

  if (ganzhiMonthWithSuffix) {
    result.ganzhiMonth = ganzhiMonthWithSuffix[1];
    afterMonth = afterGanzhiYear.slice(ganzhiMonthWithSuffix.index! + ganzhiMonthWithSuffix[0].length);
  } else {
    // 检测中文数字月
    const cnMonthPattern = /(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月)/;
    const cnMonthMatch = afterGanzhiYear.match(cnMonthPattern);
    if (cnMonthMatch) {
      result.month = LUNAR_MONTH_MAP[cnMonthMatch[1]];
      afterMonth = afterGanzhiYear.slice(cnMonthMatch.index! + cnMonthMatch[0].length);
    }
  }

  // 解析日期部分
  // 可能的格式：中文数字日+干支日、干支日+中文数字日、仅中文数字日、仅干支日

  // 先检测中文数字日（初一、十五、廿三、三十等）
  const cnDayPattern = /(初[一二三四五六七八九十]|二十[一二三四五六七八九]?|三十|十[一二三四五六七八九]|廿[一二三四五六七八九]?|卅)日?/;
  const cnDayMatch = afterMonth.match(cnDayPattern);

  // 检测干支日
  const ganzhiDayPattern = new RegExp(`(${GANZHI_LIST.join('|')})日?`);
  const ganzhiDayMatch = afterMonth.match(ganzhiDayPattern);

  if (cnDayMatch) {
    const dayCn = cnDayMatch[1];
    result.day = parseLunarDayChars(dayCn);
  }

  if (ganzhiDayMatch) {
    result.ganzhiDay = ganzhiDayMatch[1];
  }

  return result;
}

// ===================== 格式一致性检查 =====================

/**
 * 检查是否存在农历月日标记
 */
function hasLunarMonthDayMarkers(str: string): boolean {
  // 中文月份关键字
  const lunarMonthKeywords = /正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|冬月|腊月/;
  // 中文日期关键字（初X、十X、廿X、卅、二十X、三十）
  // 注意：需要排除 "十一月"、"十二月" 等月份
  const lunarDayKeywords = /初[一二三四五六七八九十]|廿[一二三四五六七八九]?|卅|(?<!\d)二十[一二三四五六七八九]?(?![日号月])|(?<!\d)三十(?![日号月])|(?<!十)十[一二三四五六七八九](?!月)/;

  return lunarMonthKeywords.test(str) || lunarDayKeywords.test(str);
}

/**
 * 检查是否存在公历月日标记
 */
function hasGregorianMonthDayMarkers(str: string): boolean {
  // 阿拉伯数字月份
  const gregorianMonthPattern = /\d{1,2}月/;
  // 阿拉伯数字日期
  const gregorianDayPattern = /\d{1,2}[日号]/;

  return gregorianMonthPattern.test(str) || gregorianDayPattern.test(str);
}

/**
 * 检查是否存在闰月标记（带阿拉伯数字）
 */
function hasLeapMonthWithArabic(str: string): boolean {
  return /闰\d+月/.test(str);
}

// ===================== 主解析函数 =====================

/**
 * 解析中国古代/现代时间字符串
 *
 * 支持格式：
 * - 农历：618年五月初一、前202年正月廿一、闰四月十五
 * - 公历：57年3月29日、1949年10月1号
 * - 年号纪年：明太祖洪武元年戊申、梁简文帝大宝二年三月十七日
 *
 * 规则：
 * - 年号纪年 → era（优先检测）
 * - 中文月日 → 农历 (lunar)
 * - 阿拉伯数字月日 → 公历 (gregorian)
 * - 仅年份 → 不确定 (unknown)
 * - 月日格式混用 → 返回空值
 * - 闰月+阿拉伯数字 → 返回空值
 *
 * @param timeStr 待解析时间字符串
 * @param options 解析选项
 * @returns ParsedTime
 */
export function parseTimeString(timeStr: string | null | undefined, options?: ParseOptions): ParsedTime {
  const emptyResult: ParsedTime = { year: null, month: null, day: null, calendarType: 'unknown' };

  // 空值/无意义内容
  if (!timeStr || ['', '???', '??', '?', '未知', '无'].includes(String(timeStr).trim())) {
    return emptyResult;
  }

  const normalizedStr = String(timeStr).trim();

  // ===== 优先检测年号纪年格式 =====
  if (hasEraMarkers(normalizedStr)) {
    const eraResult = parseEraTime(normalizedStr, options?.eraValidator);
    if (eraResult) {
      const result: ParsedTime = {
        year: null,  // 年号纪年不返回公元年
        month: eraResult.month ?? null,
        day: eraResult.day ?? null,
        calendarType: 'era',
        eraName: eraResult.eraName,
        eraYear: eraResult.eraYear,
        ganzhiYear: eraResult.ganzhiYear,
        ganzhiMonth: eraResult.ganzhiMonth,
        ganzhiDay: eraResult.ganzhiDay
      };
      return result;
    }
  }

  // 检查闰月+阿拉伯数字混用
  if (hasLeapMonthWithArabic(normalizedStr)) {
    return emptyResult;
  }

  // 检查月日格式混用
  const hasLunar = hasLunarMonthDayMarkers(normalizedStr);
  const hasGregorian = hasGregorianMonthDayMarkers(normalizedStr);

  if (hasLunar && hasGregorian) {
    // 月日格式混用，返回空值
    return emptyResult;
  }

  // ===== 年份解析（通用） =====
  let year: number | null = null;
  const bcPattern = /前(\d+)年/;
  const adPattern = /(?<!前)(\d+)年/;

  const bcMatch = normalizedStr.match(bcPattern);
  if (bcMatch && bcMatch[1]) {
    year = -parseInt(bcMatch[1], 10);
  } else {
    const adMatch = normalizedStr.match(adPattern);
    if (adMatch && adMatch[1]) {
      year = parseInt(adMatch[1], 10);
    }
  }

  // ===== 月日解析 =====
  let month: number | null = null;
  let day: number | null = null;
  let calendarType: CalendarType = 'unknown';

  if (hasLunar) {
    const lunarResult = parseLunarMonthDay(normalizedStr);
    if (lunarResult) {
      month = lunarResult.month;
      day = lunarResult.day;
      calendarType = 'lunar';
    }
  } else if (hasGregorian) {
    const gregorianResult = parseGregorianMonthDay(normalizedStr);
    if (gregorianResult) {
      month = gregorianResult.month;
      day = gregorianResult.day;
      calendarType = 'gregorian';
    }
  }
  // 如果没有月日信息，calendarType 保持 'unknown'

  return { year, month, day, calendarType };
}

/**
 * 处理时间区间字符串，提取起始和终止时间
 * @param timeRangeStr 待解析时间区间字符串
 * @param options 解析选项
 * @returns [起始时间, 终止时间]
 */
export function parseTimeRangeString(
  timeRangeStr: string | null | undefined,
  options?: ParseOptions
): [ParsedTime | null, ParsedTime | null] {
  if (typeof timeRangeStr !== 'string') {
    return [null, null];
  }

  const parts = timeRangeStr.split('-').map(part => part.trim());

  if (parts.length === 2) {
    const startStr = parts[0];
    const endStr = parts[1];

    const startTime = parseTimeString(startStr, options);
    const endTime = parseTimeString(endStr, options);

    // 补全终止时间的年份（如果缺失且不是年号纪年）
    if (endTime.calendarType !== 'era' && endTime.year === null && startTime.year !== null) {
      endTime.year = startTime.year;
    }
    // 补全终止时间的月份（如果有日期但无月份）
    if (endTime.month === null && endTime.day !== null && startTime.month !== null) {
      endTime.month = startTime.month;
    }
    // 补全终止时间的 calendarType（如果为 unknown 且起始时间有明确类型）
    if (endTime.calendarType === 'unknown' && startTime.calendarType !== 'unknown') {
      endTime.calendarType = startTime.calendarType;
    }

    return [startTime, endTime];
  } else if (parts.length === 1 && parts[0].length > 0) {
    const startTime = parseTimeString(parts[0], options);
    return [startTime, { ...startTime }];
  } else {
    return [null, null];
  }
}

/**
 * 导出干支相关常量（供外部使用）
 */
export const GANZHI = {
  TIANGAN,
  DIZHI,
  LIST: GANZHI_LIST,
  PATTERN: GANZHI_PATTERN
};