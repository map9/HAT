/**
 * ChineseCalendar 中国农历类
 *
 * 提供公历与农历之间的转换、格式化输出等功能。
 * 移除了 i18next 依赖，使用内置语言包。
 */

import type {
  MonthGanZhi,
  LunarDate,
  LunarMonth,
  CalVars,
  YearExportData,
  MonthExportData,
  DayExportData,
} from './types.js';

import {
  ChineseCalendarType,
  SolarTermsType,
  LeapPrefixType,
  CALENDAR_RANGE_MIN_YEAR,
  CALENDAR_RANGE_MAX_YEAR,
} from './types.js';

import {
  getSexagenaryYear,
  getSexagenaryDay,
  getFirstMonthNum,
  getLeapPrefix,
  makeDate,
  correctCalendarByYear,
  calYearData,
  calMoonPhases,
  calLunarEclipses,
  calSolarEclipses,
  getMoonPhasesByMonth,
  calSolarTerms,
  getSolarTermsByMonth,
  calCalendricalSolarTerms,
  getCalendricalSolarTermsByMonth
} from './core/index.js';

export class ChineseCalendar {

  constructor() {
  }

  /**
   * 获取月份的干支
   */
  private getSexagenaryMonth(year: number, order: number, calVars: CalVars): MonthGanZhi {
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
   * 给定公历年的月份，获取所跨越的两个农历月份
   * 
   * @param month - 公历月份
   * @param mday - 公历月份所在 year 的月累计天数数组
   * @param cmonthDate - 公历月份所在 year 的农历月起始日偏移数组
   * @returns 农历月的序号
   */
  private getChineseMonthsByMonth(
    month: number,
    mday: number[],
    cmonthDate: number[]
  ): number[] {
    let j = 0;
    const orders: number[] = [];
    const m0 = mday[month];
    const m1 = mday[month + 1];

    // 前一个农历月
    for (let i = 0; i < cmonthDate.length; i++) {
      if (cmonthDate[i] <= m0 + 1 && cmonthDate[i + 1] > m0 + 1) {
        orders.push(i);
        j = i + 1;
        break;
      }
    }

    // 后一个农历月
    for (let i = j; i < cmonthDate.length; i++) {
      if (cmonthDate[i] > m0 + 1 && cmonthDate[i] <= m1) {
        orders.push(i);
      }
    }

    return orders;
  }

  /**
   * 获取公历年某一天的农历日期信息
   * 
   * @param month - 公历月
   * @param day - 公历日
   * @param mday - 公历日所在 year 的月累计天数数组
   * @param cmonthDate - 公历日所在 year 的农历月起始日偏移数组
   * @returns 
   * - order 农历月的序号。
   * - cDay 农历日。
   */
  private getChineseDateByDay(
    month: number,
    day: number,
    mday: number[],
    cmonthDate: number[]
  ): { order: number; cDay: number } {
    const dd = mday[month] + day;

    let order: number | null = null;
    for (let i = 0; i < cmonthDate.length - 1; i++) {
      if (dd >= cmonthDate[i] && dd < cmonthDate[i + 1]) {
        order = i;
      }
    }
    if (order === null) {
      order = cmonthDate.length - 1;
    }

    return { order, cDay: dd - cmonthDate[order] + 1 };
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
    year: number,
    daysFromYearStart: number,
    calVars: CalVars
  ): Date {
    let month = 0;
    for (let j = 0; j < 12; j++) {
      if (daysFromYearStart > calVars.mday[j]) {
        month = j + 1;
      } else {
        break;
      }
    }

    let day = daysFromYearStart - calVars.mday[month - 1];

    if (year === 1582 && month === 10 && day >= 5) {
      day = day + 10;
    }

    return makeDate(year, month, day);
  }

  /**
   * 将公历日期转换为农历日期
   * @param calendar - 历书或者政权名称
   * @param date - 公历日期对象
   * @returns 农历日期对象
   */
  getChineseDateFromGregorian(
    calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT,
    date: Date
  ): LunarDate | null {
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

      const correctedCalendarOrRegion = correctCalendarByYear(year, calendar);
      const calVars = calYearData(correctedCalendarOrRegion, year);
      const daysInYear = calVars.mday[month] + day;

      let cMonthOrder = -1;
      for (let i = 0; i < calVars.cmonthDate.length; i++) {
        if (daysInYear >= calVars.cmonthDate[i]) {
          cMonthOrder = i;
        } else {
          break;
        }
      }

      if (cMonthOrder === -1) {
        throw new Error(`can't find a chinese month`);
      }

      const cYear = year + calVars.cmonthYear[cMonthOrder] - 1;
      const cMonthNum = calVars.cmonthNum[cMonthOrder];
      const cDay = daysInYear - calVars.cmonthDate[cMonthOrder] + 1;

      const heYear = getSexagenaryYear(cYear);
      const heMonth = this.getSexagenaryMonth(year, cMonthOrder, calVars);
      const heDay = getSexagenaryDay(calVars.jd0 + calVars.mday[month] + day + 1);
      const jd = calVars.jd0 + daysInYear;

      if (cYear !== year) {
        console.log(`getChineseDateFromGregorian: year ${year} !== cYear ${cYear}.`);
      }

      return {
        cYear: cYear,
        cMonth: cMonthNum,
        cMonthSize: calVars.cmonthLong[cMonthOrder],
        cDay: cDay,
        heYear,
        heMonth: heMonth,
        heDay,
        jd,
        leap: getLeapPrefix(cYear, cMonthNum, calVars),
        // 改元年（如-103年颛顼历→太初历、700年武周）公历年内没有岁首，
        // 老历法岁首在前一年，新历法岁首在后一年，因此该年所有月份 isFirstMonth 均为 false
        isFirstMonth:
          (year === -103 || year === 700)
            ? false
            : Math.abs(cMonthNum) === (getFirstMonthNum(cYear) ?? calVars.firstMonthNum ?? 1) && (cMonthNum > 0),
      };
    } catch (e) {
      console.error('getChineseDateFromGregorian error:', e, date);
      return null;
    }
  }

  /**
   * 将农历日期转换为公历日期
   * @param calendar - 历书或者政权名称
   * @param cYear - 农历年份
   * @param cMonth - 农历月份，按照夏历来确定的月份，也就是建寅为一月。
   * @param cDay - 农历日期
   * @param heMonth - 月份干支数组，用于区分重复月份
   * @param jd - 儒略日，用于精确匹配唯一的公历日期
   * @returns 当 jd 不为 null 时返回单个 Date 对象；当 jd 为 null 时返回 Date 数组
   */
  getGregorianFromChineseDate(
    calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT, 
    cYear: number,
    cMonth: number,
    cDay: number,
    heMonth?: MonthGanZhi,
    jd?: number
  ): Date | Date[] | null {
    try {
      let matches: Array<{
        year: number;
        cmonthYear: number;
        daysFromYearStart: number;
        calVars: CalVars;
        index: number;
      }> = [];

      for (let year = cYear - 1; year <= cYear + 1; year ++) {
        const correctedCalendarOrRegion = correctCalendarByYear(year, calendar);
        const calVars = calYearData(correctedCalendarOrRegion, year);

        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const curCYear = year + calVars.cmonthYear[i] - 1;
          const curCMonthNum = Math.abs(calVars.cmonthNum[i]);

          if (curCYear === cYear && curCMonthNum === cMonth) {
            
            if (cYear !== year) {
              console.log(`getGregorianFromChineseDate: year ${year} !== cYear ${cYear}.`);
            }

            // 如果包含 heMonth/干支月 信息
            if (heMonth !== undefined) {
              // year or curCYear??
              const curHeMonth = this.getSexagenaryMonth(year, i, calVars);
              if (curHeMonth && Array.isArray(curHeMonth) && heMonth && Array.isArray(heMonth)) {
                if (curHeMonth[0] !== heMonth[0] || curHeMonth[1] !== heMonth[1]) {
                  continue;
                }
              }
              if (curHeMonth !== heMonth) {
                continue;
              }
            }

            const daysFromYearStart = calVars.cmonthDate[i] + cDay - 1;
            matches.push({
              year,
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
      // 如果包含 jd 信息
      if (jd !== undefined) {
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

        return this._computeGregorianDateFromDays(bestMatch.year, bestMatch.daysFromYearStart, bestMatch.calVars);
      }

      return matches.map((match) => this._computeGregorianDateFromDays(match.year, match.daysFromYearStart, match.calVars));
    } catch (e) {
      console.error('getGregorianFromChineseDate error:', e);
      return null;
    }
  }

  /**
   * 获取指定农历年的岁首（公历日期）
   * @param calendar - 历书或者政权名称
   * @param cYear - 农历年份
   * @returns 岁首的公历日期
   */
  getChineseYearStart(calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT, cYear: number): Date | null {
    try {
      if (isNaN(cYear) || cYear < CALENDAR_RANGE_MIN_YEAR || cYear > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      let startYear = cYear - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = cYear + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      for (let year = startYear; year <= endYear; year ++) {
        const correctedCalendarOrRegion = correctCalendarByYear(year, calendar);
        const calVars = calYearData(correctedCalendarOrRegion, year);
        const firstMonthNum = getFirstMonthNum(cYear) ?? calVars.firstMonthNum ?? 1;

        for (let i = 0; i < calVars.cmonthNum.length; i ++) {
          const curCYear = year + calVars.cmonthYear[i] - 1;
          const monthNum = Math.abs(calVars.cmonthNum[i]);

          if (curCYear === cYear && monthNum === firstMonthNum) {
            const daysFromYearStart = calVars.cmonthDate[i];

            let month = 0;
            for (let j = 0; j < 12; j++) {
              if (daysFromYearStart > calVars.mday[j]) {
                month = j + 1;
              } else {
                break;
              }
            }

            const day = daysFromYearStart - calVars.mday[month - 1];

            return makeDate(year, month, day);
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
  getChineseYearMonthInfo(calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT, cYear: number): LunarMonth[] | null {
    try {
      if (isNaN(cYear) || cYear < CALENDAR_RANGE_MIN_YEAR || cYear > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      let startYear = cYear - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = cYear + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      const lunarMonths: LunarMonth[] = [];

      for (let year = startYear; year <= endYear; year ++) {
        const correctedCalendarOrRegion = correctCalendarByYear(year, calendar);
        const calVars = calYearData(correctedCalendarOrRegion, year);

        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const curCYear = year + calVars.cmonthYear[i] - 1;

          if (curCYear === cYear) {
            const cMonthNum = calVars.cmonthNum[i];
            
            let nDays: number;
            if (i < calVars.cmonthDate.length - 1) {
              nDays = calVars.cmonthDate[i + 1] - calVars.cmonthDate[i];
            } else {
              nDays = calVars.mday[12] + 1 - calVars.cmonthDate[i];
            }

            if (calVars.cmonthDate[i] <= 0) {
              lunarMonths[lunarMonths.length - 1].nDays = nDays;
              continue;
            }

            const heMonth = this.getSexagenaryMonth(year, i, calVars);
            const daysFromYearStart = calVars.cmonthDate[i];
            const date = this._computeGregorianDateFromDays(year, daysFromYearStart, calVars);

            if (i === calVars.cmonthDate.length - 1 && year !== date.getFullYear()) {
              continue;
            }

            if (curCYear !== year) {
              console.log(`getChineseYearMonthInfo: year ${year} !== curCYear ${curCYear}.`);
            }

            lunarMonths.push({
              date: date,
              cMonth: Math.abs(cMonthNum),
              heMonth: heMonth,
              cMonthSize: calVars.cmonthLong[i],
              nDays,
              // 改元年（如-103年颛顼历→太初历、700年武周）公历年内没有岁首，
              // 老历法岁首在前一年，新历法岁首在后一年，因此该年所有月份 isFirstMonth 均为 false
              isFirstMonth:
                (year === -103 || year === 700)
                  ? false
                  : Math.abs(cMonthNum) === (getFirstMonthNum(cYear) ?? calVars.firstMonthNum ?? 1) && (cMonthNum > 0),
              // curCYear ? year ?
              leap: getLeapPrefix(curCYear, cMonthNum, calVars),
            });
          }
        }
      }

      return lunarMonths;
    } catch (e) {
      console.error('getChineseYearMonthInfo error:', e);
      return null;
    }
  }

  /**
   * 按照指定的公历月份，输出这一月的公历和农历（JSON格式）
   * @param year - 公历年
   * @param month - 公历月份（0-11）
   * @param calendar - 历书或者政权名称
   * @param cyears - 干支年字符串数组
   * @param firstMonths - 岁首月份数组
   * @param calVars - 日历计算数据
   * @returns 月历数据对象
   */
  exportMonth(
    year: number,
    month: number,
    firstMonths: number[],
    calVars: CalVars
  ): MonthExportData {
    const monthExportData: MonthExportData = {
      year,
      month,
      cSpanMonths: [],
      cDays: [],
    };

    // Add Chinese month information
    const orders = this.getChineseMonthsByMonth(month, calVars.mday, calVars.cmonthDate);
    for (let i = 0; i < orders.length; i ++) {
      const cYearIndex = calVars.cmonthYear[orders[i]] - calVars.cmonthYear[0];
      const cMonthNum = calVars.cmonthNum[orders[i]]
      const heMonth = this.getSexagenaryMonth(year, i, calVars)
      let isFirstMonth = cMonthNum === firstMonths[calVars.cmonthYear[orders[i]]];
      // 跨岁首变更年份
      if (year === -103 || year === 700) {
        isFirstMonth = false;
      }

      monthExportData.cSpanMonths.push({
        cYearIndex: cYearIndex,
        heMonth: heMonth,
        cMonth: cMonthNum,
        cMonthSize: calVars.cmonthLong[orders[i]],
        isFirstMonth: isFirstMonth,
        leap: getLeapPrefix(year, cMonthNum, calVars),
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
      let gDay = i;
      if (n <= 25 && i >= 5) {
        gDay = i + 10;
      }

      // Get Chinese date
      let cMonthIndex;
      const { order, cDay } = this.getChineseDateByDay(month, i, calVars.mday, calVars.cmonthDate);
      for (let n = 0; n < orders.length; n ++) {
        if (orders[n] === order) {
          cMonthIndex = n;
          break;
        }
      }
      if (cMonthIndex === undefined) {
        throw new Error(`Can't find cMonth in cSpanMonths`);
      }

      const heDay = getSexagenaryDay(calVars.jd0 + calVars.mday[month] + i + 1);
      const dayExportData: DayExportData = {
        day: gDay,
        dayOfWeek,
        chineseDate: {
          cMonthIndex: cMonthIndex!,
          heDay,
          cDay
        },
      };

      monthExportData.cDays.push(dayExportData);
    }


    return monthExportData;
  }

  /**
   * 按照指定的公历年，输出这一年的公历和农历（JSON格式）
   * @param year - 公历年
   * @param calendar - 历书或者政权名称
   * @returns 年历数据JSON字符串
   */
  exportYear(calendar: ChineseCalendarType | null, year: number): YearExportData | null {
    if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
      return null;
    }

    const correctedCalendarOrRegion = correctCalendarByYear(year, calendar);
    const calVars = calYearData(correctedCalendarOrRegion, year);

    // 通过calVars.cmonthYear计算year中包含的农历年个数
    const cYearCount = calVars.cmonthYear[calVars.cmonthYear.length - 1] - calVars.cmonthYear[0] + 1;

    // 获取岁首月份
    const firstMonths: number[] = [];
    for (let i = 0; i < 3; i ++) {
      let firstMonth = getFirstMonthNum(year - 1 + i);
      if (firstMonth === null) {
        firstMonth = calVars.firstMonthNum ?? 1;
      }
      firstMonths.push(firstMonth);
    }

    // 获取农历年岁首的月和日
    const cSpanMonths: number[] = [];
    const cSpanDates: number[] = [];
    for (let i = 1; i < cYearCount; i++) {
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

    const yearExportData: YearExportData = {
      calendar: correctedCalendarOrRegion,
      year,
      cSpanYears: [],
      cMonths: []
    };

    const baseYearIndex = calVars.cmonthYear[0]; 
    for (let i = 0; i < cYearCount; i ++) {
      yearExportData.cSpanYears.push({
        cYear: year - 1 + baseYearIndex + i,
        heYear: getSexagenaryYear(year - 1 + baseYearIndex + i),
        date: (i === 0) ? undefined : { month: cSpanMonths[i - 1], day: cSpanDates[i - 1] },
        //eraNames: eraName(this.localeName, year - 1 + calVars.cmonthYear[0] + i, correctedCalendarOrRegion)
      });

    }

    const moonPhases = calMoonPhases(year);
    const solarEclipses = calSolarEclipses(year);
    const lunarEclipses = calLunarEclipses(year);
    const solarTerms = calSolarTerms(year, SolarTermsType.DE441);
    const calendricalSolarTerms = calCalendricalSolarTerms(year, calVars);

    for (let month = 0; month < 12; month ++) {
      const monthExportData = this.exportMonth(year, month, firstMonths, calVars);
      
      // 添加现代天文的节气和月相
      monthExportData.moonPhasesDetails = getMoonPhasesByMonth(year, month, calVars.mday, moonPhases, solarEclipses, lunarEclipses);
      monthExportData.solarTermsType = SolarTermsType.DE441;
      monthExportData.solarTermsDetails = getSolarTermsByMonth(year, month, calVars.mday, solarTerms);
      
      // 添加历法节气
      monthExportData.calendricalSolarTermDetails = getCalendricalSolarTermsByMonth(calendar, year, month, calVars.mday, calendricalSolarTerms);
   
      yearExportData.cMonths.push(monthExportData);
    }

    return yearExportData;
  }
}
