/**
 * ChineseCalendar 中国农历语言包
 */

import {
  LocaleData,
  MonthGanZhi,
  LunarDate,
  ChineseDateFormatConfig,
} from './types'
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
    cYear: number,
    cMonth: number,
    heMonth: MonthGanZhi,
    cMonthSize: number,
    isLeap: boolean | string,
    isFirstMonth: boolean,
    monthExpressions: string
  ): string {
    if (!monthExpressions) return '';

    // 获取leap在不同时期的叫法
    let leap = this.localeData.leap['leap'];
    if (cYear === -104) {
      leap = this.localeData.leap['post'];
    } else if (cYear < -104) {
      if (isLeap === 'post 9') {
        leap = this.localeData.leap['post9'];
      }
    }

    let cMonthName = this.localeData.monthNumbers[String(Math.abs(cMonth) - 1)];
    if (cYear >= -104) {
      if (cMonth < 0) {
        cMonthName = leap + cMonthName;
      }

      if (cYear > 688 && cYear < 700 && Math.abs(cMonth) === 11) {
        cMonthName = this.localeData.monthNumbers['0'];
      }
      if (cYear > 689 && cYear < 701 && Math.abs(cMonth) === 1) {
        cMonthName = this.localeData.monthNumbers['-1'];
      }
    } else {
      if (cMonth < 0) {
        cMonthName = leap;
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
          lunarDate.cYear,
          lunarDate.cMonth,
          lunarDate.heMonth,
          lunarDate.cMonthSize,
          lunarDate.isLeap,
          lunarDate.isFirstMonth,
          monthFormat
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