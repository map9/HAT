/**
 * utilities.ts
 * 本文件来源于 https://github.com/ytliu0/ChineseCalendar/ 开源项目中的
 * utilities.js
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
 *   1. 汇总了重构后各模块所需的公用功能函数。
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

import { LeapPrefixType, CalVars, GanZhi } from "../types.js";

/**
 * Compute JD at midnight UT
 * 把一个公历 / 儒略历日期（年、月、日）转换为该日期在 UTC 午夜（0:00 UT）时刻对应的儒略日（Julian Day, JD）。
 * 
 * @param {number} yyyy 公历 / 儒略历日期的年（可为负数，支持 BCE 年份）
 * @param {number} mm 公历 / 儒略历日期的月（1–12）
 * @param {number} dd 公历 / 儒略历日期的日（1–31）
 * @returns 在UTC 午夜（0:00 UT）时刻对应的儒略日
 */
export function getJD(yyyy: number, mm: number, dd: number) {
  let m1 = mm, yy = yyyy;
  if (m1 <= 2) {
    m1 += 12;
    yy--;
  }
  
  let b;
  if (10000 * yy + 100 * m1 + dd <= 15821004) {
    // Julian calendar
    b = -2 + Math.floor((yy + 4716) / 4) - 1179;
  } else {
    // Gregorian calendar
    b = Math.floor(yy / 400) - Math.floor(yy / 100) + Math.floor(yy / 4);
  }
  
  let jd = 365 * yy - 679004 + b + Math.floor(30.6001 * (m1 + 1)) + dd + 2400000.5;
  return jd;
}

// 
/**
 * Number of days in a Gregorian/Julian year
 * 计算一个公历 / 儒略历年的天数
 * 
 * @param {number} year  公历 / 儒略历年（可为负数，支持 BCE 年份）
 * @returns 公历 / 儒略历年的天数
 */
export function nDaysofGregJul(year: number) {
  let ndays = (year == 1582 ? 355 : 365) + (Math.abs(year) % 4 == 0 ? 1 : 0);

  if (year > 1582) {
    ndays += (year % 100 == 0 ? -1 : 0) + (year % 400 == 0 ? 1 : 0);
  }

  return ndays;
}

/**
 * 时间解压函数，只用于内部其他模块
 */
export function decompressTime(t: number[]): number[] {
  const x: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const y = Math.floor(t[i] / 1441);
    let m = t[i] - 1441 * y;
    if (m > 1439.5) m = 1439.9;
    x.push(y + m / 1440.0);
  }
  return x;
}

/**
 * 判断新月是否接近午夜，只用于内部其他模块
 */
export function isNewMoonCloseToMidnight(year: number, month: number): boolean {
  const midnights = [2057, 9, 2089, 8, 2097, 7, 2115, 2, 2116, 4, 2133, 9, 2165, 11, 2172, 9];
  for (let i = 0; i < midnights.length / 2; i++) {
    if (midnights[2 * i] === year && midnights[2 * i + 1] === month) {
      return true;
    }
  }
  return false;
}

/**
 * 给定年获取年干支
 * @param {number} year 农历年
 * @returns 年干支
 */
export function getSexagenaryYear(year: number): GanZhi {
  let h = (year + 726) % 10;
  if (h < 0) h += 10;
  let e = (year + 728) % 12;
  if (e < 0) e += 12;
  return [h, e];
}

/**
 * 通过午夜的儒略日获取日的干支
 * @param {number} jday 午夜的儒略日
 * @returns 日干支
 */
export function getSexagenaryDay(jday: number): GanZhi {
  return [(jday - 1) % 10, (jday + 1) % 12];
}

/**
 * 通过给定的农历年，获取闰月的前缀叫法
 * @param cYear 农历年
 * @param cMonth 农历月份，负数表示闰月
 * @param calVars 公历年为 cYear 的农历年数据
 * @returns 闰月前缀
 */
export function getLeapPrefix(cYear: number, cMonth: number, calVars: CalVars): LeapPrefixType | undefined {
  let leapPrefix: LeapPrefixType | undefined;
  if (cMonth < 0) {
    if (cYear === -104) {
      leapPrefix = LeapPrefixType.POST9;
    } else if (cYear > -104) {
      leapPrefix = LeapPrefixType.LEAPX;
    } else {
      leapPrefix = calVars.leap as LeapPrefixType;
    }
  }
  return leapPrefix;
}

/**
 * 给定公历年年、月、日，返回一个 javascript Date 对象。
 * 主要解决 Date 在表达公元前后 100 年的创建的 bug 问题。
 * @param year 公历年，负数表示公元前
 * @param month 月份（0～11）
 * @param day 日期（1～31）
 * @returns javascript Date
 */
export function makeDate(year: number, month: number, day: number) {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0);

  date.setFullYear(year);
  date.setMonth(month);
  date.setDate(day);
  date.setHours(0, 0, 0, 0);

  return date;
}

/**
 * 判断两个Date对象是否为同一时间点（毫秒级精准）
 * @param {Date} date1 - 第一个日期对象
 * @param {Date} date2 - 第二个日期对象
 * @returns {boolean} 是否一致
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  // 先校验是否为有效的Date对象（避免传入非日期值导致错误）
  if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
    return false;
  }
  // 校验是否为有效日期（比如new Date('无效字符串')会返回Invalid Date）
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return false;
  }
  // 核心：比较毫秒级时间戳
  return date1.getTime() === date2.getTime();
}


