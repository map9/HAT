/**
 * calendar-calculate.ts
 * 通过指定公历年计算所包含的农历年月日数据
 * 本文件来源于 https://github.com/ytliu0/ChineseCalendar/ 开源项目中的
 * calendar.js
 * Copyright (C) 2019 ytliu0 <https://github.com/ytliu0>
 * 
 * 重构说明：2026-02 map9 <https://github.com/map9>
 * - 项目重构目的：提高模块之间的松耦合，提升代码可维护性，无核心逻辑变更。
 * - 项目重构内容：将
 *   1. 进一步模块化代码，提高模块之间的松耦合，提升代码可维护性，具体包含:
 *      a. 将农历计算和基于现代天文数据的月相、节气计算分离；
 *      b. 将公历年包含的农历年信息计算和渲染输出分离。
 *   2. 增加了公历与农历之间的转换、农历岁首信息获取、农历年月份信息获取等函数。
 *   3. 支持 Typescript。
 * 
 * - 本文档变更：
 *   1. 计算给定公历年的农历数据；
 *   2. 支持 Typescript。
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type { CalVars } from '../types.js';
import { ChineseCalendarType } from '../types.js';

import { getJD, nDaysofGregJul } from './utilities.js';
import { _calAncientYearData_ChunQiu, _calAncientYearData_GuLiuLi, _calAncientYearData_HanZhuanXu } from './ancient-calendars-calculate.js';
import { isDefaultRegionCalendar, correctCalendarByYear } from './calendar-id.js';

// @ts-ignore - 导入原始 JS 模块
import { ChineseToGregorian } from './calendarData.js';
// @ts-ignore
import { setupRegionCalendar } from './split.js';

// 月建到月份的转换
function jianToMonthYearoffset(jianIn: number, year: number, region: ChineseCalendarType | null): { monNum: number; yearOffset: number } {
  const jian = Math.abs(jianIn);
  let yearOffset = 0, monNum = jian;

  // Han dynasty
  if (year < -103 && jian > 9) {
    yearOffset = 1;
  }

  // Xin dynasty
  if (year === 8 && jian === 12) {
    monNum = 1;
    yearOffset = 1;
  }
  if (year > 8 && year < 23) {
    monNum = jian === 12 ? 1 : jian + 1;
    if (jian === 12) yearOffset = 1;
  }
  if (year === 23 && jian < 12) {
    monNum = jian + 1;
  }

  // Wei dynasty
  if (((year === 237 && jian > 2) || year === 238 || (year === 239 && jian < 12)) && isDefaultRegionCalendar(region, year)) {
    monNum = jian === 12 ? 1 : jian + 1;
    if (jian === 12) yearOffset = 1;
  }

  // Tang dynasty
  if (year > 688 && year < 700) {
    if (jian > 10) yearOffset = 1;
  }
  if (year === 761 && jian > 10) {
    monNum = jian - 10;
    yearOffset = 1;
  }
  if (year === 762 && jian < 4) {
    monNum = jian + 2;
  }

  if (jianIn < 0) monNum = -monNum;

  return { monNum, yearOffset };
}

// 排序农历月份
function sortMonths(cmdate: number[]): { cmonthDate: number[]; cmonthNum: number[] } {
  const cmonthDate: number[] = [];
  const cmonthNum: number[] = [];
  const leapM = cmdate[14];

  if (leapM === 0) {
    for (let i = 0; i < 12; i++) {
      cmonthDate.push(cmdate[i + 1]);
      cmonthNum.push(i + 1);
    }
  } else {
    for (let i = 0; i < leapM; i++) {
      cmonthDate.push(cmdate[i + 1]);
      cmonthNum.push(i + 1);
    }
    cmonthDate.push(cmdate[13]);
    cmonthNum.push(-leapM);
    for (let i = leapM + 1; i < 13; i++) {
      cmonthDate.push(cmdate[i]);
      cmonthNum.push(i);
    }
  }
  return { cmonthDate, cmonthNum };
}

/**
 * 获取公里年的基础信息
 * @param year 公历年（儒略历/逆推儒略历/格里历）
 * @returns 
 */
function getYearBasics(year: number) {
  const ndays = nDaysofGregJul(year);
  const leap = ndays === 366 ? 1 : 0;

  let mday = [
    0, 31, 59 + leap, 90 + leap, 120 + leap, 151 + leap, 181 + leap,
    212 + leap, 243 + leap, 273 + leap, 304 + leap, 334 + leap, 365 + leap
  ];
  if (year === 1582) {
    mday = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 294, 324, 355];
  }

  const jd0 = Math.floor(getJD(year - 1, 12, 30) + 1);
  const ndays1 = nDaysofGregJul(year - 1);

  return { ndays, mday, jd0, ndays1 };
}

/**
 * 计算-104 ～ -722 年间公历年的农历数据 
 * 如果li = null, 春秋时期默认为Chunqiu历，也就是当时的鲁历；战国时期默认为Zhou历
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @param calendar - 历书或者政权
 */
function calAncientYearData(calendar: ChineseCalendarType, year: number): CalVars | null {
  const { ndays, mday, jd0 } = getYearBasics(year);

  // Spring and Autumn period
  if (year < -479) {
    if (calendar === ChineseCalendarType.CHUNQIU) {
      // Note: no pingqi
      return _calAncientYearData_ChunQiu(year, jd0, ndays, mday);
    } else {
      return _calAncientYearData_GuLiuLi(calendar, year, jd0, ndays, mday);
    }
  }

  // Warring state period
  if (year >= -479 && year < -220) {
    return _calAncientYearData_GuLiuLi(calendar, year, jd0, ndays, mday);
  }

  // Qin and early Han calendar
  if (year >= -220 && year < -104) {
    return _calAncientYearData_HanZhuanXu(year, jd0, ndays, mday);
  }

  return null;
}

/**
 * 计算公历年的农历数据，用于农历的编制
 * @param calendar - 历书或者政权（默认 'default'）
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 公历年所包含的农历年数据
 */
export function calYearData(
  calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT,
  year: number
): CalVars {
  const correctedCalendar = correctCalendarByYear(year, calendar);

  // 公元前104年之前使用古代历法
  if (year < -104) {
    return calAncientYearData(correctedCalendar, year)!;
  }

  const { ndays, mday, jd0, ndays1 } = getYearBasics(year);

  // 获取农历数据
  let cdate, cmdate1, cmdate, pingqi, ncdays, ncdays1;
  if (isDefaultRegionCalendar(calendar, year)) {
    cdate = ChineseToGregorian();
    const ind = year - cdate[0][0];
    cmdate1 = sortMonths(cdate[ind - 1]);
    ncdays1 = cdate[ind - 1][15];
    cmdate = sortMonths(cdate[ind]);
    ncdays = cdate[ind][15];
  } else {
    cdate = setupRegionCalendar(calendar, year - 1, false);
    cmdate1 = sortMonths(cdate);
    ncdays1 = cdate[15];
    cdate = setupRegionCalendar(calendar, year, true);
    cmdate = sortMonths(cdate.cm);
    pingqi = cdate.pingqi;
    ncdays = cdate.cm[15];
  }

  // 收集农历月份
  const cmonthDate: number[] = [];
  const cmonthJian: number[] = [];
  const cmonthNum: number[] = [];
  const cmonthLong: number[] = [];
  const cmonthYear: number[] = [];
  const cmonthXiaYear: number[] = [];

  let n = cmdate1.cmonthDate.length;
  for (let i = 2; i < n; i++) {
    if (cmdate1.cmonthDate[i] > ndays1 + 1) {
      for (let j = i - 1; j < n; j++) {
        cmonthDate.push(cmdate1.cmonthDate[j] - ndays1);
        cmonthXiaYear.push(0);
        const jian = cmdate1.cmonthNum[j];
        cmonthJian.push(jian);
        const jianInfo = jianToMonthYearoffset(jian, year - 1, calendar);
        cmonthNum.push(jianInfo.monNum);
        cmonthYear.push(jianInfo.yearOffset);
        let d: number;
        if (j < n - 1) {
          d = cmdate1.cmonthDate[j + 1] - cmdate1.cmonthDate[j];
        } else {
          d = ncdays1 - cmdate1.cmonthDate[j] + cmdate1.cmonthDate[0];
        }
        cmonthLong.push(d === 30 ? 1 : 0);
      }
      break;
    }
    if (i === n - 1) {
      cmonthDate.push(cmdate1.cmonthDate[i] - ndays1);
      cmonthXiaYear.push(0);
      const jian = cmdate1.cmonthNum[i];
      cmonthJian.push(jian);
      const jianInfo = jianToMonthYearoffset(jian, year - 1, calendar);
      cmonthNum.push(jianInfo.monNum);
      cmonthYear.push(jianInfo.yearOffset);
      const d = ncdays1 - cmdate1.cmonthDate[i] + cmdate1.cmonthDate[0];
      cmonthLong.push(d === 30 ? 1 : 0);
    }
  }

  n = cmdate.cmonthDate.length;
  for (let i = 0; i < n; i++) {
    if (cmdate.cmonthDate[i] <= ndays) {
      cmonthDate.push(cmdate.cmonthDate[i]);
      cmonthXiaYear.push(1);
      const jian = cmdate.cmonthNum[i];
      cmonthJian.push(jian);
      const jianInfo = jianToMonthYearoffset(jian, year, calendar);
      cmonthNum.push(jianInfo.monNum);
      cmonthYear.push(1 + jianInfo.yearOffset);
      let d: number;
      if (i < n - 1) {
        d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
      } else {
        d = ncdays - cmdate.cmonthDate[i] + cmdate.cmonthDate[0];
      }
      cmonthLong.push(d === 30 ? 1 : 0);
    }
  }

  return {
    calendar: correctedCalendar,
    year,
    jd0,
    mday,
    cmonthDate,
    cmonthXiaYear,
    cmonthJian,
    cmonthNum,
    cmonthYear,
    cmonthLong,
    // 非常奇怪的逻辑
    pingqi: !isDefaultRegionCalendar(calendar, year) ? pingqi : undefined
  };
}