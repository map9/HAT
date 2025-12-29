import { ChineseCalendar } from "../../chinesecalendar/src/calendar.js";
import * as d3 from "d3";

/*
 * chineseCalendarAxises2.js
 *
 * 使用 chinesecalendar 库替代 lunar-javascript 实现农历时间轴
 * 支持公元前 722 年到公元后 2200 年
 *
 * 主要改进:
 * - 支持更大的时间范围（特别是公元前）
 * - 使用本地 ChineseCalendar 库，无需外部依赖
 * - 提供与 chineseCalendarAxises.js 相同的接口
 */

// 创建 ChineseCalendar 实例（使用简体中文）
export const calendar = new ChineseCalendar({ lng: 'zh-Hans', debug: false });

// 默认区域
const DEFAULT_REGION = 'default';

// 扩展的时间范围（支持公元前721年到公元2200年）
// 注意：ChineseCalendar 库的数据从公元前721年开始
const limitedDomain = [new Date('-000721-01-01'), new Date('2200-12-31')];

// 年份范围常量
const MIN_YEAR = -721;
const MAX_YEAR = 2200;

/**
 * 格式化农历日期为本地化字符串
 * @param {Object} chineseDate - 农历日期对象 {year, month, day, isLeap, ganzhiYear, ganzhiMonth, ganzhiDay}
 * @param {string} local - 语言区域（暂未使用）
 * @param {Object} config - 格式化配置
 * @returns {string} - 格式化后的字符串
 */
const toLocaleString2 = (chineseDate, local, config = {
  year: 'none',
  yearShengXiao: false,
  month: 'none',
  monthShengXiao: false,
  day: 'none',
  dayShengXiao: false,
  hour: 'none',
  hourShengXiao: false
}) => {
  if (!chineseDate) return '';

  let total = '';
  let s = '';

  if (config.year === 'normal') config.year = config.yearShengXiao ? 'normal' : 'short';
  else if (config.year === 'ganzhi') config.year = config.yearShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  if (config.month === 'normal') config.month = config.monthShengXiao ? 'normal' : 'short';
  else if (config.month === 'ganzhi') config.month = config.monthShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  if (config.day === 'normal') config.day = config.dayShengXiao ? 'normal' : 'short';
  else if (config.day === 'ganzhi') config.day = config.dayShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  s = calendar.lunarDateToString(chineseDate, config);

  // 时辰（暂不实现，因为 ChineseCalendar 未提供时辰相关方法）
  if (config.hour !== null && config.hour !== 'none') {
    // TODO: 实现时辰格式化
  }

  total += s;
  return total.trim();
};

/**
 * Chinese Year（农历年）
 * d3.timeInterval 用于处理农历年的时间间隔
 */
export const chineseYear2 = d3.timeInterval(
  // floor：归整到当前农历年岁首（岁首）
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert chinese date to gregorian date');
      }

      // 边界检查：确保年份在有效范围内
      if (chineseDate.year < MIN_YEAR) {
        chineseDate.year = MIN_YEAR;
      } else if (chineseDate.year > MAX_YEAR) {
        chineseDate.year = MAX_YEAR;
      }

      // 获取农历年岁首的公历日期
      const yearStart = calendar.getChineseYearStart(chineseDate.year, DEFAULT_REGION);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      } else {
        throw new Error('failed to get chinese year start date');
      }
    } catch (e) {
      console.error('chineseYear2 floor error:', e, date);
    }
  },
  // offset：按农历年步进
  // 利用干支和公历年同步特性，默认按公历年步进。
  // 尽管长周期来看，一个农历年对应一个公历年，但实际情况下农历年和公历年并非完全同步，有的农历年跨越三个公历年，长达15个月。
  // 也就是这个step中offset并不总是1对应1。
  (date, step) => {
    try {
      if (step === 0) return;

      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      // 边界检查：确保年份在有效范围内
      let stepChineseYear = chineseDate.year + step;
      if (stepChineseYear < MIN_YEAR) {
        stepChineseYear = MIN_YEAR;
      } else if (stepChineseYear > MAX_YEAR) {
        stepChineseYear = MAX_YEAR;
      }

      // 获取农历年岁首的公历日期
      const yearStart = calendar.getChineseYearStart(stepChineseYear, DEFAULT_REGION);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      } else {
        throw new Error('failed to get chinese year start date');
      }
    } catch (e) {
      console.error('chineseYear2 floor error:', e, date);
    }
  },
  // count：计算两个日期之间的农历年数差
  (start, end) => {
    try {
      if (start >= end) return 0;

      const startChinese = calendar.getChineseDateFromGregorian(start, DEFAULT_REGION);
      const endChinese = calendar.getChineseDateFromGregorian(end, DEFAULT_REGION);

      if (!startChinese || !endChinese) {
        throw new Error('failed to convert gregorian date to chinese dates');
      }

      return end.getFullYear() - start.getFullYear();
    } catch (e) {
      console.error('chineseYear2 count error:', e, start, end);
      return 0;
    }
  },
  // field：返回当前农历年份
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      return chineseDate.year;
    } catch (e) {
      console.error('chineseYear2 field error:', e, date);
      return 0;
    }
  }
);

// chineseYear2.every() 用于按 k 年间隔进行操作
chineseYear2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) {
          throw new Error('failed to convert gregorian date to chinese date');
        }

        // 向下取整到 k 的倍数，并确保在有效范围内
        let flooredChineseYear = Math.floor(chineseDate.year / k) * k;

        // 边界检查：确保年份在有效范围内
        if (flooredChineseYear < MIN_YEAR) {
          flooredChineseYear = MIN_YEAR;
        } else if (flooredChineseYear > MAX_YEAR) {
          flooredChineseYear = MAX_YEAR;
        }

        const yearStart = calendar.getChineseYearStart(flooredChineseYear, DEFAULT_REGION);
        if (yearStart) {
          date.setTime(yearStart.getTime());
        } else {
          throw new Error('failed to get chinese year start date');
        }
      } catch (e) {
        console.error('chineseYear2 floor error:', e, date);
      }
    },
    (date, step) => {
      try {
        if (step === 0) return;

        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) {
          throw new Error('failed to convert gregorian date to chinese date');
        }

        // 边界检查：确保年份在有效范围内
        let stepChineseYear = chineseDate.year + step * k;
        if (stepChineseYear < MIN_YEAR) {
          stepChineseYear = MIN_YEAR;
        } else if (stepChineseYear > MAX_YEAR) {
          stepChineseYear = MAX_YEAR;
        }

        // 获取农历年岁首的公历日期
        const yearStart = calendar.getChineseYearStart(stepChineseYear, DEFAULT_REGION);
        if (yearStart) {
          date.setTime(yearStart.getTime());
        } else {
          throw new Error('failed to get chinese year start date');
        }
      } catch (e) {
        console.error('chineseYear2 floor error:', e, date);
      }
    }
  );
};

/**
 * Chinese Month（农历月）
 * d3.timeInterval 用于处理农历月的时间间隔
 */
export const chineseMonth2 = d3.timeInterval(
  // floor：归整到当前农历月第一天
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      // 将日期设为该农历月的初一
      const monthStart = calendar.getGregorianFromChineseDate(
        chineseDate.year,
        chineseDate.month,
        1,
        chineseDate.isLeap,
        chineseDate.ganzhiMonth,
        DEFAULT_REGION,
        chineseDate.jd ? chineseDate.jd - (chineseDate.day - 1) : null // 当前日期的 jd - (当前日 - 1) = 初一的 jd
      );
      if (monthStart) {
        date.setTime(monthStart.getTime());
      } else {
        throw new Error('failed to convert chinese date to gregorian date');
      }
    } catch (e) {
      console.error('chineseMonth2 floor error:', e, date);
    }
  },
  // offset：按农历月进行精确步进
  (date, step) => {
    try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }
      let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
      if (!monthInfos) {
        throw new Error(`failed to get chinese year month info ${chineseDate.year}`);
      }

      // 找当前月索引
      let currentIndex = -1;
      for (let i = 0; i < monthInfos.length; i++) {
        if (i < monthInfos.length - 1) {
          // 判断 date 是否在 [monthInfos[i].date, monthInfos[i+1].date) 区间内
          if (date >= monthInfos[i].date && date < monthInfos[i + 1].date) {
            currentIndex = i;
            break;
          }
        } else {
          // 最后一个月：判断是否 >= 该月起始日期
          if (date >= monthInfos[i].date) {
            currentIndex = i;
          }
        }
      }

      if (currentIndex === -1) {
        throw new Error('无法找到当前月索引');
      }

      // 开始步进
      let find = false;
      let remainingSteps = Math.abs(step);
      let currentYear = chineseDate.year;
      let currentMonthIndex = currentIndex;
      
      // 向前 / 向后步进合并在一起了
      while (remainingSteps >= 0) {
        const stepsToYearEnd = monthInfos.length - currentMonthIndex - 1;
        
        if (remainingSteps <= (step > 0 ? stepsToYearEnd : currentMonthIndex)) {
          // 目标月在当前年内 / 目标月在当前年内
          currentMonthIndex += (step > 0 ? remainingSteps : -remainingSteps);
          remainingSteps = 0;
          const targetMonth = monthInfos[currentMonthIndex];
          date.setTime(targetMonth.date.getTime());
          find = true;
          break;
        } else {
          // 需要跨到下一年 / 需要跨到上一年
          remainingSteps -= (step > 0 ? (stepsToYearEnd + 1) : (currentMonthIndex + 1));
          currentYear += (step > 0 ? 1 : -1);
          
          // 边界检查
          if (currentYear > MAX_YEAR) {
            monthInfos = calendar.getChineseYearMonthInfo(MAX_YEAR, DEFAULT_REGION);
            if (!monthInfos) {
              throw new Error(`failed to get chinese year month info ${MAX_YEAR}`);
            }
            date.setTime(monthInfos[monthInfos.length - 1].date.getTime());
            find = true;
            break;
          } else if (currentYear < MIN_YEAR) {
            date.setTime(monthInfos[0].date.getTime());
            find = true;
            break;
          } else {
            monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);
            if (!monthInfos) {
              throw new Error(`failed to get chinese year month info ${currentYear}`);
            }
            currentMonthIndex = step > 0 ? 0 : monthInfos.length - 1;
          }
        }
      }
      if (!find) {
        // 理论上不应该到这里
        throw new Error('chineseMonth2 offset: failed to find target month after stepping');
      }
    } catch (e) {
      console.error('chineseMonth2 offset error:', e, date, step);
    }
  },
  // count：计算起始与结束日期之间相差多少个农历月
  (start, end) => {
    try {
      if (start >= end) return 0;

      let count = 0;
      const startChinese = calendar.getChineseDateFromGregorian(start, DEFAULT_REGION);
      const endChinese = calendar.getChineseDateFromGregorian(end, DEFAULT_REGION);

      if (!startChinese || !endChinese) {
        throw new Error('failed to convert dates to chinese dates');
      }

      // 如果在同一个农历年
      if (startChinese.year === endChinese.year) {
        const monthInfos = calendar.getChineseYearMonthInfo(startChinese.year, DEFAULT_REGION);
        if (!monthInfos) {
          throw new Error(`failed to get chinese year month info ${startChinese.year}`);
        }

        // 找到起始月和结束月的索引
        let startIndex = -1, endIndex = -1;
        for (let i = 0; i < monthInfos.length; i++) {
          if (i < monthInfos.length - 1) {
            if (start >= monthInfos[i].date && start < monthInfos[i + 1].date) {
              startIndex = i;
            }
            if (end >= monthInfos[i].date && end < monthInfos[i + 1].date) {
              endIndex = i;
            }
          } else {
            if (start >= monthInfos[i].date) {
              startIndex = i;
            }
            if (end >= monthInfos[i].date) {
              endIndex = i;
            }
          }
        }

        if (startIndex !== -1 && endIndex !== -1) {
          return endIndex - startIndex;
        } else {
          throw new Error('failed to find start or end month index in the same year');
        }
      }

      // 跨年情况：逐年累加月份数
      let currentYear = startChinese.year;
      let monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);

      // 找到起始月索引
      let startIndex = -1;
      for (let i = 0; i < monthInfos.length; i++) {
        if (i < monthInfos.length - 1) {
          if (start >= monthInfos[i].date && start < monthInfos[i + 1].date) {
            startIndex = i;
            break;
          }
        } else {
          if (start >= monthInfos[i].date) {
            startIndex = i;
          }
        }
      }

      if (startIndex === -1) {
        throw new Error('failed to find start month index');
      }

      // 累加起始年剩余的月数
      count += (monthInfos.length - startIndex);
      currentYear++;

      // 累加中间完整年份的月数
      while (currentYear < endChinese.year) {
        monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);
        if (!monthInfos) {
          throw new Error(`failed to get chinese year month info ${currentYear}`);
        }
        count += monthInfos.length;
        currentYear++;
      }

      // 累加结束年的月数
      monthInfos = calendar.getChineseYearMonthInfo(endChinese.year, DEFAULT_REGION);
      if (!monthInfos) {
        throw new Error(`failed to get chinese year month info ${endChinese.year}`);
      }

      // 找到结束月索引
      let endIndex = -1;
      for (let i = 0; i < monthInfos.length; i++) {
        if (i < monthInfos.length - 1) {
          if (end >= monthInfos[i].date && end < monthInfos[i + 1].date) {
            endIndex = i;
            break;
          }
        } else {
          if (end >= monthInfos[i].date) {
            endIndex = i;
          }
        }
      }

      if (endIndex !== -1) {
        count += endIndex;
      }

      return count;
    } catch (e) {
      console.error('chineseMonth2 count error:', e, start, end);
      return 0;
    }
  },
  // field：返回当前农历月份（从0开始）
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      const monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
      if (!monthInfos) {
        throw new Error(`failed to get chinese year month info ${chineseDate.year}`);
      }

      // 找到当前月在年内的索引（从0开始）
      for (let i = 0; i < monthInfos.length; i++) {
        if (i < monthInfos.length - 1) {
          if (date >= monthInfos[i].date && date < monthInfos[i + 1].date) {
            return i;
          }
        } else {
          if (date >= monthInfos[i].date) {
            return i;
          }
        }
      }

      throw new Error('failed to find current month index');
    } catch (e) {
      console.error('chineseMonth2 field error:', e, date);
      return 0;
    }
  }
);

// chineseMonth2.every() 用于按 k 月间隔进行操作
chineseMonth2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    // floor: 归整到 k 月倍数
    (date) => {
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) {
          throw new Error('failed to convert gregorian date to chinese date');
        }

        let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
        if (!monthInfos) {
          throw new Error(`failed to get chinese year month info ${chineseDate.year}`);
        }

        // 找到当前月索引
        let currentIndex = -1;
        for (let i = 0; i < monthInfos.length; i++) {
          if (i < monthInfos.length - 1) {
            if (date >= monthInfos[i].date && date < monthInfos[i + 1].date) {
              currentIndex = i;
              break;
            }
          } else {
            if (date >= monthInfos[i].date) {
              currentIndex = i;
            }
          }
        }

        if (currentIndex === -1) {
          throw new Error('failed to find current month index');
        }
        
        /*
        // 计算"逻辑月份"(只计算非闰月)，避免闰月带来的问题
        // every(3): 始终显示正月、四月、七月、十月(季度首月)
        // every(6): 始终显示正月、七月(半年首月)
        let logicalMonth = 0;
        for (let i = 0; i <= currentIndex; i++) {
          if (!monthInfos[i].isLeap) {
            logicalMonth++;
          }
        }
        logicalMonth--; // 转为0-based (正月 = 0)

        // 向下取整到 k 的倍数
        const flooredLogicalMonth = Math.floor(logicalMonth / k) * k;

        // 【新逻辑】映射回实际月份索引(跳过闰月)
        let targetIndex = 0;
        let logicalCount = 0;
        for (let i = 0; i < monthInfos.length; i++) {
          if (!monthInfos[i].isLeap) {
            if (logicalCount === flooredLogicalMonth) {
              targetIndex = i;
              break;
            }
            logicalCount++;
          }
        }

        const targetDate = monthInfos[targetIndex].date;
        if (!targetDate || isNaN(targetDate.getTime())) {
          throw new Error(`Invalid date in monthInfos[${targetIndex}]`);
        }
        date.setTime(monthInfos[targetIndex].date.getTime());
        */

        // 计算从农历年起始的总月数
        let totalMonthsFromYearStart = currentIndex;
        let currentYear = chineseDate.year;

        // 向下取整到 k 的倍数
        const flooredMonths = Math.floor(totalMonthsFromYearStart / k) * k;

        // 设置到对应的月份
        if (flooredMonths < monthInfos.length) {
          const targetDate = monthInfos[flooredMonths].date;
          if (!targetDate || isNaN(targetDate.getTime())) {
            throw new Error(`Invalid date in monthInfos[${flooredMonths}]`);
          }

          date.setTime(monthInfos[flooredMonths].date.getTime());
        } else {
          // 理论上不应该到这里
          throw new Error('floored month index out of range');
        }
      } catch (e) {
        console.error('chineseMonth2.every floor error:', e, date);
      }
    },
    // offset: 按 k*step 月步进
    (date, step) => {
      try {
        if (step === 0) return;

        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) {
          throw new Error('failed to convert gregorian date to chinese date');
        }

        let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
        if (!monthInfos) {
          throw new Error(`failed to get chinese year month info ${chineseDate.year}`);
        }

        // 找当前月索引
        let currentIndex = -1;
        for (let i = 0; i < monthInfos.length; i++) {
          if (i < monthInfos.length - 1) {
            if (date >= monthInfos[i].date && date < monthInfos[i + 1].date) {
              currentIndex = i;
              break;
            }
          } else {
            if (date >= monthInfos[i].date) {
              currentIndex = i;
            }
          }
        }

        if (currentIndex === -1) {
          throw new Error('failed to find current month index');
        }

        // 步进 k * step 个月
        let find = false;
        const totalStep = k * step;
        let remainingSteps = Math.abs(totalStep);
        let currentYear = chineseDate.year;
        let currentMonthIndex = currentIndex;

        while (remainingSteps >= 0) {
          const stepsToYearEnd = monthInfos.length - currentMonthIndex - 1;

          if (remainingSteps <= (step > 0 ? stepsToYearEnd : currentMonthIndex)) {
            // 目标月在当前年内
            currentMonthIndex += (step > 0 ? remainingSteps : -remainingSteps);
            remainingSteps = 0;
            const targetMonth = monthInfos[currentMonthIndex];
            date.setTime(targetMonth.date.getTime());
            find = true;
            break;
          } else {
            // 需要跨年
            remainingSteps -= (step > 0 ? (stepsToYearEnd + 1) : (currentMonthIndex + 1));
            currentYear += (step > 0 ? 1 : -1);

            // 边界检查
            if (currentYear > MAX_YEAR) {
              monthInfos = calendar.getChineseYearMonthInfo(MAX_YEAR, DEFAULT_REGION);
              if (!monthInfos) {
                throw new Error(`failed to get chinese year month info ${MAX_YEAR}`);
              }
              date.setTime(monthInfos[monthInfos.length - 1].date.getTime());
              find = true;
              break;
            } else if (currentYear < MIN_YEAR) {
              date.setTime(monthInfos[0].date.getTime());
              find = true;
              break;
            } else {
              monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);
              if (!monthInfos) {
                throw new Error(`failed to get chinese year month info ${currentYear}`);
              }
              currentMonthIndex = step > 0 ? 0 : monthInfos.length - 1;
            }
          }
        }

        if (!find) {
          // 理论上不应该到这里
          throw new Error('failed to find target month after stepping');
        }
      } catch (e) {
        console.error('chineseMonth2.every offset error:', e, date, step);
      }
    }
  );
};

/**
 * Chinese Day（农历日）
 * d3.timeInterval 用于处理农历日的时间间隔
 */
export const chineseDay2 = d3.timeInterval(
  // floor：归整到当前农历日的开始（午夜00:00:00）
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      // 将时分秒设为0，保持当前日期
      const dayStart = calendar.getGregorianFromChineseDate(
        chineseDate.year,
        chineseDate.month,
        chineseDate.day,
        chineseDate.isLeap,
        chineseDate.ganzhiMonth,
        DEFAULT_REGION,
        chineseDate.jd
      );
      if (dayStart) {
        date.setTime(dayStart.getTime());
      } else {
        throw new Error('failed to convert chinese date to gregorian date');
      }
    } catch (e) {
      console.error('chineseDay2 floor error:', e, date);
    }
  },
  // offset：按农历日精确步进
  (date, step) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }

      // 将时分秒设为0，保持当前日期
      const dayStart = calendar.getGregorianFromChineseDate(
        chineseDate.year,
        chineseDate.month,
        chineseDate.day,
        chineseDate.isLeap,
        chineseDate.ganzhiMonth,
        DEFAULT_REGION,
        chineseDate.jd
      );
      if (dayStart) {
        date.setTime(dayStart.getTime());
      } else {
        throw new Error('failed to convert chinese date to gregorian date');
      }

      // 由于农历日和公历日是一一对应的，可以直接使用公历日的步进
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + step);
      date.setTime(newDate.getTime());
    } catch (e) {
      console.error('chineseDay2 offset error:', e, date, step);
    }
  },
  // count：计算起始与结束日期之间相差多少个农历日
  // 农历日和公历日是一一对应的，所以可以直接计算天数差
  (start, end) => {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 60 * 1000) / 24 / 60 / 60 / 1000;
  },
  // field：返回当前农历日（从0开始，即初一为0）
  (date) => {
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) {
        throw new Error('failed to convert gregorian date to chinese date');
      }
      return chineseDate.day - 1;
    } catch (e) {
      console.error('chineseDay2 field error:', e, date);
      return 0;
    }
  }
);

/**
 * 年度轴配置
 * 根据不同的缩放级别（hoursPerPixel）显示不同粒度的时间标签
 */
export const yearlyAxis = {
  name: "chinese-yearly",
  height: 18,
  isGrid: false,
  class: 'yearly',
  domain: limitedDomain,
  map: (hoursPerPixel, local) => {
    return [
      [
        0.03125,
        [
          chineseDay2, (d) => {
            const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
            return toLocaleString2(chineseDate, local, {year: 'ganzhi', month: 'normal', day: 'normal'});
          }
        ]
      ],
      [
        0.25,
        [
          chineseDay2, (d) => {
            const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
            return chineseDate && chineseDate.day === 1
              ? toLocaleString2(chineseDate, local, {year: 'ganzhi', month: 'normal', day: 'normal'})
              : toLocaleString2(chineseDate, local, {month: 'normal', day: 'normal'});
          }
        ]
      ],
      [
        2,
        [
          chineseMonth2, (d) => {
            const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
            return toLocaleString2(chineseDate, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true });
          }
        ]
      ],
      [
        4,
        [
          chineseMonth2, (d) => {
            const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
            const startOfTheYear = chineseDate && chineseDate.month === 1 && chineseDate.day === 1;
            return startOfTheYear
              ? toLocaleString2(chineseDate, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true })
              : toLocaleString2(chineseDate, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal'});
          },
        ]
      ],
      [
        8,
        [
          chineseMonth2, (d) => {
            const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
            const startOfTheYear = chineseDate && chineseDate.month === 1 && chineseDate.day === 1;
            return startOfTheYear
              ? toLocaleString2(chineseDate, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal'})
              : toLocaleString2(chineseDate, local, {year: 'ganzhi', month: 'normal'});
          },
        ]
      ],
      [128, [chineseYear2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {year: 'ganzhi'});
      }]],
      [512, [chineseYear2.every(5), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {year: 'ganzhi'});
      }]],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256) * 5), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {year: 'ganzhi'});
      }]]
    ]
  }
};

/**
 * 日轴配置
 * 用于显示更细粒度的时间标签（包括时辰）
 */
export const dailyAxis = {
  name: "chinese-daily",
  height: 15,
  isGrid: false,
  class: 'daily',
  domain: limitedDomain,
  map: (hoursPerPixel, local)=>{
    return [
      [0.0625, [d3.timeHour.every(2), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {hour: 'ganzhi'});
      }]],
      [0.125, [d3.timeHour.every(2), ""]],
      [0.25, [d3.timeHour.every(6), ""]],
      [0.5, [chineseDay2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {day: 'ganzhi'});
      }]],
      [8, [chineseDay2, ""]],
      [16, [chineseMonth2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {month: 'ganzhi'});
      }]],
      [32, [chineseMonth2.every(3), "Q%q"]],
      [128, [chineseMonth2.every(6), (d, i) => d.getMonth() < 6 ? "上半年" : "下半年"]],
      [256, [chineseYear2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {year: 'ganzhi'});
      }]],
      [512, [chineseYear2, ""]],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256)), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString2(chineseDate, local, {year: 'ganzhi'});
      }]]
    ]
  }
};

/**
 * 日网格配置
 * 用于显示背景网格线
 */
export const dailyGrid = {
  name: "chinese-daily-grid",
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  domain: limitedDomain,
  map: (hoursPerPixel, local)=>{
      return [
      [0.025, [d3.timeHour.every(2), ""]],
      [0.05, [d3.timeHour.every(6), ""]],
      [0.5, [d3.timeHour.every(12), ""]],
      [1, [chineseDay2, ""]],
      [8, [chineseDay2.filter(d => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return chineseDate && (chineseDate.day === 15 || chineseDate.day === 1);
      }), ""]],
      [24, [chineseMonth2, ""]],
      [64, [chineseMonth2.every(6), ""]]
      ]
  }
};

/**
 * 年网格配置
 * 用于显示年度级别的背景网格线
 */
export const yearlyGrid = {
  name: "chinese-yearly-grid",
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  domain: limitedDomain,
  map: (hoursPerPixel, local)=>{
    return [
      [0.125, [chineseDay2, ""]],
      [8, [chineseMonth2, ""]],
      [64, [chineseYear2, ""]],
      [128, [chineseYear2.every(2), ""]],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256) * 5), ""]]
    ]
  }
};