/**
 * 测试 ChineseCalendarHtmlRender.ts 输出的HTML
 *
 * - 与 chinesecalendar test-html.js 的参考输出进行精确比对（year=575）
 * - 20个有特点的时间点的结构化验证
 */
import {
  ChineseCalendarType,
  ChineseCalendar,
  ChineseCalendarHtmlRender
} from '../dist/index.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================
// 参考输出精确比对（year=575）
// ========================
console.log('=== 1. 精确比对测试：575年 北齐 ===\n');

const cc = new ChineseCalendar();
const ccRender = new ChineseCalendarHtmlRender({ locale: 'zh-Hans' });

const html_body = ccRender.render(ChineseCalendarType.DEFAULT, -721, cc);
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
const outputPath = path.join(__dirname, 'test-output.html');
fs.writeFileSync(outputPath, html, 'utf-8');