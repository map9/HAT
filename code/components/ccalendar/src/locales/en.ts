/**
 * English Language Pack
 */
import type { LocaleData } from '../types.js';

export const en: LocaleData = {
  monthNames: {
    '0': 'January', '1': 'February', '2': 'March', '3': 'April',
    '4': 'May', '5': 'June', '6': 'July', '7': 'August',
    '8': 'September', '9': 'October', '10': 'November', '11': 'December'
  },
  weeks: {
    '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed',
    '4': 'Thu', '5': 'Fri', '6': 'Sat'
  },
  heavens: {
    '0': 'Jiǎ', '1': 'Yǐ', '2': 'Bǐng', '3': 'Dīng', '4': 'Wù',
    '5': 'Jǐ', '6': 'Gēng', '7': 'Xīn', '8': 'Rén', '9': 'Guǐ'
  },
  earths: {
    '0': 'zǐ', '1': 'chǒu', '2': 'yín', '3': 'mǎo', '4': 'chén', '5': 'sì',
    '6': 'wǔ', '7': 'wèi', '8': 'shēn', '9': 'yǒu', '10': 'xū', '11': 'hài'
  },
  animals: {
    '0': 'Rat', '1': 'Ox', '2': 'Tiger', '3': 'Rabbit', '4': 'Dragon', '5': 'Snake',
    '6': 'Horse', '7': 'Goat', '8': 'Monkey', '9': 'Chicken', '10': 'Dog', '11': 'Pig'
  },
  monthNumbers: {
    '-1': '1', '0': '1', '1': '2', '2': '3', '3': '4', '4': '5',
    '5': '6', '6': '7', '7': '8', '8': '9', '9': '10', '10': '11', '11': '12'
  },
  dayNumbers: {
    '0': '1', '1': '2', '2': '3', '3': '4', '4': '5',
    '5': '6', '6': '7', '7': '8', '8': '9', '9': '10',
    '10': '11', '11': '12', '12': '13', '13': '14', '14': '15',
    '15': '16', '16': '17', '17': '18', '18': '19', '19': '20',
    '20': '21', '21': '22', '22': '23', '23': '24', '24': '25',
    '25': '26', '26': '27', '27': '28', '28': '29', '29': '30'
  },
  moonPhases: {
    '0': 'New Moon', '1': 'First Quarter', '2': 'Full Moon', '3': 'Third Quarter'
  },
  monthSizes: {
    '0': 'S', '1': 'L'
  },
  solarTermNames: {
    '0': 'Minor Cold', '1': 'Major Cold', '2': 'Start of Spring', '3': 'Rain Water',
    '4': 'Awakening of Insects', '5': 'Spring Equinox', '6': 'Clear and Bright', '7': 'Grain Rain',
    '8': 'Start of Summer', '9': 'Grain Buds', '10': 'Grain in Ear', '11': 'Summer Solstice',
    '12': 'Minor Heat', '13': 'Major Heat', '14': 'Start of Autumn', '15': 'End of Heat',
    '16': 'White Dew', '17': 'Autumn Equinox', '18': 'Cold Dew', '19': 'Frost\'s Descent',
    '20': 'Start of Winter', '21': 'Minor Snow', '22': 'Major Snow', '23': 'Winter Solstice',
    '24': 'Minor Cold'
  },
  eclipseNames: {
    '0': 'Partial Solar Eclipse', '1': 'Annular Solar Eclipse', '2': 'Total Solar Eclipse', '3': 'Hybrid Solar Eclipse',
    '4': 'Penumbral Lunar Eclipse', '5': 'Partial Lunar Eclipse', '6': 'Total Lunar Eclipse'
  },
  leap: {
    'leap': 'leap ', 'post': 'post ', 'post9': 'post 9 '
  },
  westernCalendar: {
    'prolepticJulian': '(Proleptic) Julian',
    'julian': 'Julian',
    'reform': 'Julian/Gregorian',
    'gregorian': 'Gregorian'
  },
  chineseCalendar: {
    'Huangdi': 'HuangDi',
    'Zhuanxu': 'ZhuanXu',
    'Spring.Xia': 'Spring.Xia',
    'Yin': 'Yin',
    'Zhou': 'Zhou',
    'Chunqiu': 'ChunQiu',
    'Lu': 'Lu',
    'Warring.Xia': 'Warring.Xia',
    'HanZhuanxu': 'Han.Zhuanxu',
    "Tki.Wei": 'Wei',
    "Tki.Shu": 'Shu',
    "Tki.Wu": 'Wu',
    "Jin": 'Jin',
    "SouthNorth.South.Jin": 'Jin',
    "SouthNorth.South.Song": 'Song',
    "SouthNorth.South.Qi": 'Qi',
    "SouthNorth.South.Liang": 'Liang',
    "SouthNorth.South.Chen": 'Chen',
    "SouthNorth.North.LaterQin": 'LaterQin',
    "SouthNorth.North.NorthernLiang": 'NorthernLiang',
    "SouthNorth.North.NorthernWei": 'NorthernWei',
    "SouthNorth.North.WesternWei": 'WesternWei',
    "SouthNorth.North.NorthernZhou": 'NorthernZhou',
    "SouthNorth.North.Sui": 'Sui',
    "SouthNorth.North.EasternWei": 'EasternWei',
    "SouthNorth.North.NorthernQi": 'NorthernQi',
    "SongLiaoJinYuan.LaterHan": 'LaterHan',
    "SongLiaoJinYuan.LaterZhou": 'LaterZhou',
    "SongLiaoJinYuan.Song": 'Song',
    "SongLiaoJinYuan.Liao": 'Liao',
    "SongLiaoJinYuan.Jin": 'Jin',
    "SongLiaoJinYuan.Mongol": 'Mongol',
    "SongLiaoJinYuan.Yuan": 'Yuan',
    "Qing.Qing": 'Qing',
    "Qing.SouthernMing": 'SouthernMing',
    "Qing.Zheng": 'Zheng'
  },

  yearExpressions: {
    'ce': '{{year}}',
    'bce': '{{year}} BCE',
    'short': '{{year}}',
    'short.ganZhi': '{{heaven}} {{earth}}',
    'normal': '{{year}} ({{shengxiao}})',
    'normal.ganZhi': '{{heaven}} {{earth}} ({{shengxiao}})',
    'full': '{{year}} ({{heaven}} {{earth}}, {{shengxiao}})'
  },
  monthExpressions: {
    'short': '{{month}}',
    'short.ganZhi': '{{heaven}} {{earth}}',
    'normal': 'month {{month}} ({{size}})',
    'normal.ganZhi': '{{heaven}} {{earth}} ({{size}})',
    'full': 'month {{month}} ({{size}}, {{heaven}} {{earth}})',
    'full.noZhong': 'month {{month}} ({{size}}, no zhōng qì)'
  },
  dayExpressions: {
    'short': '{{day}}',
    'short.ganZhi': '{{heaven}} {{earth}}',
    'normal': '{{day}}',
    'normal.ganZhi': '{{heaven}} {{earth}}',
    'full': '{{day}} ({{heaven}} {{earth}})'
  },
  dateExpressions: {
    'normal': '{{month}}-{{day}}',
    'full': '{{year}}-{{month}}-{{day}}'
  },

  pingqi: {
    'pingqi': 'píngqì', 'dingqi': 'dìngqì'
  },
  calenderNames: {
    'calendrical': 'Calendrical',
    'xinfa': 'Xīnfǎ',
    'datong': 'Dàtǒng',
  },
  mixedExpressions: {
    'moonPhases': 'Moon Phases{{type}}',
    'solarTerms': '24 Solar Terms{{type}}',
    'calendricalSolarTerms': '{{name}} solar terms {{type}}',
  },
  yearHtmls: {
    'gregorian': '<h1>{{gCalendar}} Year: {{yearString}}</h1>',
    'lunarSpan0': '<h1>Chinese Year:</h1><h2>{{eraNameString0}}</h2>',
    'lunarSpan1': '<h1>Chinese Year:</h1><h2>{{eraNameString0}} before {{spanMonth0}} {{spanDay0}},<br/>{{eraNameString1}} on and after {{spanMonth0}} {{spanDay0}}</h2>',
    'lunarSpan1@24': '<h1>Chinese Year:</h1><h2>{{eraNameString0}} before {{spanMonth0}} {{spanDay0}},<br/>{{eraNameString1}} on and after {{spanMonth0}} {{spanDay0}}</h2>',
    'lunarSpan2': '<h1>Chinese Year:</h1><h2>{{eraNameString0}} before {{spanMonth0}} {{spanDay0}},<br/>{{eraNameString1}} between {{spanMonth0}} {{spanDay0}} and {{spanMonth1}} {{day1l}},<br/>{{eraNameString2}} on and after {{spanMonth1}} {{spanDay1}}</h2>'
  }
};
