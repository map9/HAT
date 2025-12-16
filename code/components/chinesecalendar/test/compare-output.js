import { ChineseCalendar } from '../src/index.js';

let cc = new ChineseCalendar({lng: 'zh-Hant'});

// 获取同一年的 HTML 和 JSON 输出
let htmlOutput = cc.exportYear(-103, null, 'html');
let jsonOutput = cc.exportYear(-103, null, 'json');
let jsonData = JSON.parse(jsonOutput);

console.log('=== 对比年份 -103 年 1月的数据 ===\n');

// 从 HTML 中提取第一个月的关键信息用于对比
const month1 = jsonData.months[0];

console.log('JSON 月份信息：');
console.log('- 公历月份:', month1.month, month1.monthName);
console.log('- 包含农历月数:', month1.chineseMonths.length);
console.log('- 农历月份:');
month1.chineseMonths.forEach((cm, i) => {
  console.log(`  ${i + 1}. ${cm.month} (月序号: ${cm.monthNum}, 闰月: ${cm.isLeap})`);
});

console.log('\n- 天数:', month1.days.length);
console.log('- 第一天 (1月1日):');
const day1 = month1.days[0];
console.log(`  公历: ${day1.day}日, 星期${day1.dayOfWeek}`);
console.log(`  农历: ${day1.chineseDate.month} 初${day1.chineseDate.day}`);
console.log(`  日干支: [${day1.sexagenary.day[0]}, ${day1.sexagenary.day[1]}]`);
console.log(`  月干支: [${day1.sexagenary.month[0]}, ${day1.sexagenary.month[1]}]`);

console.log('\n- 第24天 (1月24日) - 农历十二月初一:');
const day24 = month1.days[23];
console.log(`  公历: ${day24.day}日, 星期${day24.dayOfWeek}`);
console.log(`  农历: ${day24.chineseDate.month} 初${day24.chineseDate.day}`);
console.log(`  是否月初一: ${day24.chineseDate.isMonthStart}`);
console.log(`  日干支: [${day24.sexagenary.day[0]}, ${day24.sexagenary.day[1]}]`);
console.log(`  月干支: [${day24.sexagenary.month[0]}, ${day24.sexagenary.month[1]}]`);

console.log('\n- 月相数量:', month1.moonPhases.length);
console.log('- 月相详情:');
month1.moonPhases.forEach(phase => {
  const eclipse = phase.eclipse ? ` (${phase.eclipse.typeName})` : '';
  console.log(`  ${phase.phaseName}: ${phase.day}日 ${phase.time.hour}:${phase.time.minute}${eclipse}`);
});

console.log('\n- 节气数量:', month1.solarTerms.length);
console.log('- 节气详情:');
month1.solarTerms.forEach(term => {
  console.log(`  ${term.name}: ${term.day}日 ${term.time.hour}:${term.time.minute}`);
});

// 检查 HTML 中是否包含这些关键信息
console.log('\n=== HTML 内容验证 ===\n');

// 检查月份名称
const hasMonth = htmlOutput.includes('1 月');
console.log('✓ HTML 包含 "1 月":', hasMonth);

// 检查农历月份
const hasCMonth1 = htmlOutput.includes('十一月大 (建庚子)');
const hasCMonth2 = htmlOutput.includes('十二月小 (建辛丑)');
console.log('✓ HTML 包含 "十一月大 (建庚子)":', hasCMonth1);
console.log('✓ HTML 包含 "十二月小 (建辛丑)":', hasCMonth2);

// 检查第一天的干支
const hasDay1Ganzhi = htmlOutput.includes('辛未');
console.log('✓ HTML 包含第1天干支 "辛未":', hasDay1Ganzhi);

// 检查第24天的农历日期（十二月初一）
const hasDay24 = htmlOutput.includes('<h3 style="text-align:center;">24</h3><p style="color:brown;"><b>十二月</b></p>');
console.log('✓ HTML 包含第24天标记为十二月初一:', hasDay24);

// 检查月相
const hasShangXian = htmlOutput.includes('[上弦] 1<sup>d</sup>04<sup>h</sup>39<sup>m</sup>');
const hasWang = htmlOutput.includes('[望] 8<sup>d</sup>23<sup>h</sup>52<sup>m</sup>');
const hasXiaXian = htmlOutput.includes('[下弦] 15<sup>d</sup>20<sup>h</sup>45<sup>m</sup>');
const hasShuo = htmlOutput.includes('[朔] 23<sup>d</sup>00<sup>h</sup>03<sup>m</sup>');
console.log('✓ HTML 包含上弦月相 (1日04:39):', hasShangXian);
console.log('✓ HTML 包含望月相 (8日23:52):', hasWang);
console.log('✓ HTML 包含下弦月相 (15日20:45):', hasXiaXian);
console.log('✓ HTML 包含朔月相 (23日00:03):', hasShuo);

// 检查日食月食
const hasLunarEclipse = htmlOutput.includes('半影月食');
const hasSolarEclipse = htmlOutput.includes('日環食');
console.log('✓ HTML 包含半影月食:', hasLunarEclipse);
console.log('✓ HTML 包含日環食:', hasSolarEclipse);

// 检查节气
const hasXiaoHan = htmlOutput.includes('[小寒] 7<sup>d</sup>14<sup>h</sup>28<sup>m</sup>');
const hasDaHan = htmlOutput.includes('[大寒] 22<sup>d</sup>10<sup>h</sup>45<sup>m</sup>');
console.log('✓ HTML 包含小寒节气 (7日14:28):', hasXiaoHan);
console.log('✓ HTML 包含大寒节气 (22日10:45):', hasDaHan);

console.log('\n=== 详细数据对比 ===\n');

// 对比干支数据
console.log('检查关键日期的干支:');
const checkDays = [0, 6, 7, 14, 22, 23, 30]; // 1日, 7日(小寒), 8日(望), 15日(下弦), 23日(朔), 24日(十二月初一), 31日(上弦)
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

checkDays.forEach(dayIndex => {
  const day = month1.days[dayIndex];
  const ganZhi = ganNames[day.sexagenary.day[0]] + zhiNames[day.sexagenary.day[1]];
  const hasGanZhi = htmlOutput.includes(`<h3 style="text-align:center;">${day.day}</h3>`) &&
                    htmlOutput.indexOf(`<h3 style="text-align:center;">${day.day}</h3>`) < htmlOutput.indexOf(`<p>${ganZhi}</p>`);
  console.log(`  ${day.day}日 - ${ganZhi}: ${hasGanZhi ? '✓' : '✗'}`);
});