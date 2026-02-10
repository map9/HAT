/**
 * Chinese Calendar axis configurations
 * Based on ccalendar library (supports 722 BCE to 2200 CE)
 */

import * as d3 from 'd3';
import {
  ChineseCalendar,
  ChineseCalendarRender,
  ChineseCalendarType,
  CALENDAR_RANGE_MIN_YEAR,
  CALENDAR_RANGE_MAX_YEAR,
  makeDate,
} from '@hat/ccalendar';

// Calendar and render instances
const cc = new ChineseCalendar();
const render = new ChineseCalendarRender({ locale: 'zh-Hans' });

// Default calendar type
const CAL = ChineseCalendarType.DEFAULT;

// Year range constants
export const MIN_YEAR = CALENDAR_RANGE_MIN_YEAR;
export const MAX_YEAR = CALENDAR_RANGE_MAX_YEAR;

/**
 * Initialize ChineseCalendar library
 * Kept for API compatibility. ccalendar initializes synchronously.
 * @param {Object} _calendarModule - Unused (kept for compatibility)
 * @returns {Promise<boolean>} - always true
 */
export async function initChineseCalendar(_calendarModule = null) {
  return true;
}

/**
 * Check if ChineseCalendar library is loaded
 */
export function isChineseCalendarLoaded() {
  return true;
}

/**
 * Get the calendar instance
 */
export function getCalendar() {
  return cc;
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
 * Get LunarDate from JS Date
 */
const getLunarDate = (date) => cc.getChineseDateFromDate(CAL, date);

/**
 * Get year start as JS Date
 */
const getYearStartDate = (cYear) => {
  const wDate = cc.getChineseYearStart(CAL, cYear);
  return wDate ? makeDate(wDate.year, wDate.month, wDate.day) : null;
};

/**
 * Get month infos with JS Date objects attached
 * Returns LunarMonth[] with additional jsDate property
 */
const getMonthInfos = (cYear) => {
  const months = cc.getChineseYearMonthInfo(CAL, cYear);
  if (!months) return null;
  return months.map(m => ({
    ...m,
    jsDate: makeDate(m.date.year, m.date.month, m.date.day)
  }));
};

/**
 * Get first day of a Chinese month as JS Date
 */
const getMonthStartDate = (ld) => {
  const result = cc.getDateFromChineseDate(
    CAL, ld.cYear, ld.cMonth, 1,
    ld.heMonth,
    ld.jd ? ld.jd - (ld.cDay - 1) : undefined
  );
  if (!result) return null;
  return Array.isArray(result) ? result[0] : result;
};

/**
 * Get start of a Chinese day as JS Date
 */
const getDayStartDate = (ld) => {
  const result = cc.getDateFromChineseDate(
    CAL, ld.cYear, ld.cMonth, ld.cDay,
    ld.heMonth, ld.jd
  );
  if (!result) return null;
  return Array.isArray(result) ? result[0] : result;
};

/**
 * Format LunarDate to locale string
 */
const formatLunarDate = (ld, config) => {
  if (!ld) return '';
  try {
    return render.lunarDateToString(ld, config).trim();
  } catch (e) {
    return '';
  }
};

/**
 * Convert western date to Chinese date string
 */
export const westernDate2ChineseDateString = (date) => {
  try {
    const year = date.getFullYear();
    if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
      return '';
    }
    const ld = getLunarDate(date);
    return formatLunarDate(ld, { year: 'short', month: 'short', day: 'short' });
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
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      let cYear = ld.cYear;
      if (cYear < MIN_YEAR) cYear = MIN_YEAR;
      else if (cYear > MAX_YEAR) cYear = MAX_YEAR;

      const yearStart = getYearStartDate(cYear);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      }
    } catch (e) {
      console.error('chineseYear2 floor error:', e);
    }
  },
  // offset: step by Chinese years
  (date, step) => {
    if (step === 0) return;
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      let targetYear = ld.cYear + step;
      if (targetYear < MIN_YEAR) targetYear = MIN_YEAR;
      else if (targetYear > MAX_YEAR) targetYear = MAX_YEAR;

      const yearStart = getYearStartDate(targetYear);
      if (yearStart) {
        date.setTime(yearStart.getTime());
      }
    } catch (e) {
      console.error('chineseYear2 offset error:', e);
    }
  },
  // count: count years between two dates
  (start, end) => {
    if (start >= end) return 0;
    try {
      return end.getFullYear() - start.getFullYear();
    } catch (e) {
      return 0;
    }
  },
  // field: return current Chinese year
  (date) => {
    try {
      const ld = getLunarDate(date);
      return ld ? ld.cYear : 0;
    } catch (e) {
      return 0;
    }
  }
);

// chineseYear2.every() for k-year intervals
chineseYear2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      try {
        const ld = getLunarDate(date);
        if (!ld) return;

        let flooredYear = Math.floor(ld.cYear / k) * k;
        if (flooredYear < MIN_YEAR) flooredYear = MIN_YEAR;
        else if (flooredYear > MAX_YEAR) flooredYear = MAX_YEAR;

        const yearStart = getYearStartDate(flooredYear);
        if (yearStart) {
          date.setTime(yearStart.getTime());
        }
      } catch (e) {
        console.error('chineseYear2.every floor error:', e);
      }
    },
    (date, step) => {
      if (step === 0) return;
      try {
        const ld = getLunarDate(date);
        if (!ld) return;

        let targetYear = ld.cYear + step * k;
        if (targetYear < MIN_YEAR) targetYear = MIN_YEAR;
        else if (targetYear > MAX_YEAR) targetYear = MAX_YEAR;

        const yearStart = getYearStartDate(targetYear);
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
 * Find current month index in monthInfos array
 */
const findMonthIndex = (date, monthInfos) => {
  for (let i = 0; i < monthInfos.length; i++) {
    if (i < monthInfos.length - 1) {
      if (date >= monthInfos[i].jsDate && date < monthInfos[i + 1].jsDate) {
        return i;
      }
    } else {
      if (date >= monthInfos[i].jsDate) {
        return i;
      }
    }
  }
  return -1;
};

/**
 * Step through months across year boundaries
 */
const stepMonths = (date, cYear, currentIndex, monthInfos, step) => {
  let remainingSteps = Math.abs(step);
  let currentYear = cYear;
  let currentMonthIndex = currentIndex;
  let currentMonthInfos = monthInfos;

  while (remainingSteps >= 0) {
    const stepsToYearEnd = currentMonthInfos.length - currentMonthIndex - 1;

    if (remainingSteps <= (step > 0 ? stepsToYearEnd : currentMonthIndex)) {
      currentMonthIndex += (step > 0 ? remainingSteps : -remainingSteps);
      date.setTime(currentMonthInfos[currentMonthIndex].jsDate.getTime());
      break;
    } else {
      remainingSteps -= (step > 0 ? (stepsToYearEnd + 1) : (currentMonthIndex + 1));
      currentYear += (step > 0 ? 1 : -1);

      if (currentYear > MAX_YEAR) {
        currentMonthInfos = getMonthInfos(MAX_YEAR);
        if (currentMonthInfos) date.setTime(currentMonthInfos[currentMonthInfos.length - 1].jsDate.getTime());
        break;
      } else if (currentYear < MIN_YEAR) {
        date.setTime(currentMonthInfos[0].jsDate.getTime());
        break;
      } else {
        currentMonthInfos = getMonthInfos(currentYear);
        if (!currentMonthInfos) break;
        currentMonthIndex = step > 0 ? 0 : currentMonthInfos.length - 1;
      }
    }
  }
};

/**
 * Chinese Month (农历月) - d3.timeInterval
 */
export const chineseMonth2 = d3.timeInterval(
  // floor: round down to first day of Chinese month
  (date) => {
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      const monthStart = getMonthStartDate(ld);
      if (monthStart) {
        date.setTime(monthStart.getTime());
      }
    } catch (e) {
      console.error('chineseMonth2 floor error:', e);
    }
  },
  // offset: step by Chinese months
  (date, step) => {
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      const monthInfos = getMonthInfos(ld.cYear);
      if (!monthInfos) return;

      const currentIndex = findMonthIndex(date, monthInfos);
      if (currentIndex === -1) return;

      stepMonths(date, ld.cYear, currentIndex, monthInfos, step);
    } catch (e) {
      console.error('chineseMonth2 offset error:', e);
    }
  },
  // count: count months between two dates
  (start, end) => {
    if (start >= end) return 0;
    try {
      const startLD = getLunarDate(start);
      const endLD = getLunarDate(end);
      if (!startLD || !endLD) return 0;

      return (endLD.cYear - startLD.cYear) * 12 + (Math.abs(endLD.cMonth) - Math.abs(startLD.cMonth));
    } catch (e) {
      return 0;
    }
  },
  // field: return current month index (0-based)
  (date) => {
    try {
      const ld = getLunarDate(date);
      return ld ? Math.abs(ld.cMonth) - 1 : 0;
    } catch (e) {
      return 0;
    }
  }
);

// chineseMonth2.every() for k-month intervals
chineseMonth2.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      try {
        const ld = getLunarDate(date);
        if (!ld) return;

        const monthInfos = getMonthInfos(ld.cYear);
        if (!monthInfos) return;

        const currentIndex = findMonthIndex(date, monthInfos);
        if (currentIndex === -1) return;

        const flooredMonths = Math.floor(currentIndex / k) * k;
        if (flooredMonths < monthInfos.length) {
          date.setTime(monthInfos[flooredMonths].jsDate.getTime());
        }
      } catch (e) {
        console.error('chineseMonth2.every floor error:', e);
      }
    },
    (date, step) => {
      if (step === 0) return;
      try {
        const ld = getLunarDate(date);
        if (!ld) return;

        const monthInfos = getMonthInfos(ld.cYear);
        if (!monthInfos) return;

        const currentIndex = findMonthIndex(date, monthInfos);
        if (currentIndex === -1) return;

        stepMonths(date, ld.cYear, currentIndex, monthInfos, k * step);
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
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      const dayStart = getDayStartDate(ld);
      if (dayStart) {
        date.setTime(dayStart.getTime());
      }
    } catch (e) {
      console.error('chineseDay2 floor error:', e);
    }
  },
  // offset: step by days (Chinese days = Gregorian days)
  (date, step) => {
    try {
      const ld = getLunarDate(date);
      if (!ld) return;

      const dayStart = getDayStartDate(ld);
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
    try {
      const ld = getLunarDate(date);
      return ld ? ld.cDay - 1 : 0;
    } catch (e) {
      return 0;
    }
  }
);

/**
 * Yearly axis configuration
 */
export const yearlyAxis = {
  name: 'chinese-yearly',
  height: 18,
  isGrid: false,
  class: 'yearly',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    return [
      [0.03125, [chineseDay2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi', month: 'short', day: 'short' });
      }]],
      [0.25, [chineseDay2, (d) => {
        const ld = getLunarDate(d);
        return ld && ld.cDay === 1
          ? formatLunarDate(ld, { year: 'short.ganZhi', month: 'short', day: 'short' })
          : formatLunarDate(ld, { month: 'short', day: 'short' });
      }]],
      [2, [chineseMonth2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'normal.ganZhi', month: 'normal' });
      }]],
      [4, [chineseMonth2, (d) => {
        const ld = getLunarDate(d);
        const startOfTheYear = ld && ld.isFirstMonth && ld.cDay === 1;
        return startOfTheYear
          ? formatLunarDate(ld, { year: 'normal.ganZhi', month: 'normal' })
          : formatLunarDate(ld, { year: 'normal.ganZhi', month: 'short' });
      }]],
      [8, [chineseMonth2, (d) => {
        const ld = getLunarDate(d);
        const startOfTheYear = ld && ld.isFirstMonth && ld.cDay === 1;
        return startOfTheYear
          ? formatLunarDate(ld, { year: 'normal.ganZhi', month: 'short' })
          : formatLunarDate(ld, { year: 'short.ganZhi', month: 'short' });
      }]],
      [128, [chineseYear2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi' });
      }]],
      [512, [chineseYear2.every(5), (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi' });
      }]],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256) * 5), (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi' });
      }]]
    ];
  }
};

/**
 * Daily axis configuration
 */
export const dailyAxis = {
  name: 'chinese-daily',
  height: 15,
  isGrid: false,
  class: 'daily',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    return [
      [0.0625, [d3.timeHour.every(2), (d) => {
        // Hour ganzhi (时辰干支) not yet supported in ccalendar
        return '';
      }]],
      [0.125, [d3.timeHour.every(2), '']],
      [0.25, [d3.timeHour.every(6), '']],
      [0.5, [chineseDay2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { day: 'short.ganZhi' });
      }]],
      [8, [chineseDay2, '']],
      [16, [chineseMonth2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { month: 'short.ganZhi' });
      }]],
      [32, [chineseMonth2.every(3), 'Q%q']],
      [128, [chineseMonth2.every(6), (d) => d.getMonth() < 6 ? '上半年' : '下半年']],
      [256, [chineseYear2, (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi' });
      }]],
      [512, [chineseYear2, '']],
      [Infinity, [chineseYear2.every(Math.round(hoursPerPixel / 256)), (d) => {
        const ld = getLunarDate(d);
        return formatLunarDate(ld, { year: 'short.ganZhi' });
      }]]
    ];
  }
};

/**
 * Daily grid configuration
 */
export const dailyGrid = {
  name: 'chinese-daily-grid',
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
    return [
      [0.025, [d3.timeHour.every(2), '']],
      [0.05, [d3.timeHour.every(6), '']],
      [0.5, [d3.timeHour.every(12), '']],
      [1, [chineseDay2, '']],
      [8, [chineseDay2.filter(d => {
        const ld = getLunarDate(d);
        return ld && (ld.cDay === 15 || ld.cDay === 1);
      }), '']],
      [24, [chineseMonth2, '']],
      [64, [chineseMonth2.every(6), '']]
    ];
  }
};

/**
 * Yearly grid configuration
 */
export const yearlyGrid = {
  name: 'chinese-yearly-grid',
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  domain: getLimitedDomain(),
  map: (hoursPerPixel, local) => {
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
    calendar: cc,
    MIN_YEAR,
    MAX_YEAR
  };
}
