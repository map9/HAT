import { correctCalendarByYear, calDataYear } from '../dist/index.js';

const conversionTestYears = [
  { year: 575,  desc: '' },
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

function dumpYearData() {
  console.log('='.repeat(80));
  console.log('dump calDataYear');

  for (const { year, desc } of conversionTestYears) {
    const correctedRegion = correctCalendarByYear(year, null);
    const calVars = calDataYear(year, correctedRegion);

    console.log(`Year: ${year}, ${desc}.`);
    console.log(calVars);
  }

  console.log('='.repeat(80));
}


dumpYearData();