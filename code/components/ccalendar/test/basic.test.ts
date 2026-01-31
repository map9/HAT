/**
 * 基础功能测试
 */

import { ChineseCalendar, CALENDAR_RANGE_MIN_YEAR, CALENDAR_RANGE_MAX_YEAR } from '../src/index.js';

// 创建日历实例
const calendar = new ChineseCalendar({ locale: 'zh-Hans' });

console.log('=== ccalendar 基础功能测试 ===\n');

// 测试 1: getChineseDateFromGregorian
console.log('1. 测试 getChineseDateFromGregorian');
const testDate1 = new Date(2024, 0, 1); // 2024年1月1日
const lunar1 = calendar.getChineseDateFromGregorian(testDate1);
console.log(`   公历 2024-01-01 => 农历:`, lunar1);
if (lunar1) {
  console.log(`   年: ${lunar1.year}, 月: ${lunar1.month}, 日: ${lunar1.day}, 闰月: ${lunar1.isLeap}`);
  console.log(`   干支年: ${lunar1.ganzhiYear}, 干支日: ${lunar1.ganzhiDay}`);
}

const testDate2 = new Date(2024, 1, 10); // 2024年2月10日（春节）
const lunar2 = calendar.getChineseDateFromGregorian(testDate2);
console.log(`   公历 2024-02-10 => 农历:`, lunar2);
if (lunar2) {
  console.log(`   年: ${lunar2.year}, 月: ${lunar2.month}, 日: ${lunar2.day}, 岁首: ${lunar2.isFirstMonth}`);
}

// 测试 2: getGregorianFromChineseDate
console.log('\n2. 测试 getGregorianFromChineseDate');
const gregorian1 = calendar.getGregorianFromChineseDate(2024, 1, 1, false); // 2024年正月初一
console.log(`   农历 2024年正月初一 => 公历:`, gregorian1);

const gregorian2 = calendar.getGregorianFromChineseDate(2023, 6, 15, true); // 2023年闰六月十五
console.log(`   农历 2023年闰六月十五 => 公历:`, gregorian2);

// 测试 3: getChineseYearStart
console.log('\n3. 测试 getChineseYearStart');
const yearStart2024 = calendar.getChineseYearStart(2024);
console.log(`   2024年岁首(春节): ${yearStart2024?.toISOString().slice(0, 10)}`);

const yearStart2023 = calendar.getChineseYearStart(2023);
console.log(`   2023年岁首(春节): ${yearStart2023?.toISOString().slice(0, 10)}`);

// 测试 4: getChineseYearMonthInfo
console.log('\n4. 测试 getChineseYearMonthInfo');
const monthInfo2024 = calendar.getChineseYearMonthInfo(2024);
if (monthInfo2024) {
  console.log(`   2024年农历共 ${monthInfo2024.length} 个月:`);
  monthInfo2024.forEach((m, i) => {
    console.log(`     ${i + 1}. ${m.month} - 起始日: ${m.date.toISOString().slice(0, 10)}, 天数: ${m.nDays}`);
  });
}

// 测试 5: lunarDateToString
console.log('\n5. 测试 lunarDateToString');
if (lunar2) {
  const str1 = calendar.lunarDateToString(lunar2, { year: 'short', month: 'short', day: 'short' });
  console.log(`   short格式: ${str1}`);

  const str2 = calendar.lunarDateToString(lunar2, { year: 'normal.ganZhi', month: 'normal', day: 'normal' });
  console.log(`   normal格式: ${str2}`);

  const str3 = calendar.lunarDateToString(lunar2, { year: 'full', month: 'full', day: 'full' });
  console.log(`   full格式: ${str3}`);
}

// 测试 6: 语言切换
console.log('\n6. 测试语言切换');
calendar.setLanguage('zh-Hant');
const lunarHant = calendar.getChineseDateFromGregorian(testDate2);
if (lunarHant) {
  const strHant = calendar.lunarDateToString(lunarHant, { year: 'short', month: 'short', day: 'short' });
  console.log(`   繁体中文: ${strHant}`);
}

calendar.setLanguage('en');
const lunarEn = calendar.getChineseDateFromGregorian(testDate2);
if (lunarEn) {
  const strEn = calendar.lunarDateToString(lunarEn, { year: 'short', month: 'short', day: 'short' });
  console.log(`   English: ${strEn}`);
}

// 测试 7: exportYear (JSON)
console.log('\n7. 测试 exportYear');
calendar.setLanguage('zh-Hans');
const yearJson = calendar.exportYear(2024);
if (yearJson) {
  const parsed = JSON.parse(yearJson);
  console.log(`   2024年日历导出成功`);
  console.log(`   包含 ${parsed.cyears.length} 个农历年`);
  console.log(`   干支年: ${parsed.cyears.map((c: number[]) => `[${c[0]},${c[1]}]`).join(', ')}`);
  console.log(`   包含 ${parsed.months.length} 个公历月`);
}

// 测试 8: 边界年份
console.log('\n8. 测试边界年份');
console.log(`   支持的年份范围: ${CALENDAR_RANGE_MIN_YEAR} ~ ${CALENDAR_RANGE_MAX_YEAR}`);

const ancientDate = new Date(-500, 5, 15); // 公元前500年6月15日
ancientDate.setFullYear(-500);
const lunarAncient = calendar.getChineseDateFromGregorian(ancientDate);
console.log(`   公元前500年6月15日 => 农历:`, lunarAncient ? `${lunarAncient.year}年${lunarAncient.month}月${lunarAncient.day}日` : 'null');

const futureDate = new Date(2100, 0, 1);
const lunarFuture = calendar.getChineseDateFromGregorian(futureDate);
console.log(`   2100年1月1日 => 农历:`, lunarFuture ? `${lunarFuture.year}年${lunarFuture.month}月${lunarFuture.day}日` : 'null');

console.log('\n=== 测试完成 ===');
