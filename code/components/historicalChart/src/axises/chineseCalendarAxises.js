/**
 * Chinese Calendar axis configurations
 * Based on ChineseCalendar library (supports 722 BCE to 2200 CE)
 */

import * as d3 from 'd3';

// ChineseCalendar library references - must be initialized before use
let ChineseCalendar = null;
let calendar = null;
let calendarLoaded = false;

// Year range constants
export let MIN_YEAR = -722;
export let MAX_YEAR = 2200;

// Default region
const DEFAULT_REGION = 'default';

/**
 * Initialize ChineseCalendar library
 * @param {Object} calendarModule - Optional: pass the ChineseCalendar module directly
 * @returns {Promise<boolean>} - true if loaded successfully
 */
export async function initChineseCalendar(calendarModule = null) {
  if (calendarLoaded) return true;
  try {
    // If module is passed directly, use it
    if (calendarModule) {
      ChineseCalendar = calendarModule.ChineseCalendar;
      MIN_YEAR = calendarModule.CALENDAR_RANGE_MIN_YEAR || -722;
      MAX_YEAR = calendarModule.CALENDAR_RANGE_MAX_YEAR || 2200;
      calendar = new ChineseCalendar({ lng: 'zh-Hans', debug: false });
      calendarLoaded = true;
      console.log('ChineseCalendar initialized from provided module');
      updateExports();
      return true;
    }

    // Try dynamic import with variable to avoid Vite static analysis
    const modulePath = '../../chinesecalendar/src/calendar.js';
    const module = await import(/* @vite-ignore */ modulePath);
    ChineseCalendar = module.ChineseCalendar;
    MIN_YEAR = module.CALENDAR_RANGE_MIN_YEAR || -722;
    MAX_YEAR = module.CALENDAR_RANGE_MAX_YEAR || 2200;
    calendar = new ChineseCalendar({ lng: 'zh-Hans', debug: false });
    calendarLoaded = true;
    console.log('ChineseCalendar loaded successfully');
    updateExports();
    return true;
  } catch (e) {
    console.warn('ChineseCalendar not available. chineseCalendarAxises will use fallback.', e);
    return false;
  }
}

/**
 * Check if ChineseCalendar library is loaded
 */
export function isChineseCalendarLoaded() {
  return calendarLoaded;
}

/**
 * Get the calendar instance
 */
export function getCalendar() {
  return calendar;
}

// Limited domain based on year range
const getLimitedDomain = () => {
  const minDate = new Date(0);
  minDate.setUTCFullYear(MIN_YEAR, 0, 1);
  const maxDate = new Date(0);
  maxDate.setUTCFullYear(MAX_YEAR, 11, 31);
  return [minDate, maxDate];
};

/**
 * Format Chinese date to locale string
 * @param {Object} chineseDate - Chinese date object {year, month, day, isLeap, ganzhiYear, ganzhiMonth, ganzhiDay}
 * @param {string} local - Locale (not used currently)
 * @param {Object} config - Format configuration
 * @returns {string} - Formatted string
 */
const toLocaleString = (chineseDate, local, config = {
  year: 'none',
  yearShengXiao: false,
  month: 'none',
  monthShengXiao: false,
  day: 'none',
  dayShengXiao: false,
  hour: 'none',
  hourShengXiao: false
}) => {
  if (!chineseDate || !calendarLoaded || !calendar) return '';

  const convertConfig = {};
  if (config.year === 'normal') convertConfig.year = config.yearShengXiao ? 'normal' : 'short';
  else if (config.year === 'ganzhi') convertConfig.year = config.yearShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  if (config.month === 'normal') convertConfig.month = config.monthShengXiao ? 'normal' : 'short';
  else if (config.month === 'ganzhi') convertConfig.month = config.monthShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  if (config.day === 'normal') convertConfig.day = config.dayShengXiao ? 'normal' : 'short';
  else if (config.day === 'ganzhi') convertConfig.day = config.dayShengXiao ? 'normal.ganZhi' : 'short.ganZhi';

  try {
    return calendar.lunarDateToString(chineseDate, convertConfig).trim();
  } catch (e) {
    return '';
  }
};

/**
 * Convert western date to Chinese date string
 */
export const westernDate2ChineseDateString = (date) => {
  if (!calendarLoaded || !calendar) return '';
  try {
    const year = date.getFullYear();
    if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
      return '';
    }
    const chineseDate = calendar.getChineseDateFromGregorian(date);
    return calendar.lunarDateToString(chineseDate, {
      year: 'normal',
      month: 'normal',
      day: 'normal'
    });
  } catch (e) {
    return '';
  }
};

/**
 * Chinese Year (农历年) - d3.timeInterval
 */
export const chineseYear2 = d3.timeInterval(
  // floor: round down to start of Chinese year
  (date) => {
    if (!calendarLoaded || !calendar) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

      let year = chineseDate.year;
      if (year < MIN_YEAR) year = MIN_YEAR;
      else if (year > MAX_YEAR) year = MAX_YEAR;

      const yearStart = calendar.getChineseYearStart(year, DEFAULT_REGION);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      }
    } catch (e) {
      console.error('chineseYear2 floor error:', e);
    }
  },
  // offset: step by Chinese years
  (date, step) => {
    if (!calendarLoaded || !calendar || step === 0) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

      let targetYear = chineseDate.year + step;
      if (targetYear < MIN_YEAR) targetYear = MIN_YEAR;
      else if (targetYear > MAX_YEAR) targetYear = MAX_YEAR;

      const yearStart = calendar.getChineseYearStart(targetYear, DEFAULT_REGION);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      }
    } catch (e) {
      console.error('chineseYear2 offset error:', e);
    }
  },
  // count: count years between two dates
  (start, end) => {
    if (!calendarLoaded || !calendar || start >= end) return 0;
    try {
      return end.getFullYear() - start.getFullYear();
    } catch (e) {
      return 0;
    }
  },
  // field: return current Chinese year
  (date) => {
    if (!calendarLoaded || !calendar) return 0;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      return chineseDate ? chineseDate.year : 0;
    } catch (e) {
      return 0;
    }
  }
);

// chineseYear2.every() for k-year intervals
chineseYear2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      if (!calendarLoaded || !calendar) return;
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) return;

        let flooredYear = Math.floor(chineseDate.year / k) * k;
        if (flooredYear < MIN_YEAR) flooredYear = MIN_YEAR;
        else if (flooredYear > MAX_YEAR) flooredYear = MAX_YEAR;

        const yearStart = calendar.getChineseYearStart(flooredYear, DEFAULT_REGION);
        if (yearStart) {
          date.setTime(yearStart.getTime());
        }
      } catch (e) {
        console.error('chineseYear2.every floor error:', e);
      }
    },
    (date, step) => {
      if (!calendarLoaded || !calendar || step === 0) return;
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) return;

        let targetYear = chineseDate.year + step * k;
        if (targetYear < MIN_YEAR) targetYear = MIN_YEAR;
        else if (targetYear > MAX_YEAR) targetYear = MAX_YEAR;

        const yearStart = calendar.getChineseYearStart(targetYear, DEFAULT_REGION);
        if (yearStart) {
          date.setTime(yearStart.getTime());
        }
      } catch (e) {
        console.error('chineseYear2.every offset error:', e);
      }
    }
  );
};

/**
 * Chinese Month (农历月) - d3.timeInterval
 */
export const chineseMonth2 = d3.timeInterval(
  // floor: round down to first day of Chinese month
  (date) => {
    if (!calendarLoaded || !calendar) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

      const monthStart = calendar.getGregorianFromChineseDate(
        chineseDate.year,
        chineseDate.month,
        1,
        chineseDate.isLeap,
        chineseDate.ganzhiMonth,
        DEFAULT_REGION,
        chineseDate.jd ? chineseDate.jd - (chineseDate.day - 1) : null
      );
      if (monthStart) {
        date.setTime(monthStart.getTime());
      }
    } catch (e) {
      console.error('chineseMonth2 floor error:', e);
    }
  },
  // offset: step by Chinese months
  (date, step) => {
    if (!calendarLoaded || !calendar) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

      let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
      if (!monthInfos) return;

      // Find current month index
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

      if (currentIndex === -1) return;

      // Step through months
      let remainingSteps = Math.abs(step);
      let currentYear = chineseDate.year;
      let currentMonthIndex = currentIndex;

      while (remainingSteps >= 0) {
        const stepsToYearEnd = monthInfos.length - currentMonthIndex - 1;

        if (remainingSteps <= (step > 0 ? stepsToYearEnd : currentMonthIndex)) {
          currentMonthIndex += (step > 0 ? remainingSteps : -remainingSteps);
          date.setTime(monthInfos[currentMonthIndex].date.getTime());
          break;
        } else {
          remainingSteps -= (step > 0 ? (stepsToYearEnd + 1) : (currentMonthIndex + 1));
          currentYear += (step > 0 ? 1 : -1);

          if (currentYear > MAX_YEAR) {
            monthInfos = calendar.getChineseYearMonthInfo(MAX_YEAR, DEFAULT_REGION);
            if (monthInfos) date.setTime(monthInfos[monthInfos.length - 1].date.getTime());
            break;
          } else if (currentYear < MIN_YEAR) {
            date.setTime(monthInfos[0].date.getTime());
            break;
          } else {
            monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);
            if (!monthInfos) break;
            currentMonthIndex = step > 0 ? 0 : monthInfos.length - 1;
          }
        }
      }
    } catch (e) {
      console.error('chineseMonth2 offset error:', e);
    }
  },
  // count: count months between two dates
  (start, end) => {
    if (!calendarLoaded || !calendar || start >= end) return 0;
    try {
      const startChinese = calendar.getChineseDateFromGregorian(start, DEFAULT_REGION);
      const endChinese = calendar.getChineseDateFromGregorian(end, DEFAULT_REGION);
      if (!startChinese || !endChinese) return 0;

      // Simple approximation
      return (endChinese.year - startChinese.year) * 12 + (endChinese.month - startChinese.month);
    } catch (e) {
      return 0;
    }
  },
  // field: return current month index (0-based)
  (date) => {
    if (!calendarLoaded || !calendar) return 0;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      return chineseDate ? chineseDate.month - 1 : 0;
    } catch (e) {
      return 0;
    }
  }
);

// chineseMonth2.every() for k-month intervals
chineseMonth2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      if (!calendarLoaded || !calendar) return;
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) return;

        let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
        if (!monthInfos) return;

        // Find current month index
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

        if (currentIndex === -1) return;

        // Floor to k multiple
        const flooredMonths = Math.floor(currentIndex / k) * k;
        if (flooredMonths < monthInfos.length) {
          date.setTime(monthInfos[flooredMonths].date.getTime());
        }
      } catch (e) {
        console.error('chineseMonth2.every floor error:', e);
      }
    },
    (date, step) => {
      if (!calendarLoaded || !calendar || step === 0) return;
      try {
        const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
        if (!chineseDate) return;

        let monthInfos = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
        if (!monthInfos) return;

        // Find current month index
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

        if (currentIndex === -1) return;

        // Step by k*step months
        const totalStep = k * step;
        let remainingSteps = Math.abs(totalStep);
        let currentYear = chineseDate.year;
        let currentMonthIndex = currentIndex;

        while (remainingSteps >= 0) {
          const stepsToYearEnd = monthInfos.length - currentMonthIndex - 1;

          if (remainingSteps <= (step > 0 ? stepsToYearEnd : currentMonthIndex)) {
            currentMonthIndex += (step > 0 ? remainingSteps : -remainingSteps);
            date.setTime(monthInfos[currentMonthIndex].date.getTime());
            break;
          } else {
            remainingSteps -= (step > 0 ? (stepsToYearEnd + 1) : (currentMonthIndex + 1));
            currentYear += (step > 0 ? 1 : -1);

            if (currentYear > MAX_YEAR) {
              monthInfos = calendar.getChineseYearMonthInfo(MAX_YEAR, DEFAULT_REGION);
              if (monthInfos) date.setTime(monthInfos[monthInfos.length - 1].date.getTime());
              break;
            } else if (currentYear < MIN_YEAR) {
              date.setTime(monthInfos[0].date.getTime());
              break;
            } else {
              monthInfos = calendar.getChineseYearMonthInfo(currentYear, DEFAULT_REGION);
              if (!monthInfos) break;
              currentMonthIndex = step > 0 ? 0 : monthInfos.length - 1;
            }
          }
        }
      } catch (e) {
        console.error('chineseMonth2.every offset error:', e);
      }
    }
  );
};

/**
 * Chinese Day (农历日) - d3.timeInterval
 */
export const chineseDay2 = d3.timeInterval(
  // floor: round down to start of Chinese day
  (date) => {
    if (!calendarLoaded || !calendar) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

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
      }
    } catch (e) {
      console.error('chineseDay2 floor error:', e);
    }
  },
  // offset: step by days (Chinese days = Gregorian days)
  (date, step) => {
    if (!calendarLoaded || !calendar) return;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      if (!chineseDate) return;

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
      }

      // Chinese days correspond 1:1 with Gregorian days
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + step);
      date.setTime(newDate.getTime());
    } catch (e) {
      console.error('chineseDay2 offset error:', e);
    }
  },
  // count: count days between two dates
  (start, end) => {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 60 * 1000) / 24 / 60 / 60 / 1000;
  },
  // field: return current day (0-based, i.e., 初一 = 0)
  (date) => {
    if (!calendarLoaded || !calendar) return 0;
    try {
      const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
      return chineseDate ? chineseDate.day - 1 : 0;
    } catch (e) {
      return 0;
    }
  }
);

/**
 * Yearly axis configuration
 */
export let yearlyAxis = {
  name: 'chinese-yearly',
  height: 18,
  isGrid: false,
  class: 'yearly',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    if (!calendarLoaded || !calendar) {
      return [[Infinity, [d3.utcYear, () => '']]];
    }

    return [
      [0.03125, [chineseDay2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi', month: 'normal', day: 'normal' });
      }]],
      [0.25, [chineseDay2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return chineseDate && chineseDate.day === 1
          ? toLocaleString(chineseDate, local, { year: 'ganzhi', month: 'normal', day: 'normal' })
          : toLocaleString(chineseDate, local, { month: 'normal', day: 'normal' });
      }]],
      [2, [chineseMonth2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true });
      }]],
      [4, [chineseMonth2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        const startOfTheYear = chineseDate && chineseDate.month === 1 && chineseDate.day === 1;
        return startOfTheYear
          ? toLocaleString(chineseDate, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true })
          : toLocaleString(chineseDate, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal' });
      }]],
      [8, [chineseMonth2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        const startOfTheYear = chineseDate && chineseDate.month === 1 && chineseDate.day === 1;
        return startOfTheYear
          ? toLocaleString(chineseDate, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal' })
          : toLocaleString(chineseDate, local, { year: 'ganzhi', month: 'normal' });
      }]],
      [128, [chineseYear2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi' });
      }]],
      [512, [chineseYear2.every(5), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi' });
      }]],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256) * 5), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi' });
      }]]
    ];
  }
};

/**
 * Daily axis configuration
 */
export let dailyAxis = {
  name: 'chinese-daily',
  height: 15,
  isGrid: false,
  class: 'daily',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    if (!calendarLoaded || !calendar) {
      return [[Infinity, [d3.utcYear, () => '']]];
    }

    return [
      [0.0625, [d3.timeHour.every(2), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { hour: 'ganzhi' });
      }]],
      [0.125, [d3.timeHour.every(2), '']],
      [0.25, [d3.timeHour.every(6), '']],
      [0.5, [chineseDay2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { day: 'ganzhi' });
      }]],
      [8, [chineseDay2, '']],
      [16, [chineseMonth2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { month: 'ganzhi' });
      }]],
      [32, [chineseMonth2.every(3), 'Q%q']],
      [128, [chineseMonth2.every(6), (d) => d.getMonth() < 6 ? '上半年' : '下半年']],
      [256, [chineseYear2, (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi' });
      }]],
      [512, [chineseYear2, '']],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256)), (d) => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return toLocaleString(chineseDate, local, { year: 'ganzhi' });
      }]]
    ];
  }
};

/**
 * Daily grid configuration
 */
export let dailyGrid = {
  name: 'chinese-daily-grid',
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    if (!calendarLoaded || !calendar) {
      return [[Infinity, [d3.utcYear, '']]];
    }

    return [
      [0.025, [d3.timeHour.every(2), '']],
      [0.05, [d3.timeHour.every(6), '']],
      [0.5, [d3.timeHour.every(12), '']],
      [1, [chineseDay2, '']],
      [8, [chineseDay2.filter(d => {
        const chineseDate = calendar.getChineseDateFromGregorian(d, DEFAULT_REGION);
        return chineseDate && (chineseDate.day === 15 || chineseDate.day === 1);
      }), '']],
      [24, [chineseMonth2, '']],
      [64, [chineseMonth2.every(6), '']]
    ];
  }
};

/**
 * Yearly grid configuration
 */
export let yearlyGrid = {
  name: 'chinese-yearly-grid',
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    if (!calendarLoaded || !calendar) {
      return [[Infinity, [d3.utcYear, '']]];
    }

    return [
      [0.125, [chineseDay2, '']],
      [8, [chineseMonth2, '']],
      [64, [chineseYear2, '']],
      [128, [chineseYear2.every(2), '']],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256) * 5), '']]
    ];
  }
};

/**
 * Get all axis configurations
 */
export function getAxises() {
  return {
    yearlyAxis,
    dailyAxis,
    dailyGrid,
    yearlyGrid,
    chineseYear2,
    chineseMonth2,
    chineseDay2,
    calendar,
    MIN_YEAR,
    MAX_YEAR
  };
}

/**
 * Update domain after loading
 */
function updateExports() {
  const domain = getLimitedDomain();
  yearlyAxis.domain = domain;
  dailyAxis.domain = domain;
  dailyGrid.domain = domain;
  yearlyGrid.domain = domain;
}
