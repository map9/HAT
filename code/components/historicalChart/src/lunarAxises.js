/**
 * Lunar calendar axis configurations
 * Based on lunar-javascript library
 * Supports years 1 CE to 9999 CE only
 *
 * Note: Requires lunar-javascript to be installed separately:
 *   npm install lunar-javascript
 */
import * as d3 from 'd3';

// Lunar library references - must be initialized before use
let Lunar = null;
let LunarYear = null;
let LunarMonth = null;
let lunarLoaded = false;

/**
 * Initialize lunar-javascript library
 * Must be called before using lunar axes
 * @param {Object} lunarModule - Optional: pass the lunar-javascript module directly
 * @returns {Promise<boolean>} - true if loaded successfully
 */
export async function initLunar(lunarModule = null) {
  if (lunarLoaded) return true;
  try {
    // If module is passed directly, use it
    if (lunarModule) {
      Lunar = lunarModule.Lunar;
      LunarYear = lunarModule.LunarYear;
      LunarMonth = lunarModule.LunarMonth;
      lunarLoaded = true;
      console.log('lunar-javascript initialized from provided module');
      return true;
    }

    // Try dynamic import with variable to avoid Vite static analysis
    const moduleName = 'lunar-javascript';
    const module = await import(/* @vite-ignore */ moduleName);
    Lunar = module.Lunar;
    LunarYear = module.LunarYear;
    LunarMonth = module.LunarMonth;
    lunarLoaded = true;
    console.log('lunar-javascript loaded successfully');
    return true;
  } catch (e) {
    console.warn('lunar-javascript not installed. lunarAxises will not work.', e);
    return false;
  }
}

/**
 * Check if lunar library is loaded
 */
export function isLunarLoaded() {
  return lunarLoaded;
}

// Convert Solar to Date
const solarToDate = (solar) => {
  let year = solar.getYear();
  const date = new Date(
    year > 99 ? year : 0,
    solar.getMonth() - 1,
    solar.getDay(),
    solar.getHour(),
    solar.getMinute(),
    solar.getSecond()
  );
  date.setFullYear(year);
  return date;
};

// Year to Chinese
const yearToChinese = (lunar) => {
  const year = lunar.getYear();
  if (year < 0) {
    const newLunar = Lunar.fromYmd(Math.abs(year), 1, 1);
    return `前${newLunar.getYearInChinese()}`;
  } else {
    return lunar.getYearInChinese();
  }
};

// Format lunar date to locale string
const toLocaleString = (lunar, local, config = {
  year: 'none',
  yearShengXiao: false,
  month: 'none',
  monthShengXiao: false,
  day: 'none',
  dayShengXiao: false,
  hour: 'none',
  hourShengXiao: false
}) => {
  if (!lunar || !lunarLoaded) return '';

  let total = '', s = '';

  if (config.year !== null && config.year !== 'none') {
    if (config.year === 'normal' || config.year === 'ganzhi') {
      s += (config.year === 'normal') ? yearToChinese(lunar) : lunar.getYearInGanZhi();
      s += config.yearShengXiao ? '(' + lunar.getYearShengXiao() + ')年' : '年';
    }
  }

  total += s.length > 0 ? s + ' ' : '';
  s = '';

  if (config.month !== null && config.month !== 'none') {
    if (config.month === 'normal' || config.month === 'ganzhi') {
      s += config.month === 'normal' ? lunar.getMonthInChinese() : lunar.getMonthInGanZhi();
      s += config.monthShengXiao ? '(' + lunar.getYearShengXiao() + ')月' : '月';
    }
  }

  total += s.length > 0 ? s + ' ' : '';
  s = '';

  if (config.day !== null && config.day !== 'none') {
    if (config.day === 'normal' || config.day === 'ganzhi') {
      s += config.day === 'normal' ? lunar.getDayInChinese() : lunar.getDayInGanZhi();
      s += config.dayShengXiao ? '(' + lunar.getDayShengXiao() + ')' : '';
      s += config.day === 'ganzhi' ? '日' : '';
    }
  }

  total += s.length > 0 ? s + ' ' : '';
  s = '';

  if (config.hour !== null && config.hour !== 'none') {
    if (config.hour === 'normal' || config.hour === 'ganzhi') {
      s += config.hour === 'normal' ? lunar.getTime() : lunar.getTimeZhi();
      s += config.hourShengXiao ? '(' + lunar.getTimeShengXiao() + ')' : '';
      s += config.hour === 'ganzhi' ? '时' : '';
    }
  }

  total += s;
  return total.trim();
};

// Domain limited to years 1 CE to 9999 CE
const limitedDomain = [new Date('0001-01-01'), new Date('9999-12-31')];

// Chinese Year interval
export const chineseYear = d3.timeInterval(
  (date) => {
    if (!lunarLoaded) return;
    try {
      const lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear(), 1, 1);
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseYear floor error:', e);
    }
  },
  (date, step) => {
    if (!lunarLoaded) return;
    try {
      let lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear() + step, 1, 1);
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseYear offset error:', e);
    }
  },
  (start, end) => {
    if (!lunarLoaded) return 0;
    try {
      return Lunar.fromDate(end).getYear() - Lunar.fromDate(start).getYear();
    } catch (e) {
      return 0;
    }
  },
  (date) => {
    if (!lunarLoaded) return 0;
    try {
      return Lunar.fromDate(date).getYear();
    } catch (e) {
      return 0;
    }
  }
);

chineseYear.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval(
    (date) => {
      if (!lunarLoaded) return;
      try {
        let lunar = Lunar.fromYmd(Math.floor(Lunar.fromDate(date).getYear() / k) * k, 1, 1);
        date.setTime(solarToDate(lunar.getSolar()).getTime());
      } catch (e) {
        console.error('chineseYear.every floor error:', e);
      }
    },
    (date, step) => {
      if (!lunarLoaded) return;
      try {
        let lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear() + step * k, 1, 1);
        date.setTime(solarToDate(lunar.getSolar()).getTime());
      } catch (e) {
        console.error('chineseYear.every offset error:', e);
      }
    }
  );
};

// Chinese Month interval
export const chineseMonth = d3.timeInterval(
  (date) => {
    if (!lunarLoaded) return;
    try {
      let lunar = Lunar.fromDate(date);
      lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), 1);
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseMonth floor error:', e);
    }
  },
  (date, step) => {
    if (!lunarLoaded) return;
    try {
      let lunar = Lunar.fromDate(date);
      let lunarMonth = LunarMonth.fromYm(lunar.getYear(), lunar.getMonth());
      lunarMonth = lunarMonth.next(step);
      lunar = Lunar.fromYmd(lunarMonth.getYear(), lunarMonth.getMonth(), 1);
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseMonth offset error:', e);
    }
  },
  (start, end) => {
    if (!lunarLoaded) return 0;
    try {
      let lunarStart = Lunar.fromDate(start);
      let lunarEnd = Lunar.fromDate(end);
      return (lunarEnd.getYear() - lunarStart.getYear()) * 12 + (lunarEnd.getMonth() - lunarStart.getMonth());
    } catch (e) {
      return 0;
    }
  },
  (date) => {
    if (!lunarLoaded) return 0;
    try {
      return Lunar.fromDate(date).getMonth() - 1;
    } catch (e) {
      return 0;
    }
  }
);

// Chinese Day interval
export const chineseDay = d3.timeInterval(
  (date) => {
    if (!lunarLoaded) return;
    try {
      let lunar = Lunar.fromDate(date);
      lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), lunar.getDay());
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseDay floor error:', e);
    }
  },
  (date, step) => {
    if (!lunarLoaded) return;
    try {
      let lunar = Lunar.fromDate(date);
      lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), lunar.getDay());
      lunar = lunar.next(step);
      date.setTime(solarToDate(lunar.getSolar()).getTime());
    } catch (e) {
      console.error('chineseDay offset error:', e);
    }
  },
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 60 * 1000) / 24 / 60 / 60 / 1000,
  (date) => {
    if (!lunarLoaded) return 0;
    try {
      return Lunar.fromDate(date).getDay() - 1;
    } catch (e) {
      return 0;
    }
  }
);

// Axis configurations
export const yearlyAxis = {
  name: 'lunar-yearly',
  height: 18,
  isGrid: false,
  class: 'yearly',
  domain: limitedDomain,
  map: (hoursPerPixel, local) => {
    if (!lunarLoaded) return [[Infinity, [d3.utcYear, () => '']]];

    return [
      [0.03125, [chineseDay, (d) => {
        try {
          const lunar = Lunar.fromDate(d);
          return toLocaleString(lunar, local, { year: 'ganzhi', month: 'normal', day: 'normal' });
        } catch (e) { return ''; }
      }]],
      [0.25, [chineseDay, (d) => {
        try {
          const lunar = Lunar.fromDate(d);
          return lunar.getDay() === 1
            ? toLocaleString(lunar, local, { year: 'ganzhi', month: 'normal', day: 'normal' })
            : toLocaleString(lunar, local, { month: 'normal', day: 'normal' });
        } catch (e) { return ''; }
      }]],
      [2, [chineseMonth, (d) => {
        try {
          const lunar = Lunar.fromDate(d);
          return toLocaleString(lunar, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true });
        } catch (e) { return ''; }
      }]],
      [4, [chineseMonth, (d) => {
        try {
          const lunar = Lunar.fromDate(d);
          const startOfTheYear = lunar.getMonth() === 1 && lunar.getDay() === 1;
          return startOfTheYear
            ? toLocaleString(lunar, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true })
            : toLocaleString(lunar, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal' });
        } catch (e) { return ''; }
      }]],
      [8, [chineseMonth, (d) => {
        try {
          const lunar = Lunar.fromDate(d);
          const startOfTheYear = lunar.getMonth() === 1 && lunar.getDay() === 1;
          return startOfTheYear
            ? toLocaleString(lunar, local, { year: 'ganzhi', yearShengXiao: true, month: 'normal' })
            : toLocaleString(lunar, local, { year: 'ganzhi', month: 'normal' });
        } catch (e) { return ''; }
      }]],
      [128, [chineseYear, (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { year: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [512, [chineseYear.every(5), (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { year: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256) * 5), (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { year: 'ganzhi' }); }
        catch (e) { return ''; }
      }]]
    ];
  }
};

export const dailyAxis = {
  name: 'lunar-daily',
  height: 15,
  isGrid: false,
  class: 'daily',
  domain: limitedDomain,
  map: (hoursPerPixel, local) => {
    if (!lunarLoaded) return [[Infinity, [d3.utcYear, () => '']]];

    return [
      [0.0625, [d3.timeHour.every(2), (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { hour: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [0.125, [d3.timeHour.every(2), '']],
      [0.25, [d3.timeHour.every(6), '']],
      [0.5, [chineseDay, (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { day: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [8, [chineseDay, '']],
      [16, [chineseMonth, (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { month: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [32, [chineseMonth.every(3), 'Q%q']],
      [128, [chineseMonth.every(6), (d) => d.getMonth() < 6 ? '上半年' : '下半年']],
      [256, [chineseYear, (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { year: 'ganzhi' }); }
        catch (e) { return ''; }
      }]],
      [512, [chineseYear, '']],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256)), (d) => {
        try { return toLocaleString(Lunar.fromDate(d), local, { year: 'ganzhi' }); }
        catch (e) { return ''; }
      }]]
    ];
  }
};

export const dailyGrid = {
  name: 'lunar-daily-grid',
  height: -1,
  isGrid: true,
  class: 'daily-grid',
  domain: limitedDomain,
  map: (hoursPerPixel, local) => {
    if (!lunarLoaded) return [[Infinity, [d3.utcYear, '']]];

    return [
      [0.025, [d3.timeHour.every(2), '']],
      [0.05, [d3.timeHour.every(6), '']],
      [0.5, [d3.timeHour.every(12), '']],
      [1, [chineseDay, '']],
      [8, [chineseDay.filter(d => {
        try {
          const lunar = Lunar.fromDate(d);
          return lunar.getDay() === 15 || lunar.getDay() === 1;
        } catch (e) { return false; }
      }), '']],
      [24, [chineseMonth, '']],
      [64, [chineseMonth.every(6), '']]
    ];
  }
};

export const yearlyGrid = {
  name: 'lunar-yearly-grid',
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  domain: limitedDomain,
  map: (hoursPerPixel, local) => {
    if (!lunarLoaded) return [[Infinity, [d3.utcYear, '']]];

    return [
      [0.125, [chineseDay, '']],
      [8, [chineseMonth, '']],
      [64, [chineseYear, '']],
      [128, [chineseYear.every(2), '']],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256) * 5), '']]
    ];
  }
};
