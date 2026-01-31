/**
 * ccalendar - 中国农历计算库
 *
 * 提供公历与农历之间的转换、格式化输出等功能。
 */

// 导出主类
export { ChineseCalendar } from './ChineseCalendar.js';

// 导出HTML输出函数
export { yearDataToHtml } from './output-html.js';

// 导出类型
export type {
  LunarDate,
  LunarMonthInfo,
  DateFormatConfig,
  CalVars,
  MoonPhase,
  SolarTerm,
  DayData,
  MonthExportData,
  YearExportData,
  HtmlLocaleLabels,
  CalendricalSolarTermGroup,
  LocaleData,
  CalendarConfig,
  SupportedLocale
} from './types.js';

// 导出常量
export { CALENDAR_RANGE_MIN_YEAR, CALENDAR_RANGE_MAX_YEAR } from './types.js';

// 导出语言包（供高级用户自定义使用）
export { zhHans, zhHant, en, getLocale } from './locales/index.js';

// 导出核心工具函数（供高级用户使用）
export {
  getSexagenaryYear,
  getSexagenaryDay,
  getFirstMonthNum,
  calDataYear,
  getJD,
  nDaysofGregJul,
  isDefaultRegionCalendar,
  correctCalendarByYear,
  correctAncientCalendarBookByYear,
  correctCalendarRegionByYear,
  getAncientCalendarBooksByYear,
  getCalendarRegionsByYear
} from './core/index.js';
