/**
 * 生成基准数据，供 ccalendar 准确性测试使用
 *
 * 使用旧实现 (chinesecalendar) 的 exportYear、getChineseYearStart、getChineseYearMonthInfo
 * 生成 JSON 基准数据文件，保存到 ccalendar/test/reference/ 目录。
 */

import { ChineseCalendar } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const calendar = new ChineseCalendar({ lng: 'zh-Hant' });

const REFERENCE_DIR = path.resolve(__dirname, '../../ccalendar/test/reference');

// 确保目录存在
if (!fs.existsSync(REFERENCE_DIR)) {
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });
}

// ==================== 测试年份 ====================

// getChineseDateFromGregorian & getGregorianFromChineseDate 全面测试年份
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

// getChineseYearStart & getChineseYearMonthInfo 部分测试年份
const yearInfoTestYears = [
  -500, -300, -104, -103, -102, 1, 100, 500,
  690, 700, 701, 762, 1000, 1582, 1900, 2000, 2024
];

// ==================== 生成 exportYear 基准数据 ====================

console.log('=== 生成 exportYear 基准数据 ===\n');

for (const config of conversionTestYears) {
  const { year, desc } = config;
  console.log(`正在生成 ${year} 年数据 (${desc})...`);

  try {
    const jsonOutput = calendar.exportYear(year, null, 'json');
    const yearData = JSON.parse(jsonOutput);

    const filename = `exportYear_${year}.json`;
    fs.writeFileSync(
      path.join(REFERENCE_DIR, filename),
      JSON.stringify(yearData, null, 2),
      'utf-8'
    );
    console.log(`  已保存: ${filename}`);
  } catch (e) {
    console.error(`  错误: ${e.message}`);
  }
}

// ==================== 生成 getChineseYearStart 和 getChineseYearMonthInfo 基准数据 ====================

console.log('\n=== 生成 getChineseYearStart & getChineseYearMonthInfo 基准数据 ===\n');

function formatDate(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return { year: y, month: m, day: d };
}

const yearInfoData = [];

for (const year of yearInfoTestYears) {
  console.log(`正在生成农历年 ${year} 的 yearStart 和 monthInfo 数据...`);

  try {
    // getChineseYearStart
    const yearStart = calendar.getChineseYearStart(year, 'default');
    const yearStartFormatted = yearStart ? formatDate(yearStart) : null;

    // getChineseYearMonthInfo
    const monthsInfo = calendar.getChineseYearMonthInfo(year, 'default');
    const monthsFormatted = monthsInfo ? monthsInfo.map(m => ({
      monthNum: m.monthNum,
      isLeap: m.isLeap,
      month: m.month,
      date: m.date ? formatDate(m.date) : null,
      nDays: m.nDays,
      gYear: m.gYear
    })) : null;

    yearInfoData.push({
      year,
      yearStart: yearStartFormatted,
      monthsInfo: monthsFormatted
    });

    console.log(`  yearStart: ${yearStartFormatted ? `${yearStartFormatted.year}-${yearStartFormatted.month}-${yearStartFormatted.day}` : 'null'}`);
    if (monthsFormatted) {
      console.log(`  months: ${monthsFormatted.length} 个月`);
    }
  } catch (e) {
    console.error(`  错误: ${e.message}`);
    yearInfoData.push({ year, error: e.message });
  }
}

fs.writeFileSync(
  path.join(REFERENCE_DIR, 'yearstart-monthinfo.json'),
  JSON.stringify(yearInfoData, null, 2),
  'utf-8'
);
console.log('\n已保存: yearstart-monthinfo.json');

console.log('\n=== 基准数据生成完成 ===');
console.log(`共生成 ${conversionTestYears.length} 个 exportYear 文件`);
console.log(`共生成 ${yearInfoTestYears.length} 个年份的 yearStart/monthInfo 数据`);
console.log(`输出目录: ${REFERENCE_DIR}`);
