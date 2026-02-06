
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

// 时间解压函数
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
 * 判断新月是否接近午夜
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
 * 获取农历年岁首月份
 * @param {number} year 农历年。
 * @returns 岁首的月份序号，1为一月，2为二月，...，12为十二月
 * 1：寅正
 * 10：亥正
 * 11：子正
 * 12：丑正
 */
export function getFirstMonthNum(year: number): number | null {
  if (year < -104) return null;
  if (year < -102) return 10;
  // 武周事情，采用
  if (year > 689 && year < 701) return 11;
  return 1;
}

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
 * @param month 月份（1～12）
 * @param day 日期（1～31）
 * @returns javascript Date
 */
export function makeDate(year: number, month: number, day: number) {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0);

  date.setFullYear(year);
  date.setMonth(month - 1);
  date.setDate(day);
  date.setHours(0, 0, 0, 0);

  return date;
}

