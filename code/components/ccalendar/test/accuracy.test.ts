/**
 * ccalendar 准确性测试
 *
 * 以 chinesecalendar（旧实现）的 exportYear JSON 输出作为基准数据，
 * 对 ccalendar（新实现）的核心函数进行准确性验证。
 *
 * 测试内容：
 * 1. getChineseDateFromGregorian - 逐日全面对比
 * 2. getGregorianFromChineseDate - 反向验证（使用jd + 不使用jd）
 * 3. getChineseYearStart - 部分对比
 * 4. getChineseYearMonthInfo - 部分对比
 *
 * 运行方式：
 *   npx tsx test/accuracy.test.ts
 */

import { ChineseCalendar } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFERENCE_DIR = path.join(__dirname, 'reference');

const calendar = new ChineseCalendar({ locale: 'zh-Hant' });

// 天干地支名称（用于输出）
const ganNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const zhiNames = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// ==================== 测试年份配置 ====================

const conversionTestYears = [
  { year: -301, desc: '先秦古代历法' },
  { year: -300, desc: '先秦古代历法' },
  { year: -105, desc: '颛顼历，岁首=十月' },
  { year: -104, desc: '颛顼历→太初历过渡年' },
  { year: -103, desc: '太初历第一年，岁首=正月' },
  { year: -102, desc: '太初历第二年' },
  { year: 22,   desc: '新莽前一年' },
  { year: 23,   desc: '新莽时期' },
  { year: 237,  desc: '三国时期' },
  { year: 238,  desc: '三国后一年' },
  { year: 689,  desc: '武周前一年，岁首=正月' },
  { year: 690,  desc: '武周开始，岁首=十一月' },
  { year: 700,  desc: '武周最后一年，岁首=十一月' },
  { year: 701,  desc: '恢复，岁首=正月' },
  { year: 760,  desc: '安史之乱前' },
  { year: 762,  desc: '唐朝重复月份' },
  { year: 1581, desc: '公历改革前一年' },
  { year: 1582, desc: '公历改革年，10月跳日' },
  { year: 2000, desc: '现代闰年' },
  { year: 2024, desc: '现代' }
];

// ==================== 工具函数 ====================

function formatGanzhi(ganzhi: number[] | string | null | undefined): string {
  if (!ganzhi || typeof ganzhi === 'string' || ganzhi.length !== 2) return 'N/A';
  return ganNames[ganzhi[0]] + zhiNames[ganzhi[1]];
}

function formatGregorianDate(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

function formatChineseDate(year: number, month: number, day: number, isLeap: boolean): string {
  return `${year}年${isLeap ? '闰' : ''}${month}月${day}日`;
}

function isSameDate(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function makeDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1, 0, 0, 0, 0);
  date.setFullYear(year);
  date.setMonth(month);
  date.setDate(day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ==================== 全局统计 ====================

interface ErrorInfo {
  gDate?: string;
  jsgDate?: string;
  cDate?: string;
  expected?: string;
  actual?: string;
  error?: string;
  errors?: string[];
  testType?: string;
  jd?: number;
  count?: number;
}

let globalStats = {
  totalYears: 0,
  totalDays: 0,
  g2cPassed: 0,
  g2cFailed: 0,
  c2gWithJdPassed: 0,
  c2gWithJdFailed: 0,
  c2gWithoutJdPassed: 0,
  c2gWithoutJdFailed: 0,
  yearStartPassed: 0,
  yearStartFailed: 0,
  monthInfoPassed: 0,
  monthInfoFailed: 0,
  exportYearPassed: 0,
  exportYearFailed: 0
};

// ==================== 测试1 & 测试2: getChineseDateFromGregorian & getGregorianFromChineseDate ====================

function testConversionYear(yearConfig: { year: number; desc: string }) {
  const { year, desc } = yearConfig;

  console.log('\n' + '='.repeat(80));
  console.log(`测试年份: ${year}年 (${desc})`);
  console.log('='.repeat(80));

  // 加载基准数据
  const refFile = path.join(REFERENCE_DIR, `exportYear_${year}.json`);
  if (!fs.existsSync(refFile)) {
    console.error(`  ✗ 基准数据文件不存在: ${refFile}`);
    return;
  }

  const yearData = JSON.parse(fs.readFileSync(refFile, 'utf-8'));

  let yearStats = {
    totalDays: 0,
    g2cPassed: 0,
    g2cFailed: 0,
    g2cErrors: [] as ErrorInfo[],
    c2gWithJdPassed: 0,
    c2gWithJdFailed: 0,
    c2gWithJdErrors: [] as ErrorInfo[],
    c2gWithoutJdPassed: 0,
    c2gWithoutJdFailed: 0,
    c2gWithoutJdErrors: [] as ErrorInfo[]
  };

  // 遍历每个月
  for (const monthData of yearData.months) {
    const gMonth = monthData.month; // 0-11

    // 遍历每一天
    for (const dayData of monthData.days) {
      yearStats.totalDays++;

      const gDay = dayData.day;
      const gregorianDate = makeDate(year, gMonth, gDay);

      // 基准数据的农历信息
      const expectedCMonth = Math.abs(dayData.chineseDate.monthNum);
      const expectedCDay = dayData.chineseDate.day;
      const expectedIsLeap = dayData.chineseDate.monthNum < 0;
      const expectedGanzhiDay = dayData.sexagenary.day;
      const expectedIsFirstMonth = dayData.chineseDate.isFirstMonth;

      // ========== 测试1: 公历转农历 ==========
      let chineseResult: ReturnType<typeof calendar.getChineseDateFromGregorian>;
      try {
        chineseResult = calendar.getChineseDateFromGregorian(gregorianDate);

        if (!chineseResult) {
          yearStats.g2cFailed++;
          yearStats.g2cErrors.push({
            gDate: `${year}-${gMonth + 1}-${gDay}`,
            error: '返回null'
          });
          continue;
        }

        let hasError = false;
        let errorDetails: string[] = [];

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

        if (Array.isArray(chineseResult.ganzhiDay) && Array.isArray(expectedGanzhiDay)) {
          if (chineseResult.ganzhiDay[0] !== expectedGanzhiDay[0] ||
              chineseResult.ganzhiDay[1] !== expectedGanzhiDay[1]) {
            hasError = true;
            errorDetails.push(`干支日不符: 期望${formatGanzhi(expectedGanzhiDay)}, 实际${formatGanzhi(chineseResult.ganzhiDay)}`);
          }
        }

        if (chineseResult.isFirstMonth !== expectedIsFirstMonth) {
          hasError = true;
          errorDetails.push(`岁首月标记不符: 期望${expectedIsFirstMonth}, 实际${chineseResult.isFirstMonth}`);
        }

        if (hasError) {
          yearStats.g2cFailed++;
          yearStats.g2cErrors.push({
            gDate: `${year}-${gMonth + 1}-${gDay}`,
            jsgDate: formatGregorianDate(gregorianDate),
            expected: formatChineseDate(chineseResult.year, expectedCMonth, expectedCDay, expectedIsLeap) +
              ` ${formatGanzhi(expectedGanzhiDay)} 岁首=${expectedIsFirstMonth}`,
            actual: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap) +
              ` ${formatGanzhi(chineseResult.ganzhiDay)} 岁首=${chineseResult.isFirstMonth}`,
            errors: errorDetails
          });
        } else {
          yearStats.g2cPassed++;
        }

      } catch (e: any) {
        yearStats.g2cFailed++;
        yearStats.g2cErrors.push({
          gDate: `${year}-${gMonth + 1}-${gDay}`,
          error: `异常: ${e.message}`
        });
        continue;
      }

      // ========== 测试2: 农历转公历（反向验证）==========
      if (chineseResult) {
        try {
          // 测试2.1: 使用 jd 参数精确匹配
          const resultWithJd = calendar.getGregorianFromChineseDate(
            chineseResult.year,
            chineseResult.month,
            chineseResult.day,
            chineseResult.isLeap,
            chineseResult.ganzhiMonth as [number, number] | null,
            'default',
            chineseResult.jd
          );

          if (!resultWithJd || Array.isArray(resultWithJd)) {
            yearStats.c2gWithJdFailed++;
            yearStats.c2gWithJdErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '使用jd参数',
              jd: chineseResult.jd,
              error: !resultWithJd ? '返回null' : '应返回单个Date但返回了数组'
            });
          } else if (!isSameDate(resultWithJd, gregorianDate)) {
            yearStats.c2gWithJdFailed++;
            yearStats.c2gWithJdErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '使用jd参数',
              jd: chineseResult.jd,
              expected: formatGregorianDate(gregorianDate),
              actual: formatGregorianDate(resultWithJd)
            });
          } else {
            yearStats.c2gWithJdPassed++;
          }

          // 测试2.2: 不使用 jd 参数
          const resultWithoutJd = calendar.getGregorianFromChineseDate(
            chineseResult.year,
            chineseResult.month,
            chineseResult.day,
            chineseResult.isLeap,
            chineseResult.ganzhiMonth as [number, number] | null,
            'default',
            null
          );

          if (!resultWithoutJd) {
            yearStats.c2gWithoutJdFailed++;
            yearStats.c2gWithoutJdErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '不使用jd参数',
              error: '返回null'
            });
          } else if (!Array.isArray(resultWithoutJd)) {
            yearStats.c2gWithoutJdFailed++;
            yearStats.c2gWithoutJdErrors.push({
              cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
              testType: '不使用jd参数',
              error: '返回值不是数组'
            });
          } else {
            const hasMatch = resultWithoutJd.some(d => isSameDate(d, gregorianDate));
            if (hasMatch) {
              yearStats.c2gWithoutJdPassed++;
            } else {
              yearStats.c2gWithoutJdFailed++;
              yearStats.c2gWithoutJdErrors.push({
                cDate: formatChineseDate(chineseResult.year, chineseResult.month, chineseResult.day, chineseResult.isLeap),
                testType: '不使用jd参数',
                expected: formatGregorianDate(gregorianDate),
                actual: resultWithoutJd.map(d => formatGregorianDate(d)).join(', '),
                count: resultWithoutJd.length
              });
            }
          }

        } catch (e: any) {
          yearStats.c2gWithJdFailed++;
          yearStats.c2gWithJdErrors.push({
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
        console.log(`      详情: ${err.errors?.join('; ')}`);
      }
    });
    if (yearStats.g2cErrors.length > 10) {
      console.log(`    ... 还有 ${yearStats.g2cErrors.length - 10} 条错误`);
    }
  }

  console.log(`\n【2a】农历转公历测试-使用jd (getGregorianFromChineseDate + jd)`);
  console.log(`  总转换: ${yearStats.c2gWithJdPassed + yearStats.c2gWithJdFailed}`);
  console.log(`  通过: ${yearStats.c2gWithJdPassed}`);
  console.log(`  失败: ${yearStats.c2gWithJdFailed}`);

  if (yearStats.c2gWithJdErrors.length > 0) {
    console.log(`\n  失败详情（前10条）:`);
    yearStats.c2gWithJdErrors.slice(0, 10).forEach(err => {
      console.log(`    农历: ${err.cDate}`);
      if (err.error) {
        console.log(`      错误: ${err.error}`);
      } else {
        console.log(`      期望: ${err.expected}`);
        console.log(`      实际: ${err.actual}`);
      }
    });
    if (yearStats.c2gWithJdErrors.length > 10) {
      console.log(`    ... 还有 ${yearStats.c2gWithJdErrors.length - 10} 条错误`);
    }
  }

  console.log(`\n【2b】农历转公历测试-不使用jd (getGregorianFromChineseDate 数组)`);
  console.log(`  总转换: ${yearStats.c2gWithoutJdPassed + yearStats.c2gWithoutJdFailed}`);
  console.log(`  通过: ${yearStats.c2gWithoutJdPassed}`);
  console.log(`  失败: ${yearStats.c2gWithoutJdFailed}`);

  if (yearStats.c2gWithoutJdErrors.length > 0) {
    console.log(`\n  失败详情（前10条）:`);
    yearStats.c2gWithoutJdErrors.slice(0, 10).forEach(err => {
      console.log(`    农历: ${err.cDate}`);
      if (err.error) {
        console.log(`      错误: ${err.error}`);
      } else {
        console.log(`      期望: ${err.expected}`);
        console.log(`      实际: ${err.actual}`);
      }
    });
    if (yearStats.c2gWithoutJdErrors.length > 10) {
      console.log(`    ... 还有 ${yearStats.c2gWithoutJdErrors.length - 10} 条错误`);
    }
  }

  // 更新全局统计
  globalStats.totalYears++;
  globalStats.totalDays += yearStats.totalDays;
  globalStats.g2cPassed += yearStats.g2cPassed;
  globalStats.g2cFailed += yearStats.g2cFailed;
  globalStats.c2gWithJdPassed += yearStats.c2gWithJdPassed;
  globalStats.c2gWithJdFailed += yearStats.c2gWithJdFailed;
  globalStats.c2gWithoutJdPassed += yearStats.c2gWithoutJdPassed;
  globalStats.c2gWithoutJdFailed += yearStats.c2gWithoutJdFailed;

  // 保存详细错误到文件
  const allErrors = [
    ...yearStats.g2cErrors,
    ...yearStats.c2gWithJdErrors,
    ...yearStats.c2gWithoutJdErrors
  ];
  if (allErrors.length > 0) {
    const errorLog = {
      year,
      description: desc,
      g2cErrors: yearStats.g2cErrors,
      c2gWithJdErrors: yearStats.c2gWithJdErrors,
      c2gWithoutJdErrors: yearStats.c2gWithoutJdErrors
    };
    fs.writeFileSync(
      path.join(__dirname, `accuracy-errors-${year}.json`),
      JSON.stringify(errorLog, null, 2),
      'utf8'
    );
  }
}

// ==================== 测试3 & 测试4: getChineseYearStart & getChineseYearMonthInfo ====================

function testYearStartAndMonthInfo() {
  console.log('\n\n' + '='.repeat(80));
  console.log('测试 getChineseYearStart & getChineseYearMonthInfo');
  console.log('='.repeat(80));

  const refFile = path.join(REFERENCE_DIR, 'yearstart-monthinfo.json');
  if (!fs.existsSync(refFile)) {
    console.error('基准数据文件不存在: ' + refFile);
    return;
  }

  const refData: Array<{
    year: number;
    yearStart: { year: number; month: number; day: number } | null;
    monthsInfo: Array<{
      monthNum: number;
      isLeap: boolean;
      month: string;
      date: { year: number; month: number; day: number } | null;
      nDays: number;
      gYear: number;
    }> | null;
    error?: string;
  }> = JSON.parse(fs.readFileSync(refFile, 'utf-8'));

  console.log(`\n共 ${refData.length} 个测试年份\n`);

  for (const ref of refData) {
    if (ref.error) {
      console.log(`  ${ref.year}年: 基准数据生成错误 (${ref.error})`);
      continue;
    }

    // ========== 测试3: getChineseYearStart ==========
    const yearStart = calendar.getChineseYearStart(ref.year);

    if (ref.yearStart === null) {
      if (yearStart === null) {
        globalStats.yearStartPassed++;
        console.log(`  ${ref.year}年 岁首: ✓ (both null)`);
      } else {
        globalStats.yearStartFailed++;
        console.log(`  ${ref.year}年 岁首: ✗ 期望null, 实际${formatGregorianDate(yearStart)}`);
      }
    } else if (yearStart === null) {
      globalStats.yearStartFailed++;
      console.log(`  ${ref.year}年 岁首: ✗ 期望${ref.yearStart.year}-${ref.yearStart.month}-${ref.yearStart.day}, 实际null`);
    } else {
      const expectedDate = makeDate(ref.yearStart.year, ref.yearStart.month - 1, ref.yearStart.day);
      if (isSameDate(yearStart, expectedDate)) {
        globalStats.yearStartPassed++;
        console.log(`  ${ref.year}年 岁首: ✓ ${formatGregorianDate(yearStart)}`);
      } else {
        globalStats.yearStartFailed++;
        console.log(`  ${ref.year}年 岁首: ✗ 期望${formatGregorianDate(expectedDate)}, 实际${formatGregorianDate(yearStart)}`);
      }
    }

    // ========== 测试4: getChineseYearMonthInfo ==========
    const monthsInfo = calendar.getChineseYearMonthInfo(ref.year);

    if (ref.monthsInfo === null) {
      if (monthsInfo === null) {
        globalStats.monthInfoPassed++;
        console.log(`  ${ref.year}年 月份信息: ✓ (both null)`);
      } else {
        globalStats.monthInfoFailed++;
        console.log(`  ${ref.year}年 月份信息: ✗ 期望null, 实际有 ${monthsInfo.length} 个月`);
      }
    } else if (monthsInfo === null) {
      globalStats.monthInfoFailed++;
      console.log(`  ${ref.year}年 月份信息: ✗ 期望有 ${ref.monthsInfo.length} 个月, 实际null`);
    } else {
      let monthErrors: string[] = [];

      if (monthsInfo.length !== ref.monthsInfo.length) {
        monthErrors.push(`月数不符: 期望${ref.monthsInfo.length}, 实际${monthsInfo.length}`);
      }

      const minLen = Math.min(monthsInfo.length, ref.monthsInfo.length);
      for (let i = 0; i < minLen; i++) {
        const actual = monthsInfo[i];
        const expected = ref.monthsInfo[i];

        if (actual.monthNum !== expected.monthNum) {
          monthErrors.push(`第${i + 1}月 monthNum: 期望${expected.monthNum}, 实际${actual.monthNum}`);
        }
        if (actual.isLeap !== expected.isLeap) {
          monthErrors.push(`第${i + 1}月 isLeap: 期望${expected.isLeap}, 实际${actual.isLeap}`);
        }
        if (actual.nDays !== expected.nDays) {
          monthErrors.push(`第${i + 1}月 nDays: 期望${expected.nDays}, 实际${actual.nDays}`);
        }
        if (expected.date && actual.date) {
          const expectedMonthDate = makeDate(expected.date.year, expected.date.month - 1, expected.date.day);
          if (!isSameDate(actual.date, expectedMonthDate)) {
            monthErrors.push(`第${i + 1}月 date: 期望${expected.date.year}-${expected.date.month}-${expected.date.day}, 实际${formatGregorianDate(actual.date)}`);
          }
        }
      }

      if (monthErrors.length === 0) {
        globalStats.monthInfoPassed++;
        console.log(`  ${ref.year}年 月份信息: ✓ (${monthsInfo.length} 个月)`);
      } else {
        globalStats.monthInfoFailed++;
        console.log(`  ${ref.year}年 月份信息: ✗`);
        monthErrors.forEach(e => console.log(`    ${e}`));
      }
    }
  }
}

// ==================== 测试5: exportYear (含 exportMonth) ====================

function testExportYear() {
  console.log('\n\n' + '='.repeat(80));
  console.log('测试 exportYear (含 exportMonth)');
  console.log('='.repeat(80));

  for (const { year, desc } of conversionTestYears) {
    const refFile = path.join(REFERENCE_DIR, `exportYear_${year}.json`);
    if (!fs.existsSync(refFile)) {
      console.log(`  ${year}年: 基准文件不存在，跳过`);
      continue;
    }

    const refData = JSON.parse(fs.readFileSync(refFile, 'utf-8'));

    const jsonOutput = calendar.exportYear(year);
    if (!jsonOutput) {
      globalStats.exportYearFailed++;
      console.log(`  ${year}年 (${desc}): ✗ exportYear 返回 null`);
      continue;
    }

    const newData = JSON.parse(jsonOutput);
    const errors: string[] = [];

    // 比较顶层字段
    if (newData.year !== refData.year) {
      errors.push(`year: 期望${refData.year}, 实际${newData.year}`);
    }

    // 比较 cyears
    if (JSON.stringify(newData.cyears) !== JSON.stringify(refData.cyears)) {
      errors.push(`cyears 不一致: 期望${JSON.stringify(refData.cyears)}, 实际${JSON.stringify(newData.cyears)}`);
    }

    // 比较 cdates
    if (JSON.stringify(newData.cdates) !== JSON.stringify(refData.cdates)) {
      errors.push(`cdates 不一致: 期望${JSON.stringify(refData.cdates)}, 实际${JSON.stringify(newData.cdates)}`);
    }

    // 比较月数
    if (newData.months.length !== refData.months.length) {
      errors.push(`月数: 期望${refData.months.length}, 实际${newData.months.length}`);
    }

    // 逐月比较
    const minMonths = Math.min(newData.months.length, refData.months.length);
    for (let m = 0; m < minMonths; m++) {
      const refMonth = refData.months[m];
      const newMonth = newData.months[m];

      // 比较 chineseMonths
      if (refMonth.chineseMonths.length !== newMonth.chineseMonths.length) {
        errors.push(`${m + 1}月 chineseMonths数: 期望${refMonth.chineseMonths.length}, 实际${newMonth.chineseMonths.length}`);
      } else {
        for (let c = 0; c < refMonth.chineseMonths.length; c++) {
          const rc = refMonth.chineseMonths[c];
          const nc = newMonth.chineseMonths[c];
          if (rc.monthNum !== nc.monthNum) {
            errors.push(`${m + 1}月 chineseMonths[${c}].monthNum: 期望${rc.monthNum}, 实际${nc.monthNum}`);
          }
          if (rc.isLeap !== nc.isLeap) {
            errors.push(`${m + 1}月 chineseMonths[${c}].isLeap: 期望${rc.isLeap}, 实际${nc.isLeap}`);
          }
          if (rc.yearIndex !== nc.yearIndex) {
            errors.push(`${m + 1}月 chineseMonths[${c}].yearIndex: 期望${rc.yearIndex}, 实际${nc.yearIndex}`);
          }
        }
      }

      // 比较天数
      if (refMonth.days.length !== newMonth.days.length) {
        errors.push(`${m + 1}月 天数: 期望${refMonth.days.length}, 实际${newMonth.days.length}`);
      } else {
        for (let d = 0; d < refMonth.days.length; d++) {
          const rd = refMonth.days[d];
          const nd = newMonth.days[d];

          if (rd.day !== nd.day) {
            errors.push(`${m + 1}月${rd.day}日 day: 期望${rd.day}, 实际${nd.day}`);
          }
          if (rd.dayOfWeek !== nd.dayOfWeek) {
            errors.push(`${m + 1}月${rd.day}日 dayOfWeek: 期望${rd.dayOfWeek}, 实际${nd.dayOfWeek}`);
          }

          // chineseDate
          const rcd = rd.chineseDate;
          const ncd = nd.chineseDate;
          if (rcd.monthNum !== ncd.monthNum) {
            errors.push(`${m + 1}月${rd.day}日 monthNum: 期望${rcd.monthNum}, 实际${ncd.monthNum}`);
          }
          if (rcd.day !== ncd.day) {
            errors.push(`${m + 1}月${rd.day}日 cDay: 期望${rcd.day}, 实际${ncd.day}`);
          }
          if (rcd.isFirstMonth !== ncd.isFirstMonth) {
            errors.push(`${m + 1}月${rd.day}日 isFirstMonth: 期望${rcd.isFirstMonth}, 实际${ncd.isFirstMonth}`);
          }
          if (rcd.isMonthStart !== ncd.isMonthStart) {
            errors.push(`${m + 1}月${rd.day}日 isMonthStart: 期望${rcd.isMonthStart}, 实际${ncd.isMonthStart}`);
          }

          // sexagenary day
          if (JSON.stringify(rd.sexagenary.day) !== JSON.stringify(nd.sexagenary.day)) {
            errors.push(`${m + 1}月${rd.day}日 干支日: 期望${formatGanzhi(rd.sexagenary.day)}, 实际${formatGanzhi(nd.sexagenary.day)}`);
          }
          // sexagenary month
          if (JSON.stringify(rd.sexagenary.month) !== JSON.stringify(nd.sexagenary.month)) {
            errors.push(`${m + 1}月${rd.day}日 干支月: 期望${JSON.stringify(rd.sexagenary.month)}, 实际${JSON.stringify(nd.sexagenary.month)}`);
          }
        }
      }

      // 比较月相
      if (refMonth.moonPhases.length !== newMonth.moonPhases.length) {
        errors.push(`${m + 1}月 月相数: 期望${refMonth.moonPhases.length}, 实际${newMonth.moonPhases.length}`);
      } else {
        for (let p = 0; p < refMonth.moonPhases.length; p++) {
          const rp = refMonth.moonPhases[p];
          const np = newMonth.moonPhases[p];
          if (rp.phase !== np.phase || rp.day !== np.day) {
            errors.push(`${m + 1}月 月相[${p}]: 期望phase=${rp.phase},day=${rp.day}, 实际phase=${np.phase},day=${np.day}`);
          }
        }
      }

      // 比较节气
      if (refMonth.solarTerms.length !== newMonth.solarTerms.length) {
        errors.push(`${m + 1}月 节气数: 期望${refMonth.solarTerms.length}, 实际${newMonth.solarTerms.length}`);
      } else {
        for (let s = 0; s < refMonth.solarTerms.length; s++) {
          const rs = refMonth.solarTerms[s];
          const ns = newMonth.solarTerms[s];
          if (rs.id !== ns.id || rs.day !== ns.day) {
            errors.push(`${m + 1}月 节气[${s}]: 期望id=${rs.id},day=${rs.day}, 实际id=${ns.id},day=${ns.day}`);
          }
        }
      }
    }

    if (errors.length === 0) {
      globalStats.exportYearPassed++;
      console.log(`  ${year}年 (${desc}): ✓`);
    } else {
      globalStats.exportYearFailed++;
      console.log(`  ${year}年 (${desc}): ✗ (${errors.length} 处差异)`);
      errors.slice(0, 10).forEach(e => console.log(`    ${e}`));
      if (errors.length > 10) {
        console.log(`    ... 还有 ${errors.length - 10} 处差异`);
      }
    }
  }
}

// ==================== 执行所有测试 ====================

console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║          ccalendar 准确性测试                                                 ║');
console.log('║  基准数据来源: chinesecalendar (旧实现)                                       ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝');

// 测试1 & 测试2: 逐日转换对比
for (const yearConfig of conversionTestYears) {
  testConversionYear(yearConfig);
}

// 测试3 & 测试4: 岁首 & 月份信息
testYearStartAndMonthInfo();

// 测试5: exportYear (含 exportMonth)
testExportYear();

// ==================== 总体统计 ====================

console.log('\n\n' + '═'.repeat(80));
console.log('总体测试统计');
console.log('═'.repeat(80));

console.log(`\n测试年份数: ${globalStats.totalYears}`);
console.log(`测试总天数: ${globalStats.totalDays}`);

console.log(`\n【1】公历转农历 (getChineseDateFromGregorian)`);
console.log(`  通过: ${globalStats.g2cPassed} / ${globalStats.totalDays} (${(globalStats.g2cPassed / globalStats.totalDays * 100).toFixed(2)}%)`);
console.log(`  失败: ${globalStats.g2cFailed}`);

console.log(`\n【2a】农历转公历-使用jd (getGregorianFromChineseDate + jd)`);
const c2gJdTotal = globalStats.c2gWithJdPassed + globalStats.c2gWithJdFailed;
console.log(`  通过: ${globalStats.c2gWithJdPassed} / ${c2gJdTotal} (${c2gJdTotal > 0 ? (globalStats.c2gWithJdPassed / c2gJdTotal * 100).toFixed(2) : '0.00'}%)`);
console.log(`  失败: ${globalStats.c2gWithJdFailed}`);

console.log(`\n【2b】农历转公历-不使用jd (getGregorianFromChineseDate 数组)`);
const c2gNoJdTotal = globalStats.c2gWithoutJdPassed + globalStats.c2gWithoutJdFailed;
console.log(`  通过: ${globalStats.c2gWithoutJdPassed} / ${c2gNoJdTotal} (${c2gNoJdTotal > 0 ? (globalStats.c2gWithoutJdPassed / c2gNoJdTotal * 100).toFixed(2) : '0.00'}%)`);
console.log(`  失败: ${globalStats.c2gWithoutJdFailed}`);

console.log(`\n【3】岁首测试 (getChineseYearStart)`);
const ysTotal = globalStats.yearStartPassed + globalStats.yearStartFailed;
console.log(`  通过: ${globalStats.yearStartPassed} / ${ysTotal}`);
console.log(`  失败: ${globalStats.yearStartFailed}`);

console.log(`\n【4】月份信息测试 (getChineseYearMonthInfo)`);
const miTotal = globalStats.monthInfoPassed + globalStats.monthInfoFailed;
console.log(`  通过: ${globalStats.monthInfoPassed} / ${miTotal}`);
console.log(`  失败: ${globalStats.monthInfoFailed}`);

console.log(`\n【5】exportYear 测试 (含 exportMonth)`);
const eyTotal = globalStats.exportYearPassed + globalStats.exportYearFailed;
console.log(`  通过: ${globalStats.exportYearPassed} / ${eyTotal}`);
console.log(`  失败: ${globalStats.exportYearFailed}`);

console.log('\n' + '═'.repeat(80));
const totalFailed = globalStats.g2cFailed + globalStats.c2gWithJdFailed + globalStats.c2gWithoutJdFailed +
                    globalStats.yearStartFailed + globalStats.monthInfoFailed + globalStats.exportYearFailed;
if (totalFailed === 0) {
  console.log('✓✓✓ 所有测试通过！✓✓✓');
} else {
  console.log(`✗ 共发现 ${totalFailed} 项失败，请查看详细日志`);
}
console.log('═'.repeat(80));
console.log('\n测试完成！');
