/**
 * zh-Hans.ts
 * 简体中文语言包
 * 本文件来源于 https://github.com/ytliu0/ChineseCalendar/ 开源项目中的
 * calendar.js
 * Copyright (C) 2019 ytliu0 <https://github.com/ytliu0>
 * 
 * 重构说明：2026-02 map9 <https://github.com/map9>
 * - 项目重构目的：提高模块之间的松耦合，提升代码可维护性，无核心逻辑变更。
 * - 项目重构内容：将
 *   1. 进一步模块化代码，提高模块之间的松耦合，提升代码可维护性，具体包含:
 *      a. 将农历计算和基于现代天文数据的月相、节气计算分离；
 *      b. 将公历年包含的农历年信息计算和渲染输出分离。
 *   2. 增加了公历与农历之间的转换、农历岁首信息获取、农历年月份信息获取等函数。
 *   3. 支持 Typescript。
 * 
 * - 本文档变更：
 *   1. 将简体中文相关语言包内容分拆到本文件。
 *   2. 支持 Typescript。
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type { LocaleData } from '../types.js';

export const zhHans: LocaleData = {
  monthNames: {
    '0': '1 月', '1': '2 月', '2': '3 月', '3': '4 月',
    '4': '5 月', '5': '6 月', '6': '7 月', '7': '8 月',
    '8': '9 月', '9': '10 月', '10': '11 月', '11': '12 月'
  },
  weeks: {
    '0': '星期日', '1': '星期一', '2': '星期二', '3': '星期三',
    '4': '星期四', '5': '星期五', '6': '星期六'
  },
  heavens: {
    '0': '甲', '1': '乙', '2': '丙', '3': '丁', '4': '戊',
    '5': '己', '6': '庚', '7': '辛', '8': '壬', '9': '癸'
  },
  earths: {
    '0': '子', '1': '丑', '2': '寅', '3': '卯', '4': '辰', '5': '巳',
    '6': '午', '7': '未', '8': '申', '9': '酉', '10': '戌', '11': '亥'
  },
  animals: {
    '0': '鼠', '1': '牛', '2': '虎', '3': '兔', '4': '龙', '5': '蛇',
    '6': '马', '7': '羊', '8': '猴', '9': '鸡', '10': '狗', '11': '猪'
  },
  monthNumbers: {
    '-1': '一', '0': '正', '1': '二', '2': '三', '3': '四', '4': '五',
    '5': '六', '6': '七', '7': '八', '8': '九', '9': '十', '10': '十一', '11': '十二'
  },
  dayNumbers: {
    '0': '初一', '1': '初二', '2': '初三', '3': '初四', '4': '初五',
    '5': '初六', '6': '初七', '7': '初八', '8': '初九', '9': '初十',
    '10': '十一', '11': '十二', '12': '十三', '13': '十四', '14': '十五',
    '15': '十六', '16': '十七', '17': '十八', '18': '十九', '19': '二十',
    '20': '廿一', '21': '廿二', '22': '廿三', '23': '廿四', '24': '廿五',
    '25': '廿六', '26': '廿七', '27': '廿八', '28': '廿九', '29': '三十'
  },
  moonPhases: {
    '0': '朔', '1': '上弦', '2': '望', '3': '下弦'
  },
  monthSizes: {
    '0': '小', '1': '大'
  },
  solarTermNames: {
    '0': '小寒', '1': '大寒', '2': '立春', '3': '雨水', '4': '惊蛰', '5': '春分',
    '6': '清明', '7': '谷雨', '8': '立夏', '9': '小满', '10': '芒种', '11': '夏至',
    '12': '小暑', '13': '大暑', '14': '立秋', '15': '处暑', '16': '白露', '17': '秋分',
    '18': '寒露', '19': '霜降', '20': '立冬', '21': '小雪', '22': '大雪', '23': '冬至',
    '24': '小寒'
  },
  eclipseNames: {
    '0': '日偏食', '1': '日环食', '2': '日全食', '3': '日全环食',
    '4': '半影月食', '5': '月偏食', '6': '月全食'
  },
  leap: {
    'leap': '闰', 'post': '后', 'post 9': '后九'
  },
  westernCalendar: {
    'prolepticJulian': '逆推儒略历',
    'julian': '儒略历',
    'reform': '儒略历/格里历',
    'gregorian': '格里历'
  },
  chineseCalendar: {
    'Huangdi': '黃帝历',
    'Zhuanxu': '颛顼历',
    'Spring.Xia': '夏历',
    'Yin': '殷历',
    'Zhou': '周历',
    'Chunqiu': '春秋历',
    'Lu': '鲁历',
    'Warring.Xia': '夏历',
    "HanZhuanxu": '汉颛顼历',
    "Tki.Wei": '魏',
    "Tki.Shu": '蜀',
    "Tki.Wu": '吳',
    "Jin": '晋',
    "SouthNorth.South.Jin": '东晋',
    "SouthNorth.South.Song": '宋',
    "SouthNorth.South.Qi": '齐',
    "SouthNorth.South.Liang": '梁',
    "SouthNorth.South.Chen": '陈',
    "SouthNorth.North.LaterQin": '后秦',
    "SouthNorth.North.NorthernLiang": '北凉',
    "SouthNorth.North.NorthernWei": '北魏',
    "SouthNorth.North.WesternWei": '西魏',
    "SouthNorth.North.NorthernZhou": '北周',
    "SouthNorth.North.Sui": '隋',
    "SouthNorth.North.EasternWei": '东魏',
    "SouthNorth.North.NorthernQi": '北齐',
    "SongLiaoJinYuan.LaterHan": '后汉',
    "SongLiaoJinYuan.LaterZhou": '后周',
    "SongLiaoJinYuan.Song": '宋',
    "SongLiaoJinYuan.Liao": '辽/契丹',
    "SongLiaoJinYuan.Jin": '金',
    "SongLiaoJinYuan.Mongol": '蒙古',
    "SongLiaoJinYuan.Yuan": '元',
    "Qing.Qing": '清',
    "Qing.SouthernMing": '南明',
    "Qing.Zheng": '明郑'
  },

  yearExpressions: {
    'ce': '{{year}}',
    'bce': '前{{year}}',
    'short': '{{year}}年',
    'short.ganZhi': '{{heaven}}{{earth}}年',
    'normal': '{{year}}（{{shengxiao}}）年',
    'normal.ganZhi': '{{heaven}}{{earth}}（{{shengxiao}}）年',
    'full': '{{year}}（{{heaven}}{{earth}}，{{shengxiao}}）年'
  },
  monthExpressions: {
    'short': '{{month}}月',
    'short.ganZhi': '{{heaven}}{{earth}}月',
    'normal': '{{month}}月{{size}}',
    'normal.ganZhi': '{{heaven}}{{earth}}月{{size}}',
    'full': '{{month}}月{{size}}（建{{heaven}}{{earth}}）',
    'full.noZhong': '{{month}}月{{size}}（无中气）'
  },
  dayExpressions: {
    'short': '{{day}}',
    'short.ganZhi': '{{heaven}}{{earth}}',
    'normal': '{{day}}',
    'normal.ganZhi': '{{heaven}}{{earth}}',
    'full': '{{day}} ({{heaven}}{{earth}})'
  },
  dateExpressions: {
    'normal': '{{month}}{{day}}',
    'full': '{{year}}{{month}}{{day}}'
  },

  pingqi: {
    'pingqi': '平气', 'dingqi': '定气'
  },
  calenderNames: {
    'calendrical': '历书',
    'xinfa': '新法',
    'datong': '大统历',
  },
  mixedExpressions: {
    'moonPhases': '月相{{type}}',
    'solarTerms': '二十四节气{{type}}',
    'calendricalSolarTerms': '{{name}}节气{{type}}',
  },
  yearHtmls: {
    'gregorian': '<h1>公历年（{{gCalendar}}）：{{yearString}}</h1>',
    'lunarSpan0': '<h1>农历年：</h1><h2>{{eraNameString0}}</h2>',
    'lunarSpan1': '<h1>农历年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: {{eraNameString0}},<br/>{{spanMonth0}}{{spanDay0}}日及以后：{{eraNameString1}}</h2>',
    'lunarSpan2': '<h1>农历年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: {{eraNameString0}},<br/>{{spanMonth0}}{{spanDay0}}日至{{spanMonth1}}{{spanDay1Last}}日: {{eraNameString1}},<br/>{{spanMonth1}}{{spanDay1}}日及以后: {{eraNameString2}}</h2>',
    'lunarSpan@24': '<h1>农历年：</h1><h2>{{spanMonth0}}{{spanDay0}}日前: 癸未(羊)汉更始元年,<br/>{{spanMonth0}}{{spanDay0}}日及以后：{{eraNameString1}}</h2>'
  }
};
