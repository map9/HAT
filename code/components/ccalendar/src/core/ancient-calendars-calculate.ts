/**
 * ancient-calendars-calculate.ts
 * 中国古代历书算法模块
 * 包含，古六历：黄帝历、颛顼历、夏历、殷历、周历、鲁历，和春秋历、汉颛顼历
 * 本文件来源于 https://github.com/ytliu0/ChineseCalendar/ 开源项目中的
 * ancientCalendars.js
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
 *   1. 调整类型、函数名写法；
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

/**
 * 中国古代采取的历书有：
 * - 古六历：周历、鲁历、黃帝历、殷历、夏历、颛顼历，合称「古六历」。
 * 「古六历」的计算方法大致相同，但各历的年首不尽相同，用以计算历法的历元也不同。
 * 本计算方法的「古六历」是根据张培瑜、陈美东、薄树人和胡铁珠著的《中国古代历法》(中国科学出版社‧北京‧2008年3月)书中第三章第六节所述的资料复原。
 * 具体计算方法在[古六历网页](https://ytliu0.github.io/ChineseCalendar/guliuli_simp.html)叙述。  
 *   1. 黃帝历：以建子(即现在的十一月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 *   2. 颛顼历：以建亥(即现在的十月)为年首，但建亥仍按夏历称为十月，颛顼历一年的月份次序是:十月、十一月、十二月、正月、二月……九月。闰月置于年终，称为「后九月」。
 *   3. 夏历：以建寅(即现在的正月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 * 夏历有两个版本，在春秋时代(前722年–前481年)和战国时代(前480年–前222年)所用的版本不同，差别是计算历法时使用的历元不同。春秋时期用的夏历历元是雨水合朔齐同，战国时的夏历历元是冬至合朔齐同。
 * 秦朝和汉初(期221年–前104年)的历法也是采用颛顼历的年首和月份次序。颛顼历大约在秦昭襄王时期(公元前306–前251)开始在秦国使用。
 *   4. 殷历：以建丑(即现在的十二月)为年首，称为正月。目前学界对于黃帝历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。有些学者认为当时以无中气的月份为闰月。
 *   5. 周历：以建子(即现在的十一月)为年首，称为正月。目前学界对于周历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 有些学者认为当时以无中气的月份为闰月，这里也注明无中气的月份以供参考。
 * 周朝于周赧王五十九年(公元前256年)被秦国所灭，东周君王的纪年也到这一年为止。
 *   6. 鲁历：以建子(即现在的十一月)为年首，称为正月。目前学界对于鲁历的闰月位置未有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 有些学者认为当时以无中气的月份为闰月，这里也注明无中气的月份以供参考。
 * 鲁国于鲁顷公二十四年(公元前249年)被楚国所灭，鲁国君主的纪年也到这一年为止。
 * - 春秋历：春秋历没有固定的置闰法则，正月的月建并不固定，而是在建亥(即现在的十月)与建寅(现在的正月)之间摆动。春秋初期的正月月建多在建丑(现在的十二月)，末期则多在建子(现在的十一月)。
 * 目前学界对于春秋历的闰月的位置末有一致意见。这里假设闰月置于年终，称为闰月，不用注明闰几月。
 * 春秋历没有计算冬至(或其他节气)的方法，当时的冬至是靠观测而定，所以没有历书节气。
 * 由于春秋历主要在鲁国使用。现在我们只能从《春秋》这部由孔子修订的鲁国编年史书中获得当时鲁国施行历法的不完整资料。
 * 本计算方法中的春秋历是根据张培瑜、陈美东、薄树人和胡铁珠著的《中国古代历法》(中国科学出版社‧北京‧2008年 3月)书中第三章第五节的资料复原。
 * 具体计算方法在[春秋历网页](https://ytliu0.github.io/ChineseCalendar/chunqiu_simp.html)阐述。
 */

import type { CalVars } from '../types.js';
import { ChineseCalendarType } from '../types.js';

/**
 * Calculation of the first days of months in chunqiu calendar.
 * The output cmonthDate is a vector of length 12 or 13,
 * containing the first days of months counted from jdc,
 * with the first element being the first month and the last
 * element being the last month in the chunqiu calendar.
 * If the length of cmonthDate is 13, the last month is a leap month.
 * cndays is the number of days in the year.
 * @param year 公历年（儒略历/逆推儒略历/格里历）
 * @param jdc Julian day from which days are counted
 * @returns 
 */
function _chunqiu_cmonth(year: number, jdc: number) {
  let lunar = 29.53067185978578; // = 30328/1027
  let yEpoch = -721;
  let jdEpoch = 1457727.761054236; // Jan 16, 722 BC + 268/1027 days + 1e-4 days

  // Leap year pattern from -721 to -482
  let leapYears = [
    0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1,
    0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  ];
  // Accumulated leap years from -721 to -482
  let accLeaps = [
    0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 13,
    14, 15, 15, 16, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 23, 24, 24, 24, 24, 24, 24, 25, 25, 26, 26, 27,
    27, 28, 28, 28, 28, 29, 29, 30, 30, 30, 30, 31, 31, 32, 32, 32, 32, 32, 33, 33, 33, 34, 35, 35, 36, 36, 36, 37, 37, 37, 38, 38, 38, 39,
    39, 39, 40, 40, 40, 41, 41, 41, 41, 42, 42, 43, 44, 44, 44, 45, 45, 45, 46, 46, 47, 47, 47, 47, 48, 48, 48, 49, 49, 49, 50, 50, 50, 51,
    51, 52, 53, 53, 53, 53, 54, 54, 55, 55, 55, 56, 56, 56, 57, 57, 57, 58, 58, 59, 59, 59, 59, 60, 60, 60, 61, 62, 62, 62, 63, 63, 63, 63,
    64, 65, 65, 65, 65, 66, 66, 67, 67, 67, 68, 68, 69, 69, 69, 70, 70, 70, 70, 71, 71, 72, 72, 73, 73, 74, 74, 74, 74, 75, 75, 75, 76, 77,
    77, 77, 77, 77, 78, 78, 79, 79, 80, 80, 80, 80, 81, 81, 82, 82, 83, 83, 83, 84, 84, 84, 85, 85, 86, 86, 86, 87, 87, 87, 88, 88,
  ];

  let i = year - yEpoch;
  let leap = i < 0 ? 0 : leapYears[i];
  let accMonths = 12 * i + (i < 0 ? 0 : accLeaps[i]);

  let m0 = jdEpoch + accMonths * lunar;
  let n = 12 + leap;
  let cmonthDate = [];
  for (let j = 0; j < n; j++) {
    let m = Math.floor(m0 + j * lunar + 0.5) - jdc;
    cmonthDate.push(m);
  }
  // Number of days in the year
  let cndays = Math.floor(m0 + (12 + leap) * lunar + 0.5) - Math.floor(m0 + 0.5);
  return {cmonthDate: cmonthDate, cndays: cndays};
}

/**
 * Set up the information for the chunqiu calendar.
 * @param calendar - 历书或者政权（默认 'default'）
 * @param year - 公历 / 儒略历年
 * @param jd0 - 起始的12月30日午夜的儒略日
 * @param ndays - 公历 / 儒略历年的天数
 * @param mday - 月累计天数数组
 * @returns CalVars数据
 */
export function _calAncientYearData_ChunQiu(year: number, jd0: number, ndays: number, mday: number[]) {
  const jdc = jd0 + 1;
  // current year
  let cmdate = _chunqiu_cmonth(year, jdc);
  // the following year
  let cmdate2 = _chunqiu_cmonth(year + 1, jdc);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia standard
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // Determine the first month before Jan 1, y
  let i, m, d, j = 0;
  if (cmdate.cmonthDate[0] > 1) {
    // previous year
    let cmdate0 = _chunqiu_cmonth(year - 1, jdc);
    let n = cmdate0.cmonthDate.length;
    for (i = 5; i < n; i++) {
      if (cmdate0.cmonthDate[i] > 1) {
        j = i - 1;
        m = i;
        d = cmdate0.cmonthDate[i] - cmdate0.cmonthDate[j];
        cmonthDate.push(cmdate0.cmonthDate[j]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(0);
        cmonthJian.push(1); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
        break;
      }
    }
    if (j == 0) {
      // first month before Jan 1, y is the last month in the previous year
      m = cmdate0.cmonthDate.length;
      d = cmdate.cmonthDate[0] - cmdate0.cmonthDate[m - 1];
      cmonthDate.push(cmdate0.cmonthDate[m - 1]);
      if (m == 13) {
        m = -12;
      }
      cmonthXiaYear.push(0); // doesn't matter since it's not used
      cmonthYear.push(0);
      cmonthJian.push(1); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    } else {
      // Rest of the months in y-1
      let n = cmdate0.cmonthDate.length;
      for (i = j + 1; i < n; i++) {
        m = i + 1;
        if (m == 13) {
          m = -12;
        }
        if (i == n - 1) {
          d = cmdate0.cmonthDate[i + 1] - cmdate0.cmonthDate[i];
        } else {
          d = cmdate.cmonthDate[0] - cmdate0.cmonthDate[i];
        }
        cmonthDate.push(cmdate0.cmonthDate[i]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(0);
        cmonthJian.push(1); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
      }
    }
  } else {
    // first month before Jan 1, y is in the current year
    for (i = 1; i < 10; i++) {
      if (cmdate.cmonthDate[i] > 1) {
        j = i - 1;
        m = i;
        d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
        cmonthDate.push(cmdate.cmonthDate[j]);
        cmonthXiaYear.push(0); // doesn't matter since it's not used
        cmonthYear.push(1);
        cmonthJian.push(11); // doesn't matter since it's not used
        cmonthNum.push(m);
        cmonthLong.push(d == 30 ? 1 : 0);
        break;
      }
    }
  }

  // The rest of the months in Chinese year y
  let n = 12 + (cmdate.cmonthDate.length == 12 ? 0 : 1);
  for (i = 0; i < n; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      m = i + 1;
      if (m == 13) {
        m = -12;
      }
      if (i < n - 1) {
        d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
      } else {
        d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
      }
      cmonthDate.push(cmdate.cmonthDate[i]);
      cmonthXiaYear.push(1); // doesn't matter since it's not used
      cmonthYear.push(1);
      cmonthJian.push(11); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }
  // The months in the following year
  for (i = 0; i < 5; i++) {
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      cmonthXiaYear.push(1); // doesn't matter since it's not used
      m = i + 1;
      cmonthYear.push(2);
      cmonthJian.push(11); // doesn't matter since it's not used
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  // 无中气，无平气计算
  return {
    calendar: ChineseCalendarType.CHUNQIU,
    year: year,
    jd0: jd0,
    mday: mday,
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    firstMonthNum: 1,
    leap: "leap",
  };
}

/**
 * Compute the the Qin and early Han Zhuan Xu calendar in
 * Julian year y according to Li Zhonglin's paper
 * "Researches on Calendars from Qin to early Han (246 B.C. to 104 B.C.)
 * -- centering on excavated calendrical bamboo slips", in Zhong guo shi
 * yan jiu (Studies in Chinese History), issue no. 2, pp. 17–69 (2012).
 * 
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @param jdc - Julian day from which days are counted 
 * @returns 
 */
function _hanzhuanxu_cmonth(year: number, jdc: number) {
  let lunar = 29.0 + 499.0 / 940.0;
  // Calendar A data
  let jdEpoch = 1589523.5001;
  let accMonEpoch = 1670;
  if (year >= -162) {
    // Calendar C data
    jdEpoch = 1646163.5001;
    accMonEpoch = 321;
  } else if (year > -201) {
    // Calendar B data
    jdEpoch = 1633701.5001;
    accMonEpoch = 174;
  }

  let yEpochLeap = year < -162 ? -225 : -179;

  let leapCycle = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1];
  let accMonCycle = [0, 12, 24, 37, 49, 61, 74, 86, 98, 111, 123, 136, 148, 160, 173, 185, 197, 210, 222];

  let yInCycle = (year - yEpochLeap) % 19;
  let accMons = 235 * Math.floor((year - yEpochLeap) / 19) + accMonCycle[yInCycle] + accMonEpoch;
  let leap = leapCycle[yInCycle];

  let m0 = accMons * lunar + jdEpoch;

  // Number of days in the year
  // Verified that it still works around the years
  // when calendar rules were changed.
  let cndays = Math.floor(m0 + (12 + leap) * lunar + 0.5) - Math.floor(m0 + 0.5);
  let jd, hour, yyyy, mm, dd, j;
  // noZhong: index of the month without major solar term, -1 if no such month
  let noZhong = -1;
  let n = 12 + leap;
  // First day of a month starting from month 10 ending on post month 9.
  // If there is no post month 9, it's set to 0.
  let cmonthDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  if (year == -201) {
    for (j = 0; j < 3; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
    }
    m0 = 1633701.5001 + 470 * lunar;
    for (j = 3; j < n; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
    }
  } else {
    for (j = 0; j < n; j++) {
      jd = m0 + j * lunar;
      cmonthDate[j] = Math.floor(jd + 0.5) - jdc;
      //      let mdnext = Math.floor(jd + lunar + 0.5);
      //      let k = 12.0/solar*(Math.floor(jd+0.5) - 0.5 - sol0);
      //      k = Math.floor(k+1);
      //      let qi = Math.floor(sol0 + k*solar/12.0 + 0.5);
      //      if (qi > mdnext-0.1) {
      //            // nozhong qi
      //            noZhong = j;
      //      }
    }
  }

  return {cmonthDate: cmonthDate, noZhong: noZhong, cndays: cndays};
}

/**
 * Compute the pingqi for the Zhuan Xu calendar in Julian year
 * @param year - 公历年（儒略历/逆推儒略历/格里历）
 * @param jdc - Julian day from which days are counted 
 * @returns 
 */
function _hanzhuanxu_pingqi(year: number, jdc: number) {
  let solar = 365.25;
  let jdEpoch = 1587780.5001;
  let yEpoch = -365;
  // JD of the winter solstice in the year
  let sol0 = jdEpoch + (year - yEpoch) * solar - (3 * solar) / 24.0;
  // Dates of the 24 solar terms (pingqi) starting from J12 and ending on Z11
  let stermDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 24; j++) {
    let jd = sol0 + ((j + 1) * solar) / 24.0;
    stermDate[j] = Math.floor(jd + 0.5) - jdc;
  }

  return stermDate;
}

/**
 * Set up the data for year for the Han Zhuan Xu calendar.
 * @param calendar - 历书或者政权（默认 'default'）
 * @param year - 公历 / 儒略历年
 * @param jd0 - 起始的12月30日午夜的儒略日
 * @param ndays - 公历 / 儒略历年的天数
 * @param mday - 月累计天数数组
 * @returns CalVars数据
 */
export function _calAncientYearData_HanZhuanXu(year: number, jd0: number, ndays: number, mday: number[]): CalVars {
  // current year
  let cmdate = _hanzhuanxu_cmonth(year, jd0 + 1);
  // the following year
  let cmdate2 = _hanzhuanxu_cmonth(year + 1, jd0 + 1);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia calendar
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // Determine the first month before Jan 1, y
  let i, j, m, d;
  // noZhong: index of the month without major solar term, -1 if no such month
  let noZhong = -1;
  for (i = 1; i < 12; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      j = i - 1;
      m = 10 + j;
      d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
      cmonthDate.push(cmdate.cmonthDate[j]);
      if (cmdate.noZhong == j) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(0);
      cmonthYear.push(1);
      cmonthJian.push(m);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
      break;
    }
  }
  // The rest of the months in Chinese year y
  let n = 12 + (cmdate.cmonthDate[12] == 0 ? 0 : 1);
  for (i = j! + 1; i < n; i++) {
    m = 10 + i;
    if (m > 12) {
      m -= 12;
    }
    if (i == 12) {
      m = -9;
    }
    if (i < n - 1) {
      d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
    } else {
      d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
    }
    cmonthDate.push(cmdate.cmonthDate[i]);
    if (cmdate.noZhong == i) {
      noZhong = cmonthDate.length - 1;
    }
    cmonthXiaYear.push(m > 9 ? 0 : 1);
    cmonthYear.push(1);
    cmonthJian.push(m);
    cmonthNum.push(m);
    cmonthLong.push(d == 30 ? 1 : 0);
  }
  // months in the following Chinese year
  for (i = 0; i < 5; i++) {
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      m = 10 + i;
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      if (cmdate2.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(1);
      cmonthYear.push(2);
      cmonthJian.push(m);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  // pingqi
  let pingqi = _hanzhuanxu_pingqi(year, jd0 + 1);

  return {
    calendar: ChineseCalendarType.HAN_ZHUANXU,
    year: year,
    jd0: jd0,
    mday: mday,
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    noZhong: noZhong,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    pingqi: pingqi,
    firstMonthNum: 10,
    leap: "post 9",
  };
}

/**
 * Calculation of the first days of months in guliuli in general.
 * The output cmonthDate is a vector of length 12 or 13,
 * containing the first days of months counted from jdc,
 * with the first element being the zi month and the last
 * element being the month before the following zi month.
 * 
 * @param year Julian year
 * @param jdc - Julian day from which days are counted
 * @param yEpoch - the epoch Julian year
 * @param jdEpoch - the epoch Julian date number for winter solstice
 * @param jdEpoch_lunar - the epoch Julian date number for lunar conjunction
 * @returns 
 */
function _guliuli_cmonth(year: number, jdc: number, yEpoch: number, jdEpoch: number, jdEpoch_lunar: number) {
  let solar = 365.25, lunar = 29.0 + 499.0 / 940.0;
  let dy = year - yEpoch - 1;
  let w0 = jdEpoch + dy * solar; // winter solstice (pingqi) in year y-1
  let w1 = w0 + solar; // winter solstice (pingqi) in year y
  let i = Math.floor((Math.floor(w0 + 1.5) - 0.5 - jdEpoch_lunar) / lunar);
  let m0 = jdEpoch_lunar + i * lunar;
  let m1 = m0 + 13.0 * lunar;
  let n = Math.floor(m1 + 0.5) < Math.floor(w1 + 0.5) + 0.1 ? 13 : 12;
  let cmonthDate = [];
  let noZhong = -1; // index of the month without major solar term; -1 means no such month
  for (let j = 0; j < n; j++) {
    let m = m0 + j * lunar;
    cmonthDate.push(Math.floor(m + 0.5) - jdc);
    let mdnext = Math.floor(m + lunar + 0.5);
    let k = (12.0 / solar) * (Math.floor(m + 0.5) - 0.5 - w0);
    k = Math.floor(k + 1);
    let qi = Math.floor(w0 + (k * solar) / 12.0 + 0.5);
    if (qi > mdnext - 0.1) {
      // nozhong qi
      noZhong = j;
    }
  }

  return {cmonthDate: cmonthDate, noZhong: noZhong};
}

/**
 * Compute the dates of pingqi's in guliuli counted from jdc
 * @param year Julian year
 * @param jdc - Julian day from which days are counted
 * @param yEpoch - the epoch Julian year
 * @param jdEpoch - the epoch Julian date number for winter solstice
 * @param jdEpoch_lunar - the epoch Julian date number for lunar conjunction
 * @returns 
 */
function _guliuli_pingqi(year: number, jdc: number, yEpoch: number, jdEpoch: number) {
  let solar = 365.25,
    lunar = 29.0 + 499.0 / 940.0;
  let dy = year - yEpoch - 1;
  let sol0 = jdEpoch + dy * solar; // winter solstice (pingqi) in year y-1
  let stermDate = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 24; j++) {
    let jd = sol0 + ((j + 1) * solar) / 24.0;
    stermDate[j] = Math.floor(jd + 0.5) - jdc;
  }
  return stermDate;
}

// Parameters for the calendars in guliuli
function _guliuli_calendar_parameters(calendar: ChineseCalendarType) {
  let solar = 365.25,
    lunar = 29.0 + 499.0 / 940.0;
  let yEpoch,
    jdEpoch,
    jdEpoch_lunar,
    ziOffset = 0;
  switch (calendar) {
    case ChineseCalendarType.ZHOU:
      yEpoch = -104;
      jdEpoch = 1683430.5001; // Dec 25, -104 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case ChineseCalendarType.HUANGDI:
      yEpoch = 170;
      jdEpoch = 1783510.5001; // Dec 27, 170 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case ChineseCalendarType.YIN:
      ziOffset = 1; // first month of a year is the chou month
      yEpoch = -47;
      jdEpoch = 1704250.5001; // Dec 26, -47 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    case ChineseCalendarType.LU:
      yEpoch = -481;
      jdEpoch = 1545730.5001; // Dec 25, -481 + 1e-4 days
      jdEpoch_lunar = jdEpoch - lunar / 19.0; // runyu = 1/19 *(29 + 499/940) days
      break;
    case ChineseCalendarType.ZHUANXU:
      ziOffset = -1; // first month of a year is the hai month
      yEpoch = 14;
      jdEpoch_lunar = 1726575.5001; // Feb 9, 15 + 1e-4 days
      jdEpoch = jdEpoch_lunar - solar / 8.0; // J1 -> Z11
      break;
    case ChineseCalendarType.SPRING_XIA:
      ziOffset = 2; // first month of a year is the yin month
      yEpoch = 444;
      jdEpoch_lunar = 1883650.5001; // Feb 26, 445 + 1e-4 days
      jdEpoch = jdEpoch_lunar - solar / 6.0; // Z1 -> Z11
      break;
    case ChineseCalendarType.WARRING_XIA:
      ziOffset = 2; // first month of a year is the yin month
      yEpoch = 444;
      jdEpoch = 1883590.5001; // Dec 28, 444 + 1e-4 days
      jdEpoch_lunar = jdEpoch;
      break;
    default:
      throw new Error(`Error in subroutine guliuli_out, Calendar ${calendar} not recognized.`)
  }
  return { yEpoch: yEpoch, jdEpoch: jdEpoch, jdEpoch_lunar: jdEpoch_lunar, ziOffset: ziOffset };
}

/**
 * Set up the information for a particular calendar in guliuli to be
 * used for the calendar main page
 * @param calendar - 历书或者政权（默认 'default'）
 * @param year - 公历 / 儒略历年
 * @param jd0 - 起始的12月30日午夜的儒略日
 * @param ndays - 公历 / 儒略历年的天数
 * @param mday - 月累计天数数组
 * @returns CalVars数据
 */
export function _calAncientYearData_GuLiuLi(calendar: ChineseCalendarType, year: number, jd0: number, ndays: number, mday: number[]): CalVars {
  const jdc = jd0 + 1;
  const para = _guliuli_calendar_parameters(calendar);
  
  // current chinese year
  let cmdate = _guliuli_cmonth(year, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);
  // the following chinese year
  let cmdate2 = _guliuli_cmonth(year + 1, jdc, para.yEpoch, para.jdEpoch, para.jdEpoch_lunar);

  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia calendar
  // (yin month being the first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];

  // noZhong: index of the month without major solar term, -1 means no such month
  let noZhong = -1;

  // Determine the first month before Jan 1, year
  let i, j, m, d, jian, yearOffset = 0;
  let leap = cmdate.cmonthDate.length == 12 ? 0 : 1; // leap chinese year?
  for (i = 1; i < 12; i++) {
    if (cmdate.cmonthDate[i] > 1) {
      j = i - 1; // note that j can only be 0 or 1
      m = i;
      jian = 11 + j;
      if (para.ziOffset == -1) {
        m = 11 + j;
      } else if (para.ziOffset > 0) {
        yearOffset = -1;
        m = 13 - para.ziOffset + j;
        // m can only be 11, 12 or 13.
        if (m == 13) {
          if (leap == 0) {
            m = 1;
            yearOffset = 0;
          } else {
            m = -12;
            jian = -12;
          }
        }
      }
      d = cmdate.cmonthDate[i] - cmdate.cmonthDate[j];
      cmonthDate.push(cmdate.cmonthDate[j]);
      cmonthXiaYear.push(0);
      cmonthYear.push(1 + yearOffset);
      cmonthJian.push(jian);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
      if (cmdate.noZhong == j) {
        noZhong = cmonthDate.length - 1;
      }
      break;
    }
  }
  // The rest of the months in the sui
  let n = 12 + leap;
  for (i = j! + 1; i < n; i++) {
    yearOffset = 0;
    let XiaYear = 0;
    m = i + 1;
    jian = 11 + i;
    if (jian > 12) {
      jian -= 12;
      XiaYear = 1;
    }
    if (m == 13) {
      m = -12;
      jian = -10;
    }
    if (para.ziOffset == -1) {
      m = 11 + i;
      if (m > 12) {
        m -= 12;
      }
      if (m > 9 + leap) {
        yearOffset = 1;
      }
      if (m == 10 && leap == 1) {
        m = -9;
        jian = -9;
      }
      if (m == 11) {
        m = 10;
      }
    } else if (para.ziOffset > 0) {
      XiaYear = i > leap + 1 ? 1 : 0;
      m = 13 - para.ziOffset + i;
      if (m < 13) {
        yearOffset = -1;
      }
      if (m == 13) {
        if (leap == 0) {
          m = 1;
        } else {
          m = -12;
          jian = -12;
          yearOffset = -1;
        }
      }
      if (m > n) {
        m -= n;
        jian -= leap;
      }
    }
    if (i < n - 1) {
      d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
    } else {
      d = cmdate2.cmonthDate[0] - cmdate.cmonthDate[i];
    }
    cmonthDate.push(cmdate.cmonthDate[i]);
    cmonthXiaYear.push(XiaYear);
    cmonthYear.push(1 + yearOffset);
    cmonthJian.push(jian);
    cmonthNum.push(m);
    cmonthLong.push(d == 30 ? 1 : 0);
    if (cmdate.noZhong == i) {
      noZhong = cmonthDate.length - 1;
    }
  }
  // The months in the following chinese year
  leap = cmdate2.cmonthDate.length == 12 ? 0 : 1; // leap year?
  for (i = 0; i < 5; i++) {
    yearOffset = 0;
    if (cmdate2.cmonthDate[i] < ndays + 0.9) {
      // note that i can only be 0 or 1
      d = cmdate2.cmonthDate[i + 1] - cmdate2.cmonthDate[i];
      cmonthDate.push(cmdate2.cmonthDate[i]);
      if (cmdate2.noZhong == i) {
        noZhong = cmonthDate.length - 1;
      }
      cmonthXiaYear.push(1);
      m = i + 1;
      jian = 11 + i;
      if (para.ziOffset == -1) {
        m = 11 + i;
      } else if (para.ziOffset == 1) {
        yearOffset = -1;
        m = 12 + i;
        if (m == 13) {
          if (leap == 1) {
            m = -12;
            jian = -12;
          } else {
            m = 1;
            yearOffset = 0;
          }
        }
      } else if (para.ziOffset == 2) {
        m = 11 + i;
        yearOffset = -1;
      }
      cmonthYear.push(2 + yearOffset);
      cmonthJian.push(jian);
      cmonthNum.push(m);
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  // pingqi
  let pingqi = _guliuli_pingqi(year, jdc, para.yEpoch, para.jdEpoch);

  return {
    calendar: calendar, 
    year: year,
    jd0: jd0,
    mday: mday,
    cmonthDate: cmonthDate,
    cmonthXiaYear: cmonthXiaYear,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    noZhong: noZhong,
    pingqi: pingqi,
    firstMonthNum: para.ziOffset == -1 ? 10 : 1,
    leap: para.ziOffset == -1 ? "post 9" : "leap"
  };
}
