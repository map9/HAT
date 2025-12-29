import { ChineseCalendar } from '../src/index.js';
import fs from 'fs';

/**
 * 测试公历-农历转换函数的准确性
 *
 * 测试策略：
 * 1. 使用 exportYear 的 JSON 输出作为基准数据（参考实现）
 * 2. 对每一天调用 getChineseDateFromGregorian，验证结果是否与基准数据一致
 * 3. 使用验证正确的农历数据，调用 getGregorianFromChineseDate 反向转换，验证是否能还原
 *
 * 测试年份：
 * -300, -103, 23, 237, 700, 762, 1582, 2000
 */

let cc = new ChineseCalendar({lng: 'zh-Hant'});

// 天干地支名称（用于输出）
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 测试年份配置
const testYears = [
  { year: -300, desc: '先秦时期，古代历法' },
  { year: -103, desc: '汉武帝太初元年前后' },
  { year: 23, desc: '新莽时期' },
  { year: 237, desc: '三国时期' },
  { year: 700, desc: '唐朝武则天时期' },
  { year: 762, desc: '唐朝安史之乱时期' },
  { year: 1582, desc: '公历改革年，10月跳日' },
  { year: 2000, desc: '现代历法，闰年' },
  { year: -301, desc: '先秦时期，古代历法' },
  { year: -104, desc: '汉武帝太初元年前后' },
  { year: 22, desc: '新莽时期' },
  { year: 238, desc: '三国时期' },
  { year: 701, desc: '唐朝武则天时期' },
  { year: 760, desc: '唐朝安史之乱时期' },
  { year: 1581, desc: '公历改革年，10月跳日' },
  { year: 2006, desc: '现代历法，闰年' }
];

// 测试结果统计
let globalStats = {
  totalYears: 0,
  totalDays: 0,
  g2cPassed: 0,
  g2cFailed: 0,
  c2gPassed: 0,
  c2gFailed: 0,
  errors: []
};

/**
 * 比较两个日期是否相同
 */
function isSameDate(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

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
function testYear(yearConfig) {
  const { year, desc } = yearConfig;

  console.log('\n' + '='.repeat(80));
  console.log(`测试年份: ${year}年 (${desc})`);
  console.log('='.repeat(80));

  // 导出年份数据作为基准
  let jsonOutput;
  try {
    jsonOutput = cc.exportYear(year, null, 'json');
  } catch (e) {
    console.error(`✗ 无法导出 ${year} 年数据:`, e.message);
    globalStats.errors.push({ year, error: '导出失败', detail: e.message });
    return;
  }

  let yearData;
  try {
    yearData = JSON.parse(jsonOutput);
  } catch (e) {
    console.error(`✗ 无法解析 ${year} 年 JSON 数据:`, e.message);
    globalStats.errors.push({ year, error: 'JSON解析失败', detail: e.message });
    return;
  }

  // 统计本年度测试结果
  let yearStats = {
    year: year,
    totalDays: 0,
    g2cPassed: 0,
    g2cFailed: 0,
    g2cErrors: [],
    c2gPassed: 0,
    c2gFailed: 0,
    c2gErrors: []
  };

  // 遍历每个月
  for (let monthData of yearData.months) {
    const month = monthData.month; // 0-11

    // 遍历每一天
    for (let dayData of monthData.days) {
      yearStats.totalDays++;

      const gDay = dayData.day;
      const gMonth = month;
      const gYear = year;

      // 构造公历日期对象
      // 注意：
      // 1. 对于0-99年份，需要使用setFullYear来避免被解析为19xx或20xx年
      // 2. 按照 setFullYear -> setMonth -> setDate -> setHours 的顺序设置
      // 3. 如果日期不存在（如-300年2月29日），exportYear的数据认为存在，但JS Date会自动调整
      //    这是历史历法数据与现代闰年规则不一致导致的，我们信任历史数据
      const gregorianDate = new Date(2000, 0, 1); // 先用一个正常日期初始化
      gregorianDate.setFullYear(gYear);
      gregorianDate.setMonth(gMonth);
      gregorianDate.setDate(gDay);
      gregorianDate.setHours(0, 0, 0, 0);

      // 从基准数据中提取期望的农历数据
      const expectedCYear = yearData.cyears[dayData.chineseDate.monthOrder !== undefined ?
                           monthData.chineseMonths.find(m => m.monthNum === dayData.chineseDate.monthNum)?.yearIndex || 0 : 0];
      const expectedCMonth = Math.abs(dayData.chineseDate.monthNum);
      const expectedCDay = dayData.chineseDate.day;
      const expectedIsLeap = dayData.chineseDate.monthNum < 0;
      const expectedGanzhiDay = dayData.sexagenary.day;

      // ========== 测试1: 公历转农历 ==========
      let chineseResult;
      try {
        chineseResult = cc.getChineseDateFromGregorian(gregorianDate);

        if (!chineseResult) {
          yearStats.g2cFailed++;
          yearStats.g2cErrors.push({
            gDate: formatGregorianDate(gregorianDate),
            error: '返回null'
          });
          continue;
        }

        // 验证结果
        let hasError = false;
        let errorDetails = [];

        if (chineseResult.month !== expectedCMonth) {
          hasError = true;
          errorDetails.push(`月份不符: 期望${expectedCMonth}, 实际${chineseResult.month}`);
        }

        if (chineseResult.day !== expectedCDay) {
          hasError = true;
          errorDetails.push(`日期不符: 期望${expectedCDay}, 实际${chineseResult.day}`);
        }

        if (chineseResult.isLeap !== expectedIsLeap) {
          hasError = true;
          errorDetails.push(`闰月标记不符: 期望${expectedIsLeap}, 实际${chineseResult.isLeap}`);
        }

        if (chineseResult.ganzhiDay[0] !== expectedGanzhiDay[0] ||
            chineseResult.ganzhiDay[1] !== expectedGanzhiDay[1]) {
          hasError = true;
          errorDetails.push(`干支不符: 期望${formatGanzhi(expectedGanzhiDay)}, 实际${formatGanzhi(chineseResult.ganzhiDay)}`);
        }

        if (hasError) {
          yearStats.g2cFailed++;
          yearStats.g2cErrors.push({
            gDate: `${gYear}-${gMonth + 1}-${gDay}`,
            jsgDate: formatGregorianDate(gregorianDate),
            expected: formatChineseDate(chineseResult.year, expectedCMonth, expectedCDay, expectedIsLeap) + ` ${formatGanzhi(expectedGanzhiDay)}`,
            actual: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap) + ` ${formatGanzhi(chineseResult.ganzhiDay)}`,
            errors: errorDetails
          });
        } else {
          yearStats.g2cPassed++;
        }

      } catch (e) {
        yearStats.g2cFailed++;
        yearStats.g2cErrors.push({
          gDate: `${gYear}-${gMonth + 1}-${gDay}`,
          jsgDate: formatGregorianDate(gregorianDate),
          error: `异常: ${e.message}`
        });
        continue;
      }

      // ========== 测试2: 农历转公历（反向验证）==========
      if (chineseResult) {
        try {
          // 测试2.1: 使用 jd 参数进行精确匹配
          const gregorianResultWithJd = cc.getGregorianFromChineseDate(
            chineseResult.year,
            chineseResult.month,
            chineseResult.day,
            chineseResult.isLeap,
            chineseResult.ganzhiMonth,  // 传递干支月份以区分重复月份（如762年的两个4月）
            'default',
            chineseResult.jd  // 使用儒略日进行精确匹配
          );

          if (!gregorianResultWithJd) {
            yearStats.c2gFailed++;
            yearStats.c2gErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '使用jd参数',
              jd: chineseResult.jd,
              error: '返回null'
            });
          } else if (!isSameDate(gregorianResultWithJd, gregorianDate)) {
            yearStats.c2gFailed++;
            yearStats.c2gErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '使用jd参数',
              jd: chineseResult.jd,
              expected: formatGregorianDate(gregorianDate),
              actual: formatGregorianDate(gregorianResultWithJd)
            });
          } else {
            yearStats.c2gPassed++;
          }

          // 测试2.2: 不使用 jd 参数，返回所有可能的日期数组，只要有一个匹配即为正确
          const gregorianResultsWithoutJd = cc.getGregorianFromChineseDate(
            chineseResult.year,
            chineseResult.month,
            chineseResult.day,
            chineseResult.isLeap,
            chineseResult.ganzhiMonth,  // 传递干支月份以区分重复月份（如762年的两个4月）
            'default',
            null  // 不使用 jd，返回所有可能的日期
          );

          if (!gregorianResultsWithoutJd) {
            yearStats.c2gFailed++;
            yearStats.c2gErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '不使用jd参数',
              error: '返回null'
            });
          } else if (!Array.isArray(gregorianResultsWithoutJd)) {
            // 如果返回的不是数组，说明实现有问题
            yearStats.c2gFailed++;
            yearStats.c2gErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '不使用jd参数',
              error: '返回值不是数组'
            });
          } else {
            // 检查数组中是否有任何一个日期与期望日期匹配
            const hasMatch = gregorianResultsWithoutJd.some(date => isSameDate(date, gregorianDate));
            if (hasMatch) {
              yearStats.c2gPassed++;
            } else {
              yearStats.c2gFailed++;
              yearStats.c2gErrors.push({
                cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
                testType: '不使用jd参数',
                expected: formatGregorianDate(gregorianDate),
                actual: gregorianResultsWithoutJd.map(d => formatGregorianDate(d)).join(', '),
                count: gregorianResultsWithoutJd.length
              });
            }
          }

        } catch (e) {
          yearStats.c2gFailed++;
          yearStats.c2gErrors.push({
            cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
            error: `异常: ${e.message}`
          });
        }
      }
    }
  }

  // 输出本年度测试结果
  console.log(`\n【1】公历转农历测试 (getChineseDateFromGregorian)`);
  console.log(`  总天数: ${yearStats.totalDays}`);
  console.log(`  通过: ${yearStats.g2cPassed} (${(yearStats.g2cPassed / yearStats.totalDays * 100).toFixed(2)}%)`);
  console.log(`  失败: ${yearStats.g2cFailed}`);

  if (yearStats.g2cErrors.length > 0) {
    console.log(`\n  失败详情（前10条）:`);
    yearStats.g2cErrors.slice(0, 10).forEach(err => {
      console.log(`    公历: ${err.gDate}`);
      if (err.error) {
        console.log(`      错误: ${err.error}`);
      } else {
        console.log(`      期望: ${err.expected}`);
        console.log(`      实际: ${err.actual}`);
        console.log(`      详情: ${err.errors.join('; ')}`);
      }
    });
    if (yearStats.g2cErrors.length > 10) {
      console.log(`    ... 还有 ${yearStats.g2cErrors.length - 10} 条错误`);
    }
  }

  console.log(`\n【2】农历转公历测试 (getGregorianFromChineseDate)`);
  console.log(`  总转换: ${yearStats.totalDays}`);
  console.log(`  通过: ${yearStats.c2gPassed} (${(yearStats.c2gPassed / yearStats.totalDays * 100).toFixed(2)}%)`);
  console.log(`  失败: ${yearStats.c2gFailed}`);

  if (yearStats.c2gErrors.length > 0) {
    console.log(`\n  失败详情（前10条）:`);
    yearStats.c2gErrors.slice(0, 10).forEach(err => {
      console.log(`    农历: ${err.cDate}`);
      if (err.error) {
        console.log(`      错误: ${err.error}`);
      } else {
        console.log(`      期望: ${err.expected}`);
        console.log(`      实际: ${err.actual}`);
      }
    });
    if (yearStats.c2gErrors.length > 10) {
      console.log(`    ... 还有 ${yearStats.c2gErrors.length - 10} 条错误`);
    }
  }

  // 更新全局统计
  globalStats.totalYears++;
  globalStats.totalDays += yearStats.totalDays;
  globalStats.g2cPassed += yearStats.g2cPassed;
  globalStats.g2cFailed += yearStats.g2cFailed;
  globalStats.c2gPassed += yearStats.c2gPassed;
  globalStats.c2gFailed += yearStats.c2gFailed;

  // 保存详细错误到文件
  if (yearStats.g2cErrors.length > 0 || yearStats.c2gErrors.length > 0) {
    const errorLog = {
      year: year,
      description: desc,
      g2cErrors: yearStats.g2cErrors,
      c2gErrors: yearStats.c2gErrors
    };
    fs.writeFileSync(
      `./test-conversion-errors-${year}.json`,
      JSON.stringify(errorLog, null, 2),
      'utf8'
    );
    console.log(`\n  详细错误日志已保存到: test-conversion-errors-${year}.json`);
  }
}

// 执行测试
console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          公历-农历转换函数准确性测试                                           ║');
console.log('║  测试函数: getChineseDateFromGregorian & getGregorianFromChineseDate          ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

for (let yearConfig of testYears) {
  testYear(yearConfig);
}

// 输出总体统计
console.log('\n\n' + '='.repeat(80));
console.log('总体测试统计');
console.log('='.repeat(80));
console.log(`测试年份数: ${globalStats.totalYears}`);
console.log(`测试总天数: ${globalStats.totalDays}`);
console.log();
console.log(`【公历转农历】`);
console.log(`  通过: ${globalStats.g2cPassed} / ${globalStats.totalDays} (${(globalStats.g2cPassed / globalStats.totalDays * 100).toFixed(2)}%)`);
console.log(`  失败: ${globalStats.g2cFailed}`);
console.log();
console.log(`【农历转公历】`);
console.log(`  通过: ${globalStats.c2gPassed} / ${globalStats.totalDays} (${(globalStats.c2gPassed / globalStats.totalDays * 100).toFixed(2)}%)`);
console.log(`  失败: ${globalStats.c2gFailed}`);
console.log();

if (globalStats.g2cFailed === 0 && globalStats.c2gFailed === 0) {
  console.log('✓✓✓ 所有测试通过！转换函数完全准确！✓✓✓');
} else {
  console.log(`✗ 发现错误，请查看详细日志文件`);
}
console.log('='.repeat(80));
console.log('\n测试完成！');