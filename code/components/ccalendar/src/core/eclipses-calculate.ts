/**
 * solar-terms-calculate.ts
 * 月相和日月食计算模块，采用最新的日月食数据，范围从：-3502 ～ -3503 年
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
 *   1. 将基于现代天文数据的月相、日月食计算汇总到本模块；
 *   2. 提供按月拆分的月相、日月食数据，可以直接用于渲染输出；
 *   3. 支持 Typescript。
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
 *//**
 * 
 *
 * 
 */

import type { MoonPhases, MoonPhaseDetails } from '../types';
import { nDaysofGregJul, decompressTime } from './utilities.js';

// @ts-ignore - 导入原始 JS 模块
import { solarTermMoonPhase_ystart, offsets_sunMoon, newMoons, fullMoons, firstQuarters, thirdQuarters } from './calendarData.js';
// @ts-ignore
import { decompress_moonPhases } from './decompressSunMoonData.js';

// @ts-ignore - 导入原始 JS 模块
import { eclipse_year_range, solar_eclipse_link, lunar_eclipse_link } from './eclipse_linksM3502-3503.js';

/**
 * 用现代天文数据计算月相数据，独立于历书和政权
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 月相数据 { Q0: 新月, Q1: 上弦, Q2: 满月, Q3: 下弦 }
 */
export function calMoonPhases(year: number): MoonPhases {
  const offsets: any = offsets_sunMoon();
  const inds: number = year - solarTermMoonPhase_ystart();

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

  return {
    Q0: decompressTime(Q0),
    Q1: decompressTime(Q1),
    Q2: decompressTime(Q2),
    Q3: decompressTime(Q3)
  };
}

/**
 * 用现代天文数据计算日食数据
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 日食数据数组 [[day, index, type], ...]
 */
export function calSolarEclipses(year: number): number[][] {
  const ndays = nDaysofGregJul(year);
  const ndays1 = nDaysofGregJul(year - 1);
  const iec = year - eclipse_year_range()[0];
  const sol_links = solar_eclipse_link();
  const sol_eclipse = sol_links[iec];

  let extra = sol_links[iec - 1];
  extra.forEach((e: number[]) => {
    if (ndays1 - e[0] < 3) {
      sol_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra = sol_links[iec + 1];
  extra.forEach((e: number[]) => {
    if (e[0] < 3) {
      sol_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });

  return sol_eclipse;
}

/**
 * 用现代天文数据，计算月食数据
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @returns 月食数据数组 [[day, index, type], ...]
 */
export function calLunarEclipses(year: number): number[][] {
  const ndays = nDaysofGregJul(year);
  const ndays1 = nDaysofGregJul(year - 1);
  const iec = year - eclipse_year_range()[0];
  const lun_links = lunar_eclipse_link();
  const lun_eclipse = lun_links[iec];

  let extra = lun_links[iec - 1];
  extra.forEach((e: number[]) => {
    if (ndays1 - e[0] < 3) {
      lun_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra = lun_links[iec + 1];
  extra.forEach((e: number[]) => {
    if (e[0] < 3) {
      lun_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });

  return lun_eclipse;
}

/**
 * 对指定公历年的月份的月相和日月食数据解码
 * 
 * @param year - 公历 / 儒略历年
 * @param month - 月份
 * @param mday - year的月累计天数数组
 * @param moonPhase - year的月相数据 
 * @param solarEclipses - year的日食数据
 * @param lunarEclipses -year的月食数据
 * @returns 月相和日月食数据数组
 * - phase 月相。 0：'新月'，1：'上弦月'，2：'满月'，3：'下弦月'
 * - time 距离月初的天数。
 * - eclipse[] 日月食对象数组
 * - eclipse.ybeg
 * - eclipse.ind
 * - eclipse.type 0：'日偏食', 1：'日环食', 2： '日全食', 3：'日全环食' 4：'半影月食', 5：'月偏食', 6：'月全食'
 */
export function getMoonPhasesByMonth(
  year: number,
  month: number,
  mday: number[],
  moonPhase: MoonPhases,
  solarEclipses: number[][],
  lunarEclipses: number[][]
): Array<MoonPhaseDetails> {
  const m0 = mday[month];
  const m1 = mday[month + 1];

  const phases: Array<MoonPhaseDetails> = [];

  // new moon
  for (let i = 0; i < moonPhase.Q0.length; i++) {
    const dd = Math.floor(moonPhase.Q0[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse: any;
      solarEclipses.forEach((e: number[]) => {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse = {};
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (year - 0.5));
          if (year === eclipse.ybeg && e[1] > 200) {
            eclipse.ybeg -= 100;
          } else if (year - eclipse.ybeg === 99 && e[1] < 200) {
            eclipse.ybeg += 100;
          }
          eclipse.ind = e[1];
          eclipse.type = e[2];
        }
      });
      phases.push({ phase: 0, day: dd - m0, hours: 24.0 * (moonPhase.Q0[i] - dd), eclipse });
    }
  }

  // first quarter
  for (let i = 0; i < moonPhase.Q1.length; i++) {
    const dd = Math.floor(moonPhase.Q1[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 1, day: dd - m0, hours: 24.0 * (moonPhase.Q1[i] - dd) });
    }
  }

  // full moon
  for (let i = 0; i < moonPhase.Q2.length; i++) {
    const dd = Math.floor(moonPhase.Q2[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse: any;
      lunarEclipses.forEach((e: number[]) => {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse = {};
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (year - 0.5));
          eclipse.ind = e[1];
          eclipse.type = 4 + e[2];
        }
      });
      phases.push({ phase: 2, day: dd - m0, hours: 24.0 * (moonPhase.Q2[i] - dd), eclipse });
    }
  }

  // third quarter
  for (let i = 0; i < moonPhase.Q3.length; i++) {
    const dd = Math.floor(moonPhase.Q3[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 3, day: dd - m0, hours: 24.0 * (moonPhase.Q3[i] - dd) });
    }
  }

  // sort events in chronological order
  phases.sort((a, b) => a.day - b.day);

  // Correct for Gregorian calendar reform
  // Oct 1582 has only 21 days; The day after Oct 4 was Oct 15
  if (m1 - m0 < 25) {
    for (let i = 0; i < phases.length; i++) {
      phases[i].day += phases[i].day >= 5.0 ? 10.0 : 0.0;
    }
  }

  return phases;
}