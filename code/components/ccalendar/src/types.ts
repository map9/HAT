/**
 * ccalendar - Chinese Calendar TypeScript Library
 * Type Definitions
 */

/** 年份范围常量 */
export const CALENDAR_RANGE_MAX_YEAR = 2200;
export const CALENDAR_RANGE_MIN_YEAR = -721;

/** 中国农历历书或者政权 */
export enum ChineseCalendarType {
  DEFAULT = 'default',
  // 三皇五帝/夏商
  HUANGDI = 'Huangdi',
  ZHUANXU = 'Zhuanxu',
  SPRING_XIA = 'Spring.Xia',
  YIN = 'Yin',
  // 周/春秋/鲁
  ZHOU = 'Zhou',
  CHUNQIU = 'Chunqiu',
  LU = 'Lu',
  // 战国
  WARRING_XIA = 'Warring.Xia',
  HAN_ZHUANXU = 'HanZhuanxu',
  // 三国
  TKI_WEI = 'Tki.Wei',
  TKI_SHU = 'Tki.Shu',
  TKI_WU = 'Tki.Wu',
  // 晋
  JIN = 'Jin',
  // 南北朝 - 南朝
  SOUTHNORTH_SOUTH_JIN = 'SouthNorth.South.Jin',
  SOUTHNORTH_SOUTH_SONG = 'SouthNorth.South.Song',
  SOUTHNORTH_SOUTH_QI = 'SouthNorth.South.Qi',
  SOUTHNORTH_SOUTH_LIANG = 'SouthNorth.South.Liang',
  SOUTHNORTH_SOUTH_CHEN = 'SouthNorth.South.Chen',
  // 南北朝 - 北朝
  SOUTHNORTH_NORTH_LATERQIN = 'SouthNorth.North.LaterQin',
  SOUTHNORTH_NORTH_NORTHERNLIANG = 'SouthNorth.North.NorthernLiang',
  SOUTHNORTH_NORTH_NORTHERNWEI = 'SouthNorth.North.NorthernWei',
  SOUTHNORTH_NORTH_WESTERNWEI = 'SouthNorth.North.WesternWei',
  SOUTHNORTH_NORTH_NORTHERNZHOU = 'SouthNorth.North.NorthernZhou',
  SOUTHNORTH_NORTH_SUI = 'SouthNorth.North.Sui',
  SOUTHNORTH_NORTH_EASTERNWEI = 'SouthNorth.North.EasternWei',
  SOUTHNORTH_NORTH_NORTHERNQI = 'SouthNorth.North.NorthernQi',
  // 宋辽金元
  SONGLIAOJINYUAN_LATERHAN = 'SongLiaoJinYuan.LaterHan',
  SONGLIAOJINYUAN_LATERZHOU = 'SongLiaoJinYuan.LaterZhou',
  SONGLIAOJINYUAN_SONG = 'SongLiaoJinYuan.Song',
  SONGLIAOJINYUAN_LIAO = 'SongLiaoJinYuan.Liao',
  SONGLIAOJINYUAN_JIN = 'SongLiaoJinYuan.Jin',
  SONGLIAOJINYUAN_MONGOL = 'SongLiaoJinYuan.Mongol',
  SONGLIAOJINYUAN_YUAN = 'SongLiaoJinYuan.Yuan',
  // 清
  QING_QING = 'Qing.Qing',
  QING_SOUTHERNMING = 'Qing.SouthernMing',
  QING_ZHENG = 'Qing.Zheng',
}

export enum WesternCalendarType {
  DEFAULT = 'default',
  GREGORIAN = 'gregorian',
  REFORM = 'reform',
  JULIAN = 'julian',
  PROLEPTIC_JULIAN = 'prolepticJulian'
}

export enum SolarTermsType {
  DE441 = 'DE441',
  DE431 = 'DE431'
}

export enum CalendricalSolarTermType {
  PINGQI = 'pingqi',
  DINGQI = 'dingqi',
}

export enum LeapPrefixType {
  /** 闰月 */
  LEAP = 'leap',
  /** 后九月 */
  POST9 = 'post 9',
  /** 闰某月 */
  LEAPX = 'leapx',
}


/** 干支数组类型: [天干索引, 地支索引] */
export type GanZhi = [number, number];

/** 月干支类型：可能为干支数组、'noZhong'（无中气）或 null（无法计算） */
export type MonthGanZhi = GanZhi | 'noZhong' | null;

/** 农历日期对象 */
export interface LunarDate {
  /** 农历年份（负数表示公元前） */
  cYear: number;
  /** 农历月份（1-12） */
  cMonth: number;
  /** 月大小：0=小月(29天), 1=大月(30天) */
  cMonthSize: number;
  /** 农历日期（1-30） */
  cDay: number;
  /** 年干支 */
  heYear: GanZhi;
  /** 月干支 */
  heMonth: MonthGanZhi;
  /** 日干支 */
  heDay: GanZhi;
  /** 儒略日 */
  jd: number;
  /** 是否岁首月份 */
  isFirstMonth?: boolean;
  /** 如果是闰月，闰月的前缀类型 */
  leap?: LeapPrefixType;
}

/** 农历月份信息 */
export interface LunarMonth {
  /** 月初一对应的公历日期 */
  date: Date;
  /** 对应的公历年 */
  cMonth: number,
  heMonth: MonthGanZhi,
  cMonthSize: number,
  /** 本月天数 */
  nDays: number,
  /** 是否岁首月份 */
  isFirstMonth?: boolean,
  /** 如果是闰月，闰月的前缀类型 */
  leap?: LeapPrefixType;
}

/**
 * 日历计算变量
 */
export interface CalVars {
  calendar: ChineseCalendarType;
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
}

/** 月相数据 */
export interface MoonPhases {
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
}

/** 月相数据 */
export interface MoonPhaseDetails {
  /** 月相类型：0=新月, 1=上弦, 2=满月, 3=下弦 */
  phase: number;
  /** 在月中的天数 */
  day: number;
  /** 小时数 */
  hours: number;
  /** 日月食信息（可选） */
  eclipse?: {
    /** 日月食类型 */
    type: number;
    /** 日月食发生的年份 */
    ybeg: number;
    /** 日月食序号 */
    ind: number;
  };
}

/** 节气数据 */
export interface SolarTermDetails {
  /** 节气ID (0-23) */
  id: number;
  /** 在月中的天数 */
  day: number;
  /** 小时数 */
  hours: number;
}

/** 历书节气数据 */
export interface CalendricalSolarTermDetails {
  calendarBook?: string;
  type: CalendricalSolarTermType;
  solarTermsDetails: SolarTermDetails[];
}

/** 日导出数据 */
export interface DayExportData {
  /** 公历日期 */
  day: number;
  /** 星期几（0=日, 6=六） */
  dayOfWeek: number;
  /** 农历日期信息 */
  chineseDate: {
    cMonthIndex: number;
    heDay: GanZhi;
    cDay: number;
  };
}

/** 月导出数据 */
export interface MonthExportData {
  /** 公历年 */
  year: number;
  /** 公历月（0-11） */
  month: number;
  /** 包含的农历月 */
  cSpanMonths: Array<{
    cYearIndex: number,
    cMonth: number,
    heMonth: MonthGanZhi,
    cMonthSize: number,
    isFirstMonth?: boolean,
    leap?: LeapPrefixType,
  }>;
  /** 每日数据 */
  cDays: DayExportData[];
  /** 月相数据 */
  moonPhasesDetails?: MoonPhaseDetails[];
  /** 节气数据来源类型 */
  solarTermsType?: 'DE441';
  /** 节气数据 */
  solarTermsDetails?: SolarTermDetails[];
  /** 历书平气数据 */
  calendricalSolarTermDetails?: CalendricalSolarTermDetails[];
}

/** 年份导出数据（纯数据，不包含格式化内容） */
export interface YearExportData {
  calendar: ChineseCalendarType,
  /** 公历年 */
  year: number;
  /** 包含的农历年 */
  cSpanYears: Array<{
    /** 农历年 */
    cYear: number;
    /** 农历年干支 */
    heYear: GanZhi,
    /** 岁首公历日期 */
    date?: { month: number; day: number };
    /** 帝王/政权纪年名称（每个农历年一个） */
    eraNames?: string;
  }>;
  /** 12个月的数据 */
  cMonths: MonthExportData[];
}

/** 日期格式化配置 */
export interface ChineseDateFormatConfig {
  /** 年份格式 */
  year?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
  /** 月份格式 */
  month?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
  /** 日期格式 */
  day?: 'none' | 'short' | 'short.ganZhi' | 'normal' | 'normal.ganZhi' | 'full';
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
  moonPhases: Record<string, string>;
  monthSizes: Record<string, string>;
  solarTermNames: Record<string, string>;
  eclipseNames: Record<string, string>;
  leap: Record<string, string>;
  calenderNames: Record<string, string>;
  pingqi: Record<string, string>;
  /** 西历名称 */
  westernCalendar: Record<string, string>;
  /** 农历名称 */
  chineseCalendar: Record<string, string>;
  yearExpressions: Record<string, string>;
  monthExpressions: Record<string, string>;
  dayExpressions: Record<string, string>;
  dateExpressions: Record<string, string>;
  mixedExpressions: Record<string, string>;
  
  /** 年份HTML模板 */
  yearHtmls: Record<string, string>;
}