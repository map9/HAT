/**
 * ChineseCalendarRender.ts
 * ChineseCalendarRender 中国农历格式化输出类，提供多语言格式化输出等功能。
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
 *   1. 设置和定义语言包，格式化输出农历日期；
 *   2. 拆分 calendar.js 语言相关操作到本文件；
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
 */

import {
  LocaleData,
  MonthGanZhi,
  LeapPrefixType,
  LunarDate,
  ChineseDateFormatConfig,
} from './types.js'
import { getLocale } from './locales/index.js';

/**
 * 模板字符串替换
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return values[key] !== undefined ? String(values[key]) : '';
  });
}

export class ChineseCalendarRender {
  locale: string = 'zh-Hant';
  localeData: LocaleData;

  constructor(
    config = {
      locale: 'zh-Hant'
    }) {
    this.localeData = getLocale(this.locale);
    this.setLanguage(config.locale);
  }

  /**
   * 切换语言
   */
  setLanguage(locale: string): void {
    if (
      (locale === 'zh-Hans' ||
      locale === 'zh-Hant' ||
      locale === 'en') &&
      this.locale !== locale
    ) {
      this.locale = locale;
      this.localeData = getLocale(this.locale);
    }
  }

  /**
   * 获取当前语言
   */
  getLanguage(): string {
    return this.locale;
  }

  /**
   * 格式化农历年份
   */
  yearToString(year: number): string {
    return year < 1
      ? interpolate(this.localeData.yearExpressions['bce'], { year: 1 - year })
      : interpolate(this.localeData.yearExpressions['ce'], { year: year });
  }

  /**
   * 格式化农历月份
   */
  lunarMonthToString(
    monthExpressions: string,
    cYear: number,
    cMonth: number,
    heMonth: MonthGanZhi,
    cMonthSize: number,
    isFirstMonth?: boolean,
    leap?: LeapPrefixType,
  ): string {
    if (!monthExpressions) return '';

    let cMonthName = this.localeData.monthNumbers[String(Math.abs(cMonth) - 1)];
    // 公元689年12月，改十一月为岁首，称正月，改建寅为一月；
    // 公元701年2月，改回以建寅为年首，称正月，十一月为十一月。
    if (cYear >= 690 && cYear <= 700) {
      if ( Math.abs(cMonth) === 11 && isFirstMonth === true) {
        cMonthName = this.localeData.monthNumbers['0'];
        console.log(`cYear: ${cYear}, cMonth: ${cMonth}, isFirstMonth: ${isFirstMonth}.`)
      }
      if (Math.abs(cMonth) === 1 && isFirstMonth === false) {
        cMonthName = this.localeData.monthNumbers['-1'];
        console.log(`cYear: ${cYear}, cMonth: ${cMonth}, isFirstMonth: ${isFirstMonth}.`)
      }
    }

    if (cMonth < 0 && leap) {
      if (leap === LeapPrefixType.LEAPX)
        cMonthName = this.localeData.leap['leap'] + cMonthName;
      else {
        cMonthName = this.localeData.leap[String(leap)];
      }
    }

    if (monthExpressions === 'short') {
      return interpolate(this.localeData.monthExpressions['short'], { month: cMonthName });
    }

    if (heMonth && Array.isArray(heMonth)) {
      if (monthExpressions === 'short.ganZhi') {
        return interpolate(this.localeData.monthExpressions['short.ganZhi'], {
          heaven: this.localeData.heavens[String(heMonth[0])],
          earth: this.localeData.earths[String(heMonth[1])]
        });
      } else if (monthExpressions === 'normal.ganZhi') {
        return interpolate(this.localeData.monthExpressions['normal.ganZhi'], {
          heaven: this.localeData.heavens[String(heMonth[0])],
          earth: this.localeData.earths[String(heMonth[1])],
          size: this.localeData.monthSizes[String(cMonthSize)]
        });
      } else if (monthExpressions === 'normal') {
        return interpolate(this.localeData.monthExpressions['normal'], {
          month: cMonthName,
          size: this.localeData.monthSizes[String(cMonthSize)]
        });
      } else if (monthExpressions === 'full') {
        return interpolate(this.localeData.monthExpressions['full'], {
          month: cMonthName,
          heaven: this.localeData.heavens[String(heMonth[0])],
          earth: this.localeData.earths[String(heMonth[1])],
          size: this.localeData.monthSizes[String(cMonthSize)]
        });
      }
    }

    if (heMonth && monthExpressions === 'full') {
      return interpolate(this.localeData.monthExpressions['full.noZhong'], {
        month: cMonthName,
        size: this.localeData.monthSizes[String(cMonthSize)]
      });
    }

    if (monthExpressions === 'short.ganZhi') {
      return interpolate(this.localeData.monthExpressions['short'], { month: cMonthName });
    } else if (
      monthExpressions === 'normal' ||
      monthExpressions === 'normal.ganZhi' ||
      monthExpressions === 'full'
    ) {
      return interpolate(this.localeData.monthExpressions['normal'], {
        month: cMonthName,
        size: this.localeData.monthSizes[String(cMonthSize)]
      });
    }

    return '';
  }

  /**
   * 将农历日期格式化为字符串
   * @param lunarDate - 农历日期对象
   * @param config - 输出配置
   * @returns 本地化的农历日期字符串
   */
  lunarDateToString(lunarDate: LunarDate | null, config: ChineseDateFormatConfig = {}): string {
    if (!lunarDate) return '';

    const { year: yearFormat = 'none', month: monthFormat = 'none', day: dayFormat = 'none' } = config;

    let year = '';
    if (yearFormat === 'short') {
      year = interpolate(this.localeData.yearExpressions['short'], {
        year: this.yearToString(lunarDate.cYear)
      });
    } else if (yearFormat === 'short.ganZhi') {
      year = interpolate(this.localeData.yearExpressions['short.ganZhi'], {
        heaven: this.localeData.heavens[String(lunarDate.heYear[0])],
        earth: this.localeData.earths[String(lunarDate.heYear[1])]
      });
    } else if (yearFormat === 'normal') {
      year = interpolate(this.localeData.yearExpressions['normal'], {
        year: this.yearToString(lunarDate.cYear),
        shengxiao: this.localeData.animals[String(lunarDate.heYear[1])]
      });
    } else if (yearFormat === 'normal.ganZhi') {
      year = interpolate(this.localeData.yearExpressions['normal.ganZhi'], {
        heaven: this.localeData.heavens[String(lunarDate.heYear[0])],
        earth: this.localeData.earths[String(lunarDate.heYear[1])],
        shengxiao: this.localeData.animals[String(lunarDate.heYear[1])]
      });
    } else if (yearFormat === 'full') {
      year = interpolate(this.localeData.yearExpressions['full'], {
        year: this.yearToString(lunarDate.cYear),
        heaven: this.localeData.heavens[String(lunarDate.heYear[0])],
        earth: this.localeData.earths[String(lunarDate.heYear[1])],
        shengxiao: this.localeData.animals[String(lunarDate.heYear[1])]
      });
    }

    const month = monthFormat === 'none'
      ? ''
      : this.lunarMonthToString(
          monthFormat,
          lunarDate.cYear,
          lunarDate.cMonth,
          lunarDate.heMonth,
          lunarDate.cMonthSize,
          lunarDate.isFirstMonth,
          lunarDate.leap,
        );

    let day = '';
    if (dayFormat === 'short') {
      day = interpolate(this.localeData.dayExpressions['short'], {
        day: this.localeData.dayNumbers[String(lunarDate.cDay - 1)]
      });
    } else if (dayFormat === 'short.ganZhi') {
      day = interpolate(this.localeData.dayExpressions['short.ganZhi'], {
        heaven: this.localeData.heavens[String(lunarDate.heDay[0])],
        earth: this.localeData.earths[String(lunarDate.heDay[1])]
      });
    } else if (dayFormat === 'normal') {
      day = interpolate(this.localeData.dayExpressions['normal'], {
        day: this.localeData.dayNumbers[String(lunarDate.cDay - 1)]
      });
    } else if (dayFormat === 'normal.ganZhi') {
      day = interpolate(this.localeData.dayExpressions['normal.ganZhi'], {
        heaven: this.localeData.heavens[String(lunarDate.heDay[0])],
        earth: this.localeData.earths[String(lunarDate.heDay[1])]
      });
    } else if (dayFormat === 'full') {
      day = interpolate(this.localeData.dayExpressions['full'], {
        day: this.localeData.dayNumbers[String(lunarDate.cDay - 1)],
        heaven: this.localeData.heavens[String(lunarDate.heDay[0])],
        earth: this.localeData.earths[String(lunarDate.heDay[1])]
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

  
}