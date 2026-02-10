/**
 * ccalendar - 中国农历计算库
 *
 * 提供公历与农历之间的转换、格式化输出等功能。
 */

// 导出主类
export { ChineseCalendar } from './ChineseCalendar.js';

// 导出文本输出函数
export { ChineseCalendarRender } from './ChineseCalendarRender.js';

// 导出HTML输出函数
export { ChineseCalendarHtmlRender } from './ChineseCalendarHtmlRender.js';

// 导出类型
export type {
  GanZhi,
  MonthGanZhi,
  LunarDate,
  LunarMonth,
  CalVars,
  MoonPhases,
  YearExportData,
  MonthExportData,
  DayExportData,
  MoonPhaseDetails,
  SolarTermDetails,
  CalendricalSolarTermDetails,
  ChineseDateFormatConfig,
  LocaleData,
} from './types.js';

// 导出常量
export { 
  ChineseCalendarType,
  WesternCalendarType,
  SolarTermsType,
  CalendricalSolarTermType,
  CALENDAR_RANGE_MIN_YEAR,
  CALENDAR_RANGE_MAX_YEAR
} from './types.js';

// 导出语言包（供高级用户自定义使用）
export { zhHans, zhHant, en, getLocale } from './locales/index.js';

// 导出核心工具函数（供高级用户使用）
export {
  // from ./core/utilities
  getJD,
  nDaysofGregJul,
  isNewMoonCloseToMidnight,
  getSexagenaryYear,
  getSexagenaryDay,
  getLeapPrefix,
  makeDate,
  isSameDate,

  // from ./core/calendar-id
  getWesternCalendarBookByYear,
  getAncientCalendarBooksByYear,
  getCalendarRegionsByYear,
  correctAncientCalendarBookByYear,
  correctCalendarRegionByYear,
  correctCalendarByYear,
  isDefaultRegionCalendar,

  // from ./core/calendar-calculate
  calYearData,

  // from ./core/eclipses-calculate
  calMoonPhases,
  calLunarEclipses,
  calSolarEclipses,
  getMoonPhasesByMonth,

  // from ./core/solar-terms-calculate
  calSolarTerms,
  getSolarTermsByMonth,

  // from ./core/calendrical-solar-terms-calculate
  calCalendricalSolarTerms,
  getCalendricalSolarTermsByMonth,

} from './core/index.js';