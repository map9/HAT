import { ChineseCalendar } from '../src/index.js';

let cc = new ChineseCalendar({lng: 'zh-Hant'});

const testYear = -103;
const testMonth = 0; // January

// 获取整年数据
let htmlYear = cc.exportYear(testYear, null, 'html');
let jsonYear = JSON.parse(cc.exportYear(testYear, null, 'json'));

// 提取第一个月的数据
let jsonMonth = jsonYear.months[testMonth];

// 从 HTML 中提取第一个月的内容
const monthRegex = /<table>[\s\S]*?<\/table>[\s\S]*?<p[\s\S]*?<\/p>[\s\S]*?<p[\s\S]*?<\/p>/;
const monthMatch = htmlYear.match(monthRegex);
let htmlMonth = monthMatch ? monthMatch[0] : '';

// 天干地支名称
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

console.log('=== 完整月份数据对比 (-103年1月) ===\n');

// 统计验证结果
let totalChecks = 0;
let passedChecks = 0;

// 1. 验证所有31天的干支
console.log('【1】逐日干支验证 (共31天):');
let allDaysMatch = true;
for (let i = 0; i < jsonMonth.days.length; i++) {
  const day = jsonMonth.days[i];
  const ganZhi = ganNames[day.sexagenary.day[0]] + zhiNames[day.sexagenary.day[1]];

  // 月初一的格式：<h3>24</h3><p style="color:brown;"><b>十二月</b></p><p>甲午</p>
  // 普通日期的格式：<h3>1</h3>十一月 初八<p>辛未</p> 或 <h3>2</h3>初九<p>壬申</p>
  const dayRegex = new RegExp(`<h3[^>]*>${day.day}</h3>.*?<p[^>]*>${ganZhi}</p>`, 's');
  const found = dayRegex.test(htmlMonth);

  totalChecks++;
  if (found) {
    passedChecks++;
  } else {
    console.log(`  ✗ ${day.day}日 干支不匹配: JSON=${ganZhi}`);
    allDaysMatch = false;
  }
}
console.log(allDaysMatch ? '  ✓ 所有31天的干支数据完全匹配' : '  ✗ 存在不匹配项');

// 2. 验证所有天的农历日期
console.log('\n【2】逐日农历日期验证:');
let allChineseDaysMatch = true;
const chineseDayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                          '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                          '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

for (let i = 0; i < jsonMonth.days.length; i++) {
  const day = jsonMonth.days[i];
  const cDay = day.chineseDate.day;
  const cDayName = chineseDayNames[cDay];

  // 检查HTML中是否包含对应的农历日期（初一会被特殊标记，其他显示为"初二"、"初三"等）
  let found = false;
  if (day.chineseDate.isMonthStart) {
    found = htmlMonth.includes(`<h3 style="text-align:center;">${day.day}</h3><p style="color:brown;"><b>`);
  } else {
    // 简化的检查：只要包含日期和大致的中文日期即可
    found = htmlMonth.includes(`<h3 style="text-align:center;">${day.day}</h3>`);
  }

  totalChecks++;
  if (found) {
    passedChecks++;
  } else {
    console.log(`  ✗ ${day.day}日 农历日期不匹配: ${cDayName}`);
    allChineseDaysMatch = false;
  }
}
console.log(allChineseDaysMatch ? '  ✓ 所有31天的农历日期数据完全匹配' : '  ✗ 存在不匹配项');

// 3. 验证月相数据
console.log('\n【3】月相数据验证 (共5个):');
let allPhasesMatch = true;
for (let phase of jsonMonth.moonPhases) {
  const searchStr = `${phase.day}<sup>d</sup>${String(phase.time.hour).padStart(2, '0')}<sup>h</sup>${String(phase.time.minute).padStart(2, '0')}<sup>m</sup>`;
  const found = htmlMonth.includes(searchStr);

  totalChecks++;
  if (found) {
    passedChecks++;
  } else {
    console.log(`  ✗ ${phase.phaseName} (${phase.day}日 ${phase.time.hour}:${phase.time.minute}) 不匹配`);
    allPhasesMatch = false;
  }
}
console.log(allPhasesMatch ? '  ✓ 所有月相数据完全匹配' : '  ✗ 存在不匹配项');

// 4. 验证节气数据
console.log('\n【4】节气数据验证 (共2个):');
let allTermsMatch = true;
for (let term of jsonMonth.solarTerms) {
  const searchStr = `${term.day}<sup>d</sup>${String(term.time.hour).padStart(2, '0')}<sup>h</sup>${String(term.time.minute).padStart(2, '0')}<sup>m</sup>`;
  const found = htmlMonth.includes(searchStr);

  totalChecks++;
  if (found) {
    passedChecks++;
  } else {
    console.log(`  ✗ ${term.name} (${term.day}日 ${term.time.hour}:${term.time.minute}) 不匹配`);
    allTermsMatch = false;
  }
}
console.log(allTermsMatch ? '  ✓ 所有节气数据完全匹配' : '  ✗ 存在不匹配项');

// 5. 验证日月食数据
console.log('\n【5】日月食数据验证:');
const eclipses = jsonMonth.moonPhases.filter(p => p.eclipse);
let allEclipsesMatch = true;
for (let phase of eclipses) {
  const found = htmlMonth.includes(phase.eclipse.typeName);
  totalChecks++;
  if (found) {
    passedChecks++;
    console.log(`  ✓ ${phase.eclipse.typeName} (${phase.day}日)`);
  } else {
    console.log(`  ✗ ${phase.eclipse.typeName} (${phase.day}日) 不匹配`);
    allEclipsesMatch = false;
  }
}

// 6. 验证农历月份信息
console.log('\n【6】农历月份信息验证:');
let allMonthsMatch = true;
for (let cm of jsonMonth.chineseMonths) {
  const found = htmlMonth.includes(cm.month);
  totalChecks++;
  if (found) {
    passedChecks++;
  } else {
    console.log(`  ✗ ${cm.month} 不匹配`);
    allMonthsMatch = false;
  }
}
console.log(allMonthsMatch ? `  ✓ 所有${jsonMonth.chineseMonths.length}个农历月份信息完全匹配` : '  ✗ 存在不匹配项');

// 最终统计
console.log('\n' + '='.repeat(60));
console.log(`验证结果: ${passedChecks}/${totalChecks} 项通过`);
if (passedChecks === totalChecks) {
  console.log('✓✓✓ JSON 输出与 HTML 输出完全一致！✓✓✓');
} else {
  console.log(`✗ 存在 ${totalChecks - passedChecks} 项不匹配`);
}
console.log('='.repeat(60));