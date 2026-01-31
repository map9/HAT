/**
 * 核心算法模块
 *
 * 这个模块包装了原始的 JavaScript 历法计算算法。
 * 由于原始算法非常复杂（约2000行），这里通过包装方式复用。
 */

import type { CalVars } from '../types.js';

// @ts-ignore - 导入原始 JS 模块
import { getJD, nDaysofGregJul } from './utilities.js';
// @ts-ignore
import { correctCalendarByYear, correctAncientCalendarBookByYear, correctCalendarRegionByYear, getAncientCalendarBooksByYear, getCalendarRegionsByYear, calDataYear_ancient } from './ancientCalendars.js';
// @ts-ignore
import { ChineseToGregorian, solarTermMoonPhase_ystart, offsets_sunMoon, solarTerms, newMoons, fullMoons, firstQuarters, thirdQuarters, calendricalSolarTerms_ystart, calendricalSolarTerms } from './calendarData.js';
// @ts-ignore
import { setupRegionCalendar, isDefaultRegionCalendar } from './split.js';
// @ts-ignore
import { eclipse_year_range, solar_eclipse_link, lunar_eclipse_link } from './eclipse_linksM722-2202.js';
// @ts-ignore
import { decompress_solarTerms, decompress_moonPhases } from './decompressSunMoonData.js';

export { getJD, nDaysofGregJul, correctCalendarByYear, correctAncientCalendarBookByYear, correctCalendarRegionByYear, getAncientCalendarBooksByYear, getCalendarRegionsByYear, isDefaultRegionCalendar, calendricalSolarTerms_ystart, calendricalSolarTerms };

/**
 * 获取公历年的干支
 */
export function getSexagenaryYear(year: number): [number, number] {
  let h = (year + 726) % 10;
  if (h < 0) h += 10;
  let e = (year + 728) % 12;
  if (e < 0) e += 12;
  return [h, e];
}

/**
 * 获取公历某月某日的日干支
 */
export function getSexagenaryDay(month: number, day: number, mdays: number[], yjday: number): [number, number] {
  const jday = yjday + mdays[month] + day + 1;
  return [(jday - 1) % 10, (jday + 1) % 12];
}

/**
 * 获取岁首月份
 */
export function getFirstMonthNum(year: number): number | null {
  if (year < -104) return null;
  if (year < -102) return 10;
  if (year > 689 && year < 701) return 11;
  return 1;
}

// 时间解压函数
function decompress_time(t: number[]): number[] {
  const x: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const y = Math.floor(t[i] / 1441);
    let m = t[i] - 1441 * y;
    if (m > 1439.5) m = 1439.9;
    x.push(y + m / 1440.0);
  }
  return x;
}

// 月建到月份的转换
function jianToMonthYearoffset(jianIn: number, y: number, region: string | null): { monNum: number; yearOffset: number } {
  const jian = Math.abs(jianIn);
  let yearOffset = 0, monNum = jian;

  // Han dynasty
  if (y < -103 && jian > 9) {
    yearOffset = 1;
  }

  // Xin dynasty
  if (y === 8 && jian === 12) {
    monNum = 1;
    yearOffset = 1;
  }
  if (y > 8 && y < 23) {
    monNum = jian === 12 ? 1 : jian + 1;
    if (jian === 12) yearOffset = 1;
  }
  if (y === 23 && jian < 12) {
    monNum = jian + 1;
  }

  // Wei dynasty
  if (((y === 237 && jian > 2) || y === 238 || (y === 239 && jian < 12)) && isDefaultRegionCalendar(region, y)) {
    monNum = jian === 12 ? 1 : jian + 1;
    if (jian === 12) yearOffset = 1;
  }

  // Tang dynasty
  if (y > 688 && y < 700) {
    if (jian > 10) yearOffset = 1;
  }
  if (y === 761 && jian > 10) {
    monNum = jian - 10;
    yearOffset = 1;
  }
  if (y === 762 && jian < 4) {
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
 * 计算公历年的农历数据
 */
export function calDataYear(year: number, calender: string | null = 'default'): CalVars {
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

  // 24节气
  const offsets: any = offsets_sunMoon();
  const solarAll: any = solarTerms();
  const inds: number = year - solarTermMoonPhase_ystart();
  let solar: any = solarAll[inds];
  let solar2: any = [solar.pop()];
  solar = decompress_solarTerms(year, 1, offsets.solar, solar);

  if (solar[0] < 4323) {
    solar2.push(solarAll[inds + 1][0]);
  }
  solar2 = decompress_solarTerms(year + 1, 0, offsets.solar, solar2);
  for (let i = 0; i < solar2.length; i++) {
    solar.push(solar2[i] + ndays * 1441);
  }
  solar = decompress_time(solar);

  // 月相
  let Q0: any = newMoons()[inds];
  Q0.unshift(0);
  let Q1: any = firstQuarters()[inds];
  Q1.unshift(1);
  let Q2: any = fullMoons()[inds];
  Q2.unshift(2);
  let Q3: any = thirdQuarters()[inds];
  Q3.unshift(3);
  Q0 = decompress_moonPhases(year, offsets.lunar, Q0, 1);
  Q1 = decompress_moonPhases(year, offsets.lunar, Q1, 1);
  Q2 = decompress_moonPhases(year, offsets.lunar, Q2, 1);
  Q3 = decompress_moonPhases(year, offsets.lunar, Q3, 1);
  Q0 = decompress_time(Q0);
  Q1 = decompress_time(Q1);
  Q2 = decompress_time(Q2);
  Q3 = decompress_time(Q3);

  // 日月食
  const iec = year - eclipse_year_range()[0];
  const sol_links = solar_eclipse_link();
  let sol_eclipse = sol_links[iec];
  let extra_sol = sol_links[iec - 1];
  extra_sol.forEach((e: number[]) => {
    if (ndays1 - e[0] < 3) {
      sol_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra_sol = sol_links[iec + 1];
  extra_sol.forEach((e: number[]) => {
    if (e[0] < 3) {
      sol_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });

  const lun_links = lunar_eclipse_link();
  let lun_eclipse = lun_links[iec];
  let extra_lun = lun_links[iec - 1];
  extra_lun.forEach((e: number[]) => {
    if (ndays1 - e[0] < 3) {
      lun_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra_lun = lun_links[iec + 1];
  extra_lun.forEach((e: number[]) => {
    if (e[0] < 3) {
      lun_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });

  // 公元前104年之前使用古代历法
  if (year < -104) {
    const out: any = calDataYear_ancient(year, jd0, ndays, mday, solar, Q0, Q1, Q2, Q3, calender);
    out.sol_eclipse = sol_eclipse;
    out.lun_eclipse = lun_eclipse;
    return out as CalVars;
  }

  // 获取农历数据
  let cdate, cmdate1, cmdate, pingqi, ncdays, ncdays1;
  if (isDefaultRegionCalendar(calender, year)) {
    cdate = ChineseToGregorian();
    const ind = year - cdate[0][0];
    cmdate1 = sortMonths(cdate[ind - 1]);
    ncdays1 = cdate[ind - 1][15];
    cmdate = sortMonths(cdate[ind]);
    ncdays = cdate[ind][15];
  } else {
    cdate = setupRegionCalendar(calender, year - 1, false);
    cmdate1 = sortMonths(cdate);
    ncdays1 = cdate[15];
    cdate = setupRegionCalendar(calender, year, true);
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
        const jianInfo = jianToMonthYearoffset(jian, year - 1, calender);
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
      const jianInfo = jianToMonthYearoffset(jian, year - 1, calender);
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
      const jianInfo = jianToMonthYearoffset(jian, year, calender);
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

  const out: CalVars = {
    jd0,
    mday,
    cmonthDate,
    cmonthXiaYear,
    cmonthJian,
    cmonthNum,
    cmonthYear,
    cmonthLong,
    solar,
    Q0,
    Q1,
    Q2,
    Q3,
    year,
    sol_eclipse,
    lun_eclipse
  };

  if (!isDefaultRegionCalendar(calender, year)) {
    out.pingqi = pingqi;
  }

  return out;
}
