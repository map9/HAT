import { ChineseCalendar, getSexagenaryYear } from '../src/index.js';
import fs from 'fs';

/**
 * 公历-农历年转换
 *
 * 测试策略：
 * 1. 使用 exportYear 的 JSON 输出作为基准数据
 * 2. 获取-760 ～ 2025年的 公历年 - 农历年 的年对应数据
 *
 */
const DEFAULT_REGION = 'default';
// 年份范围常量
const MIN_YEAR = -721;
const MAX_YEAR = 2200;

let calendar = new ChineseCalendar({lng: 'zh-Hant'});

// 天干地支名称（用于输出）
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 格式化日期输出
 */
function formatGregorianDate(date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * 格式化农历日期输出
 */
function formatChineseDate(year, month, day, isLeap) {
  return `${year}年${isLeap ? '闰' : ''}${month}月${day}日`;
}

/**
 * 格式化干支输出
 */
function formatGanzhi(ganzhi) {
  if (!ganzhi || ganzhi.length !== 2) return 'N/A';
  return ganNames[ganzhi[0]] + zhiNames[ganzhi[1]];
}

/**
 * 测试单个年份
 */
function testYear(year) {
  let jsonOutput;
  try {
    jsonOutput = calendar.exportYear(year, null, 'json');
  } catch (e) {
    console.error(`✗ 无法导出 ${year} 年数据:`, e.message);
    return;
  }

  let yearData;
  try {
    yearData = JSON.parse(jsonOutput);
  } catch (e) {
    console.error(`✗ 无法解析 ${year} 年 JSON 数据:`, e.message);
    return;
  }

  let cyearInfos = []
  for (let cyear of yearData.cyears) {
    cyearInfos.push({ ganzhi: cyear, startMonth: null, endMonth: null })
  }
  
  let startYearIndex = -1;
  const months = yearData.months;
  for(let month of months) {
    for(let chineseMonth of month.chineseMonths) {
      if (startYearIndex === -1)
        startYearIndex = chineseMonth.yearIndex;

      let yearIndex = chineseMonth.yearIndex - startYearIndex;
      if (cyearInfos[yearIndex].startMonth === null) {
        cyearInfos[yearIndex].startMonth = month.month + 1
        cyearInfos[yearIndex].endMonth = month.month + 1
      } else {
        cyearInfos[yearIndex].endMonth = month.month + 1
      }
    }
  }

  let ganzhi = getSexagenaryYear(year);
  let ouputStr = `公历: ${year}, 农历干支: ${formatGanzhi(ganzhi)}。`
  for (let i = 0; i < cyearInfos.length; i ++) {
    if (i == 0) {
      ouputStr += `${i + 1}, ${formatGanzhi(cyearInfos[i].ganzhi)}, [${cyearInfos[i].startMonth}, `
    }
    
    if (i > 0 && i <= cyearInfos.length - 1) {
      ouputStr += `${yearData.cdates[i - 1].month}.${yearData.cdates[i - 1].day}]; ${i + 1}, ${formatGanzhi(cyearInfos[i].ganzhi)}, [${yearData.cdates[i - 1].month}.${yearData.cdates[i - 1].day}, `
    }
  }
  ouputStr += ` ${cyearInfos[cyearInfos.length - 1].endMonth}]`
  
  console.log(ouputStr);
}

/**
 * 可靠的公元前日期格式化函数（UTC时间）
 */
function formatBCDate(date, utc = false) {
  // 1. 获取UTC日期组件，避免时区偏差
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1; // 0→11 转为 1→12
  const day = utc ? date.getUTCDate() : date.getDate();

  // 2. 处理公元前/公元后年份
  let yearStr;
  if (year <= 0) {
    // 负年份→公元前：-721 → 公元前722年
    yearStr = `公元前${Math.abs(year) + 1}(${year})年`;
  } else {
    yearStr = `公元${year}年`;
  }

  // 3. 拼接最终格式（可按需补零，如改为 `${String(month).padStart(2, '0')}`）
  return `${yearStr}${month}月${day}日`;
}

function testChineseYearStart(date) {
  try {
    const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
    if (!chineseDate) {
      throw new Error('failed to convert date', date);
    }

    // 边界检查：确保年份在有效范围内
    if (chineseDate.year < MIN_YEAR) {
      chineseDate.year = MIN_YEAR;
    } else if (chineseDate.year > MAX_YEAR) {
      chineseDate.year = MAX_YEAR;
    }

    // 获取农历年第一天的公历日期
    const yearStart = calendar.getChineseYearStart(chineseDate.year, DEFAULT_REGION);
    if (yearStart) {
      console.log(`${formatBCDate(date)} -> ${formatBCDate(yearStart)}`);
    }
  } catch (e) {
    console.error('testChineseYearStart error:', e, date);
  }
}

function testChineseYearMonthInfo(date) {
  try {
    const chineseDate = calendar.getChineseDateFromGregorian(date, DEFAULT_REGION);
    if (!chineseDate) {
      throw new Error('failed to convert date', date);
    }

    const monthsInfo = calendar.getChineseYearMonthInfo(chineseDate.year, DEFAULT_REGION);
    if (!monthsInfo) {
      throw new Error('failed to getChineseYearMonthInfo');
    }

    console.log(`${formatBCDate(date)} -> ${JSON.stringify(monthsInfo)}`);
  } catch (e) {
    console.error('testChineseYearMonthInfo error:', e, date);
  }
}

function dumpAllChineseYearMonthInfo() {
  const results = [];
  for (let year = MIN_YEAR; year < MAX_YEAR; year++) {
    try {
      //console.log(`Processing year ${year}...`);
      const monthsInfo = calendar.getChineseYearMonthInfo(year, DEFAULT_REGION);
      /*
      if (monthsInfo.length < 12 || monthsInfo.length > 13) {
        console.log(`  month count for year ${year} is: ${monthsInfo.length}.`);
        console.log(JSON.stringify(monthsInfo, null, 2));
      }
      */
      for (let monthInfo of monthsInfo) {
        if (!monthInfo.date) {
          console.log(`  month date missing for year ${year}, month ${monthInfo.monthNum}, isLeap: ${monthInfo.isLeap}`);
        }

        if (
          (monthInfo.month.includes('大') && monthInfo.nDays < 30) ||
          (monthInfo.month.includes('小') && monthInfo.nDays > 29)
        ) {
          console.log(`  month days error for year ${year}, month ${monthInfo.monthNum}，${monthInfo.month}, nDays: ${monthInfo.nDays}`);
        }

        if (monthInfo.nDays <= 0) {
          console.log(`  month days invalid for year ${year}, month ${monthInfo.monthNum}, isLeap: ${monthInfo.isLeap}, nDays: ${monthInfo.nDays}`);
        }
      }
      results.push({ year, monthsInfo });
    } catch (e) {
      console.error(`Error processing year ${year}:`, e);
    }
  }
  fs.writeFileSync('chinese_year_month_info.json', JSON.stringify(results, null, 2), 'utf-8');
}

/*
for (let year = -721; year <= 2025; year++) {
  testYear(year);
}

const date = new Date();
date.setFullYear(-721, 0, 15);

//date.setFullYear(-720, 0, 3);
//date.setFullYear(-719, 0, 22);
//date.setFullYear(-696, 0, 5);

// 公历: -671, 农历干支: 己酉。1, 戊申, [1, 1.3]; 2, 己酉, [1.3, 12.23]; 3, 庚戌, [12.23,  12]
// 公历: -670, 农历干支: 庚戌。1, 庚戌, [1,  12]
date.setFullYear(-670, 0, 5);

// 公历: -105, 农历干支: 乙亥。1, 乙亥, [1, 11.8]; 2, 丙子, [11.8,  12]
// 公历: -104, 农历干支: 丙子。1, 丙子, [1, 11.26]; 2, 丁丑, [11.26,  12]
// 公历: -103, 农历干支: 丁丑。1, 丁丑, [1,  12]
//date.setFullYear(-105, 10, 3);

// 公历: 689, 农历干支: 己丑。1, 戊子, [1, 1.27]; 2, 己丑, [1.27, 12.18]; 3, 庚寅, [12.18,  12]
//date.setFullYear(689, 0, 30);

//testChineseYearStart(date);
testChineseYearMonthInfo(date);
*/

//dumpAllChineseYearMonthInfo();
//const monthsInfo = calendar.getChineseYearMonthInfo(-710, DEFAULT_REGION);
//console.log(JSON.stringify(monthsInfo, null, 2));

function getDate(gYear, gMonth, gDay) {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0, 0); // 临时初始化为2000年1月1日
  date.setFullYear(gYear);
  date.setMonth(gMonth - 1);
  date.setDate(gDay);
  date.setHours(0, 0, 0, 0);
  return date;
}

const date = getDate(-106, 10, 20)
const lunar = calendar.getChineseDateFromGregorian(date)
console.log(lunar)