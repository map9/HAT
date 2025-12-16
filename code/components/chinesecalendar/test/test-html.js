import fs from 'fs';
import { ChineseCalendar } from '../src/index.js';

var html = 
`<!DOCTYPE html>
<html lang="zh">
  <meta name="keywords" content="農曆, 公曆"><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <head>
  <title>公曆和農曆日期對照(公元前722年&mdash;公元2200年)</title>
  <link rel="stylesheet" href="calendar_chinese_min.css">
  <script src="index_c.js"></script>
  <base href="https://ytliu0.github.io/ChineseCalendar/">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SN0QJRDXXT"></script>
  <script>function gtag() { dataLayer.push(arguments) } window.dataLayer = window.dataLayer || [], gtag("js", new Date), gtag("config", "G-SN0QJRDXXT")</script>
  </head>
  <body>`

//html += calendar(2, 264, 'Tki.Wu', 'Lu');
//html += calendar(2, -102, undefined, undefined, 'html');
let cc = new ChineseCalendar({lng: 'zh-Hant'});
html += cc.exportYear(-104, null, 'html');
//html += cc.exportYear(264, 'Tki.Wu', 'html');

html += 
` </body>
</html>`;

var filePath = './test.html';

fs.writeFile(filePath, html, { encoding: 'utf8' }, (err) => {
  if (err) {
      console.error('保存文件时出错:', err);
  } else {
      console.log('文件已成功保存为 UTF-8 格式！');
  }
});

console.log(html);

//html = calendarOut(2, 2020, 'default');
//console.log(html);