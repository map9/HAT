// src/index.js
// 导入功能模块
import { timelineChart } from './timelineChart.js';
import * as timelineChartStyle from './style.js'
import * as westernCalendarAxises from './westernCalendarAxises.js'
import * as chineseCalendarAxises from './chineseCalendarAxises.js'

import { dataProvider } from './dataProvider.js';
import { tooltipHelper } from './tooltipHelper.js';
import { eventChart } from './eventChart.js';

// 导入帝王纪年转换功能
import {
  imperialToGregorian,
  gregorianToImperial,
  parseImperialDate,
  getEraRange,
  findEra
} from './imperialCalendar.js';

// 导出所有功能
export {
  timelineChart,
  westernCalendarAxises,
  chineseCalendarAxises,
  timelineChartStyle,
  eventChart,
  dataProvider,
  tooltipHelper,
  // 帝王纪年转换
  imperialToGregorian,
  gregorianToImperial,
  parseImperialDate,
  getEraRange,
  findEra
};