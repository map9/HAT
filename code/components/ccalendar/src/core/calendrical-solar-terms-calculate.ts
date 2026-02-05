/**
 * 统一平气计算模块
 *
 * 将分散在多处的平气(pingqi)计算逻辑统一到此模块：
 * - split.js: compute_pingqi() - 区域历法平气
 * - ancientCalendars.js: guliuli_pingqi(), ZhuanXu_pingqi() - 古代历法平气
 * - ChineseCalendar.ts: 内联大统历计算
 * - calendarData.js: calendricalSolarTerms() 静态数据
 *
 * 本模块不修改底层 JS 算法，仅在 TypeScript 层提供统一入口。
 */

import type { CalVars, SolarTermDetails, CalendricalSolarTermDetails } from '../types.js';
import { ChineseCalendarType, CalendricalSolarTermType } from '../types.js';

// @ts-ignore
import { getJD, nDaysofGregJul } from './utilities.js';
// @ts-ignore
import { calendricalSolarTerms, calendricalSolarTerms_ystart } from './calendarData.js';
// @ts-ignore
import { isDefaultRegionCalendar } from './calendar-id.js';

/**
 * 计算农历历法24节气数据
 * 
 * @param year 公历年
 * @param calVars 公历年所包含的农历数据
 * @returns 
 */
export function calCalendricalSolarTerms(
  year: number,
  calVars: CalVars
): number[][] {
  // 1734年后，不在显示历书节气
  if (year >= 1734) return [];
  // 先秦时期
  if (year < -104) {
    if ("pingqi" in calVars && calVars.pingqi !== undefined) {
      return [calVars.pingqi];
    } else {
      return [];
    }
  } else {
    if ("pingqi" in calVars && calVars.pingqi !== undefined) {
      return [calVars.pingqi];
    } else {
      let calSolTerms: number[][] | null = calendricalSolarTerms();
      let ind = calVars.year - calendricalSolarTerms_ystart();
      const solarTerms: number[] = calSolTerms[ind];
      for (let i = 1; i < solarTerms.length; i ++) {
        solarTerms[i] += solarTerms[i - 1] + 14;
      }
      
      // solar contains all the 24 solar terms in year y, starting from
      // J12 (Xiaohan) to Z11 (winter solstice). It stores the dates
      // of the solar terms counting from Dec. 31, y-1 at 0h (UTC+8).
      // Add one more to solar if J12 occurs before Jan 3.
      if (solarTerms[0] < 3) {
        solarTerms.push(calSolTerms[ind + 1][0] + nDaysofGregJul(calVars.year));
      }
      calSolTerms = null;

      // add Datong solar terms in 1666-1670
      if (year > 1665.5 && year < 1670.5 && isDefaultRegionCalendar(calVars.calendar, year)) {
        const datongSolarTerms = calDatongSolarTerms(calVars.year);
        return [solarTerms, datongSolarTerms]
      } else {
        return [solarTerms]
      }
    }
  }
}

/**
 * This is for 1666-1669 when the Qing calendar was temporarily
 * switched to the Datong system.
 * @param year - 公历年
 * @returns 25个节气时间
 */
function calDatongSolarTerms(year: number) {
  let ps = 365.2425; // solar cycle in the Datong system
  let JDw = 1721049.9175 + 1e-8; // Z11 epoch JD
  let jd0 = getJD(year - 1, 12, 31); // JD on Dec 31, y-1 at noon
  let j = Math.floor((jd0 - JDw) / ps);
  let dqi = ps / 24.0;
  let J12 = JDw + j * ps - jd0 + dqi; // JD of J12 in year y
  let solarTerms = [];
  for (let i = 0; i < 25; i++) {
    solarTerms.push(Math.floor(J12 + i * dqi));
  }
  return solarTerms;
}

/**
 * 获取指定月份的历书节气原始数据
 * 
 * 统一了以下三种来源：
 * 1. calVars.pingqi（区域历法或古代历法计算的平气）
 * 2. calendricalSolarTerms() 静态查找表
 * 3. 大统历内联计算
 *
 * @param calendar - 历书或者政权（默认 'default'）
 * @param year - 公历 / 儒略历年
 * @param month - 月份
 * @param mday - year的月累计天数数组
 * @param solarTerms - year的24节气数据 
 * @returns 节气数据数组
 * - id 月相。 0：'小寒'，2：'大寒'，...，23: '冬至'
 * - time 距离月初的天数。
 */
export function getCalendricalSolarTermsByMonth(
  calendar: ChineseCalendarType | null = ChineseCalendarType.DEFAULT,
  year: number,
  month: number,
  mday: number[],
  calendricalSolarTerms: number[][]
): CalendricalSolarTermDetails[] {
  const m0 = mday[month];
  const m1 = mday[month + 1];

  const calendricalSolarTermDetails: CalendricalSolarTermDetails[] = [];
  for (let i = 0; i < calendricalSolarTerms.length; i ++) {
    const solarTerms = calendricalSolarTerms[i];
    const solarTermDetails: SolarTermDetails[] = [];
    for (let j = 0; j < solarTerms.length; j ++) {
      const solarTerm = solarTerms[j];
      const dd = Math.floor(solarTerm);
      if (dd > m0 && dd <= m1) {
        const h = 24.0 * (solarTerm - dd);
        let d = dd - m0;
        // Correct for Gregorian calendar reform
        if (m1 - m0 < 25) {
          d += d > 4 ? 10 : 0;
        }
        solarTermDetails.push({ id: j, day: d, hours: h });
      }
    }

    let calendarBook: string | undefined = undefined;
    let type: CalendricalSolarTermType;
    let isSplit = false;

    if (
      isDefaultRegionCalendar(calendar, year) &&
      ((year === 1667 && month > 0) ||
      (year > 1667 && year < 1670) ||
      (year === 1670 && month < 2))
    ) {
      isSplit = true;
    }

    if (i === 0) {
      if (isSplit) {
        calendarBook = 'xinfa';
        type = CalendricalSolarTermType.DINGQI;
      } else if (year < 1645 || (year === 1645 && month === 0) || calendar === ChineseCalendarType.QING_SOUTHERNMING) {
        calendarBook = 'calendrical';
        type = CalendricalSolarTermType.PINGQI;
      } else {
        type = CalendricalSolarTermType.DINGQI;
      }
    } else {
      if (isSplit) {
        calendarBook = 'datong';
        type = CalendricalSolarTermType.DINGQI;
      } else {
        continue;
      }
    }

    calendricalSolarTermDetails.push({
      calendarBook: calendarBook!,
      type: type!,
      solarTermsDetails: solarTermDetails
    });
  }

  return calendricalSolarTermDetails;
}