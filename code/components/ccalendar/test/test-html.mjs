/**
 * 测试 output-html.ts 输出的HTML
 *
 * - 与 chinesecalendar test-html.js 的参考输出进行精确比对（year=575）
 * - 20个有特点的时间点的结构化验证
 */
import { ChineseCalendar, yearDataToHtml } from '../dist/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================
// 参考输出精确比对（year=575）
// ========================
console.log('=== 1. 精确比对测试：575年 北齐 ===\n');

const cc = new ChineseCalendar({ locale: 'zh-Hans' });
const jsonStr = cc.exportYear(575, 'SouthNorth.North.NorthernQi');
const data = JSON.parse(jsonStr);
const html_body = yearDataToHtml(data);
const html =
`<!DOCTYPE html>
<html lang="zh">
  <meta name="keywords" content="農曆, 公曆"><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <head>
  <title>公曆和農曆日期對照(公元前722年&mdash;公元2200年)</title>
  <link rel="stylesheet" href="calendar_chinese_min.css">
  <base href="https://ytliu0.github.io/ChineseCalendar/">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SN0QJRDXXT"></script>
  <script>function gtag() { dataLayer.push(arguments) } window.dataLayer = window.dataLayer || [], gtag("js", new Date), gtag("config", "G-SN0QJRDXXT")</script>
  </head>
  <body>`
  +  html_body +
` </body>
</html>`;

// 写出生成的HTML
const outputPath = path.join(__dirname, 'test-output.html');
fs.writeFileSync(outputPath, html, 'utf-8');

// 参考比对
const refPath = path.join(__dirname, '../../chinesecalendar/test.html');
if (fs.existsSync(refPath)) {
  const refHtml = fs.readFileSync(refPath, 'utf-8');
  const bodyMatch = refHtml.match(/<body>([\s\S]*)<\/body>/);
  if (bodyMatch) {
    const refBody = bodyMatch[1].trim();
    const genBody = html_body.trim();
    if (refBody === genBody) {
      console.log('  OK  575年北齐：HTML输出与参考文件完全一致');
    } else {
      let diffPos = 0;
      for (let i = 0; i < Math.min(refBody.length, genBody.length); i++) {
        if (refBody[i] !== genBody[i]) { diffPos = i; break; }
      }
      console.log(`  FAIL  575年北齐：差异位置 ${diffPos}`);
      console.log('    参考:', JSON.stringify(refBody.substring(diffPos, diffPos + 120)));
      console.log('    生成:', JSON.stringify(genBody.substring(diffPos, diffPos + 120)));
    }
  }
} else {
  console.log('  SKIP  参考文件不存在:', refPath);
}

// ========================
// 20个有特点时间点的结构化验证
// ========================
console.log('\n=== 2. 20个特征时间点结构化验证 ===\n');

/**
 * 20个有特点的时间点：
 *
 *  1. -721  最早支持年（春秋时期，鲁历）
 *  2. -500  战国时期（古六历，周历默认）
 *  3. -220  秦朝开始（颛顼历，以十月为年首）
 *  4. -104  太初历改革过渡年（闰月称"后九月"→普通闰月）
 *  5.    7  逆推儒略历最后一年（westernCalendar='逆推儒略历'）
 *  6.    9  新朝开始（王莽改正朔，以建丑为年首）
 *  7.   24  特殊lunar24模板年（更始元年）
 *  8.  237  魏明帝改正朔（以建丑为年首）
 *  9.  575  北齐（闰月差异警告消息） — 已精确比对
 * 10.  689  武周改正朔（以建子为年首，全年仅11月）
 * 11.  700  武周最后一年（全年15月）
 * 12.  762  唐肃宗改正朔（全年14月）
 * 13. 1582  格里高利历改革（十月跳10天，全年仅355天）
 * 14. 1644  明清更替年
 * 15. 1667  康熙历狱（大统历节气+新法节气双套显示）
 * 16. 1733  DE441后缀最后一年（有历书节气）
 * 17. 1734  无DE441后缀的第一年（无历书节气）
 * 18. 1912  中华民国开始
 * 19. 2024  当代年份
 * 20. 2200  最大支持年（边界测试）
 */

const testCases = [
  {
    year: -721, region: 'default', label: '春秋时期（最早支持年）',
    checks: (d) => [
      ['最早支持年', d.year === -721],
      ['有年份头部', !!d.yearHeaderHtml],
      ['有12个月', d.months.length === 12],
      ['西历=逆推儒略历', d.locale?.westernCalendar === '逆推儒略历'],
      ['DE441标记', d.locale?.de441 === true],
    ]
  },
  {
    year: -500, region: 'default', label: '战国时期（周历默认）',
    checks: (d) => [
      ['有年份头部', !!d.yearHeaderHtml],
      ['有12个月', d.months.length === 12],
      ['西历=逆推儒略历', d.locale?.westernCalendar === '逆推儒略历'],
    ]
  },
  {
    year: -220, region: 'default', label: '秦朝开始（颛顼历）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"颛顼历"', d.additionalInfo?.includes('颛顼历') === true],
      ['西历=逆推儒略历', d.locale?.westernCalendar === '逆推儒略历'],
    ]
  },
  {
    year: -104, region: 'default', label: '太初历改革（过渡年）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"颛顼历"', d.additionalInfo?.includes('颛顼历') === true],
    ]
  },
  {
    year: 7, region: 'default', label: '逆推儒略历最后一年',
    checks: (d) => [
      ['西历=逆推儒略历', d.locale?.westernCalendar === '逆推儒略历'],
    ]
  },
  {
    year: 9, region: 'default', label: '新朝开始（王莽改正朔）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"王莽"', d.additionalInfo?.includes('王莽') === true],
      ['西历=儒略历', d.locale?.westernCalendar === '儒略历'],
    ]
  },
  {
    year: 24, region: 'default', label: '更始元年（special lunar24）',
    checks: (d) => [
      ['年份头部含"更始"', d.yearHeaderHtml?.includes('更始') === true],
    ]
  },
  {
    year: 237, region: 'default', label: '魏明帝改正朔（Wei）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"魏"', d.additionalInfo?.includes('魏') === true],
    ]
  },
  {
    year: 575, region: 'SouthNorth.North.NorthernQi', label: '北齐（闰月差异警告）',
    checks: (d) => [
      ['9月有警告消息', !!d.months[8].warningMessage],
      ['警告含"闰八月"', d.months[8].warningMessage?.includes('闰八月') === true],
      ['有帝王纪年', !!d.eraNames && d.eraNames.some(e => e.includes('北齐'))],
      ['有历书节气', d.months.some(m => m.calendricalSolarTerms && m.calendricalSolarTerms.length > 0)],
    ]
  },
  {
    year: 689, region: 'default', label: '武周改正朔（建子为年首）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"武则天"', d.additionalInfo?.includes('武则天') === true],
    ]
  },
  {
    year: 700, region: 'default', label: '武周最后一年',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
    ]
  },
  {
    year: 762, region: 'default', label: '唐肃宗改正朔',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"唐肃宗"', d.additionalInfo?.includes('唐肃宗') === true],
    ]
  },
  {
    year: 1582, region: 'default', label: '格里高利历改革',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"格里高里"', d.additionalInfo?.includes('格里高里') === true],
      ['西历=儒略历/格里历', d.locale?.westernCalendar === '儒略历/格里历'],
      ['10月天数≤25', d.months[9].days.length <= 25],
    ]
  },
  {
    year: 1644, region: 'default', label: '明清更替',
    checks: (d) => [
      ['有帝王纪年', !!d.eraNames],
      ['纪年含"崇祯"或"顺治"', d.eraNames?.some(e => e.includes('崇祯') || e.includes('顺治')) === true],
      ['西历=儒略历', d.locale?.westernCalendar === '格里历'],
    ]
  },
  {
    year: 1667, region: 'default', label: '康熙历狱（双套节气）',
    checks: (d) => [
      ['有年份历史说明', !!d.additionalInfo],
      ['说明含"康熙"或"大统历"', (d.additionalInfo?.includes('康熙') || d.additionalInfo?.includes('大统历')) === true],
      ['有月含双套历书节气', d.months.some(m => m.calendricalSolarTerms && m.calendricalSolarTerms.length >= 2)],
    ]
  },
  {
    year: 1733, region: 'default', label: 'DE441最后一年（有历书节气）',
    checks: (d) => [
      ['DE441标记=true', d.locale?.de441 === true],
      ['有历书节气', d.months.some(m => m.calendricalSolarTerms && m.calendricalSolarTerms.length > 0)],
    ]
  },
  {
    year: 1734, region: 'default', label: '无DE441后缀（无历书节气）',
    checks: (d) => [
      ['DE441标记=false', d.locale?.de441 === false],
      ['无历书节气', d.months.every(m => !m.calendricalSolarTerms || m.calendricalSolarTerms.length === 0)],
    ]
  },
  {
    year: 1912, region: 'default', label: '中华民国开始',
    checks: (d) => [
      ['有帝王纪年', !!d.eraNames],
      ['西历=格里历', d.locale?.westernCalendar === '格里历'],
    ]
  },
  {
    year: 2024, region: 'default', label: '当代年份',
    checks: (d) => [
      ['有12个月', d.months.length === 12],
      ['每月有days', d.months.every(m => m.days.length > 0)],
      ['每月有moonPhases', d.months.every(m => m.moonPhases.length > 0)],
      ['每月有solarTerms', d.months.every(m => m.solarTerms.length > 0)],
      ['DE441标记=false', d.locale?.de441 === false],
      ['无历书节气', d.months.every(m => !m.calendricalSolarTerms || m.calendricalSolarTerms.length === 0)],
      ['每日有dayText', d.months.every(m => m.days.every(dd => !!dd.chineseDate.dayText))],
      ['每日有dayGanZhi', d.months.every(m => m.days.every(dd => !!dd.sexagenary.dayText))],
    ]
  },
  {
    year: 2200, region: 'default', label: '最大支持年（边界）',
    checks: (d) => [
      ['年份=2200', d.year === 2200],
      ['有12个月', d.months.length === 12],
      ['有年份头部', !!d.yearHeaderHtml],
    ]
  },
];

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  const ccTest = new ChineseCalendar({ locale: 'zh-Hans' });
  const result = ccTest.exportYear(tc.year, tc.region);
  if (result === null) {
    console.log(`  FAIL  [${tc.year}] ${tc.label} — exportYear返回null`);
    failCount++;
    continue;
  }

  const jsonData = JSON.parse(result);

  // 验证JSON→HTML转换不抛错
  let htmlOutput;
  try {
    htmlOutput = yearDataToHtml(jsonData);
  } catch (e) {
    console.log(`  FAIL  [${tc.year}] ${tc.label} — yearDataToHtml抛出异常: ${e.message}`);
    failCount++;
    continue;
  }

  // 验证HTML基本结构
  const htmlChecks = [
    ['HTML非空', htmlOutput.length > 0],
    ['含<table>', htmlOutput.includes('<table>')],
    ['含</table>', htmlOutput.includes('</table>')],
  ];

  // 运行数据检查
  const dataChecks = tc.checks(jsonData);
  const allChecks = [...htmlChecks, ...dataChecks];

  const failed = allChecks.filter(c => !c[1]);
  if (failed.length === 0) {
    console.log(`  OK  [${tc.year}] ${tc.label} (${allChecks.length} checks)`);
    passCount++;
  } else {
    console.log(`  FAIL  [${tc.year}] ${tc.label}`);
    for (const [name] of failed) {
      console.log(`         - ${name}`);
    }
    failCount++;
  }
}

// 输出所有HTML文件到test-output目录
const outputDir = path.join(__dirname, 'test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const tc of testCases) {
  const ccOut = new ChineseCalendar({ locale: 'zh-Hans' });
  const result = ccOut.exportYear(tc.year, tc.region);
  if (!result) continue;
  const jsonData = JSON.parse(result);
  const htmlOut = yearDataToHtml(jsonData);
  const fileName = `year_${tc.year < 0 ? 'neg' + Math.abs(tc.year) : tc.year}.html`;
  const fullHtml =
`<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${tc.label} (${tc.year}年)</title>
  <link rel="stylesheet" href="calendar_chinese_min.css">
  <base href="https://ytliu0.github.io/ChineseCalendar/">
</head>
<body>
${htmlOut}
</body>
</html>`;
  fs.writeFileSync(path.join(outputDir, fileName), fullHtml, 'utf-8');
}

console.log(`\n=== 结果 ===`);
console.log(`通过: ${passCount}  失败: ${failCount}  总计: ${passCount + failCount}`);
console.log(`\nHTML文件已输出到: ${outputDir}/`);

if (failCount > 0) {
  process.exit(1);
}
