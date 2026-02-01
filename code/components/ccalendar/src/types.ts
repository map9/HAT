/**
 * ccalendar - Chinese Calendar TypeScript Library
 * Type Definitions
 */

/** 年份范围常量 */
export const CALENDAR_RANGE_MAX_YEAR = 2200;
export const CALENDAR_RANGE_MIN_YEAR = -721;

/** 支持的语言 */
export type SupportedLocale = 'zh-Hans' | 'zh-Hant' | 'en';

/** 干支数组类型: [天干索引, 地支索引] */
export type GanZhi = [number, number];

/** 月干支类型：可能为干支数组、'noZhong'（无中气）或 null（无法计算） */
export type MonthGanZhi = GanZhi | 'noZhong' | null;

/** 农历日期对象 */
export interface LunarDate {
  /** 农历年份（负数表示公元前） */
  year: number;
  /** 农历月份（1-12） */
  month: number;
  /** 农历日期（1-30） */
  day: number;
  /** 是否闰月 */
  isLeap: boolean;
  /** 是否岁首月份 */
  isFirstMonth: boolean;
  /** 年干支 */
  ganzhiYear: GanZhi;
  /** 月干支 */
  ganzhiMonth: MonthGanZhi;
  /** 日干支 */
  ganzhiDay: GanZhi;
  /** 月大小：0=小月(29天), 1=大月(30天) */
  monthSize: number;
  /** 旧闰月标志（用于古代历法） */
  oldLeap: string;
  /** 儒略日 */
  jd: number;
}

/** 农历月份信息 */
export interface LunarMonthInfo {
  /** 农历月数（1-12） */
  monthNum: number;
  /** 是否闰月 */
  isLeap: boolean;
  /** 农历月描述（如"正月"） */
  month: string;
  /** 月初一对应的公历日期 */
  date: Date;
  /** 本月天数 */
  nDays: number;
  /** 对应的公历年 */
  gYear: number;
}

/** 日期格式化配置 */
export interface DateFormatConfig {
  /** 年份格式 */
  year?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
  /** 月份格式 */
  month?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
  /** 日期格式 */
  day?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
}

/**
 * 日历计算变量
 */
export interface CalVars {
  /**
   * 公历年
   * like Year: -300
   */
  year: number;
  /**
   * 过去一年的12月30日午夜的儒略日，加上12月31日，和1月1日午夜的儒略日差整整两天。
   * 很有意思，不知道为什么要用这个时间。后面使用这个参数时，也加了2天。为什么不一开始就用1月1日的时间呢。
   * like: 1611481
   */
  jd0: number;
  /**
   * 各月累计天数
   * Gregorian/Julian的月份距离1月1日的偏移量，一共13个数据项
   * like: [0,  31,  60,  91, 121, 152, 182, 213, 244, 274, 305, 335, 366]
   */
  mday: number[];
  /** 
   * 农历月起始日偏移
   * 中国农历月份起始日与Gregorian/Julian的1月1日的偏移量，一共13～14个数据项
   * like: [-18,  11,  41,  70, 100, 129, 159, 189, 218, 248, 277, 307, 336, 366]
   */
  cmonthDate: number[];
  /**
   * 夏历年标记
   * 中国农历夏历的月份区分标记，夏历以寅月为岁首，
   * 0：表示为前一个农历年的月份, 1：表示是当前农历年的月份, 2：表示是下一个农历年的月份，一共13～14个数据项
   * like: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  */
  cmonthXiaYear: number[];
  /** 
   * 夏历月建
   * 中国农历夏历的月建， 1为寅， 2为卯， ...， 负数表示闰月，一共13～14个数据项
   * like: [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
   */
  cmonthJian: number[];
  /**
   * 指定历法下的农历月顺序
   * 月份顺序号，1为第一月，2为第二月，...，一共13～14个数据项
   * [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2]
   */
  cmonthNum: number[];
  /** 
   * 指定历法下的农历年标记 
   * 不同朝代和时期，采用的岁首可能也不一样，有采用子正，丑正，寅正（夏历），这个是指定历书下的农历年区分标记
   * 0：表示为前一个农历年的月份, 1：表示是当前农历年的月份, 2：表示是下一个农历年的月份
   * 由于历法的调整，岁首发生变化，会出现从按照农历夏历的11月开始到下一个农历的11月的一年，也会出现15个月的一年。
   * 一共13～14个数据项
   * like: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2]
   */
  cmonthYear: number[];
  /** 
   * 月大小标记 
   * 对应中国农历月份大小区分标记，0：小月 <30天，1：大月 =30天
   * 一共13～14个数据项
   * like: [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0]
   */
  cmonthLong: number[];
  /**
   * 24节气时间
   * 中国农历的24节气时间，从'小寒'开始到'小寒'结束，单位: 天数，从距离Gregorian/Julian的1月1日零点零分(UTC+8)开始计算
   * 一共24个数据项
   * like [8.35625, 23.20347222222222, 38.15486111111111, ...],
   */
  solar: number[];
  /**
   * 无中气月索引（可选）
   * -1为无无中气月索引
   */
  noZhong?: number;
  /**
   * 历书平气时间（可选）
   * 中国农历的24节气时间，从'小寒'开始到'小寒'结束，单位: 天数，从距离Gregorian/Julian的1月1日零点零分(UTC+8)开始计算
   * 一共24个数据项
   * like [9, 25, 40, 55, 70, 86, 101, 116, 131, 146, 162, 177, 192, 207, 223, 238, 253, 268, 283, 299, 314, 329, 344, 360]
   */
  pingqi?: number[];
  /** 岁首月份（可选）
   * 岁首的月份为cmonthNum的数据
   */
  firstMonthNum?: number;
  /** 闰月类型（可选）
   * 'leap' or 'post 9'
   */
  leap?: string;
  /**
   * 新月时间
   * 单位: 天数，从距离Gregorian/Julian的1月1日零点零分(UTC+8)开始计算
   * 一共12～13个数据项
   * like [12.4125, 42.172222222222224, 71.82291666666667, 101.33819444444444, ...]
   */
  Q0: number[];
  /**
   * 上弦月时间
   * 一共12～13个数据项
   */
  Q1: number[];
  /**
   * 满月时间
   * 一共12～13个数据项
   */
  Q2: number[];
  /**
   * 下弦月时间
   * 一共12～13个数据项
   */
  Q3: number[];
  /** 日食数据 */
  sol_eclipse: number[][];
  /** 月食数据 */
  lun_eclipse: number[][];
}

/** 月相数据 */
export interface MoonPhase {
  /** 月相类型：0=新月, 1=上弦, 2=满月, 3=下弦 */
  phase: number;
  /** 月相名称 */
  phaseName: string;
  /** 在月中的天数 */
  day: number;
  /** 小时数 */
  hours: number;
  /** 格式化时间 */
  time: { hour: string; minute: string };
  /** 日月食信息（可选） */
  eclipse?: {
    type: number;
    typeName: string;
    ybeg: number;
    ind: number;
  };
}

/** 节气数据 */
export interface SolarTerm {
  /** 节气ID (0-23) */
  id: number;
  /** 节气名称 */
  name: string;
  /** 在月中的天数 */
  day: number;
  /** 小时数 */
  hours: number;
  /** 格式化时间 */
  time: { hour: string; minute: string };
}

/** 每日数据 */
export interface DayData {
  /** 公历日期 */
  day: number;
  /** 星期几（0=日, 6=六） */
  dayOfWeek: number;
  /** 农历日期信息 */
  chineseDate: {
    monthOrder: number;
    monthNum: number;
    /** 完整月份描述（如"正月大（建戊寅）"） */
    month: string;
    /** 简短月份名（如"正月"、"闰八月"），用于初一显示 */
    monthShort: string;
    day: number;
    /** 农历日文字（如"初四"、"十五"） */
    dayText: string;
    isFirstMonth: boolean;
    isMonthStart: boolean;
  };
  /** 干支信息 */
  sexagenary: {
    day: GanZhi;
    /** 日干支文字（如"庚寅"） */
    dayText: string;
    month: MonthGanZhi;
  };
}

/** 历书节气组 */
export interface CalendricalSolarTermGroup {
  /** 标题（如"历书节气(平气)"） */
  label: string;
  /** 节气列表 */
  terms: Array<{ name: string; day: number }>;
}

/** 月份导出数据 */
export interface MonthExportData {
  /** 公历年 */
  year: number;
  /** 公历月（0-11） */
  month: number;
  /** 月份名称 */
  monthName: string;
  /** 包含的农历月 */
  chineseMonths: Array<{
    yearIndex: number;
    year: string;
    month: string;
    monthNum: number;
    isLeap: boolean;
  }>;
  /** 每日数据 */
  days: DayData[];
  /** 月相数据 */
  moonPhases: MoonPhase[];
  /** 节气数据 */
  solarTerms: SolarTerm[];
  /** 历书节气（可选，用于HTML输出） */
  calendricalSolarTerms?: CalendricalSolarTermGroup[];
  /** 警告/注释消息（可选，用于HTML输出） */
  warningMessage?: string;
}

/** HTML输出所需的本地化标签 */
export interface HtmlLocaleLabels {
  /** 星期名称 [星期日, ..., 星期六] */
  weeks: string[];
  /** 公历月份名称 ["1 月", "2 月", ...] */
  monthNames: string[];
  /** 月相标签（如"月相"） */
  moonPhasesLabel: string;
  /** 24节气标签（如"24节气"） */
  solarTermsLabel: string;
  /** 西历名称（如"儒略历"） */
  westernCalendar: string;
  /** 公历年标签（如"公历年"） */
  yearLabel: string;
  /** 农历年标签（如"农历年"） */
  lunarYearLabel: string;
  /** 是否需要DE441后缀（year < 1734） */
  de441: boolean;
}

/** 年份导出数据 */
export interface YearExportData {
  /** 公历年 */
  year: number;
  /** 格式化的公历年文字（如"575年"、"前722年"） */
  yearText: string;
  /** 包含的农历年干支 */
  cyears: GanZhi[];
  /** 格式化的农历年全名（含干支、生肖、帝王纪年） */
  lunarYearNames: string[];
  /** 农历年分界日期 */
  cdates: Array<{ month: number; day: number }>;
  /** 额外信息（历史年代说明） */
  additionalInfo?: string;
  /** 帝王/政权纪年名称（每个农历年一个） */
  eraNames?: string[];
  /** HTML输出所需的本地化标签 */
  locale?: HtmlLocaleLabels;
  /** 预格式化的HTML年份头部（公历年+农历年信息） */
  yearHeaderHtml?: string;
  /** 格式化的干支年字符串（3个：year-1, year, year+1） */
  cyearStrings?: string[];
  /** 农历月的年份索引映射（calVars.cmonthYear 原始数组） */
  cmonthYearMap?: number[];
  /** 12个月的数据 */
  months: MonthExportData[];
}

/** 语言包结构 */
export interface LocaleData {
  monthNames: Record<string, string>;
  weeks: Record<string, string>;
  heavens: Record<string, string>;
  earths: Record<string, string>;
  animals: Record<string, string>;
  monthNumbers: Record<string, string>;
  dayNumbers: Record<string, string>;
  moonStatuses: Record<string, string>;
  monthSizes: Record<string, string>;
  soltermNames: Record<string, string>;
  eclipseNames: Record<string, string>;
  leap: Record<string, string>;
  years: Record<string, string>;
  yearExpressions: Record<string, string>;
  monthExpressions: Record<string, string>;
  dayExpressions: Record<string, string>;
  dateExpressions: Record<string, string>;
  /** 西历名称 */
  westernCalendar: Record<string, string>;
  /** 年份历史信息 */
  yearInfos: Record<string, string>;
  /** 历史注释 */
  notes: Record<string, string>;
  /** HTML标签 */
  htmlLabels: Record<string, string>;
  /** 年份HTML模板 */
  yearHtmls: Record<string, string>;
}

/** ChineseCalendar 构造函数配置 */
export interface CalendarConfig {
  /** 语言 */
  locale?: SupportedLocale;
  /** 调试模式 */
  debug?: boolean;
}
