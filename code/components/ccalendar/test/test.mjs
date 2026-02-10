import {
  correctCalendarByYear,
  ChineseCalendar,
  ChineseCalendarHtmlRender,
  makeDate,
  isSameDate,
  calYearData,
  ChineseCalendarType,
  CalendricalSolarTermType
} from '../dist/index.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cc = new ChineseCalendar();

const conversionTestYears = [
  /*
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
   */
  { year: 699,  desc: '武周最后二年，岁首=十一月' },
  { year: 700,  desc: '武周最后一年，岁首=十一月' },
  { year: 701,  desc: '恢复，岁首=正月' },
  /*
  { year: 760,  desc: '安史之乱前' },
  { year: 762,  desc: '唐朝重复月份' },
  { year: 1581, desc: '公历改革前一年' },
  { year: 1582, desc: '公历改革年，10月跳日' },
  { year: 2000, desc: '现代闰年' },
  { year: 2024, desc: '现代' }*/
];

function testCalYearData() {
  console.log('='.repeat(80));
  console.log('dump calDataYear');

  for (const { year, desc } of conversionTestYears) {
    const correctedRegion = correctCalendarByYear(year, ChineseCalendarType.DEFAULT);
    const calVars = calYearData(correctedRegion, year);

    console.log(`Year: ${year}, ${desc}.`);
    console.log(calVars);
  }

  console.log('='.repeat(80));
}

function testExportYear() {
  console.log('='.repeat(80));
  console.log('export ChineseCalendar.exportYear');

  const cc = new ChineseCalendar();
  for (const { year, desc } of conversionTestYears) {
    const correctedRegion = correctCalendarByYear(year, ChineseCalendarType.DEFAULT);
    const yearData = cc.exportYear(correctedRegion, year);

    yearData.cMonths.forEach(cMonth => {
      cMonth.cDays = undefined;
      cMonth.calendricalSolarTermDetails = undefined;
      cMonth.moonPhasesDetails = undefined;
      cMonth.solarTermsDetails = undefined;
      cMonth.solarTermsType = undefined;
    });

    const jsonStr = JSON.stringify(yearData, null, 2);

    console.log(`Year: ${year}, ${desc}.`);
    console.log(jsonStr);
  }

  console.log('='.repeat(80));
}

function testHtmlRender(locale, calendar, year) {
  const ccRender = new ChineseCalendarHtmlRender({locale: locale});
  
  const html_body = ccRender.render(calendar, year, cc);
  const html =
  `<!DOCTYPE html>
  <html lang="zh">
    <meta name="keywords" content="農曆, 公曆"><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
  
    <head>
    <title>公曆和農曆日期對照(公元前722年&mdash;公元2200年)</title>
    <link rel="stylesheet" href="style.css">
    <base href="https://ytliu0.github.io/ChineseCalendar/">
    </head>
    <body>
      <div id="wrapper">
        <div id="calendar">
        ${html_body}
        </div>
      </div>
    </body>
  </html>`;
  
  // 写出生成的HTML
  const outputPath = path.join(__dirname, `render.${year > 0 ? '+' : '-'}${String(Math.abs(year)).padStart(4, '0')}.html`);
  fs.writeFileSync(outputPath, html, 'utf-8');
}

function checkDateConvert(year, month, day) {
  const date = makeDate(year, month, day);
  
  try {
    const chineseDate = cc.getChineseDateFromDate(ChineseCalendarType.ZHOU, date);
    const datec = cc.getDateFromChineseDate(
      ChineseCalendarType.ZHOU,
      chineseDate.cYear,
      chineseDate.cMonth,
      chineseDate.cDay,
      chineseDate.heMonth
    );

    let isMatched = false;
    if (datec) {
      if (Array.isArray(datec)) {
        isMatched = (datec.find(d => isSameDate(d, date) === true) !== undefined) ? true : false;
        console.log('date', date.toLocaleDateString(), 'chineseDate', chineseDate, 'datec', datec, '发现多个匹配！');
      } else {
        isMatched = isSameDate(datec, date);
      }
    }

    if (isMatched === false) {
      console.log('date', date.toLocaleDateString(), 'chineseDate', chineseDate, 'datec', datec, 'is not match, convert test failed!');
    }
  } catch(e) {
    console.log('date', date.toLocaleDateString(), 'is not match, convert test failed!', e);
  }
}

function checkDateConvertByRange(startYear, endYear) {
  for( let year = startYear; year <= endYear; year ++) {
    //console.log(`Year: ${year}`);    
    for(let month = 0; month < 12; month ++) {
      let date = makeDate(year, month + 1, 0);
      const days = date.getDate();
      for(let day = 1; day <= days; day ++) {
        checkDateConvert(year, month + 1, day);
      }
    }
  }
}

function testConvert() {
  console.log('='.repeat(80));
  console.log('TESTING: Convert Date to Chinese Date and convert Chinese Date to Date.');
  console.log('');
  console.log('如果测试采用: ChineseCalendarType.DEFAULT，跨历书时或出现多个匹配，典型的时间有:');
  console.log('-480年 / -479年，春秋历跨越到周历，-000479-01-01 ~ -000479-01-08');
  console.log('-221年 / -220年，周历跨越到颛顼历，-000221-10-29 ~ -000220-03-26');
  console.log('为了避免这种情况，需要明确指定统一的历书，如果统一指定ChineseCalendarType.ZHOU,');
  console.log('则 -721 / -222 不会出现多个匹配的情况.');
  console.log('-'.repeat(80));

  //checkDateConvert(-221, 10, 29);
  checkDateConvertByRange(-721, 2200);
  console.log('='.repeat(80));
}

function checkYearStart(year) {
  try {
    const wDate = cc.getChineseYearStart(ChineseCalendarType.DEFAULT, year)

    if (wDate) {
      const date = makeDate(wDate.year, wDate.month, wDate.day);
      const chineseDate = cc.getChineseDateFromWesternDate(ChineseCalendarType.DEFAULT, wDate);
      if (
        chineseDate.cYear !== year ||
        chineseDate.cDay !== 1 ||
        chineseDate.isFirstMonth !== true
      ) {
        console.log('date', date.toLocaleDateString(), 'chineseDate', chineseDate, 'year', year, 'getYearStart test failed!');
      }
    } else {
      console.log('year', year, 'getYearStart test failed!');
    }
  } catch(e) {
    console.log('year', year, 'getYearStart test failed!', e);
  }
}

function checkYearStartByRange(startYear, endYear) {
  for( let year = startYear; year <= endYear; year ++) {
    //console.log(`Year: ${year}`);
    checkYearStart(year);
  }
}

function testYearStart() {
  console.log('='.repeat(80));
  console.log('TESTING: getChineseYearStart.');

  //checkYearStart(13)
  checkYearStartByRange(-721, 2200)

  console.log('='.repeat(80));
}

function checkYearMonthInfo(year) {
  try {
    const chineseMonthInfos = cc.getChineseYearMonthInfo(ChineseCalendarType.DEFAULT, year)

    if (chineseMonthInfos) {
      for(let i = 0; i < chineseMonthInfos.length; i ++) {
        const monthWDate = chineseMonthInfos[i].date;
        const date = makeDate(monthWDate.year, monthWDate.month, monthWDate.day);
        const chineseDate = cc.getChineseDateFromWesternDate(ChineseCalendarType.DEFAULT, monthWDate);
        if (
          chineseDate.cYear !== year ||
          chineseDate.cDay !== 1 ||
          (i === 0 && chineseDate.isFirstMonth !== true)
        ) {
          console.log('year', year, 'month', chineseMonthInfos[i].cMonth, 'start/date', date.toDateString(), 'start/chineseDate', chineseDate, 'getYearStart test failed!');
        }
      }
    } else {
      console.log('year', year, 'getChineseYearMonthInfo test failed!');
    }
  } catch(e) {
    console.log('year', year, 'getChineseYearMonthInfo test failed!', e);
  }
}

function checkYearMonthInfoByRange(startYear, endYear) {
  for( let year = startYear; year <= endYear; year ++) {
    //console.log(`Year: ${year}`);
    checkYearMonthInfo(year);
  }
}

function testYearMonthInfo() {
  console.log('='.repeat(80));
  console.log('TESTING: getChineseYearMonthInfo.');

  //checkYearStart(13)
  checkYearMonthInfoByRange(-721, 2200)

  console.log('='.repeat(80));
}

//testCalYearData();
//testExportYear();

//testConvert();
//testYearStart();
//testHtmlRender('zh-Hans', ChineseCalendarType.DEFAULT, 10);
testYearMonthInfo();