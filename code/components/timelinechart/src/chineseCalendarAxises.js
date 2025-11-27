import { Lunar, LunarYear, LunarMonth } from "lunar-javascript";
import * as d3 from "d3";

/*
 * lunar-javascript只支持 1 年 ～ 9999 年
 * 如果出现了公元前的时间，就会产生错误。
 * 从 Lunar.fromDate 生成的 lunar 对象，无法通过 Lunar.fromYmd 生成。
 * 其原因是lunar-javascript中农历的闰月只支持 0 年 ～ 10000 年，在 LunarYear.fromYear 的 _compute 中能看到这个问题。

 * 以下都是会出问题的时间和代码
 * const isoString = "-000570-01-17T10:49:05.307Z";
 * const isoString = "-000513-01-28T22:21:35.710Z";
 * const isoString = "-000589-01-09T11:24:16.999Z";
 * const isoString = "-000809-02-19T16:15:23.049Z";
 * const isoString = "0001-01-17T10:49:05.307Z";
 * const date = new Date(isoString);
 * let lunar = Lunar.fromDate(date);
 * let lunarYear = LunarYear.fromYear(lunar.getYear());
 * let y = lunar.getYear();
 * let m = lunar.getMonth();
 * 在 y 中，无法找到 m。 因此，Lunar.fromYmd会失败。
 * lunar = Lunar.fromYmd(y, m, 1);
 */

// 将 Lunar Solar 对象转换为 JavaScript Date 对象
const solarToDate = (solar) => {
  // 确保年份正确
  let year = solar.getYear();

  const date = new Date(
    year > 99 ? year : 0,  // 0~99 年的年份要特别处理
    solar.getMonth() - 1,  // JS Date 月份从 0 开始
    solar.getDay(),
    solar.getHour(),
    solar.getMinute(),
    solar.getSecond()
  );
  // 修正 0~99 年的错误，以及公元前（负数年份）问题
  date.setFullYear(year);
  //console.log(date);

  return date;
};

const yearToChinese = (lunar) => {
  const year = lunar.getYear();

  if (year < 0) {
    const newLunar = Lunar.fromYmd(Math.abs(year), 1, 1);
    return `前${newLunar.getYearInChinese()}`;
  } else {
    return lunar.getYearInChinese();
  }
}

const toLocaleString = (lunar, local, config = {year: 'none', yearShengXiao: false, month: 'none', monthShengXiao: false, day: 'none', dayShengXiao: false, hour: 'none', hourShengXiao: false}) => {
  var total = '', s = '';
  if (config.year === null || config.year === 'none') {
    s += yearShengXiao === true ? lunar.getYearShengXiao()+'年' : '';
  } else {
    if (config.year === "normal" || config.year === "ganzhi") {
      s += (config.year === "normal") ? yearToChinese(lunar) : lunar.getYearInGanZhi();
      s += config.yearShengXiao && (config.yearShengXiao === true) ? '('+lunar.getYearShengXiao()+')年' : '年';
    }
  }

  total += s.length > 0 ? s + ' ' : ''; s = '';
  if (config.month === null || config.month === 'none') {
    s += config.monthShengXiao && (config.monthShengXiao === true) ? lunar.getMonthShengXiao()+'月' : '';
  } else {
    if (config.month === "normal" || config.month === "ganzhi") {
      s += config.month === "normal" ? lunar.getMonthInChinese() : lunar.getMonthInGanZhi();
      s += config.monthShengXiao && (config.monthShengXiao === true) ? '('+lunar.getYearShengXiao()+')月' : '月';
    }
  }

  total += s.length > 0 ? s + ' ' : ''; s = '';
  if (config.day === null || config.day === 'none') {
    s += config.dayShengXiao && (config.dayShengXiao === true) ? lunar.getDayShengXiao()+'日' : '';
  } else {
    if (config.day === "normal" || config.day === "ganzhi") {
      s += config.day === "normal" ? lunar.getDayInChinese() : lunar.getDayInGanZhi();
      s += config.dayShengXiao && (config.dayShengXiao === true) ? '('+lunar.getDayShengXiao()+')' : '';
      s += config.day === "ganzhi" ? '日' : '';
    }
  }

  total += s.length > 0 ? s + ' ' : ''; s = '';
  if (config.hour === null || config.hour === 'none') {
    s += config.hourShengXiao && (config.hourShengXiao === true) ? lunar.getTimeShengXiao()+'时' : '';
  } else {
    if (config.hour === "normal" || config.hour === "ganzhi") {
      s += config.hour === "normal" ? lunar.getTime() : lunar.getTimeZhi();
      s += config.hourShengXiao && (config.hourShengXiao === true) ? '('+lunar.getTimeShengXiao()+')' : '';
      s += config.hour === "ganzhi" ? '时' : '';
    }
  }
  
  total += s;
  return total;
}

const limitedDomain = [new Date('0001-01-01'), new Date('9999-12-31')];
//const limitedDomain = [-Infinity, Infinity];

// Chinese Year（农历年）
export const chineseYear = d3.timeInterval(
  // floor：归整到当前农历年第一天（默认为正月初一）
  (date) => {
    const lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear(), 1, 1);
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  },
  // offset：按农历年步进
  (date, step) => {
    let lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear() + step, 1, 1);
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  },
  // count：计算两个日期之间的农历年数差
  (start, end) => {
    return Lunar.fromDate(end).getYear() - Lunar.fromDate(start).getYear();
  },
  // field：返回当前农历年份的公历日期
  (date) => {
    return Lunar.fromDate(date).getYear();
  }
);

chineseYear.every = (k) => {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : d3.timeInterval((date) => {
    let lunar = Lunar.fromYmd(Math.floor(Lunar.fromDate(date).getYear() / k) * k, 1, 1);    
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  }, (date, step) => {
    let lunar = Lunar.fromYmd(Lunar.fromDate(date).getYear() + step * k, 1, 1);    
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  });
};

// Chinese Month（农历月）
export const chineseMonth = d3.timeInterval(
  // floor：归整到当前农历月第一天
  (date) => {
    let lunar = Lunar.fromDate(date);
    lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), 1);
    const timesecond = solarToDate(lunar.getSolar()).getTime()
    date.setTime(timesecond);
  },
  // offset：按农历月进行精确步进
  (date, step) => {
    let lunar = Lunar.fromDate(date);
    let lunarMonth = LunarMonth.fromYm(lunar.getYear(), lunar.getMonth());
    lunarMonth = lunarMonth.next(step);
    lunar = Lunar.fromYmd(lunarMonth.getYear(), lunarMonth.getMonth(), 1);
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  },
  // count：计算起始与结束日期之间相差多少个农历月
  (start, end) => {
    let count = 0, prev = 0, next = 0;
    let lunarStart = Lunar.fromDate(start);
    let lunarEnd = Lunar.fromDate(end);
    const startYear = lunarStart.getYear();
    const endYear = lunarEnd.getYear();
    if ( startYear === endYear ) {
      // 获取当前农历年的农历月份对象
      const months = LunarYear.fromYear(startYear).getMonthsInYear();
      const startMonth = lunarStart.getMonth();
      const endMonth = lunarEnd.getMonth();

      for(let j = 0; j < months.length; j ++) {
        let m = months[j].getMonth()
        if (m === startMonth) {
          prev = j;
        }
        else if (m === endMonth) {
          next = j;
        }
      }
      return next - prev;
    } else {
      for(let i = startYear; i <= endYear; i ++) {
        // 获取当前农历年的农历月份对象
        const months = LunarYear.fromYear(i).getMonthsInYear();

        // 如果是起始农历年
        if (i === startYear) {
          const month = lunarStart.getMonth();
          
          for(let j = 0; j < months.length; j ++) {
            if (months[j].getMonth() === month)
              prev = months.length - j;
              break;
          }
        }
        // 如果是终止农历年
        else if (i === lunarEnd) {
          const month = lunarEnd.getMonth();
          
          for(let j = 0; j < months.length; j ++) {
            if (months[j].getMonth() === month)
              next = j;
              break;
          }
        }
        else {
          count += months.length;
        }
      }

      return count + prev + next;
    }
  },
  // field：返回当前农历月份，修改为从0开始
  (date) => {
    return Lunar.fromDate(date).getMonth() - 1;
  }
);

// Chinese Day（农历日）
export const chineseDay = d3.timeInterval(
  // floor：归整到当前农历日
  (date) => {
    let lunar = Lunar.fromDate(date);
    lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), lunar.getDay());
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  },
  // offset：按农历日精确步进
  (date, step) => {
    let lunar = Lunar.fromDate(date);
    lunar = Lunar.fromYmd(lunar.getYear(), lunar.getMonth(), lunar.getDay());
    lunar = lunar.next(step);
    date.setTime(solarToDate(lunar.getSolar()).getTime());
  },
  // count：计算起始与结束日期之间相差多少个农历日（使用迭代方法）,计算农历日和计算公历日没有区别
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * 60 * 1000) / 24 / 60 / 60 / 1000,
  // field：返回当前农历日（即农历中的日号）
  (date) => {
    return Lunar.fromDate(date).getDay() - 1;
  }
);

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
          chineseDay, (d) => {
            const lunar = Lunar.fromDate(d);
            return toLocaleString(lunar, local, {year: 'ganzhi', month: 'normal', day: 'normal'});
          }
        ]
      ],
      [
        0.25,
        [
          chineseDay, (d) => {
            const lunar = Lunar.fromDate(d);
            return lunar.getDay() === 1
              ? toLocaleString(lunar, local, {year: 'ganzhi', month: 'normal', day: 'normal'})
              : toLocaleString(lunar, local, {month: 'normal', day: 'normal'});
          }
        ]
      ],
      [
        2,
        [
          chineseMonth, (d) => {
            const lunar = Lunar.fromDate(d);
            return toLocaleString(lunar, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true });
          }
        ]
      ],
      [
        4,
        [
          chineseMonth, (d) => {
            const lunar = Lunar.fromDate(d);
            const startOfTheYear = lunar.getMonth() === 1 && lunar.getDay() === 1;
            return startOfTheYear
              ? toLocaleString(lunar, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal', monthShengXiao: true })
              : toLocaleString(lunar, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal'});
          },
        ]
      ],
      [
        8, 
        [
          chineseMonth, (d) => {
            const lunar = Lunar.fromDate(d);
            const startOfTheYear = lunar.getMonth() === 1 && lunar.getDay() === 1;
            return startOfTheYear
              ? toLocaleString(lunar, local, {year: 'ganzhi', yearShengXiao: true, month: 'normal'})
              : toLocaleString(lunar, local, {year: 'ganzhi', month: 'normal'});
          },
        ]
      ],
      [128, [chineseYear, (d) => toLocaleString(Lunar.fromDate(d), local, {year: 'ganzhi'})]],
      [512, [chineseYear.every(5), (d) => toLocaleString(Lunar.fromDate(d), local, {year: 'ganzhi'})]],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256) * 5), (d) => toLocaleString(Lunar.fromDate(d), local, {year: 'ganzhi'})]]
    ]
  }
};

export const dailyAxis = {
  name: "chinese-daily",
  height: 15,
  isGrid: false,
  class: 'daily',
  domain: limitedDomain,
  map: (hoursPerPixel, local)=>{
    return [
      [0.0625, [d3.timeHour.every(2), (d) => toLocaleString(Lunar.fromDate(d), local, {hour: 'ganzhi'})]],
      [0.125, [d3.timeHour.every(2), ""]],
      [0.25, [d3.timeHour.every(6), ""]],
      [0.5, [chineseDay, (d) => toLocaleString(Lunar.fromDate(d), local, {day: 'ganzhi'})]],
      [8, [chineseDay, ""]],
      [16, [chineseMonth, (d) => toLocaleString(Lunar.fromDate(d), local, {month: 'ganzhi'})]],
      [32, [chineseMonth.every(3), "Q%q"]],
      [128, [chineseMonth.every(6), (d, i) => d.getMonth() < 6 ? "上半年" : "下半年"]],
      [256, [chineseYear, (d) => toLocaleString(Lunar.fromDate(d), local, {year: 'ganzhi'})]],
      [512, [chineseYear, ""]],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256)), (d) => toLocaleString(Lunar.fromDate(d), local, {year: 'ganzhi'})]]
    ]
  }
};

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
      [1, [chineseDay, ""]],
      [8, [chineseDay.filter(d => Lunar.fromDate(d).getDay() === 15 || Lunar.fromDate(d).getDay() === 1 ), ""]],
      [24, [chineseMonth, ""]],
      [64, [chineseMonth.every(6), ""]]
      ]
  }
};

export const yearlyGrid = {
  name: "chinese-yearly-grid",
  height: -1,
  isGrid: true,
  class: 'yearly-grid',
  domain: limitedDomain,
  map: (hoursPerPixel, local)=>{
    return [
      [0.125, [chineseDay, ""]],
      [8, [chineseMonth, ""]],
      [64, [chineseYear, ""]],
      [128, [chineseYear.every(2), ""]],
      [Infinity, [chineseYear.every(Math.round(hoursPerPixel / 256) * 5), ""]]
    ]
  }
};