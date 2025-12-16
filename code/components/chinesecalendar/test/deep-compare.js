import { ChineseCalendar } from '../src/index.js';

let cc = new ChineseCalendar({lng: 'zh-Hant'});

// 获取同一年的 HTML 和 JSON 输出
const testYear = -103;
const testMonth = 0; // January

// 使用 exportYear 获取整年数据
let htmlYear = cc.exportYear(testYear, null, 'html');
let jsonYear = JSON.parse(cc.exportYear(testYear, null, 'json'));

// 提取第一个月的数据
let jsonMonth = jsonYear.months[testMonth];

// 从 HTML 中提取第一个月的内容
// 提取从第一个 <table> 到第一个月相段落 </p> 的内容
const monthRegex = /<table>[\s\S]*?<\/table>[\s\S]*?<p[\s\S]*?<\/p>[\s\S]*?<p[\s\S]*?<\/p>/;
const monthMatch = htmlYear.match(monthRegex);
let htmlMonth = monthMatch ? monthMatch[0] : '';

console.log('=== 深度对比：逐日数据验证 ===\n');
console.log(`测试月份: ${testYear} 年 ${testMonth + 1} 月\n`);

// 天干地支名称
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

console.log('JSON 输出验证:');
console.log('- 年份:', jsonMonth.year);
console.log('- 月份:', jsonMonth.month, jsonMonth.monthName);
console.log('- 农历月数:', jsonMonth.chineseMonths.length);
console.log('- 天数:', jsonMonth.days.length);
console.log('- 月相数:', jsonMonth.moonPhases.length);
console.log('- 节气数:', jsonMonth.solarTerms.length);

console.log('\n逐日干支对比 (前10天):');
console.log('日期 | JSON干支 | HTML预期 | 农历日');
console.log('-'.repeat(50));

for (let i = 0; i < Math.min(10, jsonMonth.days.length); i++) {
  const day = jsonMonth.days[i];
  const ganZhi = ganNames[day.sexagenary.day[0]] + zhiNames[day.sexagenary.day[1]];
  const chineseDay = day.chineseDate.day;

  // 检查HTML中是否有这个干支
  const dayRegex = new RegExp(`<h3[^>]*>${day.day}</h3>[^<]*(?:<p[^>]*>[^<]*</p>)?[^<]*<p>${ganZhi}</p>`, 's');
  const found = dayRegex.test(htmlMonth);

  console.log(`${day.day}日   | ${ganZhi}     | ${found ? '✓' : '✗'}       | 初${chineseDay}`);
}

console.log('\n月相对比:');
console.log('类型   | 日期 | 时间     | JSON | HTML');
console.log('-'.repeat(60));

jsonMonth.moonPhases.forEach(phase => {
  const timeStr = `${phase.time.hour}:${String(phase.time.minute).padStart(2, '0')}`;
  const searchStr = `${phase.day}<sup>d</sup>${String(phase.time.hour).padStart(2, '0')}<sup>h</sup>${String(phase.time.minute).padStart(2, '0')}<sup>m</sup>`;
  const found = htmlMonth.includes(searchStr);

  console.log(`${phase.phaseName} | ${phase.day}日  | ${timeStr} | ✓    | ${found ? '✓' : '✗'}`);
});

console.log('\n节气对比:');
console.log('节气   | 日期 | 时间     | JSON | HTML');
console.log('-'.repeat(60));

jsonMonth.solarTerms.forEach(term => {
  const timeStr = `${term.time.hour}:${String(term.time.minute).padStart(2, '0')}`;
  const searchStr = `${term.day}<sup>d</sup>${String(term.time.hour).padStart(2, '0')}<sup>h</sup>${String(term.time.minute).padStart(2, '0')}<sup>m</sup>`;
  const found = htmlMonth.includes(searchStr);

  console.log(`${term.name} | ${term.day}日  | ${timeStr} | ✓    | ${found ? '✓' : '✗'}`);
});

// 验证农历月初一的标记
console.log('\n农历月初一标记验证:');
const monthStarts = jsonMonth.days.filter(d => d.chineseDate.isMonthStart);
console.log(`找到 ${monthStarts.length} 个月初一:`);
monthStarts.forEach(day => {
  console.log(`  - ${day.day}日: ${day.chineseDate.month}`);
  const htmlCheck = htmlMonth.includes(`<h3 style="text-align:center;">${day.day}</h3><p style="color:brown;"><b>`);
  console.log(`    HTML 标记: ${htmlCheck ? '✓' : '✗'}`);
});

// 验证星期几
console.log('\n星期验证 (前7天):');
const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
for (let i = 0; i < 7; i++) {
  const day = jsonMonth.days[i];
  console.log(`  ${day.day}日: 星期${weekNames[day.dayOfWeek]} (${day.dayOfWeek})`);
}

console.log('\n=== 对比完成 ===');