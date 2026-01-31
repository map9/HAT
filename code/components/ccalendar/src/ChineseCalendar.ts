/**
 * ChineseCalendar 中国农历类
 *
 * 提供公历与农历之间的转换、格式化输出等功能。
 * 移除了 i18next 依赖，使用内置语言包。
 */

import type {
  LunarDate,
  LunarMonthInfo,
  DateFormatConfig,
  CalVars,
  MoonPhase,
  SolarTerm,
  DayData,
  MonthExportData,
  YearExportData,
  CalendricalSolarTermGroup,
  LocaleData,
  CalendarConfig,
  SupportedLocale
} from './types.js';

import { CALENDAR_RANGE_MIN_YEAR, CALENDAR_RANGE_MAX_YEAR } from './types.js';
import { getLocale } from './locales/index.js';
import {
  calDataYear,
  getSexagenaryYear,
  getSexagenaryDay,
  getFirstMonthNum,
  correctCalendarByYear,
  isDefaultRegionCalendar,
  nDaysofGregJul,
  calendricalSolarTerms_ystart,
  calendricalSolarTerms,
  getJD
} from './core/index.js';
import { eraName } from './eras.js';

/**
 * 模板字符串替换
 */
function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : '';
  });
}

/**
 * 格式化小时数为HH:MM格式
 */
function convertHoursToHHMM(hours: number): [string, string] {
  const totalHours = hours % 24;
  const hh = Math.floor(totalHours);
  const mm = Math.round((totalHours - hh) * 60);
  return [String(hh).padStart(2, '0'), String(mm).padStart(2, '0')];
}

/**
 * 判断新月是否接近午夜
 */
function newMoonCloseToMidnight(year: number, month: number): boolean {
  const midnights = [2057, 9, 2089, 8, 2097, 7, 2115, 2, 2116, 4, 2133, 9, 2165, 11, 2172, 9];
  for (let i = 0; i < midnights.length / 2; i++) {
    if (midnights[2 * i] === year && midnights[2 * i + 1] === month) {
      return true;
    }
  }
  return false;
}

/**
 * 获取指定公历月份的月相数据
 */
function getMoonPhases(month: number, calVars: CalVars): Array<{ phase: number; time: number; eclipse: any }> {
  const m0 = calVars.mday[month];
  const m1 = calVars.mday[month + 1];

  const phases: Array<{ phase: number; time: number; eclipse: any }> = [];

  // new moon
  for (let i = 0; i < calVars.Q0.length; i++) {
    const dd = Math.floor(calVars.Q0[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse: any = {};
      calVars.sol_eclipse.forEach((e: number[]) => {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (calVars.year - 0.5));
          if (calVars.year === eclipse.ybeg && e[1] > 200) {
            eclipse.ybeg -= 100;
          } else if (calVars.year - eclipse.ybeg === 99 && e[1] < 200) {
            eclipse.ybeg += 100;
          }
          eclipse.ind = e[1];
          eclipse.type = e[2];
        }
      });
      phases.push({ phase: 0, time: calVars.Q0[i] - m0, eclipse });
    }
  }

  // first quarter
  for (let i = 0; i < calVars.Q1.length; i++) {
    const dd = Math.floor(calVars.Q1[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 1, time: calVars.Q1[i] - m0, eclipse: {} });
    }
  }

  // full moon
  for (let i = 0; i < calVars.Q2.length; i++) {
    const dd = Math.floor(calVars.Q2[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse: any = {};
      calVars.lun_eclipse.forEach((e: number[]) => {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (calVars.year - 0.5));
          eclipse.ind = e[1];
          eclipse.type = 4 + e[2];
        }
      });
      phases.push({ phase: 2, time: calVars.Q2[i] - m0, eclipse });
    }
  }

  // third quarter
  for (let i = 0; i < calVars.Q3.length; i++) {
    const dd = Math.floor(calVars.Q3[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 3, time: calVars.Q3[i] - m0, eclipse: {} });
    }
  }

  // sort events in chronological order
  phases.sort((a, b) => a.time - b.time);

  // Correct for Gregorian calendar reform
  // Oct 1582 has only 21 days; The day after Oct 4 was Oct 15
  if (m1 - m0 < 25) {
    for (let i = 0; i < phases.length; i++) {
      phases[i].time += phases[i].time >= 5.0 ? 10.0 : 0.0;
    }
  }

  return phases;
}

/**
 * 获取指定公历月份的24节气数据
 */
function get24SolarTerms(month: number, calVars: CalVars): Array<{ id: number; day: number; hours: number }> {
  const m0 = calVars.mday[month];
  const m1 = calVars.mday[month + 1];

  const solars: Array<{ id: number; day: number; hours: number }> = [];
  for (let i = 0; i < calVars.solar.length; i++) {
    const dd = Math.floor(calVars.solar[i]);
    if (dd > m0 && dd <= m1) {
      const h = 24.0 * (calVars.solar[i] - dd);
      let d = dd - m0;
      // Correct for Gregorian calendar reform
      if (m1 - m0 < 25) {
        d += d > 4 ? 10 : 0;
      }
      solars.push({ id: i, day: d, hours: h });
    }
  }

  return solars;
}

export class ChineseCalendar {
  private locale: LocaleData;
  private localeName: SupportedLocale;

  // 缓存的本地化数组
  private monthNames: string[] = [];
  private weeks: string[] = [];
  private heavens: string[] = [];
  private earths: string[] = [];
  private animals: string[] = [];
  private monthNumbers: string[] = [];
  private dayNumbers: string[] = [];
  private moonStatuses: string[] = [];
  private monthSizes: string[] = [];
  private soltermNames: string[] = [];
  private eclipseNames: string[] = [];

  constructor(config: CalendarConfig = {}) {
    this.localeName = config.locale || 'zh-Hans';
    this.locale = getLocale(this.localeName);
    this._rebuildLanguageResource();
  }

  /**
   * 切换语言
   */
  setLanguage(lng: SupportedLocale): void {
    this.localeName = lng;
    this.locale = getLocale(lng);
    this._rebuildLanguageResource();
  }

  /**
   * 获取当前语言
   */
  getLanguage(): SupportedLocale {
    return this.localeName;
  }

  /**
   * 重构语言资源数组
   */
  private _rebuildLanguageResource(): void {
    this.monthNames = Array.from({ length: 12 }, (_, i) => this.locale.monthNames[String(i)]);
    this.weeks = Array.from({ length: 7 }, (_, i) => this.locale.weeks[String(i)]);
    this.heavens = Array.from({ length: 10 }, (_, i) => this.locale.heavens[String(i)]);
    this.earths = Array.from({ length: 12 }, (_, i) => this.locale.earths[String(i)]);
    this.animals = Array.from({ length: 12 }, (_, i) => this.locale.animals[String(i)]);
    this.monthNumbers = Array.from({ length: 12 }, (_, i) => this.locale.monthNumbers[String(i)]);
    this.dayNumbers = Array.from({ length: 30 }, (_, i) => this.locale.dayNumbers[String(i)]);
    this.moonStatuses = Array.from({ length: 4 }, (_, i) => this.locale.moonStatuses[String(i)]);
    this.monthSizes = Array.from({ length: 2 }, (_, i) => this.locale.monthSizes[String(i)]);
    this.soltermNames = Array.from({ length: 25 }, (_, i) => this.locale.soltermNames[String(i)]);
    this.eclipseNames = Array.from({ length: 7 }, (_, i) => this.locale.eclipseNames[String(i)]);
  }

  /**
   * 获取月份的干支
   */
  private getSexagenaryMonth(year: number, order: number, calVars: CalVars): [number, number] | string | null {
    const he = getSexagenaryYear(year - 1);

    if (calVars.cmonthNum[order] > 0 && year > -104) {
      return [
        (12 * (he[0] + calVars.cmonthXiaYear[order]) + calVars.cmonthJian[order] + 1) % 10,
        (calVars.cmonthJian[order] + 1) % 12
      ];
    }

    if (year <= -104) {
      if ('noZhong' in calVars && (calVars as any).noZhong === order) {
        return 'noZhong';
      }
    }

    return null;
  }

  /**
   * 格式化农历月份
   */
  private formatChineseMonth(
    year: number,
    cmonthNum: number,
    heMonth: [number, number] | string | null,
    cmonthLong: number,
    oldLeap: string,
    monthExpressions: string
  ): string {
    if (!monthExpressions) return '';

    // 获取leap在不同时期的叫法
    let leap = this.locale.leap['leap'];
    if (year === -104) {
      leap = this.locale.leap['post'];
    } else if (year < -104) {
      if (oldLeap === 'post 9') {
        leap = this.locale.leap['post9'];
      }
    }

    let cmonth = this.monthNumbers[Math.abs(cmonthNum) - 1];
    if (year >= -104) {
      if (cmonthNum < 0) {
        cmonth = leap + cmonth;
      }

      if (year > 688 && year < 700 && Math.abs(cmonthNum) === 11) {
        cmonth = this.monthNumbers[0];
      }
      if (year > 689 && year < 701 && Math.abs(cmonthNum) === 1) {
        cmonth = this.locale.monthNumbers['-1'];
      }
    } else {
      if (cmonthNum < 0) {
        cmonth = leap;
      }
    }

    if (monthExpressions === 'short') {
      return interpolate(this.locale.monthExpressions['short'], { month: cmonth });
    }

    if (heMonth && Array.isArray(heMonth)) {
      if (monthExpressions === 'short.ganZhi') {
        return interpolate(this.locale.monthExpressions['short.ganZhi'], {
          heaven: this.heavens[heMonth[0]],
          earth: this.earths[heMonth[1]]
        });
      } else if (monthExpressions === 'normal.ganZhi') {
        return interpolate(this.locale.monthExpressions['normal.ganZhi'], {
          heaven: this.heavens[heMonth[0]],
          earth: this.earths[heMonth[1]],
          size: this.monthSizes[cmonthLong]
        });
      } else if (monthExpressions === 'normal') {
        return interpolate(this.locale.monthExpressions['normal'], {
          month: cmonth,
          size: this.monthSizes[cmonthLong]
        });
      } else if (monthExpressions === 'full') {
        return interpolate(this.locale.monthExpressions['full'], {
          month: cmonth,
          heaven: this.heavens[heMonth[0]],
          earth: this.earths[heMonth[1]],
          size: this.monthSizes[cmonthLong]
        });
      }
    }

    if (heMonth && monthExpressions === 'full') {
      return interpolate(this.locale.monthExpressions['full.noZhong'], {
        month: cmonth,
        size: this.monthSizes[cmonthLong]
      });
    }

    if (monthExpressions === 'short.ganZhi') {
      return interpolate(this.locale.monthExpressions['short'], { month: cmonth });
    } else if (
      monthExpressions === 'normal' ||
      monthExpressions === 'normal.ganZhi' ||
      monthExpressions === 'full'
    ) {
      return interpolate(this.locale.monthExpressions['normal'], {
        month: cmonth,
        size: this.monthSizes[cmonthLong]
      });
    }

    return '';
  }

  /**
   * 获取公历年中包含的农历月份
   */
  private getChineseMonthsFromMonth(
    year: number,
    month: number,
    calVars: CalVars
  ): { orders: number[]; cmonths: string[] } {
    let j = 0;
    const cMonths: string[] = [];
    const orders: number[] = [];
    const m0 = calVars.mday[month];
    const m1 = calVars.mday[month + 1];

    // 前一个农历月
    for (let i = 0; i < calVars.cmonthDate.length; i++) {
      if (calVars.cmonthDate[i] <= m0 + 1 && calVars.cmonthDate[i + 1] > m0 + 1) {
        const heMonth = this.getSexagenaryMonth(year, i, calVars);
        const cMonth = this.formatChineseMonth(
          year,
          calVars.cmonthNum[i],
          heMonth as [number, number] | null,
          calVars.cmonthLong[i],
          calVars.leap ?? '',
          'full'
        );
        cMonths.push(cMonth);
        orders.push(i);
        j = i + 1;
        break;
      }
    }

    // 后一个农历月
    for (let i = j; i < calVars.cmonthDate.length; i++) {
      if (calVars.cmonthDate[i] > m0 + 1 && calVars.cmonthDate[i] <= m1) {
        const heMonth = this.getSexagenaryMonth(year, i, calVars);
        const cMonth = this.formatChineseMonth(
          year,
          calVars.cmonthNum[i],
          heMonth as [number, number] | null,
          calVars.cmonthLong[i],
          calVars.leap ?? '',
          'full'
        );
        cMonths.push(cMonth);
        orders.push(i);
      }
    }

    return { orders, cmonths: cMonths };
  }

  /**
   * 获取某一天的农历日期信息
   */
  private getChineseDateFromDay(
    year: number,
    month: number,
    day: number,
    firstMonths: number[],
    calVars: CalVars
  ): { order: number; cmonthNum: number; cDay: number; isFirstMonth: boolean } {
    const dd = calVars.mday[month] + day;

    let order: number | null = null;
    for (let i = 0; i < calVars.cmonthDate.length - 1; i++) {
      if (dd >= calVars.cmonthDate[i] && dd < calVars.cmonthDate[i + 1]) {
        order = i;
      }
    }
    if (order === null) {
      order = calVars.cmonthDate.length - 1;
    }

    const cm = calVars.cmonthNum[order];
    const cd = dd - calVars.cmonthDate[order] + 1;

    let cmIsFirstMonth = cm === firstMonths[calVars.cmonthYear[order]];

    // 跨岁首变更年份
    if (year === -103 || year === 700) {
      cmIsFirstMonth = false;
    }

    return { order, cmonthNum: cm, cDay: cd, isFirstMonth: cmIsFirstMonth };
  }

  /**
   * 将农历年份转换为字符串
   */
  private lunarYearToString(lunarYear: number): string {
    return lunarYear < 1
      ? interpolate(this.locale.years['bce'], { year: 1 - lunarYear })
      : interpolate(this.locale.years['ce'], { year: lunarYear });
  }

  /**
   * 从公历年起始日偏移量计算公历日期
   * 这里面存在一个问题，javascript中的Date在1582之前，采用的是逆推格里历
   * 本历法在公元7年 ～ 公元1581年采用的是儒勒历，公元7年前，采用的是逆推儒勒历
   * 格里历没有闰月，儒勒历有。因此，会出现：
   * -300年2月29日在逆推格里历中不存在的问题。同样，
   *  700年2月29日也有类似的问题。
   */
  private _computeGregorianDateFromDays(
    gYear: number,
    daysFromYearStart: number,
    calVars: CalVars
  ): Date {
    let gMonth = 0;
    for (let j = 0; j < 12; j++) {
      if (daysFromYearStart > calVars.mday[j]) {
        gMonth = j + 1;
      } else {
        break;
      }
    }

    let gDay = daysFromYearStart - calVars.mday[gMonth - 1];

    if (gYear === 1582 && gMonth === 10 && gDay >= 5) {
      gDay = gDay + 10;
    }

    const date = new Date(2000, 0, 1, 0, 0, 0, 0);
    date.setFullYear(gYear);
    date.setMonth(gMonth - 1);
    date.setDate(gDay);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 将公历日期转换为农历日期
   * @param date - 公历日期对象
   * @param region - 历法区域（默认 'default'）
   * @returns 农历日期对象
   */
  getChineseDateFromGregorian(date: Date, region: string = 'default'): LunarDate | null {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      let day = date.getDate();

      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      // 1582年10月的特殊处理
      if (year === 1582 && month === 9) {
        if (day >= 15 && day <= 31) {
          day = day - 10;
        } else if (day >= 5 && day <= 14) {
          throw new Error('Date does not exist in Gregorian calendar due to reform');
        }
      }

      const correctedRegion = correctCalendarByYear(year, region);
      const calVars = calDataYear(year, correctedRegion);
      const daysInYear = calVars.mday[month] + day;

      let chineseMonthIndex = -1;
      for (let i = 0; i < calVars.cmonthDate.length; i++) {
        if (daysInYear >= calVars.cmonthDate[i]) {
          chineseMonthIndex = i;
        } else {
          break;
        }
      }

      if (chineseMonthIndex === -1) {
        return null;
      }

      const chineseYear = calVars.cmonthYear[chineseMonthIndex];
      const chineseMonth = calVars.cmonthNum[chineseMonthIndex];
      const isLeapMonth = chineseMonth < 0;
      const chineseDay = daysInYear - calVars.cmonthDate[chineseMonthIndex] + 1;
      const actualYear = year + chineseYear - 1;

      const ganzhiYear = getSexagenaryYear(actualYear);
      const ganzhiMonth = this.getSexagenaryMonth(year, chineseMonthIndex, calVars);
      const ganzhiDay = getSexagenaryDay(month, day, calVars.mday, calVars.jd0);
      const jd = calVars.jd0 + daysInYear;

      return {
        year: actualYear,
        month: Math.abs(chineseMonth),
        monthSize: calVars.cmonthLong[chineseMonthIndex],
        day: chineseDay,
        oldLeap: calVars.leap ?? '',
        isLeap: isLeapMonth,
        // 改元年（如-103年颛顼历→太初历、700年武周）公历年内没有岁首，
        // 老历法岁首在前一年，新历法岁首在后一年，因此该年所有月份 isFirstMonth 均为 false
        isFirstMonth:
          (year === -103 || year === 700)
            ? false
            : Math.abs(chineseMonth) === (getFirstMonthNum(actualYear) ?? calVars.firstMonthNum ?? 1) && !isLeapMonth,
        ganzhiYear,
        ganzhiMonth: ganzhiMonth as [number, number] | null,
        ganzhiDay,
        jd
      };
    } catch (e) {
      console.error('getChineseDateFromGregorian error:', e, date);
      return null;
    }
  }

  /**
   * 将农历日期转换为公历日期
   * @param year - 农历年份
   * @param month - 农历月份，按照夏历来确定的月份，也就是建寅为一月。
   * @param day - 农历日期
   * @param isLeap - 是否为闰月
   * @param ganzhiMonth - 月份干支数组，用于区分重复月份
   * @param region - 历法区域（默认 'default'）
   * @param jd - 儒略日，用于精确匹配唯一的公历日期
   * @returns 当jd不为null时返回单个Date对象；当jd为null时返回Date数组
   */
  getGregorianFromChineseDate(
    year: number,
    month: number,
    day: number,
    isLeap: boolean = false,
    ganzhiMonth: [number, number] | null = null,
    region: string = 'default',
    jd: number | null = null
  ): Date | Date[] | null {
    try {
      let matches: Array<{
        gYear: number;
        cmonthYear: number;
        daysFromYearStart: number;
        calVars: CalVars;
        index: number;
      }> = [];

      for (let gYear = year - 1; gYear <= year + 1; gYear++) {
        const correctedRegion = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, correctedRegion);

        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const actualYear = gYear + calVars.cmonthYear[i] - 1;
          const monthNum = Math.abs(calVars.cmonthNum[i]);
          const monthIsLeap = calVars.cmonthNum[i] < 0;

          if (actualYear === year && monthNum === month && monthIsLeap === isLeap) {
            if (ganzhiMonth !== null) {
              const actualGanzhiMonth = this.getSexagenaryMonth(gYear, i, calVars);
              if (actualGanzhiMonth && Array.isArray(actualGanzhiMonth)) {
                if (actualGanzhiMonth[0] !== ganzhiMonth[0] || actualGanzhiMonth[1] !== ganzhiMonth[1]) {
                  continue;
                }
              }
            }

            const daysFromYearStart = calVars.cmonthDate[i] + day - 1;
            matches.push({
              gYear,
              cmonthYear: calVars.cmonthYear[i],
              daysFromYearStart,
              calVars,
              index: i
            });
          }
        }
      }

      if (matches.length === 0) {
        throw new Error('No matching Chinese date found');
      }

      matches = matches.filter((m) => m.daysFromYearStart > 0);

      if (matches.length === 0) {
        throw new Error('All matches invalid (daysFromYearStart <= 0)');
      }

      if (jd !== null) {
        let bestMatch = null;
        let minDiff = Infinity;

        for (const match of matches) {
          const matchJd = match.calVars.jd0 + match.daysFromYearStart;
          const diff = Math.abs(matchJd - jd);

          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = match;
          }
        }

        if (minDiff > 0.5 || !bestMatch) {
          throw new Error('No matching date found within 0.5 days of the given jd');
        }

        return this._computeGregorianDateFromDays(bestMatch.gYear, bestMatch.daysFromYearStart, bestMatch.calVars);
      }

      return matches.map((match) => this._computeGregorianDateFromDays(match.gYear, match.daysFromYearStart, match.calVars));
    } catch (e) {
      console.error('getGregorianFromChineseDate error:', e);
      return null;
    }
  }

  /**
   * 获取指定农历年的岁首（公历日期）
   * @param year - 农历年份
   * @param region - 历法区域（默认 'default'）
   * @returns 岁首的公历日期
   */
  getChineseYearStart(year: number, region: string = 'default'): Date | null {
    try {
      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      let startYear = year - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = year + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      for (let gYear = startYear; gYear <= endYear; gYear++) {
        const correctedRegion = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, correctedRegion);
        const firstMonthNum = getFirstMonthNum(year) ?? calVars.firstMonthNum ?? 1;

        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const actualYear = gYear + calVars.cmonthYear[i] - 1;
          const monthNum = Math.abs(calVars.cmonthNum[i]);

          if (actualYear === year && monthNum === firstMonthNum) {
            const daysFromYearStart = calVars.cmonthDate[i];

            let gMonth = 0;
            for (let j = 0; j < 12; j++) {
              if (daysFromYearStart > calVars.mday[j]) {
                gMonth = j + 1;
              } else {
                break;
              }
            }

            const gDay = daysFromYearStart - calVars.mday[gMonth - 1];

            const date = new Date(2000, 0, 1, 0, 0, 0, 0);
            date.setFullYear(gYear);
            date.setMonth(gMonth - 1);
            date.setDate(gDay);
            date.setHours(0, 0, 0, 0);
            return date;
          }
        }
      }

      return null;
    } catch (e) {
      console.error('getChineseYearStart error:', e);
      return null;
    }
  }

  /**
   * 获取指定农历年对应的所有农历月份信息
   * @param year - 农历年份
   * @param region - 历法区域（默认 'default'）
   * @returns monthInfo数组
   */
  getChineseYearMonthInfo(year: number, region: string = 'default'): LunarMonthInfo[] | null {
    try {
      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      let startYear = year - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = year + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      const monthInfos: LunarMonthInfo[] = [];

      for (let gYear = startYear; gYear <= endYear; gYear++) {
        const correctedRegion = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, correctedRegion);

        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const actualChineseYear = gYear + calVars.cmonthYear[i] - 1;

          if (actualChineseYear === year) {
            const monthNum = Math.abs(calVars.cmonthNum[i]);
            const isLeap = calVars.cmonthNum[i] < 0;

            let nDays: number;
            if (i < calVars.cmonthDate.length - 1) {
              nDays = calVars.cmonthDate[i + 1] - calVars.cmonthDate[i];
            } else {
              nDays = calVars.mday[12] + 1 - calVars.cmonthDate[i];
            }

            if (calVars.cmonthDate[i] <= 0) {
              monthInfos[monthInfos.length - 1].nDays = nDays;
              continue;
            }

            const heMonth = this.getSexagenaryMonth(gYear, i, calVars);
            const monthDesc = this.formatChineseMonth(
              year,
              calVars.cmonthNum[i],
              heMonth as [number, number] | null,
              calVars.cmonthLong[i],
              calVars.leap ?? '',
              'short'
            );

            const daysFromYearStart = calVars.cmonthDate[i];
            const gregorianDate = this._computeGregorianDateFromDays(gYear, daysFromYearStart, calVars);

            if (i === calVars.cmonthDate.length - 1 && gYear !== gregorianDate.getFullYear()) {
              continue;
            }

            monthInfos.push({
              monthNum,
              isLeap,
              month: monthDesc,
              date: gregorianDate,
              nDays,
              gYear
            });
          }
        }
      }

      return monthInfos;
    } catch (e) {
      console.error('getChineseYearMonthInfo error:', e);
      return null;
    }
  }

  /**
   * 将农历日期格式化为字符串
   * @param lunarDate - 农历日期对象
   * @param config - 输出配置
   * @returns 本地化的农历日期字符串
   */
  lunarDateToString(lunarDate: LunarDate | null, config: DateFormatConfig = {}): string {
    if (!lunarDate) return '';

    const { year: yearFormat = 'none', month: monthFormat = 'none', day: dayFormat = 'none' } = config;

    let year = '';
    if (yearFormat === 'short') {
      year = interpolate(this.locale.yearExpressions['short'], {
        year: this.lunarYearToString(lunarDate.year)
      });
    } else if (yearFormat === 'short.ganZhi') {
      year = interpolate(this.locale.yearExpressions['short.ganZhi'], {
        heaven: this.heavens[lunarDate.ganzhiYear[0]],
        earth: this.earths[lunarDate.ganzhiYear[1]]
      });
    } else if (yearFormat === 'normal') {
      year = interpolate(this.locale.yearExpressions['normal'], {
        year: this.lunarYearToString(lunarDate.year),
        shengxiao: this.animals[lunarDate.ganzhiYear[1]]
      });
    } else if (yearFormat === 'normal.ganZhi') {
      year = interpolate(this.locale.yearExpressions['normal.ganZhi'], {
        heaven: this.heavens[lunarDate.ganzhiYear[0]],
        earth: this.earths[lunarDate.ganzhiYear[1]],
        shengxiao: this.animals[lunarDate.ganzhiYear[1]]
      });
    } else if (yearFormat === 'full') {
      year = interpolate(this.locale.yearExpressions['full'], {
        year: this.lunarYearToString(lunarDate.year),
        heaven: this.heavens[lunarDate.ganzhiYear[0]],
        earth: this.earths[lunarDate.ganzhiYear[1]],
        shengxiao: this.animals[lunarDate.ganzhiYear[1]]
      });
    }

    const month = monthFormat === 'none'
      ? ''
      : this.formatChineseMonth(
          lunarDate.year,
          lunarDate.isLeap ? -lunarDate.month : lunarDate.month,
          lunarDate.ganzhiMonth,
          lunarDate.monthSize,
          lunarDate.oldLeap,
          monthFormat
        );

    let day = '';
    if (dayFormat === 'short') {
      day = interpolate(this.locale.dayExpressions['short'], {
        day: this.dayNumbers[lunarDate.day - 1]
      });
    } else if (dayFormat === 'short.ganZhi') {
      day = interpolate(this.locale.dayExpressions['short.ganZhi'], {
        heaven: this.heavens[lunarDate.ganzhiDay[0]],
        earth: this.earths[lunarDate.ganzhiDay[1]]
      });
    } else if (dayFormat === 'normal') {
      day = interpolate(this.locale.dayExpressions['normal'], {
        day: this.dayNumbers[lunarDate.day - 1]
      });
    } else if (dayFormat === 'normal.ganZhi') {
      day = interpolate(this.locale.dayExpressions['normal.ganZhi'], {
        heaven: this.heavens[lunarDate.ganzhiDay[0]],
        earth: this.earths[lunarDate.ganzhiDay[1]]
      });
    } else if (dayFormat === 'full') {
      day = interpolate(this.locale.dayExpressions['full'], {
        day: this.dayNumbers[lunarDate.day - 1],
        heaven: this.heavens[lunarDate.ganzhiDay[0]],
        earth: this.earths[lunarDate.ganzhiDay[1]]
      });
    }

    return (
      year +
      (year.length > 0 && month.length > 0 ? ' ' : '') +
      month +
      (month.length > 0 && day.length > 0 ? ' ' : '') +
      day
    );
  }

  /**
   * 通过公历年来判断当时的历法书名称
   */
  getWesternCalendarBookByYear(year: number): string {
    if (year > 1582) {
      return this.locale.westernCalendar['now'];
    } else if (year === 1582) {
      return this.locale.westernCalendar['1582'];
    } else if (year > 7) {
      return this.locale.westernCalendar['7'];
    } else {
      return this.locale.westernCalendar['early'];
    }
  }

  /**
   * 获取指定年份的历史日历说明信息
   */
  getYearCalenderInfo(year: number, region: string | null): string | null {
    let info: string | null = null;

    if (year >= -220 && year <= -103) {
      info = this.locale.yearInfos['qinEarlyHan'];
    }
    if (year >= 9 && year <= 23) {
      info = this.locale.yearInfos['xin'];
      if (year === 23) {
        info += this.locale.yearInfos['xin24'];
      }
    }
    if (year >= 237 && year <= 240 && isDefaultRegionCalendar(region, year)) {
      info = this.locale.yearInfos['wei'];
    }
    if (year >= 689 && year <= 700) {
      info = this.locale.yearInfos['wuZhou'];
    }
    if (year === 761 || year === 762) {
      info = this.locale.yearInfos['tang'];
    }
    if (year === 1582) {
      info = this.locale.yearInfos['gCalenderReform'];
    }
    if (year > 1666.5 && year < 1670.5 && isDefaultRegionCalendar(region, year)) {
      info = this.locale.yearInfos['qing'];
    }

    return info;
  }

  /**
   * 获取指定月份的历书节气数据
   */
  private getCalendricalSolarTermsData(
    month: number,
    region: string | null,
    calVars: CalVars,
    datong: number
  ): Array<{ name: string; day: number }> {
    let solar: number[];

    if (calVars.year >= -104) {
      if (calVars.pingqi) {
        solar = calVars.pingqi;
      } else {
        if (datong === 0) {
          const calSolTerms: any = calendricalSolarTerms();
          const ind = calVars.year - calendricalSolarTerms_ystart();
          solar = [...calSolTerms[ind]];
          const n = solar.length;
          for (let i = 1; i < n; i++) {
            solar[i] += solar[i - 1] + 14;
          }
          if (solar[0] < 3) {
            solar.push(calSolTerms[ind + 1][0] + nDaysofGregJul(calVars.year));
          }
        } else {
          // Datong solar terms for 1666-1669
          const ps = 365.2425;
          const JDw = 1721049.9175 + 1e-8;
          const jd0 = getJD(calVars.year - 1, 12, 31);
          const j = Math.floor((jd0 - JDw) / ps);
          const dqi = ps / 24.0;
          const J12 = JDw + j * ps - jd0 + dqi;
          solar = [];
          for (let i = 0; i < 25; i++) {
            solar.push(Math.floor(J12 + i * dqi));
          }
        }
      }
    } else {
      if (calVars.pingqi) {
        solar = calVars.pingqi;
      } else {
        return [];
      }
    }

    const m0 = calVars.mday[month];
    const m1 = calVars.mday[month + 1];
    const terms: Array<{ name: string; day: number }> = [];

    for (let i = 0; i < solar.length; i++) {
      const dd = solar[i];
      if (dd > m0 && dd <= m1) {
        let d = dd - m0;
        if (m1 - m0 < 25) {
          d += d > 4 ? 10 : 0;
        }
        terms.push({ name: this.soltermNames[i], day: d });
      }
    }

    return terms;
  }

  /**
   * 获取指定月份的历书节气组（包含标签）
   */
  private getCalendricalSolarTermGroups(
    month: number,
    year: number,
    region: string | null,
    calVars: CalVars
  ): CalendricalSolarTermGroup[] {
    if (year >= 1734) return [];

    const groups: CalendricalSolarTermGroup[] = [];

    // 判断标签
    let isSplit = false;
    if (calVars.year === 1667 && month > 0 && isDefaultRegionCalendar(region, calVars.year)) {
      isSplit = true;
    }
    if (calVars.year > 1667 && calVars.year < 1670 && isDefaultRegionCalendar(region, calVars.year)) {
      isSplit = true;
    }
    if (calVars.year === 1670 && month < 2 && isDefaultRegionCalendar(region, calVars.year)) {
      isSplit = true;
    }

    // 主要历书节气
    let label: string;
    if (isSplit) {
      label = this.locale.htmlLabels['xinfa'];
    } else if (calVars.year < 1645 || (calVars.year === 1645 && month === 0) || region === 'Qing.SouthernMing') {
      label = this.locale.htmlLabels['calSolTermsPingqi'];
    } else {
      label = this.locale.htmlLabels['calSolTermsDingqi'];
    }

    const terms = this.getCalendricalSolarTermsData(month, region, calVars, 0);
    if (terms.length > 0) {
      groups.push({ label, terms });
    }

    // 大统历节气（1666-1670特殊时期）
    if (isSplit && year > 1665.5 && year < 1670.5 && isDefaultRegionCalendar(region, year)) {
      const datongTerms = this.getCalendricalSolarTermsData(month, region, calVars, 1);
      if (datongTerms.length > 0) {
        groups.push({
          label: this.locale.htmlLabels['datong'],
          terms: datongTerms
        });
      }
    }

    return groups;
  }

  /**
   * 获取指定年月的警告/注释消息
   * 移植自 chinesecalendar 的 warningMessage 函数（简化版）
   */
  private getWarningMessage(year: number, month: number, region: string | null): string {
    // month is 0-indexed here, warningMessage uses 1-indexed
    const m = month + 1;
    let warn = '';

    // 公元前618年以前 - 部分注释
    if (year === -103 && m === 6) {
      if (this.localeName === 'zh-Hans') {
        warn = '五月起的日历依太初历，朔日比旧历早一日，使四月变成小月。';
      } else if (this.localeName === 'zh-Hant') {
        warn = '五月起的日曆依太初曆，朔日比舊曆早一日，使四月變成小月。';
      } else {
        warn = 'New calendar is displayed starting from month 5. The lunar conjunction day was one day earlier than that of the old calendar, turning month 4 into a short month.';
      }
    }

    // 575年9月 - 闰月注释（这是test-html.js的测试年份）
    if (year === 575 && m === 9 && region === 'SouthNorth.North.NorthernQi') {
      if (this.localeName === 'zh-Hans') {
        warn = '《三千五百年历日天象》附表3记这年北齐闰九月，与我计算的闰八月不一致，台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换网站</a>和汪曰桢的《历代长术辑要》也记这年闰八月，所以这里不取《三千五百年历日天象》的数据。';
      } else if (this.localeName === 'zh-Hant') {
        warn = '《三千五百年曆日天象》附表3記這年北齊閏九月，與我計算的閏八月不一致。';
      }
    }

    // 新月接近午夜的注释（2050年后）
    if (year > 2050) {
      // 简化处理
    }

    return warn;
  }

  /**
   * 按照指定的公历月份，输出这一月的公历和农历（JSON格式）
   * @param year - 公历年
   * @param month - 公历月份（0-11）
   * @param region - 历法区域
   * @param cyears - 干支年字符串数组
   * @param firstMonths - 岁首月份数组
   * @param calVars - 日历计算数据
   * @returns 月历数据对象
   */
  exportMonth(
    year: number,
    month: number,
    region: string | null,
    cyears: string[],
    firstMonths: number[],
    calVars: CalVars
  ): MonthExportData {
    const result = this.getChineseMonthsFromMonth(year, month, calVars);
    const nMonth = result.orders.length;
    const cmonths = result.cmonths;

    const json: MonthExportData = {
      year,
      month,
      monthName: this.monthNames[month],
      chineseMonths: [],
      days: [],
      moonPhases: [],
      solarTerms: []
    };

    // Add Chinese month information
    for (let i = 0; i < nMonth; i++) {
      const cyearIndex = calVars.cmonthYear[result.orders[i]];
      json.chineseMonths.push({
        yearIndex: cyearIndex,
        year: cyears[cyearIndex],
        month: cmonths[i],
        monthNum: calVars.cmonthNum[result.orders[i]],
        isLeap: calVars.cmonthNum[result.orders[i]] < 0
      });
    }

    // # of days in the month
    const n = calVars.mday[month + 1] - calVars.mday[month];

    // Day of week for the first day of month (0=Sunday, 6=Saturday)
    const week1 = (calVars.jd0 + calVars.mday[month] + 3) % 7;

    // Collect daily data
    for (let i = 1; i <= n; i++) {
      const dayOfWeek = (week1 + i - 1) % 7;

      // Gregorian date (handle 1582 Oct calendar reform)
      let gregorianDay = i;
      if (n <= 25 && i >= 5) {
        gregorianDay = i + 10;
      }

      // Get Chinese date
      const { order, cmonthNum, cDay, isFirstMonth } = this.getChineseDateFromDay(year, month, i, firstMonths, calVars);

      // Get sexagenary for month and day
      const heMonth = this.getSexagenaryMonth(year, order, calVars);
      const heDay = getSexagenaryDay(month, i, calVars.mday, calVars.jd0);

      // Format Chinese month (full and short)
      const cMonth = this.formatChineseMonth(
        year,
        calVars.cmonthNum[order],
        heMonth as [number, number] | null,
        calVars.cmonthLong[order],
        calVars.leap ?? '',
        'full'
      );
      const cMonthShort = this.formatChineseMonth(
        year,
        calVars.cmonthNum[order],
        heMonth as [number, number] | null,
        calVars.cmonthLong[order],
        calVars.leap ?? '',
        'short'
      );

      // Format day text and ganZhi text
      const dayText = this.dayNumbers[cDay - 1];
      const dayGanZhiText = interpolate(this.locale.dayExpressions['short.ganZhi'], {
        heaven: this.heavens[heDay[0]],
        earth: this.earths[heDay[1]]
      });

      const dayData: DayData = {
        day: gregorianDay,
        dayOfWeek,
        chineseDate: {
          monthOrder: order,
          monthNum: cmonthNum,
          month: cMonth,
          monthShort: cMonthShort,
          day: cDay,
          dayText,
          isFirstMonth,
          isMonthStart: cDay === 1
        },
        sexagenary: {
          day: heDay,
          dayText: dayGanZhiText,
          month: heMonth as [number, number] | null
        }
      };

      json.days.push(dayData);
    }

    // Add moon phases
    const phases = getMoonPhases(month, calVars);
    json.moonPhases = phases.map((p) => {
      const dayInMonth = Math.floor(p.time);
      const hours = 24.0 * (p.time - dayInMonth);
      const [hh, mm] = convertHoursToHHMM(hours);

      const phaseData: MoonPhase = {
        phase: p.phase,
        phaseName: this.moonStatuses[p.phase],
        day: dayInMonth,
        hours,
        time: { hour: hh, minute: mm }
      };

      if (Object.keys(p.eclipse).length !== 0) {
        phaseData.eclipse = {
          type: p.eclipse.type,
          typeName: this.eclipseNames[p.eclipse.type],
          ybeg: p.eclipse.ybeg,
          ind: p.eclipse.ind
        };
      }

      return phaseData;
    });

    // Add 24 solar terms
    const solars = get24SolarTerms(month, calVars);
    json.solarTerms = solars.map((s) => {
      const [hh, mm] = convertHoursToHHMM(s.hours);
      return {
        id: s.id,
        name: this.soltermNames[s.id],
        day: s.day,
        hours: s.hours,
        time: { hour: hh, minute: mm }
      };
    });

    // Add calendrical solar terms (for HTML output)
    const calSolGroups = this.getCalendricalSolarTermGroups(month, year, region, calVars);
    if (calSolGroups.length > 0) {
      json.calendricalSolarTerms = calSolGroups;
    }

    // Add warning message (for HTML output)
    const warn = this.getWarningMessage(year, month, region);
    if (warn) {
      json.warningMessage = warn;
    }

    return json;
  }

  /**
   * 按照指定的公历年，输出这一年的公历和农历（JSON格式）
   * @param year - 公历年
   * @param region - 历法区域（默认 'default'）
   * @returns 年历数据JSON字符串
   */
  exportYear(year: number, region: string = 'default'): string | null {
    if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
      return null;
    }

    const correctedRegion = correctCalendarByYear(year, region);
    const calVars = calDataYear(year, correctedRegion);

    // 通过calVars.cmonthYear计算year中包含的农历年个数
    const cyearCount = calVars.cmonthYear[calVars.cmonthYear.length - 1] - calVars.cmonthYear[0] + 1;

    // 获取岁首月份
    const firstMonths: number[] = [];
    for (let i = 0; i < 3; i++) {
      let firstMonth = getFirstMonthNum(year - 1 + i);
      if (firstMonth === null) {
        firstMonth = calVars.firstMonthNum ?? 1;
      }
      firstMonths.push(firstMonth);
    }

    // 获取农历年岁首的月和日
    const cSpanMonths: number[] = [];
    const cSpanDates: number[] = [];
    for (let i = 1; i < cyearCount; i++) {
      const yearNo = calVars.cmonthYear[0] + i;
      for (let j = 1; j < calVars.cmonthNum.length; j++) {
        if (calVars.cmonthYear[j] === yearNo && calVars.cmonthNum[j] === firstMonths[yearNo]) {
          const cSpanDays = calVars.cmonthDate[j];
          let cSpanMonth = 0;
          for (let k = 0; k < 13; k++) {
            if (cSpanDays <= calVars.mday[k]) {
              cSpanMonth = k;
              break;
            }
          }
          cSpanMonths.push(cSpanMonth);
          cSpanDates.push(cSpanDays - calVars.mday[cSpanMonth - 1]);
        }
      }
    }

    // 获取干支年
    const heYears: Array<[number, number]> = [];
    for (let i = 0; i < 3; i++) {
      heYears.push(getSexagenaryYear(year - 1 + i));
    }

    const cy0 = calVars.cmonthYear[0];

    // 格式化公历年文字
    const yearText = interpolate(this.locale.yearExpressions['short'], {
      year: this.lunarYearToString(year)
    });

    const json: YearExportData = {
      year,
      yearText,
      cyears: [],
      lunarYearNames: [],
      cdates: [],
      months: []
    };

    if (cyearCount >= 1) {
      json.cyears.push(heYears[cy0]);
    }

    if (cyearCount >= 2) {
      json.cyears.push(heYears[cy0 + 1]);
      json.cdates.push({ month: cSpanMonths[0], day: cSpanDates[0] });
    }

    if (cyearCount >= 3) {
      json.cyears.push(heYears[cy0 + 2]);
      json.cdates.push({ month: cSpanMonths[1], day: cSpanDates[1] });
    }

    // 帝王/政权纪年名称
    const eraNames: string[] = [];
    for (let i = 0; i < json.cyears.length; i++) {
      eraNames.push(eraName(this.localeName, year - 1 + cy0 + i, correctedRegion));
    }
    if (eraNames.some(e => e !== '')) {
      json.eraNames = eraNames;
    }

    // 格式化农历年全名（干支+生肖+帝王纪年）
    for (let i = 0; i < json.cyears.length; i++) {
      const heIdx = cy0 + i;
      const ganZhiAnimal = interpolate(this.locale.yearExpressions['normal.ganZhi'], {
        heaven: this.heavens[heYears[heIdx][0]],
        earth: this.earths[heYears[heIdx][1]],
        shengxiao: this.animals[heYears[heIdx][1]]
      });
      json.lunarYearNames.push(ganZhiAnimal + eraNames[i]);
    }

    // 年份历史说明
    const additionalInfo = this.getYearCalenderInfo(year, correctedRegion);
    if (additionalInfo) {
      json.additionalInfo = additionalInfo;
    }

    // HTML输出所需的本地化标签
    json.locale = {
      weeks: Array.from({ length: 7 }, (_, i) => this.locale.weeks[String(i)]),
      monthNames: this.monthNames,
      moonPhasesLabel: this.locale.htmlLabels['moonPhases'],
      solarTermsLabel: this.locale.htmlLabels['solarTerms'],
      westernCalendar: this.getWesternCalendarBookByYear(year),
      yearLabel: this.locale.htmlLabels['yearLabel'],
      lunarYearLabel: this.locale.htmlLabels['lunarYearLabel'],
      de441: year < 1734
    };

    // 预格式化HTML年份头部
    let yearHeaderHtml = interpolate(this.locale.yearHtmls['gregorian'], {
      yearLabel: json.locale.yearLabel,
      gcal: json.locale.westernCalendar,
      yearc: yearText
    });

    const lunarTemplateVars: Record<string, string | number> = {
      lunarLabel: json.locale.lunarYearLabel,
      name0: json.lunarYearNames[0] || ''
    };
    if (json.cdates.length >= 1) {
      lunarTemplateVars.month0 = this.monthNames[cSpanMonths[0] - 1];
      lunarTemplateVars.day0 = cSpanDates[0];
      lunarTemplateVars.name1 = json.lunarYearNames[1] || '';
    }
    if (json.cdates.length >= 2) {
      lunarTemplateVars.month1 = this.monthNames[cSpanMonths[1] - 1];
      lunarTemplateVars.day1 = cSpanDates[1];
      lunarTemplateVars.day1l = cSpanDates[1] - 1;
      lunarTemplateVars.name2 = json.lunarYearNames[2] || '';
    }

    if (cyearCount === 1) {
      yearHeaderHtml += interpolate(this.locale.yearHtmls['lunarOne'], lunarTemplateVars);
    } else if (cyearCount === 2) {
      if (year === 24) {
        yearHeaderHtml += interpolate(this.locale.yearHtmls['lunar24'], lunarTemplateVars);
      } else {
        yearHeaderHtml += interpolate(this.locale.yearHtmls['lunarTwo'], lunarTemplateVars);
      }
    } else if (cyearCount >= 3) {
      yearHeaderHtml += interpolate(this.locale.yearHtmls['lunarThree'], lunarTemplateVars);
    }

    json.yearHeaderHtml = yearHeaderHtml;

    const cyears: string[] = [];
    heYears.forEach((he) =>
      cyears.push(
        interpolate(this.locale.yearExpressions['short.ganZhi'], {
          heaven: this.heavens[he[0]],
          earth: this.earths[he[1]]
        })
      )
    );

    // 用于HTML月份表头的年份映射（与原始chinesecalendar行为一致）
    json.cyearStrings = cyears;
    json.cmonthYearMap = [...calVars.cmonthYear];

    for (let month = 0; month < 12; month++) {
      json.months.push(this.exportMonth(year, month, correctedRegion, cyears, firstMonths, calVars));
    }

    return JSON.stringify(json, null, 2);
  }
}
