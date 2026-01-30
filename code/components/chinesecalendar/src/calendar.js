"use strict";
import i18next from 'i18next';
import enTranslation from './locales/en/translation.json' with { type: 'json' };
import enError from './locales/en/errors.json' with { type: 'json' };
import zhHansTranslation from './locales/zh-Hans/translation.json'  with { type: 'json' };
import zhHansError from './locales/zh-Hans/errors.json'  with { type: 'json' };
import zhHantTranslation from './locales/zh-Hant/translation.json'  with { type: 'json' };
import zhHantError from './locales/zh-Hant/errors.json'  with { type: 'json' };

import { setupRegionCalendar, isDefaultRegionCalendar } from "./split.js";
import { correctCalendarByYear, calDataYear_ancient } from "./ancientCalendars.js";
import { getJD, nDaysofGregJul } from "./utilities.js";
import { ChineseToGregorian, solarTermMoonPhase_ystart, offsets_sunMoon, solarTerms, newMoons, fullMoons, firstQuarters, calendricalSolarTerms_ystart, calendricalSolarTerms, thirdQuarters } from "./calendarData.js";
import { eraName } from "./eras.js";
//import { eclipse_year_range, solar_eclipse_link, lunar_eclipse_link } from "./eclipse_linksM722-2202.js";
import { eclipse_year_range, solar_eclipse_link, lunar_eclipse_link } from "./eclipse_linksM3502-3503.js";
import { decompress_solarTerms, decompress_moonPhases } from "./decompressSunMoonData.js"

export const CALENDAR_RANGE_MAX_YEAR = 2200;
export const CALENDAR_RANGE_MIN_YEAR = -721;


/**
 * 获取指定的公历年内农历年岁首月份。
 * @param {number} year - 公历年。
 * @returns {number} - 返回岁首月份序号。一月的序号为1。
 * 如果year小于-104年，按照中国古代历书来计算农历岁首月份，本函数不能确定岁首。
 * 如果year在-104年～-103年之间（含两边），十月为岁首。
 * 如果year在690年～700年之间（含两边），十一月为岁首。
 * 除此之外，一月为岁首。
 */
export function getFirstMonthNum(year) {
  if (year < -104) {
    return null;
  }
  
  if (year < -102) {
    return 10;
  }
  
  if (year > 689 && year < 701) {
    return 11;
  }

  return 1;
}

/**
 * 获取公历年的干支，如果一个公历年跨两个干支年，应该是最先一个的干支年。
 * @param {*} year 公历年份。
 * @returns {Array[number]} - 返回一个包含天干和地支的数组。
 * [0]: 天干，从0开始计数。
 * [1]: 地支，从0开始计数。
 */
export function getSexagenaryYear(year) {
  let h = (year + 726) % 10;
  if (h < 0) {
    h += 10;
  }
  
  let e = (year + 728) % 12;
  if (e < 0) {
    e += 12;
  }

  return [h, e];
}

/**
 * 获取公历某月某日的干支。
 * @param {number} month - 公历的月份，从0开始到11月结束。
 * @param {number} day - 公历的日期，从0开始到30结束。
 * @param {Array[number]} mdays - month月的第一天距离1月1日的偏移量数组，mdays[0]为1月，mdays[11]为12月。
 * @param {number} yjday - year年的第一天的儒略日。
 * @returns {Array[number]} - 返回一个包含天干和地支的数组。
 * [0]: 天干，从0开始计数。
 * [1]: 地支，从0开始计数。
 */
export function getSexagenaryDay(month, day, mdays, yjday) {
  let jday = yjday + mdays[month] + day + 1;
  return [(jday - 1) % 10, (jday + 1) % 12];
}

/**
 * Determine if the new moon associated with month in year
 * is too close to midnight
 * @param {number} year - 公历年。 
 * @param {number} month - 公历月。
 * @returns {boolean} - 返回true表示是，false表示不是。
 */
function newMoonCloseToMidnight(year, month) {
  let midnights = [2057, 9, 2089, 8, 2097, 7, 2115, 2, 2116, 4, 2133, 9, 2165, 11, 2172, 9];
  for(let i = 0; i < midnights.length / 2; i ++) {
    return midnights[2 * i] == year && midnights[2 * i + 1] == month;
  }
}

/**
 * 格式化小时数为HH:MM格式。
 * @param {number} hours - 小时数。
 * @returns {Array[string]} - 返回格式化后的时间字符串。
 * - [0]: 小时数，两位数。
 * - [1]: 分钟数，两位数。
 */
function ConvertHoursToHHMM(hours) {
  // 处理超过 24 小时的情况
  const totalHours = hours % 24;
  const hh = Math.floor(totalHours);
  const mm = Math.round((totalHours - hh) * 60);

  return [String(hh).padStart(2, '0'), String(mm).padStart(2, '0')];
}

/**
 * 依据日历计算数据，获取指定公历月份的月相数据。
 * @param {number} month - 公历年月份，从0开始。
 * @param {Object} calVars - 对应公历年的农历年计算数据。
 * @returns {Object[]} - 返回一个包含月相数据对象的数组。月相数据对象包含以下属性：
 *   - {number} phase - 月相序号，0: 新月, 1: 上弦月, 2: 满月, 3: 下弦月。
 *   - {number} time - 月相发生的时间，单位为天。
 *   - {Object} eclipse - 日月食数据。如果没有，则为{}；如果有的话，其中，
 *     - {number} ybeg - 日月食发生的年份。
 *     - {number} ind - 日月食序号。
 *     - {number} type - 日月食类型。
 */
function getMoonPhases(month, calVars) {
  let m0 = calVars.mday[month];
  let m1 = calVars.mday[month + 1];

  let phases = [];
  // new moon
  for (let i = 0; i < calVars.Q0.length; i ++) {
    let dd = Math.floor(calVars.Q0[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse = {};
      calVars.sol_eclipse.forEach(function (e) {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (calVars.year - 0.5));
          if (calVars.year == eclipse.ybeg && e[1] > 200) {
            eclipse.ybeg -= 100;
          } else if (calVars.year - eclipse.ybeg == 99 && e[1] < 200) {
            eclipse.ybeg += 100;
          }
          eclipse.ind = e[1];
          eclipse.type = e[2];
        }
      });
      phases.push({ phase: 0, time: calVars.Q0[i] - m0, eclipse: eclipse });
    }
  }
  // first quarter
  for (let i = 0; i < calVars.Q1.length; i ++) {
    let dd = Math.floor(calVars.Q1[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 1, time: calVars.Q1[i] - m0, eclipse: {} });
    }
  }
  // full moon
  for (let i = 0; i < calVars.Q2.length; i ++) {
    let dd = Math.floor(calVars.Q2[i]);
    if (dd > m0 && dd <= m1) {
      let eclipse = {};
      calVars.lun_eclipse.forEach(function (e) {
        if (Math.abs(dd - e[0]) < 5) {
          eclipse.ybeg = 1 + 100 * Math.floor(0.01 * (calVars.year - 0.5));
          eclipse.ind = e[1];
          eclipse.type = 4 + e[2];
        }
      });
      phases.push({ phase: 2, time: calVars.Q2[i] - m0, eclipse: eclipse });
    }
  }
  // third quarter
  for (let i = 0; i < calVars.Q3.length; i ++) {
    let dd = Math.floor(calVars.Q3[i]);
    if (dd > m0 && dd <= m1) {
      phases.push({ phase: 3, time: calVars.Q3[i] - m0, eclipse: {} });
    }
  }

  // sort events in chronological order
  phases.sort((a, b) => a.time - b.time);

  // Correct for Gregorian calendar reform
  // Oct 1582 has only 21 days; The day after Oct 4 was Oct 15
  if (m1 - m0 < 25) {
    for (let i = 0; i < phases.length; i ++) {
      phases[i].time += phases[i].time >= 5.0 ? 10.0 : 0.0;
    }
  }

  return phases;
}

/**
 * 依据日历计算数据，获取指定公历月份的24节气数据。
 * @param {number} month - 公历年月份，从0开始。
 * @param {Object} calVars - 对应公历年的农历年计算数据。
 * @returns {Object[]} - 返回一个包含月相数据对象的数组。月相数据对象包含以下属性：
 *   - {number} phase - 月相序号，0: 新月, 1: 上弦月, 2: 满月, 3: 下弦月。
 *   - {number} time - 月相发生的时间，单位为天。
 *   - {Object} eclipse - 日月食数据。如果没有，则为{}；如果有的话，其中，
 *     - {number} ybeg - 日月食发生的年份。
 *     - {number} ind - 日月食序号。
 *     - {number} type - 日月食类型。
 */
function get24SolarTerms(month, calVars) {
  let m0 = calVars.mday[month];
  let m1 = calVars.mday[month + 1];

  let solars = [];
  for (let i = 0; i < calVars.solar.length; i++) {
    let dd = Math.floor(calVars.solar[i]);
    if (dd > m0 && dd <= m1) {
      let h = 24.0 * (calVars.solar[i] - dd);
      let d = dd - m0;
      // Correct for Gregorian calendar reform
      // Oct 1582 has only 21 days; The day after Oct 4 was Oct 15
      if (m1 - m0 < 25) {
        d += d > 4 ? 10 : 0;
      }
      solars.push({ id: i, day: d, hours: h });
    }
  }
  
  return solars;
}

// Add calendrical solar terms
function addCalSolterms(m, lang, region, soltermNames, calVars, datong) {
  let solar;
  if (calVars.year >= -104) {
    if ("pingqi" in calVars) {
      solar = calVars.pingqi;
    } else {
      if (datong == 0) {
        let calSolTerms = calendricalSolarTerms();
        let ind = calVars.year - calendricalSolarTerms_ystart();
        solar = calSolTerms[ind];
        // decompress
        let n = solar.length;
        for (let i = 1; i < n; i++) {
          solar[i] += solar[i - 1] + 14;
        }
        // solar contains all the 24 solar terms in year y, starting from
        // J12 (Xiaohan) to Z11 (winter solstice). It stores the dates
        // of the solar terms counting from Dec. 31, y-1 at 0h (UTC+8).
        // Add one more to solar if J12 occurs before Jan 3.
        if (solar[0] < 3) {
          solar.push(calSolTerms[ind + 1][0] + nDaysofGregJul(calVars.year));
        }
        calSolTerms = null;
      } else {
        solar = datongSolarTerms(calVars.year);
      }
    }
  } else {
    if ("pingqi" in calVars) {
      solar = calVars.pingqi;
    } else {
      return "";
    }
  }

  let m0 = calVars.mday[m];
  let m1 = calVars.mday[m + 1];
  let txt = "";
  let split = false;
  if (calVars.year == 1667 && m > 0.5 && isDefaultRegionCalendar(region, calVars.year)) {
    split = true;
  }
  if (calVars.year > 1667 && calVars.year < 1670 && isDefaultRegionCalendar(region, calVars.year)) {
    split = true;
  }
  if (calVars.year == 1670 && m < 1.5 && isDefaultRegionCalendar(region, calVars.year)) {
    split = true;
  }
  if (datong == 0) {
    if (lang == 0) {
      txt = "<p><b>Calendrical solar terms ";
      if (calVars.year < 1645 || (calVars.year == 1645 && m == 0) || region == "Qing.SouthernMing") {
        txt += "(p&#236;ngq&#236;)</b>: ";
      } else {
        txt += "(d&#236;ngq&#236;)</b>: ";
      }

      if (split) {
        txt = "<p><b>X&#299;nf&#462; solar terms (d&#236;ngq&#236;)</b>: ";
      }
    } else if (lang == 1) {
      txt = '<p style="letter-spacing:normal;"><b>曆書節氣';
      if (calVars.year < 1645 || (calVars.year == 1645 && m == 0) || region == "Qing.SouthernMing") {
        txt += "(平氣)</b>: ";
      } else {
        txt += "(定氣)</b>: ";
      }

      if (split) {
        txt = '<p style="letter-spacing:normal;"><b>新法節氣(定氣)</b>: ';
      }
    } else {
      txt = '<p style="letter-spacing:normal;"><b>历书节气';
      if (calVars.year < 1645 || (calVars.year == 1645 && m == 0) || region == "Qing.SouthernMing") {
        txt += "(平气)</b>: ";
      } else {
        txt += "(定气)</b>: ";
      }

      if (split) {
        txt = '<p style="letter-spacing:normal;"><b>新法节气(定气)</b>: ';
      }
    }
  } else {
    if (split) {
      if (lang == 0) {
        txt = "<p><b>D&#224;t&#466;ng solar terms (p&#236;ngq&#236;)</b>: ";
      } else if (lang == 1) {
        txt = '<p style="letter-spacing:normal;"><b>大統曆節氣(平氣)</b>: ';
      } else {
        txt = '<p style="letter-spacing:normal;"><b>大统历节气(平气)</b>: ';
      }
    }
  }

  if (txt != "") {
    let empty = 1;
    for (let i = 0; i < solar.length; i++) {
      let dd = solar[i];
      if (dd > m0 && dd <= m1) {
        if (empty == 0) txt += "&nbsp;&nbsp;&nbsp;";
        txt += "[" + soltermNames[i] + "] ";
        let d = dd - m0;
        // Correct for Gregorian calendar reform
        // Oct 1582 has only 21 days; The day after Oct 4 was Oct 15
        if (m1 - m0 < 25) {
          d += d > 4 ? 10 : 0;
        }
        txt += d + "<sup>d</sup>";
        empty = 0;
      }
    }
    txt += "</p>";
  }

  return txt;
}

// Set up the solar terms according to the Datong system in year y
// This is for 1666-1669 when the Qing calendar was temporarily
// switched to the Datong system.
function datongSolarTerms(y) {
  let ps = 365.2425; // solar cycle in the Datong system
  let JDw = 1721049.9175 + 1e-8; // Z11 epoch JD
  let jd0 = getJD(y - 1, 12, 31); // JD on Dec 31, y-1 at noon
  let j = Math.floor((jd0 - JDw) / ps);
  let dqi = ps / 24.0;
  let J12 = JDw + j * ps - jd0 + dqi; // JD of J12 in year y
  let qi = [];
  for (let i = 0; i < 25; i++) {
    qi.push(Math.floor(J12 + i * dqi));
  }
  return qi;
}

export class ChineseCalendar {
  monthNames = []; // 12月名数组。
  weeks = []; // 7周天名数组。
  heaven = []; // 10天干名数组。
  earth = []; // 12地支名数组。
  animals = []; // 12属相名数组。
  monthNumbers = []; // 12月数名数组。
  dayNumbers = []; // 30天名数组。
  moonStatuses = []; // 4月相名数组。
  monthSizes = []; // 大小数组。
  soltermNames = []; // 24节气数组。
  eclipseNames = []; // 7日月食名数组。

  constructor(config = {}) {
    this.i18n = i18next.createInstance();

    this.i18n.on('initialized', (options) => {
      this._rebuildLanguageResource();
    });
    
    this.i18n.on('languageChanged', (lng) => {
      //this._rebuildLanguageResource();
    });

    this.initI18n(config);
  }

  initI18n(config) {
    const { lng = 'en', fallbackLng = 'en', debug = true } = config;
    this.i18n.init({
      lng,
      fallbackLng,
      debug,
      resources: {
        en: {
          translation: enTranslation,
          errors: enError,
        },
        'zh-Hans': {
          translation: zhHansTranslation,
          errors: zhHansError,
        },
        'zh-Hant': {
          translation: zhHantTranslation,
          errors: zhHantError,
        }
      }
    }, (err, t) => {
      if (err) {
        console.error('Failed to initialize i18next:', err);
      }
    });
  }

  // 重构语言包中的数组
  _rebuildLanguageResource() {   
    this.monthNames = new Array(12).fill().map((_, index) => this.i18n.t(`monthNames.${index}`));
    this.weeks = new Array(7).fill().map((_, index) => this.i18n.t(`weeks.${index}`));
    this.heavens = new Array(10).fill().map((_, index) => this.i18n.t(`heavens.${index}`));
    this.earths = new Array(12).fill().map((_, index) => this.i18n.t(`earths.${index}`));
    this.animals = new Array(12).fill().map((_, index) => this.i18n.t(`animals.${index}`));
    this.monthNumbers = new Array(12).fill().map((_, index) => this.i18n.t(`monthNumbers.${index}`));
    if (this.i18n.exists('dayNumbers')) {
      this.dayNumbers = new Array(30).fill().map((_, index) => this.i18n.t(`dayNumbers.${index}`));
    } else {
      this.dayNumbers = new Array(30).fill().map((_, index) => (index + 1).toString());
    }
    this.moonStatuses = new Array(4).fill().map((_, index) => this.i18n.t(`moonStatuses.${index}`));
    this.monthSizes = new Array(2).fill().map((_, index) => this.i18n.t(`monthSizes.${index}`));
    this.soltermNames = new Array(25).fill().map((_, index) => this.i18n.t(`soltermNames.${index}`));
    this.eclipseNames = new Array(7).fill().map((_, index) => this.i18n.t(`eclipseNames.${index}`));
    this.noteEarly = this.i18n.t('notes.early');
    this.noteLate = this.i18n.t('notes.later');
  }
  
  // 切换语言
  setLanguage(lng) {
    return this.i18n.changeLanguage(lng);
  }

  // 获取翻译内容
  t(key, options = {}) {
    return this.i18n.t(key, options);
  }

  // 添加语言包
  addResources(lng, namespace, resources) {
    this.i18n.addResourceBundle(lng, namespace, resources);
  }

  /**
   * 通过公历年来判断当时的历法书
   * @param {*} year - 公历年
   * @returns {Array<Object>} - 返回一个包含不同语言版本的历书名称字符串数组对象。第一个是英文，第二个是繁体中文，第三个是简体中文。
   */
  getWesternCalendarBookByYear(year) {
    if (year > 1582) {
      return this.i18n.t('westernCalendar.now');
    } else if (year == 1582) {
      return this.i18n.t('westernCalendar.1582');
    } else if (year > 7) {
      return this.i18n.t('westernCalendar.7');
    } else {
      return this.i18n.t('westernCalendar.early');
    }
  }


  /**
   * 获取公历年中，历法的变更信息。
   * @param {number} year - 公历年。
   * @param {string} region - 指定政权名称，默认为当时正统政权。
   * @returns {string} - 返回当年的历法变更信息。null表示没有。
   */
  getYearCalenderInfo(year, region) {
    let info = null;

    // Qin and early Han dynasty
    if (year >= -220 && year <= -103) {
      info = this.i18n.t('yearInfos.qinEarlyHan');
    }

    // Xin dynasty
    if (year >= 9 && year <= 23) {
      info = this.i18n.t('yearInfos.xin');
      if (year == 23) {
        info += this.i18n.t('yearInfos.xin24');
      }
    }

    // Wei dynasty
    if (year >= 237 && year <= 240 && isDefaultRegionCalendar(region, year)) {
      info = this.i18n.t('yearInfos.wei');
    }

    // Empress Consort Wu
    if (year >= 689 && year <= 700) {
      info = this.i18n.t('yearInfos.wuZhou');
    }

    // Tang dynasty
    if (year == 761 || year == 762) {
      info = this.i18n.t('yearInfos.tang');
    }
    
    // Gregorian calendar reform
    if (year == 1582) {
      info = this.i18n.t('yearInfos.gCalenderReform');
    }

    // Calendar Case
    if (year > 1666.5 && year < 1670.5 && isDefaultRegionCalendar(region, year)) {
      info = this.i18n.t('yearInfos.qing');    
    }

    return info;
  }

  /**
   * Determine the Chinese month on the first day of
   * this Gregorian/Julian month
   * @param {number} order - Chinese month order in calVars.cmonthDate from Zero.
   * @param {Array<number>} heYear - Chinese year Sexagenary of this Chinese month.
   * @param {Object<string>} calVars - Chinese Variables of Gregorian/Julian Year
   * @returns {Array<number>} 一个包含干支的数组：[天干, 地支]
   * 公元前103年之前，没有月建说法。如果该月为无中气月份，则返回noZhong，否则null。
   */
  getSexagenaryMonth(year, order, calVars) {
    let he = getSexagenaryYear(year - 1);

    // sexagenary month cycle
    if (calVars.cmonthNum[order] > 0 && year > -104) {
      // 获取月份的干支，月建
      return [
        (12 * (he[0] + calVars.cmonthXiaYear[order]) + calVars.cmonthJian[order] + 1) % 10,
        (calVars.cmonthJian[order] + 1) % 12
      ]
    }
    if (year <= -104) {
      // 给出月份是否无中气的结论
      if ("noZhong" in calVars) {
        if (calVars.noZhong == order)
          return 'noZhong';
      }
    }

    return null;
  }

  /**
   * 
   * @param {number} year - 公历年。
   * @param {number} order - 农历月序号。
   * @param {Array<string>|string|null} heMonth - 农历月干支或者中气情况。 
   * @param {Object<string>} calVars - 农历计算变量。
   * @param {string} monthExpressions - 输出月份格式化要求
   * @returns {string} 月份。
   */
  formatChineseMonth(year, cmonthNum, heMonth, cmonthLong, oldLeap, monthExpressions) {
    if (!monthExpressions) return '';

    // 获取leap在不同时期的叫法
    let leap = this.i18n.t('leap.leap');
    if (year == -104) {
      leap = this.i18n.t('leap.post');
    } else if (year < -104) {
      if (oldLeap == "post 9") {
        leap = this.i18n.t('leap.post9');
      }
    }

    let cmonth = this.monthNumbers[Math.abs(cmonthNum) - 1];
    if (year >= -104) {
      if (cmonthNum < 0)
        cmonth = leap + cmonth;

      if (year > 688 && year < 700 && Math.abs(cmonthNum) == 11) {
        // 11 yue -> zheng yue
        cmonth = this.monthNumbers[0];
      }
      if (year > 689 && year < 701 && Math.abs(cmonthNum) == 1) {
        // zheng yue -> yi yue
        cmonth = this.i18n.t("monthNumbers.-1");
      }
    } else {
      if (cmonthNum < 0) {
        cmonth = leap;
      }
    }
    
    if (monthExpressions === 'short') {
      return this.i18n.t('monthExpressions.short', { month: cmonth });
    } 
    
    if (heMonth && Array.isArray(heMonth)) {
      if (monthExpressions === 'short.ganZhi') {
        return this.i18n.t(
          'monthExpressions.short.ganZhi', {
            heaven: this.heavens[heMonth[0]], 
            earth: this.earths[heMonth[1]],
          }
        );
      } else if (monthExpressions === 'normal.ganZhi') {
        return this.i18n.t(
          'monthExpressions.normal.ganZhi', {
            heaven: this.heavens[heMonth[0]], 
            earth: this.earths[heMonth[1]],
            size: this.monthSizes[cmonthLong]
          }
        );
      } else if (monthExpressions === 'full') {
        return this.i18n.t(
          'monthExpressions.full', { 
            month: cmonth,
            heaven: this.heavens[heMonth[0]], 
            earth: this.earths[heMonth[1]],
            size: this.monthSizes[cmonthLong]
          }
        );
      }
    }

    if (heMonth && monthExpressions === 'full') {
      return this.i18n.t(
        'monthExpressions.full.noZhong', { 
          month: cmonth,
          size: this.monthSizes[cmonthLong],
        }
      );
    }

    if (monthExpressions === 'short.ganZhi') {
      return this.i18n.t('monthExpressions.short', { month: cmonth });
    }
    else if (
      monthExpressions === 'normal' ||
      monthExpressions === 'normal.ganZhi' ||
      monthExpressions === 'full'
    ) {
      return this.i18n.t(
        'monthExpressions.normal', { 
          month: cmonth,
          size: this.monthSizes[cmonthLong]
        }
      );
    } else {
      return '';
    }
  }

  /**
   * Calculate the number of Chinese months spanned by
   * this Gregorian/Julian month m in year y. This is equal to 1 + number
   * of first dates of Chinese months occurring on and
   * after the second day of this month and before the
   * first date of the next month.
   * Also calculate the sexagenary month cycle for years > -480.
   * 
   * @param {*} month Gregorian/Julian month m in year y, start from Zero. 
   * @param {*} year Gregorian/Julian year.
   * @param {*} calVars Chinese calendar variables of this Gregorian/Julian year.
   * @returns {
   * nMonth: Chinese month count of this Gregorian/Julian month m,
   * cmonth: Chinese months text, like: ['十一月大 (建戊子)','十二月小 (建己丑)'],
   * cmyear: Chinese year of months, like: ['乙巳年','乙巳年']}
   */
  getChineseMonthsFromMonth(year, month, calVars) {    
    // Determine the Chinese month on the first day of
    // this Gregorian/Julian month
    let j = 0;
    let cMonths = [];
    let orders = [];
    let m0 = calVars.mday[month];
    let m1 = calVars.mday[month + 1];
    // 前一个农历月
    for (let i = 0; i < calVars.cmonthDate.length; i ++) {
      if (calVars.cmonthDate[i] <= m0 + 1 && calVars.cmonthDate[i + 1] > m0 + 1) {
        let heMonth = this.getSexagenaryMonth(year, i, calVars);
        let cMonth = this.formatChineseMonth(year, calVars.cmonthNum[i], heMonth, calVars.cmonthLong[i], calVars.leap, 'full');
        cMonths.push(cMonth);
        orders.push(i);
        j = i + 1;
        break;
      }
    }
    // 后一个农历月
    for (let i = j; i < calVars.cmonthDate.length; i ++) {
      if (calVars.cmonthDate[i] > m0 + 1 && calVars.cmonthDate[i] <= m1) {
        let heMonth = this.getSexagenaryMonth(year, i, calVars);
        let cMonth = this.formatChineseMonth(year, calVars.cmonthNum[i], heMonth, calVars.cmonthLong[i], calVars.leap, 'full');
        cMonths.push(cMonth);
        orders.push(i);
      }
    }
    return {orders: orders, cmonths: cMonths};
  }

  getChineseDateFromDay(year, month, day, firstMonths, calVars) {
    // # of days from Dec 31 in the previous year
    let dd = calVars.mday[month] + day;
  
    // Determine the month and date in Chinese calendar
    let order = null;
    for (let i = 0; i < calVars.cmonthDate.length - 1; i ++) {
      if (dd >= calVars.cmonthDate[i] && dd < calVars.cmonthDate[i + 1]) {
        order = i;
      }
    }
    if (order == null) {
      order = calVars.cmonthDate.length - 1;
    }

    let cm = calVars.cmonthNum[order];
    let cd = dd - calVars.cmonthDate[order] + 1;

    // Check if this month is the first month (岁首月) of the Chinese calendar year
    // Usually this is month 1 (正月), but different calendar systems may vary
    // This value determines the color in HTML output: red for true, brown for false
    let cmIsFirstMonth = cm == firstMonths[calVars.cmonthYear[order]];

    // Special handling for calendar reform years
    // 这一年没有岁首
    if (year == -103 || year == 700) {
      cmIsFirstMonth = false;
    }

    return {order: order, cmonthNum: cm, cDay: cd, isFirstMonth: cmIsFirstMonth};
  }

  // Print the table for one Gregorian/Julian month
  exportMonth(year, month, calender, cyears, firstMonths, calVars, type = 'json') {
    if (type == 'html') {
      let result = this.getChineseMonthsFromMonth(year, month, calVars);
      let nMonth = result.orders.length;
      let cmonths = result.cmonths;

      let yearc = this.i18n.t('yearExpressions.short', {year: this.lunarYearToString(year)});
      let html = "<table>";

      if (nMonth == 1) {
        html += `<tr><th colspan="2"><h2>${yearc}<br/>${this.monthNames[month]}</h2></th><th colspan="5"><h3>${cyears[calVars.cmonthYear[0]]} ${cmonths[0]}</h3></th></tr>`;
      } else {
        html += `<tr><th colspan="2"  rowspan="${nMonth}"><h2>${yearc}<br/>${this.monthNames[month]}</h2></th><th colspan="5"><h3>${cyears[calVars.cmonthYear[0]]} ${cmonths[0]}</h3></th></tr>`;
        for (let i = 1; i < nMonth; i++) {
          html += `<tr><th colspan="5"><h3>${cyears[calVars.cmonthYear[i]]} ${cmonths[i]}</h3></th></tr>`;
        }
      }

      // Week row
      html += "<tr>";
      for (let i = 0; i < 7; i++) {
        html += `<th style="font-size:120%;">${this.weeks[i]}</th>`;
      }
      html += "</tr>";

      // Determine the day of week of the first date of month
      let week1 = (calVars.jd0 + calVars.mday[month] + 3) % 7;
      if (week1 > 0) {
        html += "<tr>";
        html += `<td colspan="${week1}"></td>`;
      }
      // # of days in the months
      let n = calVars.mday[month + 1] - calVars.mday[month];
      let week;
      for (let i = 1; i <= n; i++) {
        week = (week1 + i - 1) % 7;
        if (week == 0) html += "<tr>";
        if (n > 25) {
          html += `<td><h3 style="text-align:center;">${i}</h3>`;
        } else {
          // Gregorian calendar reform: in 1582 Oct has only 21 days.
          // The day following Oct 4 is Oct 15
          if (i < 5) {
            html += `<td><h3 style="text-align:center;">${i}</h3>`;
          } else {
            html += `<td><h3 style="text-align:center;">${i+10}</h3>`;
          }
        }

        let {order, cmonthNum, cDay, isFirstMonth} = this.getChineseDateFromDay(year, month, i, firstMonths, calVars);
        let heMonth = this.getSexagenaryMonth(year, order, calVars);
        let cMonth = this.formatChineseMonth(year, calVars.cmonthNum[order], heMonth, calVars.cmonthLong[order], calVars.leap, 'short');
        let cDate = this.dayNumbers[cDay - 1];
        if (cDay == 1) { // 农历每月的初一
          cDate = `<p style="color:${isFirstMonth? 'red' : 'brown'};"><b>${cMonth}${newMoonCloseToMidnight(year, cmonthNum)? '<sup>*</sup>' : ''}</b></p>`;
        } else if (calVars.mday[month] + i == 1) { // 公历每月的 1 号
          cDate = this.i18n.t('dateExpressions.normal', { month: cMonth, day: this.dayNumbers[cDay - 1]});
        }
        html += cDate;

        let heDay = getSexagenaryDay(month, i, calVars.mday, calVars.jd0);
        html += `<p>${this.i18n.t('dayExpressions.short.ganZhi', { heaven: this.heavens[heDay[0]], earth: this.earths[heDay[1]] })}</p>`;
        html += "</td>";
        if (week == 6) html += "</tr>";
      }
      if (week != 6) {
        html += `<td colspan="${6 - week}"></td></tr>`;
      }

      html += "</table>";

      // Add moon phases
      let phases = getMoonPhases(month, calVars);
      html += `<p  style="letter-spacing:normal;"><b>${this.i18n.t('MoonPhases')}${(year < 1734)? ' (DE441)' : ''}</b>: `;
      for (let i = 0; i < phases.length; i++) {
        let [hh, mm] = ConvertHoursToHHMM(24.0 * (phases[i].time - Math.floor(phases[i].time)));
        html += `[${this.moonStatuses[phases[i].phase]}] ${Math.floor(phases[i].time)}<sup>d</sup>${hh}<sup>h</sup>${mm}<sup>m</sup>`;
        if (Object.keys(phases[i].eclipse).length != 0) {
          let link = `http://ytliu.epizy.com/eclipse/one_${phases[i].eclipse.type > 3? 'solar' : 'lunar'}_eclipse_general.html?`;
          link += `ybeg=${phases[i].eclipse.ybeg}${phases[i].eclipse.type > 3? '' : '&shrule=Danjon'}&ind=${phases[i].eclipse.ind}&DE=441&ref=ccal`;
          html += `(<a href="${link}" target="_blank">${this.eclipseNames[phases[i].eclipse.type]}</a>)`;
        }
        if (i < phases.length - 1) html += "&nbsp;&nbsp;";
      }
      html += "</p>";

      // Add solar terms
      let solars = get24SolarTerms(month, calVars);
      html += `<p style="letter-spacing:normal;"><b>${this.i18n.t('24SolarTerms1')}${(year < 1734)? '(DE441)' : ''}</b>: `;
      for (let i = 0; i < solars.length; i ++) {
        let [hh, mm] = ConvertHoursToHHMM(solars[i].hours);
        html += `[${this.soltermNames[solars[i].id]}] ${solars[i].day}<sup>d</sup>${hh}<sup>h</sup>${mm}<sup>m</sup>`;
        if (i + 1 < solars.length) {
          html += "&nbsp;&nbsp;&nbsp;";
        }
      }
      html += "</p>";

      // Add calendrical solar terms
      let lang = this.i18n.language === 'zh-Hant' ? 1 : (this.i18n.language === 'zh-Hans' ? 2 : 0);
      if (year < 1734) {
        html += addCalSolterms(month, lang, calender, this.soltermNames, calVars, 0);
        // add Datong solar terms in 1666-1670
        if (year > 1665.5 && year < 1670.5 && isDefaultRegionCalendar(calender, year)) {
          html += addCalSolterms(month, lang, calender, this.soltermNames, calVars, 1);
        }
      }
      let warn = warningMessage(year, month + 1, lang, calender, this.noteEarly, this.noteLate);
      if (warn != "") {
        html += `<p style="color:red;"><sup>*</sup>${warn}</p>`;
      }
      html += "<br/><br/><br/>";

      return html;
    } else {
      // JSON output mode
      let result = this.getChineseMonthsFromMonth(year, month, calVars);
      let nMonth = result.orders.length;
      let cmonths = result.cmonths;

      // Build JSON structure
      let json = {
        year: year,
        month: month,
        monthName: this.monthNames[month],
        chineseMonths: []
      };

      // Add Chinese month information
      for (let i = 0; i < nMonth; i++) {
        let cyearIndex = calVars.cmonthYear[result.orders[i]];
        json.chineseMonths.push({
          yearIndex: cyearIndex,
          year: cyears[cyearIndex],
          month: cmonths[i],
          monthNum: calVars.cmonthNum[result.orders[i]],
          isLeap: calVars.cmonthNum[result.orders[i]] < 0
        });
      }

      // # of days in the month
      let n = calVars.mday[month + 1] - calVars.mday[month];

      // Day of week for the first day of month (0=Sunday, 6=Saturday)
      let week1 = (calVars.jd0 + calVars.mday[month] + 3) % 7;

      // Collect daily data
      json.days = [];
      for (let i = 1; i <= n; i++) {
        let dayOfWeek = (week1 + i - 1) % 7;

        // Gregorian date (handle 1582 Oct calendar reform)
        let gregorianDay = i;
        if (n <= 25 && i >= 5) {
          gregorianDay = i + 10;  // Oct 1582: day 5 -> 15
        }

        // Get Chinese date
        let {order, cmonthNum, cDay, isFirstMonth} = this.getChineseDateFromDay(year, month, i, firstMonths, calVars);

        // Get sexagenary for month and day
        let heMonth = this.getSexagenaryMonth(year, order, calVars);
        let heDay = getSexagenaryDay(month, i, calVars.mday, calVars.jd0);

        // Format Chinese month
        let cMonth = this.formatChineseMonth(year, calVars.cmonthNum[order], heMonth, calVars.cmonthLong[order], calVars.leap, 'full');

        let dayData = {
          day: gregorianDay,
          dayOfWeek: dayOfWeek,
          chineseDate: {
            monthOrder: order,
            monthNum: cmonthNum,
            month: cMonth,
            day: cDay,
            isFirstMonth: isFirstMonth,  // Whether this month is the New Year's month (岁首月) - usually 正月
            isMonthStart: cDay === 1      // Whether this day is the first day of a lunar month
          },
          sexagenary: {
            day: heDay,
            month: heMonth
          }
        };

        json.days.push(dayData);
      }

      // Add moon phases
      let phases = getMoonPhases(month, calVars);
      json.moonPhases = phases.map(p => {
        let dayInMonth = Math.floor(p.time);
        let hours = 24.0 * (p.time - dayInMonth);
        let [hh, mm] = ConvertHoursToHHMM(hours);

        let phaseData = {
          phase: p.phase,
          phaseName: this.moonStatuses[p.phase],
          day: dayInMonth,
          hours: hours,
          time: {
            hour: hh,
            minute: mm
          }
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
      let solars = get24SolarTerms(month, calVars);
      json.solarTerms = solars.map(s => {
        let [hh, mm] = ConvertHoursToHHMM(s.hours);
        return {
          id: s.id,
          name: this.soltermNames[s.id],
          day: s.day,
          hours: s.hours,
          time: {
            hour: hh,
            minute: mm
          }
        };
      });

      return json;
    }
  }

  /**
   * 按照指定的公历年按照指定的输出类型，输出这一年的公历和农历。
   * @param {number} lang 输出语言类型。
   * @param {number} year 公历年。
   * @param {string} calender 远古历书名称或者古代政权名称，默认为当时最流行历书或者当时正统政权。
   * @param {string} type 输出类型。
   * - 'json' 按照json输出日历，默认为'json'；
   * - 'html' 按照html输出日历。
   * @returns 返回json或者html文本。
   */
  exportYear(year, calender, type = 'json') {
    if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
      return this.i18n.t('errors:INVALID_INPUT_YEAR');
    }

    // 纠正输入的calender。
    calender = correctCalendarByYear(year, calender);

    // 获取公历年这一年的农历年数据，包含月和日等信息。
    let calVars = calDataYear(year, calender);

    // 通过calVars.cmonthYear计算year中包含的农历年个数
    let cyearCount = calVars.cmonthYear[calVars.cmonthYear.length - 1] - calVars.cmonthYear[0] + 1;

    // 获取 year - 1, year, year + 1三年中的农历年岁首firstMonthNum，用于寻找包含在year中的农历年岁首。
    // 由于中国农历不同历书的岁首不一样，在year中，可能包含一个或者两个岁首。
    let firstMonths = [];
    for (let i = 0; i < 3; i ++) {
      let firstMonth = getFirstMonthNum(year - 1 + i);
      if (firstMonth == null) {
        firstMonth = calVars.firstMonthNum;
      }
      firstMonths.push(firstMonth);
    }
    
    // 获取公历年中包含的农历年的岁首的月和日
    let cSpanMonth, cSpanDays;
    let cSpanMonths = [], cSpanDates = [];
    for (let i = 1; i < cyearCount; i ++) {
      // 公历年序号。0: 上一年，1: 当前年，2: 下一年。
      let yearNo = calVars.cmonthYear[0] + i;
      for (let j = 1; j < calVars.cmonthNum.length; j ++) {
        if (calVars.cmonthYear[j] == yearNo && calVars.cmonthNum[j] == firstMonths[yearNo]) {
          cSpanDays = calVars.cmonthDate[j];
          for (let k = 0; k < 13; k ++) {
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

    // 获取公历年前后共三年可能对应的农历年的干支
    let heYears = [];
    for (let i = 0; i < 3; i ++) {
      let he = getSexagenaryYear(year - 1 + i);
      heYears.push(he);
    }

    let cy0 = calVars.cmonthYear[0];
    if (type == 'html') {
      let html = "";

      let cyears = [];
      heYears.forEach(he => cyears.push(`${this.i18n.t('yearExpressions.short.ganZhi', { heaven: this.heavens[he[0]], earth: this.earths[he[1]] })}`));

      let gcal = this.getWesternCalendarBookByYear(year);

      let yearc = this.i18n.t('yearExpressions.short', {year: this.lunarYearToString(year)});
      html += this.i18n.t('yearHtmls.gregorian', { gcal: gcal, yearc: yearc });

      let eraNames = [];
      for (let i = 0; i < 3; i ++) {
        eraNames.push(
          `${this.i18n.t('yearExpressions.normal.ganZhi', { heaven: this.heavens[heYears[i][0]], earth: this.earths[heYears[i][1]], shengxiao: this.animals[heYears[i][1]] })}` +
          eraName(this.i18n.language, year - 1 + i, calender)
        );
      }
      
      // 公历中包含的农历年序号，最多包含三个。
      if (cyearCount == 1) {
        html += this.i18n.t('yearHtmls.lunarOne', { cyears0: eraNames[cy0] });
      } else if (cyearCount == 2) {
        if (year == 24) {
          html += this.i18n.t('yearHtmls.lunar24', { cyears0: eraNames[cy0], cSpanMonths0: this.monthNames[cSpanMonths[0] - 1], cSpanDates0: cSpanDates[0] });        
        } else {
          html += this.i18n.t('yearHtmls.lunarTwo', { cyears0: eraNames[cy0], cSpanMonths0: this.monthNames[cSpanMonths[0] - 1], cSpanDates0: cSpanDates[0], cyears1: eraNames[cy0 + 1] });
        }
      } else {
        html += this.i18n.t('yearHtmls.lunarThree', { cyears0: eraNames[cy0], cSpanMonths0: this.monthNames[cSpanMonths[0] - 1], cSpanDates0: cSpanDates[0], cyears1: eraNames[cy0 + 1], cSpanMonths1: this.monthNames[cSpanMonths[1] - 1], cSpanDates1l: cSpanDates[1] - 1, cSpanDates1: cSpanDates[1], cyears2: eraNames[cy0 + 2] });
      }

      // Add additional information after the year info
      let info = this.getYearCalenderInfo(year, calender);
      if (info && info.length > 0) {
        html += `<h3 style="color:brown;line-height:26px;">${info}</h3><br/><br/>`;
      }

      for (let month = 0; month < 12; month ++) {
        html += this.exportMonth(year, month, calender, cyears, firstMonths, calVars, type);
      }

      return html;
    } else {
      let json = {};

      json.year = year;
      json.cyears = [];
      json.cdates = [];
      
      if (cyearCount >= 1) {
        json.cyears.push(heYears[cy0]);
      }
      
      if (cyearCount >= 2) {
        json.cyears.push(heYears[cy0 + 1]);
        json.cdates.push({month: cSpanMonths[0], day: cSpanDates[0]});
      }
      
      if (cyearCount >= 3) {
        json.cyears.push(heYears[cy0 + 2]);
        json.cdates.push({month: cSpanMonths[1], day: cSpanDates[1]});
      }

      // Add additional information after the year info
      let info = this.getYearCalenderInfo(year, calender);
      if (info && info.length > 0) {
        json.additionalInfo = info;
      }

      let cyears = [];
      json.months = [];
      heYears.forEach(he => cyears.push(`${this.i18n.t('yearExpressions.short.ganZhi', { heaven: this.heavens[he[0]], earth: this.earths[he[1]] })}`));
      for (let month = 0; month < 12; month ++) {
        json.months.push(this.exportMonth(year, month, calender, cyears, firstMonths, calVars, type));
      }

      return JSON.stringify(json, null, 2);
    }
  }

  /**
   * 将公历日期转换为农历日期
   * @param {Date} date - 公历日期对象
   * @param {string} region - 历法区域（默认 'default'）
   * @returns {Object|null} - 农历日期对象 {year, month, day, isLeap, isFirstMonth, ganzhiYear, ganzhiMonth, ganzhiDay}
   *   - isFirstMonth: 是否是岁首月份（根据年份确定岁首月份编号，且非闰月）
   */
  getChineseDateFromGregorian(date, region = 'default') {
    try {
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      let day = date.getDate(); // 1-31

      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      // 1582年10月的特殊处理：公历改革导致10月4日后是10月15日
      // calVars.mday 使用真实索引（1-21），但 date.getDate() 返回显示值（15-31）
      if (year === 1582 && month === 9) { // month=9 表示10月
        if (day >= 15 && day <= 31) {
          day = day - 10; // 将15-31映射回5-21
        } else if (day >= 5 && day <= 14) {
          throw new Error('Date does not exist in Gregorian calendar due to reform'); // 10月5-14日不存在
        }
      }
      
      // 纠正输入的 calender
      region = correctCalendarByYear(year, region);

      // 获取公历年这一年的农历年数据
      const calVars = calDataYear(year, region);

      // 计算从年初到当前日期的天数
      const daysInYear = calVars.mday[month] + day;

      // 在 cmonthDate 中查找对应的农历月
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

      // 获取农历年、月、日
      const chineseYear = calVars.cmonthYear[chineseMonthIndex];
      const chineseMonth = calVars.cmonthNum[chineseMonthIndex];
      const isLeap = chineseMonth < 0;

      // 计算农历日期
      const chineseDay = daysInYear - calVars.cmonthDate[chineseMonthIndex] + 1;

      // 计算实际的公历年份
      const actualYear = year + chineseYear - 1;

      // 获取干支
      const ganzhiYear = getSexagenaryYear(actualYear);
      const ganzhiMonth = this.getSexagenaryMonth(year, chineseMonthIndex, calVars);
      const ganzhiDay = getSexagenaryDay(month, day, calVars.mday, calVars.jd0);

      // 计算儒略日：jd0是年初的儒略日，加上从年初到当前日期的天数
      const jd = calVars.jd0 + daysInYear;

      return {
        year: actualYear,
        month: Math.abs(chineseMonth),
        monthSize: calVars.cmonthLong[chineseMonthIndex],
        day: chineseDay,
        oldLeap: calVars.leap,
        isLeap: isLeap,
        isFirstMonth: Math.abs(chineseMonth) === (getFirstMonthNum(actualYear) || calVars.firstMonthNum) && !isLeap,
        ganzhiYear: ganzhiYear,
        ganzhiMonth: ganzhiMonth,
        ganzhiDay: ganzhiDay,
        jd: jd  // 儒略日
      };
    } catch (e) {
      console.error('getChineseDateFromGregorian error:', e, date);
      return null;
    }
  }

  /**
   * 将农历日期转换为公历日期
   * @param {number} year - 农历年份
   * @param {number} month - 农历月份（正月为1）
   * @param {number} day - 农历日期
   * @param {boolean} isLeap - 是否为闰月
   * @param {Array<number>|null} ganzhiMonth - 月份干支数组 [天干, 地支]，用于区分重复月份（如762年）
   * @param {string} region - 历法区域（默认 'default'）
   * @param {number|null} jd - 儒略日（Julian Day），用于精确匹配唯一的公历日期；如果为null，则返回所有可能的公历日期
   * @returns {Date|Date[]|null} - 当jd不为null时返回单个Date对象；当jd为null时返回Date数组；未找到时返回null
   */
  getGregorianFromChineseDate(year, month, day, isLeap = false, ganzhiMonth = null, region = 'default', jd = null) {
    try {
      // 农历年可能跨越两个公历年，我们需要在前后几年中查找
      // 收集所有匹配的结果，然后选择cmonthYear值最小的（优先选择当前年份的月份）
      let matches = [];

      for (let gYear = year - 1; gYear <= year + 1; gYear++) {
        region = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, region);

        // 查找匹配的农历月
        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const actualYear = gYear + calVars.cmonthYear[i] - 1;
          const monthNum = Math.abs(calVars.cmonthNum[i]);
          const monthIsLeap = calVars.cmonthNum[i] < 0;

          if (actualYear === year && monthNum === month && monthIsLeap === isLeap) {
            // 如果提供了 ganzhiMonth，需要验证干支是否匹配（用于区分762年等特殊年份的重复月份）
            if (ganzhiMonth !== null) {
              const actualGanzhiMonth = this.getSexagenaryMonth(gYear, i, calVars);
              // 对于 year <= -104 的情况，getSexagenaryMonth 可能返回 null 或 'noZhong'
              // 这种情况下跳过干支验证
              if (actualGanzhiMonth && Array.isArray(actualGanzhiMonth)) {
                // 检查干支是否匹配
                if (actualGanzhiMonth[0] !== ganzhiMonth[0] || actualGanzhiMonth[1] !== ganzhiMonth[1]) {
                  continue; // 干支不匹配，跳过此月份
                }
              }
            }

            // 找到匹配的月份，保存所有信息
            const daysFromYearStart = calVars.cmonthDate[i] + day - 1;
            matches.push({
              gYear: gYear,
              cmonthYear: calVars.cmonthYear[i],
              daysFromYearStart: daysFromYearStart,
              calVars: calVars,
              index: i
            });
          }
        }
      }

      // 如果没有匹配，返回null
      if (matches.length === 0) {
        throw new Error('No matching Chinese date found');
      }

      // 过滤掉无效的匹配（daysFromYearStart <= 0 会导致 gMonth=0）
      matches = matches.filter(m => m.daysFromYearStart > 0);

      if (matches.length === 0) {
        throw new Error('所有匹配都无效（daysFromYearStart <= 0）');
      }

      // 如果提供了 jd（儒略日），则通过 jd 精确匹配唯一的公历日期
      if (jd !== null) {
        // 为每个 match 计算对应的 jd，找到与输入 jd 最接近的匹配
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

        // 如果最接近的匹配与输入 jd 相差超过 0.5 天，返回 null
        if (minDiff > 0.5) {
          throw new Error('No matching date found within 0.5 days of the given jd');
        }

        // 计算并返回单个公历日期
        const date = this._computeGregorianDate(bestMatch);
        return date;
      }

      // 如果没有提供 jd，返回所有可能的公历日期数组
      const dates = matches.map(match => this._computeGregorianDate(match));
      return dates;
    } catch (e) {
      console.error('getGregorianFromChineseDate error:', e);
      return null;
    }
  }

  /**
   * 从 match 对象计算公历日期（内部辅助方法）
   * @param {Object} match - 匹配对象，包含 gYear, daysFromYearStart, calVars
   * @returns {Date} - 公历日期对象
   * @private
   */
  _computeGregorianDate(match) {
    const daysFromYearStart = match.daysFromYearStart;
    const calVars = match.calVars;
    const gYear = match.gYear;

    // 根据 mday 数组计算公历月份和日期
    let gMonth = 0;
    for (let j = 0; j < 12; j++) {
      if (daysFromYearStart > calVars.mday[j]) {
        gMonth = j + 1;
      } else {
        break;
      }
    }

    let gDay = daysFromYearStart - calVars.mday[gMonth - 1];

    // 1582年10月的特殊处理：公历改革跳日（10月4日后跳到10月15日）
    if (gYear === 1582 && gMonth === 10 && gDay >= 5) {
      gDay = gDay + 10; // 将实际索引5-21映射回显示值15-31
    }

    // Date构造函数的month参数是0-11，而gMonth是1-12，需要减1
    // 对于0-99年份，需要使用setFullYear来避免被解析为19xx或20xx年
    const date = new Date(2000, 0, 1, 0, 0, 0, 0, 0); // 临时初始化为2000年1月1日
    date.setFullYear(gYear);
    date.setMonth(gMonth - 1);
    date.setDate(gDay);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 辅助方法：从公历年起始日偏移量计算公历日期
   * @param {number} gYear - 公历年
   * @param {number} daysFromYearStart - 相对于1月1日的偏移天数
   * @param {Object} calVars - 日历计算数据
   * @returns {Date} 公历日期对象
   * @private
   */
  _computeGregorianDateFromDays(gYear, daysFromYearStart, calVars) {
    // 根据 mday 数组计算公历月份和日期
    let gMonth = 0;
    for (let j = 0; j < 12; j++) {
      if (daysFromYearStart > calVars.mday[j]) {
        gMonth = j + 1;
      } else {
        break;
      }
    }

    let gDay = daysFromYearStart - calVars.mday[gMonth - 1];

    // 1582年10月的特殊处理：公历改革跳日
    if (gYear === 1582 && gMonth === 10 && gDay >= 5) {
      gDay = gDay + 10;
    }

    // Date构造函数的month参数是0-11，而gMonth是1-12，需要减1
    // 对于0-99年份，需要使用setFullYear来避免被解析为19xx或20xx年
    const date = new Date(2000, 0, 1, 0, 0, 0, 0, 0); // 临时初始化为2000年1月1日
    date.setFullYear(gYear);
    date.setMonth(gMonth - 1);
    date.setDate(gDay);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * 获取指定农历年对应的所有农历月份信息
   * @param {number} year - 农历年份
   * @param {string} region - 历法区域，默认 'default'
   * @returns {Array<Object>|null} monthInfo数组，每个包含：
   *   - {number} monthNum - 农历月数（1-12）
   *   - {boolean} isLeap - 是否闰月
   *   - {string} month - 农历月描述（如"正月小"）
   *   - {Date} date - 月起始日对应的公历日期
   *   - {number} nDays - 本月天数
   *   - {number} gYear - 对应的公历年
   */
  getChineseYearMonthInfo(year, region = 'default') {
    try {
      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }

      // 农历年的岁首可能在公历年的前一年或当年
      let startYear = year - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = year + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      // 农历年可能跨越多个公历年，需要在前后年份中搜索
      // 收集属于该农历年的所有月份
      const monthInfos = [];
      for (let gYear = startYear; gYear <= endYear; gYear++) {
        region = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, region);

        // 遍历该公历年中的所有农历月
        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          // 计算实际的农历年份
          // cmonthYear[i]: 0=前一年, 1=当年, 2=下一年
          const actualChineseYear = gYear + calVars.cmonthYear[i] - 1;

          // 只处理属于目标农历年的月份
          if (actualChineseYear === year) {
            const monthNum = Math.abs(calVars.cmonthNum[i]);
            const isLeap = calVars.cmonthNum[i] < 0;

            // 计算月份天数
            let nDays;
            if (i < calVars.cmonthDate.length - 1) {
              nDays = calVars.cmonthDate[i + 1] - calVars.cmonthDate[i];
            }
            else {
              // 跨年月的前一段（一般为最后一个月），nDays 在下一个公历年的第一个月来计算
              // 避免出现农历月的结束日为公历日的结束日
              nDays = calVars.mday[12] + 1 - calVars.cmonthDate[i];
            }

            // 跨年月的后一段（一般为第一个月），需要与前一段合并，采用后一段的天数
            // 注意需要解决农历月起始日为公历月第二日，calVars.cmonthDate[i] == 0
            // 农历月起始日为公历月第一日，按照前一段的天数来计算
            if (calVars.cmonthDate[i] <= 0) {
              monthInfos[monthInfos.length - 1].nDays = nDays;
              continue;
            }

            // 格式化月份描述
            const heMonth = this.getSexagenaryMonth(gYear, i, calVars);
            const monthDesc = this.formatChineseMonth(year, calVars.cmonthNum[i], heMonth, calVars.cmonthLong[i], calVars.leap, 'short');

            // 计算公历日期
            const daysFromYearStart = calVars.cmonthDate[i];
            const gregorianDate = this._computeGregorianDateFromDays(gYear, daysFromYearStart, calVars);
            // 处理跨年最后一个月的问题在前后两个公历年都包含的情况
            if (
              i === calVars.cmonthDate.length - 1 &&
              gYear !== gregorianDate.getFullYear()
            ) {
              continue;
            }
            
            monthInfos.push({
              monthNum: monthNum,
              isLeap: isLeap,
              month: monthDesc,
              date: gregorianDate,
              nDays: nDays,
              gYear: gYear
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
   * 获取指定农历年的岁首（公历日期）
   * @param {number} year - 农历年份
   * @param {string} region - 历法区域（默认 'default'）
   * @returns {Date|null} - 岁首的公历日期
   */
  getChineseYearStart(year, region = 'default') {
    try {
      if (isNaN(year) || year < CALENDAR_RANGE_MIN_YEAR || year > CALENDAR_RANGE_MAX_YEAR) {
        throw new Error('Year out of range or invalid year');
      }
      
      // 农历年的岁首可能在公历年的前一年或当年
      let startYear = year - 1;
      if (startYear < CALENDAR_RANGE_MIN_YEAR) {
        startYear = CALENDAR_RANGE_MIN_YEAR;
      }
      let endYear = year + 1;
      if (endYear > CALENDAR_RANGE_MAX_YEAR) {
        endYear = CALENDAR_RANGE_MAX_YEAR;
      }

      for (let gYear = startYear; gYear <= endYear; gYear++) {
        region = correctCalendarByYear(gYear, region);
        const calVars = calDataYear(gYear, region);
        const firstMonthNum = getFirstMonthNum(year) || calVars.firstMonthNum;

        // 查找岁首月份
        for (let i = 0; i < calVars.cmonthNum.length; i++) {
          const actualYear = gYear + calVars.cmonthYear[i] - 1;
          const monthNum = Math.abs(calVars.cmonthNum[i]);

          if (actualYear === year && monthNum === firstMonthNum) {
            // 找到岁首月份，返回该月的第一天
            const daysFromYearStart = calVars.cmonthDate[i];

            // 根据 mday 数组计算公历月份和日期
            let gMonth = 0;
            for (let j = 0; j < 12; j++) {
              if (daysFromYearStart > calVars.mday[j]) {
                gMonth = j + 1;
              } else {
                break;
              }
            }

            const gDay = daysFromYearStart - calVars.mday[gMonth - 1];

            // Date构造函数的month参数是0-11，而gMonth是1-12，需要减1
            // 对于0-99年份，需要使用setFullYear来避免被解析为19xx或20xx年
            const date = new Date(2000, 0, 1, 0, 0, 0, 0, 0); // 临时初始化为2000年1月1日
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

  lunarYearToString(lunarYear) {
    return lunarYear < 1 ? this.i18n.t('years.bce', { year: 1 - lunarYear }) : this.i18n.t('years.ce', { year: lunarYear });
  }

  yearToGanZhi(lunar) {
    return this.i18n.t('Sexagenary', { heaven: lunar.ganzhiYear[0], earth: lunar.ganzhiYear[1] });  
  }

  /**
   * @param {*} lunarDate
   * - year: actualYear,
   * - month: chineseMonth,
   * - day: chineseDay,
   * - monthSize: monthSize,
   * - oldLeap: oldLeap,
   * - isLeap: isLeap,
   * - ganzhiYear: ganzhiYear,
   * - ganzhiMonth: ganzhiMonth,
   * - ganzhiDay: ganzhiDay,
   * - jd: jd 儒略日
   * @param {Array<Object>|null} config - output config
   * - year: null | 'none' | 'normal' | 'ganzhi'
   * - yearShengXiao: boolean
   * - month: null | 'none' | 'normal' | 'ganzhi'
   * - monthShengXiao: boolean
   * - day: null | 'none' | 'normal' | 'ganzhi'
   * - dayShengXiao: boolean
   * - hour: null | 'none' | 'normal' | 'ganzhi'
   * - hourShengXiao: boolean
   * @returns {string} localized lunar date string
   */
  lunarDateToString(
    lunarDate,
    config = {
      year: 'none',
      month: 'none',
      day: 'none',
    }
  ) {
    if (!lunarDate) return '';

    let year = "";
    if (config.year === 'short') {
      year = this.i18n.t('yearExpressions.short', { year: this.lunarYearToString(lunarDate.year) });
    } else if (config.year === 'short.ganZhi') {
      year = this.i18n.t(
        'yearExpressions.short.ganZhi',
        {
          heaven: this.heavens[lunarDate.ganzhiYear[0]],
          earth: this.earths[lunarDate.ganzhiYear[1]]
        }
      );
    } else if (config.year === 'normal') {
      year = this.i18n.t(
        'yearExpressions.normal',
        {
          year: this.lunarYearToString(lunarDate.year),
          shengxiao: this.animals[lunarDate.ganzhiYear[1]]
        }
      );
    } else if (config.year === 'normal.ganZhi') {
      year = this.i18n.t(
        'yearExpressions.normal.ganZhi',
        {
          heaven: this.heavens[lunarDate.ganzhiYear[0]],
          earth: this.earths[lunarDate.ganzhiYear[1]],
          shengxiao: this.animals[lunarDate.ganzhiYear[1]],
        }
      );
    } else if (config.year === 'full') {
      year = this.i18n.t(
        'yearExpressions.full',
        {
          year: this.lunarYearToString(lunarDate.year),
          heaven: this.heavens[lunarDate.ganzhiYear[0]],
          earth: this.earths[lunarDate.ganzhiYear[1]],
          shengxiao: this.animals[lunarDate.ganzhiYear[1]],
        }
      );
    }

    const month = this.formatChineseMonth(
      lunarDate.year,
      lunarDate.isLeap ? -lunarDate.month : lunarDate.month,
      lunarDate.ganzhiMonth,
      lunarDate.monthSize,
      lunarDate.oldLeap,
      config.month
    );

    let day = "";
    if (config.day === 'short') {
      day = this.i18n.t('dayExpressions.short', { day: this.dayNumbers[lunarDate.day - 1] });
    } else if (config.day === 'short.ganZhi') {
      day = this.i18n.t(
        'dayExpressions.short.ganZhi',
        {
          heaven: this.heavens[lunarDate.ganzhiDay[0]],
          earth: this.earths[lunarDate.ganzhiDay[1]]
        }
      );
    } else if (config.day === 'normal') {
      day = this.i18n.t('dayExpressions.normal', { day: this.dayNumbers[lunarDate.day - 1] });
    } else if (config.day === 'normal.ganZhi') {
      day = this.i18n.t(
        'dayExpressions.normal.ganZhi',
        {
          heaven: this.heavens[lunarDate.ganzhiDay[0]],
          earth: this.earths[lunarDate.ganzhiDay[1]],
        }
      );
    } else if (config.day === 'full') {
      day = this.i18n.t(
        'dayExpressions.full',
        {
          day: this.dayNumbers[lunarDate.day - 1],
          heaven: this.heavens[lunarDate.ganzhiDay[0]],
          earth: this.earths[lunarDate.ganzhiDay[1]],
        }
      );
    }

    return year + (year.length > 0 && month.length > 0 ? ' ' : '') + month + (month.length > 0 && day.length > 0 ? ' ' : '') + day;
  }
}

// Convert the jian number to month number, determine the year number offset
// and the month number for the first month of a year.
// jian number: 1=yin, 2=mao, ..., 11=zi, 12 = chou
// month number depends on the jian of the month 1, which is
// usually the same as the jian number but they are different
// in certain periods in the Chinese history.
// year offset: 0 if the year number doesn't change,
//             -1 if in the previous year,  +1 if in the following year.
function jianToMonthYearoffset(jianIn, y, region) {
  let jian = Math.abs(jianIn);
  let yearOffset = 0, monNum = jian;

  // Han dynasty
  if (y < -103 && jian > 9) {
    yearOffset = 1;
  }

  // Xin dynasty
  if (y == 8 && jian == 12) {
    monNum = 1;
    yearOffset = 1;
  }
  if (y > 8 && y < 23) {
    monNum = jian == 12 ? 1 : jian + 1;
    if (jian == 12) {
      yearOffset = 1;
    }
  }
  if (y == 23 && jian < 12) {
    monNum = jian + 1;
  }

  // Wei dynasty (Three-Kingdom period)
  if (((y == 237 && jian > 2) || y == 238 || (y == 239 && jian < 12)) && isDefaultRegionCalendar(region, y)) {
    monNum = jian == 12 ? 1 : jian + 1;
    if (jian == 12) {
      yearOffset = 1;
    }
  }

  // Tang dynasty
  if (y > 688 && y < 700) {
    if (jian > 10) {
      yearOffset = 1;
    }
  }
  if (y == 761 && jian > 10) {
    monNum = jian - 10;
    yearOffset = 1;
  }
  if (y == 762 && jian < 4) {
    monNum = jian + 2;
  }

  if (jianIn < 0) {
    monNum = -monNum;
  }

  return {monNum: monNum, yearOffset: yearOffset};
}

// Decompress time: time t has been compressed to retain information
// to the nearest minute. The compression algorithm is
// t = floor(x)*1441 + m, where x is the original time expressed
// in the number of days from Jan 0. The inverse transform is
// y = floor(t/1441), x_approx = y + (t - y*1441)/1440
function decompress_time(t) {
  let x = [];
  for (let i = 0; i < t.length; i++) {
    let y = Math.floor(t[i] / 1441);
    let m = t[i] - 1441 * y;
    if (m > 1439.5) {
      m = 1439.9;
    }
    x.push(y + m / 1440.0);
  }
  return x;
}

/**
 * 依据给定的公历年，返回这一年的农历数据。
 * @param {number} year 公历年。
 * @param {string} calender 古代历书名称或者古代政权名称，默认为当时最流行历书或者当时正统政权。
 * @returns {Object<string, any>}  返回一个包含公历年的农历数据的对象，包含以下属性：
 * jd0: Julian day number, like: 1683070,
 * mday: Gregorian/Julian的月份距离1月1日的偏移量, like: [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366],
 * cmonthDate: 中国农历月份起始日与Gregorian/Julian的1月1日的偏移量, like: [-23, 6, 36, 65, 95, 124, 154, 183, 213, 242, 272, 301, 331, 360],
 * cmonthXiaYear, 中国农历夏历的月份区分标记, 夏历以寅月为岁首, 0: 表示是前一个农历年的月份, 1: 表示是当前农历年的月份. like: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
 * cmonthJian: 中国农历月份的月建, 1为寅, 2为卯, ..., 负表示闰月, like: [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, -9, 10, 11],
 * cmonthNum: Chinese month number of y, negetive is leap month, like: [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, -9, 10, 11],
 * cmonthYear: 不同朝代和时期，中国农历的岁首月份有差异，这个是当年历书的农历年区分标记, 0: 表示为前一个农历年的月份, 1: 表示是当前农历年的月份, 2: 表示是下一个农历年的月份.
 * 由于一年的岁首不同, 会出现从按照农历夏历的11月开始到下一个农历的11月的一年。like: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
 * cmonthLong: 对应中国农历月份大小区分标记, 0: 小月 <30天, 1: 大月 =30天. like: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
 * solar: 中国农历的24节气时间, 单位: 天数, 从距离1 Jan.开始计算, like [8.35625, 23.20347222222222, 38.15486111111111, ...],
 * Q0: Q0,
 * Q1: Q1,
 * Q2: Q2,
 * Q3: Q3,
 */
function calDataYear(year, calender) {
  // Is y a leap year?
  let ndays = nDaysofGregJul(year);
  let leap = ndays == 366 ? 1 : 0;
  // number of days in the beg of the 12 months
  let mday = [
    0,
    31,
    59 + leap,
    90 + leap,
    120 + leap,
    151 + leap,
    181 + leap,
    212 + leap,
    243 + leap,
    273 + leap,
    304 + leap,
    334 + leap,
    365 + leap,
  ];
  if (year == 1582) {
    mday = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 294, 324, 355];
  }
  // Julian day on Dec 30, y-1 at noon UT
  let jd0 = Math.floor(getJD(year - 1, 12, 30) + 1);
  // number of days in year y-1, will be used below
  let ndays1 = nDaysofGregJul(year - 1);

  // *** 24 solar terms in year y **
  let offsets = offsets_sunMoon();
  let solarAll = solarTerms();
  let inds = year - solarTermMoonPhase_ystart();
  let solar = solarAll[inds];
  let solar2 = [solar.pop()];
  solar = decompress_solarTerms(year, 1, offsets.solar, solar);
  // solar[] contains solar terms in year y starting from
  // J12 (Xiaohan) to J11 (daxue). It stores the dates
  // of the solar terms counting from Dec. 31, y-1 at 0h (UTC+8).

  // solar2[] contains the compressed winter solstice in year y.
  // Add one more to solar2 if J12 occurs before Jan 3.
  if (solar[0] < 4323) {
    solar2.push(solarAll[inds + 1][0]);
  }
  solarAll = null; // remove large array
  solar2 = decompress_solarTerms(year + 1, 0, offsets.solar, solar2);
  let i;
  for (i = 0; i < solar2.length; i++) {
    solar.push(solar2[i] + ndays * 1441);
  }
  solar = decompress_time(solar);

  // ** new moons, quarters and full moons in year y **
  let Q0 = newMoons()[inds];
  Q0.unshift(0);
  let Q1 = firstQuarters()[inds];
  Q1.unshift(1);
  let Q2 = fullMoons()[inds];
  Q2.unshift(2);
  let Q3 = thirdQuarters()[inds];
  Q3.unshift(3);
  Q0 = decompress_moonPhases(year, offsets.lunar, Q0, 1);
  Q1 = decompress_moonPhases(year, offsets.lunar, Q1, 1);
  Q2 = decompress_moonPhases(year, offsets.lunar, Q2, 1);
  Q3 = decompress_moonPhases(year, offsets.lunar, Q3, 1);
  // decompress moon phase data
  Q0 = decompress_time(Q0);
  Q1 = decompress_time(Q1);
  Q2 = decompress_time(Q2);
  Q3 = decompress_time(Q3);
  // Q0 contains all the new moons in year y in chronological order.
  // It stores the dates of new moons counting from
  // Dec. 31, y-1 at 0h (UTC+8).
  // Q1-Q3 are the same but for 1st quarters, full moons
  // and 3rd quarters

  // eclipses
  let iec = year - eclipse_year_range()[0];
  // sol_eclipse is a 2D array that stores the info of solar
  // eclipses in year y. It has the form
  // [[d_eclipse1, ind_eclipse1, type_eclipse1],
  //  [d_eclipse2, ind_eclipse2, type_eclipse2], ...]
  // d: eclipse day counting from Dec 31, y-1.
  // ind: index of the eclipse (for eclipse link)
  // type: type of eclipse (0=partial, 1=annular, 2=total, 3=hybrid)
  let links = solar_eclipse_link();
  let sol_eclipse = links[iec];
  let extra_links = links[iec - 1];
  extra_links.forEach(function (e) {
    if (ndays1 - e[0] < 3) {
      // this is close to Jan 1, y; add it to be safe
      sol_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra_links = links[iec + 1];
  extra_links.forEach(function (e) {
    if (e[0] < 3) {
      // this is close to Dec 31, y; add it to be safe
      sol_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });
  // lun_eclipse is a 2D array that stores the info of lunar
  // eclipses in year y. It has the form
  // [[d_eclipse1, ind_eclipse1, type_eclipse1],
  //  [d_eclipse2, ind_eclipse2, type_eclipse2], ...]
  // d: eclipse day counting from Dec 31, y-1.
  // ind: index of the eclipse (for eclipse link)
  // type: type of eclipse (0=penumbral, 1=partial, 2=total)
  links = lunar_eclipse_link();
  let lun_eclipse = links[iec];
  extra_links = links[iec - 1];
  extra_links.forEach(function (e) {
    if (ndays1 - e[0] < 3) {
      // this is close to Jan 1, y; add it to be safe
      lun_eclipse.push([e[0] - ndays1, e[1], e[2]]);
    }
  });
  extra_links = links[iec + 1];
  extra_links.forEach(function (e) {
    if (e[0] < 3) {
      // this is close to Dec 31, y; add it to be safe
      lun_eclipse.push([e[0] + ndays, e[1], e[2]]);
    }
  });
  links = null;

  // Before year -104
  if (year < -104) {
    let out = calDataYear_ancient(year, jd0, ndays, mday, solar, Q0, Q1, Q2, Q3, calender);
    out.sol_eclipse = sol_eclipse;
    out.lun_eclipse = lun_eclipse;
    return out;
  }

  // *** Data for Chinese calendar ***
  let cdate, ind, cmdate1, cmdate, pingqi, ncdays, ncdays1;
  if (isDefaultRegionCalendar(calender, year)) {
    cdate = ChineseToGregorian();
    // cdate is a 2D array. Each row contains data for a Chinese year
    // columns: year, first date of month 1, 2,... , 12, leap month,
    //          month # that is leaped, # of days in the year
    // leap month = month # = 0 if no leap month
    ind = year - cdate[0][0];
    // Chinese months in the previous year
    cmdate1 = sortMonths(cdate[ind - 1]);
    ncdays1 = cdate[ind - 1][15]; // Number of days in the previous year
    // Chinese months in the current year
    cmdate = sortMonths(cdate[ind]);
    ncdays = cdate[ind][15]; // Number of days in this year
    cdate = null;
  } else {
    cdate = setupRegionCalendar(calender, year - 1, false);
    cmdate1 = sortMonths(cdate);
    ncdays1 = cdate[15];
    cdate = setupRegionCalendar(calender, year, true);
    cmdate = sortMonths(cdate.cm);
    pingqi = cdate.pingqi;
    ncdays = cdate.cm[15];
    cdate = null;
  }
  // Gather Chinese months within year y
  let d,
    n = cmdate1.cmonthDate.length;
  let cmonthDate = [],
    cmonthJian = [],
    cmonthNum = [],
    cmonthLong = [],
    cmonthYear = [];
  // cmonthXiaYear: Chinese year according to the Xia calendar (yin month being the
  //                first month); 0 means previous year, 1 current year.
  let cmonthXiaYear = [];
  let jian, jianInfo; // jian number: 1=yin, 2=mao, ...
  for (i = 2; i < n; i++) {
    if (cmdate1.cmonthDate[i] > ndays1 + 1) {
      // cmdate1.cmonthDate[i-1] is the last month before Jan 1, y
      for (let j = i - 1; j < n; j++) {
        cmonthDate.push(cmdate1.cmonthDate[j] - ndays1);
        cmonthXiaYear.push(0);
        jian = cmdate1.cmonthNum[j];
        cmonthJian.push(jian);
        jianInfo = jianToMonthYearoffset(jian, year - 1, calender);
        cmonthNum.push(jianInfo.monNum);
        cmonthYear.push(jianInfo.yearOffset);
        if (j < n - 1) {
          d = cmdate1.cmonthDate[j + 1] - cmdate1.cmonthDate[j];
        } else {
          d = ncdays1 - cmdate1.cmonthDate[j] + cmdate1.cmonthDate[0];
        }
        cmonthLong.push(d == 30 ? 1 : 0);
      }
      break;
    }
    if (i == n - 1) {
      // The last Chinese month is the last month before Jan 1, y
      cmonthDate.push(cmdate1.cmonthDate[i] - ndays1);
      cmonthXiaYear.push(0);
      jian = cmdate1.cmonthNum[i];
      cmonthJian.push(jian);
      jianInfo = jianToMonthYearoffset(jian, year - 1, calender);
      cmonthNum.push(jianInfo.monNum);
      cmonthYear.push(jianInfo.yearOffset);
      d = ncdays1 - cmdate1.cmonthDate[i] + cmdate1.cmonthDate[0];
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }
  n = cmdate.cmonthDate.length;
  for (i = 0; i < n; i++) {
    if (cmdate.cmonthDate[i] <= ndays) {
      cmonthDate.push(cmdate.cmonthDate[i]);
      cmonthXiaYear.push(1);
      jian = cmdate.cmonthNum[i];
      cmonthJian.push(jian);
      jianInfo = jianToMonthYearoffset(jian, year, calender);
      cmonthNum.push(jianInfo.monNum);
      cmonthYear.push(1 + jianInfo.yearOffset);
      if (i < n - 1) {
        d = cmdate.cmonthDate[i + 1] - cmdate.cmonthDate[i];
      } else {
        d = ncdays - cmdate.cmonthDate[i] + cmdate.cmonthDate[0];
      }
      cmonthLong.push(d == 30 ? 1 : 0);
    }
  }

  let out = {
    jd0: jd0,
    mday: mday,
    cmonthDate: cmonthDate,
    cmonthXiaYear,
    cmonthJian: cmonthJian,
    cmonthNum: cmonthNum,
    cmonthYear: cmonthYear,
    cmonthLong: cmonthLong,
    solar: solar,
    Q0: Q0,
    Q1: Q1,
    Q2: Q2,
    Q3: Q3,
    year: year,
    sol_eclipse: sol_eclipse,
    lun_eclipse: lun_eclipse,
  };
  if (isDefaultRegionCalendar(calender, year) == false) {
    out.pingqi = pingqi;
  }
  return out;
}

// Sort the Chinese months in chronological order by placing
// the leap month to the appropriate place
function sortMonths(cmdate) {
  let cmonthDate = [];
  let cmonthNum = []; // Jian number
  let leapM = cmdate[14];
  let i;
  if (leapM == 0) {
    for (i = 0; i < 12; i++) {
      cmonthDate.push(cmdate[i + 1]);
      cmonthNum.push(i + 1);
    }
  } else {
    for (i = 0; i < leapM; i++) {
      cmonthDate.push(cmdate[i + 1]);
      cmonthNum.push(i + 1);
    }
    cmonthDate.push(cmdate[13]);
    cmonthNum.push(-leapM);
    for (i = leapM + 1; i < 13; i++) {
      cmonthDate.push(cmdate[i]);
      cmonthNum.push(i);
    }
  }
  return {cmonthDate: cmonthDate, cmonthNum: cmonthNum};
}

/**
 * 获取公历某月某日的中国农历月。
 * @param {*} month 公历的月份，从1开始到12月结束。
 * @param {*} mdays month月的第一天距离1月1日的偏移量数组，mdays[0]为1月，mdays[11]为12月。
 * @param {*} yjday year年的第一天的儒略日。
 * @returns 返回一个数组，第一个元素是日的天干，第二个元素是日的地支，都从0开始计数。
 */
/*
export function getChineseMonth(month, mdays, yjday) {
  let jday = yjday + mdays[month - 1] + day + 1;
  return [(jday - 1) % 10, (jday + 1) % 12];
}
*/
/**
 * 获取公历某月某日的中国农历日。
 * @param {*} month 公历的月份，从1开始到12月结束。
 * @param {*} day 公历的日期，从1开始到31结束。
 * @param {*} mdays month月的第一天距离1月1日的偏移量数组，mdays[0]为1月，mdays[11]为12月。
 * @param {*} yjday year年的第一天的儒略日。
 * @returns 返回一个数组，第一个元素是日的天干，第二个元素是日的地支，都从0开始计数。
 */
/*
export function getChineseDate(month, day, mdays, yjday) {
  let jday = yjday + mdays[month - 1] + day + 1;
  return [(jday - 1) % 10, (jday + 1) % 12];
}
*/

// Calendar notes at the bottom of Gregorian month m in year y.
function warningMessage(year, month, lang, region, noteEarly, noteLate) {
  let warn = "";

  if (year < 618) {
    return calendarNotesBefore618(year, month, lang, region);
  }

  // Tang dynasty
  if (year > 617.5 && year < 908) {
    return calendarNotesTang(year, month, lang);
  }

  // Ming dynasty
  if (year > 1367.5 && year < 1644.5) {
    return calendarNotesMing(year, month, lang);
  }

  // Qing dynasty
  if (year > 1644.5 && year < 1911.5 && isDefaultRegionCalendar(region, year)) {
    return calendarNotesQing(year, month, lang);
  }

  // Southern Ming and Zheng dynasty
  if (region == "SouthernMing") {
    return SouthernMingCalendarDateNotes(year, month, lang);
  }

  // 1912-1979
  if (year > 1911.5 && year < 1980) {
    return calendarNotes1912_1979(year, month, lang);
  }

  // After 2050
  if (year > 2050) {
    return calendarNotesAfter2050(year, month, lang, noteEarly, noteLate);
  }

  return warn;
}

function calendarNotesBefore618(y, m, lang, region) {
  let warn = "";
  // Han calendar reform
  if (y == -103 && m == 6) {
    if (lang == 0) {
      warn =
        "New calendar is displayed starting from month 5. The lunar conjunction day was one day earlier than that of the old calendar, turning month 4 into a short month.";
    } else if (lang == 1) {
      warn = "五月起的日曆依太初曆，朔日比舊曆早一日，使四月變成小月。";
    } else {
      warn = "五月起的日历依太初历，朔日比旧历早一日，使四月变成小月。";
    }
  }

  // Xin dynasty
  if (y == 9 && m == 1) {
    if (lang == 0) {
      warn =
        "The ch&#466;u month was supposed to be month 12. It became month 1 by edict. Hence, there was no month 12 in the Chinese year W&#249; ch&#233;n.";
    } else if (lang == 1) {
      warn = "本來十二月是建丑，改正朔後建丑變成正月，所以戊辰年沒有十二月。";
    } else {
      warn = "本来十二月是建丑，改正朔后建丑变成正月，所以戊辰年没有十二月。";
    }
  }
  if (y == 23 && m > 1) {
    let month_numChi = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
    let cdates_eng = [
      "February 10th",
      "March 11th",
      "April 10th",
      "May 9th",
      "June 8th",
      "July 7th",
      "August 6th",
      "September 4th",
      "October 4th",
      "November 2nd",
      "December 2nd",
    ];
    let cdates_chi = ["2月10日", "3月11日", "4月10日", "5月9日", "6月8日", "7月7日", "8月6日", "9月4日", "10月4日", "11月2日", "12月2日"];
    let msg = [
      cdates_eng[m - 2] +
        " was the first day of month " +
        m +
        " in the Xin calendar and the first day of month " +
        (m - 1) +
        " in the Gengshi calendar.",
      cdates_chi[m - 2] + "是地皇四年" + month_numChi[m - 1] + "月初一、更始元年" + month_numChi[m - 2] + "月初一。",
      cdates_chi[m - 2] + "是地皇四年" + month_numChi[m - 1] + "月初一、更始元年" + month_numChi[m - 2] + "月初一。",
    ];
    if (m == 12) {
      msg[0] += " December 31st was the first day of month 12 in the Gengshi calendar.";
      msg[1] += "12月31日是更始元年十二月初一。";
      msg[2] += "12月31日是更始元年十二月初一。";
    }
    warn = msg[lang];
  }
  // if (y==23 && m==12) {
  //     if (lang==0) {
  //         warn = "Since month 1 was to switch back to be the y&#237;n month in the following year, there were two month 12s in this Chinese year. The first one was the z&#464; month and the second one was the ch&#466;u month. These two month 12s should not be confused as they can be distinguished by their sexagenary month cycles.";
  //     } else if (lang==1) {
  //         warn = "下一年的正月恢復為建寅，這一年的農曆有兩個十二月:建子和建丑。由於已註明了月干支，兩個十二月應不會被混淆。";
  //     } else {
  //         warn = "下一年的正月恢复为建寅，这一年的农历有两个十二月:建子和建丑。由于已注明了月干支，两个十二月应不会被混淆。";
  //     }
  // }

  // Wei dynasty
  if (y == 237 && m == 2 && isDefaultRegionCalendar(region, y)) {
    if (lang == 0) {
      warn =
        "Note that month 12 had only 28 days. This was due to the adoption of a new version of calendar in month 1. There are discrepancies between the data in the main text and Appendix 2 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The main text uses the new calendar in month 1, but Appendix 2 uses the new calendar in month 6. Here the data in the main text are used, in which the first days of each month before month 6 are one day earlier.";
    } else if (lang == 1) {
      warn =
        "由於新曆法(景初曆)於正月初一開始使用，十二月只有二十八日。《三千五百年历日天象》的正文與其附表2的資料不合，正文在正月改用景初曆，附表2在六月才改曆。這裡用正文的數據，在六月前的朔日都比附表2早一日。";
    } else {
      warn =
        "由于新历法(景初历)于正月初一开始使用，十二月只有二十八日。。《三千五百年历日天象》的正文与其附表2的资料不合，正文在正月改用景初历，附表2在六月才改历。这里用正文的数据，在六月前的朔日都比附表2早一日。";
    }
  }
  if (y == 237 && m == 4 && isDefaultRegionCalendar(region, y)) {
    if (lang == 0) {
      warn =
        "The ch&#233;n month was supposed to be month 3. It became month 4 by edict. Hence, there was no month 3 in this Chinese year.";
    } else if (lang == 1) {
      warn = "本來三月是建辰，改正朔後變成四月，所以丁巳年沒有三月。";
    } else {
      warn = "本来三月是建辰，改正朔后变成四月，所以丁巳年没有三月。";
    }
  }
  if (y == 240 && m == 1 && isDefaultRegionCalendar(region, y)) {
    if (lang == 0) {
      warn =
        "Since month 1 was to switch back to be the y&#237;n month in the year G&#275;ng sh&#275;n, there were two month 12s in the year J&#464; w&#232;i. The first one was the z&#464; month and the second one was the ch&#466;u month. These two month 12s should not be confused as they can be distinguished by their sexagenary month cycles.";
    } else if (lang == 1) {
      warn = "庚申年的正月恢復為建寅，己未年的農曆有兩個十二月:建子和建丑。由於已註明了月干支，兩個十二月應不會被混淆。";
    } else {
      warn = "庚申年的正月恢复为建寅，己未年的农历有两个十二月:建子和建丑。由于已注明了月干支，两个十二月应不会被混淆。";
    }
  }

  if (y == 238 && m == 11 && region == "Tki.Wu") {
    if (lang == 0) {
      warn =
        'In Appendix 2 of the book <i>3500 Years of Calendars and Astronomical Phenomena</i>, the sexagenary day of the leap month conjunction is listed as j&#464; ch&#466;u, corresponding to Nov. 25. This is at odds with my calculation. The result of my calculation is consistent with the data on the <a href="http://sinocal.sinica.edu.tw/" target="_blank">Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan. The preface of the book says that the calendar data in its appendices are based on the book 《歷代長術輯要》(<i>Compilation of Historical Calendars</i>) by W&#257;ng Yu&#275;zh&#275;n (汪曰楨). I looked at the book and found that the date listed there was also the same as my calculation. I suspect that the date listed in <i>3500 Years of Calendars and Astronomical Phenomena</i> is wrong. The book also lists the sexagenary day of the month 11 conjunction as j&#464; ch&#466;u, which is certainly wrong since this date was far away from the new moon close to the beginning of month 11.';
    } else if (lang == 1) {
      warn =
        '《三千五百年历日天象》附表2記閏十月己丑朔和十一月己丑朔。十一月己丑朔無疑是錯的，這裡列出的閏十月戊子朔是根據我的推步，結果與台灣中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">兩千年中西曆轉換網站</a>一致，《三千五百年历日天象》前言說其附表參照清汪曰楨的《歷代長術輯要》，翻查此書發現亦記閏十月戊子。';
    } else {
      warn =
        '《三千五百年历日天象》附表2记闰十月己丑朔和十一月己丑朔。十一月己丑朔无疑是错的，这里列出的闰十月戊子朔是根据我的推步，结果与台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换网站</a>一致，《三千五百年历日天象》前言说其附表参照清汪曰桢的《历代长术辑要》，翻查此书发现亦记闰十月戊子。';
    }
  }

  if (y == 447 && m == 12 && (region == "SouthNorth.North.NorthernWei" || region == "SouthNorth.North.WesternWei" || region == "SouthNorth.North.NorthernZhou" || region == "SouthNorth.North.Sui")) {
    if (lang == 0) {
      warn =
        "According to <i>Index to Comprehensive Mirror to Aid in Governmance</i>, the month 11 conjunction occurred on a ji&#462; x&#363; day (Dec. 23). However, in <i>Compilation of Historical Calendars</i> by W&#257;ng Yu&#275;zh&#275;n, the month 12 conjunction was listed on a ji&#462; x&#363; day and is at odds with its statement that the winter solstice occurred on a ji&#462; x&#363; day in month 11. The month 12 conjunction on a ji&#462; x&#363; day is certainly a typo because a ji&#462; x&#363; day was 29 days (or 89 days) after a y&#464; s&#236; day, which was the leap month 10 conjunction date. So ji&#462; x&#363; day could only be the month 11 conjunction date. In <i>3500 Years of Calendars and Astronomical Phenomena</i> by Zh&#257;ng P&#233;iy&#250; and <i>Tables of Historical Lunar Conjunctions and Leap Months</i> by Ch&#233;n Yu&#225;n, the month 11 conjunction is mistakenly listed on Dec. 24. They were probably misled by W&#257;ng's typo. The book <i>A Sino-Western Calendar For Two Thousand Years (1-2000)</i> by Hsueh Chung-San and Ouyang Yi correctly places the month 11 conjunction on Dec. 23. Surprisingly, the <a href='http://sinocal.sinica.edu.tw/' target='_blank'>Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan, whose ancient calendar data are based on <i>A Sino-Western Calendar For Two Thousand Years (1-2000)</i>, does not follow the book and mistakenly places the month 11 conjunction on Dec. 24.";
    } else if (lang == 1) {
      warn =
        '《通鑑目錄》記十一月甲戌朔，汪曰楨《歷代長術輯要》卻記「十乙亥、十二甲戌朔、閏十(十甲辰小雪、十一甲戌冬至)」，沒有記閏十月朔和十一月朔干支就是說兩朔日的天干和都是乙，但是「十二甲戌」是錯的，因為閏十朔是乙巳，而甲戌在乙巳後29日(或89日)，絕不可能是十二月朔，而且與其「十一甲戌冬至」相悖，可見「十二甲戌朔」應是「十一甲戌朔」之誤，「十二甲戌朔」是宋曆而非魏曆。張培瑜《三千五百年历日天象》和陳垣《二十史朔閏表》可能被《歷代長術輯要》誤導，記十一月乙亥朔及十二月甲辰朔。薛仲三、歐陽頤的《兩千年中西��對照表》則沒有錯，奇怪的是臺灣中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">兩千年中西曆轉換</a>卻不跟從《兩千年中西曆對照表》，也弄錯了十一月朔的日期。';
    } else {
      warn =
        '《通鉴目录》记十一月甲戌朔，汪曰桢《历代长术辑要》却记「十乙亥、十二甲戌朔、闰十(十甲辰小雪、十一甲戌冬至)」，没有记闰十月朔和十一月朔干支就是说两朔日的天干和都是乙，但是「十二甲戌」是错的，因为闰十朔是乙巳，而甲戌在乙巳后29日(或89日)，绝不可能是十二月朔，而且与其「十一甲戌冬至」相悖，可见「十二甲戌朔」应是「十一甲戌朔」之误，「十二甲戌朔」是宋历而非魏历。张培瑜《三千五百年历日天象》和陈垣《二十史朔闰表》可能被《历代长术辑要》误导，记十一月乙亥朔及十二月甲辰朔。薛仲三、欧阳颐的《两千年中西历对照表》则没有错，奇怪的是台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换</a>却不跟从《两千年中西历对照表》，也弄错了十一月朔的日期。';
    }
  }

  if (y == 502 && m == 6 && isDefaultRegionCalendar(region, y)) {
    if (lang == 0) {
      warn =
        "There is a discrepancy between the main text and Appendix 3 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The leap month in this year is listed as after month 5 in the main text but after month 4 in Appendix 3.";
    } else if (lang == 1) {
      warn = "《三千五百年历日天象》的正文與其附表3的資料不一致，正文記這年閏五月，附表3則為閏四月。";
    } else {
      warn = "《三千五百年历日天象》的正文与其附表3的资料不一致，正文记這年闰五月，附表3则为闰四月。";
    }
  }

  if (y == 575 && m == 9 && isDefaultRegionCalendar(region, y)) {
    if (lang == 0) {
      warn =
        "There is a discrepancy between the main text and Appendix 3 in the book <i>3500 Years of Calendars and Astronomical Phenomena</i>. The leap month in this year is listed as after month 8 in the main text but after month 9 in Appendix 3.";
    } else if (lang == 1) {
      warn = "《三千五百年历日天象》的正文與其附表3的資料不一致，正文記這年閏八月，附表3則為閏九月。";
    } else {
      warn = "《三千五百年历日天象》的正文与其附表3的资料不一致，正文记這年闰八月，附表3则为闰九月。";
    }
  }

  if (y == 575 && m == 9 && (region == "SouthNorth.North.EasternWei" || region == "SouthNorth.North.NorthernQi")) {
    if (lang == 0) {
      warn =
        "Appendix 3 of the book <i>3500 Years of Calendars and Astronomical Phenomena</i> lists the leap month as after month 9. This is at odds with my calculation, which agrees with the data on the <a href='http://sinocal.sinica.edu.tw/' target='_blank'>Chinese-Western calendar conversion website</a> created by Academia Sinica in Taiwan. The data in Appendix 3 are supposed to be based on the book 《歷代長術輯要》(<i>Compilation of Historical Calendars</i>) by W&#257;ng Yu&#275;zh&#275;n (汪曰楨), but that book also lists the leap month as after month 8. That's why I use my calculation here.";
    } else if (lang == 1) {
      warn =
        "《三千五百年历日天象》附表3記這年北齊閏九月，與我計算的閏八月不一致，台灣中央研究院的<a href='http://sinocal.sinica.edu.tw/' target='_blank'>兩千年中西曆轉換網站</a>和汪曰楨的《歷代長術輯要》也記這年閏八月，所以這裡不取《三千五百年历日天象》的數據。";
    } else {
      warn =
        '《三千五百年历日天象》附表3记这年北齐闰九月，与我计算的闰八月不一致，台湾中央研究院的<a href="http://sinocal.sinica.edu.tw/" target="_blank">两千年中西历转换网站</a>和汪曰桢的《历代长术辑要》也记这年闰八月，所以这里不取《三千五百年历日天象》的数据。';
    }
  }

  return warn;
}

function calendarNotesTang(y, m, lang) {
  let warn = "";
  if (y == 678 && (m == 11 || m == 12)) {
    if (lang == 0) {
      warn =
        'The <i>Old Book of Tang</i> mentions leap month 10 in this year. However, the <i>New Book of Tang</i> mentions leap month 11. Many scholars adopt the data in the <i>New Book of Tang</i>. However, Huang Yi-Long, Professor in the Institute of History at the National Tsing-Hua University in Taiwan, <a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">investigated the issue</a> and concludes that the record in the <i>Old Book of Tang</i> is more reliable. His analysis places leap month 10 beginning on Nov. 19 and month 11 beginning on Dec. 19.';
    } else if (lang == 1) {
      warn =
        '《舊唐書》有閏十月的記載，《新唐書》卻有閏十一月記載，學者一般取《新唐書》的閏月。但台灣國立清華大學歷史研究所的黃一農教授經過<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">考證</a>後認為《舊唐書》的記載比較可信。根據他的考證，閏十月朔是癸丑(11月19日)，十一月朔是癸未(12月19日)。';
    } else {
      warn =
        '《旧唐书》有闰十月的记载，《新唐书》却有闰十一月记载，学者一般取《新唐书》的闰月。但台湾国立清华大学历史研究所的黄一农教授经过<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">考证</a>后认为《旧唐书》的记载比较可信。根据他的考证，闰十月朔是癸丑(11月19日)，十一月朔是癸未(12月19日)。';
    }
  }
  if (y == 684 && m == 1) {
    if (lang == 0) {
      warn = "The New Year day was supposed to be on Jan 22, but it was moved to Jan 23 by edict.";
    } else if (lang == 1) {
      warn = "正月朔本在癸未(1月22日)，但唐高宗在弘道元年八月下旨，強將十二月改為大月，使正月朔移至甲申(1月23日)。";
    } else {
      warn = "正月朔本在癸未(1月22日)，但唐高宗在弘道元年八月下旨，强将十二月改为大月，使正月朔移至甲申(1月23日)。";
    }
  }
  if (y==697 && m==12) {
      if (lang==0) {
          warn = 'The calendrical winter solstice was originally on Dec. 18, but Empress Consort Wu changed several calendar dates by edict. It was claimed that several predicted conjunction dates in the previous years were incorrect, resulting in the Moon being visible on the last days of lunar months. The claim was in fact incorrect and was a pretense for the empress to change calendar dates so that the winter solstice would fall on the ji&#462; z&#464; day (Dec. 20) and coincide with the lunar conjunction. After an "investigation", it was decided that the winter solstice should be moved to the ji&#462; z&#464; day (Dec. 20), which "happened to coincide" with the lunar conjunction. Because of this change, the lunar month started on Nov. 20 became a leap month and the winter solstice became the New Year day. There was originally a leap month after month 12. It had to be changed to month 12. In order to do that, the middle solar term Z12 was moved from Jan 17, 698 to Jan 18, 698.';
      } else if (lang==1) {
          warn = '曆書冬至本在壬戌(12月18日)，閏十月本為正月，但武則天為了營造正月甲子合朔冬至之罕見曆象，七月下詔強行更改曆日。詔書偽稱曆官所推合朔時刻有不合天象，出現了「晦仍見月，有爽天經」之象，經「重更尋討」後「果差一日」，於是強將原本所推冬至移後二日為正月甲子合朔冬至，使原本的正月變為閏十月，為了除消原本所推的閏十二月，又強將大寒由壬辰(698年1月17日)推遲一日至癸巳(698年1月18日)。';
      } else {
          warn = '历书冬至本在壬戌(12月18日)，闰十月本为正月，但武则天为了营造正月甲子合朔冬至之罕见历象，七月下诏强行更改历日。诏书伪称历官所推合朔时刻有不合天象，出现了「晦仍见月，有爽天经」之象，经「重更寻讨」后「果差一日」，于是强将原本所推冬至移后二日为正月甲子合朔冬至，使原本的正月变为闰十月，为了除消原本所推的闰十二月，又强将大寒由壬辰(698年1月17日)推迟一日至癸巳(698年1月18日)。';
      }
  }
  if (y == 698 && m == 1) {
    if (lang == 0) {
      warn =
        "The calendrical Z12 was originally on Jan. 17, but was changed to Jan. 18 in order to cancel a leap month originally calculated but was moved to after the 10th month of the previous year.";
    } else if (lang == 1) {
      warn = "曆書大寒本在壬辰(1月17日)，曆官強行移後一日以除消原本所推的閏月。";
    } else {
      warn = "历书大寒本在壬辰(1月17日)，历官强行移后一日以除消原本所推的闰月。";
    }
  }
  if (y == 725 && m == 1) {
    if (lang == 0) {
      warn =
        "The conjunction on Jan 19 was supposed to be the New Year day for the Chinese year in 725. However, in order to prevent a solar eclipse on the New Year day, the leap month was moved to a month earlier by edict and became the last month in the Chinese year in 724 and the New Year day was moved to Feb 18, 725.";
    } else if (lang == 1) {
      warn =
        "丙辰朔本是開元十三年正月朔，為避正旦日食，當時強將閏月推前一月，使正月丙辰朔變閏十二月丙辰朔，閏正月丙戌朔(2月18日)變正月丙戌朔。";
    } else {
      warn =
        "丙辰朔本是开元十三年正月朔，为避正旦日食，当时强将闰月推前一月，使正月丙辰朔变闰十二月丙辰朔，闰正月丙戌朔(2月18日)变正月丙戌朔。";
    }
  }
  if (y == 725 && m == 2) {
    if (lang == 0) {
      warn =
        "The month associated with the conjunction on Feb 18 was supposed to be a leap month, but the leap month was moved to a month earlier in order to prevent a solar eclipse on the New Year day. As a result, the Feb 18 conjunction became the New Year day. The calendrical Z1 was also moved from Feb 16 to Feb 18 to be consistent with the change.";
    } else if (lang == 1) {
      warn =
        "丙戌朔本是閏正月朔，為避正旦日食，當時強將閏月推前一月，故閏正月朔變為正月朔。曆書雨水(當時稱為啟蟄)本在甲申(2月16日)，亦強進為丙戌(2月18日)。";
    } else {
      warn =
        "丙戌朔本是闰正月朔，为避正旦日食，当时强将闰月推前一月，故闰正月朔变为正月朔。历书雨水(当时称为启蛰)本在甲申(2月16日)，亦强进为丙戌(2月18日)。";
    }
  }
  if (y == 761 && m == 12) {
    if (lang == 0) {
      warn =
        "The z&#464; month was supposed to be month 11, but it became month 1 by edict. There were no months 11 and 12 in the year X&#299;n ch&#466;u";
    } else if (lang == 1) {
      warn = "本來建子是十一月，改正朔後變成正月。農曆辛丑年沒有十一和十二月。";
    } else {
      warn = "本来建子是十一月，改正朔后变成正月。农历辛丑年没有十一和十二月。";
    }
  }
  if (y == 762 && m == 4) {
    if (lang == 0) {
      warn =
        "Note that there was a second month 4 and second month 5 this year because it was decided that after the first month 5, the month numbers were switched back to the y&#237;n month being month 1, m&#462;o month being month 2, ch&#233;n being month 3, s&#236; month being month 4 and so on. As a result, there were two month 4s and two month 5s in this Chinese year. They can be distinguished by their sexagenary month cycles.";
    } else if (lang == 1) {
      warn =
        "五月之後的那個月是四月。這是因為五月後正朔改回以建寅為正月、建卯為二月、建辰為三月、建巳為四月等。農曆壬寅年因此有兩個四月（建卯和建巳）和兩個五月（建辰和建午）。由於已註明月干支，這些重複的月份應不會被混潸。";
    } else {
      warn =
        "五月之后的那个月是四月。这是因为五月后正朔改回以建寅为正月、建卯为二月、建辰为三月、建巳为四月等。农历壬寅年因此有两个四月（建卯和建巳）和两个五月（建辰和建午）。由于已注明月干支，这些重复的月份应不会被混潸。";
    }
  }
  return warn;
}

function calendarNotesMing(y, m, lang) {
  let warn = "";

  // Gregorian calendar reform
  if (y == 1582 && m == 10) {
    if (lang == 0) {
      warn = "Note that October 4 was followed by October 15 because of the Gregorian calendar reform.";
    } else if (lang == 1) {
      warn = "由於格里高里曆改，10月4日的下一日是10月15日，跳了10日。";
    } else {
      warn = "由于格里高里历改，10月4日的下一日是10月15日，跳了10日。";
    }
  }

  // 1462
  if (y == 1462 && m == 11) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 11 on Nov. 22, which is inconsistent with the calendar issued by the Ming government (Nov. 21).";
    } else if (lang == 1) {
      warn =
        '《三千五百年历日天象》記十一月壬辰朔(11月22日)，不合當年的《大統曆》曆書(辛卯朔, 11月21日)，見<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">「中國史曆表朔閏訂正舉隅 &mdash; 以唐《麟德曆》行用時期為例」</a>緒言。';
    } else {
      warn =
        '《三千五百年历日天象》记十一月壬辰朔(11月22日)，不合当年的《大统历》历书(辛卯朔, 11月21日), 见<a href="http://ccsdb.ncl.edu.tw/ccs/image/01_010_002_01_11.pdf" target="_blank">「中国史历表朔闰订正举隅 &mdash; 以唐《麟德历》行用时期为例」</a>绪言。';
    }
  }

  // 1581
  if (y == 1581 && m == 10) {
    if (lang == 0) {
      warn = '<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 10 on Oct. 28, which is inconsistent with the calendar issued by the Ming government (Oct. 27).';
    } else if (lang == 1) {
      warn =
        "《三千五百年历日天象》記十月壬辰朔(10月28日)，不合當年的《大統曆》曆書(辛卯朔, 10月27日)，見《國家圖書館藏明代大統曆日彙編》第三冊第606頁。";
    } else {
      warn =
        "《三千五百年历日天象》记十月壬辰朔(10月28日)，不合当年的《大统历》历书(辛卯朔, 10月27日)，见《国家图书馆藏明代大统历日汇编》第三册第606页。";
    }
  }

  // 1588, 1589
  if (y == 1588 && m == 3) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 3 on Mar. 26, which is inconsistent with the calendar issued by the Ming government (Mar. 27).";
    } else if (lang == 1) {
      warn =
        '《三千五百年历日天象》記三月癸未朔(3月26日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">當年的《大統曆》曆書</a>(甲申朔, 3月27日)。';
    } else {
      warn =
        '《三千五百年历日天象》记三月癸未朔(3月26日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">当年的《大统历》历书</a>(甲申朔, 3月27日)。';
    }
  }
  if (y == 1588 && m == 4) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 4 on Apr. 25, which is inconsistent with the calendar issued by the Ming government (Apr. 26).";
    } else if (lang == 1) {
      warn =
        '《三千五百年历日天象》記四月癸丑朔(4月25日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">當年的《大統曆》曆書</a>(甲寅朔, 4月26日)。';
    } else {
      warn =
        '《三千五百年历日天象》记四月癸丑朔(4月25日)，不合<a href="http://catalog.digitalarchives.tw/item/00/07/ec/c9.html" target="_blank">当年的《大统历》历书</a>(甲寅朔, 4月26日)。';
    }
  }
  if (y == 1589 && m == 1) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the first day of month 12 on Jan. 17, which is inconsistent with the calendar issued by the Ming government (Jan. 16).";
    } else if (lang == 1) {
      warn =
        "《三千五百年历日天象》記十二月庚辰朔(1月17日)，不合當年的《大統曆》曆書(己卯朔, 1月16日)，見《國家圖書館藏明代大統曆日彙編》第四冊第175頁。";
    } else {
      warn =
        "《三千五百年历日天象》记十二月庚辰朔(1月17日)，不合当年的《大统历》历书(己卯朔, 1月16日)，见《国家图书馆藏明代大统历日汇编》第四册第175页。";
    }
  }

  // 1600
  if (y == 1600 && m == 2) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the New Year day on Feb. 14, which is inconsistent with the calendar issued by the Ming government (Feb. 15).";
    } else if (lang == 1) {
      warn =
        "《三千五百年历日天象》記正月乙巳朔(2月14日)，不合當年的《大統曆》曆書(丙午朔, 2月15日)，見《國家圖書館藏明代大統曆日彙編》第四冊第445頁。";
    } else {
      warn =
        "《三千五百年历日天象》记正月乙巳朔(2月14日)，不合当年的《大统历》历书(丙午朔, 2月15日)，见《国家图书馆藏明代大统历日汇编》第四册第445页。";
    }
  }

  // 1609
  if (y == 1609 && m == 2) {
    if (lang == 0) {
      warn =
        "<i>3500 Years of Calendars and Astronomical Phenomena</i> lists the New Year day on Feb. 4, which is inconsistent with the calendar issued by the Ming government (Feb. 5).";
    } else if (lang == 1) {
      warn =
        "《三千五百年历日天象》記正月癸未朔(2月4日)，不合當年的《大統曆》曆書(甲申朔, 2月5日)，見《國家圖書館藏明代大統曆日彙編》第五冊第67頁。";
    } else {
      warn =
        "《三千五百年历日天象》记正月癸未朔(2月4日)，不合当年的《大统历》历书(甲申朔, 2月5日)，见《国家图书馆藏明代大统历日汇编》第五册第67页。";
    }
  }

  return warn;
}

function calendarNotesQing(y, m, lang) {
    let warn = '';

    // 1645
    if (y==1645 && m==7) {
        if (lang==0) {
            warn = 'Note that leap month 6 contained the major solar term Z6, breaking the rule that a leap month must not contain a major solar term. W&#257;ng Yu&#275;zh&#275;n (&#27754;&#26352;&#26984;), a Chinese mathematician in the 19th century, explained that even though the solar term Z6 and the lunar conjunction associated with the month occurred on the same day, Z6 occurred earlier in the day than the lunar conjunction and was counted as a major solar term of the previous month. As a result, leap month 6 did not contain any major solar term. This "rule" was only used in this year. It was never used again after this year.';
        } else if (lang==1) {
            warn = '大暑這中氣出現在閏六月初一，違反了閏月不含中氣的規定。清朝曆算家汪曰楨解釋說雖然大暑與朔發生在同一日，大暑的時刻早於合朔時刻，屬於前月之中氣，所以閏六月不含中氣。這說法明顯不合傳統，屬於新的置閏法則，但是這新法則只在這一年用過，以後不再使用。';
        } else {
            warn = '大暑这中气出现在闰六月初一，违反了闰月不含中气的规定。清朝历算家汪曰桢解释说虽然大暑与朔发生在同一日，大暑的时刻早于合朔时刻，属于前月之中气，所以闰六月不含中气。这说法明显不合传统，属于新的置闰法则，但是这新法则只在这一年用过，以后不再使用。';
        }
        return warn;
    }

    // 1662
    if (y==1662 && m==2) {
        if (lang==0) {
            warn = 'The Chinese New Year in 1662 was originally on Feb. 19. There was a leap month after month 7 in 1661 and two major solar terms (Z11 and Z12) in month 11. The major solar term Z1 was originally placed on the last day of month 12 in 1661, leaving the first month in 1662 without a major solar term. To avoid controversy, the New Year Day was moved to Feb. 18 so that the first month would contain Z1, thus moving the month without major solar term to the last month of 1661.';
        } else if (lang==1) {
            warn = '康熙元年正月初一本在丙子日(2月19日)，事緣順治十八年閏七月，當年十一月含冬至和大寒兩中氣，雨水本來定在十二月晦，但這使康熙元年正月不含中氣。為免遭人非議，欽天監將正月初一提前一日至乙亥日(2月18日)，使正月含雨水，無中氣月便移到十二月。';
        } else {
            warn = '康熙元年正月初一本在丙子日(2月19日)，事缘顺治十八年闰七月，当年十一月含冬至和大寒两中气，雨水本来定在十二月晦，但这使康熙元年正月不含中气。为免遭人非议，钦天监将正月初一提前一日至乙亥日(2月18日)，使正月含雨水，无中气月便移到十二月。';
        }
        return warn;
    }
    
    // 1670
    if (y==1670 && m==1) {
        if (lang==0) {
            warn = 'The Chinese month that began on Jan 21 was a leap month according to the old calendar rule since it did not contain a major solar term. It was the first month of 1670 according to the new rule since it contained the major solar term Z1. In April 1669, the Kangxi Emperor abolished the old rule and ordered by decree to move the leap month from after the 12th month of 1669 to after the second month of 1670.';
        } else if (lang==1) {
            warn = '己丑朔(1月21日)對應的月份依舊法因不含中氣，為康熙八年閏十二月，依新法則含中氣雨水，為康熙九年正月。康熙帝在康熙八年三月下詔復用西洋新法，廢康熙八年閏十二月，改為康熙九年閏二月。';
        } else {
            warn = '己丑朔(1月21日)对应的月份依旧法因不含中气，为康熙八年闰十二月，依新法则含中气雨水，为康熙九年正月。康熙帝在康熙八年三月下诏复用西洋新法，废康熙八年闰十二月，改为康熙九年闰二月。';
        }
        return warn;
    }

    // 1679
    if (y==1679 && m==5) {
        if (lang==0) {
            warn = "In both <i>3500 Years of Calendars and Astronomical Phenomena</i> (by Zhang Peiyu) and <i>A Chinese calendar translated into the western calendar from 1516 to 1941</i> (by Zheng Hesheng), the calendrical solar term Z4 is listed on May 20. However, the Shixian Calendar for the 18th year of Emperor Kangxi's Reign (i.e. Feb. 11, 1679 - Jan. 30, 1680), a yearly calendar issued by the Imperial Astronomical Bureau in the Qing dynasty, lists Z4 on May 21 at 9:01am in Beijing's local apparent solar time. The calendarical solar term for Z4 is listed on May 21 here based on the Shixian Calendar.";
        } else if (lang==1) {
            warn = '張培瑜《三千五百年历日天象》和鄭鶴聲《近世中西史日對照表》皆記小滿為5月20日，但《大清康熙十八年歲次己未時憲曆》則載「(四月)十二日丙子巳初初刻一分小滿四月中」，即小滿在四月十二日(公曆5月21日)九時零一分(北京地方真太陽時)。這裡根據《大清時憲曆》記曆書小滿為公曆5月21日。';
        } else {
            warn = '张培瑜《三千五百年历日天象》和郑鹤声《近世中西史日对照表》皆记小满为5月20日，但《大清康熙十八年岁次己未时宪历》则载「(四月)十二日丙子巳初初刻一分小满四月中」，即小满在四月十二日(公历5月21日)九时零一分(北京地方真太阳时)。这里根据《大清时宪历》记历书小满为公历5月21日。';
        }
        return warn;
    }

    // 1848
    if (y==1848 && m==12) {
        if (lang==0) {
            warn = 'Z11 (December solstice) was on Dec 21 at 23:59:37 (UT1+8) according to the calculation using DE441. The calendrical Z11 was on Dec 22.';
        } else if (lang==1) {
            warn = 'DE441曆表算出的冬至時刻在12月21日23:59:57 (UT1+8)，曆書冬至在12月22日。';
        } else {
            warn = 'DE441历表算出的冬至时刻在12月21日23:59:57 (UT1+8)，历书冬至在12月22日。';
        }
        return warn;
    }

    // Deal with the calendrical solar terms after 1733 that didn't match solar terms 
    // computed by modern method
    let items = [{'y':1736, 'm':1, 's':'Z12', 'd':20},
              {'y':1739, 'm':1, 's':'J12', 'd':5},
              {'y':1744, 'm':7, 's':'Z6', 'd':22},
              {'y':1746, 'm':3, 's':'J2', 'd':5},
              {'y':1747, 'm':7, 's':'J6', 'd':7},
              {'y':1749, 'm':4, 's':'J3', 'd':4},
              {'y':1751, 'm':10, 's':'J9', 'd':9},
              {'y':1753, 'm':6, 's':'J5', 'd':5},
              {'y':1756, 'm':9, 's':'Z8', 'd':23},
              {'y':1760, 'm':4, 's':'Z3', 'd':19},
              {'y':1774, 'm':2, 's':'J1', 'd':3},
              {'y':1774, 'm':9, 's':'J8', 'd':8},
              {'y':1779, 'm':3, 's':'J2', 'd':5},
              {'y':1779, 'm':6, 's':'Z5', 'd':21},
              {'y':1781, 'm':12, 's':'J11', 'd':7},
              {'y':1782, 'm':4, 's':'J3', 'd':4},
              {'y':1784, 'm':10, 's':'J9', 'd':8},
              {'y':1787, 'm':2, 's':'Z1', 'd':18},
              {'y':1807, 'm':2, 's':'J1', 'd':4},
              {'y':1809, 'm':1, 's':'J12', 'd':5},
              {'y':1809, 'm':11, 's':'Z10', 'd':23},
              {'y':1812, 'm':3, 's':'J2', 'd':5},
              {'y':1815, 'm':4, 's':'J3', 'd':5},
              {'y':1817, 'm':10, 's':'J9', 'd':9},
              {'y':1820, 'm':2, 's':'Z1', 'd':19},
              {'y':1824, 'm':8, 's':'J7', 'd':8},
              {'y':1826, 'm':5, 's':'Z4', 'd':21},
              {'y':1829, 'm':11, 's':'J10', 'd':8},
              {'y':1836, 'm':9, 's':'J8', 'd':8},
              {'y':1844, 'm':6, 's':'J5', 'd':6},
              {'y':1846, 'm':11, 's':'Z10', 'd':23},
              {'y':1849, 'm':5, 's':'J4', 'd':5},
              {'y':1850, 'm':10, 's':'J9', 'd':9},
              {'y':1851, 'm':9, 's':'Z8', 'd':24},
              {'y':1851, 'm':12, 's':'J11', 'd':8},
              {'y':1855, 'm':4, 's':'Z3', 'd':20},
              {'y':1862, 'm':10, 's':'Z9', 'd':24},
              {'y':1862, 'm':11, 's':'J10', 'd':8},
              {'y':1864, 'm':7, 's':'Z6', 'd':23},
              {'y':1866, 'm':10, 's':'Z9', 'd':24},
              {'y':1867, 'm':7, 's':'J6', 'd':8},
              {'y':1867, 'm':8, 's':'Z7', 'd':24},
              {'y':1879, 'm':1, 's':'J12', 'd':6},
              {'y':1879, 'm':11, 's':'Z10', 'd':23},
              {'y':1883, 'm':10, 's':'J9', 'd':9},
              {'y':1884, 'm':9, 's':'Z8', 'd':23},
              {'y':1884, 'm':12, 's':'J11', 'd':7},
              {'y':1886, 'm':8, 's':'J7', 'd':8},
              {'y':1895, 'm':10, 's':'Z9', 'd':24},
              {'y':1895, 'm':11, 's':'J10', 'd':8},
              {'y':1898, 'm':9, 's':'J8', 'd':8},
              {'y':1899, 'm':6, 's':'Z5', 'd':22},
              {'y':1899, 'm':10, 's':'Z9', 'd':24}];
    let nitems = items.length;
    for (let i=0; i<nitems; i++) {
        if (y==items[i]['y'] && m==items[i]['m']) {
            let stName = langConstant(lang).soltermNames;
            let stLab = ["J12", "Z12", "J1", "Z1", "J2", "Z2", "J3","Z3", 
                         "J4", "Z4", "J5", "Z5", "J6", "Z6", "J7", "Z7", 
                        "J8", "Z8", "J9", "Z9", "J10", "Z10", "J11", "Z11"];
            // create a solar term dictionarys
            let sts = {};
            for (let j=0; j<24; j++) {
                sts[stLab[j]] = stName[j];
            }
            let sterm = sts[items[i]['s']]; // look up the name of the solar term
            if (lang==0) {
                let mon = ['January ', 'February ', 'March ', 'April ', 'May ', 'June ', 'July ', 'August ', 'September ', 'October ', 'November ', 'December ']
                warn = 'The calendrical ' + sterm + ' was on ' + mon[m-1] + items[i]['d'];
            } else {
                warn = (lang==1 ? '曆書':'历书') + sterm + '在' + items[i]['d'] + '日。'
            }
            return warn;
        }
    }

    return warn;
}

function SouthernMingCalendarDateNotes(y, m, lang) {
    let notes = [
        {y:1648, m:4, 
        w:['Several sources indicate that the leap month in this year was after the 6th month, which I find to be very unlikely.', 
        '王叔武"南明史料朔閏考異"引 《劫灰錄》、 《鹿樵紀聞》、 《明季南略》、 《爝火錄》說永曆二年閏六月，我認為閏六月很可能不對。', 
        '王叔武"南明史料朔闰考异"引 《劫灰录》、 《鹿樵纪闻》、 《明季南略》、 《爝火录》说永历二年闰六月，我认为闰六月很可能不对。']}, 

        {y:1649, m:2, 
        w:['Two dfferent versions of calendar in the Southern Ming dynasty were produced in the Chinese year in 1649. One of them was produced by the officials of the Yongli emperor, in which the New Year day was on February 11th, 1649. Another version was produced by the officials of the Prince of Lu, who named himself regent. The New Year day of the Lu calendar was on February 12th, 1649. According to the calculation of the Datong system, the New Year day was on February 11th, 1649.', 
        '永曆三年和魯王監國四年正月朔有異:永曆三年正月庚申朔(公曆2月11日);《魯監國大統曆》則有魯監國四年正月辛酉朔(2月12日)。依明大統曆推算此年正月朔為庚申。', 
        '永历三年和鲁王监国四年正月朔有异:永历三年正月庚申朔(公历2月11日);《鲁监国大统历》则有鲁监国四年正月辛酉朔(2月12日)。依明大统历推算此年正月朔为庚申。']},

        {y:1650, m:12, 
         w:["According to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> by Fu Yili and <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> (or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i>), the leap month in 1650 was after the 11th month in the Southern Ming calendar. This is consistent with the calculation by the Datong system. However, the Datong calendars produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a>, <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a> recorded the leap month to be after the 12th month. Leap month 12 was probably based on an unofficial calendar expediently produced by the Zheng officials in 1649 since the official emperor calendar had not arrived in time because of war.", 
         '傅以禮《殘明大統曆》和《延平王戶官楊英從征實錄》記永曆四年閏十一月，符合大統曆的推算，但明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>、<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆四年閏十二月。閏十二月或許是當年鄭氏命官員權宜頒行的大統曆推算出的。', 
         '傅以礼《残明大统历》和《延平王户官杨英从征实录》记永历四年闰十一月，符合大统历的推算，但明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>、<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历四年闰十二月。闰十二月或许是当年郑氏命官员权宜颁行的大统历推算出的。']}, 
        {y:1651, m:1, 
         w:["According to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> by Fu Yili and <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> (or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i>), the leap month in 1650 was after the 11th month in the Southern Ming calendar. This is consistent with the calculation by the Datong system. However, the Datong calendars produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a>, <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a> recorded the leap month to be after the 12th month. Leap month 12 was probably based on an unofficial calendar expediently produced by the Zheng officials in 1649 since the official emperor calendar had not arrived in time because of war.", 
         '傅以禮《殘明大統曆》和《延平王戶官楊英從征實錄》記永曆四年閏十一月，符合大統曆的推算，但明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>、<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆四年閏十二月。閏十二月或許是當年鄭氏命官員權宜頒行的大統曆推算出的。', 
         '傅以礼《残明大统历》和《延平王户官杨英从征实录》记永历四年闰十一月，符合大统历的推算，但明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>、<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历四年闰十二月。闰十二月或许是当年郑氏命官员权宜颁行的大统历推算出的。']},

        {y:1652, m:2, 
         w:["Two dfferent versions of calendar were produced in the Chinese year in 1652: emperor Yongli's and Prince Lu's version. The New Year day of the Yongli calendar was on February 10th, 1652. The New Year day of the Lu calendar was on February 9th, 1652. According to the calculation of the Datong system, the New Year day was on February 10th, 1652.", 
         '永曆六年和魯王監國七年正月朔有異:永曆六年正月甲戌朔(公曆2月10日);《魯監國大統曆》則有魯監國七年正月癸酉朔(2月9日)。依明大統曆推算此年正月朔為甲戌。', 
         '永历六年和鲁王监国七年正月朔有异:永历六年正月甲戌朔(公历2月10日);《鲁监国大统历》则有鲁监国七年正月癸酉朔(2月9日)。依明大统历推算此年正月朔为甲戌。']},

        {y:1653, m:8, 
         w:["There are discrepancies in the leap month in this year among various sources. <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records the leap month to be after the 7th month, which is consistent with the caleculation of the Datong system. <i>Y&#225;n P&#237;ng W&#225;ng H&#249; Gu&#257;n Y&#225;ng Y&#299;ng C&#243;ng Zh&#275;ng Sh&#237; L&#249;</i> or <i>Account of the quartermaster Yang Ying's campaign with Prince Yanping</i> has the leap month after the 8th month. The chronicle <i>X&#237;ng Z&#224;i Y&#225;ng Qi&#363;</i> records the leap month to be after the 6th month. The Datong calendar produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a> also records leap month after the 6th month. However, in the Datong calendar for <a href='N1676_Zheng.html'>1676</a> and <a href='N1677_Zheng.html'>1677</a>, the leap month is changed to being after the 8th month. I think leap month 6 is unlikely. Both leap month 7 and 8 are possible. Here I follow <i>Datong Calendar of the Waning Ming Dynasty</i> and place the leap month after the 7th month.", 
         '此年的閏月有爭議，依大統曆推算閏七月，傅以禮《殘明大統曆》亦記閏七月，但是《延平王戶官楊英從征實錄》記閏八月，《行在陽秋》記閏六月，明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>也記閏六月，但是後來頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>卻改為閏八月。我認為閏六月不大可能，閏七月和閏八月機會較大，此處依《殘明大統曆》記閏七月。', 
         '此年的闰月有争议，依大统历推算闰七月，傅以礼《残明大统历》亦记闰七月，但是《延平王户官杨英从征实录》记闰八月，《行在阳秋》记闰六月，明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>也记闰六月，但是后来颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>却改为闰八月。我认为闰六月不大可能，闰七月和闰八月机会较大，此处依《残明大统历》记闰七月。']}, 

        {y:1663, m:9, 
         w:['Calendrical J8 should be on September 6th according to the calculation of the Datong system. However, <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records J8 on September 5th, which is the date listed here.', 
         '依大統曆推算白露在八月初五(公曆9月6日)，但傅以禮《殘明大統曆》記八月初四(9月5日)，此處曆書白露依《殘明大統曆》。', 
         '依大统历推算白露在八月初五(公历9月6日)，但傅以礼《残明大统历》记八月初四(9月5日)，此处历书白露依《残明大统历》。']}, 

        {y:1671, m:2, 
         w:["The Chinese Near Year in 1671 was on February 9th according to <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i>, which also agrees with the calculation of the Datong system. However, the Datong calendar produced by the Zheng dynasty for <a href='N1671_Zheng.html'>1671</a> indicates that the New Year day was on February 10th. Even though Zheng dynasty claimed that their calendars were produced expediently and should not to be taken as official, by this time the Yongli emperor had died and the Southern Ming dynasty had already ended. Zheng's calendar became the de facto official Datong calendar of the state. So I change the New Year day to February 10th in accord with Zheng's calendar.", 
         '依大統曆推算永曆二十五正月朔在癸丑(公曆2月9日)，傅以禮《殘明大統曆》亦記正月癸丑朔，但是明鄭頒行的<a href="N1671_Zheng_chinese.html">永曆二十五年大統曆</a>記正月甲寅朔(2月10日)。雖然鄭氏奉明正朔，聲稱其大統曆乃「權宜頒行」，但是當時永曆帝已死，南明也已亡，明鄭的大統曆變相成為正統的大統曆書，所以此處依明鄭大統曆記正月甲寅朔。', 
         '依大统历推算永历二十五正月朔在癸丑(公历2月9日)，傅以礼《残明大统历》亦记正月癸丑朔，但是明郑颁行的<a href="N1671_Zheng_simp.html">永历二十五年大统历</a>记正月甲寅朔(2月10日)。虽然郑氏奉明正朔，声称其大统历乃「权宜颁行」，但是当时永历帝已死，南明也已亡，明郑的大统历变相成为正统的大统历书，所以此处依明郑大统历记正月甲寅朔。']}, 

        {y:1674, m:7, 
         w:['According to the calculation of the Datong system, the month 6 conjunction was on July 4th, which is inconsistent with the record in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> (July 3rd). July 3rd is used here.', 
         '依明大統曆推算六月朔在甲午(公曆7月4日)，此處依傅以禮《殘明大統曆》改為六月癸巳朔(7月3日)。', 
         '依明大统历推算六月朔在甲午(公历7月4日)，此处依傅以礼《残明大统历》改为六月癸巳朔(7月3日)。']}, 

        {y:1674, m:9, 
         w:['According to the calculation of the Datong system, the month 9 conjunction was on September 30th, which is inconsistent with the record in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> (September 29th). September 29th is used here.', 
         '依明大統曆推算九月朔在壬戌(公曆9月30日)，此處依傅以禮《殘明大統曆》改為九月辛酉朔(9月29日)。', 
         '依明大统历推算九月朔在壬戌(公历9月30日)，此处依傅以礼《残明大统历》改为九月辛酉朔(9月29日)。']}, 

        {y:1675, m:7, 
         w:['According to the calculation of the Datong system, a conjunction occurred on July 22nd. <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records a conjunction on July 23rd. The one-day difference changed the leap month in this year. July 22nd conjunction resulted in a leap month after the 5th month. July 23rd conjunction resulted in a leap month after the 6th month. Leap month 6 is also recorded in the calendars produced by the Zheng dynasty for <a href="N1676_Zheng.html">1676</a> and <a href="N1677_Zheng.html">1677</a>. So I use the data in <i>Datong Calendar of the Waning Ming Dynasty</i>.', 
         '依明大統曆推算有朔日在丁巳(公曆7月22日)，對應的朔日在傅以禮《殘明大統曆》出現在下一日戊午(7月23日)。此一日之差造成閏月分歧:依大統曆推算閏五月，《殘明大統曆》則為閏六月。明鄭頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>及<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>都記永曆二十九年閏六月，所以此處朔閏依《殘明大統曆》。', 
         '依明大统历推算有朔日在丁巳(公历7月22日)，对应的朔日在傅以礼《残明大统历》出现在下一日戊午(7月23日)。此一日之差造成闰月分歧:依大统历推算闰五月，《残明大统历》则为闰六月。明郑颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>及<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>都记永历二十九年闰六月，所以此处朔闰依《残明大统历》。']}, 

         {y:1676, m:12,
          w:['<i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i> records that Z11 (winter solstice) was on the 16th day in month 11 (Dec. 20), which is inconsistent with the calculation of the Datong system (Dec. 21). The official <a href="N1676_Zheng.html">Datong Calendar for 1676</a> records Z11 on the 17th day in month 11 (Dec. 21). So the Z11 date in <i>Datong Calendar of the Waning Ming Dynasty</i> is wrong.', 
          '《殘明大統曆》記冬至在十一月十六(公曆12月20日)，不合明大統曆的推步(十一月十七)。明鄭頒行的<a href="N1676_Zheng_chinese.html">永曆三十年大統曆</a>記冬至在十一月十七(12月21日)，證實《殘明大統曆》的冬至日期錯了。', 
          '《残明大统历》记冬至在十一月十六(公历12月20日)，不合明大统历的推步(十一月十七)。明郑颁行的<a href="N1676_Zheng_simp.html">永历三十年大统历</a>记冬至在十一月十七(12月21日)，证实《残明大统历》的冬至日期错了。']},

         {y:1677, m:7, 
          w:['According to the calculation of the Datong system, month 7 conjunction was on July 29th, which is inconsistent with July 30th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or  <i>Datong Calendar of the Waning Ming Dynasty</i> and the calendar produced by the Zheng dynasty for <a href="N1677_Zheng.html">1677</a>. The Zheng calendar date is used here.', 
         '依明大統曆推算七月朔在乙亥(公曆7月29日)，不合傅以禮《殘明大統曆》及明鄭<a href="N1677_Zheng_chinese.html">永曆三十一年大統曆</a>的丙子朔(7月30日)。此處依《殘明大統曆》及明鄭大統曆記七月丙子朔。', 
         '依明大统历推算七月朔在乙亥(公历7月29日)，不合傅以礼《残明大统历》及明郑<a href="N1677_Zheng_simp.html">永历三十一年大统历</a>的丙子朔(7月30日)。此处依《残明大统历》及明郑大统历记七月丙子朔。']}, 

        {y:1678, m:7, 
         w:['According to the calculation of the Datong system, the month 6 conjunction was on July 18th, inconsistent with July 19th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or  <i>Datong Calendar of the Waning Ming Dynasty</i>. July 19th is used here.', 
         '依明大統曆推算六月朔在己巳(公曆7月18日)，不合傅以禮《殘明大統曆》的庚午朔(7月19日)。此處依《殘明大統曆》記六月庚午朔。', 
         '依明大统历推算六月朔在己巳(公历7月18日)，不合傅以礼《残明大统历》的庚午朔(7月19日)。此处依《残明大统历》记六月庚午朔。']}, 

        {y:1682, m:2, 
         w:['According to the calculation of the Datong system, the Chinese New Year in 1682 was on February 8th, inconsistent with February 7th recorded in <i>C&#225;n M&#237;ng D&#224; T&#466;ng L&#236;</i> or <i>Datong Calendar of the Waning Ming Dynasty</i>. February 7th is used here.', 
         '依明大統曆推算永曆三十六年正月朔在庚戌(公曆2月8日)，不合傅以禮《殘明大統曆》的己酉朔(2月7日)。此處依《殘明大統曆》記正月己酉朔。', 
         '依明大统历推算永历三十六年正月朔在庚戌(公历2月8日)，不合傅以礼《残明大统历》的己酉朔(2月7日)。此处依《残明大统历》记正月己酉朔。']}
    ];
    
    let n = notes.length;
    let warn = '';
    for (let i=0; i<n; i++) {
        if (y==notes[i].y && m==notes[i].m) {
            warn = notes[i].w[lang];
            break;
        }
    }
    return warn;
}

function calendarNotes1912_1979(y, m, lang) {
    let notes = [{'y':1912, 'm':11, 
         'n':['The calendrical Z10 was on Nov 23.', 
              '曆書小雪在23日。', '历书小雪在23日。']}, 
         {'y':1913, 'm':9,
          'n':['The calendrical Z8 (September equinox) was on Sep 24.',
               '曆書秋分在24日。', '历书秋分在24日。']},
        {'y':1917, 'm':12,
         'n':['The calendrical J11 was on Dec 7.',
              '曆書大雪在7日。', '历书大雪在7日。']},
        {'y':1927, 'm':9,
         'n':['The calendrical J8 was on Sep 8.',
              '曆書白露在8日。', '历书白露在8日。']},
        {'y':1928, 'm':6,
         'n':['The calendrical Z5 (June solstice) was on June 21.',
              '曆書夏至在21日。', '历书夏至在21日。']},
        {'y':1979, 'm':1,
         'n':['Z12 calculated by DE441 was at 23:59:54 (UTC+8) on Jan. 20. <i>Chinese Astronomical Almanac for the Year 1979</i> lists Z12 at 00:00 (UTC+8) on Jan 21, so the calendrical Z12 was on Jan 21.',
              'DE441曆表推算的大寒時刻是1月20日23:59:54 (UTC+8)，《一九七九年中国天文年历》載大寒時刻為1月21日00:00 (UTC+8)，故曆書大寒在1月21日。',
              'DE441历表推算的大寒时刻是1月20日23:59:54 (UTC+8)，《一九七九年中国天文年历》载大寒时刻为1月21日00:00 (UTC+8)，故历书大寒在1月21日。']}];
    let nnotes = notes.length;
    for (let i=0; i<nnotes; i++) {
        if (y==notes[i]['y'] && m==notes[i]['m']) {
            return notes[i]['n'][lang];
        }
    }

    return '';
}

function calendarNotesAfter2050(y, m, lang, noteEarly, noteLate) {
  let suffix_eng = " is close to the midnight. The actual date may be off by one day.";
  let suffix_chi = "的時刻接近午夜零時，實際日期或會與所示日期有一日之差。";
  let suffix_sim = "的时刻接近午夜零时，实际日期或会与所示日期有一日之差。";
  let warn = "";

  if (y == 2051) {
    if (m == 3) {
      if (lang == 0) {
        warn = "The time of Z2 (March equinox)" + suffix_eng;
      } else {
        warn = "春分" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2057) {
    if (m == 9) warn = noteEarly;
  }

  if (y == 2083) {
    if (m == 2) {
      if (lang == 0) {
        warn = "The time of J1" + suffix_eng;
      } else {
        warn = "&#31435;&#26149;" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2084) {
    if (m == 3) {
      if (lang == 0) {
        warn = "The time of Z2 (March equinox)" + suffix_eng;
      } else {
        warn = "&#26149;&#20998;" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2089) {
    if (m == 9) warn = noteLate;
  }

  if (y == 2097) {
    if (m == 8) warn = noteEarly;
  }

  if (y == 2114) {
    if (m == 11) {
      if (lang == 0) {
        warn = "The time of Z10" + suffix_eng;
      } else {
        warn = "小雪" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2115) {
    if (m == 2) warn = noteLate;
  }

  if (y == 2116) {
    if (m == 5) warn = noteLate;
  }

  if (y == 2133) {
    if (m == 9) warn = noteEarly;
  }

  if (y == 2142) {
    if (m == 9) {
      if (lang == 0) {
        warn = "The time of J8" + suffix_eng;
      } else {
        warn = "白露" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2155) {
    if (m == 10) {
      if (lang == 0) {
        warn = "The time of Z9" + suffix_eng;
      } else {
        warn = "霜降" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2157) {
    if (m == 12) {
      if (lang == 0) {
        warn = "The time of Z11 (December solstice)" + suffix_eng;
      } else {
        warn = "冬至" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2165) {
    if (m == 12) warn = noteEarly;
  }

  if (y == 2172) {
    if (m == 10) warn = noteEarly;
  }

  if (y == 2183) {
    if (m == 3) {
      if (lang == 0) {
        warn = "The time of Z2 (March equinox)" + suffix_eng;
      } else {
        warn = "春分" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  if (y == 2186) {
    if (m == 2) {
      if (lang == 0) {
        warn = "The time of J1" + suffix_eng;
      } else {
        warn = "立春" + (lang == 1 ? suffix_chi : suffix_sim);
      }
    }
  }

  return warn;
}